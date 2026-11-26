# Живописные автодороги мира

В каталоге два формата. Маршруты с остановками составлены по туристическим источникам и рассчитаны по дорожной сети. Массовые карточки показывают непрерывные участки из картографических реестров с исходным названием или номером, длиной и ссылкой на источник.

## Подборка по ландшафтам

| Маршрут | Что смотреть вдоль дороги | Источник |
| --- | --- | --- |
| Айсфилдс-Паркуэй, Канада | Озеро Пейто, Колумбийское ледниковое поле, долины между Лейк-Луизом и Джаспером | [Parks Canada](https://parks.canada.ca/pn-np/ab/banff/visit/promenadedesglaciers-icefieldsparkway) |
| Великая океанская дорога, Австралия | Прибрежные изгибы между Торки, Лорном и Аполло-Бей, скалы у Двенадцати апостолов | [Tourism Australia](https://www.australia.com/en/places/melbourne-and-surrounds/guide-to-the-great-ocean-road.html) |
| Дорога семи озёр, Аргентина | Озёра и леса Анд на трассе RN40 между Вилья-ла-Ангостурой и Сан-Мартин-де-лос-Андесом | [Villa La Angostura Turismo](https://www.villalaangosturaturismo.gob.ar/en/atractivos/ruta-7-lagos) |
| Милфорд-роуд, Новая Зеландия | Миррор-Лейкс, горная долина и тоннель Хомера по пути к фьорду | [Department of Conservation](https://www.doc.govt.nz/milfordroad) |
| Гросглокнер, Австрия | Подъём через Ферлайтен и высокогорные панорамы у Хохтора | [Оператор дороги](https://www.grossglockner.at/en/the-high-alpine-road) |
| Золотое кольцо, Исландия | Тингведлир, геотермальная долина Гейсир и каскады Гюдльфосса | [Visit Iceland](https://www.visiticeland.com/article/the-golden-circle/) |
| Венус-Лайн, Япония | Озеро Сиракаба, высокогорные луга Киригаминэ и плато Уцукусигэхара | [Go! NAGANO](https://www.go-nagano.net/en/trip-idea/the-venus-line-guide) |
| Чапманс-Пик-Драйв, ЮАР | Склоны над Атлантикой между Хаут-Бей и Нордхуком | [South African Tourism](https://www.southafrica.net/na/en/travel/article/cape-town-s-special-drive-chapman-s-peak) |
| Высотная дорога Шварцвальда, Германия | Леса Шварцвальда, озеро Муммельзе и район Руштайна | [Landkreis Rastatt Tourismus](https://tourismus.landkreis-rastatt.de/-/schwarzwaldhochstrasse/leb5000757) |
| Альпийская дорога, Германия | Боденское озеро, баварские предгорья, монастырь Этталь и Кёнигсзе | [Germany Travel](https://www.germany.travel/en/nature-outdoor-activities/german-alpine-road.html) |
| Бергштрассе, Германия | Виноградники и предгорья Оденвальда между Дармштадтом и Вислохом | [Germany Travel](https://www.germany.travel/en/nature-outdoor-activities/scenic-routes.html) |
| Дорога сказок, Германия | Фахверковые города и долины на пути от Ханау до Бремена | [Germany Travel](https://www.germany.travel/en/nature-outdoor-activities/german-fairytale-route.html) |
| Атлантическая дорога и Лофотены, Норвегия | Мосты над проливами, горы и рыбацкие посёлки | [Norwegian Scenic Routes](https://www.nasjonaleturistveger.no/en/routes/) |
| Блу-Ридж-Паркуэй, США | Гребни Аппалачей и лесные панорамы | [America’s Scenic Highways and Byways](https://services7.arcgis.com/yiuFazTjHE8F5gzQ/arcgis/rest/services/America_s_Scenic_Highways_and_Byways_WFL1/FeatureServer) |

## Откуда взяты массовые данные

- **America’s Scenic Highways and Byways.** Опубликованная в ArcGIS сводка с отдельными слоями национальных, лесных, парковых и других живописных дорог. [Реестр](https://services7.arcgis.com/yiuFazTjHE8F5gzQ/arcgis/rest/services/America_s_Scenic_Highways_and_Byways_WFL1/FeatureServer)
- **Вашингтон и Кентукки.** Реестры транспортных ведомств. Из Вашингтона импортированы дорожные участки без паромных записей. Кентукки публикует слой под CC0. [WSDOT](https://data.wsdot.wa.gov/arcgis/rest/services/Shared/ScenicByways/MapServer/0) · [KYTC](https://www.arcgis.com/home/item.html?id=6dc5e5627b00409a92af1dc97103bdab)
- **Типперэри, Ирландия.** Геометрия отдельных живописных участков из Scenic Routes Publicview. [Слой Scenic Routes](https://www.arcgis.com/home/item.html?id=71b96f06c8f8465a94d4792ac0976ac0)
- **OpenStreetMap.** Именованные автомобильные дороги с отметкой scenic=yes там, где удалось получить геометрию. [© OpenStreetMap contributors, ODbL](https://www.openstreetmap.org/copyright)

## Как собирались карточки

1. Исключались записи без координат, линии короче 0,5 км и записи с явным указанием морского перевозчика. Из OpenStreetMap также исключались пешеходные, служебные и явно закрытые для автодвижения дороги.
2. Соседние части объединялись по совпадающим концам. При разрывах или развилках сохранялся самый длинный непрерывный участок. У повторяющегося нормализованного названия сохранялся один представитель.
3. Длина участка рассчитана по координатам до упрощения линии превью. Для маршрутов с остановками длина и время получены от маршрутизатора.
4. Подходящие снимки добавлены с указанием источника в карточке. Снимок может показывать пейзаж рядом с трассой. Карточки без фотографии используют контур дороги.
5. Массовая часть сильно смещена в сторону США. Международная подборка в начале каталога выделяет дороги разных регионов и ландшафтов. Формы доступа, текущие перекрытия и состояние покрытия нужно смотреть в местных источниках. Слой проката отмечает известные пункты без сведений о свободных автомобилях.

[Код импорта](../scripts/import-scenic-roads.py) · [Данные массового импорта](../dist/assets/world-scenic-roads.json) · [Каталог](https://vilazka.vercel.app/roads.html)
