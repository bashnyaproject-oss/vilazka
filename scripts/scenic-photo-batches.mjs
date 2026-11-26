import fs from 'node:fs';
import vm from 'node:vm';

const assets = new URL('../dist/assets/', import.meta.url);
const ctx = vm.createContext({});
for (const file of ['nearby-drives','published-routes','scenic-routes','tourism-routes','kazakhstan-routes','weekend-rings','batch-rings','road-geometry']) {
 vm.runInContext(fs.readFileSync(new URL(file+'.js', assets), 'utf8'), ctx);
}
const routes = vm.runInContext(`publishedDrives.flatMap((route,i)=>{
 const key=route.places.map(([,lat,lon])=>lon.toFixed(5)+','+lat.toFixed(5)).join(';');
 const shape=roadGeometry[key];
 return shape?[{id:'route-'+i,name:route.name,line:shape[2]}]:[];
})`,ctx);
const imported = JSON.parse(fs.readFileSync(new URL('world-scenic-roads.json',assets),'utf8'));
routes.push(...imported.map(([id,name,,,,,line])=>({id,name,line})));
const batches = Array.from({length:20},(_,i)=>routes.slice(Math.floor(i*routes.length/20),Math.floor((i+1)*routes.length/20)));
console.log(JSON.stringify(batches));
