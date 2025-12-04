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
  dateFormat: 'DMY', // default: DD.MM.YYYY
  lang: 'en'
};

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

// Full date according to selected format
function fmtDate(d) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  switch (settings.dateFormat) {
    case 'MDY':
      return `${mm}/${dd}/${yyyy}`;
    case 'YMD':
      return `${yyyy}-${mm}-${dd}`;
    case 'DMY2': // DD.MM.YY
      return `${dd}.${mm}.${String(yyyy).slice(-2)}`;
    case 'DMY':
    default:
      return `${dd}.${mm}.${yyyy}`;
  }
}

// Short date used in brackets
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
  if (!mins || mins <= 0) {
    return lang === 'ru' ? '0 мин' : '0 min';
  }
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (lang === 'ru') {
    if (h > 0) {
      return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
    }
    return `${m} мин`;
  } else {
    if (h > 0) {
      return m > 0 ? `${h} h ${m} min` : `${h} h`;
    }
    return `${m} min`;
  }
}

function formatIntervals(intervals) {
  if (!intervals || intervals.length === 0) return '—';
  return intervals.map(i => `${fmtTime(i.start)}–${fmtTime(i.end)}`).join(', ');
}

function labelHour(h) {
  if (settings.time24) {
    return pad2(h) + ':00';
  } else {
    let suffix = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ':00 ' + suffix;
  }
}

// ---------- Settings + language ----------

function updateSettingsFromUI() {
  const t24 = document.getElementById('time24');
  const df = document.getElementById('dateFormat');
  const langSel = document.getElementById('langSelect');

  settings.time24 = !!t24.checked;
  settings.dateFormat = df.value || 'DMY';
  settings.lang = langSel.value || 'en';
}

// Save all important settings to localStorage
function saveSettingsToStorage() {
  try {
    const latVal = parseFloat(document.getElementById('lat').value) || 0;
    const lonVal = parseFloat(document.getElementById('lon').value) || 0;
    const fromSel = document.getElementById('filterFromHour');
    const toSel = document.getElementById('filterToHour');
    const durEl = document.getElementById('filterDuration');
    const hideEl = document.getElementById('filterHide');
    const hlEl = document.getElementById('filterHighlight');
    const dowSel = document.getElementById('dowFilter');
    const dateFormatSel = document.getElementById('dateFormat');
    const langSel = document.getElementById('langSelect');
    const time24El = document.getElementById('time24');

    const data = {
      lat: latVal,
      lon: lonVal,
      time24: !!time24El.checked,
      dateFormat: dateFormatSel.value || 'DMY',
      lang: langSel.value || 'en',
      // store raw values to support 'astrStart' / 'astrEnd'
      filterFromValue: fromSel.value || '0',
      filterToValue: toSel.value || '0',
      filterDuration: durEl.value || '0',
      filterHide: !!hideEl.checked,
      filterHighlight: !!hlEl.checked,
      dowFilter: dowSel.value || ''
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // If localStorage is unavailable, silently ignore
  }
}

// Load settings from localStorage and apply to UI + settings object
function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    if (typeof data.lat === 'number') {
      document.getElementById('lat').value = data.lat.toFixed(4);
    }
    if (typeof data.lon === 'number') {
      document.getElementById('lon').value = data.lon.toFixed(4);
    }

    const time24El = document.getElementById('time24');
    const dateFormatSel = document.getElementById('dateFormat');
    const langSel = document.getElementById('langSelect');
    const fromSel = document.getElementById('filterFromHour');
    const toSel = document.getElementById('filterToHour');
    const durEl = document.getElementById('filterDuration');
    const hideEl = document.getElementById('filterHide');
    const hlEl = document.getElementById('filterHighlight');
    const dowSel = document.getElementById('dowFilter');

    if ('time24' in data) {
      time24El.checked = !!data.time24;
      settings.time24 = !!data.time24;
    }
    if (data.dateFormat) {
      dateFormatSel.value = data.dateFormat;
      settings.dateFormat = data.dateFormat;
    }
    if (data.lang) {
      langSel.value = data.lang;
      settings.lang = data.lang;
    }

    // Support new string-based storage and old numeric one
    if (typeof data.filterFromValue === 'string') {
      fromSel.value = data.filterFromValue;
    } else if (typeof data.filterFromHour === 'number') {
      fromSel.value = String(data.filterFromHour);
    }

    if (typeof data.filterToValue === 'string') {
      toSel.value = data.filterToValue;
    } else if (typeof data.filterToHour === 'number') {
      toSel.value = String(data.filterToHour);
    }

    if (typeof data.filterDuration !== 'undefined') {
      durEl.value = String(data.filterDuration);
    }
    if ('filterHide' in data) {
      hideEl.checked = !!data.filterHide;
    }
    if ('filterHighlight' in data) {
      hlEl.checked = !!data.filterHighlight;
    }
    if (typeof data.dowFilter === 'string') {
      dowSel.value = data.dowFilter;
    }
  } catch (e) {
    // ignore malformed storage
  }
}

function applyLanguage() {
  const lang = settings.lang;
  const L = UI_STRINGS[lang] || UI_STRINGS.en;

  document.documentElement.lang = lang === 'ru' ? 'ru' : 'en';

  document.getElementById('i_appSubtitle').innerHTML = L.appSubtitle;
  document.getElementById('i_topHint').innerHTML = L.topHint;

  document.getElementById('i_labelLat').textContent = L.labelLat;
  document.getElementById('i_labelLon').textContent = L.labelLon;
  document.getElementById('i_labelStartDate').textContent = L.labelStartDate;

  document.getElementById('btnGeo').textContent = L.btnGeo;
  document.getElementById('btnCalc').textContent = L.btnCalc;

  document.getElementById('i_labelTimeFormat').textContent = L.labelTimeFormat;
  document.getElementById('i_timeFormatHint').textContent = L.timeFormatHint;
  document.getElementById('i_labelDateFormat').textContent = L.labelDateFormat;
  document.getElementById('i_labelLanguage').textContent = L.labelLanguage;

  document.getElementById('i_filterSubtitle').textContent = L.filterSubtitle;
  document.getElementById('i_labelFilterFrom').textContent = L.labelFilterFrom;
  document.getElementById('i_labelFilterTo').textContent = L.labelFilterTo;
  document.getElementById('i_labelFilterDuration').textContent =
    L.labelFilterDuration;
  document.getElementById('i_labelDowFilter').textContent = L.labelDowFilter;

  document.getElementById('i_dowEmpty').textContent = L.dowEmpty;
  document.getElementById('i_dowFriSat').textContent = L.dowFriSat;
  document.getElementById('i_dowFriSatSun').textContent = L.dowFriSatSun;
  document.getElementById('i_dowSatSun').textContent = L.dowSatSun;

  document.getElementById('i_labelDisplayOptions').textContent =
    L.labelDisplayOptions;
  document.getElementById('i_filterHideLabel').textContent = L.filterHideLabel;
  document.getElementById('i_filterHighlightLabel').textContent =
    L.filterHighlightLabel;
  document.getElementById('i_filterHint').textContent = L.filterHint;

  document.getElementById('i_blockDarkTitle').textContent = L.blockDarkTitle;
  document.getElementById('i_blockSunTitle').textContent = L.blockSunTitle;
  document.getElementById('i_blockMoonTitle').textContent = L.blockMoonTitle;
  document.getElementById('i_blockPhaseTitle').textContent = L.blockPhaseTitle;

  document.getElementById('i_futureTitle').textContent = L.futureTitle;
  document.getElementById('i_thNight').textContent = L.thNight;
  document.getElementById('i_thDarkness').textContent = L.thDarkness;
  document.getElementById('i_thTotal').textContent = L.thTotal;
  document.getElementById('i_nightLegend').innerHTML = L.nightLegend;

  document.getElementById('versionLabel').textContent = L.versionLabel;
}

function updateFilterHourLabels() {
  const fromSel = document.getElementById('filterFromHour');
  const toSel = document.getElementById('filterToHour');
  [fromSel, toSel].forEach(sel => {
    if (!sel) return;
    for (const opt of sel.options) {
      const h = parseInt(opt.value, 10);
      if (!isNaN(h)) {
        opt.textContent = labelHour(h);
      }
      // Non-numeric values (astrStart/astrEnd) оставляем как есть
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

  const fromVal = fromSel.value;
  const toVal = toSel.value;

  let fromHour = 0;
  let toHour = 0;
  let fromMode = 'hour';
  let toMode = 'hour';

  if (fromVal === 'astrStart' || fromVal === 'astrEnd') {
    fromMode = fromVal;
  } else {
    const fh = parseInt(fromVal, 10);
    if (!isNaN(fh)) fromHour = fh;
  }

  if (toVal === 'astrStart' || toVal === 'astrEnd') {
    toMode = toVal;
  } else {
    const th = parseInt(toVal, 10);
    if (!isNaN(th)) toHour = th;
  }

  let dur = durEl.value ? durEl.value.toString().replace(',', '.') : '0';
  let durNum = parseFloat(dur);
  if (!isFinite(durNum) || durNum < 0) durNum = 0;

  const minMinutes = durNum > 0 ? Math.round(durNum * 60) : 0;

  let allowedDays = null;
  switch (dowSel.value) {
    case 'fri_sat':
      allowedDays = [5, 6];
      break;
    case 'fri_sat_sun':
      allowedDays = [5, 6, 0];
      break;
    case 'sat_sun':
      allowedDays = [6, 0];
      break;
    default:
      allowedDays = null;
  }

  return {
    fromMode,
    toMode,
    fromHour,
    toHour,
    minMinutes,
    hideNonMatch: !!hideEl.checked,
    highlightMatches: !!hlEl.checked,
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
  if (typeof day0.set === 'number') {
    sunset = new Date(mid0.getTime() + day0.set * 3600 * 1000);
  }

  let sunrise = null;
  if (typeof day1.rise === 'number') {
    sunrise = new Date(mid1.getTime() + day1.rise * 3600 * 1000);
  }

  let astrStart = null;
  if (typeof twA0.set === 'number') {
    astrStart = new Date(mid0.getTime() + twA0.set * 3600 * 1000);
  }

  let astrEnd = null;
  if (typeof twA1.rise === 'number') {
    astrEnd = new Date(mid1.getTime() + twA1.rise * 3600 * 1000);
  }

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

    const sinAlt =
      sinLat * Math.sin(dec) + cosLat * Math.cos(dec) * Math.cos(H);
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

  if (inDark && runStart) {
    intervals.push({ start: runStart, end: astrEnd });
  }

  let totalMinutes = 0;
  for (const d of intervals) {
    totalMinutes += diffMinutes(d.start, d.end);
  }

  return { sun, darknessIntervals: intervals, totalMinutes };
}

function getMoonNightEvents(baseDate, latDeg, lonDeg) {
  const sun = getSunTimesForNight(baseDate, latDeg, lonDeg);
  const { mid0, mid1, sunset, sunrise } = sun;
  const result = {
    rises: [],
    sets: [],
    flags: { alwaysAbove: false, alwaysBelow: false }
  };

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
      if (t >= windowStart && t <= windowEnd) {
        result.rises.push(new Date(t));
      }
    }
    if (typeof d.set === 'number') {
      const t = dayStart + d.set * 3600 * 1000;
      if (t >= windowStart && t <= windowEnd) {
        result.sets.push(new Date(t));
      }
    }
  }

  addEventsFrom(ev0, mid0);
  addEventsFrom(ev1, mid1);

  result.rises.sort((a, b) => a - b);
  result.sets.sort((a, b) => a - b);

  return result;
}

// Overlap between full darkness and user time window
function getFilterOverlapMinutes(baseDate, darknessIntervals, sun, filter) {
  if (!filter || filter.minMinutes <= 0) return 0;
  if (!darknessIntervals || darknessIntervals.length === 0) return 0;

  const baseMid = atLocalMidnight(baseDate);
  const baseMs = baseMid.getTime();
  const nextMid = shiftDays(baseMid, 1);
  const nextMs = nextMid.getTime();

  let windowStartMs;
  let windowEndMs;

  const hasAstr = filter.fromMode !== 'hour' || filter.toMode !== 'hour';

  if (!hasAstr) {
    // Старый режим: оба значения — часы
    windowStartMs = baseMs + filter.fromHour * 3600000;

    if (filter.toHour > filter.fromHour) {
      windowEndMs = baseMs + filter.toHour * 3600000;
    } else if (filter.toHour === filter.fromHour) {
      // 24 часа (фильтр по времени фактически выключен)
      windowEndMs = nextMs + 24 * 3600000;
    } else {
      // пересекает полночь
      windowEndMs = nextMs + filter.toHour * 3600000;
    }
  } else {
    // Один или оба края — начало/конец астрономической ночи
    if (filter.fromMode === 'astrStart' && sun.astrStart) {
      windowStartMs = sun.astrStart.getTime();
    } else if (filter.fromMode === 'astrEnd' && sun.astrEnd) {
      windowStartMs = sun.astrEnd.getTime();
    } else if (filter.fromMode === 'hour') {
      windowStartMs = baseMs + filter.fromHour * 3600000;
    } else {
      windowStartMs = baseMs;
    }

    if (filter.toMode === 'astrStart' && sun.astrStart) {
      windowEndMs = sun.astrStart.getTime();
    } else if (filter.toMode === 'astrEnd' && sun.astrEnd) {
      windowEndMs = sun.astrEnd.getTime();
    } else if (filter.toMode === 'hour') {
      const baseForTo =
        filter.fromMode === 'hour' && filter.toHour <= filter.fromHour
          ? nextMs
          : baseMs;
      windowEndMs = baseForTo + filter.toHour * 3600000;
    } else {
      windowEndMs = nextMs;
    }
  }

  let total = 0;
  for (const interval of darknessIntervals) {
    const s = Math.max(interval.start.getTime(), windowStartMs);
    const e = Math.min(interval.end.getTime(), windowEndMs);
    if (e > s) {
      total += Math.round((e - s) / 60000);
    }
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

  titleEl.textContent = `${L.nightHeaderPrefix}${fmtDate(
    baseDate
  )} → ${fmtDate(nightEnd)}`;

  const sun = getSunTimesForNight(baseDate, lat, lon);
  sunInfoEl.innerHTML = '';

  function addSun(labelKey, d) {
    const li = document.createElement('li');
    let label;
    if (labelKey === 'sunset') label = L.sunSunset;
    else if (labelKey === 'sunrise') label = L.sunSunrise;
    else if (labelKey === 'astrStart') label = L.sunAstrStart;
    else if (labelKey === 'astrEnd') label = L.sunAstrEnd;
    else label = labelKey;

    li.textContent = d
      ? `${label} (${fmtDateShort(d)}) — ${fmtTime(d)}`
      : `${label}: —`;
    sunInfoEl.appendChild(li);
  }

  addSun('sunset', sun.sunset);
  addSun('sunrise', sun.sunrise);
  addSun('astrStart', sun.astrStart);
  addSun('astrEnd', sun.astrEnd);

  const moonNight = getMoonNightEvents(baseDate, lat, lon);
  moonInfoEl.innerHTML = '';
  if (moonNight.rises.length === 0 && moonNight.sets.length === 0) {
    const li = document.createElement('li');
    if (moonNight.flags.alwaysBelow) {
      li.textContent = L.moonBelowAllNight;
    } else if (moonNight.flags.alwaysAbove) {
      li.textContent = L.moonAboveAllNight;
    } else {
      li.textContent = L.moonNoEvents;
    }
    moonInfoEl.appendChild(li);
  } else {
    if (moonNight.rises.length > 0) {
      const li = document.createElement('li');
      const parts = moonNight.rises.map(
        d => `(${fmtDateShort(d)}) — ${fmtTime(d)}`
      );
      li.textContent = L.moonRisePrefix + parts.join(', ');
      moonInfoEl.appendChild(li);
    }
    if (moonNight.sets.length > 0) {
      const li = document.createElement('li');
      const parts = moonNight.sets.map(
        d => `(${fmtDateShort(d)}) — ${fmtTime(d)}`
      );
      li.textContent = L.moonSetPrefix + parts.join(', ');
      moonInfoEl.appendChild(li);
    }
  }

  // Moon phase and age via SunCalc — как раньше, но на момент "сейчас"
  if (window.SunCalc && SunCalc.getMoonIllumination) {
    const now = new Date(); // текущий момент
    const illum = SunCalc.getMoonIllumination(now);
    const frac = Math.round(illum.fraction * 100);
    const p = illum.phase;
    const synodicMonth = 29.530588853;
    const ageDays = illum.phase * synodicMonth;

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
      phaseEl.innerHTML =
        `${name}, освещено ≈ ${frac}%<br>` +
        `Возраст Луны ≈ ${ageDays.toFixed(1)} дн.`;
    } else {
      if (p < 0.03 || p > 0.97) name = 'New Moon';
      else if (p < 0.22) name = 'Waxing Crescent';
      else if (p < 0.28) name = 'First Quarter';
      else if (p < 0.47) name = 'Waxing Gibbous';
      else if (p < 0.53) name = 'Full Moon';
      else if (p < 0.72) name = 'Waning Gibbous';
      else if (p < 0.78) name = 'Last Quarter';
      else name = 'Old Crescent';
      phaseEl.innerHTML =
        `${name}, illuminated ≈ ${frac}%<br>` +
        `Moon age ≈ ${ageDays.toFixed(1)} days`;
    }
  } else {
    phaseEl.textContent = L.phaseUnavailable;
  }

  const dark = getFullDarknessForNight(baseDate, lat, lon);
  const filter = getFilterConfig();

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

    darkNoteEl.textContent =
      dark.darknessIntervals.length > 1 ? L.darkMulti : L.darkSingle;
  }

  // Filter explanation + next suitable night
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
    matchMinutes = getFilterOverlapMinutes(
      baseDate,
      dark.darknessIntervals,
      dark.sun,
      filter
    );
    timeOkThis = matchMinutes >= filter.minMinutes;
  }

  if (
    !dark.sun.astrStart ||
    !dark.sun.astrEnd ||
    dark.darknessIntervals.length === 0
  ) {
    text += L.filterNightNoDark;
  } else {
    if (hasDayFilter) {
      text += dayMatchThis ? L.filterDayIn : L.filterDayOut;
    }
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
    if (
      !darkNext.sun.astrStart ||
      !darkNext.sun.astrEnd ||
      darkNext.darknessIntervals.length === 0
    ) {
      continue;
    }
    const dow = d.getDay();
    const dayOK = !filter.allowedDays || filter.allowedDays.includes(dow);

    let timeOK = true;
    let mm = 0;
    if (hasTimeFilter) {
      mm = getFilterOverlapMinutes(
        d,
        darkNext.darknessIntervals,
        darkNext.sun,
        filter
      );
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
      const mmText = hasTimeFilter
        ? `, темнота ${fmtDuration(found.minutes)}`
        : '';
      text += `${L.nextNightPrefix}${when} (${fmtDate(
        found.date
      )}${mmText}).`;
    } else {
      if (found.daysAhead === 1) when = L.nextNightTomorrow;
      else if (found.daysAhead === 2) when = L.nextNightAfter;
      else when = L.nextNightInDays.replace('{D}', found.daysAhead);
      const mmText = hasTimeFilter
        ? `, darkness ${fmtDuration(found.minutes)}`
        : '';
      text += `${L.nextNightPrefix}${when} (${fmtDate(
        found.date
      )}${mmText}).`;
    }
  } else {
    text += L.nextNone;
  }

  filterInfoEl.textContent = text;
}

// ---------- Future 30 nights table ----------

function updateFutureTable(startDate, lat, lon) {
  const tbody = document.getElementById('futureTableBody');
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
    if (data.darknessIntervals.length > 0) {
      darkText = formatIntervals(data.darknessIntervals);
    }
    const totalText =
      data.totalMinutes > 0 ? fmtDuration(data.totalMinutes) : '—';

    const dow = base.getDay();
    let weekendLabel = '';
    if (dow === 6) weekendLabel = L.weekendSat;
    else if (dow === 0) weekendLabel = L.weekendSun;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="night-col">
        ${fmtDate(base)}
        ${weekendLabel ? `<span class="weekend-label">${weekendLabel}</span>` : ''}
        <span class="night-date">${L.nightPrefix}${fmtDateShort(
          base
        )} → ${fmtDateShort(shiftDays(base, 1))}</span>
      </td>
      <td>${darkText}</td>
      <td>${totalText}</td>
    `;

    if (dow === 0 || dow === 6) {
      tr.classList.add('weekend-row');
    }

    const cells = tr.querySelectorAll('td');
    cells.forEach(td => td.classList.remove('filter-match-cell'));

    const dayMatch =
      !filter.allowedDays || filter.allowedDays.includes(dow);
    let timeMatch = true;

    if (hasTimeFilter) {
      const mm = getFilterOverlapMinutes(
        base,
        data.darknessIntervals,
        data.sun,
        filter
      );
      timeMatch = mm >= filter.minMinutes;
    }

    const matched = dayMatch && timeMatch;

    tr.style.display = '';
    if (anyFilterActive) {
      if (filter.hideNonMatch && !matched) {
        tr.style.display = 'none';
      }
      if (filter.highlightMatches && matched && tr.style.display !== 'none') {
        if (cells[1]) cells[1].classList.add('filter-match-cell');
        if (cells[2]) cells[2].classList.add('filter-match-cell');
      }
    }

    tbody.appendChild(tr);
  }
}

// ---------- Core recalculation ----------

function recalcAll() {
  updateSettingsFromUI();
  applyLanguage();
  updateFilterHourLabels();

  const lat = parseFloat(document.getElementById('lat').value) || 0;
  const lon = parseFloat(document.getElementById('lon').value) || 0;
  const dateStr = document.getElementById('startDate').value;
  let baseDate;
  if (dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    baseDate = atLocalMidnight(new Date(y, m - 1, d));
  } else {
    baseDate = atLocalMidnight(new Date());
  }
  updateSelectedNight(baseDate, lat, lon);
  updateFutureTable(baseDate, lat, lon);

  // Persist settings after each recalculation
  saveSettingsToStorage();
}

// ---------- Initialization ----------

function initFilterTimeSelects() {
  const fromSel = document.getElementById('filterFromHour');
  const toSel = document.getElementById('filterToHour');

  // Clear in case of re-init
  fromSel.innerHTML = '';
  toSel.innerHTML = '';

  // Numeric hours
  for (let h = 0; h < 24; h++) {
    const opt1 = document.createElement('option');
    opt1.value = String(h);
    opt1.textContent = labelHour(h);
    const opt2 = opt1.cloneNode(true);
    fromSel.appendChild(opt1);
    toSel.appendChild(opt2);
  }

  // Special options: astronomical night start/end
  const L = UI_STRINGS[settings.lang] || UI_STRINGS.en;
  const astrStartLabel = L.filterAstrStart;
  const astrEndLabel = L.filterAstrEnd;

  const fromAstrStart = document.createElement('option');
  fromAstrStart.value = 'astrStart';
  fromAstrStart.textContent = astrStartLabel;
  fromSel.appendChild(fromAstrStart);

  const fromAstrEnd = document.createElement('option');
  fromAstrEnd.value = 'astrEnd';
  fromAstrEnd.textContent = astrEndLabel;
  fromSel.appendChild(fromAstrEnd);

  const toAstrStart = document.createElement('option');
  toAstrStart.value = 'astrStart';
  toAstrStart.textContent = astrStartLabel;
  toSel.appendChild(toAstrStart);

  const toAstrEnd = document.createElement('option');
  toAstrEnd.value = 'astrEnd';
  toAstrEnd.textContent = astrEndLabel;
  toSel.appendChild(toAstrEnd);

  // Default values (если нет сохранённых)
  fromSel.value = fromSel.value || '21';
  toSel.value = toSel.value || '2';
}

function initStartDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = pad2(today.getMonth() + 1);
  const dd = pad2(today.getDate());
  document.getElementById('startDate').value = `${yyyy}-${mm}-${dd}`;
}

function initSettingsAccordion() {
  const card = document.getElementById('settingsCard');
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

  header.addEventListener('click', toggle);
  icon.addEventListener('click', e => {
    e.stopPropagation();
    toggle();
  });
}

function initEvents() {
  document.getElementById('btnCalc').addEventListener('click', recalcAll);

  document.getElementById('btnGeo').addEventListener('click', () => {
    const L = UI_STRINGS[settings.lang] || UI_STRINGS.en;
    if (!navigator.geolocation) {
      alert(L.geoNotSupported);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        document.getElementById('lat').value =
          pos.coords.latitude.toFixed(4);
        document.getElementById('lon').value =
          pos.coords.longitude.toFixed(4);
        recalcAll();
      },
      () => {
        alert(L.geoFailed);
      }
    );
  });

  // Whenever user changes UI, recalc and save settings
  document.getElementById('time24').addEventListener('change', recalcAll);
  document.getElementById('dateFormat').addEventListener('change', recalcAll);
  document.getElementById('langSelect').addEventListener('change', recalcAll);
  document.getElementById('filterFromHour').addEventListener('change', recalcAll);
  document.getElementById('filterToHour').addEventListener('change', recalcAll);
  document.getElementById('filterDuration').addEventListener('input', recalcAll);
  document.getElementById('filterHide').addEventListener('change', recalcAll);
  document.getElementById('filterHighlight').addEventListener('change', recalcAll);
  document.getElementById('dowFilter').addEventListener('change', recalcAll);

  document.getElementById('lat').addEventListener('change', recalcAll);
  document.getElementById('lon').addEventListener('change', recalcAll);
  document.getElementById('startDate').addEventListener('change', recalcAll);
}

// ---------- PWA: service worker ----------

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('service-worker.js')
      .catch(err => {
        console.warn('Service worker registration failed:', err);
      });
  }
}

// DOM ready
window.addEventListener('DOMContentLoaded', () => {
  initStartDate();
  initFilterTimeSelects();
  loadSettingsFromStorage();  // apply saved values to UI + settings
  applyLanguage();
  initSettingsAccordion();
  initEvents();
  recalcAll();
  registerServiceWorker();
});
