// E-Okul Rapor Asistanı — Panel (v2.1.7)
// Injected into report pages. Provides the floating UI + automation engine.

(() => {
  if (document.getElementById("ekoa-panel-host")) return; // already injected

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
    clearMode:   "buttons",  
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
      <div id="ekoa-header"><span id="ekoa-title">Gelişim Raporu Asistanı</span><span id="ekoa-version">v2.1.7</span><button class="ekoa-hbtn" id="ekoa-minimize">−</button></div>
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
              <div class="ekoa-field"><span class="ekoa-label">Temizle</span><select class="ekoa-select" id="ekoa-clear-mode"><option value="buttons">Butonla (Yeşil)</option><option value="uncheck">Seçimi Kaldır</option><option value="none">Yok</option></select></div>
            </div>
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
    grades = res[STORAGE.grades] || [];
    $("ekoa-set-openWait").value = settings.openWait;
    $("ekoa-set-actionWait").value = settings.actionWait;
    $("ekoa-set-saveWait").value = settings.saveWait;
    $("ekoa-fill-mode-select").value = settings.fillMode;
    $("ekoa-clear-mode").value = settings.clearMode;
    updateGradeStatus(); renderGradeTable(); renderFillUI(); bindTabs(); bindEvents(); makeDraggable(); restorePanelPosition();
    log("Panel v2.1.7 hazır", "success");
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
    tbody.innerHTML = grades.slice(0, 30).map(g => `<tr><td>${g.no}</td><td title="${g.name}">${g.name.split(' ')[0]}...</td><td><b>${g.score ?? "-"}</b></td></tr>`).join("");
  }

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
    if (units.length > 0) log(`${units.length} ünite saptandı.`, "success"); else log("Ünite bulunamadı.", "error");
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

  function getRadioGroups() {
    const groups = new Map();
    document.querySelectorAll('input[type="radio"]').forEach(r => { if (!r.name) return; if (!groups.has(r.name)) groups.set(r.name, []); groups.get(r.name).push(r); });
    return groups;
  }

  async function runAutomation(job = "fill") {
    if (isRunning) return;
    const buttons = [...document.querySelectorAll('[id^="btnOpen_"]')];
    if (buttons.length === 0) { log("Öğrenci bulunamadı!", "error"); return; }
    const activeGroups = [];
    units.forEach(u => { if (u.selected) activeGroups.push(...u.groups); });
    if (job === "fill" && activeGroups.length === 0) { log("Ünite seçilmedi!", "error"); return; }

    isRunning = true; stopRequested = false;
    $("ekoa-btn-run").disabled = true; $("ekoa-btn-stop").disabled = false;
    log("Başlatıldı...");

    for (let i = 0; i < buttons.length; i++) {
      if (stopRequested) break;
      const btn = buttons[i];
      const student = findGradeForRow(btn, i);
      const mode = $("ekoa-fill-mode-select").value;

      if (job === "fill" && mode === "grade" && (!student || student.score === null || student.score === undefined || student.score < 0)) {
        log(`Öğrenci ${i+1} atlandı: Notu yok.`, "warn");
        continue;
      }

      btn.click();
      await sleep(settings.openWait);

      const clearMode = $("ekoa-clear-mode").value;
      const groups = getRadioGroups();

      if (job === "fill" || job === "clear") {
        if (clearMode === "buttons") {
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
        } else if (clearMode === "uncheck") {
          document.querySelectorAll('input[type="radio"]:checked').forEach(r => {
            if (activeGroups.includes(r.name)) { r.checked = false; r.dispatchEvent(new Event("change", { bubbles: true })); }
          });
        }
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
      $("ekoa-progress-inner").style.width = `${((i + 1) / buttons.length) * 100}%`;
      await sleep(settings.loopGap);
    }
    isRunning = false; $("ekoa-btn-run").disabled = false; $("ekoa-btn-stop").disabled = true;
    log(stopRequested ? "Durduruldu." : "Bitti.", stopRequested ? "error" : "success");
  }

  function findGradeForRow(btn, index) {
    const tr = btn?.closest("tr");
    if (!tr) return grades[index];
    const cells = [...tr.querySelectorAll("td")];
    for (const cell of cells) { const match = grades.find(g => g.no === cell.textContent.trim()); if (match) return match; }
    return grades[index];
  }

  function bindTabs() {
    shadow.querySelectorAll(".ekoa-tab").forEach(tab => {
      tab.onclick = () => { shadow.querySelectorAll(".ekoa-tab, .ekoa-tab-content").forEach(el => el.classList.remove("active")); tab.classList.add("active"); $(`ekoa-tab-${tab.dataset.tab}`).classList.add("active"); };
    });
  }

  function bindEvents() {
    $("ekoa-btn-fetch").onclick = async () => {
      const btn = $("ekoa-btn-fetch"); const status = $("ekoa-grade-status");
      btn.disabled = true; btn.innerText = "⌛ Alınıyor..."; status.innerText = "Bağlantı kuruluyor...";
      chrome.runtime.sendMessage({ type: "OPEN_SCRAPER_TAB" });
      const listener = (msg) => {
        if (msg.type === "NOTIFY_PANEL") {
          chrome.runtime.onMessage.removeListener(listener);
          btn.disabled = false; btn.innerText = "📥 Getir";
          if (msg.status === "done") { chrome.storage.local.get(STORAGE.grades, (res) => { grades = res[STORAGE.grades] || []; updateGradeStatus(); renderGradeTable(); log(`${grades.length} not yüklendi.`, "success"); }); }
          else { status.innerText = "Hata!"; log("Hata: " + (msg.message || "Bilinmeyen"), "error"); }
        }
      };
      chrome.runtime.onMessage.addListener(listener);
    };
    $("ekoa-btn-unit-fetch").onclick = () => { const btn = $("ekoa-btn-unit-fetch"); btn.disabled = true; btn.innerText = "⌛ Taranıyor..."; setTimeout(() => { discoverUnits(); btn.disabled = false; btn.innerText = "🔄 Üniteleri Tara"; }, 500); };
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
      settings.clearMode = $("ekoa-clear-mode").value;
      chrome.storage.local.set({ [STORAGE.settings]: settings }); log("Ayarları Kaydetti.", "success");
    };
    $("ekoa-minimize").onclick = () => { const isHidden = $("ekoa-body").classList.toggle("hidden"); $("ekoa-minimize").textContent = isHidden ? "+" : "−"; };
  }

  function makeDraggable() {
    const hdr = $("ekoa-header"); let drag = false, x, y;
    hdr.onmousedown = (e) => { if (e.target.tagName === "BUTTON") return; drag = true; x = e.clientX - host.offsetLeft; y = e.clientY - host.offsetTop; };
    document.onmousemove = (e) => { if (drag) { host.style.left = (e.clientX - x) + "px"; host.style.top = (e.clientY - y) + "px"; host.style.right = "auto"; host.style.bottom = "auto"; } };
    document.onmouseup = () => { if (drag) { drag = false; chrome.storage.local.set({ [STORAGE.panel_pos]: { left: host.style.left, top: host.style.top } }); } };
  }

  function restorePanelPosition() {
    chrome.storage.local.get(STORAGE.panel_pos, res => { if (res[STORAGE.panel_pos]) { Object.assign(host.style, { left: res[STORAGE.panel_pos].left, top: res[STORAGE.panel_pos].top, right: "auto", bottom: "auto" }); } });
  }

  init();
})();
