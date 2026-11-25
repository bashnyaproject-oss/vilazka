const routeAccess={easy:'Легко · в основном асфальт',mixed:'Средне · возможен грунт',offroad:'Сложно · 4×4',unknown:'Доступность не уточнена'};
function accessLabel(route){return routeAccess[route.access]||routeAccess.unknown}
function accessOptions(){return '<option value="">Любая доступность</option>'+Object.entries(routeAccess).map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join('')}
