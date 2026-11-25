'use strict';
const summaries=[
 ['tour-altay','Алтай по Чуйскому тракту','Горно-Алтайск → Телецкое озеро → Акташ → Горно-Алтайск','Машина, катер и внедорожная заброска',[
 ['Телецкое озеро','Из аэропорта Горно-Алтайска группа переезжает к озеру. Первый вечер оставлен для отдыха.','Телецкое озеро Алтай'],
 ['Водопады и Катунь','Утром — катер вдоль береговых водопадов. Затем переезд к Катуни.','река Катунь Алтай'],
 ['Чуйский тракт','Дорога через горы до Акташа с остановками для фотографий. Ночёвка в селе.','Акташ Республика Алтай'],
 ['Кату-Ярык','Долину Чулышмана смотрят с перевала. На обратном пути возможен заезд к Гейзерному озеру.','перевал Кату-Ярык'],
 ['Джангысколь','День с заброской к горному озеру. Этот участок стоит планировать с местным транспортом.','озеро Джангысколь Алтай'],
 ['Возвращение','По Чуйскому тракту — обратно в Горно-Алтайск с остановками по пути.','Горно-Алтайск'],
 ['Вылет','Завершение программы и дорога в аэропорт.','аэропорт Горно-Алтайск']]],
 ['tour-kamchatka','Камчатка от океана до вулканов','Петропавловск-Камчатский → Горелый → мыс Маячный → Толмачёво','Автомобиль, пешие выходы и морская прогулка',[
 ['Авачинская бухта','Встреча в Елизове, затем прогулка по порту и смотровая в Петропавловске.','Авачинская бухта'],
 ['Халактырский пляж','День на берегу Тихого океана. В программе есть сёрфинг.','Халактырский пляж'],
 ['Горелый','Подъезд к началу маршрута и пешее восхождение к кратерам.','вулкан Горелый Камчатка'],
 ['Мыс Маячный','Поездка к маяку и берегу океана, затем купание в Голубой лагуне.','мыс Маячный Камчатка'],
 ['Свободный выбор','Организатор оставляет гибкий день. Вертолётная экскурсия предлагается отдельно.',''],
 ['Выход в море','Морская прогулка для наблюдения за животными. Встреча с китами зависит от условий.',''],
 ['Толмачёво','Выезд к озеру в глубине полуострова.','Толмачёво озеро Камчатка'],
 ['Побережье','Пикник у океана и рыбные рынки перед отъездом.','Петропавловск-Камчатский'],
 ['Отъезд','Завершение путешествия и аэропорт Елизово.','аэропорт Елизово']]],
 ['tour-japan-roudtrip','Япония от Осаки до Токио','Осака → Миядзима → Киото → Нара → Фудзи → Токио','Автомобиль, паром и городские прогулки',[
 ['Дотонбори','Заселение в Осаке и первый вечер в квартале у канала.','Dotonbori Osaka'],
 ['Осака','Парк Нисиномару рядом с замком, затем обед в Кёбаси.','Nishinomaru Garden Osaka'],
 ['Кобе и Миядзима','Музей сакэ и святилище Икута. К вечеру — переправа на остров.','Ikuta Jinja Kobe'],
 ['Остров Миядзима','Подъём по канатной дороге к горе Мисен и прогулка по острову.','Mount Misen Miyajima'],
 ['Хиросима и Курасики','После парома — Мемориальный парк мира и каналы Курасики.','Kurashiki Bikan'],
 ['Киото','Бамбуковая роща Арасияма, сад Окоти-Сансо и храм Адасино.','Arashiyama Kyoto'],
 ['Нара','Парк с оленями и храм Тодай-дзи, затем длинный переезд.','Todaiji Nara'],
 ['Дорога Накасэндо','Прогулки по старым почтовым станциям Цумаго и Магомэ.','Tsumago-juku'],
 ['Кавагутико и Камакура','Смотровые у озера и остановка у Большого Будды по пути в Токио.','Lake Kawaguchi Japan'],
 ['Токио','Сибуя, смотровая в Синдзюку и квартал Гиндза.','Shibuya Crossing Tokyo'],
 ['Токийский залив','teamLab Planets и башня Skytree в последний полный день.','Tokyo Skytree'],
 ['Завершение','Выезд из отеля. Трансфер в аэропорт участники планируют самостоятельно.','']]]
];
const guides=summaries.map(([id,name,overview,how,days])=>({id,name,overview,how,days,source:'FAT BUS',url:'https://fatbus.ru/'+id,pic:guideCovers[id]}));
for(const [i,g] of publishedDrives.entries()){
 const detail=dayGuides[g.url];guides.push({...g,id:'route-'+i,pic:g.pic||detail?.pic,groups:detail?.days,overview:g.places.map(p=>p[0]).join(' → ')});
}
const byId=id=>document.getElementById(id);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mapLink=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
const guidePhotos=new Map();
function addGuidePhoto(name,lat,lon,url,credit){
 if(!url)return;
 const key=name.toLowerCase().trim(),rows=guidePhotos.get(key)||[];
 rows.push({lat,lon,url,credit});guidePhotos.set(key,rows);
}
for(const [name,lat,lon,url,credit] of loopGallery)addGuidePhoto(name,lat,lon,url,credit);
for(const [id,name,lon,lat] of heritage){
 const m=placeMedia[id];
 if(m?.[1])addGuidePhoto(name,lat,lon,m[1],'https://'+m[2]+'.wikipedia.org/wiki/File:'+encodeURIComponent(m[3]));
}
function stopPhoto([name,lat,lon,,url]){
 if(url)return {url};
 return guidePhotos.get(name.toLowerCase().trim())?.find(p=>Math.hypot(p.lat-lat,(p.lon-lon)*Math.cos(lat*Math.PI/180))<.02);
}
function photo(g,cls){
 const image=g.pic?{url:g.pic}:g.places?.map(stopPhoto).find(Boolean);
 return image?'<figure class="guide-image '+cls+'"><img loading="lazy" decoding="async" alt="'+esc(g.name)+'" src="'+esc(image.url)+'">'+
 (cls==='hero'&&image.credit?'<figcaption><a target="_blank" rel="noopener" href="'+esc(image.credit)+'">Источник фотографии ↗</a></figcaption>':'')+'</figure>':'';
}
function renderStop([name,lat,lon,description,url]){
 const image=stopPhoto([name,lat,lon,description,url]);
 return '<li class="guide-stop">'+(image?'<figure><img loading="lazy" alt="'+esc(name)+'" src="'+esc(image.url)+'">'+(image.credit?'<figcaption><a href="'+esc(image.credit)+'" target="_blank" rel="noopener">Источник фото ↗</a></figcaption>':'')+'</figure>':'')+
 '<div><a target="_blank" rel="noopener" href="'+mapLink(lat+','+lon)+'">'+esc(name)+' ↗</a>'+(description?'<p>'+esc(description)+'</p>':'')+'</div></li>';
}
let guideMap=null,mapRequest=null;
function showRoadMap(g){
 const points=g.places?.filter(([,lat,lon])=>Number.isFinite(lat)&&Number.isFinite(lon));
 const container=byId('guideMap'),status=byId('guideMapStatus');
 if(!container||!points||points.length<2)return;
 if(typeof maplibregl==='undefined'){status.textContent='Карта недоступна. Остановки можно открыть по ссылкам ниже.';return}
 const coordinates=points.map(([,lat,lon])=>[lon,lat]);
 const bounds=new maplibregl.LngLatBounds();
 coordinates.forEach(point=>bounds.extend(point));
 try{guideMap=new maplibregl.Map({container,style:'https://tiles.openfreemap.org/styles/dark',bounds,
  fitBoundsOptions:{padding:40,maxZoom:13},scrollZoom:false});}
 catch{status.textContent='Карта недоступна. Остановки можно открыть по ссылкам ниже.';return}
 const map=guideMap,request=new AbortController();mapRequest=request;
 map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
 points.forEach(([name],i)=>{
  if(i===points.length-1&&coordinates[i].join(',')===coordinates[0].join(','))return;
  const mark=document.createElement('span');mark.className='guide-map-pin';mark.textContent=String(i+1);mark.title=name;
  new maplibregl.Marker({element:mark}).setLngLat(coordinates[i]).addTo(map);
 });
 map.once('load',async()=>{
  if(request.signal.aborted)return;
  if(coordinates.length>100){status.textContent='На карте отмечены остановки.';return}
  const coords=coordinates.map(p=>p.map(n=>n.toFixed(5)).join(',')).join(';');
  try{
   const response=await fetch('https://router.project-osrm.org/route/v1/driving/'+coords+'?overview=full&geometries=geojson&radiuses='+coordinates.map(()=>2200).join(';'),
    {signal:AbortSignal.any([request.signal,AbortSignal.timeout(12000)])});
   if(!response.ok)throw Error();
   const path=(await response.json()).routes?.[0];
   if(request.signal.aborted)return;
   if(!path?.geometry?.coordinates?.length)throw Error();
   map.addSource('guide-road',{type:'geojson',data:{type:'Feature',geometry:path.geometry,properties:{}}});
   map.addLayer({id:'guide-road',type:'line',source:'guide-road',layout:{'line-join':'round','line-cap':'round'},paint:{'line-width':4,'line-color':'#c9b7fc'}});
   path.geometry.coordinates.forEach(p=>bounds.extend(p));map.fitBounds(bounds,{padding:40,maxZoom:13,duration:0});
   status.textContent=Math.round(path.distance/1000)+' км по дорожной сети';
  }catch{if(!request.signal.aborted)status.textContent='Дорогу не удалось рассчитать. На карте отмечены остановки.'}
 });
}
const info=g=>g.distanceKm&&g.drivingMinutes?g.distanceKm+' км · '+Math.floor(g.drivingMinutes/60)+' ч '+g.drivingMinutes%60+' мин':g.days||g.groups?(g.days||g.groups).length+' дн.':g.places.length+' остановок';
byId('access').innerHTML=accessOptions();
function list(){
 const q=byId('query').value.trim().toLowerCase(),access=byId('access').value;
 const found=guides.filter(g=>(!access||(g.access||'unknown')===access)&&(g.name+' '+g.overview+' '+g.source).toLowerCase().includes(q));
 byId('grid').innerHTML=found.map(g=>'<a class="tile" href="#'+g.id+'">'+photo(g,'cover')+'<small>'+esc(accessLabel(g))+' · '+info(g)+'</small><h2>'+esc(g.name)+'</h2></a>').join('')||'<p>Маршрутов по этому запросу пока нет.</p>';
}
function show(){
 mapRequest?.abort();guideMap?.remove();mapRequest=null;guideMap=null;
 const g=guides.find(g=>'#'+g.id===location.hash);
 byId('library').hidden=!!g;byId('article').hidden=!g;if(!g){list();return}
 const phases=g.days?g.days.map(([title,note,q],i)=>'<section class="phase"><small>День '+(i+1)+'</small><h3>'+esc(title)+'</h3><p>'+esc(note)+'</p>'+(q?'<a target="_blank" rel="noopener" href="'+mapLink(q)+'">Место на карте ↗</a>':'')+'</section>').join(''):(g.groups||[g.places]).map((group,i)=>'<section class="phase"><h3>'+(g.groups?'День '+(i+1):'Остановки по порядку')+'</h3><ol>'+group.map(renderStop).join('')+'</ol></section>').join('');
 byId('article').innerHTML='<a class="back" href="#">← Все маршруты</a><h1>'+esc(g.name)+'</h1>'+photo(g,'hero')+'<p class="meta">'+esc(accessLabel(g))+' · '+info(g)+'</p><p>'+esc(g.overview)+'</p>'+(g.checkedAt?'<p>Кольцо рассчитано по дорожной сети · '+esc(g.checkedAt)+'</p>':'')+'<p>'+esc(g.how||g.why||'')+'</p>'+(g.surface?'<p>'+esc(g.surface)+'</p>':'')+(g.photoCredit?'<small>'+esc(g.photoCredit)+'</small>':'')+'<a class="cta" target="_blank" rel="noopener" href="'+esc(g.url)+'">Подробности о маршруте ↗</a>'+(g.places?.length>=2?'<section class="guide-map-shell"><h2>Карта маршрута</h2><div id="guideMap"></div><p id="guideMapStatus" role="status">Строим путь по дорогам…</p></section>':'')+phases;window.scrollTo(0,0);showRoadMap(g);
}
document.addEventListener('error',e=>{if(e.target.tagName==='IMG'){const frame=e.target.closest('figure');if(frame)frame.hidden=true;else e.target.hidden=true}},true);
byId('query').oninput=list;byId('access').onchange=list;window.onhashchange=show;show();
