'use strict';
const loopView={open:false,area:null,picking:false,cards:[],index:0,approach:null,serial:0};
let lastLoopPoint=null;
const loopDirections=['на север','на северо-восток','на восток','на юго-восток','на юг','на юго-запад','на запад','на северо-запад'];
const xy=p=>[p.lat,p.lon];
// Papua New Guinea settlement centres. GeoNames, CC BY 4.0.
const pngCentres=[["Wewak", -3.54964, 143.63229], ["Wapenamanda", -5.6265, 143.9109], ["Wabag", -5.49119, 143.72151], ["Vanimo", -2.68372, 141.30195], ["Tari", -5.845, 142.94667], ["Port Moresby", -9.47723, 147.15089], ["Porgera", -5.463, 143.148], ["Popondetta", -8.76536, 148.23252], ["Mount Hagen", -5.85746, 144.23058], ["Minj", -5.90752, 144.69159], ["Mendi", -6.14755, 143.65633], ["Madang", -5.22152, 145.78695], ["Lorengau", -2.0341, 147.27173], ["Laiagam", -5.33105, 143.79052], ["Lae", -6.72333, 146.99611], ["Kwikila", -9.81847, 147.65968], ["Kurumul", -5.855, 144.63111], ["Kundiawa", -6.01972, 144.96917], ["Kokopo", -4.3432, 152.26867], ["Kokoda", -8.87778, 147.73642], ["Kimbe", -5.55085, 150.13766], ["Kerema", -7.96028, 145.77278], ["Kavieng", -2.57337, 150.79516], ["Ihu", -7.89569, 145.39405], ["Goroka", -6.085, 145.38667], ["Daru", -9.07786, 143.20893], ["Arawa", -6.22977, 155.56598], ["Angoram Village", -4.0518, 144.0728], ["Alotau", -10.31509, 150.45742], ["Laiagam", -5.48918, 143.49078], ["Buka", -5.43261, 154.67098], ["Rauna", -5.7359, 144.28834]];
const townFiles=new Map();
function driveRadius(){const n=Number(state.driveRadius);return Number.isFinite(n)&&n>=100&&n<=2000?n:200}

const sightTiles=new Map();
async function russianSights(area){
 const cells=[];
 const y=Math.floor(area.lat/4),x=Math.floor(area.lon/4);
 for(let a=y-1;a<=y+1;a++)for(let b=x-1;b<=x+1;b++){
  const id=a+'_'+b;if(!ruStopTiles.has(id))continue;
  if(!sightTiles.has(id))sightTiles.set(id,fetch('assets/ru-stops/'+id+'.json').then(r=>{if(!r.ok)throw Error();return r.json()}).catch(()=>{sightTiles.delete(id);return []}));
  cells.push(sightTiles.get(id));
 }
 return (await Promise.all(cells)).flat().map(p=>({p,km:kmBetween(xy(area),[p[1],p[2]])})).filter(s=>s.km<=driveRadius()).sort((a,b)=>a.km-b.km).slice(0,80).map(s=>s.p);
}
const mappedSights=new Map();
async function worldSights(area){
 const radius=Math.min(180000,driveRadius()*1000);
 const key=[area.lat.toFixed(2),area.lon.toFixed(2),radius].join('/');
 if(mappedSights.has(key))return mappedSights.get(key);
 const around='(around:'+radius+','+area.lat.toFixed(4)+','+area.lon.toFixed(4)+')';
 const query='[out:json][timeout:10];(nwr'+around+'["name"]["tourism"~"^(viewpoint|museum|attraction)$"]["wikidata"];nwr'+around+'["name"]["historic"~"^(castle|archaeological_site|monument)$"]["wikidata"];);out center 450;';
 const request=fetch('https://overpass.kumi.systems/api/interpreter?data='+encodeURIComponent(query),{signal:AbortSignal.timeout(14000)})
  .then(r=>{if(!r.ok)throw Error();return r.json()})
  .then(j=>j.elements.flatMap(e=>{
   const p=e.center||e,name=e.tags?.['name:ru']||e.tags?.name;
   return name&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)?[[name,p.lat,p.lon,'https://www.openstreetmap.org/'+e.type+'/'+e.id,e.tags.tourism||e.tags.historic]]:[];
  })).catch(()=>{mappedSights.delete(key);return []});
 if(mappedSights.size>=20)mappedSights.delete(mappedSights.keys().next().value);
 mappedSights.set(key,request);return request;
}
function nearbyBases(area){
 const towns=atlasCities.slice(0,russianStart).map(([name,,lon,lat])=>[name,lat,lon]);
 const found=[];
 for(const [name,lat,lon] of [...pngCentres,...towns,...(area.extraTowns||[])]){
  if(Math.abs(area.lat-lat)>driveRadius()/110+0.05)continue;
  const km=kmBetween(xy(area),[lat,lon]);
  if(km<1||km>driveRadius()||!allowsStop(area,lat,lon))continue;
  found.push({name,lat,lon,km,town:true});
 }
 return found.sort((a,b)=>a.km-b.km);
}
function candidatesFor(area){
 const candidates=[],origin=xy(area);
 function add(name,lat,lon,photo,credit,town=false,weight=35,kind=""){
  if(Math.abs(lat-area.lat)>driveRadius()/110+0.05)return;
  const km=kmBetween(origin,[lat,lon]);
  if(km<1||km>driveRadius()||!allowsStop(area,lat,lon))return;
  const bearing=Math.atan2((lon-area.lon)*Math.cos(area.lat*Math.PI/180),lat-area.lat);
  candidates.push({name,lat,lon,photo,credit,town,weight,kind,km,sector:(Math.round(bearing*4/Math.PI)+8)%8});
 }
 loopGallery.forEach(row=>add(...row,false,62));
 for(const guide of publishedDrives)for(const [name,lat,lon] of guide.places)
  add(name,lat,lon,null,guide.url,false,85,'Из гида · '+guide.source);
 catalogue.forEach(([id,name,lon,lat,kind,,img,,,original,links])=>{
  const m=placeMedia[id];
  if(!links&&!img&&!m?.[1]&&!['Cultural','Natural','Mixed','Озеро','Гора','Историческое место','Парк','Музей','Монастырь','Заповедник','Водопад','Каньон','Замок','Пещера'].includes(kind))return;
  add(name,lat,lon,img||m?.[1],original?'https://ru.wikipedia.org/wiki/File:'+original.split('/').pop():img?'https://whc.unesco.org/en/list/'+id+'/':m?.[1]?'https://'+m[2]+'.wikipedia.org/wiki/File:'+encodeURIComponent(m[3]):null,false,original?140:links?Math.min(110,40+10*Math.log2(links)):img?100:m?.[1]?65:28,kind);
 });
 russianPlaces.forEach(([n,,x,y],i)=>{const m=placeMedia['p'+i];add(n,y,x,m?.[1],m?.[1]?'https://ru.wikipedia.org/wiki/File:'+encodeURIComponent(m[3]):null)});
 if(candidates.length<8||area.extraTowns)for(const p of area.bases.slice(0,60))add(p.name,p.lat,p.lon,null,null,true,5);
 for(const [name,lat,lon,kind] of area.sights||[])add(name,lat,lon,null,'https://www.geonames.org/',kind.startsWith('PPLA'),kind==='LK'?12:30,({LK:'Озеро',FLLS:'Водопад',MUS:'Музей',MSTY:'Монастырь',PK:'Парк',RESN:'Заповедник'})[kind]);
 for(const [name,lat,lon,url,type] of area.mapped||[])add(name,lat,lon,null,url,false,63,({viewpoint:'Смотровая',museum:'Музей',castle:'Замок',archaeological_site:'Историческое место',monument:'Памятник'})[type]||'Достопримечательность');
 const preference=state.loopPreference;
 const theme=(p)=>preference==='nature'?/озер|озёр|водопад|парк|смотров|заповед|скал|гор|природ|fjord|natural/i.test(p.kind+' '+p.name):preference==='culture'?/музе|храм|замок|монастыр|истор|cultural/i.test(p.kind+' '+p.name):false;
 for(const p of candidates)p.rank=p.weight+(p.photo?8:0)+(theme(p)?32:0)-28*p.km/driveRadius();
 candidates.sort((a,b)=>b.rank-a.rank);
 const unique=[],buckets={};
 for(const p of candidates){
  const key=p.sector+'/'+Math.floor(p.km/driveRadius()*3);
  if((buckets[key]||0)>=7||unique.some(q=>q.name===p.name||kmBetween(xy(p),xy(q))<1.2))continue;
  buckets[key]=(buckets[key]||0)+1;unique.push(p);
 }
 return unique;
}
function makeLoops(area,points,generated=false){
 const cards=[],used=new Map(),signatures=new Set();
 if(!generated)for(const g of publishedDrives){
  if(state.loopAccess&&(g.access||'unknown')!==state.loopAccess)continue;
  const gp=g.places.map(([name,lat,lon,description,photo])=>{
   const known=points.find(p=>kmBetween(xy(p),[lat,lon])<3&&p.photo&&p.name===name);
   return {...known,name,lat,lon,description,photo:photo||known?.photo,credit:photo?g.url:known?.credit};
  });
  if(!gp.every(p=>allowsStop(area,p.lat,p.lon)))continue;
  const approach=kmBetween(xy(area),xy(gp[0]));if(approach>driveRadius())continue;
  const stops=gp.filter(p=>kmBetween(xy(area),xy(p))>1);
  if(g.separateStart?gp.length<2:stops.length<2)continue;
  const ring=kmBetween(xy(gp[0]),xy(gp.at(-1)))<.05;
  if(!ring&&!state.loopLinear)continue;
  const end=stops[stops.length-1]||gp.at(-1),sector=(Math.round(Math.atan2((end.lon-area.lon)*Math.cos(area.lat*Math.PI/180),end.lat-area.lat)*4/Math.PI)+8)%8;
  cards.push({sector,title:g.name,start:g.separateStart||ring?gp[0]:null,stops:g.separateStart||ring?gp.slice(1):stops,line:null,ring,why:g.why,access:g.access,surface:g.surface,source:g.url,publisher:g.source,approach,length:null});
 }
 if(generated&&state.loopAccess&&state.loopAccess!=='unknown')return cards;
 if(!generated)return cards.sort((a,b)=>Number(b.ring)-Number(a.ring)||a.approach-b.approach);
 for(const seed of points){
  if(cards.length>=64)break;
  if((used.get(seed)||0)>=3||cards.filter(c=>c.sector===seed.sector).length>=8)continue;
  if(seed.town&&points.some(p=>!p.town&&p.km<=seed.km*1.4))continue;
  const near=points.filter(p=>p!==seed&&(used.get(p)||0)<5)
   .map(p=>({p,gap:kmBetween(xy(seed),xy(p))}))
   .filter(o=>o.gap>2&&o.gap<Math.max(45,Math.min(driveRadius()*.7,seed.km*.9+35)))
   .sort((a,b)=>(b.p.rank-b.gap*.45)-(a.p.rank-a.gap*.45));
  for(const offset of [0,2,4]){
  if(cards.length>=64||cards.filter(c=>c.sector===seed.sector).length>=8)break;
  const chosen=[];
  for(const {p} of near.slice(offset)){
   if((p.town&&chosen.some(q=>q.town))||chosen.some(q=>kmBetween(xy(p),xy(q))<2))continue;
   chosen.push(p);if(chosen.length===2)break;
  }
  const stops=[seed,...chosen];if(stops.length<2)continue;
  const key=stops.map(p=>p.name).sort().join("|");if(signatures.has(key))continue;signatures.add(key);
  const tour=seq=>[area,...seq,area].slice(1).reduce((s,p,i)=>s+kmBetween(xy(p),xy([area,...seq][i])),0);
  const perms=stops.length===3?[stops,[stops[1],stops[0],stops[2]],[stops[0],stops[2],stops[1]]]:[stops];
  const order=perms.sort((a,b)=>tour(a)-tour(b))[0];
  if(tour(order)>loopBudget()[0])continue;
  if(order.at(-1).km<order[0].km)order.reverse();
  cards.push({sector:seed.sector,title:seed.name.split(' (')[0]+' и '+chosen[0].name,stops:order,line:null,length:null});order.forEach(p=>used.set(p,(used.get(p)||0)+1));
  }
 }
 return cards;
}
// Limits apply to the entire drive, separately from the straight-line search radius.
const loopBudgets={short:[200,5],day:[350,8],weekend:[600,12]};
function loopBudget(){return loopBudgets[state.loopBudget]||loopBudgets.day}
function roadOverlap(line){
 const edges=new Map();let total=0,repeated=0;
 for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i],distance=kmBetween([a[1],a[0]],[b[1],b[0]]);
  if(distance===0)continue;
  const from=a.join(','),to=b.join(','),edge=from<to?from+'/'+to:to+'/'+from;
  total+=distance;
  if(edges.has(edge))repeated+=distance;
  else edges.set(edge,distance);
 }
 return total?repeated/total:1;
}
function validateLoop(path,start,closed,budget,country,crossBorder){
 const [maxKm,maxHours]=budget,line=path.geometry.coordinates;
 if(!Number.isFinite(path.distance)||!Number.isFinite(path.duration)||path.distance>maxKm*1000||path.duration>maxHours*3600)
  throw new Error('Превышен лимит поездки');
 if(!crossBorder&&!domesticPath(country,line))throw new Error('Дорога в выбранных границах не подтверждена');
 if(closed){
  const a=line[0],b=line.at(-1);
  if(kmBetween([a[1],a[0]],xy(start))>2.2||kmBetween([a[1],a[0]],[b[1],b[0]])>.05)throw new Error('Нет подтверждённого возврата к старту');
  if(roadOverlap(line)>.25)throw new Error('Маршрут слишком часто повторяет ту же дорогу');
 }
}
async function osrmPath(points,round=false,radius=2200){
 const type=round?'trip':'route',coords=points.map(p=>p.lon.toFixed(5)+','+p.lat.toFixed(5)).join(';');
 const q='overview=full&geometries=geojson&steps=true&radiuses='+points.map(()=>radius).join(';')+(round?'&source=first&roundtrip=true':'');
 const r=await fetch('https://router.project-osrm.org/'+type+'/v1/driving/'+coords+'?'+q,{signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error();const j=await r.json(),path=round?j.trips?.[0]:j.routes?.[0];if(!path?.geometry?.coordinates?.length||(round&&j.trips.length!==1))throw Error();return {path,waypoints:j.waypoints};
}
function ferrySegments(path){
 return (path?.legs||[]).flatMap(leg=>leg.steps||[]).filter(step=>step.mode==='ferry'&&step.geometry?.coordinates?.length>1).map(step=>step.geometry.coordinates);
}
const hours=seconds=>{const n=Math.max(1,Math.round(seconds/60));return (n>=60?Math.floor(n/60)+' ч ':'')+(n%60?n%60+' мин':'')};
function checkRoadStart(area){
 if(area.roadCheck)return area.roadCheck;
 const coords=area.lon.toFixed(5)+','+area.lat.toFixed(5);
 area.roadCheck=fetch('https://router.project-osrm.org/nearest/v1/driving/'+coords+'?number=1',{signal:AbortSignal.timeout(7000)})
  .then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{
   const road=data.waypoints?.[0],distance=road?.distance;
   if(!road||!Number.isFinite(distance)||!Array.isArray(road.location)||distance<=2200||distance>15000)return;
   const [lon,lat]=road.location;
   if(!Number.isFinite(lat)||!Number.isFinite(lon)||!allowsStop(area,lat,lon))return;
   area.roadStart={lat,lon,distance,name:road.name||'Точка у дороги'};
   if(loopView.open&&loopView.area===area)drawLoopCard();
  }).catch(()=>{});
 return area.roadCheck;
}
async function loadLoop(card){
 if(!card||card.pending||card.done)return;
 card.pending=true;const area=loopView.area;
 const start=card.start||area;
 const budget=loopBudget(),closed=!card.source||card.ring;
 async function checked(stops,optimize){
  const result=await osrmPath([start,...stops],optimize);
  validateLoop(result.path,start,closed,budget,area.country,area.crossBorder);return result;
 }
 try{
  let result;
  try{result=await checked(card.stops,!card.source)}catch(error){
   if(card.source||card.stops.length<3||loopView.area!==area||!loopView.open)throw error;
   const pairs=[card.stops.slice(0,2),[card.stops[0],card.stops[2]],card.stops.slice(1)];
   for(const stops of pairs){
    if(loopView.area!==area||!loopView.open)break;
    try{result=await checked(stops,true);card.stops=stops;break}catch{}
   }
   if(!result)throw error;
  }
  const {path,waypoints}=result;
  if(!card.source)card.stops=card.stops.map((p,i)=>({p,i:waypoints[i+1].waypoint_index})).sort((a,b)=>a.i-b.i).map(v=>v.p);
  card.distanceKm=path.distance/1000;card.durationHours=path.duration/3600;card.line=path.geometry.coordinates;card.ferries=ferrySegments(path);card.length=Math.round(path.distance/1000)+' км · '+hours(path.duration);
 }catch(error){if(!card.source&&loopView.area===area)checkRoadStart(area);card.length=['Превышен лимит поездки','Дорога в выбранных границах не подтверждена','Нет подтверждённого возврата к старту','Маршрут слишком часто повторяет ту же дорогу'].includes(error.message)?error.message:'Дорога не подтверждена';card.rejected=true}
 card.pending=false;card.done=true;
 if(!loopView.open||loopView.area!==area||loopView.cards[loopView.index]!==card)return;
 drawLoopCard();renderPins();paintRoute();if(card.line)loopFrame();
 if(card.line||area.browsed||area.trying)return;
 area.trying=true;
 try{
  for(const next of loopView.cards.filter(c=>c!==card&&!c.done&&!c.pending).slice(0,5)){
   if(!loopView.open||loopView.area!==area||area.browsed)break;
   await loadLoop(next);
   if(!loopView.open||loopView.area!==area||area.browsed)break;
   if(next.line){loopView.index=loopView.cards.indexOf(next);refreshLoopApproach();drawLoopCard();renderPins();paintRoute();loopFrame();break}
  }
 }finally{area.trying=false}
}

function refreshLoopApproach(){loopView.approach=null;approachTo({...loopView.area,...loopView.cards[loopView.index]?.start},++loopView.serial)}
function loopHome(){return cities[state.loopHomeCity]||gps||actualOrigin()}
function flightEstimate(home,area){
 function close(point){return Object.entries(airports).map(([code,[,lon,lat,routes]])=>({code,lat,lon,routes,km:kmBetween(point,[lat,lon])})).filter(p=>p.km<=140).sort((a,b)=>a.km-b.km).slice(0,10)}
 const arrivals=close(xy(area));let best;
 for(const a of close(home))for(const b of arrivals){
  if(!a.routes.includes(b.code)||a.code===b.code)continue;
  const seconds=(2.5+(a.km+b.km)*1.3/60+kmBetween(xy(a),xy(b))/740)*3600;
  if(!best||seconds<best.seconds)best={seconds,from:a.code,to:b.code,label:'Перелёт '+a.code+' → '+b.code+' + авто · ≈ '+hours(seconds)};
 }
 return best;
}
async function approachTo(area,serial){
 const home=loopHome();if(!home||kmBetween(home,xy(area))<2)return;
 const km=kmBetween(home,xy(area)),name=state.loopHomeCity||(gps?'Текущее местоположение':originName());
 const air=km>280?flightEstimate(home,area):null;
 let info={home:name,label:'Считаем подъезд…'};loopView.approach=info;drawLoopCard();
 let road=null;
 try{const {path}=await osrmPath([{lat:home[0],lon:home[1]},area]);if(area.crossBorder||domesticPath(area.country,path.geometry.coordinates))road={seconds:path.duration,label:'На авто · '+Math.round(path.distance/1000)+' км · '+hours(path.duration)}}catch{}
 if(loopView.serial!==serial)return;
 const best=[air,road].filter(Boolean).sort((a,b)=>a.seconds-b.seconds)[0];
 info.label=best?.label||'Маршрут подъезда уточняется';info.air=best&&best===air;if(info.air){info.from=air.from;info.to=air.to}
 info.link=!best?null:info.air?'https://www.google.com/travel/flights?q='+encodeURIComponent(air.label):'https://www.google.com/maps/dir/?api=1&travelmode=driving&origin='+home.slice(0,2).join(',')+'&destination='+xy(area).join(',');
 if(loopView.open)drawLoopCard();
}
const additionalRoutePhotos = [
 [
  "Кольцово",
  54.94204,
  83.19192,
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Koltsovo_2026_%289%29.jpg/960px-Koltsovo_2026_%289%29.jpg",
  "https://commons.wikimedia.org/wiki/File:Koltsovo_2026_%289%29.jpg",
  "К.Артём.1 · CC BY-SA 4.0"
 ],
 [
  "Обь",
  54.98877,
  82.71337,
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/%D0%AD%D0%A02%D0%9A-533%2C_%D0%A0%D0%BE%D1%81%D1%81%D0%B8%D1%8F%2C_%D0%9D%D0%BE%D0%B2%D0%BE%D1%81%D0%B8%D0%B1%D0%B8%D1%80%D1%81%D0%BA%D0%B0%D1%8F_%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C%2C_%D1%81%D1%82%D0%B0%D0%BD%D1%86%D0%B8%D1%8F_%D0%9E%D0%B1%D1%8C_%28Trainpix_196095%29.jpg/960px-%D0%AD%D0%A02%D0%9A-533%2C_%D0%A0%D0%BE%D1%81%D1%81%D0%B8%D1%8F%2C_%D0%9D%D0%BE%D0%B2%D0%BE%D1%81%D0%B8%D0%B1%D0%B8%D1%80%D1%81%D0%BA%D0%B0%D1%8F_%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C%2C_%D1%81%D1%82%D0%B0%D0%BD%D1%86%D0%B8%D1%8F_%D0%9E%D0%B1%D1%8C_%28Trainpix_196095%29.jpg",
  "https://commons.wikimedia.org/wiki/File:%D0%AD%D0%A02%D0%9A-533%2C_%D0%A0%D0%BE%D1%81%D1%81%D0%B8%D1%8F%2C_%D0%9D%D0%BE%D0%B2%D0%BE%D1%81%D0%B8%D0%B1%D0%B8%D1%80%D1%81%D0%BA%D0%B0%D1%8F_%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C%2C_%D1%81%D1%82%D0%B0%D0%BD%D1%86%D0%B8%D1%8F_%D0%9E%D0%B1%D1%8C_%28Trainpix_196095%29.jpg",
  "Maxim Dmitriev · CC BY-SA 4.0"
 ]
];
let routePhotoIndex;
function findRoutePhoto(p){
 if(p.photo)return [p.photo,p.credit,p.photoBy];
 if(!routePhotoIndex){
  routePhotoIndex=new Map();
  const add=(name,lat,lon,url,credit,by)=>{
   if(!url)return;
   const key=name.toLocaleLowerCase().trim().replace(/[’']/g,''),matches=routePhotoIndex.get(key)||[];
   matches.push({lat,lon,url,credit,by});routePhotoIndex.set(key,matches);
  };
  for(const row of additionalRoutePhotos)add(...row);
  for(const row of loopGallery)add(...row);
  for(const [id,name,lon,lat,,,image,,,original] of catalogue){
   const m=placeMedia[id];
   add(name,lat,lon,image||m?.[1],original?'https://ru.wikipedia.org/wiki/File:'+original.split('/').pop():image?'https://whc.unesco.org/en/list/'+id+'/':m?.[1]?'https://'+m[2]+'.wikipedia.org/wiki/File:'+encodeURIComponent(m[3]):null);
  }
 }
 const match=routePhotoIndex.get(p.name.toLocaleLowerCase().trim().replace(/[’']/g,''))?.find(q=>kmBetween(xy(p),xy(q))<2);
 return match?[match.url,match.credit,match.by]:[];
}
function loopPhoto(p,i){
 const [url,credit,by]=findRoutePhoto(p);
 const image=url?'<img loading="lazy" decoding="async" src="'+safe(url)+'" alt="'+safe(p.name)+'">':'';
 return '<figure class="route-photo'+(url?'':' no-photo')+'">'+image+'<figcaption><b>'+(i+1)+'</b>'+safe(p.name)+'</figcaption>'+
 (credit?'<a aria-label="Источник фотографии" href="'+safe(credit)+'" target="_blank" rel="noopener">'+safe(by||'©')+'</a>':'')+'</figure>';
}
function routePhotoStrip(card){
 const photos=card.stops.map((p,i)=>({p,i})).filter(({p})=>findRoutePhoto(p)[0]);
 return photos.length?'<div class="loop-images route-photo-strip" aria-label="Фото остановок">'+photos.map(({p,i})=>loopPhoto(p,i)).join('')+'</div>':'';
}
document.addEventListener('error',e=>{
 if(e.target.matches?.('.route-stop img')){e.target.parentElement.classList.remove('with-photo');e.target.remove();return}
 if(e.target.matches?.('.route-photo img')){e.target.hidden=true;e.target.parentElement.classList.add('no-photo')}
},true);
function loopDrivingDays(c){
 if(!c?.line)return '';
 const days=Math.max(1,Math.ceil(c.durationHours/Number(state.drive||3)),state.driveKm?Math.ceil(c.distanceKm/Number(state.driveKm)):1);
 return '<small class="loop-limit">По твоему лимиту · '+days+' '+(days===1?'день':days%10>=2&&days%10<=4&&!(days%100>=12&&days%100<=14)?'дня':'дней')+'</small>';
}
function drawLoopCard(){
 if(!loopView.open)return;
 const {cards,index,area,approach,picking}=loopView,c=cards[index],box=$('loopDeck');
 box.hidden=picking;if(picking)return;
 if(c&&loopView.details){drawLoopDetails(box,c,area,approach);return}
 const title=area.name||'Выбранная точка';
 box.innerHTML='<div class="loop-bar"><button data-loop="pick" title="Выбрать другую точку прибытия">⚑ '+safe(title)+' ⌄</button><button aria-label="Закрыть роад-трип" data-loop="close">×</button></div>'+
 (c?'<div class="loop-copy"><small>'+(c.source?(c.ring?'Готовое кольцо':'Линейный маршрут'):'Кольцо от старта')+' · '+(index+1)+' / '+cards.length+'</small><h2>'+safe(c.title)+'</h2>'+routePhotoStrip(c)+'<strong>'+safe(c.length||'Считаем по дорогам…')+'</strong>'+(c.ferries?.length?'<small class="ferry-note">Паром · голубой пунктир на карте</small>':'')+''+'</div>':'<div class="loop-copy"><h2>'+ (area.searching?'Ищем остановки рядом…':'В выбранном радиусе нет остановок')+'</h2>'+(!area.searching&&driveRadius()<2000?'<button data-loop="widen">Расширить поиск до '+Math.min(2000,driveRadius()*2)+' км</button>':'<button data-loop="pick">Выбрать другую точку</button>')+'</div>')+
 (c?.rejected&&area.roadStart?'<div class="road-start-option"><p>Выбранная точка находится в '+(area.roadStart.distance/1000).toLocaleString('ru',{maximumFractionDigits:1})+' км от ближайшей дороги в данных маршрутизатора.</p><button class="action" data-loop="road-start">Начать у дороги →</button></div>':'')+
 (c?'<div class="route-navigation" aria-label="Варианты рядом с выбранной точкой"><button data-loop="prev" '+(cards.length<2?'disabled':'')+'>← Назад</button><button data-loop="next" '+(cards.length<2?'disabled':'')+'>Следующий маршрут →</button></div><div class="loop-detail-action"><button data-loop="details" '+(!c.line?'disabled':'')+'>Подробнее</button></div>':'')+
 '<details class="loop-settings"'+(box.querySelector('.loop-settings')?.open?' open':'')+'><summary>Настройки маршрута</summary>'+
 '<label class="radius-control"><span>Радиус поиска от старта</span><output>'+driveRadius()+' км</output><input type="range" id="driveRadius" min="100" max="2000" step="50" value="'+driveRadius()+'"></label>'+
 '<label class="loop-access">Весь маршрут<select id="loopBudget"><option value="short">До 200 км · 5 ч</option><option value="day">До 350 км · 8 ч</option><option value="weekend">До 600 км · 12 ч</option></select></label>'+
 '<div class="loop-border"><label><input type="checkbox" id="loopLinear" '+(state.loopLinear?'checked':'')+'> Показать линейные маршруты</label></div>'+
 '<label class="loop-access">Доступность<select id="loopAccess">'+accessOptions()+'</select></label>'+
 '<div class="loop-wishes" aria-label="Пожелания">'+[['all','Всё'],['nature','Природа'],['culture','Культура']].map(([id,label])=>'<button data-loop="preference" data-value="'+id+'" aria-pressed="'+((state.loopPreference||'all')===id)+'">'+label+'</button>').join('')+'</div>'+
 '<button class="loop-generate" data-loop="generate">'+(area.generated?'К готовым маршрутам':'Собрать свой маршрут')+'</button>'+
 ((!c||c.done&&!c.line)&&area.bases.length?'<div class="loop-bases"><small>Начать ближе к дороге</small>'+area.bases.slice(0,2).map((p,i)=>'<button data-loop="base" data-index="'+i+'">'+safe(p.name)+' · '+Math.round(p.km)+' км ↗</button>').join('')+'</div>':'')+
 '<div class="loop-border"><label><input type="checkbox" id="crossBorder" '+(area.crossBorder?'checked':'')+'> Разрешить пересечение границ</label></div><div class="loop-home"><label>Дом <select id="loopHomeCity" aria-label="Домашняя точка"><option value="">'+safe(actualOrigin()?originName():'Моя точка старта')+'</option>'+Object.keys(cities).map(n=>'<option '+(state.loopHomeCity===n?'selected':'')+'>'+safe(n)+'</option>').join('')+'</select></label>'+(approach?''+(approach.link?'<a target="_blank" rel="noopener" href="'+safe(approach.link)+'">'+safe(approach.label)+' ↗</a>':'<span>'+safe(approach.label)+'</span>'):'')+'</div>'+
 (c?.source?'<a class="loop-source" target="_blank" rel="noopener" href="'+safe(c.source)+'">'+safe(c.publisher)+' ↗</a>':'')+
 (c?.stops.some(p=>p.town||p.credit==='https://www.geonames.org/')?'<a class="loop-source" href="https://www.geonames.org/" target="_blank" rel="noopener">GeoNames · CC BY 4.0</a>':'')+
 '</details>'+
 (itinerary.legs.length?'<button class="loop-saved" data-loop="saved">Мой маршрут ↗</button>':'');
 $('loopAccess').value=state.loopAccess||'';
 $('loopBudget').value=state.loopBudget||'day';
}
function loopFrame(){
 const area=loopView.area,c=loopView.cards[loopView.index];if(!atlas)return;
 if(!c){flyTo(xy(area),7);return}
 const b=new (window.maplibregl?.LngLatBounds||OfflineBounds)();[area,c.start||area,...c.stops].forEach(p=>b.extend([p.lon,p.lat]));
 for(const point of c.line||[])b.extend(point);
 const mobile=innerWidth<680,w=map.clientWidth,h=map.clientHeight;
 atlas.fitBounds(b,{padding:{left:28,right:mobile?28:Math.min(500,w*.43),top:Math.min(150,h*.24),bottom:mobile?Math.min(265,h*.38):55},maxZoom:11,duration:reduced.matches?0:350});
}
function allowsStop(area,lat,lon){return area.crossBorder||Boolean(area.country&&countryAt(lat,lon)===area.country)}
function setLoopArea(lat,lon,name,crossBorder=false,generated=false){
 loopView.area={lat,lon,name,country:countryAt(lat,lon),crossBorder,generated};lastLoopPoint={lat,lon,name};state.loopArea=lastLoopPoint;state.selectedDestination={lat,lon,name};persist();loopView.picking=false;$('pickTip').hidden=true;
 const area=loopView.area;
 area.bases=nearbyBases(area);loopView.serial++;loopView.approach=null;loopView.index=0;loopView.details=false;
 loopView.cards=generated?[]:makeLoops(area,[]);

 function addSuggestions(){
  if(!loopView.open||loopView.area!==area)return;
  const empty=!loopView.cards.length,existing=new Set(loopView.cards.map(c=>c.title));
  for(const c of makeLoops(area,candidatesFor(area),true)){
   if(loopView.cards.length>=80)break;
   if(!existing.has(c.title)){loopView.cards.push(c);existing.add(c.title)}
  }
  if(!empty&&loopView.cards[loopView.index]?.done&&!loopView.cards[loopView.index]?.line&&!area.browsed&&!area.trying){
   const available=loopView.cards.findIndex(c=>!c.done&&!c.pending);
   if(available>=0){loopView.index=available;refreshLoopApproach();loopFrame();renderPins();paintRoute();loadLoop(loopView.cards[available])}
  }
  if(empty&&loopView.cards.length){refreshLoopApproach();loopFrame();renderPins();paintRoute();loadLoop(loopView.cards[0])}
  drawLoopCard();
 }
 const code=visaData.iso2[area.country];
 if(/^[A-Z]{2}$/.test(code)){
  area.searching=true;
  if(!townFiles.has(code))townFiles.set(code,fetch('assets/towns/'+code+'.json').then(r=>{if(!r.ok)throw Error();return r.json()}).catch(()=>{townFiles.delete(code);return []}));
  Promise.all([townFiles.get(code),code==='RU'?russianSights(area):[]]).then(([rows,sights])=>{
   if(!loopView.open||loopView.area!==area)return;
   area.searching=false;area.sights=sights;area.extraTowns=rows;area.bases=nearbyBases(area);addSuggestions();
  });
 }
 if(loopView.cards.length||!area.searching)addSuggestions();
 if(!state.loopAccess&&loopView.cards.length<25&&area.country)worldSights(area).then(rows=>{if(rows.length&&loopView.area===area&&loopView.open){area.mapped=rows;addSuggestions()}});
 drawLoopCard();renderPins();paintRoute();loopFrame();loadLoop(loopView.cards[0]);refreshLoopApproach();
}
function launchLoops(point){
 const center=atlas?.getCenter();
 const selected=point||lastLoopPoint||state.selectedDestination||state.loopArea;
 if(building)leaveTrip();if(picking)finishPick();pickStop=pickStage=false;active=null;routeRequest++;route=[];
 setDrawer(false);closeLandmark();for(const id of ['builder','detail','nearby','portal','pickTip'])$(id).hidden=true;
 loopView.open=true;pickTransport(document.querySelector('#modes [data-mode="car"]'));$('tripBuilder').setAttribute('aria-pressed','true');
 const p=selected||{lat:center?.lat,lon:center?.lng,name:'Центр карты'};if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon)){closeLoops();return}
 setLoopArea(p.lat,p.lon,p.name);
}
function closeLoops(){
 loopView.open=false;loopView.picking=false;loopView.serial++;$('loopDeck').hidden=true;$('pickTip').hidden=true;$('tripBuilder').setAttribute('aria-pressed','false');render();paintRoute();
}
function stepLoop(delta){
 const n=loopView.cards.length;if(n<2)return;loopView.area.browsed=true;loopView.details=false;
 loopView.index=(loopView.index+n+delta)%n;drawLoopCard();renderPins();paintRoute();loopFrame();loadLoop(loopView.cards[loopView.index]);refreshLoopApproach();
}
function saveLoop(){
 const c=loopView.cards[loopView.index];if(!c?.line)return;const area={...loopView.area,...c.start};
 itinerary.legs.push({name:area.name,lat:area.lat,lon:area.lon,arrival:true,domesticLoop:!area.crossBorder,crossBorder:area.crossBorder,roadBudget:loopBudget(),closedRoad:!c.source||c.ring,loopHome:loopHome()?.slice(0,2),approachByCar:!!loopView.approach&&!loopView.approach.air,stops:[...c.stops.map(({name,lat,lon})=>({name,lat,lon})),...(c.source?[]:[{name:area.name,lat:area.lat,lon:area.lon}])]});
 saveAccountItem('road-'+crypto.randomUUID(),{name:c.title,lat:area.lat,lon:area.lon,stops:c.stops.map(({name,lat,lon})=>({name,lat,lon}))});
 selectedLeg=itinerary.legs.length-1;persist();closeLoops();enterTrip();loopFrame();
}
function loopLine(){
 const c=loopView.cards[loopView.index];return c?.line?[c.line]:[];
}
function selectedRoutePin(point,at){
 return point?'<span class="route-anchor" role="img" aria-label="Выбранная точка" title="'+safe(point.name||'Выбранная точка')+'"'+at(point.lat,point.lon)+'><i></i></span>':'';
}
function loopMarkers(at){
 const c=loopView.cards[loopView.index],area=loopView.area;
 const separate=c?.start&&kmBetween(xy(area),xy(c.start))>.05;
 const start=separate?'<span class="drive-stop" title="Старт маршрута"'+at(c.start.lat,c.start.lon)+'>⚑</span>':'';
 const stops=(c?.stops||[]).map((p,i)=>{
  if(kmBetween(xy(p),xy(area))<.05)return '';
  const [photo]=findRoutePhoto(p);
  return '<button class="drive-stop route-stop'+(photo?' with-photo':'')+'" data-route-stop="'+i+'" title="'+safe(p.name)+'" aria-label="'+safe(p.name)+'"'+at(p.lat,p.lon)+'>'+
   (photo?'<img alt="" loading="lazy" src="'+safe(photo)+'">':'')+'<b>'+(i+1)+'</b></button>';
 }).join('');
 return selectedRoutePin(area,at)+start+stops;
}
function initLoops(){
 const deck=$('loopDeck');let touch,dragX=null,wheelAt=0;
 deck.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.target.closest('.loop-images'))dragX=e.clientX});
 deck.addEventListener('pointerup',e=>{if(dragX!==null&&Math.abs(e.clientX-dragX)>45)stepLoop(e.clientX<dragX?1:-1);dragX=null});
 deck.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)||Math.abs(e.deltaX)<8)return;e.preventDefault();const now=Date.now();if(now-wheelAt>400)stepLoop(e.deltaX>0?1:-1);wheelAt=now},{passive:false});
 deck.oninput=e=>{if(e.target.id==='driveRadius')e.target.previousElementSibling.textContent=e.target.value+' км'};
 deck.onchange=e=>{if(e.target.id==='loopBudget'||e.target.id==='loopLinear'){if(e.target.id==='loopBudget')state.loopBudget=e.target.value;else state.loopLinear=e.target.checked;const a=loopView.area;setLoopArea(a.lat,a.lon,a.name,a.crossBorder,a.generated);return}if(e.target.id==='loopAccess'){state.loopAccess=e.target.value;const a=loopView.area;setLoopArea(a.lat,a.lon,a.name,a.crossBorder,false);return}if(e.target.id==='driveRadius'){state.driveRadius=Number(e.target.value);const a=loopView.area;setLoopArea(a.lat,a.lon,a.name,a.crossBorder,a.generated);return}if(e.target.id==='crossBorder'){const a=loopView.area;setLoopArea(a.lat,a.lon,a.name,e.target.checked,a.generated);return}if(e.target.id==='loopHomeCity'){state.loopHomeCity=e.target.value;persist();loopView.approach=null;drawLoopCard();refreshLoopApproach()}};
 deck.addEventListener('touchstart',e=>{touch=e.touches[0]},{passive:true});
 deck.addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],dx=t.clientX-touch.clientX;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(t.clientY-touch.clientY)*1.4)stepLoop(dx<0?1:-1);touch=null},{passive:true});
 deck.onclick=e=>{const action=e.target.closest('button')?.dataset.loop;
 if(action==='prev'||action==='next')stepLoop(action==='next'?1:-1);
 if(action==='details'||action==='back'){loopView.details=action==='details';drawLoopCard();return}
 if(action==='preference'){state.loopPreference=e.target.closest('button').dataset.value;const a=loopView.area;setLoopArea(a.lat,a.lon,a.name,a.crossBorder,state.loopPreference!=='all');return}
 if(action==='generate'){state.loopAccess='';const a=loopView.area;setLoopArea(a.lat,a.lon,a.name,a.crossBorder,!a.generated)}
 if(action==='widen'){const a=loopView.area;state.driveRadius=Math.min(2000,driveRadius()*2);setLoopArea(a.lat,a.lon,a.name,a.crossBorder,a.generated)}
 if(action==='road-start'&&loopView.area.roadStart){const a=loopView.area,p=a.roadStart;setLoopArea(p.lat,p.lon,p.name,a.crossBorder,a.generated);return}
 if(action==='base'){const p=loopView.area.bases[Number(e.target.closest('button').dataset.index)];if(p)setLoopArea(p.lat,p.lon,p.name,loopView.area.crossBorder)}
 if(action==='close')closeLoops();if(action==='save')saveLoop();if(action==='saved'){closeLoops();enterTrip()}
 if(action==='pick'){loopView.picking=true;drawLoopCard();renderPins();$('pickTip').textContent='Поставь точку прибытия · Отмена';$('pickTip').hidden=false}
 };
 deck.onkeydown=e=>{if(loopView.details||e.target.id==='driveRadius'||e.target.tagName==='SELECT')return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();stepLoop(e.key==='ArrowRight'?1:-1)}};
 document.addEventListener('click',e=>{if(loopView.open&&e.target.closest('#explore,#saved,#browseRussia,#location'))closeLoops()},true);
 $('tripBuilder').onclick=()=>{if(!loopView.open)launchLoops()};
}
