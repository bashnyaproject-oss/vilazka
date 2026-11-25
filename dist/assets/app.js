'use strict';
const $=id=>document.getElementById(id);
const cities={Берлин:[52.52,13.4,'BER'],Москва:[55.75,37.62,'MOW'],Амстердам:[52.37,4.9,'AMS'],Осло:[59.91,10.75,'OSL'],Стамбул:[41.01,28.97,'IST']};
const data=[
 ['Доломиты','Италия',46.57,11.73,'IT','VCE',7,6,10,610,105,'Природа','виза','Больцано|Ортизеи|Сечеда|Валь-ди-Фунес','Венеция|Больцано|Ортизеи','https://vistoperitalia.esteri.it/'],
 ['Норвежские фьорды','Норвегия',60.47,6.55,'NO','BGO',7,5,9,780,125,'Роад-трип','виза','Берген|Восс|Хардангер-фьорд|Эйдфьорд','Берген|Восс|Флом','https://www.udi.no/en/want-to-apply/visit-and-holiday/'],
 ['Юг Исландии','Исландия',63.53,-19.51,'IS','KEF',7,3,10,850,150,'Роад-трип','виза','Кефлавик|Сельяландсфосс|Скоугафосс|Вик','Кефлавик|Рейкьявик|Вик','https://island.is/en/get-a-visa'],
 ['Мадейра','Португалия',32.74,-16.98,'PT','FNC',7,1,12,630,95,'Природа','виза','Фуншал|Пику-ду-Ариейру|Сантана|Порту-Мониш','Фуншал|Камара-ди-Лобуш|Сантана','https://vistos.mne.gov.pt/en/'],
 ['Стамбул','Турция',41.01,28.97,'TR','IST',3,1,12,240,70,'Город','без визы','Султанахмет|Каракёй|Ортакёй','Султанахмет|Каракёй|Кадыкёй','https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa'],
 ['Каппадокия','Турция',38.64,34.83,'TR','NAV',7,4,11,420,80,'Роад-трип','без визы','Кайсери|Гёреме|Учхисар|Долина Ихлара','Гёреме|Учхисар|Аванос','https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa'],
 ['Казбеги','Грузия',42.66,44.64,'GE','TBS',7,5,10,405,65,'Природа','без визы','Тбилиси|Ананаури|Гудаури|Степанцминда','Тбилиси|Степанцминда','https://geoconsul.gov.ge/en'],
 ['Озеро Севан','Армения',40.56,45.01,'AM','EVN',7,4,10,360,65,'Природа','без визы','Ереван|Севанаванк|Дилижан|Ереван','Ереван|Севан|Дилижан','https://www.mfa.am/en/visa/'],
 ['Балтийское побережье','Россия',54.94,20.15,'RU','KGD',3,5,9,170,55,'Природа','внутри страны','Калининград|Светлогорск|Янтарный','Калининград|Светлогорск|Зеленоградск','https://www.kdmid.ru/'],
 ['Карелия','Россия',61.94,30.58,'RU','LED',7,5,10,190,50,'Роад-трип','внутри страны','Санкт-Петербург|Приозерск|Сортавала|Рускеала','Санкт-Петербург|Сортавала|Рускеала','https://www.kdmid.ru/'],
 ['Казань','Россия',55.8,49.11,'RU','KZN',3,1,12,165,55,'Город','внутри страны','Казанский кремль|Старо-Татарская слобода|Свияжск','Казанский кремль|Старо-Татарская слобода|Свияжск','https://www.kdmid.ru/'],
 ['Сочи','Россия',43.59,39.72,'RU','AER',7,4,11,210,65,'Природа','внутри страны','Сочи|Сириус|Красная Поляна','Сочи|Имеретинская низменность|Роза Хутор','https://www.kdmid.ru/']
].map(([name,country,lat,lon,code,airport,days,from,to,base,daily,tag,visa,road,walk,official],id)=>({id,name,country,lat,lon,code,airport,days,from,to,base,daily,tag,visa,road:road.split('|'),walk:walk.split('|'),official}));
const storeKey='vylazka-profile-v1';
const defaults={origin:'auto',discovered:[],passport:'',taste:'Природа',drive:'3',saved:[],plans:{}};
let state={...defaults};
try{state={...defaults,...JSON.parse(localStorage.getItem(storeKey)||'{}')}}catch{}
if(!visaIndexes.has(state.passport))state.passport='';
if(!['auto','pin'].includes(state.origin)&&!Object.hasOwn(cities,state.origin))state.origin=defaults.origin;
let gps=null;
let gpsStatus='idle';
let geoRequest=0;
const actualOrigin=()=>state.origin==='pin'?state.point:state.origin==='auto'?gps:cities[state.origin];
const baseOrigin=()=>actualOrigin()||[52.52,13.4,'BER'];
function placeName(point){
 if(!point)return '';
 const [lat,lon]=point;
 let closest=null,km=Infinity;
 for(const [name,,x,y,pop] of atlasCities){
  if(!pop)continue;
  const distance=kmBetween(point,[y,x]);
  if(distance<km){km=distance;closest=name}
 }
 return km<3?closest:Math.round(km)+' км от '+closest;
}
const originName=()=>actualOrigin()?(['auto','pin'].includes(state.origin)?placeName(actualOrigin()):state.origin):'Выбрать старт';
const startQuery=()=>actualOrigin()?.slice(0,2).join(',')||'';
if(!['2','3','5','8'].includes(state.drive))state.drive=defaults.drive;
let mode='all', viewingSaved=false, active=null, tripMode='', tab='plan', visible=[];
const persist=()=>{try{localStorage.setItem(storeKey,JSON.stringify(state))}catch{}};
const euro=n=>new Intl.NumberFormat('ru-RU').format(n)+' €';
const months=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
months.forEach((m,i)=>$('month').add(new Option(m,i+1)));
$('origin').value=state.origin;
const seasons=['winter','spring','summer','autumn'];
const currentSeason=()=>seasons[Math.floor(((new Date().getMonth()+1)%12)/3)];
if(!seasons.includes(state.seasonMode))state.seasonMode='now';
state.season=state.seasonMode==='now'?currentSeason():state.seasonMode;
function applySeason(){
 document.body.dataset.season=state.season;
 $('season').value=state.seasonMode;
 $('season').options[0].textContent='Сейчас · '+new Intl.DateTimeFormat(document.documentElement.lang,{day:'numeric',month:'short'}).format(new Date());
}
applySeason();
$('season').onchange=e=>{state.seasonMode=e.target.value;state.season=state.seasonMode==='now'?currentSeason():state.seasonMode;applySeason();persist();storyId=-1;render();canvas?.draw();if(!$('seasonMenu').hidden)updateSeasonPanel()};
$('recommend').onclick=()=>{updateSeasonPanel();if(!$('mobileSettings').hidden)$('mobileOptions').click();$('seasonMenu').hidden=!$('seasonMenu').hidden;$('recommend').setAttribute('aria-expanded',String(!$('seasonMenu').hidden))};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#seasonDock,#seasonMenu')){$('seasonMenu').hidden=true;$('recommend').setAttribute('aria-expanded','false')}});

function seasonPos(i){return '--sx:'+(i%8*100/7)+'%;--sy:'+(Math.floor(i/8)*12.5)+'%;'}
const photo=(d,cl)=>'<span class="'+cl+' photo" style="'+seasonPos(d.id)+'--px:'+((d.id%4)/3*100)+'%;--py:'+(Math.floor(d.id/4)*50)+'%"></span>';
const range=(n)=>Math.max(0,Math.round(n/10)*10);
function distance(d){
 return kmBetween(baseOrigin(),[d.lat,d.lon]);
}
function kmBetween([a,b],[lat,lon]){
 const rad=Math.PI/180;
 const h=Math.sin((lat-a)*rad/2)**2+Math.cos(a*rad)*Math.cos(lat*rad)*Math.sin((lon-b)*rad/2)**2;
 return 12742*Math.asin(Math.min(1,Math.sqrt(h)));
}
const nearestCity=()=>Object.entries(cities).sort(([,a],[,b])=>kmBetween(baseOrigin(),a)-kmBetween(baseOrigin(),b))[0][0];
const regionOrigin=()=>['auto','pin'].includes(state.origin)?(actualOrigin()&&kmBetween(baseOrigin(),cities[nearestCity()])<250?nearestCity():''):state.origin;
const sameRegion=d=>d.code==='RU'?regionOrigin()==='Москва':d.code==='TR'?regionOrigin()==='Стамбул':['IT','NO'].includes(d.code)&&['Берлин','Амстердам','Осло'].includes(regionOrigin());
function options(d){
 const km=distance(d), list=[];
 if(siteAccess[d.id][0]<=40&&km<1600)list.push('car');
 if(km>75){list.push('plane');if(d.tag!=='Город')list.push('rent')}
 if(siteAccess[d.id][1]<=18&&km<3600)list.push('train');
 return list.length?list:['local'];
}
const names={car:'Своё авто',plane:'Перелёт',rent:'Перелёт + аренда',train:'Поезд',local:'По городу'};
function travel(d,m){
 const km=distance(d);
 if(m==='local')return 'Маршрут по городу';
 const hours=m==='car'?km*1.28/78:m==='train'?km*1.2/95:km/730+1;
 return '≈ '+Math.max(1,Math.round(hours))+' ч в одну сторону';
}
const tripDays=d=>Number($('days').value)||d.days;
function price(d,m){
 const km=distance(d), n=tripDays(d);
 const move=m==='car'?km*.27:m==='train'?km*.2:m==='local'?15:d.base*.42+km*.07;
 const living=n*d.daily, rental=m==='rent'?n*46:0;
 const total=move+living+rental;
 return {move:range(move),living:range(living),rental:range(rental),text:euro(range(total*.85))+'–'+euro(range(total*1.25))};
}
function visaFor(d){
 if(!visaIndexes.has(state.passport))return 'Добавь паспорт';
 const kind=visaKind(d.code);return kind===1?'без визы':kind===7?'внутри страны':visaLabels[kind];
}
const defaultMode=d=>options(d).includes(mode)?mode:options(d)[0];
function matches(d){
 const n=Number($('days').value), m=Number($('month').value), km=distance(d);
 if(viewingSaved)return state.saved.includes(d.id);
 if(!popularity.allows('d'+d.id))return false;
 if(!localAccess(d.id,d.lon,d.lat))return false;
 if(n&&(n===3&&(d.days>3||km>2100)||n===7&&km>4700))return false;
 if(m&&(m<d.from||m>d.to))return false;
 if(actualOrigin()&&mode!=='all'&&!options(d).some(x=>x===mode))return false;
 return !$('visa').checked||['без визы','внутри страны'].includes(visaFor(d));
}
let storyId=0;
function storyCard(){
 const drive=activeDrive();if(drive)return driveCard(drive);driveShelf.current=null;
 if(flying())return airportCard();
 const d=visible.find(item=>item.id===storyId)||visible[0];
 if(!d)return '<p class="empty">Для этих фильтров мест пока нет.</p>';
 storyId=d.id;
 const scenic=d.id===0?' feature-scene':'';
 const label=actualOrigin()?names[defaultMode(d)]+' · ≈ '+price(d,defaultMode(d)).text:tripDays(d)+' дн. · '+d.tag;
 return '<button class="story-card" data-open="'+d.id+'"><span class="story-image photo'+scenic+'" style="'+seasonPos(d.id)+'--px:'+((d.id%4)/3*100)+'%;--py:'+(Math.floor(d.id/4)*50)+'%"></span><span class="story-copy"><small>'+d.country+'</small><strong>'+d.name+'</strong><span>'+label+'</span><b>Посмотреть место</b></span></button>';
}
function browseStory(step){
 if(activeDrive()){
  driveShelf.index=(driveShelf.index+step+driveShelf.options.length)%driveShelf.options.length;
  const d=activeDrive();$('quickCards').innerHTML=driveCard(d);renderPins();paintRoute();frameDrive(d);return;
 }
 if(flying()){
  const items=airChoices();if(!items.length)return;
  const p=items[(items.findIndex(x=>x.code===airportSelection)+step+items.length)%items.length];airportSelection=p.code;
  $('quickCards').innerHTML=airportCard();flyTo([p.y,p.x],3.8);return;
 }
 if(!visible.length)return;
 const i=visible.findIndex(d=>d.id===storyId);
 const d=visible[(i+step+visible.length)%visible.length];storyId=d.id;lastLoopPoint={name:d.name,lat:d.lat,lon:d.lon};
 $('quickCards').innerHTML=storyCard();flyTo([d.lat,d.lon],4);renderPins();
}
function render(){
 visible=data.filter(matches).sort((a,b)=>(b.tag===state.taste)-(a.tag===state.taste)||distance(a)-distance(b));
 if(active&&!visible.includes(active))active=null;
 $('resultTitle').textContent=viewingSaved?'Мои поездки':'Направления';
 updateLocation(); updateProgress();
 $('total').textContent=visible.length+' из '+data.length;
 $('explore').classList.toggle('active',!viewingSaved&&!document.querySelector('aside').hidden);
 $('saved').classList.toggle('active',viewingSaved&&!document.querySelector('aside').hidden);
 $('cards').innerHTML=visible.map(d=>{
 const m=defaultMode(d);
 return '<article class="card '+(active===d?'current':'')+'"><button class="card-open" data-open="'+d.id+'">'+photo(d,'thumb')+'<span><strong>'+d.name+'</strong><small>'+d.country+' · '+tripDays(d)+' дн. · '+names[m]+'</small><em>'+ (actualOrigin()?'≈ '+price(d,m).text:'Выбери старт') +'</em></span></button><button class="heart" data-save="'+d.id+'" aria-label="'+(state.saved.includes(d.id)?'Убрать из сохранённых':'Сохранить')+'">'+(state.saved.includes(d.id)?'♥':'♡')+'</button></article>';
 }).join('')||(viewingSaved?'<p class="empty">Нажми на сердечко у поездки, чтобы добавить её сюда.</p>':'<p class="empty">В демокаталоге нет совпадений. Попробуй другой месяц или способ поездки.</p>');
 const useRail=!loopView.open&&!building&&!pickStage&&!pickStop&&!active&&!picking&&!viewingSaved&&document.querySelector('aside').hidden&&$('landmark').hidden&&$('portal').hidden;
 $('nearby').hidden=!useRail;
 const priorDrive=driveShelf.current;
 if(useRail)$('quickCards').innerHTML=storyCard();else driveShelf.current=null;
 if(priorDrive!==driveShelf.current)paintRoute();
 if(viewingSaved&&state.cityWishlist?.length){if(!visible.length)$('cards').innerHTML='';$('cards').innerHTML+=state.cityWishlist.map(i=>'<button class="card-open" data-city="'+i+'">'+atlasCities[i][0]+' · '+atlasCities[i][1]+'</button>').join('')}
 renderPins();renderDetail();if(!active)clearRoute();
}
function save(d){
 state.saved=state.saved.includes(d.id)?state.saved.filter(id=>id!==d.id):[...state.saved,d.id];
 persist();saveAccountItem('place-'+d.id,{name:d.name,lat:d.lat,lon:d.lon},!state.saved.includes(d.id));render();
}
function open(d){
 if(pointChoice(d.lat,d.lon,d.name))return;
 if(building)leaveTrip();

 setDrawer(false);closeLandmark();$('portal').hidden=true;
 active=d;const savedMode=state.plans[d.id]?.transport;tripMode=viewingSaved&&options(d).includes(savedMode)?savedMode:defaultMode(d);tab='plan';checkedRequirements.clear();render();drawRoute(true);
 markDiscovered(d);
}
function renderDetail(){
 const node=$('detail');node.hidden=!active;if(!active)return;
 const d=active,p=price(d,tripMode), stops=['car','rent'].includes(tripMode)?d.road:d.walk, n=tripDays(d);
 const plan=state.plans[d.id]||{day:0,checks:[]};
 const index=Math.min(plan.day,n-1);
 const stop=stops[Math.round(index*(stops.length-1)/Math.max(1,n-1))];
 const checks=['Проверить условия въезда и пересадки','Сохранить брони и карту офлайн','Проверить погоду и ограничения на маршруте',...(tripMode==='rent'?['Уточнить требования к правам, карте и депозиту']:[])];
 const driveNote=['car','rent'].includes(tripMode)?'<p class="note">Твой ориентир за рулём — до '+state.drive+' ч в день. '+(tripMode==='car'&&distance(d)*1.28/78>Number(state.drive)?'По модели дорога до места займёт больше. Запланируй остановку на ночь.':'Проверь длительность каждого переезда по карте.')+'</p>':'';
 const route=stops.map((s,i)=>'<li><b>День '+(1+Math.round(i*(n-1)/(stops.length-1)))+'</b> · '+s+'</li>').join('');
 const mapLink='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(stop+' '+d.country);
 const today='<div class="chips"><button data-day="-1" '+(!index?'disabled':'')+'>−</button><button disabled>День '+(index+1)+' из '+n+'</button><button data-day="1" '+(index===n-1?'disabled':'')+'>+</button></div><h3>'+stop+'</h3><p>Открой остановку на карте и проверь путь перед выездом.</p><a href="'+mapLink+'" target="_blank" rel="noopener">Открыть точку</a><h3>Подготовка</h3>'+checks.map((s,i)=>'<label class="switch"><input type="checkbox" data-check="'+i+'" '+(plan.checks.includes(i)?'checked':'')+'> '+s+'</label>').join('');
 const airport=['auto','pin'].includes(state.origin)?(regionOrigin()?cities[regionOrigin()][2]:''):baseOrigin()[2];
 const flights='https://www.google.com/travel/flights?q='+encodeURIComponent((airport?'Flights from '+airport+' to ':'Flights to ')+d.airport);
 const lodging='https://www.booking.com/searchresults.ru.html?ss='+encodeURIComponent(stops[0]);
 const directions='https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(tripMode==='car'?startQuery():stops[0])+'&destination='+encodeURIComponent(stops.at(-1))+'&waypoints='+encodeURIComponent(stops.slice(tripMode==='car'?0:1,-1).join('|'))+'&travelmode='+(tripMode==='train'?'transit':'driving');
 const transport=options(d).map(m=>'<button data-trip="'+m+'" class="'+(tripMode===m?'selected':'')+'">'+names[m]+'<small>'+price(d,m).text+' · '+travel(d,m)+'</small></button>').join('');
 const overview='<p class="destination-line">'+stops.join(' · ')+'</p><p>'+names[tripMode]+(actualOrigin()?' · ≈ '+p.text:'')+'</p><button class="action" data-choose>Хочу сюда</button><button class="action secondary" data-arrival-region="'+d.id+'">Кольца отсюда</button>'+(!actualOrigin()?'<button class="action secondary" data-set-origin>Маршрут отсюда</button>':'');
 const costs='<h3>≈ '+p.text+' на человека</h3><p>Дорога · '+euro(p.move)+'</p><p>Жильё и еда · '+euro(p.living)+'</p>'+(p.rental?'<p>Аренда · '+euro(p.rental)+'</p>':'')+'<p class="note">Модельная оценка, не тариф. Депозит и визовые сборы отдельно.</p><div class="route-options">'+transport+'</div><button class="action" data-stage="ready">Что понадобится</button>';
 const ready='<h3>Въезд · '+visaFor(d)+'</h3><a class="secondary" href="'+d.official+'" target="_blank" rel="noopener">Официальные условия</a>'+requirements().map((label,i)=>'<label class="switch"><input type="checkbox" data-requirement="'+i+'" '+(checkedRequirements.has(String(i))?'checked':'')+'> '+label+'</label>').join('')+'<p><a href="'+(['plane','rent'].includes(tripMode)?flights:directions)+'" target="_blank" rel="noopener">'+(['plane','rent'].includes(tripMode)?'Проверить перелёты':'Открыть в картах')+'</a><a class="secondary" href="'+lodging+'" target="_blank" rel="noopener">Найти жильё</a>'+(tripMode==='rent'?'<a class="secondary" href="https://www.rentalcars.com/" target="_blank" rel="noopener">Найти авто</a>':'')+'</p><button class="action" id="confirmRoute" data-confirm-route '+(checkedRequirements.size<requirements().length?'disabled':'')+'>Выбрать маршрут</button>';
 node.innerHTML='<div class="cover photo" style="'+seasonPos(d.id)+'--px:'+((d.id%4)/3*100)+'%;--py:'+(Math.floor(d.id/4)*50)+'%"><button class="close" data-close aria-label="Закрыть">×</button></div><div class="panel"><span class="badge">'+d.country+' · '+n+' дн.</span><h2>'+d.name+'</h2>'+(tab==='plan'?'':steps())+({plan:overview,price:costs,ready,today,chosen:'<h3>Поездка сохранена</h3><button class="action" data-arrival-region="'+d.id+'">Отметить, куда приеду</button><p>'+stops.join(' · ')+'</p><button class="action secondary" data-stage="ready">Что взять и проверить</button><button class="action secondary" data-stage="today">Что делать по дням</button>'}[tab])+''+'</div>';

}
const northernNotes={
 winter:[[35,'Горнолыжный отдых'],[36,'Горнолыжный отдых'],[37,'Зимние горы'],[16,'Музеи и архитектура']],
 spring:[[33,'Прогулка у воды'],[39,'Архитектура и история'],[1,'Павильоны и выставки'],[18,'Музеи и архитектура']],
 summer:[[9,'Островная архитектура'],[45,'Озеро и прогулки'],[13,'Побережье Баренцева моря'],[11,'Прогулка по горному парку']],
 autumn:[[11,'Каньон и прогулка по парку'],[16,'Исторический центр и музеи'],[2,'Музей-заповедник'],[18,'Кремль и музейные коллекции']]
};
function seasonalChoices(){
 const month=state.seasonMode==='now'?new Date().getMonth()+1:{winter:1,spring:4,summer:7,autumn:10}[state.season];
 const choices=data.filter(d=>popularity.allows('d'+d.id)&&d.from<=month&&month<=d.to).map(d=>({name:d.name,key:'open',id:d.id,why:d.tag,km:distance(d)}));
 for(const [i,why] of northernNotes[state.season]){
  if(!popularity.allows('p'+i))continue;
  const [name,,lon,lat]=russianPlaces[i];choices.push({name,key:'city',id:russianStart+i,why,km:kmBetween(baseOrigin(),[lat,lon])});
 }
 return choices.sort((a,b)=>actualOrigin()?a.km-b.km:0);
}
function updateSeasonPanel(){
 const now=state.seasonMode==='now',day=new Intl.DateTimeFormat(document.documentElement.lang,{day:'numeric',month:'long'}).format(new Date());
 $('seasonDate').textContent=now?'На '+day:'Подборка сезона';
 const list=seasonalChoices().map(p=>({...p,pic:p.key==='city'?placeMedia['p'+(p.id-russianStart)]?.[1]:null})).filter(p=>p.pic||p.key==='open');
 for(let i=0;i<catalogue.length;i++){
  const [id,name,,,kind,,photo]=catalogue[i],rank=popularity.score(id),pic=photo||placeMedia[id]?.[1];
  if(pic&&rank>=Math.max(6,popularity.minimum))list.push({key:'site',id:i,name,pic,why:({Natural:'Природа',Cultural:'Культура',Mixed:'Наследие'})[kind]||kind});
 }
 for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[j],list[i]]=[list[i],list[j]]}
 $('seasonList').innerHTML=list.slice(0,10).map(p=>'<button data-'+p.key+'="'+p.id+'">'+(p.pic?'<img loading="lazy" alt="" src="'+safe(p.pic)+'">':photo(data[p.id],'idea-img'))+'<strong>'+safe(p.name)+'</strong><small>'+safe(p.why)+'</small></button>').join('')||'<p>Нет мест для выбранных фильтров.</p>';
}
const knownYandex={'Горный парк Рускеала':'166151252559','Ростовский кремль':'56729512994','Ипатьевский монастырь':'1029487485','Коломенское':'129437528946'};
function reviews(name,lat,lon){
 const q=encodeURIComponent(name),google=googleScores[name],ya=knownYandex[name];
 const googleUrl='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+' '+lat+','+lon);
 const yaUrl=ya?'https://yandex.ru/maps/org/'+ya+'/reviews/':'https://yandex.ru/maps/?ll='+lon+'%2C'+lat+'&z=14&text='+q;
 return '<section class="review-links"><h3>Оценки места</h3><a target="_blank" rel="noopener" href="'+googleUrl+'">Google Карты <b>'+(google?'★ '+google[0]:'Отзывы ↗')+'</b></a><a target="_blank" rel="noopener" href="'+yaUrl+'">Яндекс Карты <b>'+(name==='Горный парк Рускеала'||name==='Ипатьевский монастырь'||name==='Ростовский кремль'?'★ 5,0':'Отзывы ↗')+'</b></a>'+(ya?'<iframe title="Рейтинг Яндекса" loading="lazy" src="https://yandex.ru/sprav/widget/rating-badge/'+ya+'"></iframe>':'')+(google?'<small>Google · <a target="_blank" rel="noopener" href="'+google[1]+'">снимок Wanderlog</a></small>':'')+'</section>';
}
const catalogue=[...heritage,...regionalSites];
const geoIndex=new Map();
for(let i=0;i<catalogue.length;i++){
 const row=catalogue[i],k=Math.floor(row[2]/5)+','+Math.floor(row[3]/5);
 if(!geoIndex.has(k))geoIndex.set(k,[]);geoIndex.get(k).push(i);
}
function nearbyCatalogue(at,z){
 if(viewingSaved||picking)return '';
 const w=map.clientWidth,h=map.clientHeight,bounds=atlas.getBounds(),cells=new Map();
 const step=z<4?62:z<6?54:45,minimum=popularity.minimum;
 const west=Math.max(-180,bounds.getWest()),east=Math.min(180,bounds.getEast());
 for(let a=Math.floor(west/5);a<=Math.floor(east/5);a++)for(let b=Math.floor(Math.max(-90,bounds.getSouth())/5);b<=Math.floor(Math.min(90,bounds.getNorth())/5);b++){
  for(const i of geoIndex.get(a+','+b)||[]){
   const [id,,lon,lat,,,img]=catalogue[i],score=popularity.score(id);
   if(score<minimum)continue;
   const p=atlas.project([lon,lat]);if(p.x<0||p.y<0||p.x>w||p.y>h)continue;
   const cell=Math.floor(p.x/step)+','+Math.floor(p.y/step);
   const rank=score*2+Number(Boolean(img||placeMedia[id]?.[1]));
   if(!cells.has(cell)||rank>cells.get(cell).rank)cells.set(cell,{i,rank,x:p.x,y:p.y});
  }
 }
 const out=[],photos=[];
 for(const {i,x,y,rank} of [...cells.values()].sort((a,b)=>b.rank-a.rank)){
  const [id,name,lon,lat,,,img]=catalogue[i],photo=img||placeMedia[id]?.[1];
  const gap=z<5?118:z<7?88:64;
  const show=(z>=4.5||rank>0)&&photos.length<(z<5?12:26)&&photos.every(p=>Math.hypot(x-p.x,y-p.y)>gap);
  if(show)photos.push({x,y});
  const title=safe(name+(show&&!photo?' · вид со спутника':''));
  const size=Math.min(43,Math.round(21+Math.max(0,z-3)*3+Math.min(5,rank)));
  out.push('<button class="catalog-pin'+(show?' visual':'')+'" style="--size:'+size+'px" title="'+title+'" aria-label="'+title+'" data-site="'+i+'"'+at(lat,lon)+'>'+(show?'<img alt="" loading="lazy" decoding="async" src="'+safe(photo||aerial(lon,lat,80))+'" data-aerial="'+safe(aerial(lon,lat,80))+'">':'')+'</button>');
 }
 return out.join('');
}
let siteLine=null;
async function showSiteDrive(lat,lon){
 siteLine=null;paintRoute();
 const panel=$('landmark').querySelector('.panel'),el=document.createElement('div');el.className='site-drive';panel.querySelector('.action').before(el);
 const origin=actualOrigin();if(!origin){el.textContent='Поставь старт для расчёта дороги';return}
 el.textContent='Ищем подъезд по дорогам…';
 try{
  const {path,waypoints}=await osrmPath([{lat:origin[0],lon:origin[1]},{lat,lon}],false,15000);
  if(!el.isConnected||$('landmark').hidden)return;
  const country=countryAt(origin[0],origin[1]);
  if(!domesticPath(country,path.geometry.coordinates))throw Error();
  const gap=Math.round(waypoints.at(-1).distance||0),startGap=Math.round(waypoints[0].distance||0);
  el.textContent=Math.round(path.distance/1000)+' км · '+hours(path.duration)+(gap>50?' · от дороги до места '+gap+' м':'')+(startGap>100?' · от старта до дороги '+startGap+' м':'');
  siteLine={el,line:path.geometry.coordinates};paintRoute();
  const button=document.createElement('button');button.textContent='Показать весь путь';button.onclick=()=>{const b=new (window.maplibregl?.LngLatBounds||OfflineBounds)();for(const pt of path.geometry.coordinates)b.extend(pt);atlas.fitBounds(b,{padding:innerWidth>760?{left:45,right:390,top:180,bottom:55}:48,maxZoom:12})};el.append(button);
 }catch{if(el.isConnected)el.textContent='Подъезд от старта не подтверждён. Можно посмотреть дороги рядом.'}
}
function openCatalogue(i){
 const [id,name,lon,lat,cat,country,img,credit]=catalogue[i];if(pointChoice(lat,lon,name))return;
 if(building)leaveTrip();active=null;clearRoute();setDrawer(false);$('detail').hidden=true;$('nearby').hidden=true;$('portal').hidden=true;
 const isGeo=id.startsWith('g'),isOsm=id.startsWith('osm:'),source=isGeo?'GeoNames':isOsm?'OpenStreetMap':'ЮНЕСКО';
 const url=isGeo?'https://www.geonames.org/'+id.slice(1):isOsm?'https://www.openstreetmap.org/'+id.slice(4):'https://whc.unesco.org/en/list/'+id+'/';
 const box=$('landmark');box.innerHTML='<div class="panel"><button class="close" data-landmark-close aria-label="Закрыть">×</button><small>'+safe(({Cultural:'Культурное наследие',Natural:'Природное наследие',Mixed:'Всемирное наследие'})[cat]||cat)+'</small><h2>'+safe(name)+'</h2>'+photoFigure(id,name,lon,lat,img,credit)+'<button class="action" data-stage-site="'+i+'">Кольца отсюда</button>'+reviews(name,lat,lon)+'<a target="_blank" rel="noopener" href="'+url+'">'+source+' ↗</a></div>';box.hidden=false;

 showSiteDrive(lat,lon);
 flyTo([lat,lon],Math.max(atlas.getZoom(),7));
}

const map=$('map'), pinLayer=$('pins');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let lastMarkerZoom=-1;
let atlas=null, tier=-1, markerFrame=0;
const lngLat=([lat,lon])=>[lon,lat];
const scaleTier=z=>z<4?0:z<6?1:z<8?2:3;
const flying=()=>mode==='plane'||mode==='rent';
const hubCodes=Object.keys(airports).filter(k=>airports[k][3].length).sort((a,b)=>airports[b][3].length-airports[a][3].length);
let preferredAirport=null;
let flightCache={key:null,from:null,points:[]}, airportSelection=null;
function flightNetwork(){
 const origin=actualOrigin(),key=(origin?.slice(0,2).join(',')||'')+'|'+(preferredAirport||'');
 if(flightCache.key===key)return flightCache;
 let from=null,best=250;
 if(origin)for(const code of hubCodes){
  const [,x,y]=airports[code],km=kmBetween(origin,[y,x]);
  if(km<best){best=km;from=code}
 }
 if(origin&&preferredAirport&&airports[preferredAirport]){
  const [,lon,lat]=airports[preferredAirport];if(kmBetween(origin,[lat,lon])<=250)from=preferredAirport;
 }
 const candidates=from?airports[from][3].filter(code=>airports[code]):origin?[]:hubCodes;
 const points=candidates.map(code=>{
  const [name,x,y,routes]=airports[code];
  return {code,name,x,y,km:origin?kmBetween(origin,[y,x]):0,degree:routes.length};
 }).sort((a,b)=>origin?b.km-a.km:b.degree-a.degree);
 flightCache={key,from,points};return flightCache;
}
function localAccess(id,lon,lat){
 if(mode!=='car'&&mode!=='train')return true;
 const car=mode==='car',near=siteAccess[id][car?0:1];
 return near<=(car?40:18)&&(!actualOrigin()||kmBetween(actualOrigin(),[lat,lon])<=(car?1600:3600));
}
function airChoices(){
 const chosen=[],cells=new Set(),network=flightNetwork();
 for(const p of network.points){
  const cell=Math.floor(p.x/12)+','+Math.floor(p.y/9);
  if(!cells.has(cell)){cells.add(cell);chosen.push(p)}
  if(chosen.length===18)break;
 }
 return chosen;
}
function flightArc(from,p){
 const [,x,y]=airports[from],dx=((p.x-x+540)%360)-180;
 const lift=Math.min(13,Math.abs(dx)*.16+Math.abs(p.y-y)*.08);
 return Array.from({length:33},(_,i)=>{
  const t=i/32;return [x+dx*t,y+(p.y-y)*t+lift*4*t*(1-t)];
 });
}
function wrappedParts(line){
 const parts=[[]];
 for(const [raw,lat] of line){
  const lon=((raw+540)%360)-180,part=parts.at(-1),prev=part.at(-1);
  if(prev&&Math.abs(lon-prev[0])>180){
   const edge=prev[0]>0?180:-180,delta=lon+(edge>0?360:-360)-prev[0];
   const y=prev[1]+(lat-prev[1])*(edge-prev[0])/delta;
   part.push([edge,y]);parts.push([[-edge,y]]);
  }
  parts.at(-1).push([lon,lat]);
 }
 return parts;
}
function transportGeometry(){
 if(mode==='train')return typeof railLines==='undefined'?[]:railLines;
 if(flying()&&flightNetwork().from){
  const {from,points}=flightNetwork(),choices=airChoices();
  const selected=points.find(p=>p.code===airportSelection);
  if(selected&&!choices.some(p=>p.code===selected.code))choices.push(selected);
  return choices.flatMap(p=>wrappedParts(flightArc(from,p)));
 }
 return [];
}
let railRequested=false;
let requestModeNetwork=()=>{
 if(mode!=='train'||railRequested||typeof railLines!=='undefined')return;
 railRequested=true;
 const script=document.createElement('script');script.src='assets/rail.js';
 script.onload=()=>{if(mode==='train')applyTransportLayer()};
 script.onerror=()=>{railRequested=false};document.head.append(script);
};
function applyTransportLayer(){
 updateVisaMap();
 if(state.showRoads||mode!=='plane')requestModeNetwork();
 if(!atlas)return;
 if(canvas){canvas.draw();return}
 if(!atlas.getStyle()?.layers)return;
 const roadId='road-emphasis',transport=atlas.getStyle().layers.find(l=>l['source-layer']==='transportation');
 if(state.showRoads&&transport&&!atlas.getLayer(roadId)){
  const before=atlas.getStyle().layers.find(l=>l.type==='symbol');
  atlas.addLayer({id:roadId,type:'line',source:transport.source,'source-layer':'transportation',filter:['in','class','motorway','trunk','primary','secondary','tertiary','minor','service','track'],paint:{'line-color':'#b6aa92','line-opacity':.68,'line-width':['interpolate',['linear'],['zoom'],4,.65,9,1.25,15,2.6]}},before?.id);
 }
 if(atlas.getLayer(roadId))atlas.setLayoutProperty(roadId,'visibility',state.showRoads?'visible':'none');
 const id='transport-network';
 if(atlas.getLayer(id))atlas.removeLayer(id);
 if(atlas.getSource(id))atlas.removeSource(id);
 const lines=transportGeometry();
 if(lines.length){
  atlas.addSource(id,{type:'geojson',data:{type:'Feature',properties:{},geometry:{type:'MultiLineString',coordinates:lines}}});
  atlas.addLayer({id,type:'line',source:id,paint:{'line-color':mode==='train'?'#c6a57e':'#7eaebf','line-opacity':.74,'line-width':mode==='train'?1.25:1.1}});
 }
 for(const layer of atlas.getStyle().layers){
  if(layer.id===roadId||layer.type!=='line'||layer['source-layer']!=='transportation')continue;
  if(!savedLinePaint.has(layer.id))savedLinePaint.set(layer.id,layer.paint?.['line-opacity']??1);
  atlas.setPaintProperty(layer.id,'line-opacity',mode==='plane'?.14:mode==='train'?.32:savedLinePaint.get(layer.id));
 }
}
const savedLinePaint=new Map();
function airportPins(at,z){
 const network=flightNetwork(),nodes=[],boxes=[];
 const candidates=z<3.7?airChoices():network.points;
 for(const p of candidates){
  const {x,y}=atlas.project([p.x,p.y]);
  if(x<0||y<45||x>map.clientWidth||y>map.clientHeight-15)continue;
  if(boxes.some(b=>Math.abs(x-b.x)<(z<3.7?95:58)&&Math.abs(y-b.y)<28))continue;
  boxes.push({x,y});
  nodes.push('<button class="airport-pin" data-airport="'+p.code+'" aria-label="'+safe(p.name)+' · '+p.code+'"'+at(p.y,p.x)+'>'+safe(z<3.7?p.name:p.code)+'</button>');
 }
 if(network.from){const [name,x,y]=airports[network.from];nodes.push('<button class="airport-pin departure" data-airport="'+network.from+'" aria-label="Вылет · '+safe(name)+'"'+at(y,x)+'>'+network.from+' ↗</button>')}
 return nodes.join('');
}
function airportCard(){
 const items=airChoices(),p=items.find(x=>x.code===airportSelection)||items[0];
 if(!p)return '<button class="air-summary" data-set-origin>Выбрать другую точку старта</button>';
 airportSelection=p.code;
 return '<button class="air-summary" data-airport="'+p.code+'"><span class="iata">'+p.code+'</span><span><small>'+ (flightNetwork().from?'Из '+flightNetwork().from:'Аэропорт')+'</small><strong>'+safe(p.name)+'</strong><small>'+(p.km?'≈ '+Math.round(p.km).toLocaleString('ru')+' км по прямой':'Выбрать направление')+'</small></span></button>';
}
function openAirport(code){
 const [city,x,y]=airports[code],from=flightNetwork().from;
 if(pointChoice(y,x,city))return;
 const canDepart=!actualOrigin()||kmBetween(actualOrigin(),[y,x])<=250;
 airportSelection=code;active=null;setDrawer(false);render();applyTransportLayer();$('nearby').hidden=true;$('portal').hidden=true;
 const q=encodeURIComponent('Flights '+(from&&from!==code?'from '+from+' ':'')+'to '+code);
 $('landmark').innerHTML='<div class="panel"><button class="close" data-landmark-close aria-label="Закрыть">×</button><span class="badge">'+code+'</span><h2>'+safe(city)+'</h2><p class="note">'+(from&&from!==code?from+' → '+code+' · ':'')+'Схема направлений на 25.09.2026. Проверь рейсы на свои даты.</p><a href="https://www.google.com/travel/flights?q='+q+'" target="_blank" rel="noopener">Проверить перелёты</a><button class="action secondary" data-air-stage="'+code+'">'+(mode==='rent'?'Собрать маршрут на авто':'Исследовать рядом')+'</button>'+(canDepart&&code!==from?'<button class="action secondary" data-depart="'+code+'">Вылетать отсюда</button>':'')+'<p><a class="secondary" href="https://github.com/Jonty/airline-route-data" target="_blank" rel="noopener">Источник направлений</a></p></div>';
 $('landmark').querySelector('h2').insertAdjacentHTML('afterend',photoFigure('',city,x,y)+entryInfo(visaData.iso2[countryAt(y,x)]));
 $('landmark').hidden=false;flyTo([y,x],5.7);
}
function fitTransport(){
 if(mode==='car'&&activeDrive()){frameDrive(activeDrive());return}
 if(mode==='all'){fit();return}
 const origin=actualOrigin(),bounds=new (window.maplibregl?.LngLatBounds||OfflineBounds)();
 const places=flying()?airChoices().map(p=>[p.x,p.y]):[
  ...visible.map(d=>[d.lon,d.lat]),
  ...russianPlaces.filter(([,,x,y],i)=>localAccess(i+12,x,y)).map(([,,x,y])=>[x,y])
 ];
 if(origin)places.push(lngLat(origin));
 if(!places.length)return;
 if(places.length===1){flyTo([places[0][1],places[0][0]],4);return}
 places.forEach(p=>bounds.extend(p));
 atlas.fitBounds(bounds,{padding:{left:50,right:50,top:130,bottom:110},maxZoom:5,duration:reduced.matches?0:550});
}
function pickTransport(button){
 const stayInLoop=loopView.open&&button.dataset.mode==='car';
 if(loopView.open&&!stayInLoop)closeLoops();
 if(building)leaveTrip();
 mode=button.dataset.mode;document.body.dataset.transport=mode;
 $('modes').querySelectorAll('button').forEach(el=>{el.classList.toggle('selected',el===button);el.setAttribute('aria-pressed',String(el===button))});
 if(stayInLoop){applyTransportLayer();return}
 active=null;airportSelection=null;storyId=-1;viewingSaved=false;
 closeLandmark();setDrawer(false);$('portal').hidden=true;render();applyTransportLayer();fitTransport();
}

let pinAnchor=null;
function positionPins(){
 if(!atlas)return;
 pinLayer.style.transform='';
 pinAnchor={center:atlas.getCenter(),zoom:atlas.getZoom()};
 for(const node of pinLayer.children){
  const point=node.mapPoint??=node.dataset.at.split(',').map(Number);
  const {x,y}=atlas.project(point);
  node.style.transform='translate('+x+'px,'+y+'px)';
 }
}
function renderPins(){
 if(!atlas)return;window.refreshPhoneMap?.();
 const zoom=atlas.getZoom();
 tier=scaleTier(zoom);lastMarkerZoom=Math.round(zoom*5);
 const at=(lat,lon)=>' data-at="'+lon+','+lat+'"';
 if(loopView.open&&!loopView.picking){pinLayer.innerHTML=loopMarkers(at);positionPins();return}
 if(building&&!pickStage){
  pinLayer.innerHTML=stagePins(at);positionPins();return;
 }
 const groups=[],minorDots=[];
 for(const d of visible){
  if(flying()&&tier<2&&!viewingSaved)continue;
  if(!viewingSaved&&d!==active&&tier===0&&!major.has(d.id)){
   minorDots.push('<button class="landmark-mark landmark-small" style="--diameter:5px" data-open="'+d.id+'" title="'+d.name+'" aria-label="'+d.name+'"'+at(d.lat,d.lon)+'></button>');
   continue;
  }
  const {x,y}=atlas.project([d.lon,d.lat]);
  if(x<-100||x>map.clientWidth+100||y<0||y>map.clientHeight+100)continue;
  const group=groups.find(g=>tier<2&&Math.abs(g.x-x)<78&&Math.abs(g.y-y)<62&&active!==d&&!g.items.includes(active));
  if(group)group.items.push(d);else groups.push({x,y,items:[d]});
 }
 const used=new Set();
 const points=tier<2?[]:visible.flatMap(d=>landmarks[d.id].map((p,i)=>({d,p,i})));
 const pois=points.map(({d,p,i})=>{
  if(tier===2&&i!==0)return '';
  const [name,lat,lon]=p,{x,y}=atlas.project([lon,lat]);
  if(x<0||x>map.clientWidth||y<0||y>map.clientHeight)return '';
  const cell=Math.round(x/103)+':'+Math.round(y/29);
  if(used.has(cell))return '';
  used.add(cell);
  return '<button class="poi" data-poi="'+d.id+':'+i+'"'+at(lat,lon)+'><span>✦</span> '+name+'</button>';
 }).join('');
 $('zoomHint').textContent=['Главные направления','Все направления','Знаковые места','Локальные остановки'][tier];
 if(mode!=='all')$('zoomHint').textContent=flying()?(flightNetwork().from?'Из '+flightNetwork().from+' · прямые направления':(actualOrigin()?'Рядом нет аэропорта из каталога':'Аэропорты · выбери старт')):(mode==='train'?'Железные дороги · места рядом с путями':'Автодороги · места для поездки');
 const [slat,slon]=baseOrigin();
 const regions=groups;
 pinLayer.innerHTML=(actualOrigin()?'<span class="start" role="img" aria-label="Точка старта" title="'+originName()+'"'+at(slat,slon)+'></span>':'')+regions.map(({items})=>{
  const [d]=items;
  if(items.length>1)return '<button class="cluster" data-cluster="'+items.map(i=>i.id).join(',')+'" aria-label="'+items.length+' направления"'+at(d.lat,d.lon)+'>'+photo(d,'pin-photo')+'<b>'+items.length+'</b></button>';
  return '<button class="pin '+(active===d?'current':'')+'" data-open="'+d.id+'" aria-label="'+d.name+'"'+at(d.lat,d.lon)+'>'+photo(d,'pin-photo')+'<small>'+d.name+'</small></button>';
 }).join('')+minorDots.join('')+nearbyCatalogue(at,zoom)+pois+cityPins(at,regions)+(flying()?airportPins(at,zoom):'')+(!active&&!$('nearby').hidden&&driveShelf.current?driveShelf.current.places.map(([name,lat,lon],i)=>'<span class="drive-stop" aria-label="'+safe(name)+'"'+at(lat,lon)+'>'+ (i+1)+'</span>').join(''):'');

 positionPins();
}
// Append places so saved indices from earlier versions remain valid.
const russianStart=atlasCities.length;
atlasCities.push(...russianPlaces.map(([name,area,lon,lat])=>[name,area,lon,lat,0]));
const rankedCities=atlasCities.map((city,i)=>({city,i})).sort((a,b)=>b.city[4]-a.city[4]);
// Editorial prominence controls the zoom at which a landmark gains an image.
const panoramaAnchors=new Set([0,9,36,45,49,55,59]);
const regionalAnchors=new Set([5,13,15,16,23,29,32,35,39,41,46,53,58]);
function landmarkThreshold(index){
 if(panoramaAnchors.has(index))return 1;
 return regionalAnchors.has(index)?3.6:5.4;
}
const landmarkOrder=russianPlaces.map((_,index)=>index).sort((a,b)=>landmarkThreshold(a)-landmarkThreshold(b));
function landmarkPins(at,z,labels){
 const buttons=[];
 for(const index of landmarkOrder){
  if(!popularity.allows('p'+index))continue;
  const [name,,lon,lat]=russianPlaces[index],{x,y}=atlas.project([lon,lat]);
  if(x< -36||y< -36||x>map.clientWidth+36||y>map.clientHeight+36)continue;
  
  const threshold=landmarkThreshold(index);
  const growth=Math.max(0,Math.min(1,(z-threshold+.65)/1.4));
  const size=Math.round(4+growth*31+Math.min(9,Math.max(0,z-threshold-1)*3));
  const box={left:x-size/2-3,right:x+size/2+3,top:y-size/2-3,bottom:y+size/2+3};
  const show=size>8&&!labels.some(b=>box.left<b.right&&box.right>b.left&&box.top<b.bottom&&box.bottom>b.top);
  if(show)labels.push(box);
  const cell=index%30;
  buttons.push('<button class="landmark-mark '+(show?'landmark-large sheet-'+Math.floor(index/30):'landmark-small')+'" data-city="'+(russianStart+index)+'" title="'+name+'" aria-label="'+name+'"'+at(lat,lon)+' style="'+seasonPos(12+index)+'--diameter:'+(show?size:4+Math.min(3,z/2))+'px;--u:'+(cell%5*25)+'%;--v:'+(Math.floor(cell/5)*20)+'%"></button>');
 }
 return buttons.join('');
}
function cityPins(at,regions){
 if(viewingSaved||picking)return '';
 const z=atlas.getZoom(),labels=regions.map(({x,y})=>({left:x-26,right:x+26,top:y-48,bottom:y+5}));
 const entries=rankedCities.filter(e=>e.i<russianStart);
 const result=[landmarkPins(at,z,labels)];
 for(const {city:[name,,lon,lat,pop],i} of entries){
  if(!popularity.allows('c'+i))continue;
  const poi=i>=russianStart;
  if(flying()&&z<6)continue;
  if(!poi&&(z<3.5||z<5&&pop<1000000))continue;
  const {x,y}=atlas.project([lon,lat]);
  if(x<8||y<100||x>map.clientWidth-8||y>map.clientHeight-10)continue;
  const width=(poi?22:12)+name.length*7;
  const r={left:x-width/2-7,right:x+width/2+7,top:y-13,bottom:y+13};
  if(labels.some(b=>r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top)){
   if(poi)result.push('<button class="city-pin ru-dot" title="'+name+'" aria-label="'+name+'" data-city="'+i+'"'+at(lat,lon)+'></button>');
   continue;
  }
  labels.push(r);
  result.push('<button class="city-pin '+(poi?'ru-place':'')+'" data-city="'+i+'"'+at(lat,lon)+'>'+name+'</button>');
 }
 return result.join('');

}
function openCity(i){
 const [name,country,x,y]=atlasCities[i];
 if(pointChoice(y,x,name))return;
 if(building)leaveTrip();
 active=null;clearRoute();setDrawer(false);$('detail').hidden=true;$('nearby').hidden=true;$('portal').hidden=true;
 const box=$('landmark');
 box.innerHTML='<div class="panel"><button class="close" data-landmark-close aria-label="Закрыть">×</button><span class="badge">'+country+'</span><h2>'+name+'</h2><button class="action secondary" data-leg-city="'+i+'">Кольца отсюда</button><button class="action" data-city-save="'+i+'">'+((state.cityWishlist||[]).includes(i)?'В поездках':'Хочу сюда')+'</button><a class="secondary" target="_blank" rel="noopener" href="https://www.openstreetmap.org/#map=15/'+y+'/'+x+'">Улицы и места рядом</a></div>';
 box.querySelector('.panel').insertAdjacentHTML('beforeend',reviews(name,y,x));
 const mediaKey=i>=russianStart?'p'+(i-russianStart):'c'+i;
 if(i<russianStart||placeMedia[mediaKey]?.[1])box.querySelector('h2').insertAdjacentHTML('afterend',photoFigure(mediaKey,name,x,y));
 else if(i>=russianStart){
  const index=i-russianStart,cell=index%30;
  box.insertAdjacentHTML('afterbegin','<div class="landmark-cover sheet-'+Math.floor(index/30)+'" role="img" aria-label="Иллюстрация места" style="'+seasonPos(12+index)+'--u:'+(cell%5*25)+'%;--v:'+(Math.floor(cell/5)*20)+'%"></div>');
 }
 box.hidden=false;
 if(i>=russianStart)flyTo([y,x],6);
}
function fit(duration=reduced.matches?0:650){
 if(!atlas)return;
 const points=visible.map(d=>[d.lon,d.lat]);
 if(!points.length)return;
 if(points.length===1){flyTo([points[0][1],points[0][0]],5);return}
 const bounds=new (window.maplibregl?.LngLatBounds||OfflineBounds)();
 for(const p of points)bounds.extend(p);
 atlas.fitBounds(bounds,{padding:{left:60,right:60,top:125,bottom:100},maxZoom:5,duration});
}
async function loadDetailedMap(){
 const button=$('mapDetail'),status=$('mapStatus'),target=$('onlineMap');
 button.disabled=true;button.textContent='Загрузка…';
 const previous=atlas;
 let detailed;
 try{
  target.hidden=false;
  const center=previous?.getCenter()||{lng:18,lat:51};
  detailed=new maplibregl.Map({container:target,style:'https://tiles.openfreemap.org/styles/dark',center:[center.lng,center.lat],zoom:previous?.getZoom()??3,minZoom:1.5,maxZoom:17,renderWorldCopies:false,attributionControl:false,pitch:0,bearing:0,minPitch:0,maxPitch:0,dragRotate:false,pitchWithRotate:false,touchPitch:false,canvasContextAttributes:{antialias:false}});
  if(!previous){
   atlas=detailed;target.classList.add('loaded');$('tiles').hidden=true;pinLayer.style.visibility='hidden';
   status.hidden=false;status.textContent='Загружаем карту…';button.hidden=true;
  }
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Timeout')),18000);
   detailed.once('load',()=>{clearTimeout(timer);resolve()});
   detailed.on('error',e=>{if(!e.sourceId&&!detailed.getStyle()?.layers){clearTimeout(timer);reject(e.error)}});
  });
 }catch{
  const center=detailed?.getCenter(),zoom=detailed?.getZoom();
  pinLayer.style.visibility='';detailed?.remove();target.hidden=true;target.classList.remove('loaded');$('tiles').hidden=false;
  if(!previous){atlas=null;bootOffline();if(center)atlas.jumpTo({center:[center.lng,center.lat],zoom})}
  status.hidden=false;status.textContent='Обзорная карта · Natural Earth';
  button.hidden=false;button.disabled=false;button.textContent='Детальная карта';return;
 }
 if(previous){const c=previous.getCenter();detailed.jumpTo({center:[c.lng,c.lat],zoom:previous.getZoom()})}
 atlas=detailed;canvas=null;pinLayer.style.transform='';pinLayer.style.visibility='';
 $('tiles').hidden=true;target.classList.add('loaded');
 status.hidden=true;button.hidden=true;
 detailed.touchZoomRotate.disableRotation();detailed.keyboard.disableRotation();
 for(const layer of detailed.getStyle().layers){
  if(layer.type==='fill-extrusion')detailed.setLayoutProperty(layer.id,'visibility','none');
  if(layer.type==='line'&&layer['source-layer']==='boundary'&&JSON.stringify(layer.filter||[]).includes('admin_level')&&JSON.stringify(layer.filter).includes('2')){
   detailed.setPaintProperty(layer.id,'line-color','#72716f');detailed.setPaintProperty(layer.id,'line-opacity',.7);
  }
 }
 detailed.addControl(new maplibregl.AttributionControl({compact:true}),'bottom-right');
 detailed.on('click',e=>selectStart(e.lngLat));
 let lastWeatherPaint=0;
 detailed.on('move',()=>{
  if(!pinAnchor)return;
  const point=detailed.project(pinAnchor.center),dx=point.x-map.clientWidth/2,dy=point.y-map.clientHeight/2;
  const scale=2**(detailed.getZoom()-pinAnchor.zoom);
  if(Math.abs(dx)>map.clientWidth*.45||Math.abs(dy)>map.clientHeight*.45||scale>1.65||scale<.62){renderPins()}
  else pinLayer.style.transform='translate3d('+dx+'px,'+dy+'px,0) scale('+scale+')';
  const now=performance.now();if(now-lastWeatherPaint>100){lastWeatherPaint=now;window.temperatureLayer?.paint()}
 });
 detailed.on('moveend',()=>{renderPins();window.temperatureLayer?.refresh()});window.temperatureLayer?.refresh();
 applyTransportLayer();renderPins();paintRoute();
}
$('mapDetail').onclick=loadDetailedMap;
$('plus').onclick=()=>atlas?.zoomIn({duration:reduced.matches?0:230});
$('minus').onclick=()=>atlas?.zoomOut({duration:reduced.matches?0:230});
$('fit').onclick=()=>{ if(actualOrigin()&&!picking)$('portal').hidden=true;fit() };
function limitChips(name,title,values,unit){
 const current=String(state[name]||'');if(current&&!values.includes(current))values.push(current);
 return '<fieldset class="limit-chips"><legend>'+title+'</legend>'+values.map(v=>'<label><input type="radio" name="'+name+'" value="'+safe(v)+'" '+(v===current?'checked':'')+'><span>'+(v?safe(v)+' '+unit:'Без лимита')+'</span></label>').join('')+'</fieldset>';
}
function showProfile(){
 $('dialog').innerHTML='<form class="panel" id="profileForm"><button type="button" class="close" data-dialog-close aria-label="Закрыть">×</button><h2>Профиль путешественника</h2><p>Настройки для визовой карты и роад-трипов. Сохраняются на этом устройстве.</p><label>СТРАНА ПАСПОРТА<select name="passport"><option value="">Не указан</option>'+entryOptions()+'</select></label><details id="secondPassport" '+(state.passport2?'open':'')+'><summary>Второй паспорт</summary><label>Страна второго паспорта<select name="passport2"><option value="">Не указан</option>'+entryOptions()+'</select></label></details><label>ЧТО ХОЧЕТСЯ УВИДЕТЬ<select name="taste"><option>Природа</option><option>Роад-трип</option><option>Город</option></select></label>'+limitChips('drive','Время за рулём в день',['2','3','4','5','6','8'],'ч')+limitChips('driveKm','Расстояние в день',['','100','200','300','500','700'],'км')+'<button class="action">Сохранить профиль</button></form>';
 const form=$('profileForm');
 for(const key of ['passport','passport2','taste','drive','driveKm'])form.elements[key].value=state[key]||'';
 if(!visaIndexes.has(state.passport))form.elements.passport.value='';
 form.onchange=()=>form.elements.passport2.setCustomValidity('');
 form.onsubmit=e=>{e.preventDefault();
 if(form.elements.passport2.value&&(!form.elements.passport.value||form.elements.passport.value===form.elements.passport2.value)){form.elements.passport2.setCustomValidity('Укажи два разных паспорта');form.elements.passport2.reportValidity();return}
 for(const key of ['passport','passport2','taste','drive','driveKm'])state[key]=form.elements[key].value;
 if(visaRequested&&state.passport){state.visaLayer=true;$('visaLegend').open=true}visaRequested=false;persist();$('dialog').close();$('visaResult').innerHTML=$('visaCountry').value?entryInfo($('visaCountry').value):'';updateVisaMap();canvas?.draw();if(loopView.open)drawLoopCard();else render();accountOffer()};
 if(!$('dialog').open)$('dialog').showModal();
}
function compare(){
 $('dialog').innerHTML='<div class="panel"><button class="close" data-dialog-close aria-label="Закрыть">×</button><h2>Сравнение поездок</h2><p>Оценка на человека по текущим фильтрам.</p><table><thead><tr><th>Место</th><th>В пути</th><th>Поездка</th></tr></thead><tbody>'+visible.map(d=>{
 const m=defaultMode(d);return '<tr><td>'+d.name+'<br><small>'+names[m]+' · '+tripDays(d)+' дн.</small></td><td>'+travel(d,m)+'</td><td>'+price(d,m).text+'</td></tr>';
 }).join('')+'</tbody></table></div>';
 $('dialog').showModal();
}
$('profile').onclick=showProfile;
$('dialog').addEventListener('close',()=>{visaRequested=false});
$('explore').onclick=()=>{const show=document.querySelector('aside').hidden||viewingSaved;viewingSaved=false;setDrawer(show);render()};
$('saved').onclick=openAccountTrips;
$('filters').onsubmit=e=>e.preventDefault();
$('filters').onchange=e=>{
 if(e.target.id==='visa'&&$('visa').checked&&!state.passport){$('visa').checked=false;showProfile();return}
 if(e.target.id==='origin'){
  if($('origin').value==='pin'&&!state.point){beginPick();return}
  state.origin=$('origin').value;geoRequest++;persist();
  if(state.origin==='auto')requestLocation(true);else flyTo(baseOrigin(),4);
 }
 active=null;closeLandmark();render();if(e.target.id!=='origin')fit();else if(actualOrigin()){setDrawer(false);completeStart(actualOrigin(),4)}
};
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 const k=b.dataset;
 if(b.closest('#seasonList')){if(loopView.open)closeLoops();if(building)leaveTrip();$('seasonMenu').hidden=true;$('recommend').setAttribute('aria-expanded','false')}
 if(k.openLoops!==undefined){launchLoops();return}
 if(k.takeDrive!==undefined&&activeDrive()){takeDrive(activeDrive());return}
 if(k.site!==undefined)openCatalogue(+k.site);
 if(k.arrivalRegion!==undefined){const d=data[+k.arrivalRegion];launchLoops({name:d.name,lat:d.lat,lon:d.lon})}
 if(k.near!==undefined&&building){const p=localPlaces(itinerary.legs[selectedLeg])[+k.near];if(p)addStageStop(p);return}
 if(k.focusLeg!==undefined&&building){pickStop=false;selectedLeg=+k.focusLeg;enterTrip();return}
 if(k.stageSite!==undefined){const [,name,lon,lat]=catalogue[+k.stageSite];launchLoops({name,lat,lon})}
 if(k.city!==undefined)openCity(+k.city);
 if(k.citySave!==undefined){const i=+k.citySave;state.cityWishlist??=[];if(!state.cityWishlist.includes(i))state.cityWishlist.push(i);persist();const [name,,lon,lat]=atlasCities[i];saveAccountItem('city-'+i,{name,lat,lon});openCity(i)}

 if(k.mode)pickTransport(b);
 if(k.airport)openAirport(k.airport);
 if(k.depart){const [,x,y]=airports[k.depart];preferredAirport=k.depart;
  if(!actualOrigin()){state.point=[y,x];state.origin='pin';$('origin').value='pin';geoRequest++;gpsStatus='idle';persist()}
  closeLandmark();render();applyTransportLayer();fitTransport();
 }
 if(k.airStage){const [city,x,y]=airports[k.airStage];launchLoops({name:city,lat:y,lon:x})}
 if(k.open!==undefined)open(data[Number(k.open)]);
 if(k.save!==undefined)save(data[Number(k.save)]);
 if(k.cluster&&atlas){const pts=k.cluster.split(',').map(i=>data[Number(i)]);$('portal').hidden=true;flyTo([pts.reduce((a,d)=>a+d.lat,0)/pts.length,pts.reduce((a,d)=>a+d.lon,0)/pts.length],Math.max(4,atlas.getZoom()+1))}
 if(k.poi){const [id,i]=k.poi.split(':').map(Number),[name,lat,lon]=landmarks[id][i];if(!pointChoice(lat,lon,name))openLandmark(k.poi)}
 if(k.legCity!==undefined){const [name,,lon,lat]=atlasCities[+k.legCity];launchLoops({name,lat,lon})}
 if(k.legRegion!==undefined){const d=data[+k.legRegion];launchLoops({name:d.name,lat:d.lat,lon:d.lon})}
 if(k.landmarkClose!==undefined){closeLandmark();render()}
 if(k.region!==undefined)open(data[Number(k.region)]);
 if(k.regionZoom!==undefined){
  const d=data[Number(k.regionZoom)];
  lastLoopPoint={name:d.name,lat:d.lat,lon:d.lon};active=null;setDrawer(false);render();flyTo([d.lat,d.lon],8);
 }
 if(k.close!==undefined){active=null;render();fit()}
 if(k.setOrigin!==undefined){pendingDestination=active;showStart()}
 if(k.choose!==undefined&&active){saveAccountItem('place-'+active.id,{name:active.name,lat:active.lat,lon:active.lon});if(!state.saved.includes(active.id))state.saved.push(active.id);persist();tab='chosen';render()}
 if(k.trip){tripMode=k.trip;checkedRequirements.clear();renderDetail();drawRoute(false)}
 if(k.stage){tab=k.stage;renderDetail()}
 if(k.confirmRoute!==undefined&&active){saveAccountItem('place-'+active.id,{name:active.name,lat:active.lat,lon:active.lon});if(!state.saved.includes(active.id))state.saved.push(active.id);(state.plans[active.id]??={day:0,checks:[]}).transport=tripMode;tab='today';persist();render()}
 if(k.tab){tab=k.tab;renderDetail()}
 if(k.day&&active){const plan=state.plans[active.id]??={day:0,checks:[]};plan.day=Math.max(0,Math.min(plan.day,tripDays(active)-1)+Number(k.day));persist();renderDetail()}
 if(k.dialogClose!==undefined)$('dialog').close();
 if(b.id==='compare')compare();
});
$('detail').addEventListener('change',e=>{
 if(e.target.dataset.requirement!==undefined){const key=e.target.dataset.requirement;if(e.target.checked)checkedRequirements.add(key);else checkedRequirements.delete(key);$('confirmRoute').disabled=checkedRequirements.size<requirements().length;return}
 if(e.target.dataset.check===undefined||!active)return;
 const index=Number(e.target.dataset.check),plan=state.plans[active.id]??={day:0,checks:[]};
 plan.checks=e.target.checked?[...plan.checks,index]:plan.checks.filter(i=>i!==index);persist();
});
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape'||$('dialog').open)return;
 if(!$('seasonMenu').hidden){$('closeIdeas').click();return}
 if(loopView.open){closeLoops();return}
 if(picking){finishPick();return}
 if(!$('landmark').hidden){closeLandmark();return}
 if(active){active=null;render();return}
 setDrawer(false);
});

const major=new Set([0,1,2,4,6,9,10]);
const landmarks=[
 [['Сечеда',46.600,11.727],['Ортизеи',46.575,11.671],['Валь-ди-Фунес',46.644,11.719]],
 [['Хардангер-фьорд',60.293,6.264],['Эйдфьорд',60.467,7.071],['Восс',60.629,6.422]],
 [['Скоугафосс',63.532,-19.511],['Сельяландсфосс',63.616,-19.989],['Вик',63.419,-19.009]],
 [['Пику-ду-Ариейру',32.735,-16.928],['Сантана',32.802,-16.883],['Порту-Мониш',32.866,-17.171]],
 [['Султанахмет',41.006,28.977],['Галатская башня',41.025,28.974],['Ортакёй',41.048,29.027]],
 [['Гёреме',38.644,34.832],['Учхисар',38.630,34.806],['Долина Ихлара',38.249,34.305]],
 [['Степанцминда',42.657,44.643],['Гергетская церковь',42.663,44.620],['Ананаури',42.164,44.702]],
 [['Севанаванк',40.564,45.010],['Дилижан',40.740,44.863],['Ереван',40.181,44.513]],
 [['Светлогорск',54.944,20.155],['Янтарный',54.869,19.941],['Зеленоградск',54.960,20.474]],
 [['Рускеала',61.945,30.583],['Сортавала',61.704,30.690],['Приозерск',61.036,30.129]],
 [['Казанский кремль',55.799,49.105],['Старо-Татарская слобода',55.780,49.116],['Свияжск',55.770,48.660]],
 [['Красная Поляна',43.680,40.205],['Роза Хутор',43.674,40.297],['Сириус',43.415,39.944]]
];
function setDrawer(open){
 $('filters').hidden=false;$('drawerTitle').textContent=viewingSaved?'Поездки':'Направления';
 document.querySelector('aside').hidden=!open;
 if(open){active=null;$('detail').hidden=true;closeLandmark();}
 $('explore').setAttribute('aria-expanded',String(open));
 if(open&&!picking){$('portal').hidden=true;$('nearby').hidden=true;}
}
function updateProgress(){
 $('progress').value=state.discovered.length;
 $('progressText').textContent='Открыто '+state.discovered.length+' / '+data.length;
}
let toastTimer;
function markDiscovered(d){
 if(state.discovered.includes(d.id))return;
 state.discovered.push(d.id);persist();updateProgress();
 const toast=$('toast');toast.textContent=state.discovered.length===data.length?'Атлас пройден!':'✦ Открыто место · '+d.name;toast.hidden=false;
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,2500);
}
function closeLandmark(){$('landmark').hidden=true;if(siteLine){siteLine=null;paintRoute()}}
function openLandmark(key){
 const [id,i]=key.split(':').map(Number),d=data[id],[name,la,lo]=landmarks[id][i];
 active=null;setDrawer(false);render();markDiscovered(d);
 const link='https://www.google.com/maps/search/?api=1&query='+la+','+lo;
 $('landmark').innerHTML='<div class="panel"><button class="close" data-landmark-close aria-label="Закрыть">×</button><span class="badge">'+d.name+'</span><h2>'+name+'</h2><p>Остановка на маршруте по региону.</p><a href="'+link+'" target="_blank" rel="noopener">Открыть точку на карте</a><button class="action secondary" data-region="'+id+'">Весь маршрут</button></div>';
 $('landmark').querySelector('.panel').insertAdjacentHTML('beforeend',photoFigure('',name,lo,la)+reviews(name,la,lo));
 $('landmark').hidden=false;
}
function updateLocation(){
 const chosen=actualOrigin();
 $('locationText').textContent=gpsStatus==='pending'?'Ищем местоположение…':gpsStatus==='failed'&&!chosen?'Геолокация недоступна':chosen?'Старт · '+originName():'';
 $('location').hidden=!$('locationText').textContent;
 map.classList.toggle('locating',gpsStatus==='pending');
}
function flyTo(point,target){
 if(!atlas)return;
 const center=lngLat(point);
 if(reduced.matches){atlas.jumpTo({center,zoom:target});return}
 atlas.flyTo({center,zoom:target,speed:1.15,curve:1.2,maxDuration:1350});
}
function requestLocation(focus){
 if(!navigator.geolocation){gpsStatus='failed';updateLocation();$('startHint').textContent='Геопозиция недоступна. Поставь точку пипеткой.';return}
 const request=++geoRequest;
 gpsStatus='pending';updateLocation();
 navigator.geolocation.getCurrentPosition(
  ({coords})=>{
   if(request!==geoRequest)return;
   state.origin='auto';$('origin').value='auto';persist();
   gps=[coords.latitude,coords.longitude];gpsStatus='ready';
   if(focus){updateLocation();renderPins();flyTo(gps,9);return}
   if(loopView.open||building||lastLoopPoint){updateLocation();return}
   $('portal').hidden=true;completeStart(gps,focus?5:3.8)
  },
  ()=>{if(request!==geoRequest)return;gpsStatus='failed';updateLocation();$('startHint').textContent='Геопозиция недоступна. Поставь точку пипеткой.'},
  {enableHighAccuracy:false,timeout:9000,maximumAge:300000}
 );
}
let pendingDestination=null;
let picking=false, route=[], routeRequest=0, routeInfo='', canvas=null;
const checkedRequirements=new Set();
function showStart(){
 active=null;setDrawer(false);closeLandmark();$('portal').hidden=false;render();
}
function beginPick(){
 geoRequest++;gpsStatus='idle';showStart();picking=true;
 map.classList.add('picking');$('startTitle').textContent='Поставь точку старта';
 $('startHint').textContent='Нажми на нужное место на карте.';
 $('cancelPick').hidden=false;$('pickStart').hidden=true;
}
function finishPick(){
 picking=false;map.classList.remove('picking');
 $('startTitle').textContent='Откуда едем?';$('startHint').textContent='Поставь себя на карту, чтобы увидеть маршруты и цены.';
 $('cancelPick').hidden=true;$('pickStart').hidden=false;$('portal').hidden=!!actualOrigin();
}
function selectStart(point){
 if(loopView.open){if(loopView.picking)setLoopArea(point.lat,point.lng,'Точка прибытия');return}
 if((pickStop||pickStage)&&pointChoice(point.lat,point.lng,'Точка '+point.lat.toFixed(3)+', '+point.lng.toFixed(3)))return;
 if(!picking)return;
 lastLoopPoint={lat:point.lat,lon:point.lng,name:'Выбранная точка'};state.selectedDestination=lastLoopPoint;state.origin='pin';state.point=[point.lat,point.lng];$('origin').value='pin';
 persist();finishPick();
 if(mode==='car'){launchLoops(lastLoopPoint);return}
 completeStart(state.point,Math.max(4,atlas.getZoom()));
}
function completeStart(point,zoom){
 const destination=pendingDestination;pendingDestination=null;render();applyTransportLayer();
 if(!destination&&matchMedia('(max-width: 760px)').matches){if(!loopView.open&&!building)flyTo(point,Math.max(6,zoom));return}
 if(!destination&&activeDrive()){frameDrive(activeDrive());return}
 if(mode!=='all'&&!destination){fitTransport();return}
 if(destination&&visible.includes(destination)){open(destination);return}
 flyTo(point,zoom);
}
function requirements(){
 const checks=['Проверить условия въезда и пересадки'];
 if(tripMode==='rent')checks.push('Проверить права, карту, депозит и страховку');
 if(tripMode==='car')checks.push('Проверить документы на авто, платные дороги и парковки');
 if(['plane','rent','train'].includes(tripMode))checks.push('Проверить расписание и условия билета');
 return [...checks,'Выбрать ночёвки и проверить итоговую стоимость'];
}
function steps(){
 return '<div class="steps" aria-label="Шаги выбора">'+[['plan','Место'],['price','Бюджет'],['ready','Подготовка'],['today','В поездке']].map(([key,label])=>'<button data-stage="'+key+'" class="'+(tab===key?'selected':'')+'">'+label+'</button>').join('')+'</div>';
}
function paintRoute(){
 if(!atlas)return;
 if(canvas){canvas.draw();return}
 if(!atlas.isStyleLoaded())return;
 const features=(loopView.open?loopLine():building?drivingLines:previewLines()).filter(line=>line.length>1).map(line=>({type:'Feature',geometry:{type:'LineString',coordinates:line},properties:{}}));
 const content={type:'FeatureCollection',features};
 if(atlas.getSource('trip-route'))atlas.getSource('trip-route').setData(content);
 else {atlas.addSource('trip-route',{type:'geojson',data:content});atlas.addLayer({id:'trip-route',type:'line',source:'trip-route',paint:{'line-color':'#cbbaff','line-width':3,'line-dasharray':[2,1]}})}
}
function clearRoute(){if(!route.length)return;routeRequest++;route=[];routeInfo='';paintRoute()}
async function drawRoute(focus){
 const start=actualOrigin(),d=active;
 if(!start||!d)return;
 const serial=++routeRequest;
 const stops=tripMode==='rent'?landmarks[d.id].map(([,lat,lon])=>[lon,lat]):[];
 route=[lngLat(start),[d.lon,d.lat],...stops];
 routeInfo=tripMode==='car'?'Ищем маршрут по дорогам…':tripMode==='train'?'Линия направления · расписание поезда уточняется':'Линия направления · билеты и пересадки уточняются';
 paintRoute();renderDetail();
 if(focus&&atlas){
  const bounds=new (window.maplibregl?.LngLatBounds||OfflineBounds)();
  for(const p of route)bounds.extend(p);
  atlas.fitBounds(bounds,{padding:{top:150,bottom:105,left:65,right:innerWidth>700?390:65},maxZoom:9,duration:reduced.matches?0:550});
 }
 if(tripMode!=='car')return;
 const url='https://router.project-osrm.org/route/v1/driving/'+route.map(p=>p.map(n=>n.toFixed(4)).join(',')).join(';')+'?overview=simplified&geometries=geojson';
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(6500)});
  if(!response.ok)throw Error('route');
  const result=(await response.json()).routes?.[0];
  if(!result?.geometry?.coordinates?.length)throw Error('route');
  if(serial!==routeRequest)return;
  route=result.geometry.coordinates;
  routeInfo=Math.round(result.distance/1000)+' км по дорогам · '+Math.round(result.duration/360)/10+' ч в одну сторону';
 }catch{if(serial!==routeRequest)return;routeInfo='Прямая линия · дорожный маршрут сейчас недоступен'}
 paintRoute();renderDetail();
}
class OfflineBounds{
 constructor(){this.points=[]}
 extend(p){this.points.push(p)}
 getWest(){return Math.min(...this.points.map(p=>p[0]))}
 getEast(){return Math.max(...this.points.map(p=>p[0]))}
 getSouth(){return Math.min(...this.points.map(p=>p[1]))}
 getNorth(){return Math.max(...this.points.map(p=>p[1]))}
}
function bootOffline(){
 if(canvas)return;
 const previous=atlas?.getCenter?.();
 atlas?.remove?.();
 const target=$('tiles');
 const el=document.createElement('canvas');el.className='offline-map';target.replaceChildren(el);
 const ctx=el.getContext('2d');
 const landShape=new Path2D();
 for(const ring of worldBoundaries){
  landShape.moveTo(...ring[0]);
  for(const point of ring.slice(1))landShape.lineTo(...point);
  landShape.closePath();
 }
 // Batch the static road geometry into regional paths for cheap viewport culling.
 const buckets=new Map();
 function addPath(level,points){
  const key=[level,Math.floor(points[0][0]/8),Math.floor(points[0][1]/8)].join('/');
  if(!buckets.has(key))buckets.set(key,{path:new Path2D(),level,west:180,east:-180,south:90,north:-90});
  const b=buckets.get(key);
  points.forEach(([lon,lat],i)=>{
   if(i)b.path.lineTo(lon,lat);else b.path.moveTo(lon,lat);
   b.west=Math.min(b.west,lon);b.east=Math.max(b.east,lon);
   b.south=Math.min(b.south,lat);b.north=Math.max(b.north,lat);
  });
 }
 const networkLoads=new Map();
 function loadNetwork(kind){
  if(networkLoads.has(kind))return;
  networkLoads.set(kind,true);
  const script=document.createElement('script');script.src='assets/'+kind+'.js';
  script.onerror=()=>networkLoads.delete(kind);
  script.onload=()=>{
   const rows=kind==='rail'?railLines:atlasRoads;
   let index=0;
   function slice(){
    const until=performance.now()+5;
    while(index<rows.length&&performance.now()<until){
     const row=rows[index++];if(kind==='rail')addPath(3,row);else addPath(row[0],row[1]);
    }
    if(index<rows.length)setTimeout(slice,0);
    else if(canvas&&!moving)refresh();
    else if(!canvas&&kind==='rail'&&mode==='train')applyTransportLayer();
   }
   slice();
  };
  document.head.append(script);
 }
 const overviewImages=new Map();
 requestModeNetwork=()=>{
  if(!canvas||z>=5.8){loadNetwork(mode==='train'?'rail':'roads');if(state.showRoads)loadNetwork('roads');return}
  const key=mode==='train'&&!state.showRoads?'railways':'highways';if(overviewImages.has(key))return;
  const img=new Image();overviewImages.set(key,img);img.onload=()=>{if(canvas&&!moving)draw()};img.src='assets/'+key+'.webp';
 };

 let center=previous?[previous.lng,previous.lat]:[18,51], z=3, drag=null;
 let width=el.clientWidth,height=el.clientHeight;
 const scale=()=>2**z*1.5;
 const project=([lng,lat])=>({x:width/2+(lng-center[0])*scale(),y:height/2+(center[1]-lat)*scale()});
 const unproject=(x,y)=>({lng:Math.max(-180,Math.min(180,center[0]+(x-width/2)/scale())),lat:Math.max(-85,Math.min(85,center[1]-(y-height/2)/scale()))});
 let moving=false,frame=0,settle=0,anchor=null;
 function draw(){
  if(moving){refresh();return}
  width=el.clientWidth;height=el.clientHeight;
  const w=width,h=height,r=Math.min(2,devicePixelRatio||1);
  if(el.width!==Math.round(w*r)||el.height!==Math.round(h*r)){el.width=Math.round(w*r);el.height=Math.round(h*r)}
  ctx.setTransform(r,0,0,r,0,0);ctx.fillStyle='#070707';ctx.fillRect(0,0,w,h);
  ctx.save();
  ctx.translate(w/2-center[0]*scale(),h/2+center[1]*scale());
  ctx.scale(scale(),-scale());
  const tones={winter:['#15222b','#25282a'],spring:['#19252a','#262b24'],summer:['#1b292b','#352d25'],autumn:['#21242b','#332922']}[state.season];
  const gradient=ctx.createLinearGradient(0,80,0,20);
  gradient.addColorStop(0,tones[0]);gradient.addColorStop(1,tones[1]);
  ctx.fillStyle=gradient;ctx.strokeStyle='#686967';ctx.lineWidth=.9/scale();
  ctx.fill(landShape,'nonzero');ctx.stroke(landShape);
  const nw=unproject(0,0),se=unproject(w,h);
  paintOfflineVisa(ctx,nw,se);
  ctx.lineJoin='round';ctx.lineCap='round';
  const overview=overviewImages.get(mode==='train'&&!state.showRoads?'railways':'highways');
  if(z<5.8&&overview?.naturalWidth&&(state.showRoads||mode!=='plane')){
   ctx.save();ctx.scale(1,-1);ctx.globalAlpha=mode==='all'?.55:.86;ctx.drawImage(overview,-180,-90,360,180);ctx.restore();
  }
  if(z>=5.8)for(const b of buckets.values()){
   const rail=b.level===3;
   if(rail&&mode!=='train'||!rail&&!state.showRoads&&(mode==='plane'||mode==='train'))continue;
   if(!rail&&z<(mode==='car'?.9:1.35)+b.level*1.55||b.east<nw.lng||b.west>se.lng||b.north<se.lat||b.south>nw.lat)continue;
   ctx.strokeStyle=rail?'#bc9b74':state.showRoads?'#a2967e':(mode==='car'||mode==='rent'?['#b7aa94','#827b6e','#59574e']:['#797369','#595851','#484947'])[b.level];
   ctx.lineWidth=(rail?.95:b.level===0?1:.65)/scale();ctx.stroke(b.path);
  }
  if(flying()){
   ctx.strokeStyle='#719caa';ctx.lineWidth=.9/scale();ctx.globalAlpha=.8;
   for(const line of transportGeometry()){
    ctx.beginPath();ctx.moveTo(...line[0]);for(const pt of line.slice(1))ctx.lineTo(...pt);ctx.stroke();
   }
  }
  ctx.restore();
  ctx.fillStyle='#636363';ctx.font='11px system-ui';ctx.textAlign='center';
  const names=z<3?[[15,54,'ЕВРОПА'],[18,18,'АФРИКА'],[85,48,'АЗИЯ'],[-57,-15,'ЮЖНАЯ АМЕРИКА'],[-104,45,'СЕВЕРНАЯ АМЕРИКА']]:[[10.5,51,'Германия'],[2.5,46.5,'Франция'],[-4,40,'Испания'],[12,42,'Италия'],[19,52,'Польша'],[13,65,'Норвегия'],[16,62,'Швеция'],[26,64,'Финляндия'],[33,39,'Турция'],[-19,65,'Исландия'],[32,49,'Украина'],[51,56,'Россия'],[-2,54,'Великобритания']];
  for(const [lon,lat,name] of names){
   const {x,y}=project([lon,lat]);
   if(x>=0&&x<=w&&y>=0&&y<=h)ctx.fillText(name,x,y);
  }
  ctx.textAlign='start';
  for(const line of loopView.open?loopLine():building?drivingLines:previewLines()){
   if(line.length<2)continue;
   ctx.strokeStyle='#cbbaff';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();
   line.forEach((p,i)=>{const {x,y}=project(p);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)});
   ctx.stroke();ctx.setLineDash([]);
  }
 }
 function refresh(){
  if(!canvas)return;
  cancelAnimationFrame(frame);clearTimeout(settle);frame=0;moving=false;
  el.style.transform='';pinLayer.style.transform='';
  $('thermalCanvas').style.transform='';window.temperatureLayer?.refresh();draw();renderPins();anchor={center:[...center],zoom:z};
  if(state.showRoads||mode!=='plane')requestModeNetwork();

 }
 function animateGesture(){
  if(!canvas||!anchor)return;
  moving=true;clearTimeout(settle);settle=setTimeout(refresh,130);
  if(frame)return;
  frame=requestAnimationFrame(()=>{
   frame=0;if(!canvas)return;
   const factor=2**(z-anchor.zoom);
   const dx=(anchor.center[0]-center[0])*scale(),dy=(center[1]-anchor.center[1])*scale();
   if(Math.abs(dx)>width*.24||Math.abs(dy)>height*.24||factor<.72||factor>1.4){refresh();return}
   const transform='translate('+dx+'px,'+dy+'px) scale('+factor+')';
   el.style.transform=transform;pinLayer.style.transform=transform;$('thermalCanvas').style.transform=transform;
  });
 }
 atlas={
  getBounds:()=>({getWest:()=>unproject(0,0).lng,getEast:()=>unproject(width,height).lng,getNorth:()=>unproject(0,0).lat,getSouth:()=>unproject(width,height).lat}),getZoom:()=>z,getCenter:()=>({lng:center[0],lat:center[1]}),project,
  jumpTo(o){center=o.center;z=o.zoom;refresh()},
  flyTo(o){this.jumpTo(o)},
  zoomIn(){z=Math.min(14,z+1);refresh()},
  zoomOut(){z=Math.max(1,z-1);refresh()},
  fitBounds(b,o){
   const west=b.getWest(),east=b.getEast(),north=b.getNorth(),south=b.getSouth();
   center=[(west+east)/2,(north+south)/2];
   z=Math.max(1,Math.min(o.maxZoom,Math.log2(Math.min(Math.max(55,el.clientWidth-135)/Math.max(.1,east-west),Math.max(65,el.clientHeight-180)/Math.max(.1,north-south))/1.5)));refresh();
  }
 };
 canvas={draw};
 target.addEventListener('pointerdown',e=>{drag={x:(e.clientX-target.getBoundingClientRect().left),y:(e.clientY-target.getBoundingClientRect().top),center:[...center],moved:false};target.setPointerCapture(e.pointerId)});
 target.addEventListener('pointermove',e=>{
  if(!drag)return;
  const dx=(e.clientX-target.getBoundingClientRect().left)-drag.x,dy=(e.clientY-target.getBoundingClientRect().top)-drag.y;
  if(Math.hypot(dx,dy)>4)drag.moved=true;
  if(!drag.moved)return;
  center=[Math.max(-180,Math.min(180,drag.center[0]-dx/scale())),Math.max(-85,Math.min(85,drag.center[1]+dy/scale()))];animateGesture();
 });
 target.addEventListener('pointerup',e=>{if(drag&&!drag.moved)selectStart(unproject((e.clientX-target.getBoundingClientRect().left),(e.clientY-target.getBoundingClientRect().top)));drag=null});
 target.addEventListener('pointercancel',()=>{drag=null});

 target.addEventListener('wheel',e=>{
  e.preventDefault();
  const units=e.deltaMode===1?16:e.deltaMode===2?el.clientHeight:1;
  // Precision trackpads pan with two fingers and send ctrl+wheel for pinch.
  const precision=e.deltaMode===0&&(e.deltaX!==0||Math.abs(e.deltaY)<45);
  if(precision&&!e.ctrlKey&&!e.metaKey){
   center=[Math.max(-180,Math.min(180,center[0]+e.deltaX/scale())),Math.max(-85,Math.min(85,center[1]-e.deltaY/scale()))];
  }else{
   const p=unproject((e.clientX-target.getBoundingClientRect().left),(e.clientY-target.getBoundingClientRect().top));
   const sensitivity=e.ctrlKey?.018:.0028;
   z=Math.max(1,Math.min(14,z-Math.max(-150,Math.min(150,e.deltaY*units))*sensitivity));
   const q=unproject((e.clientX-target.getBoundingClientRect().left),(e.clientY-target.getBoundingClientRect().top));center=[center[0]+p.lng-q.lng,center[1]+p.lat-q.lat];
  }
  animateGesture();
 },{passive:false});
 new ResizeObserver(refresh).observe(target);
 const status=$('mapStatus');status.hidden=false;status.classList.add('fallback');
 status.textContent='Natural Earth · офлайн-карта';
 refresh();
}
$('moreIdeas').onclick=updateSeasonPanel;
$('closeIdeas').onclick=()=>{$('seasonMenu').hidden=true;$('recommend').setAttribute('aria-expanded','false')};
$('myPosition').onclick=()=>{if(picking)finishPick();requestLocation(true)};
$('manualOrigin').onclick=()=>{if(loopView.open)closeLoops();if(building)leaveTrip();beginPick()};
$('roadLayer').setAttribute('aria-pressed',String(!!state.showRoads));
$('roadLayer').onclick=()=>{state.showRoads=!state.showRoads;persist();$('roadLayer').setAttribute('aria-pressed',String(state.showRoads));applyTransportLayer()};

$('locate').onclick=()=>actualOrigin()?flyTo(actualOrigin(),5):showStart();
$('gpsStart').onclick=()=>{finishPick();$('portal').hidden=false;$('startHint').textContent='Запрашиваем геопозицию…';requestLocation(true)};
$('pickStart').onclick=beginPick;
$('cancelPick').onclick=finishPick;
$('closeDrawer').onclick=()=>{setDrawer(false);viewingSaved=false;if(!actualOrigin())showStart();else render()};
$('storyPrev').onclick=()=>browseStory(-1);
$('storyNext').onclick=()=>browseStory(1);
$('browseRussia').onclick=()=>{
 if(building||pickStage||pickStop)leaveTrip();
 viewingSaved=false;active=null;closeLandmark();setDrawer(true);render();
 $('drawerTitle').textContent='Места России';$('filters').hidden=true;
 $('resultTitle').textContent='Каталог мест';
 const entries=[...russianPlaces.map(([name,area],i)=>[name,area,'city',russianStart+i]),...catalogue.flatMap(([id,name,,,kind,country],i)=>country==='RU'?[[name,kind,'site',i]]:[])];
 $('cards').innerHTML='<input id="findRussia" type="search" aria-label="Найти место в России" placeholder="Название или тип места"><div id="placeResults"></div><button id="morePlaces" class="action secondary">Показать ещё</button>';
 let limit=60;
 function list(){
  const q=$('findRussia').value.trim().toLocaleLowerCase('ru'),filtered=entries.filter(e=>popularity.allows(e[2]==='site'?catalogue[e[3]][0]:'p'+(e[3]-russianStart))&&(!q||(e[0]+' '+e[1]).toLocaleLowerCase('ru').includes(q)));
  $('total').textContent=filtered.length.toLocaleString('ru')+' мест';
  $('placeResults').innerHTML=filtered.slice(0,limit).map(([n,k,key,i])=>'<button class="ru-row" data-'+key+'="'+i+'"><strong>'+safe(n)+'</strong><span>'+safe(k)+'</span></button>').join('');
  $('morePlaces').hidden=limit>=filtered.length;
 }
 $('findRussia').oninput=()=>{limit=60;list()};$('morePlaces').onclick=()=>{limit+=60;list()};list();
 const bounds=new (window.maplibregl?.LngLatBounds||OfflineBounds)();for(const [,,x,y] of russianPlaces)bounds.extend([x,y]);
 atlas.fitBounds(bounds,{padding:70,maxZoom:4,duration:0});
};
$('browseAll').onclick=()=>{
 viewingSaved=false;setDrawer(true);render();
 if(!flying())return;
 const {from,points}=flightNetwork();
 $('drawerTitle').textContent=from?'Вылеты из '+from:'Аэропорты';$('filters').hidden=true;
 $('resultTitle').textContent=from?'Куда лететь':'Выбери аэропорт';$('total').textContent=String(points.length);
 $('cards').innerHTML=points.map(p=>'<button class="ru-row" data-airport="'+p.code+'"><strong>'+safe(p.name)+'</strong><span>'+p.code+(p.km?' · '+Math.round(p.km).toLocaleString('ru')+' км':'')+'</span></button>').join('');
};
const itinerary=state.itinerary??={legs:[],consumption:8,price:1.8,checks:{}};
let selectedLeg=0,building=false,pickStage=false,pickStop=false,sequence=0,roadKm=null,roadMessage='';
const forecasts=new Map(), nearbyCache=new Map();
const safe=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pack=['Документы и бронирования','Права и документы на машину','Проверить заправки и парковки','Скачать карты','Вода и перекус','Зарядка для телефона','Одежда по прогнозу'];
function drivingSegments(){
 const origin=actualOrigin(),groups=[origin?[origin.slice(0,2)]:[]];
 for(const leg of itinerary.legs){
  if(leg.arrival)groups.push([]);
  const group=groups.at(-1);
  if(leg.domesticLoop)group.domesticCountry=countryAt(leg.lat,leg.lon)||"unknown";
  for(const point of [leg,...leg.stops]){
   const coords=[point.lat,point.lon];
   if(!group.length||kmBetween(coords,group.at(-1))>.025)group.push(coords);
  }
 }
 return groups.filter(group=>group.length>1);
}
function approximateKm(points){
 return points.slice(1).reduce((sum,p,i)=>sum+kmBetween(points[i],p)*1.28,0);
}
let drivingLines=[];
async function refreshTrip(){
 const segments=drivingSegments(),serial=++sequence;
 drivingLines=segments.map(group=>group.domesticCountry?[]:group.map(lngLat));roadKm=null;route=[];
 roadMessage='Оценка по прямой × 1,28';paintRoute();renderPins();showLeg();
 if(!segments.length)return;
 const results=await Promise.all(segments.map(async group=>{
  if(group.length>100)return null;
  const coords=group.map(([y,x])=>x.toFixed(5)+','+y.toFixed(5)).join(';');
  try{
   const response=await fetch('https://router.project-osrm.org/route/v1/driving/'+coords+'?overview=full&geometries=geojson',{signal:AbortSignal.timeout(8500)});
   const result=(await response.json()).routes?.[0];const line=result?.geometry?.coordinates;return line?.length&&(!group.domesticCountry||domesticPath(group.domesticCountry,line))?result:null;
  }catch{return null}
 }));
 if(serial!==sequence||!building)return;
 drivingLines=results.map((r,i)=>r?r.geometry.coordinates:segments[i].domesticCountry?[]:segments[i].map(lngLat));
 roadKm=results.reduce((sum,r,i)=>sum+(r?r.distance/1000:approximateKm(segments[i])),0);
 roadMessage=results.every(Boolean)?'По автодорогам · OSRM':'Часть пути оценена по прямой × 1,28';
 paintRoute();showLeg();
}
function legKey(l){return l.lat.toFixed(4)+','+l.lon.toFixed(4)}
let lastArea=null;
function localPlaces(l){
 const key=legKey(l),cached=nearbyCache.get(key)||null;
 if(l===lastArea?.leg&&cached===lastArea.external)return lastArea.points;
 const options=[...landmarks.flat(),...russianPlaces.map(([n,,x,y])=>[n,y,x]),...catalogue.map(([,n,x,y])=>[n,y,x]),...(cached||[]),...atlasCities.slice(0,russianStart).map(([n,,x,y])=>[n,y,x])];
 const seen=[],areaCountry=countryAt(l.lat,l.lon);
 for(const [name,lat,lon] of options){
  const km=kmBetween([l.lat,l.lon],[lat,lon]);
  if(km<.08||km>70||(!l.crossBorder&&(!areaCountry||countryAt(lat,lon)!==areaCountry))||seen.some(p=>p.name===name&&Math.abs(p.lat-lat)<.01&&Math.abs(p.lon-lon)<.02))continue;
  seen.push({name,lat,lon,km});
 }
 const points=seen.sort((a,b)=>a.km-b.km).slice(0,70);
 lastArea={leg:l,external:cached,points};return points;
}
function stagePins(at){
 const leg=itinerary.legs[selectedLeg];if(!leg)return '';
 const near=localPlaces(leg),shown=[],pins=[];
 near.forEach((p,i)=>{
  if(leg.stops.some(s=>legKey(s)===legKey(p)))return;
  const {x,y}=atlas.project([p.lon,p.lat]);
  if(x<0||y<0||x>map.clientWidth||y>map.clientHeight||shown.some(q=>Math.hypot(q.x-x,q.y-y)<38))return;
  shown.push({x,y});
  pins.push('<button class="stage-dot candidate" data-near="'+i+'" title="Добавить · '+safe(p.name)+'" aria-label="Добавить '+safe(p.name)+'"'+at(p.lat,p.lon)+'>+</button>');
 });
 itinerary.legs.forEach((item,j)=>[item,...item.stops].forEach((p,k)=>{
  pins.push('<button class="stage-dot chosen '+(j===selectedLeg?'current':'')+'" data-focus-leg="'+j+'" title="'+safe(p.name)+'" aria-label="Этап '+(j+1)+' · '+safe(p.name)+'"'+at(p.lat,p.lon)+'>'+(k?k:'⚑')+'</button>');
 }));
 return pins.join('');
}
function addStageStop(point){
 const leg=itinerary.legs[selectedLeg];
 if(!leg||[leg,...leg.stops].some(p=>legKey(p)===legKey(point)))return;
 leg.stops.push({name:point.name,lat:point.lat,lon:point.lon});persist();
 pickStop=false;refreshTrip();
}
function fetchArea(l){
 const key=legKey(l);
 if(!forecasts.has(key)){
  forecasts.set(key,'Получаем прогноз…');
  fetch('https://api.open-meteo.com/v1/forecast?latitude='+l.lat+'&longitude='+l.lon+'&daily=temperature_2m_min,temperature_2m_max,precipitation_probability_max,wind_speed_10m_max&forecast_days=1&timezone=auto',{signal:AbortSignal.timeout(8000)}).then(r=>r.json()).then(j=>{
   const d=j.daily,lo=d.temperature_2m_min[0],hi=d.temperature_2m_max[0],rain=d.precipitation_probability_max[0],wind=d.wind_speed_10m_max[0];
   if(![lo,hi,rain,wind].every(Number.isFinite))throw Error();
   forecasts.set(key,d.time[0]+' · '+lo+'…'+hi+' °C · осадки '+rain+'% · ветер до '+wind+' км/ч. '+(rain>=40?'Возьми дождевик. ':'')+(lo<8?'Пригодится тёплый слой. ':'')+(wind>=35?'Для прогулки выбери защищённое от ветра место.':''));
  }).catch(()=>forecasts.set(key,'Сегодня прогноз недоступен.')).finally(()=>{if(building)showLeg()});
 }
 if(nearbyCache.has(key))return;
 nearbyCache.set(key,[]);
 const query='[out:json][timeout:6];nwr(around:18000,'+l.lat+','+l.lon+')["tourism"~"^(attraction|museum|viewpoint)$"]["name"];out center 60;';
 fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query),{signal:AbortSignal.timeout(8500)}).then(r=>r.json()).then(j=>{
  nearbyCache.set(key,j.elements.map(e=>[e.tags.name,e.lat??e.center?.lat,e.lon??e.center?.lon]).filter(p=>Number.isFinite(p[1])&&Number.isFinite(p[2])));
  if(building&&!pickStage){showLeg();renderPins()}
 }).catch(()=>{});
}
function startLeg(name,lat,lon,arrival=false){
 const l={name,lat,lon,arrival,stops:[]};itinerary.legs.push(l);selectedLeg=itinerary.legs.length-1;persist();enterTrip();flyTo([lat,lon],8);
}
function enterTrip(){
 $('tripBuilder').setAttribute('aria-pressed','true');
 if(!itinerary.legs.length){chooseNext();return}
 selectedLeg=Math.min(selectedLeg,itinerary.legs.length-1);
 active=null;routeRequest++;setDrawer(false);closeLandmark();$('detail').hidden=true;$('nearby').hidden=true;$('portal').hidden=true;
 building=true;pickStage=false;pickStop=false;refreshTrip();fetchArea(itinerary.legs[selectedLeg]);
}
function leaveTrip(){$('tripBuilder').setAttribute('aria-pressed',String(loopView.open));building=false;drivingLines=[];paintRoute();sequence++;pickStop=false;pickStage=false;$('builder').hidden=true;$('pickTip').hidden=true;clearRoute();render()}
let nextArrivalByAir=false;
function chooseNext(byAir=false){
 nextArrivalByAir=byAir||(!itinerary.legs.length&&flying());
 pickStage=true;pickStop=false;setDrawer(false);closeLandmark();$('detail').hidden=true;$('nearby').hidden=true;$('portal').hidden=true;$('builder').hidden=true;
 $('pickTip').textContent=(itinerary.legs.length?'Следующий этап':'Точка прибытия')+' · нажми на карту или место · Отмена';
 $('pickTip').hidden=false;renderPins();
}
function pointChoice(lat,lon,name){
 if(loopView.open){setLoopArea(lat,lon,name);return true}
 lastLoopPoint={lat,lon,name};state.selectedDestination=lastLoopPoint;persist();
 if(pickStage){startLeg(name,lat,lon,nextArrivalByAir);return true}
 if(pickStop){pickStop=false;addStageStop({name,lat,lon});showLeg();return true}
 return false;
}
function totals(){
 const km=roadKm??drivingSegments().reduce((total,g)=>total+approximateKm(g),0),litres=km*itinerary.consumption/100;
 return Math.round(km)+' км · '+litres.toFixed(1)+' л · ≈ '+Math.round(litres*itinerary.price)+' €';
}
function showLeg(){
 if(!building||pickStop||pickStage)return;
 const l=itinerary.legs[selectedLeg], panel=$('builder'),scroll=panel.scrollTop,checklistOpen=panel.querySelector('.trip-extra')?.open,packOpen=panel.querySelector('details details')?.open;
 if(panel.contains(document.activeElement)&&document.activeElement.matches('input[type=number]')){if($('fuelTotal'))$('fuelTotal').textContent=totals();return}
 panel.hidden=false;$('pickTip').hidden=true;
 const choices=localPlaces(l).filter(p=>!l.stops.some(s=>legKey(s)===legKey(p)));
 panel.innerHTML='<div class="panel"><button class="close" data-build="close" aria-label="Закрыть">×</button><small>Этап '+(selectedLeg+1)+' · точка прибытия</small><h2>'+safe(l.name)+'</h2><div class="chips">'+itinerary.legs.map((e,i)=>'<button data-leg="'+i+'" class="'+(i===selectedLeg?'selected':'')+'">'+(i+1)+'. '+safe(e.name)+'</button>').join('')+'</div><h3>Остановки по порядку</h3><ol><li>'+safe(l.name)+'</li>'+l.stops.map((s,i)=>'<li>'+safe(s.name)+' <button data-drop="'+i+'" aria-label="Убрать остановку">×</button></li>').join('')+'</ol><details class="trip-extra"><summary>Изменить остановки и параметры</summary><h3>Места рядом</h3><div class="near-picks">'+choices.slice(0,4).map(p=>'<button data-near="'+localPlaces(l).indexOf(p)+'"><strong>'+safe(p.name)+'</strong><small>'+p.km.toLocaleString('ru',{maximumFractionDigits:1})+' км</small><b>+</b></button>').join('')+'</div>'+(!choices.length?'<p class="note">В радиусе 70 км пока нет других мест в каталоге. Можно поставить свою остановку.</p>':'')+'<label>Все места в радиусе 70 км<select id="nearStop"><option value="">Выбери место</option>'+choices.map(p=>'<option value="'+safe(JSON.stringify([p.name,p.lat,p.lon]))+'">'+safe(p.name)+' · '+Math.round(p.km)+' км</option>').join('')+'</select></label><button class="action secondary" data-build="pin">Указать остановку на карте</button><button class="action" data-build="next">Добавить следующий этап</button><h3 id="fuelTotal">'+totals()+'</h3><p class="note">'+roadMessage+' · весь маршрут в одну сторону</p><div class="fuel"><label>Расход, л/100 км<input id="fuelRate" type="number" min=".1" step=".1" value="'+itinerary.consumption+'"></label><label>Цена топлива, €/л<input id="fuelPrice" type="number" min=".01" step=".01" value="'+itinerary.price+'"></label></div><h3>Сегодня в районе этапа</h3><p>'+safe(forecasts.get(legKey(l))||'Получаем прогноз…')+'</p><small>Open-Meteo</small><details><summary>Готовность · '+pack.filter(x=>itinerary.checks[x]).length+'/'+pack.length+'</summary>'+pack.map((x,i)=>'<label class="switch"><input type="checkbox" data-pack="'+i+'" '+(itinerary.checks[x]?'checked':'')+'>'+x+'</label>').join('')+'</details><button class="action secondary" data-build="remove">Убрать этап</button></details></div>';
 panel.querySelector('.trip-extra').open=!!checklistOpen;panel.querySelector('details details').open=!!packOpen;panel.scrollTop=scroll;
}
initVisa();initLoops();updateVisaMap();
$('pickTip').onclick=()=>{if(loopView.open){loopView.picking=false;$('pickTip').hidden=true;drawLoopCard();renderPins()}else if(itinerary.legs.length)enterTrip();else leaveTrip()};
$('builder').onclick=e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.leg!==undefined){selectedLeg=+b.dataset.leg;const l=itinerary.legs[selectedLeg];enterTrip();flyTo([l.lat,l.lon],8)}
 if(b.dataset.drop!==undefined){itinerary.legs[selectedLeg].stops.splice(+b.dataset.drop,1);persist();refreshTrip()}
 switch(b.dataset.build){
 case 'close':leaveTrip();break;
 case 'next':chooseNext();break;
 case 'pin':pickStop=true;$('builder').hidden=true;$('pickTip').textContent='Нажми на место остановки · Отмена';$('pickTip').hidden=false;break;
 case 'remove':itinerary.legs.splice(selectedLeg,1);persist();if(itinerary.legs.length)enterTrip();else leaveTrip();break;
 }
};
$('builder').onchange=e=>{
 const t=e.target,l=itinerary.legs[selectedLeg];
 if(t.id==='nearStop'&&t.value){const [name,lat,lon]=JSON.parse(t.value);addStageStop({name,lat,lon})}
 if(['fuelRate','fuelPrice'].includes(t.id)){const n=t.valueAsNumber;if(Number.isFinite(n)&&n>0){itinerary[t.id==='fuelRate'?'consumption':'price']=n;persist();$('fuelTotal').textContent=totals()}}
 if(t.dataset.pack!==undefined){itinerary.checks[pack[+t.dataset.pack]]=t.checked;persist();t.closest('details').querySelector('summary').textContent='Готовность · '+pack.filter(x=>itinerary.checks[x]).length+'/'+pack.length}
};

$('portal').hidden=true;loadDetailedMap();setDrawer(false);render();fit(0);

if(state.origin==='auto')requestLocation(false);else if(actualOrigin())flyTo(actualOrigin(),4.4);

let popularityFrame=0;
$('popRange').oninput=()=>{
 const value=popularity.minimum;
 $('popValue').textContent=value+' / 10';$('popCount').textContent=value||'';
 $('popRange').setAttribute('aria-valuetext',value?'От '+value+' из 10':'Все места');
 if(popularityFrame)return;
 popularityFrame=requestAnimationFrame(()=>{
  popularityFrame=0;
  updateSeasonPanel();
  if($('findRussia')){$('findRussia').oninput();renderPins()}else render();
 });
};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#popFilter'))$('popFilter').open=false});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('popFilter').open){$('popFilter').open=false;$('popFilter').querySelector('summary').focus()}});

$('popFilter').addEventListener('toggle',()=>{if($('popFilter').open){$('seasonMenu').hidden=true;$('recommend').setAttribute('aria-expanded','false')}});
