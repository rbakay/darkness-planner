// weather.js — Darkness Planner Weather Module (best_match + AOD + seeing)
// No UI styling here; only data + evaluation.

(function () {
  const WeatherService = {
    _lat: null,
    _lon: null,
    _ready: false,

    // Forecast maps (key = ISO string from Open-Meteo, e.g. "2025-12-14T18:00")
    _wx: null,        // { time[], cloud[], windKmh[], hum[] }
    _aodMap: null,    // { iso: number }
    _seeingMap: null, // { iso: { score:number, labelKey:string } }

    // UI-config (read from inputs)
    cfg: {
      enabled: false,
      maxCloud: 10,
      maxWind: 6,         // ALWAYS stored in m/s internally
      maxHumidity: 70,
      minConsecHours: 3
    },

    // ---------- public ----------
    isEnabled() {
      return this.cfg.enabled === true;
    },

    isReady() {
      return this._ready === true;
    },

    readConfigFromUI() {
      const elEnabled = document.getElementById("weatherEnabled");
      const elC = document.getElementById("weatherMaxCloud");
      const elW = document.getElementById("weatherMaxWind");
      const elH = document.getElementById("weatherMaxHumidity");
      const elN = document.getElementById("weatherMinConsec");

      // Optional unit selectors (may not exist)
      const elWindUnits = document.getElementById("weatherWindUnits");
      const windUnit = elWindUnits ? (elWindUnits.value || "ms") : "ms"; // ms | kmh | mph

      this.cfg.enabled = !!(elEnabled && elEnabled.checked);

      const num = (el, def) => {
        if (!el) return def;
        const v = parseFloat(String(el.value).replace(",", "."));
        return Number.isFinite(v) ? v : def;
      };

      this.cfg.maxCloud = clamp(num(elC, 10), 0, 100);

      // IMPORTANT: user may input wind in selected units, but cfg.maxWind must be m/s
      const wInput = Math.max(0, num(elW, 6));
      this.cfg.maxWind = Math.max(0, windToMs(wInput, windUnit));

      this.cfg.maxHumidity = clamp(num(elH, 70), 0, 100);

      const n = Math.round(num(elN, 3));
      this.cfg.minConsecHours = Math.max(1, n);
    },

    // Call when lat/lon changes or on init
    async load(lat, lon) {
      this._lat = lat;
      this._lon = lon;
      this._ready = false;

      const [w, aod, seeing] = await Promise.all([
        fetchWeather(lat, lon).catch(() => null),
        fetchAOD(lat, lon).catch(() => null),
        fetchSeeing(lat, lon).catch(() => null)
      ]);

      if (!w || !w.hourly || !Array.isArray(w.hourly.time)) {
        this._wx = null;
        this._aodMap = null;
        this._seeingMap = null;
        this._ready = false;
        return;
      }

      this._wx = normalizeWeather(w);
      this._aodMap = buildMap(aod, "aerosol_optical_depth");
      this._seeingMap = buildSeeingMap(seeing);

      this._ready = true;
    },

    // Main evaluation:
    // baseDate: Date (local midnight of the night start)
    // darkData: result of getFullDarknessForNight(baseDate, lat, lon)
    // filter: getFilterConfig()
    //
    // Returns:
    //  - null if no forecast for this night (so planner can ignore)
    //  - { ok:boolean, runs:[{start, end, len}], hours:[{time, iso, ...}] }
    evaluateNight(baseDate, darkData, filter) {
      if (!this.isEnabled()) return null;
      if (!this._ready || !this._wx) return null;

      const sun = darkData && darkData.sun ? darkData.sun : null;
      const darknessIntervals = darkData && darkData.darknessIntervals ? darkData.darknessIntervals : [];

      if (!sun || !sun.astrStart || !sun.astrEnd) return null;

      // Window = exactly as Darkness filter defines (astrStart/astrEnd or fixed hours)
      const win = computeFilterWindow(baseDate, sun, filter);
      if (!win) return null;

      // Candidate hour points: those inside (window ∩ full darkness)
      const hours = this._collectHoursInWindow(win.start, win.end, darknessIntervals);

      if (!hours.length) {
        return { ok: false, runs: [], hours: [] };
      }

      // Build good/bad array based on thresholds
      const goodFlags = hours.map(h => {
        const c = h.cloud;
        const wms = h.windMs;
        const hu = h.hum;
        return (
          typeof c === "number" && typeof wms === "number" && typeof hu === "number" &&
          c <= this.cfg.maxCloud &&
          wms <= this.cfg.maxWind &&
          hu <= this.cfg.maxHumidity
        );
      });

      // Find consecutive runs of TRUE (hourly steps)
      const runs = findConsecutiveRuns(hours, goodFlags);
      const need = this.cfg.minConsecHours;

      const ok = runs.some(r => r.len >= need);

      return { ok, runs, hours };
    },

    // For details panel: collect ALL hours of astronomical night (astrStart→astrEnd)
    getAllAstrNightHours(darkData) {
      if (!this._ready || !this._wx) return [];
      const sun = darkData && darkData.sun ? darkData.sun : null;
      const darknessIntervals = darkData && darkData.darknessIntervals ? darkData.darknessIntervals : [];
      if (!sun || !sun.astrStart || !sun.astrEnd) return [];

      // "All hours of astro night" — but only where forecast exists.
      return this._collectHoursInWindow(sun.astrStart, sun.astrEnd, darknessIntervals, /*includeNotDark*/ true);
    },

    // ---------- internals ----------
    _collectHoursInWindow(startDate, endDate, darknessIntervals, includeNotDark = false) {
      const out = [];
      const wx = this._wx;
      if (!wx) return out;

      const startMs = startDate.getTime();
      const endMs = endDate.getTime();

      for (let i = 0; i < wx.timesLocal.length; i++) {
        const t = wx.timesLocal[i];
        const ms = t.getTime();
        if (ms < startMs || ms >= endMs) continue;

        // If includeNotDark=false — only those that are inside full darkness intervals
        if (!includeNotDark) {
          if (!isInsideAnyInterval(ms, darknessIntervals)) continue;
        }

        const iso = wx.timesIso[i];

        const aod = this._aodMap && Object.prototype.hasOwnProperty.call(this._aodMap, iso)
          ? this._aodMap[iso]
          : null;

        const seeing = this._seeingMap && Object.prototype.hasOwnProperty.call(this._seeingMap, iso)
          ? this._seeingMap[iso]
          : null;

        const windKmh = wx.windKmh[i];
        const windMs = typeof windKmh === "number" ? windKmh / 3.6 : null;

        out.push({
          time: t,
          iso,
          cloud: wx.cloud[i],
          hum: wx.hum[i],
          windMs,
          windKmh,
          aod,
          seeingScore: seeing ? seeing.score : null,
          seeingLabelKey: seeing ? seeing.labelKey : null
        });
      }

      // Ensure sorted
      out.sort((a, b) => a.time - b.time);
      return out;
    }
  };

  // Expose
  window.WeatherService = WeatherService;

  // ---------- helpers ----------
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  // Convert user-entered wind value to m/s
  function windToMs(value, unitKey) {
    const v = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
    if (!Number.isFinite(v)) return 0;
    if (unitKey === "kmh") return v / 3.6;
    if (unitKey === "mph") return v / 2.2369362920544;
    return v; // ms
  }

  function parseLocalIso(t) {
    const [datePart, timePart] = t.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }

  function normalizeWeather(w) {
    const tIso = w.hourly.time;
    const tLocal = tIso.map(parseLocalIso);

    return {
      timesIso: tIso,
      timesLocal: tLocal,
      cloud: w.hourly.cloud_cover || [],
      hum: w.hourly.relative_humidity_2m || [],
      windKmh: w.hourly.wind_speed_10m || []
    };
  }

  function buildMap(resp, key) {
    if (!resp || !resp.hourly || !Array.isArray(resp.hourly.time)) return null;
    const vArr = resp.hourly[key];
    if (!Array.isArray(vArr)) return null;
    const map = {};
    for (let i = 0; i < resp.hourly.time.length; i++) {
      map[resp.hourly.time[i]] = vArr[i];
    }
    return map;
  }

  function computeFilterWindow(baseDate, sun, filter) {
    if (!filter) return null;

    const baseMid = new Date(baseDate.getTime());
    baseMid.setHours(0, 0, 0, 0);
    const baseMs = baseMid.getTime();

    let startMs;
    if (filter.fromAstrStart) {
      if (!sun.astrStart) return null;
      startMs = sun.astrStart.getTime();
    } else {
      startMs = baseMs + (filter.fromHour * 3600000);
    }

    let endMs;
    if (filter.toAstrEnd) {
      if (!sun.astrEnd) return null;
      endMs = sun.astrEnd.getTime();
    } else {
      endMs = baseMs + (filter.toHour * 3600000);
    }

    if (endMs <= startMs) endMs += 24 * 3600000;

    return { start: new Date(startMs), end: new Date(endMs) };
  }

  function isInsideAnyInterval(ms, intervals) {
    if (!intervals || !intervals.length) return false;
    for (const it of intervals) {
      const s = it.start.getTime();
      const e = it.end.getTime();
      if (ms >= s && ms < e) return true;
    }
    return false;
  }

  function findConsecutiveRuns(hours, goodFlags) {
    const runs = [];
    let runStartIdx = null;

    for (let i = 0; i < goodFlags.length; i++) {
      const ok = goodFlags[i];
      if (ok && runStartIdx === null) {
        runStartIdx = i;
      } else if (!ok && runStartIdx !== null) {
        const start = hours[runStartIdx].time;
        const end = hours[i - 1].time;
        const len = (i - runStartIdx);
        runs.push({ start, end, len });
        runStartIdx = null;
      }
    }
    if (runStartIdx !== null) {
      const start = hours[runStartIdx].time;
      const end = hours[goodFlags.length - 1].time;
      const len = (goodFlags.length - runStartIdx);
      runs.push({ start, end, len });
    }
    return runs;
  }

  // IMPORTANT: return KEY, not English text
  function seeingLabelKeyFromScore(score) {
    if (score == null) return "";
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "average";
    return "poor";
  }

  function computeSeeingScoreFromValues(ws200, ws300, ws500, ws700) {
    const toNum = (v) => (typeof v === "number" ? v : (v == null ? null : Number(v)));
    const v200 = toNum(ws200);
    const v300 = toNum(ws300);
    const v500 = toNum(ws500);
    const v700 = toNum(ws700);

    const avg = (arr) => {
      const f = arr.filter(v => typeof v === "number" && isFinite(v));
      if (!f.length) return null;
      return f.reduce((a, b) => a + b, 0) / f.length;
    };

    const Vjet = avg([v200, v300]);
    const Vmid = avg([v500, v700]);
    if (Vjet == null || Vmid == null) return null;

    const penJet = clamp((Vjet - 100) / (200 - 100), 0, 1);
    const penMid = clamp((Vmid - 40) / (120 - 40), 0, 1);
    const shear = Math.abs(Vjet - Vmid);
    const penShear = clamp((shear - 40) / (120 - 40), 0, 1);

    const totalPenalty = 0.5 * penJet + 0.3 * penMid + 0.2 * penShear;
    const score = Math.round((1 - totalPenalty) * 100);
    return clamp(score, 0, 100);
  }

  function buildSeeingMap(resp) {
    if (!resp || !resp.hourly || !Array.isArray(resp.hourly.time)) return null;
    const tArr = resp.hourly.time;

    // Note: Open-Meteo gives these in km/h
    const ws200 = resp.hourly.wind_speed_200hPa || [];
    const ws300 = resp.hourly.wind_speed_300hPa || [];
    const ws500 = resp.hourly.wind_speed_500hPa || [];
    const ws700 = resp.hourly.wind_speed_700hPa || [];

    const map = {};
    for (let i = 0; i < tArr.length; i++) {
      const score = computeSeeingScoreFromValues(ws200[i], ws300[i], ws500[i], ws700[i]);
      if (score != null) {
        map[tArr[i]] = { score, labelKey: seeingLabelKeyFromScore(score) };
      }
    }
    return map;
  }

  // ---------- API ----------
  async function fetchWeather(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      hourly: "cloud_cover,wind_speed_10m,relative_humidity_2m",
      models: "best_match",
      timezone: "auto",
      forecast_days: "14"
    });
    const url = "https://api.open-meteo.com/v1/forecast?" + params.toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error("Open-Meteo weather error: " + res.status);
    return res.json();
  }

  async function fetchAOD(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      hourly: "aerosol_optical_depth",
      timezone: "auto",
      forecast_days: "7"
    });
    const url = "https://air-quality-api.open-meteo.com/v1/air-quality?" + params.toString();

    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  }

  async function fetchSeeing(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      hourly: "wind_speed_200hPa,wind_speed_300hPa,wind_speed_500hPa,wind_speed_700hPa",
      models: "gem_seamless",
      timezone: "auto",
      forecast_days: "14"
    });
    const url = "https://api.open-meteo.com/v1/forecast?" + params.toString();
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  }
})();