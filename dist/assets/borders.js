'use strict';
// Index polygon bounding boxes once. Several islands can share a country code.
const countryCells = new Map();
for (const shape of countryShapes) {
 const [,west,south,east,north] = shape;
 for (let x=Math.floor(west/5); x<=Math.floor(east/5); x++)
  for (let y=Math.floor(south/5); y<=Math.floor(north/5); y++) {
   const key=x+','+y;
   if (!countryCells.has(key)) countryCells.set(key,[]);
   countryCells.get(key).push(shape);
  }
}
function ringContains(ring,x,y) {
 let inside=false;
 for(let i=1;i<ring.length;i++){
  const [a,b]=ring[i-1],[c,d]=ring[i];
  if((b>y)!==(d>y) && x<(c-a)*(y-b)/(d-b)+a) inside=!inside;
 }
 return inside;
}
function countryAt(lat,lon) {
 const shapes=countryCells.get(Math.floor(lon/5)+','+Math.floor(lat/5))||[];
 for(const [code,w,s,e,n,rings] of shapes){
  if(lon<w||lon>e||lat<s||lat>n)continue;
  if(ringContains(rings[0],lon,lat)&&!rings.slice(1).some(r=>ringContains(r,lon,lat)))return code;
 }
 return null;
}
function domesticPath(code,line){
 if(!code||!line?.length)return false;
 const [x,y]=line[0];
 const polygon=(countryCells.get(Math.floor(x/5)+','+Math.floor(y/5))||[]).find(([id,w,s,e,n,r])=>id===code&&x>=w&&x<=e&&y>=s&&y<=n&&ringContains(r[0],x,y)&&!r.slice(1).some(h=>ringContains(h,x,y)));
 if(!polygon)return false;
 // Restrict boundary checks to the road's envelope, including interior holes.
 let w=x,e=x,s=y,n=y;
 for(const [a,b] of line){w=Math.min(w,a);e=Math.max(e,a);s=Math.min(s,b);n=Math.max(n,b)}
 const edges=[];
 for(const ring of polygon[5])for(let i=1;i<ring.length;i++){
  const a=ring[i-1],b=ring[i];
  if(Math.min(a[0],b[0])<=e&&Math.max(a[0],b[0])>=w&&Math.min(a[1],b[1])<=n&&Math.max(a[1],b[1])>=s)edges.push([a,b]);
 }
 const side=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i];
  for(const [c,d] of edges){
   if(Math.max(a[0],b[0])<Math.min(c[0],d[0])||Math.min(a[0],b[0])>Math.max(c[0],d[0])||Math.max(a[1],b[1])<Math.min(c[1],d[1])||Math.min(a[1],b[1])>Math.max(c[1],d[1]))continue;
   if(side(a,b,c)*side(a,b,d)<=0&&side(c,d,a)*side(c,d,b)<=0)return false;
  }
 }
 return true;
}
