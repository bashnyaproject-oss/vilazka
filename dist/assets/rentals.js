'use strict';
(()=>{
 const toggle=$('rentalLayer'), status=$('rentalStatus'), cache=new Map();
 let enabled=false,key='',timer,request,rows=[];
 function rentalSearchLink(message){
  status.textContent=message+' ';
  const center=atlas.getCenter(),link=document.createElement('a');
  link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('Прокат авто '+center.lat+','+center.lng);
  link.textContent='Поиск на карте ↗';link.target='_blank';link.rel='noopener';
  status.append(link);
 }
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
      const signal=request.signal;
      const data=await Promise.any(['https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter'].map(async url=>{
       const response=await fetch(url+'?data='+encodeURIComponent(query),{signal:AbortSignal.any([signal,AbortSignal.timeout(10000)])});
       if(!response.ok)throw Error();
       return response.json();
      }));
      if(key!==box)return;
      if(!Array.isArray(data.elements))throw Error();
      rows=data.elements;
      if(cache.size>=20)cache.delete(cache.keys().next().value);
      cache.set(box,rows);positionPins();
     }catch{if(key===box&&!request.signal.aborted)rentalSearchLink('Пункты проката не загрузились.')}
    },500);
   }
  }
  if(!available||!enabled)return;
  if(!key){status.textContent='Приближаем область поиска…';return}
  if(cache.has(key)){
   if(rows.length)status.textContent='Пункты проката · OpenStreetMap';
   else rentalSearchLink('В OpenStreetMap здесь нет отмеченных пунктов.');
  }
  for(const row of rows){
   const lat=row.lat??row.center?.lat,lon=row.lon??row.center?.lon;
   if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<south||lat>north||lon<west||lon>east)continue;
   const link=document.createElement('a');link.className='rental-pin';link.dataset.at=lon+','+lat;
   link.textContent='🚘';link.title=row.tags?.name||row.tags?.brand||'Прокат авто';
   link.setAttribute('aria-label',link.title);link.href='https://www.openstreetmap.org/'+row.type+'/'+row.id;
   link.target='_blank';link.rel='noopener';pinLayer.append(link);
  }
 };
 toggle.onclick=()=>{
  enabled=!enabled;toggle.setAttribute('aria-checked',String(enabled));
  if(!enabled){positionPins();return}
  const center=atlas.getCenter();
  if(atlas.getZoom()<10){
   const area=loopView.open?loopView.area:null;
   const origin=area?[area.lat,area.lon]:[center.lat,center.lng];
   let target=origin,best=150;
   for(const [, ,lon,lat,population] of atlasCities){
    if(population<10000)continue;
    const km=kmBetween(origin,[lat,lon]);
    if(km<best){best=km;target=[lat,lon]}
   }
   flyTo(target,12);
  }
  positionPins();
 };
})();
