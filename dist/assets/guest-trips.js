'use strict';
const guestTripKey='vilazka.guestTrips';
function guestTrips(){
 try{const trips=JSON.parse(localStorage.getItem(guestTripKey));return Array.isArray(trips)?trips:[]}catch{return []}
}
function rememberDrivenRoad(name,points){
 const stops=points.map(p=>Array.isArray(p)?{lat:p[0],lon:p[1]}:p)
  .filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon))
  .map(p=>({name:p.name||'',lat:p.lat,lon:p.lon}));
 if(stops.length<2)return false;
 const signature=stops.map(p=>p.lat.toFixed(5)+','+p.lon.toFixed(5)).join(';');
 const trips=guestTrips(),prior=trips.find(t=>t.signature===signature);
 const item={name,signature,stops,id:prior?.id||crypto.randomUUID(),startedAt:Date.now()};
 try{localStorage.setItem(guestTripKey,JSON.stringify([item,...trips.filter(t=>t.id!==item.id)]));return true}catch{return false}
}
