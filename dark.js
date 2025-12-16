// Darkness Planner main script
// Uses StarJs (StarJs.min.js) and SunCalc (CDN)

const UI_STRINGS = {
  en: window.DARK_LANG_EN,
  ru: window.DARK_LANG_RU
};

// Key for localStorage
const STORAGE_KEY = 'darkness-planner-settings-v1';

// Global UI settings
const settings = {
  time24: true,
  dateFormat: 'DMY',
  lang: 'en'
};

// ---------- Weather integration (hooks, uses weather.js if present) ----------

// Legacy fallback state (in case weather.js is not loaded)
const WEATHER = {
  enabled: false,
  ready: false
};

function weatherIsEnabled() {
  if (window.WeatherService && typeof WeatherService.isEnabled === 'function') {
    return WeatherService.isEnabled();
  }
  return WEATHER.enabled === true;
}

function weatherMatchForNight(baseDate, darkData, filter) {
  if (!window.WeatherService) return null;
  if (typeof WeatherService.readConfigFromUI === 'function') {
    WeatherService.readConfigFromUI();
  }
  if (!WeatherService.isEnabled || !WeatherService.isEnabled()) return null;
  if (!WeatherService.isReady || !WeatherService.isReady()) return null;
  if (typeof WeatherService.evaluateNight !== 'function') return null;
  return WeatherService.evaluateNight(baseDate, darkData, filter);
}

// ---------- Generic helpers ----------

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

function atLocalMidnight(date) {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

function shiftDays(date, delta) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + delta);
  return d;
}

function diffMinutes(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

function fmtDate(d) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  switch (settings.dateFormat) {
    case 'MDY':
      return `${mm}/${dd}/${yyyy}`;
    case 'YMD':
      return `${yyyy}-${mm}-${dd}`;
    case 'DMY2':
      return `${dd}.${mm}.${String(yyyy).slice(-2)}`;
    case 'DMY':
    default:
      return `${dd}.${mm}.${yyyy}`;
  }
}

function fmtDateShort(d) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  switch (settings.dateFormat) {
    case 'MDY':
      return `${mm}/${dd}`;
    case 'YMD':
      return `${mm}-${dd}`;
    case 'DMY2':
      return `${dd}.${mm}.${String(yyyy).slice(-2)}`;
    case 'DMY':
    default:
      return `${dd}.${mm}`;
  }
}

function fmtTime(d) {
  if (!d || isNaN(d.getTime())) return '—';
  const h = d.getHours();
  const m = d.getMinutes();
  if (settings.time24) {
    return pad2(h) + ':' + pad2(m);
  } else {
    let suffix = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ':' + pad2(m) + ' ' + suffix;
  }
}

function fmtDuration(mins) {
  const lang = settings.lang;
  if (!mins || mins <= 0) return lang === 'ru' ? '0 мин' : '0 min';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (lang === 'ru') {
    if (h > 0) return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
    return `${m} мин`;
  } else {
    if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
    return `${m} min`;
  }
}

function formatIntervals(intervals) {
  if (!intervals || intervals.length === 0) return '—';
  return intervals.map(i => `${fmtTime(i.start)}–${fmtTime(i.end)}`).join(', ');
}

function labelHour(h) {
  if (settings.time24) return pad2(h) + ':00';
  let suffix = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return h12 + ':00 ' + suffix;
}

// ---------- Units (wind/temp placeholders) ----------

function getWindUnitKey() {
  const sel = document.getElementById('weatherWindUnits');
  return sel ? (sel.value || 'ms') : 'ms'; // 'ms' | 'kmh' | 'mph'
}

function windUnitLabelText(unitKey) {
  if (unitKey === 'kmh') return 'km/h';
  if (unitKey === 'mph') return 'mph';
  return 'm/s';
}

function windMsToUnit(ms, unitKey) {
  if (typeof ms !== 'number' || !isFinite(ms)) return null;
  if (unitKey === 'kmh') return ms * 3.6;
  if (unitKey === 'mph') return ms * 2.2369362920544;
  return ms;
}

function windUnitToMs(v, unitKey) {
  const num = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  if (!isFinite(num)) return null;
  if (unitKey === 'kmh') return num / 3.6;
  if (unitKey === 'mph') return num / 2.2369362920544;
  return num;
}

function updateWindUnitLabelUI() {
  const span = document.getElementById('windUnitLabel');
  if (!span) return;
  span.textContent = windUnitLabelText(getWindUnitKey());
}

// ---------- Tabs (Basic / Darkness / Weather) ----------

let currentTab = 'basic';

function initTabs() {
  const tabButtons = Array.from(document.querySelectorAll('.tab-btn[data-tab]'));
  const panels = Array.from(document.querySelectorAll('.tab-panel[data-panel]'));
  if (!tabButtons.length || !panels.length) return;

  function activate(tabName, persist = true) {
    currentTab = tabName;

    tabButtons.forEach(btn => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach(p => {
      p.classList.toggle('active', p.dataset.panel === tabName);
    });

    if (persist) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : {};
        data.activeTab = tabName;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // чтобы не закрывать settings-card
      activate(btn.dataset.tab || 'basic');
    });
  });

  // Keyboard support (Left/Right)
  tabButtons.forEach((btn, idx) => {
    btn.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = (idx + dir + tabButtons.length) % tabButtons.length;
      tabButtons[next].focus();
      activate(tabButtons[next].dataset.tab || 'basic');
    });
  });

  // Restore from storage if present
  let desired = 'basic';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.activeTab) desired = String(data.activeTab);
    }
  } catch (e) {}

  const exists = tabButtons.some(b => b.dataset.tab === desired);
  activate(exists ? desired : (tabButtons[0].dataset.tab || 'basic'), false);
}

// ---------- Settings + language ----------

function updateSettingsFromUI() {
  const t24 = document.getElementById('time24');
  const df = document.getElementById('dateFormat');
  const langSel = document.getElementById('langSelect');

  if (t24) settings.time24 = !!t24.checked;
  if (df) settings.dateFormat = df.value || 'DMY';
  if (langSel) settings.lang = langSel.value || 'en';
}

function saveSettingsToStorage() {
  try {
    const latEl = document.getElementById('lat');
    const lonEl = document.getElementById('lon');

    const fromSel = document.getElementById('filterFromHour');
    const toSel = document.getElementById('filterToHour');
    const durEl = document.getElementById('filterDuration');
    const hideEl = document.getElementById('filterHide');
    const hlEl = document.getElementById('filterHighlight');
    const dowSel = document.getElementById('dowFilter');
    const dateFormatSel = document.getElementById('dateFormat');
    const langSel = document.getElementById('langSelect');
    const time24El = document.getElementById('time24');

    const wEn = document.getElementById('weatherEnabled');
    const wC = document.getElementById('weatherMaxCloud');
    const wW = document.getElementById('weatherMaxWind');
    const wH = document.getElementById('weatherMaxHumidity');
    const wN = document.getElementById('weatherMinConsec');
    const wWindUnits = document.getElementById('weatherWindUnits');
    const wTempUnits = document.getElementById('weatherTempUnits');

    const data = {
      lat: latEl ? (parseFloat(latEl.value) || 0) : 0,
      lon: lonEl ? (parseFloat(lonEl.value) || 0) : 0,
      time24: !!(time24El && time24El.checked),
      dateFormat: dateFormatSel ? (dateFormatSel.value || 'DMY') : 'DMY',
      lang: langSel ? (langSel.value || 'en') : 'en',
      filterFromHour: fromSel ? fromSel.value : '21',
      filterToHour: toSel ? toSel.value : '2',
      filterDuration: durEl ? (durEl.value || '0') : '0',
      filterHide: !!(hideEl && hideEl.checked),
      filterHighlight: !!(hlEl && hlEl.checked),
      dowFilter: dowSel ? (dowSel.value || '') : '',

      weatherEnabled: !!(wEn && wEn.checked),
      weatherMaxCloud: wC ? (wC.value ?? '10') : '10',
      weatherMaxWind: wW ? (wW.value ?? '6') : '6',
      weatherMaxHumidity: wH ? (wH.value ?? '70') : '70',
      weatherMinConsec: wN ? (wN.value ?? '3') : '3',

      weatherWindUnits: wWindUnits ? (wWindUnits.value || 'ms') : 'ms',
      weatherTempUnits: wTempUnits ? (wTempUnits.value || 'c') : 'c',

      activeTab: currentTab || 'basic'
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    const latEl = document.getElementById('lat');
    const lonEl = document.getElementById('lon');

    if (latEl && typeof data.lat === 'number') latEl.value = data.lat.toFixed(4);
    if (lonEl && typeof data.lon === 'number') lonEl.value = data.lon.toFixed(4);

    const time24El = document.getElementById('time24');
    const dateFormatSel = document.getElementById('dateFormat');
    const langSel = document.getElementById('langSelect');
    const fromSel = document.getElementById('filterFromHour');
    const toSel = document.getElementById('filterToHour');
    const durEl = document.getElementById('filterDuration');
    const hideEl = document.getElementById('filterHide');
    const hlEl = document.getElementById('filterHighlight');
    const dowSel = document.getElementById('dowFilter');

    if (time24El && ('time24' in data)) {
      time24El.checked = !!data.time24;
      settings.time24 = !!data.time24;
    }
    if (dateFormatSel && data.dateFormat) {
      dateFormatSel.value = data.dateFormat;
      settings.dateFormat = data.dateFormat;
    }
    if (langSel && data.lang) {
      langSel.value = data.lang;
      settings.lang = data.lang;
    }

    if (fromSel && typeof data.filterFromHour === 'string') fromSel.value = data.filterFromHour;
    if (toSel && typeof data.filterToHour === 'string') toSel.value = data.filterToHour;
    if (durEl && typeof data.filterDuration !== 'undefined') durEl.value = String(data.filterDuration);
    if (hideEl && ('filterHide' in data)) hideEl.checked = !!data.filterHide;
    if (hlEl && ('filterHighlight' in data)) hlEl.checked = !!data.filterHighlight;
    if (dowSel && typeof data.dowFilter === 'string') dowSel.value = data.dowFilter;

    const wEn = document.getElementById('weatherEnabled');
    const wC = document.getElementById('weatherMaxCloud');
    const wW = document.getElementById('weatherMaxWind');
    const wH = document.getElementById('weatherMaxHumidity');
    const wN = document.getElementById('weatherMinConsec');
    const wWindUnits = document.getElementById('weatherWindUnits');
    const wTempUnits = document.getElementById('weatherTempUnits');

    if (wEn && ('weatherEnabled' in data)) wEn.checked = !!data.weatherEnabled;
    if (wC && data.weatherMaxCloud != null) wC.value = String(data.weatherMaxCloud);
    if (wW && data.weatherMaxWind != null) wW.value = String(data.weatherMaxWind);
    if (wH && data.weatherMaxHumidity != null) wH.value = String(data.weatherMaxHumidity);
    if (wN && data.weatherMinConsec != null) wN.value = String(data.weatherMinConsec);

    if (wWindUnits && data.weatherWindUnits) wWindUnits.value = String(data.weatherWindUnits);
    if (wTempUnits && data.weatherTempUnits) wTempUnits.value = String(data.weatherTempUnits);

    updateWindUnitLabelUI();

    if (data.activeTab) currentTab = String(data.activeTab);
  } catch (e) {}
}

function applyLanguage() {
  const lang = settings.lang;
  const L = UI_STRINGS[lang] || UI_STRINGS.en;

  document.documentElement.lang = lang === 'ru' ? 'ru' : 'en';

  const setText = (id, val, html = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (html) el.innerHTML = val;
    else el.textContent = val;
  };

  // Core header texts
  setText('i_appSubtitle', L.appSubtitle, true);
  setText('i_topHint', L.topHint, true);

  // Basic section labels/buttons
  setText('i_labelLat', L.labelLat);
  setText('i_labelLon', L.labelLon);
  setText('i_labelStartDate', L.labelStartDate);

  setText('btnGeo', L.btnGeo);
  setText('btnCalc', L.btnCalc);

  setText('i_labelTimeFormat', L.labelTimeFormat);
  setText('i_timeFormatHint', L.timeFormatHint);
  setText('i_labelDateFormat', L.labelDateFormat);
  setText('i_labelLanguage', L.labelLanguage);

  // Darkness filter section labels
  setText('i_filterSubtitle', L.filterSubtitle);
  setText('i_labelFilterFrom', L.labelFilterFrom);
  setText('i_labelFilterTo', L.labelFilterTo);
  setText('i_labelFilterDuration', L.labelFilterDuration);
  setText('i_labelDowFilter', L.labelDowFilter);

  setText('i_dowEmpty', L.dowEmpty);
  setText('i_dowFriSat', L.dowFriSat);
  setText('i_dowFriSatSun', L.dowFriSatSun);
  setText('i_dowSatSun', L.dowSatSun);

  setText('i_labelDisplayOptions', L.labelDisplayOptions);
  setText('i_filterHideLabel', L.filterHideLabel);
  setText('i_filterHighlightLabel', L.filterHighlightLabel);

  // In your index.html the hint has id="i_minDurationHint"
  // (older builds used i_filterHint)
  setText('i_minDurationHint', L.filterHint);
  setText('i_filterHint', L.filterHint);

  // Blocks
  setText('i_blockDarkTitle', L.blockDarkTitle);
  setText('i_blockSunTitle', L.blockSunTitle);
  setText('i_blockMoonTitle', L.blockMoonTitle);
  setText('i_blockPhaseTitle', L.blockPhaseTitle);

  // Table
  setText('i_futureTitle', L.futureTitle);
  setText('i_thNight', L.thNight);
  setText('i_thDarkness', L.thDarkness);
  setText('i_thTotal', L.thTotal);

  // Tabs (IDs are in index.html)
  setText('i_tabBasic', L.tabBasic || 'Basic');
  setText('i_tabDarkness', L.tabDarkness || 'Darkness');
  setText('i_tabWeather', L.tabWeather || 'Weather');

  // Units (IDs in index.html)
  setText('i_unitsTitle', L.unitsTitle || 'Units');
  setText('i_labelWindUnits', L.weatherWindUnitsLabel || L.labelWindUnits || 'Wind units');
  setText('i_labelTempUnits', L.weatherTempUnitsLabel || L.labelTempUnits || 'Temperature units');

  // Section titles (IDs in index.html)
  setText('i_darkFilterTitle', L.darknessFilterTitle || L.darkFilterTitle || 'Darkness filter');

  // Weather filter (IDs in index.html)
  setText('i_weatherFilterTitle', L.weatherFilterTitle || 'Weather filter');
  setText('i_weatherEnableHint', L.weatherEnabledLabel || L.weatherEnableHint || '');
  setText('i_weatherMaxCloud', L.weatherMaxCloudLabel || L.weatherMaxCloud || '');
  setText('i_weatherMaxWind', L.weatherMaxWindLabel || L.weatherMaxWind || '');
  setText('i_weatherMaxHumidity', L.weatherMaxHumidityLabel || L.weatherMaxHumidity || '');
  setText('i_weatherMinConsec', L.weatherMinConsecLabel || L.weatherMinConsec || '');
  setText('i_weatherHint', L.weatherHint || '');

  const legend = document.getElementById('i_nightLegend');
  if (legend) legend.innerHTML = L.nightLegend;

  setText('versionLabel', L.versionLabel);
}

function updateFilterHourLabels() {
  const fromSel = document.getElementById('filterFromHour');
  const toSel = document.getElementById('filterToHour');
  if (!fromSel || !toSel) return;

  const L = UI_STRINGS[settings.lang] || UI_STRINGS.en;

  const startLabel =
    L.filterAstrStart ||
    (settings.lang === 'ru' ? 'Начало астр. ночи' : 'Astronomical night start');
  const endLabel =
    L.filterAstrEnd ||
    (settings.lang === 'ru' ? 'Конец астр. ночи' : 'Astronomical night end');

  [fromSel, toSel].forEach(sel => {
    for (const opt of sel.options) {
      const v = opt.value;
      if (v === 'astrStart') opt.textContent = startLabel;
      else if (v === 'astrEnd') opt.textContent = endLabel;
      else {
        const h = parseInt(v, 10);
        if (!isNaN(h)) opt.textContent = labelHour(h);
      }
    }
  });
}

function getFilterConfig() {
  const fromSel = document.getElementById('filterFromHour');
  const toSel = document.getElementById('filterToHour');
  const durEl = document.getElementById('filterDuration');
  const hideEl = document.getElementById('filterHide');
  const hlEl = document.getElementById('filterHighlight');
  const dowSel = document.getElementById('dowFilter');

  const rawFrom = fromSel ? fromSel.value : '21';
  const rawTo = toSel ? toSel.value : '2';

  const fromAstrStart = rawFrom === 'astrStart';
  const toAstrEnd = rawTo === 'astrEnd';

  let fromHour = fromAstrStart ? 0 : parseInt(rawFrom, 10);
  let toHour = toAstrEnd ? 0 : parseInt(rawTo, 10);
  if (isNaN(fromHour)) fromHour = 0;
  if (isNaN(toHour)) toHour = 0;

  let dur = durEl && durEl.value ? durEl.value.toString().replace(',', '.') : '0';
  let durNum = parseFloat(dur);
  if (!isFinite(durNum) || durNum < 0) durNum = 0;

  const minMinutes = durNum > 0 ? Math.round(durNum * 60) : 0;

  let allowedDays = null;
  const dowVal = dowSel ? dowSel.value : '';
  switch (dowVal) {
    case 'fri_sat': allowedDays = [5, 6]; break;
    case 'fri_sat_sun': allowedDays = [5, 6, 0]; break;
    case 'sat_sun': allowedDays = [6, 0]; break;
    default: allowedDays = null;
  }

  return {
    fromHour,
    toHour,
    fromAstrStart,
    toAstrEnd,
    minMinutes,
    hideNonMatch: !!(hideEl && hideEl.checked),
    highlightMatches: !!(hlEl && hlEl.checked),
    allowedDays
  };
}

// ---------- Astronomy based on StarJS ----------

function getEventsForDate(midnightLocal, latDeg, lonDeg) {
  if (!window.StarJs || !StarJs.Solar || !StarJs.Time) return null;
  const mjd0 = StarJs.Time.time2mjd(midnightLocal);
  const mjd1 = mjd0 + 1;
  const latRad = latDeg * StarJs.Math.DEG2RAD;
  const lonRad = lonDeg * StarJs.Math.DEG2RAD;
  const arr = StarJs.Solar.sunAndMoonEvents(mjd0, mjd1, lonRad, latRad);
  return arr && arr[0] ? arr[0] : null;
}

function getSunTimesForNight(baseDate, latDeg, lonDeg) {
  const mid0 = atLocalMidnight(baseDate);
  const mid1 = shiftDays(mid0, 1);

  const e0 = getEventsForDate(mid0, latDeg, lonDeg);
  const e1 = getEventsForDate(mid1, latDeg, lonDeg);

  const sun0 = e0 && e0.sun ? e0.sun : {};
  const sun1 = e1 && e1.sun ? e1.sun : {};

  const day0 = sun0.day || {};
  const day1 = sun1.day || {};

  const twA0 = sun0.twilightA || {};
  const twA1 = sun1.twilightA || {};

  let sunset = null;
  if (typeof day0.set === 'number') sunset = new Date(mid0.getTime() + day0.set * 3600 * 1000);

  let sunrise = null;
  if (typeof day1.rise === 'number') sunrise = new Date(mid1.getTime() + day1.rise * 3600 * 1000);

  let astrStart = null;
  if (typeof twA0.set === 'number') astrStart = new Date(mid0.getTime() + twA0.set * 3600 * 1000);

  let astrEnd = null;
  if (typeof twA1.rise === 'number') astrEnd = new Date(mid1.getTime() + twA1.rise * 3600 * 1000);

  return { mid0, mid1, sunset, sunrise, astrStart, astrEnd };
}

function getFullDarknessForNight(baseDate, latDeg, lonDeg) {
  const sun = getSunTimesForNight(baseDate, latDeg, lonDeg);
  const { astrStart, astrEnd } = sun;

  if (!astrStart || !astrEnd || astrEnd <= astrStart) {
    return { sun, darknessIntervals: [], totalMinutes: 0 };
  }

  const stepMs = 5 * 60 * 1000;
  const latRad = latDeg * StarJs.Math.DEG2RAD;
  const lonRad = lonDeg * StarJs.Math.DEG2RAD;
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);

  let intervals = [];
  let inDark = false;
  let runStart = null;

  const startMs = astrStart.getTime();
  const endMs = astrEnd.getTime();

  for (let tMs = startMs; tMs <= endMs; tMs += stepMs) {
    const t = new Date(tMs);

    const mjd = StarJs.Time.time2mjd(t);
    const T = StarJs.Time.mjd2jct(mjd);

    const pos = StarJs.Solar.approxMoon(T);
    const ra = pos.ra;
    const dec = pos.dec;

    const gmst = StarJs.Time.gmst(mjd);
    const lst = gmst + lonRad;
    const H = lst - ra;

    const sinAlt = sinLat * Math.sin(dec) + cosLat * Math.cos(dec) * Math.cos(H);
    const alt = Math.asin(sinAlt);

    const nowDark = alt < 0;

    if (nowDark && !inDark) {
      inDark = true;
      runStart = t;
    } else if (!nowDark && inDark) {
      inDark = false;
      intervals.push({ start: runStart, end: new Date(tMs) });
      runStart = null;
    }
  }

  if (inDark && runStart) intervals.push({ start: runStart, end: astrEnd });

  let totalMinutes = 0;
  for (const d of intervals) totalMinutes += diffMinutes(d.start, d.end);

  return { sun, darknessIntervals: intervals, totalMinutes };
}

function getMoonNightEvents(baseDate, latDeg, lonDeg) {
  const sun = getSunTimesForNight(baseDate, latDeg, lonDeg);
  const { mid0, mid1, sunset, sunrise } = sun;
  const result = { rises: [], sets: [], flags: { alwaysAbove: false, alwaysBelow: false } };

  if (!sunset || !sunrise) return result;

  const ev0 = getEventsForDate(mid0, latDeg, lonDeg);
  const ev1 = getEventsForDate(mid1, latDeg, lonDeg);
  const windowStart = sunset.getTime();
  const windowEnd = sunrise.getTime();

  function addEventsFrom(ev, mid) {
    if (!ev || !ev.moon || !ev.moon.day) return;
    const d = ev.moon.day;

    if (d.alwaysAbove) result.flags.alwaysAbove = true;
    if (d.alwaysBelow) result.flags.alwaysBelow = true;

    const dayStart = mid.getTime();
    if (typeof d.rise === 'number') {
      const t = dayStart + d.rise * 3600 * 1000;
      if (t >= windowStart && t <= windowEnd) result.rises.push(new Date(t));
    }
    if (typeof d.set === 'number') {
      const t = dayStart + d.set * 3600 * 1000;
      if (t >= windowStart && t <= windowEnd) result.sets.push(new Date(t));
    }
  }

  addEventsFrom(ev0, mid0);
  addEventsFrom(ev1, mid1);

  result.rises.sort((a, b) => a - b);
  result.sets.sort((a, b) => a - b);

  return result;
}

function getFilterOverlapMinutes(baseDate, darknessIntervals, sun, filter) {
  if (!filter || filter.minMinutes <= 0) return 0;
  if (!darknessIntervals || darknessIntervals.length === 0) return 0;

  const baseMid = atLocalMidnight(baseDate);
  const baseMs = baseMid.getTime();

  let windowStartMs;
  if (filter.fromAstrStart) {
    if (!sun || !sun.astrStart) return 0;
    windowStartMs = sun.astrStart.getTime();
  } else {
    windowStartMs = baseMs + filter.fromHour * 3600000;
  }

  let windowEndMs;
  if (filter.toAstrEnd) {
    if (!sun || !sun.astrEnd) return 0;
    windowEndMs = sun.astrEnd.getTime();
  } else {
    windowEndMs = baseMs + filter.toHour * 3600000;
  }

  if (windowEndMs <= windowStartMs) windowEndMs += 24 * 3600000;

  let total = 0;
  for (const interval of darknessIntervals) {
    const s = Math.max(interval.start.getTime(), windowStartMs);
    const e = Math.min(interval.end.getTime(), windowEndMs);
    if (e > s) total += Math.round((e - s) / 60000);
  }
  return total;
}

// ---------- Selected night panel ----------

function updateSelectedNight(baseDate, lat, lon) {
  const L = UI_STRINGS[settings.lang] || UI_STRINGS.en;
  const nightEnd = shiftDays(baseDate, 1);

  const titleEl = document.getElementById('nightTitle');
  const sunInfoEl = document.getElementById('sunInfo');
  const moonInfoEl = document.getElementById('moonInfo');
  const phaseEl = document.getElementById('moonPhase');
  const darkEl = document.getElementById('darknessInfo');
  const darkNoteEl = document.getElementById('darknessNote');
  const filterInfoEl = document.getElementById('filterInfo');

  if (titleEl) {
    titleEl.textContent = `${L.nightHeaderPrefix}${fmtDate(baseDate)} → ${fmtDate(nightEnd)}`;
  }

  const sun = getSunTimesForNight(baseDate, lat, lon);
  if (sunInfoEl) sunInfoEl.innerHTML = '';

  function addSun(labelKey, d) {
    if (!sunInfoEl) return;
    const li = document.createElement('li');
    let label;
    if (labelKey === 'sunset') label = L.sunSunset;
    else if (labelKey === 'sunrise') label = L.sunSunrise;
    else if (labelKey === 'astrStart') label = L.sunAstrStart;
    else if (labelKey === 'astrEnd') label = L.sunAstrEnd;
    else label = labelKey;

    li.textContent = d ? `${label} (${fmtDateShort(d)}) — ${fmtTime(d)}` : `${label}: —`;
    sunInfoEl.appendChild(li);
  }

  addSun('sunset', sun.sunset);
  addSun('sunrise', sun.sunrise);
  addSun('astrStart', sun.astrStart);
  addSun('astrEnd', sun.astrEnd);

  const moonNight = getMoonNightEvents(baseDate, lat, lon);
  if (moonInfoEl) moonInfoEl.innerHTML = '';

  if (moonInfoEl) {
    if (moonNight.rises.length === 0 && moonNight.sets.length === 0) {
      const li = document.createElement('li');
      if (moonNight.flags.alwaysBelow) li.textContent = L.moonBelowAllNight;
      else if (moonNight.flags.alwaysAbove) li.textContent = L.moonAboveAllNight;
      else li.textContent = L.moonNoEvents;
      moonInfoEl.appendChild(li);
    } else {
      if (moonNight.rises.length > 0) {
        const li = document.createElement('li');
        const parts = moonNight.rises.map(d => `(${fmtDateShort(d)}) — ${fmtTime(d)}`);
        li.textContent = L.moonRisePrefix + parts.join(', ');
        moonInfoEl.appendChild(li);
      }
      if (moonNight.sets.length > 0) {
        const li = document.createElement('li');
        const parts = moonNight.sets.map(d => `(${fmtDateShort(d)}) — ${fmtTime(d)}`);
        li.textContent = L.moonSetPrefix + parts.join(', ');
        moonInfoEl.appendChild(li);
      }
    }
  }

  if (phaseEl) {
    if (window.SunCalc && SunCalc.getMoonIllumination) {
      const now = new Date();
      const obsTime = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      );

      const illum = SunCalc.getMoonIllumination(obsTime);
      const frac = Math.round(illum.fraction * 100);
      const p = illum.phase;
      const synodicMonth = 29.530588853;
      const ageDays = illum.phase * synodicMonth;

      const discContainer = document.getElementById('moonPhaseDisc');
      if (discContainer && window.drawPlanetPhase) {
        discContainer.innerHTML = '';
        const phaseForLib = illum.fraction;
        const isWaxing = illum.phase < 0.5;

        drawPlanetPhase(discContainer, phaseForLib, isWaxing, {
          diameter: 55,
          lightColour: '#fef9c3',
          shadowColour: '#050814',
          earthshine: 0.15,
          blur: 3
        });
      }

      let name;
      if (settings.lang === 'ru') {
        if (p < 0.03 || p > 0.97) name = 'Новолуние';
        else if (p < 0.22) name = 'Растущий серп';
        else if (p < 0.28) name = 'Первая четверть';
        else if (p < 0.47) name = 'Растущая Луна';
        else if (p < 0.53) name = 'Полнолуние';
        else if (p < 0.72) name = 'Убывающая Луна';
        else if (p < 0.78) name = 'Последняя четверть';
        else name = 'Старый серп';
        phaseEl.innerHTML = `${name}, освещено ≈ ${frac}%<br>Возраст Луны ≈ ${ageDays.toFixed(1)} дн.`;
      } else {
        if (p < 0.03 || p > 0.97) name = 'New Moon';
        else if (p < 0.22) name = 'Waxing Crescent';
        else if (p < 0.28) name = 'First Quarter';
        else if (p < 0.47) name = 'Waxing Gibbous';
        else if (p < 0.53) name = 'Full Moon';
        else if (p < 0.72) name = 'Waning Gibbous';
        else if (p < 0.78) name = 'Last Quarter';
        else name = 'Old Crescent';
        phaseEl.innerHTML = `${name}, illuminated ≈ ${frac}%<br>Moon age ≈ ${ageDays.toFixed(1)} days`;
      }
    } else {
      phaseEl.textContent = (UI_STRINGS[settings.lang] || UI_STRINGS.en).phaseUnavailable;
    }
  }

  const dark = getFullDarknessForNight(baseDate, lat, lon);
  const filter = getFilterConfig();

  if (darkEl && darkNoteEl) {
    if (!dark.sun.astrStart || !dark.sun.astrEnd) {
      darkEl.innerHTML = L.noAstrNight;
      darkNoteEl.textContent = '';
    } else if (dark.darknessIntervals.length === 0) {
      darkEl.innerHTML = L.noFullDark;
      darkNoteEl.textContent = '';
    } else {
      const intervalsStr = formatIntervals(dark.darknessIntervals);
      const totalStr = fmtDuration(dark.totalMinutes);
      const totalLabel = settings.lang === 'ru' ? 'всего' : 'total';

      darkEl.innerHTML =
        `<span class="darkness-interval ok">${intervalsStr}</span> ` +
        `(<span class="total">${totalLabel} ${totalStr}</span>)`;

      darkNoteEl.textContent = dark.darknessIntervals.length > 1 ? L.darkMulti : L.darkSingle;
    }
  }

  if (!filterInfoEl) return;

  filterInfoEl.textContent = '';
  const hasTimeFilter = filter.minMinutes > 0;
  const hasDayFilter = !!(filter.allowedDays && filter.allowedDays.length);
  const anyFilterActive = hasTimeFilter || hasDayFilter;
  if (!anyFilterActive) return;

  let text = '';

  const dowThis = baseDate.getDay();
  const dayMatchThis = !filter.allowedDays || filter.allowedDays.includes(dowThis);
  let matchMinutes = 0;
  let timeOkThis = true;

  if (hasTimeFilter && dark.sun.astrStart && dark.sun.astrEnd) {
    matchMinutes = getFilterOverlapMinutes(baseDate, dark.darknessIntervals, dark.sun, filter);
    timeOkThis = matchMinutes >= filter.minMinutes;
  }

  if (!dark.sun.astrStart || !dark.sun.astrEnd || dark.darknessIntervals.length === 0) {
    text += L.filterNightNoDark;
  } else {
    if (hasDayFilter) text += dayMatchThis ? L.filterDayIn : L.filterDayOut;
    if (hasTimeFilter) {
      if (timeOkThis) {
        text +=
          L.filterTimeOkPrefix +
          fmtDuration(matchMinutes) +
          L.filterTimeOkSuffix +
          fmtDuration(filter.minMinutes) +
          L.filterTimeClose;
      } else {
        text +=
          L.filterTimeNotOkPrefix +
          fmtDuration(matchMinutes) +
          L.filterTimeNotOkSuffix +
          fmtDuration(filter.minMinutes) +
          L.filterTimeClose;
      }
    }
  }

  let found = null;
  for (let i = 1; i <= 30; i++) {
    const d = shiftDays(baseDate, i);
    const darkNext = getFullDarknessForNight(d, lat, lon);
    if (!darkNext.sun.astrStart || !darkNext.sun.astrEnd || darkNext.darknessIntervals.length === 0) continue;

    const dow = d.getDay();
    const dayOK = !filter.allowedDays || filter.allowedDays.includes(dow);

    let timeOK = true;
    let mm = 0;
    if (hasTimeFilter) {
      mm = getFilterOverlapMinutes(d, darkNext.darknessIntervals, darkNext.sun, filter);
      timeOK = mm >= filter.minMinutes;
    }

    if (dayOK && timeOK) {
      found = { daysAhead: i, date: d, minutes: mm };
      break;
    }
  }

  if (found) {
    let when;
    if (settings.lang === 'ru') {
      if (found.daysAhead === 1) when = L.nextNightTomorrow;
      else if (found.daysAhead === 2) when = L.nextNightAfter;
      else when = L.nextNightInDays.replace('{D}', found.daysAhead);
      const mmText = hasTimeFilter ? `, темнота ${fmtDuration(found.minutes)}` : '';
      text += `${L.nextNightPrefix}${when} (${fmtDate(found.date)}${mmText}).`;
    } else {
      if (found.daysAhead === 1) when = L.nextNightTomorrow;
      else if (found.daysAhead === 2) when = L.nextNightAfter;
      else when = L.nextNightInDays.replace('{D}', found.daysAhead);
      const mmText = hasTimeFilter ? `, darkness ${fmtDuration(found.minutes)}` : '';
      text += `${L.nextNightPrefix}${when} (${fmtDate(found.date)}${mmText}).`;
    }
  } else {
    text += L.nextNone;
  }

  filterInfoEl.textContent = text;
}

// ---------- Future 30 nights table ----------

function updateFutureTable(startDate, lat, lon) {
  const tbody = document.getElementById('futureTableBody');
  if (!tbody) return;

  const filter = getFilterConfig();
  const L = UI_STRINGS[settings.lang] || UI_STRINGS.en;

  tbody.innerHTML = '';

  const hasTimeFilter = filter.minMinutes > 0;
  const hasDayFilter = !!(filter.allowedDays && filter.allowedDays.length);
  const anyFilterActive = hasTimeFilter || hasDayFilter;

  for (let i = 0; i < 30; i++) {
    const base = shiftDays(startDate, i);
    const data = getFullDarknessForNight(base, lat, lon);

    let darkText = '—';
    if (data.darknessIntervals.length > 0) darkText = formatIntervals(data.darknessIntervals);
    const totalText = data.totalMinutes > 0 ? fmtDuration(data.totalMinutes) : '—';

    const dow = base.getDay();
    let weekendLabel = '';
    if (dow === 6) weekendLabel = L.weekendSat;
    else if (dow === 0) weekendLabel = L.weekendSun;

    const tr = document.createElement('tr');
    if (dow === 0 || dow === 6) tr.classList.add('weekend-row');

    const dayMatch = !filter.allowedDays || filter.allowedDays.includes(dow);
    let timeMatch = true;
    if (hasTimeFilter) {
      const mm = getFilterOverlapMinutes(base, data.darknessIntervals, data.sun, filter);
      timeMatch = mm >= filter.minMinutes;
    }
    const matchedForFilter = dayMatch && timeMatch;

    let wEval = null;
    if (weatherIsEnabled()) wEval = weatherMatchForNight(base, data, filter);
    const matchedForWeather = (wEval && wEval.ok) ? true : false;

    const weatherDotHtml = matchedForWeather
      ? '<span class="good-night-dot" aria-hidden="true"></span>'
      : '';

    tr.innerHTML = `
      <td class="night-col">
        ${weatherDotHtml}${fmtDate(base)}
        ${weekendLabel ? `<span class="weekend-label">${weekendLabel}</span>` : ''}
        <span class="night-date">${L.nightPrefix}${fmtDateShort(base)} → ${fmtDateShort(shiftDays(base, 1))}</span>
      </td>
      <td>${darkText}</td>
      <td>${totalText}</td>
    `;

    tr.style.display = '';
    if (anyFilterActive) {
      if (filter.hideNonMatch && !matchedForFilter) tr.style.display = 'none';
      if (filter.highlightMatches && matchedForFilter && tr.style.display !== 'none') {
        const cells = tr.querySelectorAll('td');
        if (cells[1]) cells[1].classList.add('filter-match-cell');
        if (cells[2]) cells[2].classList.add('filter-match-cell');
      }
    }

    tbody.appendChild(tr);

    // Click to toggle hourly details for this night
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => {
      const next = tr.nextElementSibling;
      if (next && next.classList.contains('weather-details-row')) {
        next.remove();
        return;
      }

      if (!window.WeatherService || !WeatherService.isEnabled || !WeatherService.isEnabled()) return;
      if (!WeatherService.isReady || !WeatherService.isReady()) return;

      const details = document.createElement('tr');
      details.className = 'weather-details-row';

      const td = document.createElement('td');
      td.colSpan = 3;
      td.style.background = '#040813';
      td.style.color = '#cfd8dc';
      td.style.padding = '10px 12px';

      const allHours = (typeof WeatherService.getAllAstrNightHours === 'function')
        ? WeatherService.getAllAstrNightHours(data)
        : [];

      const titleDetails =
        L.weatherDetailsTitle ||
        (settings.lang === 'ru'
          ? 'Погода (часы астрономической ночи)'
          : 'Weather (astronomical night hours)');

      const noDataText =
        L.weatherNoData ||
        (settings.lang === 'ru'
          ? 'Нет данных прогноза для этой ночи (вне диапазона прогноза).'
          : 'No forecast data for this night (outside forecast range).');

      const colTime = L.colTime || (settings.lang === 'ru' ? 'Время' : 'Time');
      const colCloud = L.colCloud || (settings.lang === 'ru' ? 'Облачность %' : 'Cloud %');
      const colWind = L.colWind || (settings.lang === 'ru' ? 'Ветер' : 'Wind');
      const colHum = L.colHumidity || (settings.lang === 'ru' ? 'Влажность %' : 'Humidity %');
      const colAOD = L.colAOD || 'AOD';
      const colSeeing = L.colSeeing || (settings.lang === 'ru' ? 'Синг' : 'Seeing');

      if (!allHours.length) {
        td.innerHTML =
          `<div class="weather-title">${titleDetails}</div>` +
          `<div>${noDataText}</div>`;
      } else {
        const unitKey = getWindUnitKey();

        const rows = allHours.map(h => {
          const aodText = (typeof h.aod === 'number') ? h.aod.toFixed(3) : '—';
const seeLabelKey = h.seeingLabelKey || '';
const seeLabel =
  (seeLabelKey && L.seeingLabels && L.seeingLabels[seeLabelKey])
    ? L.seeingLabels[seeLabelKey]
    : (h.seeingLabel || ''); // fallback если вдруг старый weather.js

const seeText = (typeof h.seeingScore === 'number')
  ? `${h.seeingScore}${seeLabel ? ` (${seeLabel})` : ''}`
  : '—';

          const windVal = (typeof h.windMs === 'number') ? windMsToUnit(h.windMs, unitKey) : null;
          const windText = (typeof windVal === 'number') ? windVal.toFixed(1) : '—';

          const cloudText = (typeof h.cloud === 'number') ? h.cloud : '—';
          const humText = (typeof h.hum === 'number') ? h.hum : '—';

          const tStr = fmtTime(h.time);
          const dStr = fmtDateShort(h.time);

          return `<tr>
            <td class="sticky-col">${tStr} <span class="weather-date">(${dStr})</span></td>
            <td>${cloudText}</td>
            <td>${windText}</td>
            <td>${humText}</td>
            <td>${aodText}</td>
            <td>${seeText}</td>
          </tr>`;
        }).join('');

        td.innerHTML = `
          <div class="weather-title">${titleDetails}</div>
          <div class="weather-scroll">
            <table class="weather-table">
              <thead>
                <tr>
                  <th class="sticky-col">${colTime}</th>
                  <th>${colCloud}</th>
                  <th>${colWind} ${windUnitLabelText(unitKey)}</th>
                  <th>${colHum}</th>
                  <th>${colAOD}</th>
                  <th>${colSeeing}</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `;
      }

      details.appendChild(td);
      tr.parentNode.insertBefore(details, tr.nextSibling);
    });
  }
}

// ---------- Core recalculation ----------

function recalcAll() {
  updateSettingsFromUI();
  updateWindUnitLabelUI();
  applyLanguage();
  updateFilterHourLabels();

  const lat = parseFloat((document.getElementById('lat') || {}).value) || 0;
  const lon = parseFloat((document.getElementById('lon') || {}).value) || 0;

  const dateStr = (document.getElementById('startDate') || {}).value;
  let baseDate;
  if (dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    baseDate = atLocalMidnight(new Date(y, m - 1, d));
  } else {
    baseDate = atLocalMidnight(new Date());
  }

  // Weather: load forecast when enabled (non-blocking)
  if (window.WeatherService && typeof WeatherService.readConfigFromUI === 'function') {
    WeatherService.readConfigFromUI();

    // Keep wind threshold in WeatherService in m/s if cfg exists
    const windUnits = getWindUnitKey();
    const wMax = document.getElementById('weatherMaxWind');
    if (wMax && WeatherService.cfg) {
      const ms = windUnitToMs(wMax.value, windUnits);
      if (typeof ms === 'number' && isFinite(ms)) WeatherService.cfg.maxWind = ms;
    }

    if (WeatherService.isEnabled && WeatherService.isEnabled()) {
      WeatherService.load(lat, lon)
        .then(() => {
          updateSelectedNight(baseDate, lat, lon);
          updateFutureTable(baseDate, lat, lon);
        })
        .catch(() => {});
    }
  }

  updateSelectedNight(baseDate, lat, lon);
  updateFutureTable(baseDate, lat, lon);

  saveSettingsToStorage();
}

// ---------- Initialization ----------

function initFilterTimeSelects() {
  const fromSel = document.getElementById('filterFromHour');
  const toSel = document.getElementById('filterToHour');
  if (!fromSel || !toSel) return;

  fromSel.innerHTML = '';
  toSel.innerHTML = '';

  for (let h = 0; h < 24; h++) {
    const opt1 = document.createElement('option');
    opt1.value = String(h);
    opt1.textContent = labelHour(h);
    const opt2 = opt1.cloneNode(true);
    fromSel.appendChild(opt1);
    toSel.appendChild(opt2);
  }

  const optStart = document.createElement('option');
  optStart.value = 'astrStart';
  fromSel.appendChild(optStart);

  const optEnd = document.createElement('option');
  optEnd.value = 'astrEnd';
  toSel.appendChild(optEnd);

  fromSel.value = '21';
  toSel.value = '2';
}

function initStartDate() {
  const el = document.getElementById('startDate');
  if (!el) return;
  const today = new Date();
  el.value = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
}

function initSettingsAccordion() {
  const card = document.getElementById('settingsCard');
  if (!card) return;
  const header = card.querySelector('.settings-header');
  const icon = document.getElementById('menuIcon');

  function toggle() {
    if (card.classList.contains('collapsed')) {
      card.classList.remove('collapsed');
      card.classList.add('expanded');
    } else {
      card.classList.add('collapsed');
      card.classList.remove('expanded');
    }
  }

  if (header) header.addEventListener('click', toggle);
  if (icon) {
    icon.addEventListener('click', e => {
      e.stopPropagation();
      toggle();
    });
  }
}

function initEvents() {
  const btnCalc = document.getElementById('btnCalc');
  const btnGeo = document.getElementById('btnGeo');

  if (btnCalc) btnCalc.addEventListener('click', recalcAll);

  if (btnGeo) {
    btnGeo.addEventListener('click', () => {
      const L = UI_STRINGS[settings.lang] || UI_STRINGS.en;
      if (!navigator.geolocation) {
        alert(L.geoNotSupported);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          const latEl = document.getElementById('lat');
          const lonEl = document.getElementById('lon');
          if (latEl) latEl.value = pos.coords.latitude.toFixed(4);
          if (lonEl) lonEl.value = pos.coords.longitude.toFixed(4);
          recalcAll();
        },
        () => alert(L.geoFailed)
      );
    });
  }

  const bind = (id, ev) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(ev, recalcAll);
  };

  bind('time24', 'change');
  bind('dateFormat', 'change');
  bind('langSelect', 'change');
  bind('filterFromHour', 'change');
  bind('filterToHour', 'change');
  bind('filterDuration', 'input');
  bind('filterHide', 'change');
  bind('filterHighlight', 'change');
  bind('dowFilter', 'change');
  bind('lat', 'change');
  bind('lon', 'change');
  bind('startDate', 'change');

  // Weather UI
  const weatherIds = [
    'weatherEnabled',
    'weatherMaxCloud',
    'weatherMaxWind',
    'weatherMaxHumidity',
    'weatherMinConsec',
    'weatherWindUnits',
    'weatherTempUnits'
  ];
  weatherIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(id === 'weatherEnabled' ? 'change' : 'input', recalcAll);
  });

  // Wind units conversion: keep same physical threshold
  const windUnitsSel = document.getElementById('weatherWindUnits');
  const windMaxInput = document.getElementById('weatherMaxWind');

  if (windUnitsSel && windMaxInput) {
    windUnitsSel.dataset.prev = windUnitsSel.value || 'ms';

    windUnitsSel.addEventListener('change', (e) => {
      e.stopPropagation();

      const prev = windUnitsSel.dataset.prev || 'ms';
      const next = windUnitsSel.value || 'ms';

      const ms = windUnitToMs(windMaxInput.value, prev);
      if (typeof ms === 'number') {
        const nextVal = windMsToUnit(ms, next);
        if (typeof nextVal === 'number') windMaxInput.value = String(Math.round(nextVal * 10) / 10);
      }

      windUnitsSel.dataset.prev = next;
      updateWindUnitLabelUI();
      recalcAll();
    });
  }
}

// ---------- PWA: service worker ----------

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('service-worker.js')
      .catch(err => console.warn('Service worker registration failed:', err));
  }
}

// DOM ready
window.addEventListener('DOMContentLoaded', () => {
  initStartDate();
  initFilterTimeSelects();
  loadSettingsFromStorage();
  updateWindUnitLabelUI();
  applyLanguage();
  initSettingsAccordion();
  initTabs();      // <-- tabs ON
  initEvents();
  recalcAll();
  registerServiceWorker();
});