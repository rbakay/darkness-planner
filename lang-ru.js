// Russian UI strings for Darkness Planner
window.DARK_LANG_RU = {
  appSubtitle: 'Местоположение, дата ночи и формат времени/даты.',
  topHint:
    'Полная темнота: астрономическая ночь (Солнце ниже −18°), пока Луна под горизонтом.<br>' +
    'Ночь: выбранная дата <b>D</b> → <b>D+1</b> (например, ночь 29→30).',
  labelLat: 'Широта, ° (север +)',
  labelLon: 'Долгота, ° (восток + / запад −)',
  labelStartDate: 'Стартовая дата ночи',
  btnGeo: 'Моё положение',
  btnCalc: 'Пересчитать',
  labelTimeFormat: 'Формат времени',
  timeFormatHint: '24 часа (снять галочку — AM/PM)',
  labelDateFormat: 'Формат даты',
  labelLanguage: 'Язык / Language',
  filterSubtitle:
    'Фильтр: искать ночи, где в выбранном интервале есть не меньше заданного времени полной темноты.',
  labelFilterFrom: 'Фильтр времени: от',
  labelFilterTo: 'Фильтр времени: до',
  labelFilterDuration: 'Мин. длительность темноты, часы',
  labelDowFilter: 'Фильтр по дням недели',
  dowEmpty: 'Пусто (все дни)',
  dowFriSat: 'пт, сб',
  dowFriSatSun: 'пт, сб, вск',
  dowSatSun: 'сб, вск',
  labelDisplayOptions: 'Отображение',
  filterHideLabel: 'Скрывать ночи, которые не проходят фильтр',
  filterHighlightLabel: 'Подсвечивать ночи, которые проходят фильтр',
  filterHint:
    'Если «Мин. длительность» = 0, фильтр по времени не действует (но фильтр по дням недели работает, если выбран).',
  blockDarkTitle: 'Полная темнота (выбранная ночь)',
  blockSunTitle: 'Солнце',
  blockMoonTitle: 'Луна (для этой ночи)',
  blockPhaseTitle: 'Фаза Луны',
  futureTitle: 'Следующие 30 ночей — окна полной темноты',
  thNight: 'Ночь',
  thDarkness: 'Полная темнота',
  thTotal: 'Суммарная длительность',
  nightLegend:
    'Столбец «Ночь» — календарный день <b>D</b>, сама ночь — <b>D → D+1</b>.',
  weekendSat: ' (суббота)',
  weekendSun: ' (воскресенье)',
  nightPrefix: 'ночь ',
  nightHeaderPrefix: 'Ночь ',
  sunSunset: 'Заход Солнца',
  sunSunrise: 'Восход Солнца',
  sunAstrStart: 'Начало астр. ночи',
  sunAstrEnd: 'Конец астр. ночи',
  moonBelowAllNight: 'Луна ниже горизонта всю ночь.',
  moonAboveAllNight: 'Луна над горизонтом всю ночь.',
  moonNoEvents: 'Нет восхода/захода Луны в пределах этой ночи.',
  moonRisePrefix: 'Восход: ',
  moonSetPrefix: 'Заход: ',
  phaseUnavailable: 'Фаза Луны недоступна',
  noAstrNight:
    '<span class="warn">Астрономической ночи нет (Солнце не уходит ниже −18°).</span>',
  noFullDark:
    '<span class="warn">Полной темноты нет (Луна мешает всю астрономическую ночь).</span>',
  darkMulti: 'В течение ночи несколько отдельных окон полной темноты.',
  darkSingle:
    'Между этими моментами Луна ниже горизонта и идёт астрономическая ночь.',
  filterNightNoDark:
    'В эту ночь нет астрономической темноты без Луны. ',
  filterDayIn:
    'Текущая ночь входит в выбранные дни недели. ',
  filterDayOut:
    'Текущая ночь не входит в выбранные дни недели. ',
  filterTimeOkPrefix:
    'В выбранном интервале темнота ',
  filterTimeOkSuffix:
    ' (не меньше минимальных ',
  filterTimeNotOkPrefix:
    'В выбранном интервале только ',
  filterTimeNotOkSuffix:
    ' темноты (меньше минимальных ',
  filterTimeClose: '). ',
  nextNightPrefix: 'Следующая подходящая ночь: ',
  nextNightTomorrow: 'завтра',
  nextNightAfter: 'послезавтра',
  nextNightInDays: 'через {D} дн.',
  nextNone:
    'В ближайшие 30 ночей подходящих вариантов по фильтру не найдено.',
  geoNotSupported: 'Браузер не поддерживает геолокацию.',
  geoFailed: 'Не удалось получить координаты.',
  versionLabel: 'Darkness Planner · v1.0'
};