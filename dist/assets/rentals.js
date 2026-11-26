'use strict';
(()=>{
 const toggle=$('rentalLayer'), status=$('rentalStatus'), cache=new Map();
 let enabled=false,key='',timer,request,rows=[];
 window.drawRentalPins=()=>{
  const available=highlightRoads();
  toggle.hidden=!available;
  status.hidden=!available||!enabled;
  pinLayer.querySelectorAll('.rental-pin').forEach(pin=>pin.remove());
  const bounds=atlas.getBounds();
  const south=bounds.getSouth(),west=bounds.getWest(),north=bounds.getNorth(),east=bounds.getEast();
  const next=available&&enabled&&atlas.getZoom()>=10&&west>=-180&&east<=180
   ?[Math.floor(south*20)/20,Math.floor(west*20)/20,Math.ceil(north*20)/20,Math.ceil(east*20)/20].join(','):'';
  if(next!==key){
   key=next;clearTimeout(timer);request?.abort();rows=cache.get(key)||[];
   if(key&&!cache.has(key)){
    status.textContent='Ищем пункты проката…';
    timer=setTimeout(async()=>{
     const box=next;
     const query='[out:json][timeout:10];nwr["amenity"="car_rental"]('+box+');out center;';
     request=new AbortController();
     try{
      const response=await fetch('https://overpass.kumi.systems/api/interpreter?data='+encodeURIComponent(query),{signal:AbortSignal.any([request.signal,AbortSignal.timeout(14000)])});
      if(!response.ok)throw Error();
      const data=await response.json();
      if(key!==box)return;
      rows=data.elements;
      if(cache.size>=20)cache.delete(cache.keys().next().value);
      cache.set(box,rows);positionPins();
     }catch(e){if(key===box&&e.name!=='AbortError')status.textContent='Не удалось загрузить пункты проката';}
    },500);
   }
  }
  if(!available||!enabled)return;
  if(!key){status.textContent='Приблизь карту до города';return}
  if(cache.has(key))status.textContent=rows.length?'Пункты проката · OpenStreetMap':'В этой области нет отмеченных пунктов';
  for(const row of rows){
   const lat=row.lat??row.center?.lat,lon=row.lon??row.center?.lon;
   if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<south||lat>north||lon<west||lon>east)continue;
   const link=document.createElement('a');link.className='rental-pin';link.dataset.at=lon+','+lat;
   link.textContent='🚘';link.title=row.tags?.name||row.tags?.brand||'Прокат авто';
   link.setAttribute('aria-label',link.title);link.href='https://www.openstreetmap.org/'+row.type+'/'+row.id;
   link.target='_blank';link.rel='noopener';pinLayer.append(link);
  }
 };
 toggle.onclick=()=>{enabled=!enabled;toggle.setAttribute('aria-checked',String(enabled));positionPins()};
})();
