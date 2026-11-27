// Coordinates are waypoints, not a surveyed road trace. OSRM supplies the driving geometry.
const armeniaDayTrips='https://armenia.travel/articles/cant-miss-attractions-within-an-hour-of-yerevan/';
const publishedDrives=[
 {name:'Гарни и Гегард',why:'Храм Гарни и монастырь в ущелье реки Азат.',source:'Armenia Travel',url:armeniaDayTrips,places:[['Храм Гарни',40.1124,44.7301],['Монастырь Гегард',40.1404,44.8185]]},
 {name:'Звартноц и Эчмиадзин',why:'Две остановки к западу от Еревана.',source:'Armenia Travel',url:armeniaDayTrips,places:[['Звартноц',40.1597,44.3365],['Эчмиадзинский собор',40.1615,44.2910]]},
 {name:'По правому берегу Волги',why:'Через Тутаев к Рыбинску. Выйди к Волге в обоих городах.',source:'Мои дороги',url:'https://moyidorogi.com/trassa-r151-marshrut-yaroslavl-rybinsk/',places:[['Ярославль',57.62987,39.87368],['Тутаев',57.87292,39.52969],['Рыбинск',58.04562,38.83811]]},
 {name:'К озёрам Русского Севера',why:'Из Вологды к Сиверскому озеру в Кириллове и монастырю в Ферапонтове.',source:'Турпортал Вологодской области',url:'https://travel-vologda.ru/news/avtomarshrutyi-po-vologodchine-poyavilis-na-naczionalnom-turisticheskom-portale-puteshestvuemrf',places:[['Вологда',59.2239,39.88398],['Кириллов',59.86299,38.38128],['Ферапонтово',59.95425,38.56745]]},
 {name:'Серпантин над Аурландс-фьордом',why:'Подъём из Аурланда к смотровой площадке Стегастейн. Перед выездом проверь состояние дороги.',source:'Norwegian Scenic Routes',url:'https://www.nasjonaleturistveger.no/en/routes/aurlandsfjellet/',places:[['Аурланд',60.910982,7.191303],['Стегастейн',60.9089,7.2126]]}
];
const driveShelf={key:'',options:[],index:0,current:null};
function driveOptions(origin){
 const km=p=>kmBetween(origin,p.slice(1));
 const country=countryAt(...origin.slice(0,2));
 const local=p=>country&&countryAt(p[1],p[2])===country;
 const guides=publishedDrives.map((g,i)=>{
  const places=[...g.places];if(km(places.at(-1))<km(places[0]))places.reverse();
  return {...g,id:'route-'+i,places,approach:km(places[0])};
 }).filter(g=>g.approach<=Math.min(100,driveRadius())&&g.places.every(local)).sort((a,b)=>a.approach-b.approach);
 return guides;
}
async function findMappedRoads(origin,key){
 const around='(around:55000,'+origin[0].toFixed(4)+','+origin[1].toFixed(4)+')';
 const query='[out:json][timeout:8];way'+around+'["scenic"="yes"]["highway"~"^(primary|secondary|tertiary|unclassified)$"]["name"]["access"!~"^(private|no)$"];out geom 15;node'+around+'["tourism"="viewpoint"]["name"];out 30;';
 try{
  const response=await fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query),{signal:AbortSignal.timeout(11500)});
  if(!response.ok)return;
  const {elements}=await response.json();
  if(driveShelf.key!==key)return;
  const found=[],country=countryAt(origin[0],origin[1]);
  for(const e of elements){
   if(!e.tags?.name)continue;
   let places;
   if(e.type==='way'&&e.geometry?.length>=2){
    const ends=[e.geometry[0],e.geometry.at(-1)].sort((a,b)=>kmBetween(origin,[a.lat,a.lon])-kmBetween(origin,[b.lat,b.lon]));
    if(kmBetween([ends[0].lat,ends[0].lon],[ends[1].lat,ends[1].lon])<.4)continue;
    const mid=e.geometry[Math.floor(e.geometry.length/2)];
    places=[[e.tags.name+' · начало',ends[0].lat,ends[0].lon],...[mid].filter(p=>!ends.includes(p)).map(p=>[e.tags.name,p.lat,p.lon]),[e.tags.name+' · конец',ends[1].lat,ends[1].lon]];
   }else continue;
   if(!country||!places.every(p=>countryAt(p[1],p[2])===country))continue;
   found.push({name:e.tags.name,why:e.type==='way'?'Дорога отмечена как живописная в OpenStreetMap.':'Поездка к смотровой площадке из OpenStreetMap.',places,source:'OpenStreetMap',url:'https://www.openstreetmap.org/'+e.type+'/'+e.id,road:e.type==='way'});
  }
  found.sort((a,b)=>Number(b.road)-Number(a.road)||kmBetween(origin,a.places[0].slice(1))-kmBetween(origin,b.places[0].slice(1)));
  const titles=new Set(driveShelf.options.map(o=>o.name)),more=found.filter(x=>{if(titles.has(x.name))return false;titles.add(x.name);return true}).slice(0,4);
  const wasEmpty=!driveShelf.options.length;driveShelf.options.push(...more);
  if(wasEmpty&&more.length&&!building&&!active&&!$('nearby').hidden&&actualOrigin()?.slice(0,2).join(',')+'/'+driveRadius()===key&&['all','car'].includes(mode)){render()}
 }catch{}
}
function activeDrive(){
 const origin=actualOrigin();
 if(!origin||!['all','car','rent'].includes(mode)||building||pickStage||pickStop||viewingSaved)return null;
 const key=origin.slice(0,2).join(',')+'/'+driveRadius();
 if(key!==driveShelf.key){
  driveShelf.key=key;driveShelf.options=driveOptions(origin);driveShelf.index=0;findMappedRoads(origin,key);
 }
 return driveShelf.options[0]||null;
}
function driveStops(d){
 return [actualOrigin().slice(0,2),...d.places.map(p=>p.slice(1))].filter((p,i,a)=>!i||kmBetween(p,a[i-1])>.08);
}
function frameDrive(d){
 if(!atlas)return;
 const bounds=new (window.maplibregl?.LngLatBounds||OfflineBounds)();
 driveStops(d).forEach(p=>bounds.extend(lngLat(p)));
 atlas.fitBounds(bounds,{padding:{top:140,right:innerWidth<761?45:Math.min(480,innerWidth*.42),bottom:innerWidth<650?200:90,left:40},maxZoom:11,duration:reduced.matches?0:450});
}
function driveCard(d){
 if(!d.status){
  d.status='Считаем путь по дорогам…';
  const origin=actualOrigin(),country=countryAt(origin[0],origin[1]);
  const coords=driveStops(d).map(([y,x])=>x.toFixed(5)+','+y.toFixed(5));
  const url='https://router.project-osrm.org/route/v1/driving/'+coords.join(';')+'?overview=full&geometries=geojson&steps=true&radiuses='+coords.map(()=>1500).join(';');
  fetch(url,{signal:AbortSignal.timeout(8000)}).then(r=>r.json()).then(j=>{
   const r=j.routes?.[0];if(!r?.geometry?.coordinates?.length)throw Error();
   validateLoop(r,{lat:origin[0],lon:origin[1]},false,loopBudget(),country,false);
   d.line=r.geometry.coordinates;d.ferries=ferrySegments(r);
   const minutes=Math.max(1,Math.round(r.duration/60)),h=Math.floor(minutes/60);
   d.status=Math.round(r.distance/1000)+' км · '+(h?h+' ч ':'')+(minutes%60)+' мин'+(d.ferries.length?' · есть паром':' за рулём');
  }).catch(()=>{d.status='Подъезд не подтверждён в рамках выбранного лимита'}).finally(()=>{
   if(driveShelf.current===d&&!$('nearby').hidden){$('quickCards').innerHTML=driveCard(d);paintRoute()}
  });
 }
 driveShelf.current=d;
 if(d.id&&!verifiedRoadPhotos&&!d.photoRequest){
  d.photoRequest=loadVerifiedRoadPhotos().then(photos=>{
   if(photos&&driveShelf.current===d&&!$('nearby').hidden)$('quickCards').innerHTML=driveCard(d);
  });
 }
 const stops=d.places.map(([name,lat,lon])=>({name,lat,lon,...verifiedStopPhoto(d.id,name)}));
 return routePhotoStrip({stops})+'<div class="drive-card"><h3>'+safe(d.name)+'</h3><strong>'+safe(d.status)+'</strong>'+(d.line?'<div class="nearby-start">'+navigationLinks(driveStops(d),'Поехали')+'</div>':'')+'<button class="action" data-open-loops>Роад-трип от этой дороги →</button><a target="_blank" rel="noopener" href="'+safe(d.url)+'">'+safe(d.source)+' ↗</a></div>';

}
function takeDrive(d){
 const origin=actualOrigin();if(!origin)return;
 const places=d.places.filter((p,i)=>i||kmBetween(origin,p.slice(1))>.08);
 if(!places.length)return;
 const points=places.map(([name,lat,lon])=>({name,lat,lon}));
 if(itinerary.legs.length)points.unshift({name:originName(),lat:origin[0],lon:origin[1]});
 itinerary.legs.push({...points[0],arrival:itinerary.legs.length>0,stops:points.slice(1)});
 selectedLeg=itinerary.legs.length-1;persist();enterTrip();frameDrive(d);
}
function previewLines(){
 if(siteLine?.el.isConnected&&!$('landmark').hidden)return [siteLine.line];
 const d=driveShelf.current;
 return d&&highlightRoads()&&!active&&!$('nearby').hidden&&d.line?[d.line]:[route];
}
