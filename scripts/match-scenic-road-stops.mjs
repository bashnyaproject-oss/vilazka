import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../dist/assets/',import.meta.url);
const read = name => fs.readFileSync(new URL(name,root),'utf8');
const places = Array.from(vm.runInNewContext(read('world-places.js')+'\nworldPlaces'),place=>
 [...place.slice(0,6),'https://www.wikidata.org/wiki/'+place[0],'audiala']);
if(process.argv[2] && process.argv[2] !== '-'){
 for(const {id,geometry,properties} of JSON.parse(fs.readFileSync(process.argv[2],'utf8')).features){
  const {POINAME:name,POITYPE:type,UNITCODE:unit}=properties;
  if(!name||!geometry?.coordinates)continue;
  const label=type==='Visitor Center'?'Визит-центр':type==='Waterfall'?'Водопад':'Смотровая площадка';
  const source='https://mapservices.nps.gov/arcgis/rest/services/NationalDatasets/NPS_Public_POIs_Geographic/FeatureServer/0/query?objectIds='+encodeURIComponent(id)+'&outFields=POINAME%2CPOITYPE%2CUNITNAME&f=pjson';
  places.push(['nps:'+id,name===type&&unit?name+' · '+unit:name,...geometry.coordinates,label,'US',source,'nps']);
 }
}
if (process.argv[3] && process.argv[3] !== '-') {
 const sites = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
 const activities = new Set(['Viewing Scenery', 'Viewing Wildlife', 'Interpretive Areas', 'Visitor Centers', 'Trailhead', 'Picnicking', 'Beachcombing', 'Day Hiking']);
 for (const { geometry, properties } of sites) {
  const { recareaname: name, recareaid: id, markeractivity: activity, openstatus: status } = properties;
  if (!name || !id || !geometry?.coordinates || !activities.has(activity) || !['open', 'none'].includes(status)) continue;
  const source = 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RecreationOpportunities_01/MapServer/0/query?where=recareaid%3D'+encodeURIComponent(id)+'&outFields=recareaname%2Cmarkeractivity%2Copenstatus&f=pjson';
  places.push(['usfs:'+id, name, ...geometry.coordinates, activity, 'US', source, 'usfs']);
 }
}
if (process.argv[4] && process.argv[4] !== '-') {
 const { features } = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'));
 for (const { geometry, properties } of features) {
  const { NAME: name, OBJECTID: id, WEBSITE_LINK: source } = properties;
  if (!name || !id || !source || !geometry?.coordinates) continue;
  places.push(['nms:'+id, name.replace(/, County [^,]+$/i, ''), ...geometry.coordinates, 'Исторический памятник', 'IE', source, 'nms']);
 }
}
if (process.argv[5]) {
 const landmarks = JSON.parse(fs.readFileSync(process.argv[5], 'utf8'));
 for (const [id, name, lon, lat, category] of landmarks) {
  if (!/^\d+$/.test(id) || !name || /\(historical\)/i.test(name) || !['Водопад', 'Пляж'].includes(category)) continue;
  const source = 'https://edits.nationalmap.gov/apps/gaz-domestic/public/search/names/'+id;
  places.push(['gnis:'+id, name, lon, lat, category, 'US', source, 'gnis']);
 }
}
const roads = ['russia','europe','world'].flatMap(region=>JSON.parse(read(region+'-scenic-roads.json')));
const countries = JSON.parse(read('road-countries.json'));
const itineraries = JSON.parse(read('road-itineraries.json'));
const categories = new Set(['Археология','Дворец','Крепость','Водопад','Маяк','Собор','Замок','Сад','Храм','Парк','Монастырь','Озеро','Пещера','Ботанический сад','Пляж','Мемориал']);
const grid = new Map();
const cell = .1;
const radius = .65;
const key = (x,y) => x+':'+y;
for(const place of places){
 const [id,,lon,lat,category,,,provider] = place;
 if((provider==='audiala'&&(!/^Q\d+$/.test(id)||!categories.has(category)))||!Number.isFinite(lon)||!Number.isFinite(lat))continue;
 const k=key(Math.floor(lon/cell),Math.floor(lat/cell));
 if(!grid.has(k))grid.set(k,[]);
 grid.get(k).push(place);
}

function match(line,country){
 const matches=new Map();
 let travelled=0;
 for(let i=1;i<line.length;i++){
  const [x,y]=line[i-1],[lon,lat]=line[i];
  const sx=111.32*Math.cos((lat+y)*Math.PI/360),sy=111.32;
  const vx=(lon-x)*sx,vy=(lat-y)*sy,length=Math.hypot(vx,vy);
  if(!length)continue;
  // Long straight gaps in a simplified source line are unreliable.
  if(length<=8){
   const xr=radius/sx,yr=radius/sy;
   for(let gx=Math.floor((Math.min(x,lon)-xr)/cell);gx<=Math.floor((Math.max(x,lon)+xr)/cell);gx++){
    for(let gy=Math.floor((Math.min(y,lat)-yr)/cell);gy<=Math.floor((Math.max(y,lat)+yr)/cell);gy++){
     for(const p of grid.get(key(gx,gy))||[]){
      const [id,,px,py,,code]=p;
      if(country!==code)continue;
      const dx=(px-x)*sx,dy=(py-y)*sy;
      const t=Math.max(0,Math.min(1,(dx*vx+dy*vy)/(length*length)));
      const offset=Math.hypot(dx-t*vx,dy-t*vy);
      if(offset>(p[7]==='gnis' ? .2 : radius)||offset>=(matches.get(id)?.offset??Infinity))continue;
      matches.set(id,{p,offset,at:travelled+t*length});
     }
    }
   }
  }
  travelled+=length;
 }
 const candidates=[...matches.values()].filter(p=>p.at>.25&&p.at<travelled-.25).sort((a,b)=>a.offset-b.offset);
 const chosen=[];
 for(const hit of candidates){
  if(chosen.some(p=>Math.abs(p.at-hit.at)<Math.min(3,travelled/5)||p.p[1]===hit.p[1]))continue;
  chosen.push(hit);
  if(chosen.length===6)break;
 }
 return chosen.sort((a,b)=>a.at-b.at);
}
const pSource = source => source.startsWith('https://edits.nationalmap.gov/');
let updated=0,stops=0;
const updatedCountries=new Set();
for(const [id,,,,source,,line] of roads){
 if(itineraries[id]||!countries[id]||!source||!Array.isArray(line)||line.length<2)continue;
 const found=match(line,countries[id]);
 if(!found.length)continue;
 const [x,y]=line[0],[lon,lat]=line.at(-1);
 itineraries[id]={source,stopSources:[...new Set(found.map(({p})=>p[7]))],places:[
  ['Начало участка',y,x],
  ...found.map(({p:[,name,px,py,category,,placeSource],offset})=>[name,py,px,category+(pSource(placeSource)?' · ориентир, проверь доступ к месту':'')+' · ≈ '+Math.round(offset*1000)+' м от линии дороги по прямой',null,placeSource]),
  ['Конец участка',lat,lon]
 ]};
 updated++;
 stops+=found.length;
 updatedCountries.add(countries[id]);
}
if(updated)fs.writeFileSync(new URL('road-itineraries.json',root),JSON.stringify(itineraries)+'\n');
console.log(JSON.stringify({updated,stops,countries:[...updatedCountries].sort()}));
