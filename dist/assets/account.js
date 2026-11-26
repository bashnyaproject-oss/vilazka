'use strict';
// Signed-in trips are stored as individual private documents.
let profileRemote=null,profileSdk=null;
const profilePath='/vilazka/preferences.json';
const prefKeys=['passport','passport2','drive','driveKm','taste'];
function profileStorage(){
 if(profileSdk)return profileSdk;
 profileSdk=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='assets/remotestorage.js';
  script.onerror=()=>{profileSdk=null;reject(Error('SDK'))};
  script.onload=()=>{
   profileRemote=new RemoteStorage();profileRemote.access.claim('vilazka','rw');
   profileRemote.on('connected',()=>{if(document.querySelector('#accountPanel'))accountOffer()});
   profileRemote.on('error',()=>{const el=document.querySelector('#accountStatus');if(el)el.textContent='Не удалось подключиться. Настройки сохранены на устройстве.'});
   profileRemote.on('ready',()=>resolve(profileRemote));
  };document.head.append(script);
 });return profileSdk;
}
function accountOffer(forTrips=false){
 const dialog=$('dialog'),connected=profileRemote?.remote.connected;
 dialog.innerHTML='<div class="panel" id="accountPanel"><button class="close" data-dialog-close aria-label="Закрыть">×</button><h2>'+(forTrips?'Мои поездки':'Профиль сохранён')+'</h2>'+
 (connected?'<p>Личное хранилище · '+safe(profileRemote.remote.userAddress)+'</p><button class="action" id="backupPrefs">Сохранить настройки в аккаунт</button><button class="action secondary" id="restorePrefs">Загрузить настройки из аккаунта</button><button id="disconnectPrefs">Выйти</button>':'<p>'+(forTrips?'Войди или зарегистрируйся, чтобы сохранять и открывать свои поездки.':'Хочешь открыть эти настройки на другом устройстве?')+'</p><a class="action" href="https://5apps.com/storage" target="_blank" rel="noopener">Зарегистрироваться в 5apps ↗</a><form id="connectPrefs"><label>Адрес хранилища<input name="address" type="email" required placeholder="name@5apps.com"></label><button class="action secondary">Подключить аккаунт</button></form>')+
 '<p id="accountStatus" role="status"></p><button data-dialog-close>Готово</button></div>';
 if(!dialog.open)dialog.showModal();
 const status=$('accountStatus');
 if(!connected){
  $('connectPrefs').onsubmit=async e=>{e.preventDefault();const address=e.target.elements.address.value.trim();try{localStorage.setItem('vilazka-storage','1');sessionStorage.setItem('vilazka-return',forTrips?'trips':'profile');const rs=await profileStorage();if(!rs.remote.connected)await rs.connect(address)}catch{status.textContent='Не удалось подключить хранилище.'}};
  return;
 }
 $('disconnectPrefs').onclick=async()=>{await profileRemote.disconnect();localStorage.removeItem('vilazka-storage');accountOffer()};
 $('backupPrefs').onclick=async()=>{
  try{const prefs=Object.fromEntries(prefKeys.map(k=>[k,state[k]||'']));const r=await profileRemote.remote.put(profilePath,JSON.stringify(prefs),'application/json');if(r.statusCode<200||r.statusCode>=300)throw Error();status.textContent='Настройки сохранены в аккаунте.'}catch{status.textContent='Не удалось сохранить в аккаунте.'}
 };
 $('restorePrefs').onclick=async()=>{
  try{const r=await profileRemote.remote.get(profilePath);if(r.statusCode===404){status.textContent='В аккаунте пока нет настроек.';return}if(r.statusCode!==200)throw Error();
   const p=typeof r.body==='string'?JSON.parse(r.body):r.body;
   if(!p||![p.passport,p.passport2].every(c=>c===''||visaIndexes.has(c))||!['2','3','4','5','6','8'].includes(p.drive)||!(p.driveKm===''||(/^\d+$/.test(p.driveKm)&&+p.driveKm>=1&&+p.driveKm<=3000))||!['Город','Природа','Роад-трип'].includes(p.taste))throw Error();
   for(const k of prefKeys)state[k]=p[k];persist();updateVisaMap();canvas?.draw();showProfile();
  }catch{status.textContent='Не удалось загрузить настройки.'}
 };
}
window.addEventListener('load',()=>{if(localStorage.getItem('vilazka-storage'))profileStorage().then(()=>{if(profileRemote.remote.connected&&sessionStorage.getItem('vilazka-return')){const next=sessionStorage.getItem('vilazka-return');sessionStorage.removeItem('vilazka-return');if(next==='trips')openAccountTrips();else accountOffer()}}).catch(()=>{})});
const tripFolder='/vilazka/trips/';
const pendingTripWrites=new Map();
function saveAccountItem(key,item,remove=false){
 const remote=profileRemote?.remote;if(!remote?.connected)return;
 const path=tripFolder+key+'.json';
 const pendingKey=remote.userAddress+path;
 const task=(pendingTripWrites.get(pendingKey)||Promise.resolve()).then(async()=>{
  const r=remove?await remote.delete(path):await remote.put(path,JSON.stringify(item),'application/json');
  if(!(r.statusCode>=200&&r.statusCode<300)&&!(remove&&r.statusCode===404))throw Error();
 }).catch(()=>{const el=$('toast');el.textContent='Не удалось сохранить изменение в аккаунте';el.hidden=false;setTimeout(()=>el.hidden=true,3500)}).finally(()=>{if(pendingTripWrites.get(pendingKey)===task)pendingTripWrites.delete(pendingKey)});
 pendingTripWrites.set(pendingKey,task);
}
async function openAccountTrips(){
 if(!profileRemote?.remote.connected&&localStorage.getItem('vilazka-storage')){try{await profileStorage()}catch{}}
 const remote=profileRemote?.remote;
 const dialog=$('dialog');dialog.innerHTML='<div class="panel"><button data-dialog-close class="close" aria-label="Закрыть">×</button><h2>Мои поездки</h2><div id="cloudTrips" role="status"></div></div>';
 if(!dialog.open)dialog.showModal();const box=$('cloudTrips');
 const local=document.createElement('div');local.className='guest-trip-list';box.before(local);
 const trips=guestTrips();
 if(trips.length){
  const label=document.createElement('p');label.textContent='Поездки на этом устройстве';local.append(label);
  for(const trip of trips){
   const button=document.createElement('button');button.className='account-trip';button.textContent=trip.name;
   button.onclick=()=>openRoadReview(trip,local);local.append(button);
  }
 }else local.textContent='Нажми «Поехали» у дороги, чтобы добавить поездку.';
 if(!remote?.connected){
  const connect=document.createElement('button');connect.className='action';connect.textContent='Подключить аккаунт';
  connect.onclick=()=>accountOffer(true);box.append(connect);return;
 }
 try{
  await Promise.all(pendingTripWrites.values());const r=await remote.get(tripFolder);
  if(r.statusCode!==404&&r.statusCode!==200)throw Error();
  const keys=r.statusCode===404?[]:Object.keys(r.body).filter(k=>/^(place-\d+|city-\d+|road-[\da-f-]+)\.json$/.test(k));
  const trips=await Promise.all(keys.map(async key=>{const v=await remote.get(tripFolder+key);if(v.statusCode!==200)throw Error();return {key,item:typeof v.body==='string'?JSON.parse(v.body):v.body}}));
  box.replaceChildren();
  if(!trips.length){box.textContent='Здесь появятся сохранённые места и маршруты.';return}
  for(const {key,item} of trips){
   const btn=document.createElement('button');btn.className='account-trip';btn.textContent=item.name;
   btn.onclick=()=>{if(key.startsWith('road-')){const list=document.createElement('ol');for(const p of item.stops||[]){const li=document.createElement('li');li.textContent=p.name;list.append(li)}const heading=document.createElement('h3');heading.textContent=item.name;const back=document.createElement('button');back.textContent='Все поездки';back.onclick=openAccountTrips;box.replaceChildren(heading,list,back);return}
    dialog.close();const i=parseInt(key.split('-')[1],10);if(key.startsWith('city-')&&atlasCities[i])openCity(i);else if(data[i])open(data[i])};
   box.append(btn);
  }
 }catch{box.textContent='Не удалось загрузить поездки. ';const retry=document.createElement('button');retry.textContent='Повторить';retry.onclick=openAccountTrips;box.append(retry)}
}

function openRoadReview(trip,box){
 const heading=document.createElement('h3');heading.textContent=trip.name;
 const back=document.createElement('button');back.type='button';back.textContent='← Все поездки';back.onclick=openAccountTrips;
 box.replaceChildren(back,heading);
 const remote=profileRemote?.remote;
 if(!remote?.connected){
  const connect=document.createElement('button');connect.className='action';connect.textContent='Войти, чтобы оставить отзыв';
  connect.onclick=()=>accountOffer(true);box.append(connect);return;
 }
 if(!/^[\da-f-]{36}$/.test(trip.id))return;
 const path='/vilazka/road-review-'+trip.id+'.json';
 const form=document.createElement('form');form.className='road-review';
 form.innerHTML='<label>Твой отзыв<textarea name="review" required maxlength="1500" rows="4"></textarea></label><label>Фото <input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><small>До двух фото по 2 МБ. Отзыв сохранится в личном хранилище.</small><div class="review-photos"></div><button type="submit" class="action">Сохранить отзыв</button><p role="status"></p>';
 box.append(form);
 const status=form.querySelector('[role="status"]'),submit=form.querySelector('button'),preview=form.querySelector('.review-photos');
 let photos=[];
 function showPhotos(){
  preview.replaceChildren();
  for(const src of photos){
   if(!/^data:image\/(?:jpeg|png|webp);base64,/.test(src))continue;
   const img=document.createElement('img');img.src=src;img.alt='Фото к отзыву';preview.append(img);
  }
 }
 submit.disabled=true;
 remote.get(path).then(r=>{
  if(r.statusCode===404)return;
  if(r.statusCode!==200)throw Error();
  const saved=typeof r.body==='string'?JSON.parse(r.body):r.body;
  form.elements.review.value=saved.text||'';photos=Array.isArray(saved.photos)?saved.photos:[];showPhotos();
 }).catch(()=>{status.textContent='Не удалось загрузить сохранённый отзыв.'}).finally(()=>{submit.disabled=false});
 form.onsubmit=async e=>{
  e.preventDefault();
  const files=[...form.elements.photos.files],text=form.elements.review.value.trim();
  if(!text){status.textContent='Напиши отзыв.';return}
  if(files.length>2||files.some(f=>f.size>2*1024*1024||!/^image\/(jpeg|png|webp)$/.test(f.type))){
   status.textContent='Выбери до двух фото JPEG, PNG или WebP по 2 МБ.';return;
  }
  submit.disabled=true;status.textContent='Сохраняем…';
  try{
   const next=files.length?await Promise.all(files.map(file=>new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);
   }))):photos;
   const r=await remote.put(path,JSON.stringify({name:trip.name,stops:trip.stops,text,photos:next}),'application/json');
   if(r.statusCode<200||r.statusCode>=300)throw Error();
   photos=next;form.elements.photos.value='';showPhotos();status.textContent='Отзыв сохранён.';
  }catch{status.textContent='Сохранить отзыв не удалось. Попробуй ещё раз.'}
  finally{submit.disabled=false}
 };
}
