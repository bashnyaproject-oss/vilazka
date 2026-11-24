'use strict';
// The account is optional. Only the five travel preferences are sent when saved.
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
function accountOffer(){
 const dialog=$('dialog'),connected=profileRemote?.remote.connected;
 dialog.innerHTML='<div class="panel" id="accountPanel"><button class="close" data-dialog-close aria-label="Закрыть">×</button><h2>Профиль сохранён</h2>'+
 (connected?'<p>Личное хранилище · '+safe(profileRemote.remote.userAddress)+'</p><button class="action" id="backupPrefs">Сохранить настройки в аккаунт</button><button class="action secondary" id="restorePrefs">Загрузить настройки из аккаунта</button><button id="disconnectPrefs">Выйти</button>':'<p>Хочешь открыть эти настройки на другом устройстве?</p><a class="action" href="https://5apps.com/storage" target="_blank" rel="noopener">Зарегистрироваться в 5apps ↗</a><form id="connectPrefs"><label>Адрес хранилища<input name="address" type="email" required placeholder="name@5apps.com"></label><button class="action secondary">Подключить аккаунт</button></form>')+
 '<p id="accountStatus" role="status"></p><button data-dialog-close>Готово</button></div>';
 if(!dialog.open)dialog.showModal();
 const status=$('accountStatus');
 if(!connected){
  $('connectPrefs').onsubmit=async e=>{e.preventDefault();const address=e.target.elements.address.value.trim();try{localStorage.setItem('vilazka-storage','1');sessionStorage.setItem('vilazka-return','1');const rs=await profileStorage();if(!rs.remote.connected)await rs.connect(address)}catch{status.textContent='Не удалось подключить хранилище.'}};
  return;
 }
 $('disconnectPrefs').onclick=async()=>{await profileRemote.disconnect();localStorage.removeItem('vilazka-storage');accountOffer()};
 $('backupPrefs').onclick=async()=>{
  try{const prefs=Object.fromEntries(prefKeys.map(k=>[k,state[k]||'']));const r=await profileRemote.remote.put(profilePath,JSON.stringify(prefs),'application/json');if(r.status<200||r.status>=300)throw Error();status.textContent='Настройки сохранены в аккаунте.'}catch{status.textContent='Не удалось сохранить в аккаунте.'}
 };
 $('restorePrefs').onclick=async()=>{
  try{const r=await profileRemote.remote.get(profilePath);if(r.status===404){status.textContent='В аккаунте пока нет настроек.';return}if(r.status!==200)throw Error();
   const p=typeof r.body==='string'?JSON.parse(r.body):r.body;
   if(!p||![p.passport,p.passport2].every(c=>c===''||visaIndexes.has(c))||!['2','3','4','5','6','8'].includes(p.drive)||!(p.driveKm===''||(/^\d+$/.test(p.driveKm)&&+p.driveKm>=1&&+p.driveKm<=3000))||!['Город','Природа','Роад-трип'].includes(p.taste))throw Error();
   for(const k of prefKeys)state[k]=p[k];persist();updateVisaMap();canvas?.draw();showProfile();
  }catch{status.textContent='Не удалось загрузить настройки.'}
 };
}
window.addEventListener('load',()=>{if(localStorage.getItem('vilazka-storage'))profileStorage().then(()=>{if(profileRemote.remote.connected&&sessionStorage.getItem('vilazka-return')){sessionStorage.removeItem('vilazka-return');accountOffer()}}).catch(()=>{})});
