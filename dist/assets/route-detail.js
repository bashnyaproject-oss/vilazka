function drawLoopDetails(box,card,area,approach){
 const start=card.start||area;
 const point=xy(start).join(',');
 const stops=[start,...card.stops];
 if(!card.source||card.ring)stops.push(start);
 const home=loopHome();
 const positioned=home&&kmBetween(home,xy(start))<2;
 const directions='https://www.google.com/maps/dir/?api=1&destination='+point+(home?'&origin='+home.slice(0,2).join(','):'');
 const link=(url,label)=>'<a target="_blank" rel="noopener" href="'+safe(url)+'">'+safe(label)+' ↗</a>';
 const scenes=card.stops.map((p,i)=>{
  const source=p.credit&&p.credit.startsWith('https://')?p.credit:null;
  const map='https://www.google.com/maps/search/?api=1&query='+xy(p).join(',');
  return '<li>'+loopPhoto(p,i)+'<div><strong>'+safe(p.name)+'</strong>'+((p.description||p.kind)?'<small>'+safe(p.description||p.kind)+'</small>':'')+link(map,'На карте')+(source?link(source,'Источник'):'')+'</div></li>';
 }).join('');
 box.innerHTML='<div class="loop-bar"><button data-loop="back">← К вариантам</button><button data-loop="close" aria-label="Закрыть">×</button></div>'+
 '<div class="loop-detail"><h2>'+safe(card.title)+'</h2><p>'+safe(card.length||'Считаем по дорогам…')+'</p>'+(card.ferries?.length?'<p class="ferry-note">Есть паром · на карте голубой пунктир. Проверь расписание перед выездом.</p>':'')+(card.why?'<p>'+safe(card.why)+'</p>':'')+
 (card.line?navigationLinks(stops):'')+
 '<section><h3>Сложность и дорога</h3><p>'+safe(accessLabel(card))+'</p><p>'+safe(card.surface||'Данных о покрытии нет. Расчёт проезда основан на дорожной карте.')+'</p></section>'+
 '<section><h3>Как добраться до старта</h3><p>'+safe(start.name)+'</p>'+
 '<p>'+safe(positioned?'Ты рядом со стартом':approach?.label||'Укажи местоположение или открой карту для построения пути')+'</p>'+
 (approach?.air?flightLinks(approach.from,approach.to):'')+link(directions,'Маршрут до старта')+'</section>'+
 '<h3>Что увидишь по пути</h3><ol>'+scenes+'</ol>'+(card.source?link(card.source,'Подробности о маршруте'):'')+'</div>'+
 '<div class="loop-actions"><button data-loop="back" aria-label="Назад">‹</button><button data-loop="save" '+(!card.line?'disabled':'')+'>Сохранить маршрут</button></div>';
}
