// Russian UI strings for Darkness Planner
window.DARK_LANG_RU = {
  appSubtitle: 'Найдите самые тёмные ночи',
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

  // Locations
  locationsTitle: 'Локации',
  locationLabel: 'Локация',
  locationCurrent: 'Текущее место',
  locationUnnamed: 'Без названия',

  locationBtnSave: 'Сохранить',
  locationBtnRename: 'Переименовать',
  locationBtnDelete: 'Удалить',

  locationPromptName: 'Название локации:',
  locationDefaultNewName: 'Новая локация',
  locationPromptRename: 'Новое название:',
  locationConfirmDelete: 'Удалить эту локацию?',

  locationSaved: 'Сохранено.',
  locationUpdated: 'Обновлено.',
  locationRenamed: 'Переименовано.',
  locationDeleted: 'Удалено.',
  locationTzDetecting: 'Определяем часовой пояс…',
  

  // Tabs
  tabBasic: 'Базовое',
  tabDarkness: 'Темнота',
  tabWeather: 'Погода',

  // Units section
  unitsTitle: 'Единицы',
  labelWindUnits: 'Единицы ветра',
  labelTempUnits: 'Единицы температуры',

  // Section titles
  darkFilterTitle: 'Фильтр темноты',
  weatherFilterTitle: 'Фильтр погоды',

  // Darkness filter
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

  // Weather filter UI
  weatherEnableHint: 'Отмечать ночи, где погода соответствует окну фильтра темноты',
  weatherMaxCloud: 'Макс. облачность (%)',
  weatherMaxWind: 'Макс. ветер',
  weatherMaxHumidity: 'Макс. влажность (%)',
  weatherMinConsec: 'Мин. подряд хороших часов',
  weatherHint:
    '«Хороший час» = облачность ≤ порога И ветер ≤ порога И влажность ≤ порога.<br>' +
    'Ночь отмечается только если есть как минимум N подряд хороших часов внутри окна фильтра темноты.',

  // Selected night blocks
  blockDarkTitle: 'Полная темнота (выбранная ночь)',
  blockSunTitle: 'Солнце',
  blockMoonTitle: 'Луна (для этой ночи)',
  blockPhaseTitle: 'Фаза Луны',

  // Future table
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

  // Sun
  sunSunset: 'Заход Солнца',
  sunSunrise: 'Восход Солнца',
  sunAstrStart: 'Начало астр. ночи',
  sunAstrEnd: 'Конец астр. ночи',

  // Moon
  moonBelowAllNight: 'Луна ниже горизонта всю ночь.',
  moonAboveAllNight: 'Луна над горизонтом всю ночь.',
  moonNoEvents: 'Нет восхода/захода Луны в пределах этой ночи.',
  moonRisePrefix: 'Восход: ',
  moonSetPrefix: 'Заход: ',

  // Phase
  phaseUnavailable: 'Фаза Луны недоступна',

  // No-darkness messages
  noAstrNight:
    '<span class="warn">Астрономической ночи нет (Солнце не уходит ниже −18°).</span>',
  noFullDark:
    '<span class="warn">Полной темноты нет (Луна мешает всю астрономическую ночь).</span>',
  darkMulti: 'В течение ночи несколько отдельных окон полной темноты.',
  darkSingle:
    'Между этими моментами Луна ниже горизонта и идёт астрономическая ночь.',

  // Filter status text
  filterNightNoDark: 'В эту ночь нет астрономической темноты без Луны. ',
  filterDayIn: 'Текущая ночь входит в выбранные дни недели. ',
  filterDayOut: 'Текущая ночь не входит в выбранные дни недели. ',
  filterTimeOkPrefix: 'В выбранном интервале темнота ',
  filterTimeOkSuffix: ' (не меньше минимальных ',
  filterTimeNotOkPrefix: 'В выбранном интервале только ',
  filterTimeNotOkSuffix: ' темноты (меньше минимальных ',
  filterTimeClose: '). ',

  nextNightPrefix: 'Следующая подходящая ночь: ',
  nextNightTomorrow: 'завтра',
  nextNightAfter: 'послезавтра',
  nextNightInDays: 'через {D} дн.',
  nextNone: 'В ближайшие 30 ночей подходящих вариантов по фильтру не найдено.',

  // Geo
  geoNotSupported: 'Браузер не поддерживает геолокацию.',
  geoFailed: 'Не удалось получить координаты.',

  // Filter dropdown special options
  filterAstrStart: 'Начало астрономической ночи',
  filterAstrEnd: 'Конец астрономической ночи',

  // Hourly details (expanded row)
  weatherDetailsTitle: 'Погода (часы астрономической ночи)',
  weatherNoData: 'Нет прогноза для этой ночи (вне диапазона прогноза).',

  // Hourly table columns
  colTime: 'Время',
  colCloud: 'Обл. %',
  colWind: 'Ветер',
  colHumidity: 'Влаж. %',
  colAOD: 'AOD',
  colSeeing: 'Синг',

// Tools (Export / Import)
toolsTitle: 'Инструменты (Экспорт / Импорт)',
toolsBtnExport: 'Экспорт',
toolsBtnCopy: 'Копировать',
toolsBtnDownload: 'Скачать .txt',
toolsBtnImport: 'Импорт',
toolsBtnReset: 'Сбросить настройки',
toolsPlaceholder: 'Вставьте текст экспорта сюда для импорта…',

toolsStatusNoData: 'Пока нечего экспортировать. Сначала воспользуйтесь приложением и попробуйте снова.',
toolsStatusExported: 'Экспортировано.',
toolsStatusNothingToCopy: 'Нечего копировать.',
toolsStatusCopied: 'Скопировано.',
toolsStatusCopyFailed: 'Не удалось скопировать. Выделите текст и скопируйте вручную.',
toolsStatusDownloaded: 'Скачано.',
toolsStatusImported: 'Импортировано. Перезагрузка…',
toolsStatusReset: 'Сброшено. Перезагрузка…',
toolsConfirmReset: 'Сбросить все настройки приложения к значениям по умолчанию?',
toolsStatusFileLoaded: 'Файл загружен. Теперь нажмите «Импорт».',
toolsStatusFileLoadFailed: 'Не удалось прочитать файл.',
toolsStatusImportFailed: 'Ошибка импорта: ',

weatherUpdatedLabel: "Погода обновлена",
weatherCachedTag: " (кеш)",
weatherNoData: "Погода: нет данных",

  seeingLabels: {
    excellent: 'Отлично',
    good: 'Хорошо',
    average: 'Средне',
    poor: 'Плохо'
  },

  versionLabel: 'Darkness Planner · v1.48'
};