import fs from 'node:fs';
import vm from 'node:vm';

const assets = new URL('../dist/assets/', import.meta.url);
const read = file => JSON.parse(fs.readFileSync(new URL(file, assets), 'utf8'));
const roadFiles = ['russia-scenic-roads.json','europe-scenic-roads.json','world-scenic-roads.json'];
const roads = roadFiles.flatMap(read);
const context = vm.createContext({});
const scripts = ['nearby-drives','published-routes','scenic-routes','tourism-routes','kazakhstan-routes','weekend-rings','batch-rings','road-geometry'];
for(const script of scripts){
 const file = new URL(script+'.js',assets);
 vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file.pathname,timeout:3000});
}
const {publishedDrives,roadGeometry} = vm.runInContext('({publishedDrives,roadGeometry})',context);
const baseStops = new Map();
for(const [index,drive] of publishedDrives.entries()){
 const key = drive.places.map(([,lat,lon])=>lon.toFixed(5)+','+lat.toFixed(5)).join(';');
 const geometry = roadGeometry[key];
 if(!geometry) continue;
 const id='route-'+index;
 baseStops.set(id,drive.places);
 roads.push([id,drive.name,null,drive.source,drive.url,geometry[0],geometry[2]]);
}
const countries = read('road-countries.json');
const itineraries = read('road-itineraries.json');
const views = read('road-photos/road-views.json');
const photos = read('road-photos/stops.json');
const surfaces = {
 'drive-ru-dzhily-su': ['easy', 'https://kavkaz.travel/touristRoutes/47']
};

const rad = Math.PI / 180;
function vector([x,y],[lon,lat]) {
 return [(lon-x)*111.32*Math.cos((lat+y)*rad/2),(lat-y)*111.32];
}
function curvature(points) {
 const step = .15;
 const sampled = [points[0]];
 let length = 0;
 let next = step;
 for (let i=1;i<points.length;i++) {
  const a=points[i-1],b=points[i],segment=Math.hypot(...vector(a,b));
  if (!segment) continue;
  while(next<=length+segment) {
   const t=(next-length)/segment;
   sampled.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);
   next+=step;
  }
  length+=segment;
 }
 let turns=0;
 for(let i=1;i<sampled.length-1;i++){
  const [x,y]=vector(sampled[i-1],sampled[i]),[u,v]=vector(sampled[i],sampled[i+1]);
  const angle=Math.abs(Math.atan2(x*v-y*u,x*u+y*v)/rad);
  if(angle>=7)turns+=Math.min(angle,120);
 }
 return {length,turnDensity:turns/length};
}
const score = (values,weights) => Math.round(values.reduce((sum,value,i)=>sum+value*weights[i],0));
const audit = {};
const report = new Map();
const csv = value => '"'+String(value??'').replaceAll('"','""')+'"';
const columns = ['id','name','country','source','km','geometry_points','length_difference_pct','turn_degrees_per_km','stops','stops_with_photos','roadside_photos','surface','golden','missing'];
let repeatedIds = 0;
for (const [id,name,,,url,km,line] of roads) {
 if(report.has(id)){repeatedIds++;continue}
 const validLine=Number.isFinite(km)&&km>0&&Array.isArray(line)&&line.length>=2&&line.every(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90);
 const {length,turnDensity}=validLine?curvature(line):{length:0,turnDensity:NaN};
 const places=itineraries[id]?.places||baseStops.get(id)||[];
 const viewCount=new Set((views[id]||[]).filter(([,source,,,distance])=>source&&Number.isFinite(distance)&&distance<=500).map(([,source])=>source)).size;
 const withPhoto=places.filter(([name])=>photos[id]?.[name]?.[0]).length;
 const surface=surfaces[id]||['unknown',null];
 const validLength=length/km>.9&&length/km<1.1;
 const detailed=validLine&&validLength&&line.length/km>=3;
 const stopPhotos=places.length>=2&&withPhoto===places.length;
 const eligible=stopPhotos&&viewCount>0&&detailed;
 const missing=[];
 if(!validLine)missing.push('valid_geometry');
 else if(!validLength)missing.push('length_match');
 else if(!detailed)missing.push('detailed_geometry');
 if(places.length<2)missing.push('itinerary');
 else if(!stopPhotos)missing.push('stop_photos');
 if(!viewCount)missing.push('roadside_photos');
 if(surface[0]==='unknown')missing.push('surface');
 const source=itineraries[id]?.source||url;
 report.set(id,{missing,detailed,eligible,cells:[id,name,countries[id],source,km,line?.length,
  validLine?Math.round((length/km-1)*1000)/10:null,detailed?Math.round(turnDensity):null,places.length,withPhoto,viewCount,surface[0],Number(eligible),missing.join('|')]});
 if(!eligible) continue;
 // Landscape evidence is a photo proxy until elevation and land cover are available.
 const scenery=Math.min(1,.65+.175*Math.max(0,viewCount-1));
 const bends=Math.min(1,turnDensity/100);
 const stops=Math.min(1,Math.max(0,withPhoto-2)/3);
 // Unknown surface receives a neutral value without implying the road is paved.
 const inputs=[scenery,bends,surface[0]==='easy'?1:.5,stops];
 audit[id]={name,eligible,km,points:line.length,turnDensity:Math.round(turnDensity),viewCount,withPhoto,stops:places.length,surface:surface[0],surfaceSource:surface[1],source:itineraries[id]?.source||url,
  scores:{balanced:score(inputs,[50,35,10,5]),scenic:score(inputs,[70,15,10,5]),twisty:score(inputs,[20,65,10,5])}};
}
fs.writeFileSync(new URL('golden-road-audit.js',assets),'const goldenRoadAudit = '+JSON.stringify(audit,null,2)+';\n');
const records=[...report.values()];
fs.writeFileSync(new URL('../research/scenic-road-quality-audit.csv',import.meta.url),[columns,...records.map(r=>r.cells)].map(row=>row.map(csv).join(',')).join('\n')+'\n');
const missingCounts={};
for(const record of records)for(const field of record.missing)missingCounts[field]=(missingCounts[field]||0)+1;
console.log(JSON.stringify({catalog:roads.length,uniqueRoutes:report.size,repeatedIds,
 countries:new Set(records.map(r=>r.cells[2]).filter(Boolean)).size,
 detailedGeometry:records.filter(r=>r.detailed).length,
 golden:Object.keys(audit).length,missing:missingCounts},null,2));
