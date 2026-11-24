'use strict';
// Regional photos are matched by article title and geographic coordinates at build time.
const popularity = {
  get minimum(){ return Number(document.getElementById('popRange').value) },
  score(key){ return placeMedia[key]?.[0] || 0 },
  allows(key){ return this.score(key)>=this.minimum }
};
function aerial(lon,lat,width=320){
  const radius=width>100?.025:.035;
  const dx=radius/Math.max(.15,Math.cos(lat*Math.PI/180));
  const box=[lon-dx,lat-radius,lon+dx,lat+radius].map(v=>v.toFixed(5)).join(',');
  return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox='+box+'&bboxSR=4326&imageSR=3857&size='+width+','+Math.round(width*.72)+'&format=jpg&f=image';
}
function photoFigure(key,name,lon,lat,original='',by=''){
  const entry=placeMedia[key],image=original||entry?.[1],satellite=aerial(lon,lat);
  const source=original?'https://whc.unesco.org/en/list/'+key+'/':image?'https://'+entry[2]+'.wikipedia.org/wiki/'+'File:'+encodeURIComponent(entry[3]):'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9';
  const label=original?'Фото · '+by:image?'Фото и лицензия · Wikimedia':'Спутниковый вид · Esri World Imagery';
  const rank=entry?.[0]?' · <a target="_blank" rel="noopener" href="https://'+entry[2]+'.wikipedia.org/?curid='+entry[4]+'">Популярность '+entry[0]+'/10</a>':'';
  return '<figure class="geo-figure"><img alt="'+safe(image?name:'Спутниковый вид места '+name)+'" src="'+safe(image||satellite)+'" data-aerial="'+safe(satellite)+'"><figcaption><a href="'+safe(source)+'" target="_blank" rel="noopener">'+safe(label)+' ↗</a>'+rank+'</figcaption></figure>';
}
document.addEventListener('error',event=>{
 const img=event.target;
 if(img.tagName!=='IMG'||!img.dataset.aerial)return;
 const fallback=img.dataset.aerial;delete img.dataset.aerial;
 if(img.getAttribute('src')!==fallback){
   img.src=fallback;img.alt='Спутниковый вид';
   const credit=img.closest('figure')?.querySelector('a');
   if(credit){credit.textContent='Спутниковый вид · Esri World Imagery ↗';credit.href='https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9'}
 }else img.hidden=true;
},true);
