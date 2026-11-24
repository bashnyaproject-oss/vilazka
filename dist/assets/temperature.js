'use strict';
(() => {
  const button = $('thermalToggle'), field = $('thermalCanvas'), key = $('thermalKey');
  const caption = $('thermalCaption'), ctx = field.getContext('2d');
  const periods = { winter:[11,0,1], spring:[2,3,4], summer:[5,6,7], autumn:[8,9,10] };
  const names = { winter:'Зима', spring:'Весна', summer:'Лето', autumn:'Осень' };
  const stops = [[-20,85,138,224],[0,140,187,189],[15,215,187,129],[30,236,128,96]];
  let enabled = false, normals, loading, timer, request, live, revision = 0, frame = 0;
  const cache = new Map();
  const clip = (x,min,max) => Math.max(min, Math.min(max,x));
  const mix = (a,b,t) => a + (b-a)*t;
  const wrap = lon => ((lon%360)+360)%360;
  function climateAt(lon,lat,months) {
    const x = wrap(lon)/1.875, y = clip((90-lat)/2,0,90);
    const i = Math.floor(x), j = Math.floor(y);
    let sum = 0;
    for (const m of months) {
      const offset = m*91*192;
      const row = r => mix(normals[offset+r*192+i],normals[offset+r*192+(i+1)%192],x-i);
      sum += mix(row(j),row(Math.min(90,j+1)),y-j);
    }
    return sum/(2*months.length);
  }
  function forecastAt(lon,lat) {
    if (!live) return null;
    const {west,east,south,north,temps} = live;
    const lng = lon+360*Math.round(((west+east)/2-lon)/360);
    if (lng<west || lng>east || lat<south || lat>north) return null;
    const x=3*(lng-west)/(east-west), y=3*(north-lat)/(north-south);
    const i=Math.min(2,Math.floor(x)), j=Math.min(2,Math.floor(y));
    const row=r=>mix(temps[r*4+i],temps[r*4+i+1],x-i);
    return mix(row(j),row(j+1),y-j);
  }
  function paint() {
    if (!enabled || !atlas || frame) return;
    frame=requestAnimationFrame(() => {
      frame=0;
      if (!enabled) return;
      const w=field.clientWidth,h=field.clientHeight;
      if (!w || !h) return;
      const cols=Math.ceil(w/9),rows=Math.ceil(h/9);
      if(field.width!==cols || field.height!==rows){field.width=cols;field.height=rows}
      const pixels=ctx.createImageData(cols,rows);
      const center=atlas.getCenter(), mid=atlas.project([center.lng,center.lat]);
      const px=atlas.project([center.lng+1,center.lat]).x-mid.x;
      const month=new Date().getMonth(), months=periods[state.seasonMode] || [month];
      const longitudes=Array.from({length:cols},(_,i)=>center.lng+((i+.5)*w/cols-mid.x)/px);
      for(let y=0;y<rows;y++){
        const sy=(y+.5)*h/rows;
        const lat=atlas.unproject ? atlas.unproject([mid.x,sy]).lat : center.lat-(sy-mid.y)/px;
        for(let x=0;x<cols;x++){
          const lon=longitudes[x];
          if(Math.abs(lat)>90 || (!atlas.unproject && Math.abs(lon)>180)) continue;
          const t=live ? forecastAt(lon,lat) : normals ? climateAt(lon,lat,months) : null;
          if(t===null)continue;
          const k=t<0?0:t<15?1:2, a=stops[k],b=stops[k+1],f=clip((t-a[0])/(b[0]-a[0]),0,1);
          const idx=(y*cols+x)*4;
          for(let c=1;c<=3;c++)pixels.data[idx+c-1]=mix(a[c],b[c],f);
          pixels.data[idx+3]=255;
        }
      }
      ctx.putImageData(pixels,0,0);
    });
  }
  function describe() {
    const period=names[state.seasonMode] || new Intl.DateTimeFormat('ru',{month:'long'}).format(new Date());
    caption.textContent=live?'Сейчас · '+live.time.slice(11,16)+' UTC · Open-Meteo':normals?period+' · норма 1991–2020 · NOAA':'Загружаем температуру…';
  }
  async function getLive(ticket) {
    const b=atlas.getBounds();
    let east=b.getEast(), west=b.getWest(); if(east<west)east+=360;
    const step=Math.max(.025,2**Math.floor(Math.log2(Math.max(.05,east-west)/8)));
    west=Math.floor(west/step)*step; east=Math.min(west+360,Math.ceil(east/step)*step);
    const south=clip(Math.floor(b.getSouth()/step)*step,-90,90),north=clip(Math.ceil(b.getNorth()/step)*step,-90,90);
    if(east<=west || north<=south)return;
    const id=[west,east,south,north].join('/');
    const hit=cache.get(id);
    if(hit && Date.now()-hit.saved<900000){live=hit;describe();paint();return}
    const lats=[],lons=[];
    for(let y=0;y<4;y++)for(let x=0;x<4;x++){
      lats.push(mix(north,south,y/3).toFixed(3));lons.push((wrap(mix(west,east,x/3)+180)-180).toFixed(3));
    }
    const controller=new AbortController();request=controller;
    const timeout=setTimeout(()=>controller.abort(),8000);
    try {
      const url='https://api.open-meteo.com/v1/forecast?latitude='+lats+'&longitude='+lons+'&current=temperature_2m&timezone=GMT';
      const response=await fetch(url,{signal:controller.signal});
      if(!response.ok)throw Error();
      const data=await response.json(), temps=data.map(p=>p.current?.temperature_2m);
      if(ticket!==revision || temps.length!==16 || !temps.every(Number.isFinite))return;
      live={west,east,south,north,temps,time:data[0].current.time,saved:Date.now()};
      if(cache.size>=24)cache.delete(cache.keys().next().value);
      cache.set(id,live);describe();paint();
    } catch {if(ticket===revision){describe();if(!normals)caption.textContent='Данные температуры недоступны'}}
    finally {clearTimeout(timeout)}
  }
  function refresh(){
    ++revision;clearTimeout(timer);request?.abort();live=null;
    if(!enabled)return;
    describe();paint();
    if(state.seasonMode==='now' && atlas){const ticket=revision;timer=setTimeout(()=>getLive(ticket),450)}
  }
  button.onclick=()=>{
    enabled=!enabled;button.setAttribute('aria-pressed',String(enabled));field.hidden=key.hidden=!enabled;
    if(enabled && !normals && !loading){
      loading=fetch('assets/temperature.bin').then(r=>{if(!r.ok)throw Error();return r.arrayBuffer()}).then(buffer=>{
        if(buffer.byteLength!==12*91*192*2)throw Error();
        normals=new Int16Array(buffer);if(enabled){describe();paint()}
      }).catch(()=>{if(enabled&&!live)caption.textContent='Сезонные данные недоступны'}).finally(()=>{loading=null});
    }
    refresh();
  };
  $('season').addEventListener('change',refresh);
  window.temperatureLayer={refresh,paint};
})();
