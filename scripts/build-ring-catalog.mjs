import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';

const curl = promisify(execFile);
const assets = new URL('../dist/assets/', import.meta.url);
const load = name => readFile(new URL(name, assets), 'utf8');
const neighbors = 'NO FI EE LV LT PL BY UA GE AZ KZ CN MN KP'.split(' ');
const requested = process.argv.slice(2);
const countries = requested.length ? requested : [...neighbors, 'RU', 'FR', 'DE', 'IT', 'ES', 'GB', 'US', 'CA', 'JP', 'IS', 'AT', 'CH', 'CZ', 'SE', 'PT', 'AU'];
const target = Number(process.env.RINGS_PER_COUNTRY || 40);
const attempts = Number(process.env.RING_ATTEMPTS || target * 10);
const backend = process.env.RING_ROUTER?.replace(/\/$/, '');
if (!backend) throw new Error('Set RING_ROUTER to an OSRM server available for batch routing.');
if (![target, attempts].every(n => Number.isInteger(n) && n > 0) || countries.some(code => !/^[A-Z]{2}$/.test(code))) {
  throw new Error('Provide ISO alpha-2 countries and positive integer limits.');
}

const context = createContext({});
const shared = ['country-shapes.js', 'borders.js', 'heritage.js', 'regional.js', 'visa-data.js', 'loop-gallery.js', 'nearby-drives.js', 'published-routes.js', 'scenic-routes.js', 'tourism-routes.js', 'kazakhstan-routes.js', 'weekend-rings.js'];
runInContext((await Promise.all(shared.map(load))).join('\n'), context);
const { countryAt, domesticPath, sites, iso2, guideStops } = runInContext(
  '({countryAt,domesticPath,sites:[...heritage,...regionalSites],iso2:visaData.iso2,guideStops:[...loopGallery.map(p=>p.slice(0,3)),...publishedDrives.flatMap(g=>g.places.map(p=>p.slice(0,3)))]})', context);
const iso3 = Object.fromEntries(Object.entries(iso2).map(([code, alpha2]) => [alpha2, code]));
const radians = Math.PI / 180;
function km(a, b) {
  const phi = (b[1] - a[1]) * radians / 2;
  const lambda = (b[2] - a[2]) * radians / 2;
  const h = Math.sin(phi) ** 2 + Math.cos(a[1] * radians) * Math.cos(b[1] * radians) * Math.sin(lambda) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, h)));
}

function* candidates(towns, attractions) {
  const starts = towns.filter((p, i) => towns.slice(0, i).every(q => km(p, q) > 18));
  for (let pass = 0; pass < 4; pass++) {
    for (const start of starts) {
      const near = attractions.filter(p => km(start, p) >= 8 && km(start, p) <= 105)
        .sort((a, b) => km(start, a) - km(start, b));
      const first = near.filter(p=>p[0]!==start[0])[pass];
      if (!first) continue;
      const other = [...near,...towns.filter(p=>km(start,p)<=95)].filter(p => p[0] !== first[0] && p[0] !== start[0] && km(start,p) >= 8 && km(first, p) >= 12 &&
        km(start, first) + km(first, p) + km(p, start) < 220);
      if (other[pass]) yield [start, first, other[pass]];
    }
  }
}

function overlap(line) {
  const seen = new Set();
  let length = 0, repeated = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i], key = [a.join(','), b.join(',')].sort().join('/');
    const edgeKm = km([null, a[1], a[0]], [null, b[1], b[0]]);
    length += edgeKm;
    if (seen.has(key)) repeated += edgeKm;
    seen.add(key);
  }
  return length ? repeated / length : 1;
}

async function build(code, points) {
  const coords = points.map(([, lat, lon]) => lon.toFixed(5) + ',' + lat.toFixed(5)).join(';');
  const query = new URLSearchParams({ source: 'first', roundtrip: 'true', overview: 'full',
    geometries: 'geojson', radiuses: '400;750;750' });
  const { stdout } = await curl('curl', ['-sS', '--max-time', '12', '--write-out', '\n%{http_code}',
    backend + '/trip/v1/driving/' + coords + '?' + query], { maxBuffer: 8 * 1024 * 1024 });
  const split = stdout.lastIndexOf('\n'), status = Number(stdout.slice(split + 1));
  if (status === 429 || status >= 500) throw new Error('Router unavailable: ' + status);
  if (status !== 200) return null;
  const { trips, waypoints } = JSON.parse(stdout.slice(0, split));
  if (trips?.length !== 1 || waypoints?.length !== points.length) return null;
  const { distance, duration, geometry } = trips[0];
  const line = geometry?.coordinates;
  if (!line?.length || !Number.isFinite(distance) || !Number.isFinite(duration) ||
    distance > 350000 || duration > 28800 || distance < 20000 || overlap(line) > .25 ||
    line[0].join(',') !== line.at(-1).join(',') || !domesticPath(iso3[code], line)) return null;
  const places = points.map((point, i) => ({ point, index: waypoints[i].waypoint_index }))
    .sort((a, b) => a.index - b.index).map(row => row.point);
  return { name: places[0][0] + ' · ' + places.slice(1).map(p => p[0]).join(' и '),
    country: code, source: 'Подборка Вылазки', url: 'https://www.openstreetmap.org/copyright',
    places: [...places, places[0]], separateStart: true, distanceKm: Math.round(distance / 1000),
    drivingMinutes: Math.round(duration / 60), checkedAt: new Date().toISOString().slice(0, 10) };
}

const output = new URL('batch-rings.js', assets);
const prefix = 'publishedDrives.push(...';
let rows = [];
try { rows = JSON.parse((await readFile(output, 'utf8')).trim().slice(prefix.length, -2)); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const signature = points => points.map(([, y, x]) => y.toFixed(2) + ',' + x.toFixed(2)).sort().join('/');
const seen = new Set(rows.map(row => signature(row.places.slice(0, -1))));
async function save() {
  const tmp = new URL('batch-rings.js.tmp', assets);
  await writeFile(tmp, prefix + JSON.stringify(rows, null, 1) + ');\n');
  await rename(tmp, output);
}
for (const code of countries) {
  let count = rows.filter(r => r.country === code).length, tried = 0;
  const towns = JSON.parse(await load('towns/' + code + '.json'));
  const attractions = [...guideStops.filter(([,lat,lon])=>countryAt(lat,lon)===iso3[code]),...sites.filter(([, , lon, lat, , nation]) =>
    nation === code && countryAt(lat, lon) === iso3[code]).map(([, name, lon, lat]) => [name, lat, lon])];
  for (const points of candidates(towns, attractions)) {
    if (count >= target || tried >= attempts) break;
    const key = signature(points);
    if (seen.has(key)) continue;
    tried++;
    const route = await build(code, points);
    if (!route) continue;
    rows.push(route);
    seen.add(key);
    count++;
    await save();
  }
  console.log(`${code}: ${count}/${target} · проверено новых кандидатов ${tried}`);
}
console.log(`Всего проверенных колец в выгрузке: ${rows.length}; цель: 1000`);
const missing = neighbors.map(code => [code, Math.max(0, 30 - rows.filter(row => row.country === code).length)])
  .filter(([, count]) => count);
if (missing.length) console.log('До минимума по соседним странам: ' + missing.map(([code, count]) => code + ' +' + count).join(', '));
if (rows.length < 1000 || missing.length) process.exitCode = 2;
