/* settings-io.js
   Darkness Planner — Settings Export / Import tools (human-readable).
   - No base64 support.
   - Language is driven ONLY by dark.js (settings.lang).
   - dark.js must call: ToolsTransfer.applyLanguage(lang) inside its applyLanguage().
*/

(function () {
  'use strict';

  const ToolsTransfer = {};
  window.ToolsTransfer = ToolsTransfer;

  // Preferred keys (may be overridden by auto-detect)
  const PREFERRED_STORAGE_KEY = 'darkness-planner-settings-v1';
  const LEGACY_LOCATIONS_KEY = 'darkness-planner-locations-v1';

  // Current UI language for tool messages (set by applyLanguage)
  let currentLang = 'en';

  // ---------- Small DOM helpers ----------

  function byIdAny(ids) {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  function safeText(v) {
    return v == null ? '' : String(v);
  }

  function setStatus(msg) {
    // Your index.html uses: <span id="settingsStatus"></span>
    const el = byIdAny([
      'settingsStatus',   // current
      'toolsStatus',      // fallback
      'settingsIoStatus', // fallback
      'transferStatus'    // fallback
    ]);
    if (el) el.textContent = msg || '';
  }

  // ---------- Detect storage key ----------

  function detectStorageKey() {
    if (localStorage.getItem(PREFERRED_STORAGE_KEY)) return PREFERRED_STORAGE_KEY;

    // Try to find any key that looks like Darkness Planner settings
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.includes('darkness-planner-settings')) return k;
    }
    return PREFERRED_STORAGE_KEY; // fallback
  }

  function readStorageObj() {
    const key = detectStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeStorageObj(obj) {
    const key = detectStorageKey();
    localStorage.setItem(key, JSON.stringify(obj));

    // Optional legacy mirror for older builds
    try {
      if (obj && Array.isArray(obj.locations)) {
        localStorage.setItem(LEGACY_LOCATIONS_KEY, JSON.stringify(obj.locations));
      }
    } catch (e) {}
  }

  function clearStorageAll() {
    const key = detectStorageKey();
    localStorage.removeItem(key);
    try { localStorage.removeItem(LEGACY_LOCATIONS_KEY); } catch (e) {}
  }

  // ---------- Export format ----------

  function buildFilename() {
    const d = new Date();
    const pad2 = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mi = pad2(d.getMinutes());
    return `darkness-planner-settings_${yyyy}-${mm}-${dd}_${hh}-${mi}.txt`;
  }

  function buildExportText(obj) {
    const createdIso = new Date().toISOString();
    const jsonPretty = JSON.stringify(obj, null, 2);

    return [
      '# Darkness Planner Settings Export',
      '# Format: TEXT + JSON payload',
      `# Created: ${createdIso}`,
      '# Paste back into Tools → Import',
      '',
      jsonPretty,
      ''
    ].join('\n');
  }

  function parseImportText(text) {
    const raw = String(text || '').trim();
    if (!raw) throw new Error('Empty input');

    const firstBrace = raw.indexOf('{');
    if (firstBrace === -1) throw new Error('JSON not found');

    const jsonPart = raw.slice(firstBrace);
    return JSON.parse(jsonPart);
  }

  function downloadText(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'darkness-planner-settings.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  // ---------- Language (driven ONLY from dark.js) ----------

  function getL(lang) {
    const use = (lang === 'ru') ? 'ru' : 'en';
    return (use === 'ru') ? (window.DARK_LANG_RU || {}) : (window.DARK_LANG_EN || {});
  }

  function t(key, fallback) {
    const L = getL(currentLang);
    return (L && L[key]) ? String(L[key]) : fallback;
  }

  ToolsTransfer.applyLanguage = function (lang) {
    currentLang = (lang === 'ru') ? 'ru' : 'en';
    const L = getL(currentLang);
    const tt = (key, fallback) => (L && L[key]) ? String(L[key]) : fallback;

    // Title (your index uses <summary id="i_toolsTitle"> ... </summary>)
    const title = byIdAny(['i_toolsTitle', 'toolsTitle']);
    if (title) title.textContent = tt('toolsTitle', 'Tools (Export / Import)');

    const bExport = byIdAny(['btnExportSettings']);
    const bCopy = byIdAny(['btnCopySettings']);
    const bDl = byIdAny(['btnDownloadSettings']);
    const bImport = byIdAny(['btnImportSettings']);
    const bReset = byIdAny(['btnResetSettings']);

    if (bExport) bExport.textContent = tt('toolsBtnExport', 'Export');
    if (bCopy) bCopy.textContent = tt('toolsBtnCopy', 'Copy');
    if (bDl) bDl.textContent = tt('toolsBtnDownload', 'Download .txt');
    if (bImport) bImport.textContent = tt('toolsBtnImport', 'Import');
    if (bReset) bReset.textContent = tt('toolsBtnReset', 'Reset to defaults');

    const ta = byIdAny(['settingsTransfer']);
    if (ta) ta.placeholder = tt('toolsPlaceholder', 'Paste exported text here to import…');

    setStatus('');
  };

  // ---------- Actions ----------

  function exportToBox() {
    const ta = byIdAny(['settingsTransfer']);
    if (!ta) {
      setStatus(t('toolsStatusNoTextarea', 'Textarea not found (settingsTransfer).'));
      return;
    }

    const obj = readStorageObj();
    if (!obj) {
      setStatus(t('toolsStatusNoData', 'Nothing to export yet. Use the app once, then try again.'));
      ta.value = '';
      return;
    }

    ta.value = buildExportText(obj);
    setStatus(t('toolsStatusExported', 'Exported.'));
  }

  function fallbackCopy(ta) {
    if (!ta) return;
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      setStatus(t('toolsStatusCopied', 'Copied.'));
    } catch (e) {
      setStatus(t('toolsStatusCopyFailed', 'Copy failed. Please select and copy manually.'));
    }
  }

  function copyBox() {
    const ta = byIdAny(['settingsTransfer']);
    const text = ta ? ta.value : '';
    if (!text.trim()) {
      setStatus(t('toolsStatusNothingToCopy', 'Nothing to copy.'));
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setStatus(t('toolsStatusCopied', 'Copied.'));
      }).catch(() => {
        fallbackCopy(ta);
      });
      return;
    }

    fallbackCopy(ta);
  }

  function downloadBoxOrStorage() {
    const ta = byIdAny(['settingsTransfer']);
    let text = ta ? ta.value : '';

    if (!text.trim()) {
      const obj = readStorageObj();
      if (!obj) {
        setStatus(t('toolsStatusNoData', 'Nothing to export yet. Use the app once, then try again.'));
        return;
      }
      text = buildExportText(obj);
      if (ta) ta.value = text;
    }

    downloadText(text, buildFilename());
    setStatus(t('toolsStatusDownloaded', 'Downloaded.'));
  }

  function importFromBox() {
    const ta = byIdAny(['settingsTransfer']);
    const text = ta ? ta.value : '';
    const obj = parseImportText(text);

    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('Invalid settings JSON');
    }

    writeStorageObj(obj);
    setStatus(t('toolsStatusImported', 'Imported. Reloading…'));
    setTimeout(() => location.reload(), 150);
  }

  function resetAll() {
    const ok = confirm(t('toolsConfirmReset', 'Reset all app settings to defaults?'));
    if (!ok) return;

    clearStorageAll();
    setStatus(t('toolsStatusReset', 'Reset. Reloading…'));
    setTimeout(() => location.reload(), 150);
  }

  function onFilePicked(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const ta = byIdAny(['settingsTransfer']);
      if (ta) ta.value = safeText(reader.result);
      setStatus(t('toolsStatusFileLoaded', 'File loaded. Now press Import.'));
    };
    reader.onerror = () => setStatus(t('toolsStatusFileLoadFailed', 'Failed to read file.'));
    reader.readAsText(file);
  }

  // ---------- Bind UI ----------

  function bindUI() {
    const btnExport = byIdAny(['btnExportSettings']);
    const btnCopy = byIdAny(['btnCopySettings']);
    const btnDownload = byIdAny(['btnDownloadSettings']);
    const btnImport = byIdAny(['btnImportSettings']);
    const btnReset = byIdAny(['btnResetSettings']);
    const fileInput = byIdAny(['settingsFile']);

    if (btnExport) btnExport.addEventListener('click', (e) => { e.preventDefault(); exportToBox(); });
    if (btnCopy) btnCopy.addEventListener('click', (e) => { e.preventDefault(); copyBox(); });
    if (btnDownload) btnDownload.addEventListener('click', (e) => { e.preventDefault(); downloadBoxOrStorage(); });

    if (btnImport) {
      btnImport.addEventListener('click', (e) => {
        e.preventDefault();
        try {
          importFromBox();
        } catch (err) {
          setStatus(t('toolsStatusImportFailed', 'Import failed: ') + safeText(err && err.message));
        }
      });
    }

    if (btnReset) btnReset.addEventListener('click', (e) => { e.preventDefault(); resetAll(); });

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const f = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
        onFilePicked(f);
      });
    }

    // Do NOT call applyLanguage() here.
    // dark.js is the single source of truth and will call ToolsTransfer.applyLanguage(lang).
  }

  window.addEventListener('DOMContentLoaded', bindUI);
})();