import fs from 'node:fs';

const assets = new URL('../dist/assets/', import.meta.url);
const read = file => JSON.parse(fs.readFileSync(new URL(file, assets), 'utf8'));
const roads = ['russia-scenic-roads.json','europe-scenic-roads.json','world-scenic-roads.json'].flatMap(read);
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
for (const [id,name,,,url,km,line] of roads) {
 if (!views[id]?.length) continue;
 const {length,turnDensity}=curvature(line);
 const places=itineraries[id]?.places||[];
 const viewCount=new Set(views[id].filter(([,source,,,distance])=>source&&Number.isFinite(distance)&&distance<=500).map(([,source])=>source)).size;
 const withPhoto=places.filter(([name])=>photos[id]?.[name]?.[0]).length;
 const surface=surfaces[id]||['unknown',null];
 const eligible=places.length>=2&&withPhoto===places.length&&viewCount>0&&length/km>.9&&length/km<1.1&&line.length/km>=3;
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
console.table(Object.values(audit).map(r=>({name:r.name,gold:r.eligible,km:r.km,turns:r.turnDensity,surface:r.surface,balanced:r.scores.balanced,scenic:r.scores.scenic,twisty:r.scores.twisty})));
