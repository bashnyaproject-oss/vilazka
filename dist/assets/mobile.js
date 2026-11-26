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
 const countryButton=document.createElement('button');
 countryButton.type='button';countryButton.className='country-picker';countryButton.textContent='◎';
 countryButton.title='Поиск страны';countryButton.setAttribute('aria-label','Поиск страны');countryButton.setAttribute('aria-pressed','false');
 field.closest('label').after(countryButton);
 let countryOnly=false,detectedCountry='',selectedCountry='',dismissedCountry='',countryOpen=false;
 function drawCountryHighlight(){
  if(!atlas||canvas||!atlas.getStyle()?.layers)return;
  const id='selected-country',code=selectedCountry;
  const existing=atlas.getSource(id);
  if(!existing&&!code)return;
  if(existing?.countryCode===code)return;
  const geo={type:'FeatureCollection',features:countryShapes.filter(([key])=>visaData.iso2[key]===code).map(([,,,,,rings])=>({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:rings}}))};
  if(existing)existing.setData(geo);
  else{
   atlas.addSource(id,{type:'geojson',data:geo});
   const before=atlas.getStyle().layers.find(l=>l.type==='line'||l.type==='symbol');
   atlas.addLayer({id,type:'fill',source:id,paint:{'fill-color':'#b18bff','fill-opacity':.19,'fill-outline-color':'#c8acff'}},before?.id);
  }
  atlas.getSource(id).countryCode=code;
 }
 window.paintCountryHighlight=(ctx)=>{
  if(!selectedCountry)return;
  ctx.save();ctx.fillStyle='#b18bff30';
  for(const [key,,,,,rings] of countryShapes){
   if(visaData.iso2[key]!==selectedCountry)continue;
   ctx.beginPath();
   for(const ring of rings){ctx.moveTo(...ring[0]);for(const point of ring.slice(1))ctx.lineTo(...point);ctx.closePath()}
   ctx.fill('evenodd');
  }
  ctx.restore();
 };
 function selectCountry(code,open=false){
  selectedCountry=code;countryOpen=open;
  if(code)showCountryRoutes(code);else countryPanel.hidden=true;
  drawCountryHighlight();canvas?.draw();
 }
 function showCountryRoutes(code){
  const country=ruCountries.of(code);
  const routes=publishedDrives.map((route,i)=>({route,i})).filter(({route})=>
   route.places.length>=2&&route.places.every(([,lat,lon])=>visaData.iso2[countryAt(lat,lon)]===code));
  const link=({route,i})=>'<a href="/guides.html#route-'+i+'"><strong>'+safe(route.name)+'</strong><small>'+safe(route.places[0][0])+' → '+safe(route.places.at(-1)[0])+'</small></a>';
  countryPanel.innerHTML='<div class="country-chip-row"><button class="country-route-chip" type="button" aria-expanded="'+countryOpen+'">'+safe(country)+' <span>'+routes.length+' · ⌄</span></button><button class="country-clear" type="button" aria-label="Убрать страну">×</button></div>'+
   '<div class="country-route-body" '+(countryOpen?'':'hidden')+'><p>Дорожные маршруты · '+routes.length+'</p>'+(routes.length?'<div class="country-route-list">'+routes.map(link).join('')+'</div>':'<p>В каталоге пока нет готовых маршрутов. Выбери город, чтобы подобрать поездку на карте.</p>')+'<a class="country-catalog" href="/roads.html?q='+encodeURIComponent(country)+'">Все дороги в каталоге ↗</a></div>';
  countryPanel.querySelector('.country-route-chip').onclick=()=>{countryOpen=!countryOpen;showCountryRoutes(code)};
  countryPanel.querySelector('.country-clear').onclick=()=>{dismissedCountry=code;delete state.searchCountry;persist();selectCountry('')};
  countryPanel.hidden=false;
 }
 if(visaIndexes.has(state.searchCountry)){selectedCountry=state.searchCountry;showCountryRoutes(selectedCountry);}
 function detectCountry(){
  if(!atlas)return;
  if(atlas.getZoom()>=5){
   const center=atlas.getCenter(),code=visaData.iso2[countryAt(center.lat,((center.lng+180)%360+360)%360-180)]||'';
   if(code&&visaIndexes.has(code)&&code!==detectedCountry){
    detectedCountry=code;
    if(code!==dismissedCountry&&code!==selectedCountry){dismissedCountry='';selectCountry(code);}
   }
  }else detectedCountry='';
  drawCountryHighlight();
 }
 countryButton.onclick=()=>{
  countryOnly=!countryOnly;countryButton.setAttribute('aria-pressed',String(countryOnly));
  field.placeholder=countryOnly?'Найти страну':'Город, страна или место';
  field.value='';field.focus();search();
 };

 function choose(p){
  if(!p)return;const roads=roadMode();closeSearch();menu(false);field.value='';
  if(p.action==='country'){resetMap();state.searchCountry=p.id;persist();countryOnly=false;countryButton.setAttribute('aria-pressed','false');field.placeholder='Город, страна или место';selectCountry(p.id,true);flyTo([p.lat,p.lon],4);return}
  if(roads){launchLoops({name:p.name,lat:p.lat,lon:p.lon});sync();return}
  resetMap();
  if(p.action==='site')openCatalogue(p.id);else if(p.action==='city')openCity(p.id);else open(data[p.id]);
  if(p.action!=='site')flyTo([p.lat,p.lon],7);
 }
 function search(){
  menu(false);const q=normalize(field.value.trim()),center=camera();
  const pool=countryOnly?index().filter(p=>p.action==='country').sort((a,b)=>a.name.localeCompare(b.name,'ru')):index();
  const found=q?pool.filter(p=>q.length===1?p.key.split(/[\s-]+/).some(part=>part.startsWith(q)):p.key.includes(q)):countryOnly?pool:pool.filter(p=>p.pic);
  const ranked=!q&&countryOnly?found.map(p=>[p,0]):nearest(russiaOnly?found.filter(p=>p.action==='country'?p.id==='RU':countryAt(p.lat,p.lon)==='RUS'):found,center);
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
 function schedule(){sync();clearTimeout(timer);timer=setTimeout(()=>{detectCountry();nearby()},140)}
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
 size.addEventListener('change',setup);setup();schedule();
})();
