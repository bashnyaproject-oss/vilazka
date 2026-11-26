'use strict';
(()=>{
 const size=matchMedia('(max-width: 760px)'), field=$('mobileQuery'),results=$('mobileResults'),settings=$('mobileSettings');
 const modes=$('modes'),seasons=$('seasonDock');
 const anchors=[modes,seasons].map(el=>{const marker=document.createComment('desktop control');el.before(marker);return marker});
 const normalize=s=>s.toLocaleLowerCase('ru').replace(/ё/g,'е');
 let entries,shortlist=[],lastCamera='',timer;
 const ruCountries=new Intl.DisplayNames(['ru'],{type:'region'}),enCountries=new Intl.DisplayNames(['en'],{type:'region'});
 const localCities={...{Moscow:'Москва',London:'Лондон',Paris:'Париж',Rome:'Рим',Riga:'Рига',Vilnius:'Вильнюс',Tallinn:'Таллин',Almaty:'Алматы',Astana:'Астана',Tbilisi:'Тбилиси',Baku:'Баку',Yerevan:'Ереван',Stockholm:'Стокгольм',Helsinki:'Хельсинки',Warsaw:'Варшава',Minsk:'Минск',Kyiv:'Киев',Kazan:'Казань',Volgograd:'Волгоград',Perm:'Пермь','Nizhny Novgorod':'Нижний Новгород',Sochi:'Сочи',Kaliningrad:'Калининград',Novosibirsk:'Новосибирск',Yekaterinburg:'Екатеринбург'}};

 const aliases={Moscow:'Москва',Berlin:'Берлин',Amsterdam:'Амстердам',Oslo:'Осло',Istanbul:'Стамбул','Saint Petersburg':'Санкт-Петербург',Yaroslavl:'Ярославль'};
 function index(){
  if(entries)return entries;
  entries=[];
  function add(name,lat,lon,subtitle,action,id,pic,extra=''){
   entries.push({name,lat,lon,subtitle,action,id,pic,key:normalize(name+' '+subtitle+' '+extra)});
  }
  data.forEach(d=>add(d.name,d.lat,d.lon,d.country,'destination',d.id));
  catalogue.forEach(([id,name,lon,lat,kind,country,img],i)=>add(name,lat,lon,({Cultural:'Культура',Natural:'Природа',Mixed:'Наследие'})[kind]||kind,'site',i,img||placeMedia[id]?.[1]));
  atlasCities.forEach(([name,area,lon,lat],i)=>add(aliases[name]||localCities[name]||name,lat,lon,area,'city',i,placeMedia[i<russianStart?'c'+i:'p'+(i-russianStart)]?.[1],name));
  const nations=new Map();
  for(const [code,w,s,e,n] of countryShapes){
   const area=(e-w)*(n-s),known=nations.get(code);
   if(!known||area>known.area)nations.set(code,{w,s,e,n,area});
  }
  for(const [code,{w,s,e,n}] of nations){
   const iso=visaData.iso2[code];if(!/^[A-Z]{2}$/.test(iso))continue;
   const name=ruCountries.of(iso);
   add(name,(s+n)/2,(w+e)/2,'Страна','country',iso,null,enCountries.of(iso));
  }
  return entries;
 }
 function closeSearch(){results.hidden=true;field.blur();$('mobileTop').classList.remove('searching')}
 function menu(open){settings.hidden=!open;$('mobileOptions').setAttribute('aria-expanded',String(open));if(open)closeSearch()}
 function resetMap(){
  if(loopView.open)closeLoops();if(building||pickStage||pickStop)leaveTrip();
  if(picking)finishPick();active=null;viewingSaved=false;closeLandmark();setDrawer(false);
  $('detail').hidden=true;$('portal').hidden=true;render();clearRoute();sync();
 }
 function roadMode(){return loopView.open||building||pickStage||pickStop}
 function sync(){
  if(!size.matches)return;
  const roads=roadMode();document.body.classList.toggle('phone-roads',roads);
  $('phoneMap').setAttribute('aria-pressed',String(!roads));$('phoneRoads').setAttribute('aria-pressed',String(roads));
  field.placeholder=roads?'Город или страна для поездки':'Город, страна или место';
 }
 function camera(){return atlas?.getCenter()||{lat:55.75,lng:37.62}}
 function nearest(list,center){return list.map(p=>[p,kmBetween([center.lat,center.lng],[p.lat,p.lon])]).sort((a,b)=>a[1]-b[1])}
 const countryPanel=$('countryRoads');
 function showCountryRoutes(code){
  const country=ruCountries.of(code);
  const routes=publishedDrives.map((route,i)=>({route,i})).filter(({route})=>
   route.places.length>=2&&route.places.every(([,lat,lon])=>visaData.iso2[countryAt(lat,lon)]===code));
  const link=({route,i})=>'<a href="/guides.html#route-'+i+'"><strong>'+safe(route.name)+'</strong><small>'+safe(route.places[0][0])+' → '+safe(route.places.at(-1)[0])+'</small></a>';
  countryPanel.innerHTML='<button class="country-route-chip" type="button" aria-label="Убрать страну">'+safe(country)+' <span aria-hidden="true">×</span></button>'+
   '<p>Дорожные маршруты · '+routes.length+'</p>'+(routes.length?'<div class="country-route-list">'+routes.map(link).join('')+'</div>':'<p>В каталоге пока нет маршрутов по этой стране. Выбери город, чтобы подобрать поездку на карте.</p>');
  countryPanel.querySelector('button').onclick=()=>{countryPanel.hidden=true;delete state.searchCountry;persist()};
  countryPanel.hidden=false;
 }
 if(visaIndexes.has(state.searchCountry))showCountryRoutes(state.searchCountry);
 function choose(p){
  if(!p)return;const roads=roadMode();closeSearch();menu(false);field.value='';
  if(p.action==='country'){resetMap();state.searchCountry=p.id;persist();showCountryRoutes(p.id);flyTo([p.lat,p.lon],4);return}
  if(roads){launchLoops({name:p.name,lat:p.lat,lon:p.lon});sync();return}
  resetMap();
  if(p.action==='site')openCatalogue(p.id);else if(p.action==='city')openCity(p.id);else open(data[p.id]);
  if(p.action!=='site')flyTo([p.lat,p.lon],7);
 }
 function search(){
  menu(false);const q=normalize(field.value.trim()),center=camera();
  const found=q?index().filter(p=>q.length===1?p.key.split(/[\s-]+/).some(part=>part.startsWith(q)):p.key.includes(q)):index().filter(p=>p.pic);
  const ranked=nearest(russiaOnly?found.filter(p=>p.action==='country'?p.id==='RU':countryAt(p.lat,p.lon)==='RUS'):found,center);
  if(q)ranked.sort((a,b)=>Number(!normalize(a[0].name).startsWith(q))-Number(!normalize(b[0].name).startsWith(q)));
  if(q){const firstCountry=ranked.findIndex(([p])=>p.action==='country'&&normalize(p.name).startsWith(q));if(firstCountry>2)ranked.splice(2,0,...ranked.splice(firstCountry,1))}
  const seen=new Set();shortlist=ranked.filter(([p])=>{if(seen.has(p.name))return false;seen.add(p.name);return true}).slice(0,8);
  results.innerHTML='<div class="phone-caption">'+(q?'Результаты':'Места рядом с центром карты')+'</div>'+shortlist.map(([p,km],i)=>'<button data-result="'+i+'"><span>'+safe(p.name)+'</span><small>'+safe(p.subtitle)+(p.action==='country'?'':' · '+Math.round(km)+' км')+'</small></button>').join('')+(!shortlist.length?'<p>Мест с таким названием пока нет.</p>':'');
  results.hidden=false;$('mobileTop').classList.add('searching');
 }
 function nearby(){
  if(!size.matches||roadMode())return;
  const center=camera(),key=[center.lat.toFixed(2),center.lng.toFixed(2),atlas?.getZoom().toFixed(1)].join('/');
  if(lastCamera===key)return;lastCamera=key;
  const bounds=atlas?.getBounds();if(!bounds)return;
  const pool=index().filter(p=>(!russiaOnly||countryAt(p.lat,p.lon)==='RUS')&&p.pic&&p.lat>=bounds.getSouth()&&p.lat<=bounds.getNorth()&&p.lon>=bounds.getWest()&&p.lon<=bounds.getEast());
  const seen=new Set(),places=nearest(pool,center).filter(([p])=>{if(seen.has(p.name))return false;seen.add(p.name);return true}).slice(0,8);
  const rail=$('mobilePlaces');rail.replaceChildren();rail.hidden=!places.length;
  for(const [p] of places){
   const btn=document.createElement('button'),img=document.createElement('img'),label=document.createElement('span');
   img.src=p.pic;img.alt='';img.loading='lazy';img.onerror=()=>btn.remove();label.textContent=p.name;
   btn.append(img,label);btn.onclick=()=>choose(p);rail.append(btn);
  }
 }
 function schedule(){if(!size.matches)return;sync();clearTimeout(timer);timer=setTimeout(nearby,140)}
 window.refreshPhoneMap=schedule;
 function setup(){
  if(size.matches){$('phoneControls').append(modes,seasons);sync();schedule()}
  else{[modes,seasons].forEach((el,i)=>anchors[i].after(el));menu(false);closeSearch();document.body.classList.remove('phone-roads')}
 }
 $('phoneMap').onclick=()=>{closeSearch();menu(false);resetMap();lastCamera='';schedule()};
 $('phoneRoads').onclick=()=>{menu(false);closeSearch();if(!loopView.open){
  launchLoops();
 }sync()};
 $('mobileOptions').onclick=()=>menu(settings.hidden);
 $('mobileCancel').onclick=()=>{field.value='';closeSearch()};
 field.onfocus=search;field.oninput=search;field.onkeydown=e=>{if(e.key==='Escape')closeSearch();if(e.key==='Enter'&&shortlist[0])choose(shortlist[0][0])};
 results.onclick=e=>{const b=e.target.closest('[data-result]');if(b)choose(shortlist[+b.dataset.result][0])};
 settings.onclick=e=>{const id=e.target.closest('[data-proxy]')?.dataset.proxy;if(id){menu(false);$(id).click()}};
 document.addEventListener('pointerdown',e=>{if(e.target.closest('#mobileTop,#mobileSettings'))return;closeSearch();menu(false)});
 new MutationObserver(schedule).observe($('loopDeck'),{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(schedule).observe($('builder'),{attributes:true,attributeFilter:['hidden']});
 size.addEventListener('change',setup);setup();
})();
