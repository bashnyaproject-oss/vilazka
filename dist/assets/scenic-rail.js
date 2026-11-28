
const originalRailTrips = [
 ['Рускеальский экспресс','Россия · Карелия','https://visit-sortavala.ru/',
  ['6/64','Ruskeala_marble_quarry,_Karelia.jpg',960,'Aleksander Kaasik','by-sa/4.0',2],
  [['Старт','Вокзал Сортавала',61.6989,30.6779,'Здесь садимся на ретропоезд.'],
   ['Финиш поезда','Горный парк Рускеала',61.9518,30.5823,'От платформы можно пройти в парк.'],
   ['После поезда','Мраморный каньон',61.9466,30.5818,'Прогулка вдоль затопленного карьера и мраморных скал.']]],
 ['Фломская железная дорога','Норвегия','https://www.vy.no/en/train/routes/the-flam-railway',
  ['8/8e','The_Kjosfossen_Waterfall.jpg',500,'Fxp42','by-sa/3.0',1],
  [['Старт','Мюрдал',60.7359,7.1229,'Пересадка с Бергенской линии на поезд к фьорду.'],
   ['Фотоостановка','Водопад Кьосфоссен',60.7457,7.1199,'На короткой остановке можно выйти на платформу.'],
   ['Финиш','Флом',60.8629,7.1133,'От вокзала можно выйти к берегу Аурландс-фьорда.']]],
 ['Bernina Express','Швейцария → Италия','https://www.rhb.ch/en/panoramic-journeys/bernina-express/',
  ['a/a6','Bernina-Express_1.JPG',960,'Christoph Radtke','by/3.0',1],
  [['Старт','Вокзал Кура',46.8533,9.5288,'Выбирай рейс из Кура, чтобы увидеть виадук Ландвассер.'],
   ['Вид из окна','Виадук Ландвассер',46.6809,9.6769,'Каменный виадук над ущельем перед входом в туннель.'],
   ['По пути','Альп-Грюм',46.3744,10.0310,'Горная станция с видом на ледник Палю. Возможность выйти зависит от рейса.'],
   ['Финиш','Тирано',46.2163,10.1634,'Станция в долине Вальтеллина. После поезда можно погулять по городу.']]]
];
const railTrips=originalRailTrips.map((trip,i)=>[...trip,['RU','NO','CH'][i]]).concat(additionalRailTrips);
const railCountryNames=new Intl.DisplayNames(['ru'],{type:'region'});
const railCountries=[...new Set(['IS',...railTrips.map(trip=>trip[5])])]
 .sort((a,b)=>railCountryNames.of(a).localeCompare(railCountryNames.of(b),'ru'));
let railCountry='';
let selectedRailTrip = null;

function railTripList() {
 if(railCountry==='IS')return '<p>В Исландии нет пассажирских поездов. <a href="https://www.visiticeland.com/article/public-transport/" target="_blank" rel="noopener">Транспорт в Исландии ↗</a></p>';
 return railTrips.map((route,i)=>{
  if(railCountry&&route[5]!==railCountry)return '';
  return '<button type="button" data-rail-trip="'+i+'">'+railPhoto(route,false)+
   '<strong>'+safe(route[0])+'</strong><span>'+safe(route[1])+'</span><span>'+safe(route[4][0][1])+' → '+safe(route[4].find(p=>p[0].startsWith('Финиш'))[1])+'</span></button>';
 }).join('');
}
function refreshRailTripList(deck) {
 const list=deck.querySelector('.rail-list');
 list.innerHTML=railTripList();
 list.querySelectorAll('[data-rail-trip]').forEach(button=>button.onclick=()=>showRailTrips(Number(button.dataset.railTrip)));
}

function railPhoto(trip, credit) {
 if(!trip[3])return '<figure class="rail-photo-placeholder" aria-hidden="true">🚆</figure>';
 const [directory,file,width,author,license,point,thumbnail,licenseLabel]=trip[3];
 const name=encodeURIComponent(file);
 const licenseUrl=license.startsWith('https:')?license:'https://creativecommons.org/licenses/'+license+'/';
 const licenseText=licenseLabel||'CC '+license.toUpperCase().replace('/',' ');
 const licenseCredit=license?'<a href="'+safe(licenseUrl)+'" target="_blank" rel="noopener">'+safe(licenseText)+'</a>':safe(licenseText);
 const image=thumbnail||'https://thumb.wikimedia.org/wikipedia/commons/thumb/'+directory+'/'+name+'/'+width+'px-'+name;
 return '<figure><img loading="lazy" src="'+safe(image)+'" alt="'+safe(thumbnail?file.replaceAll('_',' ').replace(/\.[^.]+$/,''):trip[4][point][1])+'">'+(credit?'<figcaption><a href="https://commons.wikimedia.org/wiki/File:'+name+'" target="_blank" rel="noopener">'+safe(author)+'</a> · '+licenseCredit+'</figcaption>':'')+'</figure>';
}

function showRailTrips(index=null) {
 const deck=$('railDeck');
 const trip=railTrips[index];
 selectedRailTrip=trip||null;
 deck.hidden=false;
 $('tripBuilder').setAttribute('aria-pressed','true');
 const heading=trip?safe(trip[0]):'Живописные поезда';
 deck.innerHTML='<div class="rail-heading"><h2 id="railTitle">'+heading+'</h2><button type="button" data-rail-close aria-label="Закрыть">×</button></div>'+
 (trip?'<button class="rail-back" type="button" data-rail-back>← Все поездки</button><p>'+safe(trip[1])+'</p>'+
 '<ol>'+trip[4].map(([role,name,,,description],i)=>'<li id="rail-point-'+i+'"><span>'+safe(role)+'</span><strong>'+safe(name)+'</strong><p>'+safe(description)+'</p>'+(i===trip[3]?.[5]?railPhoto(trip,true):'')+'</li>').join('')+'</ol>'+
 '<button class="rail-fit" type="button" data-rail-fit>Показать все точки</button><a class="rail-source" href="'+trip[2]+'" target="_blank" rel="noopener">О маршруте ↗</a>':
 '<label for="railCountry">Страна</label><select id="railCountry"><option value="">Все страны</option>'+railCountries.map(code=>'<option value="'+code+'"'+(code===railCountry?' selected':'')+'>'+safe(railCountryNames.of(code))+'</option>').join('')+'</select><div class="rail-list"></div>');
 deck.scrollTop=0;

 deck.querySelector('[data-rail-close]').onclick=()=>{hideRailTrips();renderPins();$('tripBuilder').focus()};
 deck.querySelector('[data-rail-back]')?.addEventListener('click',()=>showRailTrips());
 deck.querySelector('[data-rail-fit]')?.addEventListener('click',fitRailTrip);
 if(!trip){
  const filter=deck.querySelector('#railCountry');
  filter.onchange=()=>{railCountry=filter.value;refreshRailTripList(deck)};
  refreshRailTripList(deck);
 }
 renderPins();
 if(trip)fitRailTrip();
}
function hideRailTrips() {
 selectedRailTrip=null;
 $('railDeck').hidden=true;
 $('tripBuilder').setAttribute('aria-pressed','false');
}
function fitRailTrip() {
 if(!atlas||!selectedRailTrip)return;
 const bounds=new (window.maplibregl?.LngLatBounds||OfflineBounds)();
 selectedRailTrip[4].forEach(([,,lat,lon])=>bounds.extend([lon,lat]));
 const phone=innerWidth<=760;
 const wide=map.clientWidth>1000;
 const padding=phone?{left:26,right:26,top:100,bottom:Math.min(Math.round(map.clientHeight*.5),map.clientHeight-155)}:{left:45,right:wide?410:65,top:130,bottom:65};
 atlas.fitBounds(bounds,{padding,maxZoom:12,duration:reduced.matches?0:650});
}
function railTripPins(at) {
 return selectedRailTrip[4].map(([,name,lat,lon],i)=>'<button class="rail-pin" type="button" data-rail-point="'+i+'" aria-label="'+safe(name)+'" title="'+safe(name)+'"'+at(lat,lon)+'><span>'+(i+1)+'</span></button>').join('');
}
