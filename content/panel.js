// E-Okul Rapor Asistanı — Panel (v2.2.0)
// Improvements: clearer error messages, dynamic button querying,
// safer run loop with try/finally to ensure UI state restored.

(function() {
  if (document.getElementById("ekoa-panel-host")) return;

  const STORAGE = {
    grades:    "ekoa_grades",
    grades_ts: "ekoa_grades_ts",
    settings:  "ekoa_settings",
    panel_pos: "ekoa_panel_pos",
  };

  const DEFAULT_SETTINGS = {
    fillMode:    "grade",
    manualMode:  "random_all",
    fixedVal:    3,
    randMin:     3,
    randMax:     5,
    openWait:    1200,
    actionWait:  800,
    saveWait:    1000,
    yesDelay:    600,
    loopGap:     500,
  };

  const PANEL_CSS = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :host { position: fixed; bottom: 24px; right: 24px; z-index: 2147483647; font-family: system-ui, -apple-system, sans-serif; }
    #ekoa-root { width: 340px; background: #fff; border-radius: 18px; box-shadow: 0 25px 60px rgba(0,0,0,.18), 0 5px 15px rgba(0,0,0,.08); overflow: hidden; display: flex; flex-direction: column; user-select: none; border: 1px solid rgba(255,255,255,0.3); }
    .ekoa-section { padding: 12px; border-bottom: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 8px; }
    .ekoa-section:last-child { border-bottom: none; }
    .ekoa-section-title { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; align-items: center; }
    #ekoa-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #fff; cursor: grab; gap: 10px; }
    #ekoa-header:active { cursor: grabbing; }
    #ekoa-title { font-weight: 800; font-size: 14px; flex: 1; letter-spacing: -0.02em; }
    #ekoa-version { font-size: 10px; font-weight: 700; padding: 2px 8px; background: rgba(255,255,255,0.2); border-radius: 20px; }
    .ekoa-hbtn { background: none; border: none; color: #fff; cursor: pointer; font-size: 18px; padding: 2px 5px; border-radius: 6px; line-height: 1; }
    #ekoa-tabs { display: flex; border-bottom: 1px solid #f1f5f9; background: #f8fafc; padding: 4px; gap: 4px; }
    .ekoa-tab { flex: 1; padding: 6px 4px; font-size: 11px; font-weight: 700; border: none; background: none; cursor: pointer; color: #64748b; border-radius: 8px; transition: all .2s; }
    .ekoa-tab.active { color: #1e40af; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
    .ekoa-tab-content { display: none; flex-direction: column; }
    .ekoa-tab-content.active { display: flex; }
    .ekoa-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    #ekoa-grade-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; background: #fff; }
    #ekoa-grade-status { font-size: 11px; color: #475569; font-weight: 600; flex: 1; }
    #ekoa-btn-fetch { font-size: 10px; padding: 4px 10px; border-radius: 6px; border: none; background: #1e40af; color: #fff; cursor: pointer; font-weight: 700; min-width: 70px; }
    #ekoa-grade-table-wrap, #ekoa-unit-wrap { max-height: 120px; overflow-y: auto; background: #fff; }
    #ekoa-grade-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    #ekoa-grade-table td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .ekoa-unit-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
    .ekoa-unit-item:hover { background: #f8fafc; }
    .ekoa-unit-text { font-size: 11px; color: #334155; line-height: 1.4; font-weight: 600; }
    .ekoa-label { font-size: 10px; color: #64748b; font-weight: 700; margin-bottom: 2px; }
    select.ekoa-select, input.ekoa-input { width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 12px; background: #fff; color: #334155; }
    .ekoa-row { display: flex; gap: 8px; align-items: flex-end; }
    .ekoa-field { display: flex; flex-direction: column; flex: 1; }
    .ekoa-btn { padding: 10px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .ekoa-btn:disabled { opacity: .4; cursor: not-allowed; }
    .ekoa-btn-primary { background: #1e40af; color: #fff; box-shadow: 0 4px 12px rgba(30,64,175,0.2); width: 100%; }
    .ekoa-btn-primary:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
    .ekoa-btn-warning { background: #fff; color: #b45309; border: 1px solid #fcd34d; }
    .ekoa-btn-danger { background: #fff; color: #dc2626; border: 1px solid #fca5a5; }
    .ekoa-btn-ghost { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; font-size: 10px; padding: 4px; }
    #ekoa-progress-outer { height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
    #ekoa-progress-inner { height: 100%; background: #1e40af; width: 0%; transition: width .3s; }
    #ekoa-log { max-height: 180px; overflow-y: auto; font-size: 10px; font-family: monospace; background: #0f172a; color: #94a3b8; border-radius: 12px; padding: 10px; margin: 12px; }
    .ekoa-log-error { color: #f87171; }
    .ekoa-log-success { color: #4ade80; }
    .hidden { display: none !important; }
  `;
  const PANEL_HTML = `
    <style>${PANEL_CSS}</style>
    <div id="ekoa-root">
      <div id="ekoa-header"><span id="ekoa-title">Gelişim Düzeyleri Giriş Asistanı</span><span id="ekoa-version">v2.2.0</span><button class="ekoa-hbtn" id="ekoa-minimize">−</button></div>
      <div id="ekoa-body">
        <div id="ekoa-tabs">
          <button class="ekoa-tab active" data-tab="fill">Doldur</button>
          <button class="ekoa-tab" data-tab="settings">Ayarlar</button>
          <button class="ekoa-tab" data-tab="log">Log</button>
        </div>
        <div id="ekoa-tab-fill" class="ekoa-tab-content active">
          <div class="ekoa-section">
            <div class="ekoa-section-title">📊 Öğrenci Notları</div>
            <div class="ekoa-card">
              <div id="ekoa-grade-bar"><span id="ekoa-grade-status">Not yüklenmedi</span><button id="ekoa-btn-fetch">📥 Getir</button></div>
              <div style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
                <button id="ekoa-btn-sel-all" style="font-size:9px;background:none;border:none;color:#1e40af;cursor:pointer;font-weight:700;">Hepsini Seç</button>
                <button id="ekoa-btn-sel-none" style="font-size:9px;background:none;border:none;color:#dc2626;cursor:pointer;font-weight:700;">Hiçbirini Seçme</button>
                <span id="ekoa-sel-count" style="font-size:9px;color:#64748b;margin-left:auto;"></span>
              </div>
              <div id="ekoa-grade-table-wrap"><table id="ekoa-grade-table"><tbody id="ekoa-grade-tbody"></tbody></table></div>
              <button class="ekoa-btn-ghost" id="ekoa-btn-clear-list" style="width:100%; border:none; border-top:1px solid #f1f5f9;">🗑️ Listeyi Temizle</button>
            </div>
          </div>
          <div class="ekoa-section">
            <div class="ekoa-section-title">📂 Ünite Seçimi <button id="ekoa-btn-unit-fetch" style="font-size:9px; background:none; border:none; color:#1e40af; cursor:pointer; font-weight:800; min-width:85px;">🔄 Üniteleri Tara</button></div>
            <div class="ekoa-card">
              <div style="display:flex; padding:6px 12px; border-bottom:1px solid #e2e8f0; gap:12px; background:#fff;">
                <button id="ekoa-btn-unit-all" style="font-size:9px; background:none; border:none; color:#1e40af; cursor:pointer; font-weight:700;">Hepsini Seç</button>
                <button id="ekoa-btn-unit-none" style="font-size:9px; background:none; border:none; color:#dc2626; cursor:pointer; font-weight:700;">Temizle</button>
              </div>
              <div id="ekoa-unit-wrap"><div id="ekoa-unit-list"><div style="padding:15px; text-align:center; color:#94a3b8; font-size:10px;">Sayfayı açıp 'Üniteleri Tara'ya basın</div></div></div>
            </div>
          </div>
          <div class="ekoa-section" style="background: #f8fafc;">
            <div class="ekoa-row">
              <div class="ekoa-field"><span class="ekoa-label">Mod</span><select class="ekoa-select" id="ekoa-fill-mode-select"><option value="grade">Not Tabanlı</option><option value="manual">Manuel</option></select></div>
            </div>
            <div style="font-size:10px;color:#64748b;padding:0 4px;">Temizleme için sol alttaki <b>TEMİZLE</b> butonunu kullanabilirsiniz.</div>
            <div id="ekoa-manual-opts" class="hidden" style="margin-top:4px;">
              <div class="ekoa-row">
                <div class="ekoa-field"><select class="ekoa-select" id="ekoa-manual-mode"><option value="random_all">Rastgele</option><option value="fixed">Sabit</option><option value="rand_range">Aralık</option></select></div>
                <div id="ekoa-fixed-row" class="hidden"><input class="ekoa-input" type="number" id="ekoa-fixed-val" min="1" max="5" value="3" style="width:50px;"></div>
                <div id="ekoa-range-row" class="ekoa-row hidden"><input class="ekoa-input" type="number" id="ekoa-range-min" min="1" max="5" value="3" style="width:45px;"><input class="ekoa-input" type="number" id="ekoa-range-max" min="1" max="5" value="5" style="width:45px;"></div>
              </div>
            </div>
            <div class="ekoa-row" style="margin-top:8px;"><button class="ekoa-btn ekoa-btn-primary" id="ekoa-btn-run">BAŞLAT</button><button class="ekoa-btn ekoa-btn-danger" id="ekoa-btn-stop" disabled style="width:50px;">■</button></div>
            <div style="display:flex; align-items:center; gap:10px; margin-top:4px;"><button class="ekoa-btn ekoa-btn-warning" id="ekoa-btn-clear-all" style="padding:4px 8px; font-size:10px;">TEMİZLE</button><div id="ekoa-progress-outer" style="flex:1;"><div id="ekoa-progress-inner"></div></div></div>
          </div>
        </div>
        <div id="ekoa-tab-settings" class="ekoa-tab-content">
          <div class="ekoa-section">
             <div class="ekoa-field"><span class="ekoa-label">Açılış (ms)</span><input class="ekoa-input" type="number" id="ekoa-set-openWait"></div>
             <div class="ekoa-field"><span class="ekoa-label">İşlem (ms)</span><input class="ekoa-input" type="number" id="ekoa-set-actionWait"></div>
             <div class="ekoa-field"><span class="ekoa-label">Kayıt (ms)</span><input class="ekoa-input" type="number" id="ekoa-set-saveWait"></div>
             <button class="ekoa-btn ekoa-btn-primary" id="ekoa-btn-save-settings" style="margin-top:10px;">AYARLARI KAYDET</button>
          </div>
        </div>
        <div id="ekoa-tab-log" class="ekoa-tab-content"><div id="ekoa-log"></div></div>
      </div>
    </div>
  `;

  const host = document.createElement("div");
  host.id = "ekoa-panel-host";
  Object.assign(host.style, { position: "fixed", bottom: "24px", right: "24px", zIndex: "2147483647" });
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = PANEL_HTML;
  const $ = (id) => shadow.getElementById(id);

  let settings = { ...DEFAULT_SETTINGS };
  let grades = [];
  let units = [];
  let stopRequested = false;
  let isRunning = false;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function init() {
    const res = await chrome.storage.local.get([STORAGE.settings, STORAGE.grades]);
    settings = Object.assign({}, DEFAULT_SETTINGS, res[STORAGE.settings] || {});
    grades = (res[STORAGE.grades] || []).map(g => ({ ...g, selected: true }));
    $("ekoa-set-openWait").value = settings.openWait;
    $("ekoa-set-actionWait").value = settings.actionWait;
    $("ekoa-set-saveWait").value = settings.saveWait;
    $("ekoa-fill-mode-select").value = settings.fillMode;
    updateGradeStatus(); renderGradeTable(); renderFillUI(); bindTabs(); bindEvents(); makeDraggable(); restorePanelPosition();
    log("Panel v2.2.0 hazır", "success");
  }

  function log(msg, level = "info") {
    const logEl = $("ekoa-log");
    if (!logEl) return;
    const div = document.createElement("div");
    div.className = `ekoa-log-${level}`;
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }

  // Render helpers
  function renderFillUI() {
    const mode = $("ekoa-fill-mode-select").value;
    $("ekoa-manual-opts").classList.toggle("hidden", mode !== "manual");
    const mm = $("ekoa-manual-mode").value;
    $("ekoa-fixed-row").classList.toggle("hidden", mm !== "fixed");
    $("ekoa-range-row").classList.toggle("hidden", mm !== "rand_range");
  }

  function updateGradeStatus() {
    $("ekoa-grade-status").textContent = grades.length > 0 ? `${grades.length} Öğrenci` : "Not Yok";
    $("ekoa-grade-bar").style.background = grades.length > 0 ? "#f0fdf4" : "#fff";
  }

  function renderGradeTable() {
    const tbody = $("ekoa-grade-tbody");
    tbody.innerHTML = grades.map((g, i) =>
      `<tr>
        <td style="padding:4px 6px;width:20px;"><input type="checkbox" data-i="${i}" ${g.selected !== false ? "checked" : ""}></td>
        <td title="${(g.name||'').replace(/"/g, '&quot;')}">${(g.name||'').split(' ')[0]}...</td>
        <td><b>${g.score ?? "-"}</b></td>
      </tr>`
    ).join("");
    tbody.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.onchange = () => { grades[+cb.dataset.i].selected = cb.checked; updateSelCount(); };
    });
    updateSelCount();
  }

  function updateSelCount() {
    const el = $("ekoa-sel-count");
    if (!el || grades.length === 0) { if (el) el.textContent = ""; return; }
    const n = grades.filter(g => g.selected !== false).length;
    el.textContent = `${n}/${grades.length} seçili`;
  }

  // Unit discovery (tries several heuristics)
  function discoverUnits() {
    const newUnits = [];
    const toggles = [...document.querySelectorAll('[data-toggle="collapse"]')];
    if (toggles.length > 0) {
      toggles.forEach((toggle, index) => {
        const label = toggle.innerText.trim();
        const targetSelector = toggle.getAttribute("data-target") || toggle.getAttribute("href");
        if (label && targetSelector && targetSelector.startsWith("#")) {
          const contentArea = document.querySelector(targetSelector);
          if (contentArea) {
            const radios = contentArea.querySelectorAll('input[type="radio"]');
            const groupNames = new Set();
            radios.forEach(r => { if (r.name) groupNames.add(r.name); });
            if (groupNames.size > 0) { newUnits.push({ id: "unit_" + index, label: label, selected: true, groups: Array.from(groupNames) }); }
          }
        }
      });
    }
    if (newUnits.length === 0) {
      const allTables = [...document.querySelectorAll("table")];
      let targetTable = null;
      for (const t of allTables) { if (t.querySelector('input[type="radio"]')) { targetTable = t; break; } }
      if (targetTable) {
        const rows = [...targetTable.querySelectorAll("tr")];
        let currentUnit = null;
        rows.forEach((tr) => {
          const radios = tr.querySelectorAll('input[type="radio"]');
          const text = tr.innerText.trim();
          if (radios.length === 0 && text.length > 2) {
            const isMeta = text.includes("Öğrenci No") || text.includes("Adı Soyadı") || text.includes("Puan");
            if (!isMeta) { currentUnit = { id: "u" + newUnits.length, label: text, selected: true, groups: [] }; newUnits.push(currentUnit); }
          } else if (radios.length > 0) {
            const groupName = radios[0].name;
            if (groupName) {
              if (currentUnit) { if (!currentUnit.groups.includes(groupName)) currentUnit.groups.push(groupName); }
              else { currentUnit = { id: "u_root", label: "Genel Ünite", selected: true, groups: [groupName] }; newUnits.push(currentUnit); }
            }
          }
        });
      }
    }
    units = newUnits.filter(u => u.groups.length > 0);
    renderUnitList();
    if (units.length > 0) log(`${units.length} ünite saptandı.`, "success"); else log("Ünite bulunamadı. Önce 'Listele' ile öğrencileri yükleyin, ardından tekrar tarayın. Sorun devam ederse sayfayı yenileyip deneyin.", "error");
  }

  function renderUnitList() {
    const list = $("ekoa-unit-list");
    if (units.length === 0) { list.innerHTML = `<div style="padding:15px; text-align:center; color:#94a3b8; font-size:10px;">Ünite bulunamadı.</div>`; return; }
    list.innerHTML = units.map((u, i) => `
      <div class="ekoa-unit-item" data-i="${i}">
        <input type="checkbox" ${u.selected ? "checked" : ""}>
        <div class="ekoa-unit-text">${u.label} <span style="font-weight:400; font-size:9px; color:#94a3b8;">(${u.groups.length})</span></div>
      </div>
    `).join("");
    list.querySelectorAll(".ekoa-unit-item").forEach(item => {
      item.onclick = (e) => { const i = item.dataset.i; if (e.target.tagName !== "INPUT") item.querySelector("input").checked = !item.querySelector("input").checked; units[i].selected = item.querySelector("input").checked; };
    });
  }

  // Radio groups by name (Map<name, radios[]>)
  function getRadioGroups() {
    const groups = new Map();
    document.querySelectorAll('input[type="radio"]').forEach(r => { if (!r.name) return; if (!groups.has(r.name)) groups.set(r.name, []); groups.get(r.name).push(r); });
    return groups;
  }

  // --- Additional helpers integrated from similar implementations ---
  function safeClick(el) { try { el && el.click(); } catch (_) {} }

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }

  function waitForId(id, timeout = 6000) {
    const started = Date.now();
    return new Promise((resolve) => {
      (function check() {
        const el = document.getElementById(id);
        if (el) return resolve(el);
        if (Date.now() - started > timeout) return resolve(null);
        setTimeout(check, 150);
      })();
    });
  }

  function radioKey(radio, fallbackIndex) {
    if (radio.name) return `name:${radio.name}`;
    const row = radio.closest('tr,[role="row"],li,.row,.satir');
    if (row) {
      if (!row.dataset.ekRowKey) row.dataset.ekRowKey = `row:${fallbackIndex}`;
      return row.dataset.ekRowKey;
    }
    const parent = radio.parentElement || radio;
    if (!parent.dataset.ekRowKey) parent.dataset.ekRowKey = `parent:${fallbackIndex}`;
    return parent.dataset.ekRowKey;
  }

  function collectRadioGroups() {
    const radios = Array.from(document.querySelectorAll('input[type="radio"]')).filter(r => !r.disabled);
    const map = new Map();
    radios.forEach((radio, index) => {
      const key = radioKey(radio, index);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(radio);
    });
    return Array.from(map.values()).filter(group => group.length);
  }

  function activateRadio(radio) {
    if (!radio || radio.disabled) return;
    safeClick(radio);
    if (!radio.checked) radio.checked = true;
    radio.dispatchEvent(new Event('input', { bubbles: true }));
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function findDialogActionButton(excludeEl) {
    const knownIds = [
      'modalConfirmBoxBtn1',
      'modalAlertBoxBtn1',
      'modalAlertBoxBtn',
      'modalInfoBoxBtn1',
      'modalMessageBoxBtn1'
    ];
    for (const id of knownIds) {
      const el = document.getElementById(id);
      if (el && el !== excludeEl && isVisible(el)) return el;
    }
    const dialog = Array.from(document.querySelectorAll('.modal, .modal-dialog, .ui-dialog, [role="dialog"], .swal2-popup')).find(isVisible);
    if (!dialog) return null;
    return Array.from(dialog.querySelectorAll('button, a, input[type="button"], input[type="submit"]')).find(el => el !== excludeEl && isVisible(el) && /^(kaydet|tamam|evet|ok|kapat)$/i.test((el.innerText||el.value||'').trim()));
  }

  async function closeSaveDialogs(excludeEl) {
    const started = Date.now();
    let clicked = false;
    while (Date.now() - started < 7000) {
      const actionBtn = findDialogActionButton(excludeEl);
      if (actionBtn) {
        safeClick(actionBtn);
        clicked = true;
        await new Promise(r => setTimeout(r, 350));
        continue;
      }
      if (clicked) break;
      await new Promise(r => setTimeout(r, 150));
    }
  }

  function showSaveSuccess(saveBtn, saveRect) {
    const old = document.getElementById('ek-save-success');
    if (old) old.remove();
    const msg = document.createElement('div');
    msg.id = 'ek-save-success';
    msg.textContent = '✅ Otomatik kayıt başarılı';
    const rect = saveRect || (saveBtn ? saveBtn.getBoundingClientRect() : null);
    msg.style.position = 'fixed';
    msg.style.left = rect ? `${Math.max(8, rect.left)}px` : '50%';
    msg.style.top = rect ? `${Math.max(8, rect.bottom + 8)}px` : '82px';
    msg.style.minWidth = rect ? `${Math.max(210, rect.width + 34)}px` : '240px';
    msg.style.transform = rect ? 'none' : 'translateX(-50%)';
    msg.style.zIndex = '100002';
    msg.style.padding = '10px 14px';
    msg.style.borderRadius = '10px';
    msg.style.background = '#16a34a';
    msg.style.color = '#fff';
    msg.style.fontWeight = '700';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 4500);
  }

  function findVueApp() {
    const roots = [
      document.getElementById('accordionTema'),
      document.querySelector('[v-for*="getData"]'),
      document.body
    ].filter(Boolean);
    const seen = new Set();
    const queue = roots.slice();
    while (queue.length) {
      const el = queue.shift();
      if (!el || seen.has(el)) continue;
      seen.add(el);
      let vm = el.__vue__;
      while (vm) {
        if (Array.isArray(vm.getData)) return vm;
        if (vm.$data && Array.isArray(vm.$data.getData)) return vm;
        vm = vm.$parent;
      }
      queue.push(...Array.from(el.children || []));
    }
    for (const key in window) {
      try {
        const value = window[key];
        if (value && Array.isArray(value.getData)) return value;
        if (value && value.$data && Array.isArray(value.$data.getData)) return value;
      } catch (_) {}
    }
    return null;
  }

  async function saveWhenReady() {
    const saveBtn = await waitForId('IOMToolbarActive1_btnKaydet', 7000);
    if (!saveBtn) return false;
    const saveRect = saveBtn.getBoundingClientRect();
    const vm = findVueApp();
    if (vm && typeof vm.PageCommonFunction === 'function') {
      const confirmInput = document.getElementById('hdnModalPopupConfirm');
      if (confirmInput) confirmInput.value = 'Kaydet';
      try { vm.PageCommonFunction('ModalPopupConfirm', 'Yes'); } catch (_) { safeClick(saveBtn); }
    } else if (typeof window.AlanKontrolveKayit === 'function') {
      try { window.AlanKontrolveKayit(); } catch (_) { safeClick(saveBtn); }
    } else { safeClick(saveBtn); }
    await closeSaveDialogs(saveBtn);
    showSaveSuccess(saveBtn, saveRect);
    return true;
  }

  function installDebugLogger() {
    if (window.__ekDebugInstalled) return;
    window.__ekDebugInstalled = true;
    const log = (...args) => console.log('[EK DEBUG]', ...args);
    log('Debug aktif: click/submit events izleniyor');
    document.addEventListener('click', (e) => {
      const target = e.target;
      const el = target && target.closest ? target.closest('button,a,input,[id]') : target;
      log('click', { tag: el && el.tagName, id: el && el.id, text: (el && (el.innerText || el.value || '')||'').toString().slice(0,80) });
    }, true);
  }

  installDebugLogger();

  function findGradeForRow(btn, index) {
    const tr = btn?.closest("tr");
    if (!tr) return grades[index];
    const cells = [...tr.querySelectorAll("td")];
    for (const cell of cells) { const match = grades.find(g => g.no === cell.textContent.trim()); if (match) return match; }
    return grades[index];
  }

  async function runAutomation(job = "fill") {
    if (isRunning) return;

    // Pre-checks
    const mode = $("ekoa-fill-mode-select").value;
    if (mode === "grade" && grades.length === 0 && job === "fill") {
      log("Not listesi boş — başlamak için önce 'Notları Getir' butonuna basın. Notları çekemiyorsanız 'Manuel' moda geçerek de devam edebilirsiniz.", "error");
      return;
    }

    isRunning = true; stopRequested = false;
    $("ekoa-btn-run").disabled = true; $("ekoa-btn-stop").disabled = false;
    log("Başlatıldı...");

    try {
      let processed = 0;

      for (let i = 0;; i++) {
        if (stopRequested) break;

        const buttons = [...document.querySelectorAll('[id^="btnOpen_"]')];
        if (buttons.length === 0) {
          if (processed === 0) log("Gelişim raporu listesi boş. Sayfada önce sınıf seçip 'Listele' butonuna basın, öğrencilerin yüklendiğinden emin olun, sonra tekrar başlatın.", "error");
          break;
        }
        if (i >= buttons.length) break;
        const btn = buttons[i];

        try {
          const student = findGradeForRow(btn, i);
          const activeGroups = [];
          units.forEach(u => { if (u.selected) activeGroups.push(...u.groups); });
          if (job === "fill" && activeGroups.length === 0) { log("Hiçbir ünite seçili değil. Sol panelde 'Üniteleri Tara'ya basın, ünitelerin yüklendiğini görünce işaretleyip tekrar başlatın.", "error"); break; }

          if (grades.length > 0 && student && student.selected === false) {
            log(`${i+1}. öğrenci atlandı: ${student.name || "(isim yok)"} — listede işareti kaldırılmış.`);
            processed++;
            continue;
          }

          if (job === "fill" && mode === "grade" && (!student || student.score === null || student.score === undefined)) {
            const sName = student?.name || `${i+1}. öğrenci`;
            log(`${sName} için not bulunamadı — not listesinde eşleşme yok veya notu girilmemiş. 'Notları Getir'e tekrar basarak listeyi güncelleyin.`, "warn");
            processed++;
            continue;
          }

          // Open student
          btn.click();
          await sleep(settings.openWait);

          const groups = getRadioGroups();
          if (job === "fill" || job === "clear") {
            groups.forEach((radios, name) => {
              if (!activeGroups.includes(name)) return;
              const row = radios[0]?.closest("tr");
              if (row) {
                const rowBtn = [...row.querySelectorAll('button, input, a')].find(b => {
                  const txt = (b.innerText || b.value || b.title || "").toLowerCase();
                  return txt.includes("temizle") || (b.className && b.className.includes("btn-success") && txt.includes("temizle"));
                });
                if (rowBtn) rowBtn.click();
              }
            });
          }

          if (job === "fill") {
            const score = student?.score ?? 0;
            const level = score >= 85 ? 5 : score >= 70 ? 4 : score >= 50 ? 3 : score >= 25 ? 2 : 1;
            groups.forEach((radios, name) => {
              if (!activeGroups.includes(name)) return;
              let idx;
              if (mode === "grade") idx = Math.min(radios.length - 1, level - 1);
              else {
                const mm = $("ekoa-manual-mode").value;
                if (mm === "random_all") idx = Math.floor(Math.random() * radios.length);
                else if (mm === "fixed") idx = Math.min(radios.length - 1, (parseInt($("ekoa-fixed-val").value) || 3) - 1);
                else { const min = (parseInt($("ekoa-range-min").value) || 1) - 1; const max = (parseInt($("ekoa-range-max").value) || 5) - 1; idx = min + Math.floor(Math.random() * (max - min + 1)); }
              }
              if (radios[Math.max(0, idx)]) { radios[Math.max(0, idx)].checked = true; radios[Math.max(0, idx)].dispatchEvent(new Event("change", { bubbles: true })); }
            });
          }

          await sleep(settings.actionWait);
          const saveBtn = document.getElementById("IOMToolbarActive1_btnKaydet") || document.getElementById("OOMToolbarActive1_btnKaydet");
          if (saveBtn) { 
            saveBtn.click(); await sleep(settings.saveWait); 
            const confirm = document.getElementById("modalConfirmBoxBtn1") || [...document.querySelectorAll("button, input")].find(b => (b.textContent || b.value || "").includes("Evet")); 
            if (confirm) confirm.click(); await sleep(settings.yesDelay); 
          }

          processed++;
          $("ekoa-progress-inner").style.width = `${(processed / buttons.length) * 100}%`;
          await sleep(settings.loopGap);

        } catch (err) {
          const sName = (typeof student !== "undefined" && student?.name) ? student.name : `${i+1}. öğrenci`;
          log(`${sName} işlenirken hata oluştu: ${err.message} — bu öğrenci atlandı, diğerleri devam ediyor.`, "error");
        }
      }

    } catch (e) {
      log(`Otomasyon beklenmedik hata ile durdu: ${e.message} — sayfayı yenileyip tekrar deneyin.`, "error");
    } finally {
      isRunning = false; $("ekoa-btn-run").disabled = false; $("ekoa-btn-stop").disabled = true;
      log(stopRequested ? "Durduruldu." : "Bitti.", stopRequested ? "error" : "success");
    }
  }

  // Event binding (simplified - same handlers as 2.1.8, with minor safety)
  function bindTabs() { shadow.querySelectorAll(".ekoa-tab").forEach(tab => { tab.onclick = () => { shadow.querySelectorAll(".ekoa-tab, .ekoa-tab-content").forEach(el => el.classList.remove("active")); tab.classList.add("active"); $("ekoa-tab-" + tab.dataset.tab).classList.add("active"); }; }); }

  function bindEvents() {
    $("ekoa-btn-fetch").onclick = async () => {
      const btn = $("ekoa-btn-fetch"); const status = $("ekoa-grade-status");
      btn.disabled = true; btn.innerText = "⌛ Alınıyor..."; status.innerText = "Bağlantı kuruluyor...";
      chrome.runtime.sendMessage({ type: "OPEN_SCRAPER_TAB" });
      const listener = (msg) => {
        if (msg.type === "NOTIFY_PANEL") {
          chrome.runtime.onMessage.removeListener(listener);
          btn.disabled = false; btn.innerText = "📥 Getir";
          if (msg.status === "done") { chrome.storage.local.get(STORAGE.grades, (res) => { grades = (res[STORAGE.grades] || []).map(g => ({ ...g, selected: true })); updateGradeStatus(); renderGradeTable(); log(`${grades.length} not yüklendi.`, "success"); }); }
          else { status.innerText = "Hata!"; log("Notlar alınamadı — " + (msg.message || "Bilinmeyen hata. Sayfayı yenileyip tekrar deneyin."), "error"); }
        }
      };
      chrome.runtime.onMessage.addListener(listener);
    };

    $("ekoa-btn-unit-fetch").onclick = () => { const btn = $("ekoa-btn-unit-fetch"); btn.disabled = true; btn.innerText = "⌛ Taranıyor..."; setTimeout(() => { discoverUnits(); btn.disabled = false; btn.innerText = "🔄 Üniteleri Tara"; }, 500); };
    $("ekoa-btn-sel-all").onclick  = () => { grades.forEach(g => g.selected = true);  renderGradeTable(); };
    $("ekoa-btn-sel-none").onclick = () => { grades.forEach(g => g.selected = false); renderGradeTable(); };
    $("ekoa-btn-unit-all").onclick = () => { units.forEach(u => u.selected = true); renderUnitList(); };
    $("ekoa-btn-unit-none").onclick = () => { units.forEach(u => u.selected = false); renderUnitList(); };
    $("ekoa-fill-mode-select").onchange = (e) => { settings.fillMode = e.target.value; renderFillUI(); };
    $("ekoa-manual-mode").onchange = renderFillUI;
    $("ekoa-btn-run").onclick = () => runAutomation("fill");
    $("ekoa-btn-stop").onclick = () => stopRequested = true;
    $("ekoa-btn-clear-all").onclick = () => runAutomation("clear");
    $("ekoa-btn-clear-list").onclick = () => { grades = []; chrome.storage.local.remove([STORAGE.grades]); updateGradeStatus(); renderGradeTable(); };
    $("ekoa-btn-save-settings").onclick = () => {
      settings.openWait = parseInt($("ekoa-set-openWait").value); settings.actionWait = parseInt($("ekoa-set-actionWait").value); settings.saveWait = parseInt($("ekoa-set-saveWait").value);
      chrome.storage.local.set({ [STORAGE.settings]: settings }); log("Ayarları Kaydetti.", "success");
    };
    $("ekoa-minimize").onclick = () => { const isHidden = $("ekoa-body").classList.toggle("hidden"); $("ekoa-minimize").textContent = isHidden ? "+" : "−"; };
  }

  function makeDraggable() {
    const hdr = $("ekoa-header");
    let drag = false;
    let x = 0;
    let y = 0;

    hdr.onmousedown = (e) => {
      if (e.target.tagName === "BUTTON") return;
      drag = true;
      x = e.clientX - host.offsetLeft;
      y = e.clientY - host.offsetTop;
    };

    document.onmousemove = (e) => {
      if (!drag) return;
      host.style.left = (e.clientX - x) + "px";
      host.style.top = (e.clientY - y) + "px";
      host.style.right = "auto";
      host.style.bottom = "auto";
    };

    document.onmouseup = () => {
      if (!drag) return;
      drag = false;
      chrome.storage.local.set({ [STORAGE.panel_pos]: { left: host.style.left, top: host.style.top } });
    };
  }
  function restorePanelPosition() { chrome.storage.local.get(STORAGE.panel_pos, res => { if (res[STORAGE.panel_pos]) { Object.assign(host.style, { left: res[STORAGE.panel_pos].left, top: res[STORAGE.panel_pos].top, right: "auto", bottom: "auto" }); } }); }

  init();
})();
