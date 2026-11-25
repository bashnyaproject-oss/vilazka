function travelLink(url, label, newTab=true){
 return '<a href="'+safe(url)+'"'+(newTab?' target="_blank" rel="noopener"':'')+'>'+safe(label)+' ↗</a>';
}
function flightLinks(origin,destination){
 const iata=value=>/^[A-Z]{3}$/.test(value||'')?value:'';
 const to=iata(destination),from=iata(origin)===to?'':iata(origin);
 const query=to?'Flights '+(from?'from '+from+' ':'')+'to '+to:'';
 const pair=from&&to?from+'-'+to:'';
 const sites=[
  ['Aviasales','https://www.aviasales.ru/'],
  ['Google Flights','https://www.google.com/travel/flights'+(query?'?q='+encodeURIComponent(query):'')],
  ['Skyscanner',pair?'https://www.skyscanner.net/routes/'+from.toLowerCase()+'/'+to.toLowerCase()+'.html':'https://www.skyscanner.net/'],
  ['KAYAK',pair?'https://www.kayak.com/flights/'+pair:'https://www.kayak.com/flights'],
  ['Momondo',pair?'https://www.momondo.com/flight-search/'+pair:'https://www.momondo.com/flights'],
  ['Trip.com','https://www.trip.com/flights/'],
  ['Expedia','https://www.expedia.com/Flights'],
  ['Booking.com','https://www.booking.com/flights/'],
  ['Kiwi.com','https://www.kiwi.com/'],
  ['CheapOair','https://www.cheapoair.com/flights/']
 ];
 return '<details class="travel-links"><summary>Найти авиабилеты</summary>'+
 (to?'<small>'+(from?from+' → ':'Аэропорт назначения · ')+to+'</small>':'')+
 '<div>'+sites.map(([name,url])=>travelLink(url,name)).join('')+'</div></details>';
}
function navigationLinks(points){
 const coords=points.map(p=>Array.isArray(p)?p:[p.lat,p.lon])
  .filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=90&&Math.abs(p[1])<=180)
  .map(p=>p.slice(0,2).join(',')).filter((p,i,a)=>i===0||p!==a[i-1]);
 if(coords.length<2)return '';
 const groups=[];
 for(let i=0;i<coords.length-1;i+=4)groups.push(coords.slice(i,i+5));
 const google=groups.map((group,i)=>{
  const query=new URLSearchParams({api:'1',origin:group[0],destination:group.at(-1),travelmode:'driving',dir_action:'navigate'});
  if(group.length>2)query.set('waypoints',group.slice(1,-1).join('|'));
  return travelLink('https://www.google.com/maps/dir/?'+query,groups.length===1?'Google Maps':'Google Maps · этап '+(i+1));
 }).join('');
 const yandex=new URLSearchParams();
 function setPoint(point,suffix){const [lat,lon]=point.split(',');yandex.set('lat_'+suffix,lat);yandex.set('lon_'+suffix,lon)}
 setPoint(coords[0],'from');setPoint(coords.at(-1),'to');
 coords.slice(1,-1).forEach((point,i)=>setPoint(point,'via_'+i));
 const web=new URLSearchParams({rtext:coords.join('~'),rtt:'auto'});
 return '<details class="travel-links"><summary>Открыть в навигаторе</summary><div>'+google+
 travelLink('yandexnavi://build_route_on_map?'+yandex,'Яндекс Навигатор',false)+
 travelLink('https://yandex.ru/maps/?'+web,'Яндекс Карты · веб')+'</div></details>';
}
