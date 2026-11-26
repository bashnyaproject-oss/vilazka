'use strict';
const visaSource='https://github.com/maxix7/visa-requirements-dataset';
const visaLabels=['Нет данных','Без визы','По прибытии','Разрешение ETA','Электронная виза','Виза заранее','Въезд ограничен','Своя страна'];
const visaColors=['#676770','#57ca9a','#80c8d5','#80a7ea','#c99eec','#e5a968','#df7581','#acb5bb'];
const visaIndexes=new Map(visaData.codes.map((v,i)=>[v,i]));
const regionNames=new Intl.DisplayNames([document.documentElement.lang||'ru'],{type:'region'});
const visaPaths=new Map();
let visaGeo=null,visaRequested=false;
function usablePassport(code){
 const rank=p=>{const k=p===code?7:Number(visaData.rows[p]?.[visaIndexes.get(code)]||0);return [9,1,3,2,4,5,6,0][k]};
 return state.passport2&&visaIndexes.has(state.passport2)&&rank(state.passport2)<rank(state.passport)?state.passport2:state.passport;
}
function visaKind(code){
 if(!visaIndexes.has(state.passport)||!visaIndexes.has(code))return 0;
 const p=usablePassport(code);return p===code?7:Number(visaData.rows[p][visaIndexes.get(code)]);
}
function visaVisible(){return visaIndexes.has(state.passport)&&(state.visaLayer??flying())}
function entryOptions(){
 return [...visaData.codes].sort((a,b)=>regionNames.of(a).localeCompare(regionNames.of(b),document.documentElement.lang)).map(code=>'<option value="'+code+'">'+regionNames.of(code)+'</option>').join('');
}
function entryInfo(code){
 if(!visaIndexes.has(state.passport))return '';
 const ref=visaData.refs[usablePassport(code)+code];
 const link=ref?visaData.sources[ref[0]]:visaSource;
 return '<div class="entry-info"><b>'+visaLabels[visaKind(code)]+'</b> · '+regionNames.of(usablePassport(code))+' → '+(visaIndexes.has(code)?regionNames.of(code):'—')+'<br><small>Туризм · '+(ref?.[1]||'срез 17.02.2026')+' · <a target="_blank" rel="noopener" href="'+safe(link)+'">Источник ↗</a></small></div>';
}
function updateVisaMap(){
 const on=visaVisible();$('visaLayer').setAttribute('aria-pressed',String(on));$('visaLegend').hidden=!on;
 if(on){$('visaEditPassport').value=state.passport;$('visaPassport').textContent=[state.passport,state.passport2].filter(p=>visaIndexes.has(p)).map(p=>regionNames.of(p)).join(' / ');}
 if(!atlas||canvas||!atlas.getStyle()?.layers)return;
 const id='passport-entry';
 if(!on){if(atlas.getLayer(id))atlas.setLayoutProperty(id,'visibility','none');return}
 if(!atlas.getLayer(id)){
  visaGeo??={type:'FeatureCollection',features:countryShapes.map(([id,,,,,rings])=>({type:'Feature',properties:{code:visaData.iso2[id]||'?'},geometry:{type:'Polygon',coordinates:rings}}))};
  atlas.addSource(id,{type:'geojson',data:visaGeo});
  const before=atlas.getStyle().layers.find(l=>l.type==='line'||l.type==='symbol');
  atlas.addLayer({id,type:'fill',source:id,paint:{'fill-opacity':.32}},before?.id);
 }
 atlas.setLayoutProperty(id,'visibility','visible');
 atlas.setPaintProperty(id,'fill-color',['match',['get','code'],...visaData.codes.flatMap(c=>[c,visaColors[visaKind(c)]]),visaColors[0]]);
}
function paintOfflineVisa(ctx,nw,se){
 if(!visaVisible())return;
 ctx.save();ctx.globalAlpha=.32;
 for(const shape of countryShapes){
  const [id,w,s,e,n,rings]=shape;if(w>se.lng||e<nw.lng||s>nw.lat||n<se.lat)continue;
  let path=visaPaths.get(shape);
  if(!path){path=new Path2D();for(const ring of rings){path.moveTo(...ring[0]);for(let i=1;i<ring.length;i++)path.lineTo(...ring[i]);path.closePath()}visaPaths.set(shape,path)}
  ctx.fillStyle=visaColors[visaKind(visaData.iso2[id])];ctx.fill(path,'evenodd');
 }
 ctx.restore();
}
function initVisa(){
 const legend=$('visaLegend');legend.innerHTML='<summary>Условия въезда · <b id="visaPassport"></b></summary><label>Паспорт <select id="visaEditPassport">'+entryOptions()+'</select></label><div class="visa-key">'+visaLabels.map((v,i)=>'<span><i style="background:'+visaColors[i]+'"></i>'+v+'</span>').join('')+'</div><label>Куда едешь? <select id="visaCountry"><option value="">Выбери страну</option>'+entryOptions()+'</select></label><div id="visaResult"></div><small>Туризм · база 17.02.2026, поправки по 10.08.2026. <a href="'+visaSource+'" target="_blank" rel="noopener">Данные · CC BY 4.0 ↗</a></small>';
 $('visaEditPassport').onchange=e=>{
  const code=e.target.value;if(!visaIndexes.has(code))return;
  if(state.passport2===code)state.passport2=state.passport;
  state.passport=code;persist();updateVisaMap();canvas?.draw();
  $('visaResult').innerHTML=$('visaCountry').value?entryInfo($('visaCountry').value):'';
  render();
 };
 $('visaCountry').onchange=e=>$('visaResult').innerHTML=e.target.value?entryInfo(e.target.value):'';
 $('visaLayer').onclick=()=>{
  if(!visaIndexes.has(state.passport)){visaRequested=true;showProfile();return}
  state.visaLayer=!visaVisible();persist();updateVisaMap();canvas?.draw();if(state.visaLayer)legend.open=true;
 };
}
