// E-Okul Rapor Asistanı — Panel
// Injected into report pages. Provides the floating UI + automation engine.

(() => {
  if (document.getElementById("ekoa-panel-host")) return; // already injected

  // ────────────────────────────────────────────────────────────
  // Constants
  // ────────────────────────────────────────────────────────────
  const STORAGE = {
    grades:    "ekoa_grades",
    grades_ts: "ekoa_grades_ts",
    settings:  "ekoa_settings",
    panel_pos: "ekoa_panel_pos",
  };

  const DEFAULT_SETTINGS = {
    fillMode:    "manual",   // "grade" | "manual"
    manualMode:  "random_all", // "random_all" | "fixed" | "rand_range"
    fixedVal:    3,
    randMin:     3,
    randMax:     5,
    clearMode:   "buttons",  // "buttons" | "uncheck" | "none"
    openWait:    1200,
    actionWait:  800,
    saveWait:    1000,
    yesDelay:    600,
    loopGap:     500,
  };

  // ────────────────────────────────────────────────────────────
  // Panel CSS (Shadow DOM — fully isolated)
  // ────────────────────────────────────────────────────────────
  const PANEL_CSS = `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    :host {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      font-family: system-ui, -apple-system, sans-serif;
    }

    #ekoa-root {
      width: 310px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 12px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      user-select: none;
    }

    /* Header */
    #ekoa-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: #1e40af;
      color: #fff;
      cursor: grab;
      gap: 8px;
    }
    #ekoa-header:active { cursor: grabbing; }
    #ekoa-title { font-weight: 700; font-size: 13px; flex: 1; }
    #ekoa-version { font-size: 10px; opacity: .7; }
    .ekoa-hbtn {
      background: none; border: none; color: #fff; cursor: pointer;
      font-size: 15px; padding: 2px 5px; border-radius: 4px; opacity: .8;
      line-height: 1;
    }
    .ekoa-hbtn:hover { opacity: 1; background: rgba(255,255,255,.2); }

    /* Body */
    #ekoa-body { display: flex; flex-direction: column; }

    /* Tabs */
    #ekoa-tabs {
      display: flex;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .ekoa-tab {
      flex: 1; padding: 8px 4px; font-size: 12px; font-weight: 600;
      border: none; background: none; cursor: pointer; color: #64748b;
      border-bottom: 2px solid transparent; transition: all .15s;
    }
    .ekoa-tab.active { color: #1e40af; border-bottom-color: #1e40af; background: #fff; }
    .ekoa-tab:hover:not(.active) { color: #334155; background: #f1f5f9; }

    .ekoa-tab-content { display: none; padding: 12px; flex-direction: column; gap: 10px; }
    .ekoa-tab-content.active { display: flex; }

    /* Grade status bar */
    #ekoa-grade-bar {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 10px; border-radius: 8px;
      border: 1px solid #e2e8f0; background: #f8fafc;
    }
    #ekoa-grade-bar.ok   { background: #f0fdf4; border-color: #86efac; }
    #ekoa-grade-bar.err  { background: #fef2f2; border-color: #fca5a5; }
    #ekoa-grade-bar.busy { background: #eff6ff; border-color: #93c5fd; }
    #ekoa-grade-status { font-size: 11px; color: #475569; flex: 1; }
    #ekoa-btn-fetch {
      font-size: 11px; padding: 4px 8px; border-radius: 6px;
      border: 1px solid #93c5fd; background: #eff6ff; color: #1e40af;
      cursor: pointer; font-weight: 600; white-space: nowrap;
    }
    #ekoa-btn-fetch:hover { background: #dbeafe; }
    #ekoa-btn-fetch:disabled { opacity: .5; cursor: not-allowed; }

    /* Mode toggle */
    .ekoa-mode-row {
      display: flex; gap: 8px;
    }
    .ekoa-mode-label {
      flex: 1; display: flex; align-items: center; justify-content: center;
      gap: 5px; padding: 7px; border-radius: 8px;
      border: 1px solid #e2e8f0; background: #f8fafc;
      cursor: pointer; font-size: 12px; font-weight: 600; color: #475569;
      transition: all .15s;
    }
    .ekoa-mode-label input { display: none; }
    .ekoa-mode-label.selected {
      background: #eff6ff; border-color: #93c5fd; color: #1e40af;
    }

    /* Sub-panels */
    .ekoa-subpanel { display: flex; flex-direction: column; gap: 8px; }
    .ekoa-subpanel.hidden { display: none; }

    /* Grade table */
    #ekoa-grade-table-wrap {
      max-height: 160px; overflow-y: auto;
      border: 1px solid #e2e8f0; border-radius: 8px;
    }
    #ekoa-grade-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    #ekoa-grade-table th {
      padding: 5px 6px; background: #f1f5f9; color: #64748b;
      font-weight: 600; text-align: left; position: sticky; top: 0;
    }
    #ekoa-grade-table td { padding: 4px 6px; border-top: 1px solid #f1f5f9; color: #334155; }
    #ekoa-grade-table tr.ekoa-skipped td { opacity: .4; text-decoration: line-through; }
    .ekoa-score-input {
      width: 44px; padding: 2px 4px; border: 1px solid #cbd5e1;
      border-radius: 4px; text-align: center; font-weight: 600; color: #1e40af;
      font-size: 11px;
    }
    .ekoa-skip-btn {
      background: none; border: none; cursor: pointer; color: #94a3b8;
      font-size: 13px; padding: 0 2px;
    }
    .ekoa-skip-btn:hover { color: #ef4444; }

    /* Form controls */
    .ekoa-label { font-size: 11px; color: #64748b; font-weight: 600; }
    select.ekoa-select, input.ekoa-input {
      width: 100%; padding: 7px 8px; border: 1px solid #cbd5e1;
      border-radius: 8px; font-size: 12px; background: #fff; color: #334155;
    }
    select.ekoa-select:focus, input.ekoa-input:focus {
      outline: none; border-color: #93c5fd;
    }
    .ekoa-row { display: flex; gap: 8px; }
    .ekoa-row > * { flex: 1; }
    .ekoa-field { display: flex; flex-direction: column; gap: 3px; }

    /* Buttons */
    .ekoa-btn {
      padding: 9px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;
      cursor: pointer; border: none; transition: all .15s;
      display: flex; align-items: center; justify-content: center; gap: 4px;
    }
    .ekoa-btn:disabled { opacity: .4; cursor: not-allowed; }
    .ekoa-btn-primary   { background: #1e40af; color: #fff; }
    .ekoa-btn-primary:hover:not(:disabled)   { background: #1d3a9f; }
    .ekoa-btn-danger    { background: #fff; color: #dc2626; border: 1px solid #fca5a5; }
    .ekoa-btn-danger:hover:not(:disabled)    { background: #fef2f2; }
    .ekoa-btn-warning   { background: #fff; color: #b45309; border: 1px solid #fcd34d; }
    .ekoa-btn-warning:hover:not(:disabled)   { background: #fffbeb; }
    .ekoa-btn-ghost     { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
    .ekoa-btn-ghost:hover:not(:disabled)     { background: #f1f5f9; }
    .ekoa-action-row { display: flex; gap: 6px; }
    .ekoa-action-row > * { flex: 1; }

    /* Progress */
    #ekoa-progress { display: flex; flex-direction: column; gap: 4px; }
    #ekoa-progress-outer {
      height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden;
    }
    #ekoa-progress-inner {
      height: 100%; background: #1e40af; border-radius: 99px;
      transition: width .3s ease; width: 0%;
    }
    #ekoa-progress-text { font-size: 11px; color: #64748b; text-align: right; }

    /* Separator */
    .ekoa-sep { border: none; border-top: 1px solid #f1f5f9; }

    /* Settings fields */
    .ekoa-settings-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
    }

    /* Help */
    .ekoa-help { display: flex; flex-direction: column; gap: 10px; max-height: 320px; overflow-y: auto; }
    .ekoa-help-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
    .ekoa-help-title { font-size: 12px; font-weight: 700; color: #1e40af; margin-bottom: 6px; }
    .ekoa-help-steps { font-size: 11px; color: #334155; line-height: 1.6; padding-left: 16px; }
    .ekoa-help-steps li { margin-bottom: 2px; }
    .ekoa-help-note { font-size: 11px; color: #64748b; line-height: 1.5; }

    /* Log */
    #ekoa-log {
      max-height: 200px; overflow-y: auto; font-size: 10px;
      font-family: monospace; background: #0f172a; color: #94a3b8;
      border-radius: 8px; padding: 8px;
    }
    .ekoa-log-info    { color: #94a3b8; }
    .ekoa-log-success { color: #4ade80; }
    .ekoa-log-warn    { color: #fbbf24; }
    .ekoa-log-error   { color: #f87171; }
  `;

  // ────────────────────────────────────────────────────────────
  // Panel HTML
  // ────────────────────────────────────────────────────────────
  const PANEL_HTML = `
    <style>${PANEL_CSS}</style>
    <div id="ekoa-root">

      <div id="ekoa-header">
        <span id="ekoa-title">Gelişim Raporu Asistanı</span>
        <span id="ekoa-version">v1.1.1</span>
        <button class="ekoa-hbtn" id="ekoa-minimize" title="Küçült">−</button>
      </div>

      <div id="ekoa-body">

        <!-- TAB BAR -->
        <div id="ekoa-tabs">
          <button class="ekoa-tab active" data-tab="fill">Doldur</button>
          <button class="ekoa-tab"        data-tab="settings">Ayarlar</button>
          <button class="ekoa-tab"        data-tab="log">Log</button>
          <button class="ekoa-tab"        data-tab="help">?</button>
        </div>

        <!-- ══ TAB: FILL ══ -->
        <div id="ekoa-tab-fill" class="ekoa-tab-content active">

          <!-- Grade fetch bar -->
          <div id="ekoa-grade-bar">
            <span id="ekoa-grade-status">Not yüklenmedi</span>
            <button id="ekoa-btn-fetch">📥 Notları Getir</button>
          </div>

          <!-- Mode toggle -->
          <div class="ekoa-mode-row">
            <label class="ekoa-mode-label" id="ekoa-label-grade">
              <input type="radio" name="ekoa-fill-mode" value="grade">
              📊 Not Tabanlı
            </label>
            <label class="ekoa-mode-label selected" id="ekoa-label-manual">
              <input type="radio" name="ekoa-fill-mode" value="manual" checked>
              ✏️ Manuel
            </label>
          </div>

          <!-- Grade mode sub-panel -->
          <div id="ekoa-grade-opts" class="ekoa-subpanel hidden">
            <div id="ekoa-grade-table-wrap">
              <table id="ekoa-grade-table">
                <thead>
                  <tr>
                    <th>No</th><th>Ad Soyad</th><th>Not</th><th></th>
                  </tr>
                </thead>
                <tbody id="ekoa-grade-tbody"></tbody>
              </table>
            </div>
          </div>

          <!-- Manual mode sub-panel -->
          <div id="ekoa-manual-opts" class="ekoa-subpanel">
            <div class="ekoa-field">
              <span class="ekoa-label">İşaretleme yöntemi</span>
              <select class="ekoa-select" id="ekoa-manual-mode">
                <option value="random_all">Rastgele (1–5 arası)</option>
                <option value="fixed">Sabit değer</option>
                <option value="rand_range">Rastgele aralık</option>
              </select>
            </div>
            <div id="ekoa-fixed-row" class="ekoa-field hidden">
              <span class="ekoa-label">Sabit değer (1–5)</span>
              <input class="ekoa-input" type="number" id="ekoa-fixed-val" min="1" max="5" value="3">
            </div>
            <div id="ekoa-range-row" class="ekoa-row hidden">
              <div class="ekoa-field">
                <span class="ekoa-label">Min</span>
                <input class="ekoa-input" type="number" id="ekoa-range-min" min="1" max="5" value="3">
              </div>
              <div class="ekoa-field">
                <span class="ekoa-label">Max</span>
                <input class="ekoa-input" type="number" id="ekoa-range-max" min="1" max="5" value="5">
              </div>
            </div>
          </div>

          <hr class="ekoa-sep">

          <!-- Clear mode -->
          <div class="ekoa-field">
            <span class="ekoa-label">Önce temizle</span>
            <select class="ekoa-select" id="ekoa-clear-mode">
              <option value="buttons">Temizle butonlarına bas</option>
              <option value="uncheck">Seçimleri kaldır (uncheck)</option>
              <option value="none">Temizleme yapma</option>
            </select>
          </div>

          <!-- Action buttons -->
          <div class="ekoa-action-row">
            <button class="ekoa-btn ekoa-btn-primary" id="ekoa-btn-run">▶ Başlat</button>
            <button class="ekoa-btn ekoa-btn-danger"  id="ekoa-btn-stop" disabled>■ Durdur</button>
          </div>
          <button class="ekoa-btn ekoa-btn-warning" id="ekoa-btn-clear-all">🧹 Hepsini Temizle</button>

          <!-- Progress -->
          <div id="ekoa-progress">
            <div id="ekoa-progress-outer">
              <div id="ekoa-progress-inner"></div>
            </div>
            <span id="ekoa-progress-text">—</span>
          </div>

        </div>

        <!-- ══ TAB: SETTINGS ══ -->
        <div id="ekoa-tab-settings" class="ekoa-tab-content">
          <div class="ekoa-settings-grid">
            <div class="ekoa-field">
              <span class="ekoa-label">Açılış bekleme (ms)</span>
              <input class="ekoa-input" type="number" id="ekoa-set-openWait" min="0" step="50">
            </div>
            <div class="ekoa-field">
              <span class="ekoa-label">İşlem bekleme (ms)</span>
              <input class="ekoa-input" type="number" id="ekoa-set-actionWait" min="0" step="50">
            </div>
            <div class="ekoa-field">
              <span class="ekoa-label">Kayıt bekleme (ms)</span>
              <input class="ekoa-input" type="number" id="ekoa-set-saveWait" min="0" step="50">
            </div>
            <div class="ekoa-field">
              <span class="ekoa-label">Evet gecikmesi (ms)</span>
              <input class="ekoa-input" type="number" id="ekoa-set-yesDelay" min="0" step="50">
            </div>
            <div class="ekoa-field" style="grid-column: span 2;">
              <span class="ekoa-label">Döngü arası (ms)</span>
              <input class="ekoa-input" type="number" id="ekoa-set-loopGap" min="0" step="50">
            </div>
          </div>
          <button class="ekoa-btn ekoa-btn-primary" id="ekoa-btn-save-settings">💾 Kaydet</button>
        </div>

        <!-- ══ TAB: LOG ══ -->
        <div id="ekoa-tab-log" class="ekoa-tab-content">
          <div id="ekoa-log"></div>
          <button class="ekoa-btn ekoa-btn-ghost" id="ekoa-btn-clear-log">Logu Temizle</button>
        </div>

        <!-- ══ TAB: HELP ══ -->
        <div id="ekoa-tab-help" class="ekoa-tab-content">
          <div class="ekoa-help">

            <div class="ekoa-help-section">
              <div class="ekoa-help-title">📊 Not Tabanlı Mod</div>
              <ol class="ekoa-help-steps">
                <li>Sayfada <b>sınıf</b> ve <b>dersi</b> seç, ardından <b>Listele</b>'ye bas.</li>
                <li><b>Notları Getir</b>'e tıkla — arka planda not sayfası açılır, notlar çekilir ve kapanır.</li>
                <li>Yüklenen öğrenci listesini inceleyip gerekirse notu veya atla (⊘) durumunu düzenle.</li>
                <li><b>Not Tabanlı</b> modunu seç.</li>
                <li><b>Başlat</b>'a bas — her öğrenci notu oranında seçenekler işaretlenir, kaydedilir.</li>
              </ol>
              <div class="ekoa-help-note">Not → Seviye: 85+ = 5, 70–84 = 4, 50–69 = 3, 25–49 = 2, &lt;25 = 1</div>
            </div>

            <div class="ekoa-help-section">
              <div class="ekoa-help-title">✏️ Manuel Mod</div>
              <ol class="ekoa-help-steps">
                <li><b>Manuel</b> modunu seç.</li>
                <li>İşaretleme yöntemini belirle:<br>
                  — <b>Rastgele:</b> her soruda 1–5 arası rastgele<br>
                  — <b>Sabit:</b> her soru için hep aynı değer<br>
                  — <b>Aralık:</b> belirlediğin min–max arası rastgele
                </li>
                <li><b>Başlat</b>'a bas.</li>
              </ol>
            </div>

            <div class="ekoa-help-section">
              <div class="ekoa-help-title">🧹 Hepsini Temizle</div>
              <ol class="ekoa-help-steps">
                <li>Butona bir kez bas — onay istenir.</li>
                <li>3 saniye içinde tekrar bas — tüm öğrencilerin cevapları silinir.</li>
              </ol>
            </div>

            <div class="ekoa-help-section">
              <div class="ekoa-help-title">⚙️ Önce Temizle Seçeneği</div>
              <div class="ekoa-help-note" style="margin-top:4px;">Doldurma işlemi başlamadan önce mevcut cevapları temizleme yöntemi:<br>
                <b>Butonlar:</b> sayfadaki "Temizle" butonlarını tıklar<br>
                <b>Seçimi Kaldır:</b> radio butonları uncheck eder<br>
                <b>Temizleme:</b> mevcut duruma dokunmaz
              </div>
            </div>

            <div class="ekoa-help-section">
              <div class="ekoa-help-title">⏱ Hız Ayarları</div>
              <div class="ekoa-help-note" style="margin-top:4px;">
                İnternet/sayfa yavaşsa değerleri artır, hızlıysa azalt.<br>
                Önerilen: açılış 1200ms, işlem 800ms, kayıt 1000ms.
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  `;

  // ────────────────────────────────────────────────────────────
  // Mount panel with Shadow DOM
  // ────────────────────────────────────────────────────────────
  const host = document.createElement("div");
  host.id = "ekoa-panel-host";
  Object.assign(host.style, {
    position: "fixed",
    bottom:   "24px",
    right:    "24px",
    zIndex:   "2147483647",
  });
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = PANEL_HTML;

  const $ = (id) => shadow.getElementById(id);

  // ────────────────────────────────────────────────────────────
  // State
  // ────────────────────────────────────────────────────────────
  let settings    = { ...DEFAULT_SETTINGS };
  let grades      = [];   // [{no, name, score, skip}]
  let stopRequested = false;
  let isRunning     = false;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ────────────────────────────────────────────────────────────
  // Storage helpers
  // ────────────────────────────────────────────────────────────
  async function loadSettings() {
    const res = await chrome.storage.local.get(STORAGE.settings);
    settings = Object.assign({}, DEFAULT_SETTINGS, res[STORAGE.settings] || {});
  }

  async function saveSettings() {
    await chrome.storage.local.set({ [STORAGE.settings]: settings });
  }

  async function loadGrades() {
    const res = await chrome.storage.local.get([STORAGE.grades, STORAGE.grades_ts]);
    grades = res[STORAGE.grades] ?? [];
    return { grades, ts: res[STORAGE.grades_ts] ?? null };
  }

  // ────────────────────────────────────────────────────────────
  // Log
  // ────────────────────────────────────────────────────────────
  function log(msg, level = "info") {
    const logEl = $("ekoa-log");
    if (!logEl) return;
    const div = document.createElement("div");
    div.className = `ekoa-log-${level}`;
    const t = new Date().toLocaleTimeString("tr-TR");
    div.textContent = `[${t}] ${msg}`;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
    while (logEl.children.length > 200) logEl.removeChild(logEl.firstChild);
  }

  // ────────────────────────────────────────────────────────────
  // UI helpers
  // ────────────────────────────────────────────────────────────
  function setProgress(done, total) {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    $("ekoa-progress-inner").style.width = `${pct}%`;
    $("ekoa-progress-text").textContent = total > 0 ? `${done} / ${total}` : "—";
  }

  function setRunning(val) {
    isRunning = val;
    $("ekoa-btn-run").disabled  = val;
    $("ekoa-btn-stop").disabled = !val;
    $("ekoa-btn-clear-all").disabled = val;
    $("ekoa-btn-fetch").disabled = val;
  }

  function setGradeBar(text, state = "normal") {
    const bar = $("ekoa-grade-bar");
    bar.className = "";
    if (state === "ok")   bar.classList.add("ok");
    if (state === "err")  bar.classList.add("err");
    if (state === "busy") bar.classList.add("busy");
    $("ekoa-grade-status").textContent = text;
  }

  function setRowColor(btn, color) {
    const tr = btn?.closest("tr");
    if (!tr) return;
    const colors = { yellow: "#fffbeb", green: "#f0fdf4", red: "#fef2f2", gray: "#f8fafc", "": "" };
    tr.style.setProperty("background-color", colors[color] ?? "", "important");
    [...tr.children].forEach((td) =>
      td.style.setProperty("background-color", colors[color] ?? "", "important")
    );
  }

  // ────────────────────────────────────────────────────────────
  // Grade table render
  // ────────────────────────────────────────────────────────────
  function renderGradeTable() {
    const tbody = $("ekoa-grade-tbody");
    tbody.innerHTML = "";
    grades.forEach((g, i) => {
      const tr = document.createElement("tr");
      if (g.skip) tr.classList.add("ekoa-skipped");
      tr.innerHTML = `
        <td>${g.no}</td>
        <td style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${g.name}">${g.name}</td>
        <td><input type="number" class="ekoa-score-input" data-i="${i}" min="1" max="100" value="${g.score ?? ""}"></td>
        <td><button class="ekoa-skip-btn" data-i="${i}" title="${g.skip ? "Dahil et" : "Atla"}">⊘</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".ekoa-score-input").forEach((inp) => {
      inp.addEventListener("change", (e) => {
        const idx = parseInt(e.target.dataset.i);
        grades[idx].score = parseInt(e.target.value) || null;
        grades[idx].skip  = !grades[idx].score;
      });
    });

    tbody.querySelectorAll(".ekoa-skip-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.i);
        grades[idx].skip = !grades[idx].skip;
        e.target.closest("tr").classList.toggle("ekoa-skipped", grades[idx].skip);
        e.target.title = grades[idx].skip ? "Dahil et" : "Atla";
      });
    });
  }

  function updateGradeStatus() {
    if (grades.length === 0) {
      setGradeBar("Not yüklenmedi — 'Notları Getir'e basın", "normal");
    } else {
      setGradeBar(`${grades.length} öğrenci yüklendi`, "ok");
    }
  }

  // ────────────────────────────────────────────────────────────
  // Settings UI
  // ────────────────────────────────────────────────────────────
  function renderSettings() {
    $("ekoa-set-openWait").value  = settings.openWait;
    $("ekoa-set-actionWait").value = settings.actionWait;
    $("ekoa-set-saveWait").value  = settings.saveWait;
    $("ekoa-set-yesDelay").value  = settings.yesDelay;
    $("ekoa-set-loopGap").value   = settings.loopGap;
  }

  function readSettings() {
    settings.openWait   = parseInt($("ekoa-set-openWait").value)  || DEFAULT_SETTINGS.openWait;
    settings.actionWait = parseInt($("ekoa-set-actionWait").value) || DEFAULT_SETTINGS.actionWait;
    settings.saveWait   = parseInt($("ekoa-set-saveWait").value)  || DEFAULT_SETTINGS.saveWait;
    settings.yesDelay   = parseInt($("ekoa-set-yesDelay").value)  || DEFAULT_SETTINGS.yesDelay;
    settings.loopGap    = parseInt($("ekoa-set-loopGap").value)   || DEFAULT_SETTINGS.loopGap;
  }

  function renderFillUI() {
    const mode = settings.fillMode;
    $("ekoa-label-grade").classList.toggle("selected",  mode === "grade");
    $("ekoa-label-manual").classList.toggle("selected", mode === "manual");
    shadow.querySelector(`input[name="ekoa-fill-mode"][value="${mode}"]`).checked = true;
    $("ekoa-grade-opts").classList.toggle("hidden",  mode !== "grade");
    $("ekoa-manual-opts").classList.toggle("hidden", mode !== "manual");

    const mm = $("ekoa-manual-mode").value;
    $("ekoa-fixed-row").classList.toggle("hidden", mm !== "fixed");
    $("ekoa-range-row").classList.toggle("hidden", mm !== "rand_range");
  }

  // ────────────────────────────────────────────────────────────
  // DOM interaction helpers
  // ────────────────────────────────────────────────────────────
  function getStudentButtons() {
    const byId = [...document.querySelectorAll('[id^="btnOpen_"]')];
    if (byId.length > 0) return byId;
    // Fallback: first button in each table row
    const table = document.getElementById("tbPageDataTable");
    if (table) {
      return [...table.querySelectorAll("tbody tr")]
        .map((tr) => tr.querySelector('input[type="button"], button'))
        .filter(Boolean);
    }
    return [];
  }

  function getRadioGroups() {
    const groups = new Map();
    document.querySelectorAll('input[type="radio"]').forEach((r) => {
      if (!r.name) return;
      if (!groups.has(r.name)) groups.set(r.name, []);
      groups.get(r.name).push(r);
    });
    return groups;
  }

  function fillByScore(score) {
    // score is 1–100+ (raw grade); map to 1–5 radio options
    // Mapping: <25→1, 25-49→2, 50-69→3, 70-84→4, 85+→5
    let level;
    if (score >= 85)      level = 5;
    else if (score >= 70) level = 4;
    else if (score >= 50) level = 3;
    else if (score >= 25) level = 2;
    else                  level = 1;

    const groups = getRadioGroups();
    groups.forEach((radios) => {
      if (radios.length === 0) return;
      const idx = Math.min(radios.length - 1, Math.max(0, level - 1));
      radios[idx].checked = true;
      radios[idx].dispatchEvent(new Event("change", { bubbles: true }));
    });
    return groups.size;
  }

  function fillManual(mode, fixedVal, randMin, randMax) {
    const groups = getRadioGroups();
    groups.forEach((radios) => {
      if (radios.length === 0) return;
      let idx;
      if (mode === "random_all") {
        idx = Math.floor(Math.random() * radios.length);
      } else if (mode === "fixed") {
        idx = Math.max(0, Math.min(radios.length - 1, fixedVal - 1));
      } else { // rand_range
        const lo = Math.max(0, Math.min(randMin - 1, radios.length - 1));
        const hi = Math.max(lo, Math.min(randMax - 1, radios.length - 1));
        idx = lo + Math.floor(Math.random() * (hi - lo + 1));
      }
      radios[idx].checked = true;
      radios[idx].dispatchEvent(new Event("change", { bubbles: true }));
    });
    return groups.size;
  }

  function applyClear(mode) {
    if (mode === "buttons") {
      [...document.querySelectorAll('button, input[type="button"], input[type="submit"]')]
        .filter((b) => (b.textContent || b.value || "").toLowerCase().includes("temizle"))
        .forEach((b) => b.click());
    } else if (mode === "uncheck") {
      document.querySelectorAll('input[type="radio"]').forEach((r) => {
        if (r.checked) {
          r.checked = false;
          r.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    }
  }

  async function clickSave() {
    const candidates = [
      document.getElementById("IOMToolbarActive1_btnKaydet"),
      document.getElementById("OOMToolbarActive1_btnKaydet"),
      ...[...document.querySelectorAll('input[type="button"], input[type="submit"], button')]
        .filter((b) => (b.value || b.textContent || "").toLowerCase().trim() === "kaydet"),
    ];
    for (const btn of candidates) {
      if (btn) { btn.click(); return true; }
    }
    return false;
  }

  async function clickConfirm() {
    // Try modal button first
    const modal = document.getElementById("modalConfirmBoxBtn1");
    if (modal && modal.offsetParent !== null) { modal.click(); return true; }

    // Text search for visible "evet"
    const all = [...document.querySelectorAll('input[type="button"], input[type="submit"], button')];
    for (const btn of all) {
      const txt = (btn.value || btn.textContent || "").toLowerCase().trim();
      if (txt === "evet" && btn.offsetParent !== null) { btn.click(); return true; }
    }
    return false;
  }

  function findGradeForRow(btn, index) {
    const tr = btn?.closest("tr");
    if (tr) {
      const cells = tr.querySelectorAll("td");
      // Try each cell as a possible student number
      for (const cell of [cells[2], cells[1], cells[0]]) {
        const no = cell?.textContent?.trim();
        if (no) {
          const match = grades.find((g) => g.no === no);
          if (match) return match;
        }
      }
    }
    return grades[index] ?? null;
  }

  // ────────────────────────────────────────────────────────────
  // Automation loops
  // ────────────────────────────────────────────────────────────
  async function runAutomation(jobType = "fill") {
    if (isRunning) return;

    const buttons = getStudentButtons();
    if (buttons.length === 0) {
      log("Öğrenci butonu bulunamadı!", "error");
      return;
    }

    const fillMode = jobType === "clear" ? null : settings.fillMode;

    if (fillMode === "grade" && grades.length === 0) {
      log("Not tabanlı mod seçili ama not yüklenmedi. Önce 'Notları Getir'e basın.", "error");
      return;
    }

    setRunning(true);
    stopRequested = false;
    setProgress(0, buttons.length);
    log(`Başlatıldı — ${buttons.length} öğrenci, mod: ${jobType === "clear" ? "TEMİZLE" : fillMode}`, "info");

    let success = 0, skipped = 0, errors = 0;

    for (let i = 0; i < buttons.length; i++) {
      if (stopRequested) break;

      const btn = buttons[i];
      setRowColor(btn, "yellow");

      try {
        btn.scrollIntoView({ block: "center", behavior: "smooth" });
        btn.click();
        await sleep(settings.openWait);

        if (stopRequested) break;

        if (jobType === "clear") {
          applyClear(settings.clearMode === "none" ? "buttons" : settings.clearMode);
          log(`Öğrenci ${i + 1}: temizlendi`);
        } else if (fillMode === "grade") {
          const entry = findGradeForRow(btn, i);
          if (!entry || entry.skip || !entry.score) {
            setRowColor(btn, "gray");
            log(`Öğrenci ${i + 1}: atlandı (not yok)`, "warn");
            skipped++;
            await sleep(settings.loopGap);
            continue;
          }
          applyClear(settings.clearMode);
          await sleep(100);
          const filled = fillByScore(entry.score);
          log(`Öğrenci ${i + 1} (${entry.name}): not=${entry.score}, dolduruldu (${filled} grup)`);
        } else {
          // manual
          applyClear(settings.clearMode);
          await sleep(100);
          const mm   = $("ekoa-manual-mode").value;
          const fv   = parseInt($("ekoa-fixed-val").value) || 3;
          const rmin = parseInt($("ekoa-range-min").value) || 3;
          const rmax = parseInt($("ekoa-range-max").value) || 5;
          const filled = fillManual(mm, fv, rmin, rmax);
          log(`Öğrenci ${i + 1}: dolduruldu (${filled} grup, mod=${mm})`);
        }

        await sleep(settings.actionWait);
        if (stopRequested) break;

        const saved = await clickSave();
        if (!saved) {
          setRowColor(btn, "red");
          log(`Öğrenci ${i + 1}: kaydet butonu bulunamadı`, "warn");
          errors++;
          await sleep(settings.loopGap);
          continue;
        }

        await sleep(settings.saveWait);
        await clickConfirm();
        await sleep(settings.yesDelay);

        setRowColor(btn, "green");
        success++;

      } catch (err) {
        setRowColor(btn, "red");
        log(`Öğrenci ${i + 1} hata: ${err.message}`, "error");
        errors++;
      }

      setProgress(i + 1, buttons.length);
      await sleep(settings.loopGap);
    }

    setRunning(false);
    const status = stopRequested ? "DURDURULDU" : "TAMAMLANDI";
    log(`${status} — ✅${success} ⚠️${skipped} ❌${errors}`, stopRequested ? "warn" : "success");
    setProgress(success + skipped + errors, buttons.length);
  }

  // ────────────────────────────────────────────────────────────
  // Grade fetch
  // ────────────────────────────────────────────────────────────
  async function fetchGrades() {
    setGradeBar("Notlar alınıyor…", "busy");
    $("ekoa-btn-fetch").disabled = true;
    log("Not sayfası açılıyor…");

    const responsePromise = new Promise((resolve, reject) => {
      const listener = (msg) => {
        if (msg.type === "NOTIFY_PANEL") {
          chrome.runtime.onMessage.removeListener(listener);
          if (msg.status === "done") resolve(msg.count);
          else reject(new Error(msg.message || "Scrape hatası"));
        }
      };
      chrome.runtime.onMessage.addListener(listener);
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(listener);
        reject(new Error("Zaman aşımı (30 saniye)"));
      }, 30000);
    });

    try {
      await chrome.runtime.sendMessage({ type: "OPEN_SCRAPER_TAB" });
      const count = await responsePromise;
      const { grades: newGrades } = await loadGrades();
      grades = newGrades;
      renderGradeTable();
      updateGradeStatus();
      log(`${count} öğrenci notu yüklendi`, "success");
    } catch (err) {
      setGradeBar(`Hata: ${err.message}`, "err");
      log(`Not alınamadı: ${err.message}`, "error");
    } finally {
      $("ekoa-btn-fetch").disabled = false;
    }
  }

  // ────────────────────────────────────────────────────────────
  // Draggable panel
  // ────────────────────────────────────────────────────────────
  function makeDraggable() {
    const header = $("ekoa-header");
    let dragging = false, ox = 0, oy = 0;

    header.addEventListener("mousedown", (e) => {
      if (e.target.closest(".ekoa-hbtn")) return;
      dragging = true;
      const rect = host.getBoundingClientRect();
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      let x = e.clientX - ox;
      let y = e.clientY - oy;
      x = Math.max(0, Math.min(window.innerWidth  - host.offsetWidth,  x));
      y = Math.max(0, Math.min(window.innerHeight - host.offsetHeight, y));
      host.style.left   = x + "px";
      host.style.top    = y + "px";
      host.style.right  = "auto";
      host.style.bottom = "auto";
    });

    document.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      chrome.storage.local.set({
        [STORAGE.panel_pos]: { left: host.style.left, top: host.style.top },
      });
    });
  }

  async function restorePanelPosition() {
    const res = await chrome.storage.local.get(STORAGE.panel_pos);
    const pos = res[STORAGE.panel_pos];
    if (pos?.left && pos?.top) {
      host.style.left   = pos.left;
      host.style.top    = pos.top;
      host.style.right  = "auto";
      host.style.bottom = "auto";
    }
  }

  // ────────────────────────────────────────────────────────────
  // Minimize toggle
  // ────────────────────────────────────────────────────────────
  function bindMinimize() {
    let minimized = false;
    $("ekoa-minimize").addEventListener("click", () => {
      minimized = !minimized;
      $("ekoa-body").style.display = minimized ? "none" : "flex";
      $("ekoa-minimize").textContent = minimized ? "+" : "−";
    });
  }

  // ────────────────────────────────────────────────────────────
  // Tab switching
  // ────────────────────────────────────────────────────────────
  function bindTabs() {
    shadow.querySelectorAll(".ekoa-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        shadow.querySelectorAll(".ekoa-tab").forEach((t) => t.classList.remove("active"));
        shadow.querySelectorAll(".ekoa-tab-content").forEach((c) => c.classList.remove("active"));
        tab.classList.add("active");
        $(`ekoa-tab-${tab.dataset.tab}`).classList.add("active");
      });
    });
  }

  // ────────────────────────────────────────────────────────────
  // Event bindings
  // ────────────────────────────────────────────────────────────
  function bindEvents() {
    // Mode toggle
    shadow.querySelectorAll('input[name="ekoa-fill-mode"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        settings.fillMode = radio.value;
        renderFillUI();
      });
    });

    // Manual mode dropdown
    $("ekoa-manual-mode").addEventListener("change", () => {
      const mm = $("ekoa-manual-mode").value;
      settings.manualMode = mm;
      $("ekoa-fixed-row").classList.toggle("hidden", mm !== "fixed");
      $("ekoa-range-row").classList.toggle("hidden", mm !== "rand_range");
    });

    // Grade fetch
    $("ekoa-btn-fetch").addEventListener("click", fetchGrades);

    // Start fill
    $("ekoa-btn-run").addEventListener("click", () => runAutomation("fill"));

    // Stop
    $("ekoa-btn-stop").addEventListener("click", () => {
      stopRequested = true;
      log("Durdurma isteği alındı…", "warn");
    });

    // Clear all — two-click confirmation, then runs clear automation
    let clearConfirmTimer = null;
    $("ekoa-btn-clear-all").addEventListener("click", () => {
      const btn = $("ekoa-btn-clear-all");
      if (clearConfirmTimer) {
        clearTimeout(clearConfirmTimer);
        clearConfirmTimer = null;
        btn.textContent = "🧹 Hepsini Temizle";
        btn.classList.remove("ekoa-btn-danger");
        btn.classList.add("ekoa-btn-warning");
        runAutomation("clear");
      } else {
        btn.textContent = "⚠️ Emin misin? Tekrar bas!";
        btn.classList.remove("ekoa-btn-warning");
        btn.classList.add("ekoa-btn-danger");
        clearConfirmTimer = setTimeout(() => {
          clearConfirmTimer = null;
          btn.textContent = "🧹 Hepsini Temizle";
          btn.classList.remove("ekoa-btn-danger");
          btn.classList.add("ekoa-btn-warning");
        }, 3000);
      }
    });

    // Save settings
    $("ekoa-btn-save-settings").addEventListener("click", async () => {
      readSettings();
      await saveSettings();
      log("Ayarlar kaydedildi", "success");
    });

    // Clear log
    $("ekoa-btn-clear-log").addEventListener("click", () => {
      $("ekoa-log").innerHTML = "";
    });

    // Listen for scraper notifications
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "NOTIFY_PANEL") {
        // Handled inside fetchGrades promise — no extra action needed here
      }
    });
  }

  // ────────────────────────────────────────────────────────────
  // Init
  // ────────────────────────────────────────────────────────────
  async function init() {
    await loadSettings();
    const { grades: cachedGrades } = await loadGrades();
    grades = cachedGrades;

    renderSettings();
    renderFillUI();
    $("ekoa-manual-mode").value = settings.manualMode || "random_all";
    $("ekoa-fixed-val").value   = settings.fixedVal  || 3;
    $("ekoa-range-min").value   = settings.randMin   || 3;
    $("ekoa-range-max").value   = settings.randMax   || 5;
    $("ekoa-clear-mode").value  = settings.clearMode || "buttons";

    updateGradeStatus();
    if (grades.length > 0) renderGradeTable();

    bindTabs();
    bindEvents();
    bindMinimize();
    makeDraggable();
    await restorePanelPosition();

    log("Panel hazır", "success");
  }

  init();
})();
