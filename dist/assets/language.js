'use strict';
(() => {
 const phrases = `
Язык интерфейса|Interface language
Найти город или место|Search cities and places
Выбери место|Choose a place
Вылазка|Vylazka
От|From
На|On
До 2 часов|Up to 2 hours
До 3 часов|Up to 3 hours
До 5 часов|Up to 5 hours
До 8 часов|Up to 8 hours
Твой ориентир за рулём — до|Your daily driving limit is
ч в день|h per day
По модели дорога до места займёт больше|The estimated drive exceeds this limit
Запланируй остановку на ночь|Plan an overnight stop
Проверь длительность каждого переезда по карте|Check each driving leg on the map
Проверить условия въезда и пересадки|Check entry and transit requirements
Сохранить брони и карту офлайн|Save bookings and maps offline
Проверить погоду и ограничения на маршруте|Check weather and route restrictions
Уточнить требования к правам, карте и депозиту|Check licence, card and deposit requirements
Открой остановку на карте и проверь путь перед выездом|Open the stop on the map and check the route before leaving
Проверить права, карту, депозит и страховку|Check licence, card, deposit and insurance
Проверить документы на авто, платные дороги и парковки|Check car documents, tolls and parking
Проверить расписание и условия билета|Check the timetable and ticket terms
Выбрать ночёвки и проверить итоговую стоимость|Choose overnight stops and check the total
Сравнение поездок|Trip comparison
Оценка на человека по текущим фильтрам|Estimate per traveller for the selected filters
Шаги выбора|Trip planning steps
Прямая линия · дорожный маршрут сейчас недоступен|Straight line · road route unavailable
Линия направления · расписание поезда уточняется|Direction of travel · check train times
Линия направления · билеты и пересадки уточняются|Direction of travel · check tickets and connections
культурное наследие|cultural heritage
Доломиты|Dolomites
Мадейра|Madeira
Сочи|Sochi
Казань|Kazan
Грузия|Georgia
Италия|Italy
Турция|Türkiye
Армения|Armenia
Норвегия|Norway
Исландия|Iceland
Португалия|Portugal
Каппадокия|Cappadocia
Норвежские фьорды|Norwegian fjords
Юг Исландии|South Iceland
Карелия|Karelia
Озеро Севан|Lake Sevan
Балтийское побережье|Baltic coast
Открыто место|Place discovered
Открыто|Discovered
Атлас пройден|Atlas complete
Через Тутаев к Рыбинску|Via Tutayev to Rybinsk
По правому берегу Волги|Along the right bank of the Volga
К озёрам Русского Севера|Lakes of the Russian North
Серпантин над Аурландс-фьордом|Switchbacks above Aurlandsfjord
Вылеты из|Flights from
Схема направлений на|Route network as of
Проверь рейсы на свои даты|Check flights for your dates
Вылетать отсюда|Depart from here
На авто от твоего старта|Drives from your start
Все|All
Авто|Drive
Самолёт|Fly
Поезд|Train
Авиа + авто|Fly + drive
Сезон|Season
Выбрать сезон|Choose season
Сейчас|Now
Зима|Winter
Весна|Spring
Лето|Summer
Осень|Autumn
Температура|Temperature
Показать температуру|Show temperature
Популярные|Popularity
Популярность|Popularity
Фильтр популярности|Filter by popularity
Все места|All places
Самые известные|Most popular
По просмотрам статей Википедии. На нуле видны и места без данных.|Based on Wikipedia page views. At zero, places without data are also shown.
Куда поехать|Where to go
Подборка сезона|Seasonal picks
Места России|Explore Russia
Все направления|All destinations
Главные направления|Top destinations
Направления|Destinations
Роад-трип|Road trips
Мои поездки|My trips
Поездки|Trips
Профиль|Profile
Настройки карты|Map settings
Режим путешествия|Travel mode
Карта мест|Explore map
Автомаршруты|Road trips
Найти город или место|Search cities and places
Поиск мест|Search places
Закрыть поиск|Close search
Где начать маршрут?|Where will you start?
Результаты|Results
Места рядом с центром карты|Near the map centre
Места на видимой карте|Places in view
Мест с таким названием пока нет.|No matching places.
Сейчас ·|Now ·
Здесь на карте|Here on the map
Загрузка…|Loading…
Загружаем карту…|Loading map…
Обзорная карта|Overview map
офлайн-карта|offline map
Детальная карта|Detailed map
Интерактивная карта направлений|Interactive destination map
Приблизить|Zoom in
Отдалить|Zoom out
Показать все направления|Show all destinations
К точке старта|Go to start
Предыдущее направление|Previous destination
Следующее направление|Next destination
Подборка направлений|Destination picks
Знаковые места|Highlights
Локальные остановки|Local stops
Закрыть панель|Close panel
Закрыть|Close
Отмена|Cancel
Откуда едем?|Where are you starting?
Выбери, откуда поедешь. Покажем варианты и оценим расходы.|Choose a starting point to see trips and estimated costs.
Поставь себя на карту, чтобы увидеть маршруты и цены.|Set your starting point to see routes and estimates.
Моя геопозиция|My location
Указать на карте|Pick on map
Точка на карте|Point on map
Точка старта|Starting point
Выбрать точку старта|Choose starting point
Выбрать старт|Choose start
Выбери старт|Choose a start
Изменить точку старта|Change starting point
Определяем старт…|Finding your location…
Запрашиваем геопозицию…|Requesting location…
Геопозиция недоступна|Location unavailable
Можно выбрать город вручную|Choose a city manually
Поставь точку пипеткой|Pick a point on the map
Поставь точку старта|Set your starting point
Нажми на нужное место на карте|Tap a location on the map
Точка прибытия|Arrival point
Выбранная точка|Selected point
Центр карты|Map centre
Точка|Point
Откуда|From
Когда|When
На сколько|Duration
Любой месяц|Any month
Любая длительность|Any duration
Без визы заранее|No advance visa
Оценки бюджета · иллюстрации мест|Estimated costs · place illustrations
Посмотреть место|Explore place
В демокаталоге нет совпадений. Попробуй другой месяц или способ поездки.|No matches. Try a different month or travel mode.
Нажми на сердечко у поездки, чтобы добавить её сюда.|Tap the heart on a trip to save it here.
Убрать из сохранённых|Remove from saved
Сохранить|Save
Для этих фильтров мест пока нет.|No places match these filters.
Кольцевые маршруты|Driving loops
Кольца отсюда|Loops from here
Кольца рядом|Nearby loops
Кольцо на северо-восток|Northeast loop
Кольцо на юго-восток|Southeast loop
Кольцо на юго-запад|Southwest loop
Кольцо на северо-запад|Northwest loop
Кольцо на запад|West loop
Кольцо на север|North loop
Кольцо на юг|South loop
Кольцо на восток|East loop
Выбрать другую точку прибытия|Change arrival point
Закрыть роад-трип|Close road trips
Предыдущее кольцо|Previous loop
Следующее кольцо|Next loop
Выбрать кольцо|Choose loop
Пока мало остановок рядом|Too few stops nearby
Выбрать другую точку|Choose another point
Мой маршрут|My route
Считаем по дорогам…|Calculating drive…
Считаем подъезд…|Calculating connections…
Схема · дорожный расчёт недоступен|Outline · road routing unavailable
Маршрут подъезда уточняется|Connection unavailable
Считаем путь по дорогам…|Calculating road distance…
Дорожный расчёт недоступен · показаны остановки|Road routing unavailable · stops shown
Моя точка старта|My starting point
Домашняя точка|Home location
Дом|Home
На авто|By car
Перелёт + аренда|Flight + rental
Перелёт|Flight
авто|car
Ищем маршрут по дорогам…|Finding a road route…
Источник изображения|Image source
Источник фотографии|Photo source
Фото и лицензия|Photo and licence
Спутниковый вид места|Satellite view of
Спутниковый вид|Satellite view
вид со спутника|satellite view
Спутник|Satellite
Иллюстрация места|Place illustration
Фото|Photo
Оценки места|Place ratings
Яндекс Карты|Yandex Maps
Google Карты|Google Maps
Отзывы|Reviews
Рейтинг Яндекса|Yandex rating
Культурное наследие|Cultural heritage
Природное наследие|Natural heritage
Всемирное наследие|World heritage
Культура|Culture
Природа|Nature
Наследие|Heritage
Каталог мест|Place catalogue
Название или тип места|Name or category
Найти место в России|Find a place in Russia
Показать ещё|Show more
Хочу сюда|Save place
В поездках|Saved
Улицы и места рядом|Explore nearby streets
Открыть точку на карте|Open in maps
Открыть точку|Open stop
Весь маршрут|Full route
Остановка на маршруте по региону.|A stop on this regional route.
Выбрать маршрут|Choose route
Маршрут отсюда|Route from here
Что понадобится|What to bring
Въезд|Entry
Официальные условия|Official requirements
Проверить перелёты|Find flights
Открыть в картах|Open in maps
Найти жильё|Find accommodation
Найти авто|Find a car
Поездка сохранена|Trip saved
Отметить, куда приеду|Set arrival point
Что взять и проверить|Packing checklist
Что делать по дням|Daily plan
Своё авто|My car
По городу|Around town
Маршрут по городу|City route
на человека|per person
Дорога|Transport
Жильё и еда|Accommodation and food
Аренда|Rental
Модельная оценка, не тариф|Estimated cost
Депозит и визовые сборы отдельно|Deposit and visa fees are extra
Профиль путешественника|Traveller profile
Город старта меняется на карте|Set your starting city on the map
Предпочтения и паспорт сохраняются в этом браузере|Preferences and passport country are saved in this browser
ПАСПОРТ|PASSPORT
Не указан|Unspecified
Страна ЕС|EU country
Другой|Other
ЧТО ХОЧЕТСЯ УВИДЕТЬ|INTERESTS
КОМФОРТНО ЗА РУЛЁМ В ДЕНЬ|DAILY DRIVING LIMIT
Сохранить профиль|Save profile
Добавь паспорт|Add passport country
без визы|visa-free
внутри страны|domestic
уточнить|check requirements
Бюджет|Budget
В поездке|On trip
Место|Place
В пути|Travel time
Поездка|Trip
Подготовка|Preparation
День|Day
Вылеты из|Flights from
Вылет|Departure
Аэропорты|Airports
Аэропорт|Airport
Куда лететь|Where to fly
Выбери аэропорт|Choose an airport
Выбрать направление|Choose destination
Выбрать другую точку старта|Choose another starting point
Собрать маршрут на авто|Build a driving route
Исследовать рядом|Explore nearby
Вылетать отсюда|Fly from here
Источник направлений|Route source
прямые направления|direct flights
Рядом нет аэропорта из каталога|No airport nearby in the catalogue
Аэропорты · выбери старт|Airports · choose your start
Железные дороги · места рядом с путями|Railways · places near the tracks
Автодороги · места для поездки|Roads · nearby destinations
Этап|Stage
точка прибытия|arrival point
Остановки по порядку|Stops in order
Убрать остановку|Remove stop
Изменить остановки и параметры|Edit stops and settings
Места рядом|Places nearby
В радиусе 70 км пока нет других мест в каталоге.|No more places within 70 km.
Можно поставить свою остановку.|Add your own stop on the map.
Все места в радиусе 70 км|All places within 70 km
Выбери место|Choose a place
Указать остановку на карте|Pick a stop on the map
Добавить следующий этап|Add next stage
весь маршрут в одну сторону|total one-way route
Расход, л/100 км|Consumption, L/100 km
Цена топлива, €/л|Fuel price, €/L
Сегодня в районе этапа|Today's weather
Готовность|Checklist
Убрать этап|Remove stage
Нажми на место остановки|Tap a stop on the map
Следующий этап|Next stage
нажми на карту или место|tap the map or a place
Поставь точку прибытия|Pick an arrival point
Добавить|Add
Получаем прогноз…|Loading forecast…
Сегодня прогноз недоступен.|Forecast unavailable today.
осадки|rain chance
ветер до|wind up to
Возьми дождевик|Pack a raincoat
Пригодится тёплый слой|Bring a warm layer
Для прогулки выбери защищённое от ветра место|Choose a sheltered spot for your walk
Документы и бронирования|Documents and bookings
Права и документы на машину|Driving licence and car documents
Проверить заправки и парковки|Check fuel stops and parking
Скачать карты|Download maps
Вода и перекус|Water and snacks
Зарядка для телефона|Phone charger
Одежда по прогнозу|Clothes for the weather
По автодорогам|By road
Оценка по прямой × 1,28|Straight-line estimate × 1.28
Часть пути оценена по прямой × 1,28|Some segments estimated × 1.28
Загружаем температуру…|Loading temperatures…
Данные температуры недоступны|Temperature data unavailable
Сезонные данные недоступны|Seasonal data unavailable
норма 1991–2020|1991–2020 average
Горнолыжный отдых|Ski trip
Зимние горы|Winter mountains
Музеи и архитектура|Museums and architecture
Прогулка у воды|Waterside walk
Архитектура и история|Architecture and history
Павильоны и выставки|Pavilions and exhibitions
Островная архитектура|Island architecture
Озеро и прогулки|Lakeside walks
Побережье Баренцева моря|Barents Sea coast
Прогулка по горному парку|Mountain park walk
Каньон и прогулка по парку|Canyon and park walk
Исторический центр и музеи|Old town and museums
Музей-заповедник|Museum reserve
Кремль и музейные коллекции|Kremlin and museum collections
Москва|Moscow
Берлин|Berlin
Осло|Oslo
Амстердам|Amsterdam
Стамбул|Istanbul
Россия|Russia
Город|City
км от|km from
км по прямой|km straight-line
км по дорогам|km by road
мин за рулём|min driving
ч в одну сторону|h one way
км/ч|km/h
дней|days
дня|days
мест|places
км|km
мин|min
ч|h
л|L
дн.|days
из|of
Из|From
Январь|January
Февраль|February
Март|March
Апрель|April
Май|May
Июнь|June
Июль|July
Август|August
Сентябрь|September
Октябрь|October
Ноябрь|November
Декабрь|December
`;
 const dict=new Map(phrases.trim().split('\n').map(line=>line.split('|')));
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const pattern=new RegExp('(?<![а-яёА-ЯЁ])(?:'+[...dict.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|')+')(?![а-яёА-ЯЁ])','g');
 const lang=document.documentElement.lang;
 const selects=document.querySelectorAll('[data-ui-language]');
 selects.forEach(select=>{select.value=lang;select.onchange=()=>{const u=new URL(location.href);u.searchParams.set('lang',select.value);try{localStorage.setItem('vilazka-language',select.value)}catch{}location.replace(u)}});
 if(lang!=='en')return;
 document.title='Vylazka — Travel Atlas';
 const convert=text=>/[А-Яа-яЁё]/.test(text)?text.replace(pattern,key=>dict.get(key)):text;
 window.translateAtlas=convert;
 const attrs=['placeholder','title','aria-label','aria-valuetext','alt'];
 function attr(el,k){const v=el.getAttribute(k);if(v){const tr=convert(v);if(tr!==v)el.setAttribute(k,tr)}}
 function element(el){
  if(el.tagName==='OPTION'&&!el.hasAttribute('value'))el.value=el.textContent;
  for(const k of attrs)if(el.hasAttribute(k))attr(el,k);
 }
 function translate(n){
  if(n.nodeType===3){if(n.parentElement?.tagName==='OPTION')element(n.parentElement);const t=convert(n.data);if(t!==n.data)n.data=t;return}
  if(n.nodeType!==1||n.matches('script,style,canvas,svg'))return;
  element(n);
  const walk=document.createTreeWalker(n,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:e=>e.nodeType===1&&e.matches('script,style,svg,canvas')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  let child;while(child=walk.nextNode()){if(child.nodeType===1)element(child);else{const t=convert(child.data);if(t!==child.data)child.data=t}}
 }
 translate(document.body);
 new MutationObserver(changes=>{for(const m of changes){
  if(m.type==='attributes')attr(m.target,m.attributeName);
  else if(m.type==='characterData')translate(m.target);
  else m.addedNodes.forEach(translate);
 }}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrs});
})();
