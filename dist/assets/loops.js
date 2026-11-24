'use strict';
const loopView={open:false,area:null,picking:false,cards:[],index:0,approach:null,serial:0};
let lastLoopPoint=null;
const loopDirections=['на север','на северо-восток','на восток','на юго-восток','на юг','на юго-запад','на запад','на северо-запад'];
const xy=p=>[p.lat,p.lon];
// Papua New Guinea settlement centres. GeoNames, CC BY 4.0.
const pngCentres=[["Wewak", -3.54964, 143.63229], ["Wapenamanda", -5.6265, 143.9109], ["Wabag", -5.49119, 143.72151], ["Vanimo", -2.68372, 141.30195], ["Tari", -5.845, 142.94667], ["Port Moresby", -9.47723, 147.15089], ["Porgera", -5.463, 143.148], ["Popondetta", -8.76536, 148.23252], ["Mount Hagen", -5.85746, 144.23058], ["Minj", -5.90752, 144.69159], ["Mendi", -6.14755, 143.65633], ["Madang", -5.22152, 145.78695], ["Lorengau", -2.0341, 147.27173], ["Laiagam", -5.33105, 143.79052], ["Lae", -6.72333, 146.99611], ["Kwikila", -9.81847, 147.65968], ["Kurumul", -5.855, 144.63111], ["Kundiawa", -6.01972, 144.96917], ["Kokopo", -4.3432, 152.26867], ["Kokoda", -8.87778, 147.73642], ["Kimbe", -5.55085, 150.13766], ["Kerema", -7.96028, 145.77278], ["Kavieng", -2.57337, 150.79516], ["Ihu", -7.89569, 145.39405], ["Goroka", -6.085, 145.38667], ["Daru", -9.07786, 143.20893], ["Arawa", -6.22977, 155.56598], ["Angoram Village", -4.0518, 144.0728], ["Alotau", -10.31509, 150.45742], ["Laiagam", -5.48918, 143.49078], ["Buka", -5.43261, 154.67098], ["Rauna", -5.7359, 144.28834]];
function nearbyBases(area){
 const towns=atlasCities.slice(0,russianStart).map(([name,,lon,lat])=>[name,lat,lon]);
 const found=[];
 for(const [name,lat,lon] of [...pngCentres,...towns]){
  if(Math.abs(area.lat-lat)>2)continue;
  const km=kmBetween(xy(area),[lat,lon]);
  if(km<1||km>165||!allowsStop(area,lat,lon))continue;
  found.push({name,lat,lon,km,town:true});
 }
 return found.sort((a,b)=>a.km-b.km);
}
function candidatesFor(area){
 const candidates=[],origin=xy(area);
 function add(name,lat,lon,photo,credit,town=false){
  if(Math.abs(lat-area.lat)>2)return;
  const km=kmBetween(origin,[lat,lon]);
  if(km<1||km>165||!allowsStop(area,lat,lon))return;
  const bearing=Math.atan2((lon-area.lon)*Math.cos(area.lat*Math.PI/180),lat-area.lat);
  candidates.push({name,lat,lon,photo,credit,town,km,sector:(Math.round(bearing*4/Math.PI)+8)%8});
 }
 loopGallery.forEach(row=>add(...row));
 catalogue.forEach(([id,name,lon,lat,kind,,img])=>{
  const m=placeMedia[id];
  if(!img&&!m?.[1]&&!['Парк','Музей','Монастырь','Заповедник','Водопад','Каньон','Замок','Пещера'].includes(kind))return;
  add(name,lat,lon,img||m?.[1],img?'https://whc.unesco.org/en/list/'+id+'/':m?.[1]?'https://'+m[2]+'.wikipedia.org/wiki/File:'+encodeURIComponent(m[3]):null);
 });
 russianPlaces.forEach(([n,,x,y],i)=>{const m=placeMedia['p'+i];add(n,y,x,m?.[1],m?.[1]?'https://ru.wikipedia.org/wiki/File:'+encodeURIComponent(m[3]):null)});
 if(candidates.length<5)for(const p of area.bases)add(p.name,p.lat,p.lon,null,null,true);
 const valid=candidates.sort((a,b)=>(a.photo?0:55)+a.km-(b.photo?0:55)-b.km);
 const unique=[];for(const p of valid){if(!unique.some(q=>kmBetween(xy(p),xy(q))<2))unique.push(p);if(unique.length>=100)break}
 return unique;
}
function makeLoops(area,points){
 const cards=[],used=new Set();
 for(const g of publishedDrives){
  const gp=g.places.map(([name,lat,lon])=>{
   const known=points.find(p=>kmBetween(xy(p),[lat,lon])<3&&p.photo);
   return {...known,name,lat,lon};
  });
  if(!gp.every(p=>allowsStop(area,p.lat,p.lon)))continue;
  if(gp.every(p=>kmBetween(xy(area),xy(p))>75))continue;
  const stops=gp.filter(p=>kmBetween(xy(area),xy(p))>1);
  if(stops.length<2)continue;
  const end=stops[stops.length-1],sector=(Math.round(Math.atan2((end.lon-area.lon)*Math.cos(area.lat*Math.PI/180),end.lat-area.lat)*4/Math.PI)+8)%8;
  cards.push({sector,title:g.name,stops,line:null,source:g.url,length:null});
 }
 for(const seed of points){
  if(used.has(seed)||cards.some(c=>c.sector===seed.sector))continue;
  const near=points.filter(p=>p!==seed&&!used.has(p)&&Math.min((p.sector-seed.sector+8)%8,(seed.sector-p.sector+8)%8)<=2)
   .map(p=>({p,gap:kmBetween(xy(seed),xy(p))})).filter(o=>o.gap>3&&o.gap<Math.max(45,seed.km*.95)).sort((a,b)=>a.gap-b.gap);
  const stops=[seed,...near.slice(0,2).map(v=>v.p)];if(stops.length<2)continue;
  const tour=seq=>[area,...seq,area].slice(1).reduce((s,p,i)=>s+kmBetween(xy(p),xy([area,...seq][i])),0);
  const perms=stops.length===3?[stops,[stops[1],stops[0],stops[2]],[stops[0],stops[2],stops[1]]]:[stops];
  const order=perms.sort((a,b)=>tour(a)-tour(b))[0];
  if(order.at(-1).km<order[0].km)order.reverse();
  cards.push({sector:seed.sector,title:seed.name.split(' (')[0],stops:order,line:null,length:null});order.forEach(p=>used.add(p));
 }
 if(!cards.length&&points.length){
  const p=points[0];cards.push({sector:p.sector,title:p.name,stops:[p],outAndBack:true,line:null,length:null});
 }
 return cards;
}
async function osrmPath(points,round=false){
 const type=round?'trip':'route',coords=points.map(p=>p.lon.toFixed(5)+','+p.lat.toFixed(5)).join(';');
 const q='overview=full&geometries=geojson&radiuses='+points.map(()=>2200).join(';')+(round?'&source=first&roundtrip=true':'');
 const r=await fetch('https://router.project-osrm.org/'+type+'/v1/driving/'+coords+'?'+q,{signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error();const j=await r.json(),path=round?j.trips?.[0]:j.routes?.[0];if(!path?.geometry?.coordinates?.length)throw Error();return {path,waypoints:j.waypoints};
}
const hours=seconds=>{const n=Math.max(1,Math.round(seconds/60));return (n>=60?Math.floor(n/60)+' ч ':'')+(n%60?n%60+' мин':'')};
async function loadLoop(card){
 if(!card||card.pending||card.done)return;
 card.pending=true;const area=loopView.area;
 try{const {path,waypoints}=await osrmPath([loopView.area,...card.stops],true);
  if(!area.crossBorder&&!domesticPath(area.country,path.geometry.coordinates))throw Error();
  card.stops=card.stops.map((p,i)=>({p,i:waypoints[i+1].waypoint_index})).sort((a,b)=>a.i-b.i).map(v=>v.p);
  card.line=path.geometry.coordinates;card.length=Math.round(path.distance/1000)+' км · '+hours(path.duration);
 }catch{card.length='Дорога не подтверждена'}
 card.pending=false;card.done=true;if(loopView.open&&loopView.cards[loopView.index]===card){drawLoopCard();renderPins();paintRoute()}
}
function loopHome(){return cities[state.loopHomeCity]||actualOrigin()}
function flightEstimate(home,area){
 function close(point){return Object.entries(airports).map(([code,[,lon,lat,routes]])=>({code,lat,lon,routes,km:kmBetween(point,[lat,lon])})).filter(p=>p.km<=140).sort((a,b)=>a.km-b.km).slice(0,10)}
 const arrivals=close(xy(area));let best;
 for(const a of close(home))for(const b of arrivals){
  if(!a.routes.includes(b.code)||a.code===b.code)continue;
  const seconds=(2.5+(a.km+b.km)*1.3/60+kmBetween(xy(a),xy(b))/740)*3600;
  if(!best||seconds<best.seconds)best={seconds,label:'Перелёт '+a.code+' → '+b.code+' + авто · ≈ '+hours(seconds)};
 }
 return best;
}
async function approachTo(area,serial){
 const home=loopHome();if(!home||kmBetween(home,xy(area))<2)return;
 const km=kmBetween(home,xy(area)),name=state.loopHomeCity||originName();
 const air=km>280?flightEstimate(home,area):null;
 let info={home:name,label:'Считаем подъезд…'};loopView.approach=info;drawLoopCard();
 let road=null;
 try{const {path}=await osrmPath([{lat:home[0],lon:home[1]},area]);if(area.crossBorder||domesticPath(area.country,path.geometry.coordinates))road={seconds:path.duration,label:'На авто · '+Math.round(path.distance/1000)+' км · '+hours(path.duration)}}catch{}
 if(loopView.serial!==serial)return;
 const best=[air,road].filter(Boolean).sort((a,b)=>a.seconds-b.seconds)[0];
 info.label=best?.label||'Маршрут подъезда уточняется';info.air=best&&best===air;
 info.link=!best?null:info.air?'https://www.google.com/travel/flights?q='+encodeURIComponent(air.label):'https://www.google.com/maps/dir/?api=1&travelmode=driving&origin='+home.slice(0,2).join(',')+'&destination='+xy(area).join(',');
 if(loopView.open)drawLoopCard();
}
function loopPhoto(p,i){
 const url=p.photo||aerial(p.lon,p.lat,320);
 return '<figure><img src="'+safe(url)+'" alt="'+safe(p.name)+'" data-aerial="'+safe(aerial(p.lon,p.lat,320))+'"><figcaption><b>'+(i+1)+'</b>'+safe(p.name)+'</figcaption><a aria-label="Источник изображения" title="'+(p.photo?'Источник фотографии':'Спутниковый вид')+'" href="'+safe(p.credit||'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9')+'" target="_blank" rel="noopener">'+(p.photo?'©':'Спутник')+'</a></figure>';
}
function drawLoopCard(){
 if(!loopView.open)return;
 const {cards,index,area,approach,picking}=loopView,c=cards[index],box=$('loopDeck');
 box.hidden=picking;if(picking)return;
 const title=area.name||'Выбранная точка';
 box.innerHTML='<div class="loop-bar"><button data-loop="pick" title="Выбрать другую точку прибытия">⚑ '+safe(title)+' ⌄</button><button aria-label="Закрыть роад-трип" data-loop="close">×</button></div>'+
 (c?'<div class="loop-images">'+c.stops.map(loopPhoto).join('')+'</div><div class="loop-copy"><small>'+(c.outAndBack?'Туда и обратно':c.stops.every(p=>p.town)?'По окрестным городам':'Кольцо')+' '+loopDirections[c.sector]+' · '+(index+1)+' / '+cards.length+'</small><h2>'+safe(c.title)+'</h2><strong>'+safe(c.length||'Считаем по дорогам…')+'</strong></div>':'<div class="loop-copy"><h2>Пока мало остановок рядом</h2><button data-loop="pick">Выбрать другую точку</button></div>')+
 ((!c||c.done&&!c.line)&&area.bases.length?'<div class="loop-bases"><small>Начать ближе к дороге</small>'+area.bases.slice(0,2).map((p,i)=>'<button data-loop="base" data-index="'+i+'">'+safe(p.name)+' · '+Math.round(p.km)+' км ↗</button>').join('')+'</div>':'')+
 '<div class="loop-border"><label><input type="checkbox" id="crossBorder" '+(area.crossBorder?'checked':'')+'> Разрешить пересечение границ</label></div><div class="loop-home"><label>Дом <select id="loopHomeCity" aria-label="Домашняя точка"><option value="">'+safe(actualOrigin()?originName():'Моя точка старта')+'</option>'+Object.keys(cities).map(n=>'<option '+(state.loopHomeCity===n?'selected':'')+'>'+safe(n)+'</option>').join('')+'</select></label>'+(approach?''+(approach.link?'<a target="_blank" rel="noopener" href="'+safe(approach.link)+'">'+safe(approach.label)+' ↗</a>':'<span>'+safe(approach.label)+'</span>'):'')+'</div>'+
 (c?'<div class="loop-actions"><button data-loop="prev" aria-label="Предыдущее кольцо" '+(cards.length<2?'disabled':'')+'>‹</button><button data-loop="save" '+(!c.line?'disabled':'')+'>Выбрать кольцо</button><button data-loop="next" aria-label="Следующее кольцо" '+(cards.length<2?'disabled':'')+'>›</button></div>':'')+
 (c?.stops.some(p=>p.town)&&area.country==='PNG'?'<a class="loop-source" href="https://www.geonames.org/" target="_blank" rel="noopener">GeoNames · CC BY 4.0</a>':'')+
 (itinerary.legs.length?'<button class="loop-saved" data-loop="saved">Мой маршрут ↗</button>':'');
}
function loopFrame(){
 const area=loopView.area,c=loopView.cards[loopView.index];if(!atlas)return;
 if(!c){flyTo(xy(area),7);return}
 const b=new (window.maplibregl?.LngLatBounds||OfflineBounds)();[area,...c.stops].forEach(p=>b.extend([p.lon,p.lat]));
 const mobile=innerWidth<680,w=map.clientWidth,h=map.clientHeight;
 atlas.fitBounds(b,{padding:{left:mobile?28:Math.min(375,w*.42),right:28,top:Math.min(150,h*.24),bottom:mobile?Math.min(265,h*.38):55},maxZoom:11,duration:reduced.matches?0:350});
}
function allowsStop(area,lat,lon){return area.crossBorder||Boolean(area.country&&countryAt(lat,lon)===area.country)}
function setLoopArea(lat,lon,name,crossBorder=false){
 loopView.area={lat,lon,name,country:countryAt(lat,lon),crossBorder};lastLoopPoint={lat,lon,name};state.loopArea=lastLoopPoint;state.selectedDestination={lat,lon,name};persist();loopView.picking=false;$('pickTip').hidden=true;
 loopView.area.bases=nearbyBases(loopView.area);loopView.serial++;loopView.approach=null;loopView.cards=makeLoops(loopView.area,candidatesFor(loopView.area));loopView.index=0;
 drawLoopCard();renderPins();paintRoute();loopFrame();loadLoop(loopView.cards[0]);approachTo(loopView.area,loopView.serial);
}
function launchLoops(point){
 const center=atlas?.getCenter();
 const selected=point||lastLoopPoint||state.selectedDestination||state.loopArea;
 if(building)leaveTrip();if(picking)finishPick();pickStop=pickStage=false;active=null;routeRequest++;route=[];
 setDrawer(false);closeLandmark();for(const id of ['builder','detail','nearby','portal','pickTip'])$(id).hidden=true;
 loopView.open=true;$('tripBuilder').setAttribute('aria-pressed','true');
 const p=selected||{lat:center?.lat,lon:center?.lng,name:'Центр карты'};if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon)){closeLoops();return}
 setLoopArea(p.lat,p.lon,p.name);
}
function closeLoops(){
 loopView.open=false;loopView.picking=false;loopView.serial++;$('loopDeck').hidden=true;$('pickTip').hidden=true;$('tripBuilder').setAttribute('aria-pressed','false');render();paintRoute();
}
function stepLoop(delta){
 const n=loopView.cards.length;if(n<2)return;
 loopView.index=(loopView.index+n+delta)%n;drawLoopCard();renderPins();paintRoute();loopFrame();loadLoop(loopView.cards[loopView.index]);
}
function saveLoop(){
 const area=loopView.area,c=loopView.cards[loopView.index];if(!c?.line)return;
 itinerary.legs.push({name:area.name,lat:area.lat,lon:area.lon,arrival:true,domesticLoop:!area.crossBorder,crossBorder:area.crossBorder,loopHome:loopHome()?.slice(0,2),approachByCar:!!loopView.approach&&!loopView.approach.air,stops:[...c.stops.map(({name,lat,lon})=>({name,lat,lon})),{...area}]});
 selectedLeg=itinerary.legs.length-1;persist();closeLoops();enterTrip();loopFrame();
}
function loopLine(){
 const c=loopView.cards[loopView.index];return c?.line?[c.line]:[];
}
function loopMarkers(at){
 const c=loopView.cards[loopView.index];return [loopView.area,...(c?.stops||[])].map((p,i)=>'<span class="drive-stop" title="'+safe(p.name)+'"'+at(p.lat,p.lon)+'>'+(i||'⚑')+'</span>').join('');
}
function initLoops(){
 const deck=$('loopDeck');let touch,dragX=null,wheelAt=0;
 deck.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.target.closest('.loop-images'))dragX=e.clientX});
 deck.addEventListener('pointerup',e=>{if(dragX!==null&&Math.abs(e.clientX-dragX)>45)stepLoop(e.clientX<dragX?1:-1);dragX=null});
 deck.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)||Math.abs(e.deltaX)<8)return;e.preventDefault();const now=Date.now();if(now-wheelAt>400)stepLoop(e.deltaX>0?1:-1);wheelAt=now},{passive:false});
 deck.onchange=e=>{if(e.target.id==='crossBorder'){const a=loopView.area;setLoopArea(a.lat,a.lon,a.name,e.target.checked);return}if(e.target.id==='loopHomeCity'){state.loopHomeCity=e.target.value;persist();loopView.approach=null;drawLoopCard();approachTo(loopView.area,++loopView.serial)}};
 deck.addEventListener('touchstart',e=>{touch=e.touches[0]},{passive:true});
 deck.addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],dx=t.clientX-touch.clientX;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(t.clientY-touch.clientY)*1.4)stepLoop(dx<0?1:-1);touch=null},{passive:true});
 deck.onclick=e=>{const action=e.target.closest('button')?.dataset.loop;
 if(action==='prev'||action==='next')stepLoop(action==='next'?1:-1);
 if(action==='base'){const p=loopView.area.bases[Number(e.target.closest('button').dataset.index)];if(p)setLoopArea(p.lat,p.lon,p.name,loopView.area.crossBorder)}
 if(action==='close')closeLoops();if(action==='save')saveLoop();if(action==='saved'){closeLoops();enterTrip()}
 if(action==='pick'){loopView.picking=true;drawLoopCard();renderPins();$('pickTip').textContent='Поставь точку прибытия · Отмена';$('pickTip').hidden=false}
 };
 deck.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();stepLoop(e.key==='ArrowRight'?1:-1)}};
 document.addEventListener('click',e=>{if(loopView.open&&e.target.closest('#explore,#saved,#browseRussia,#location'))closeLoops()},true);
 $('tripBuilder').onclick=()=>{if(!loopView.open)launchLoops()};
}
