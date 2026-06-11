// E-Okul Rapor Asistanı — Scraper v2.2.0
// Runs in the background grade tab. Scrapes student grades and reports back.
// Generic auto-detection: works on both Ortaöğretim (OOK07003) and İlköğretim (IOK10007) pages
// without relying on hardcoded element IDs.

(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function waitFor(conditionFn, timeout = 12000, errorMsg = "Zaman aşımı") {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const iv = setInterval(() => {
        if (conditionFn()) {
          clearInterval(iv);
          resolve(true);
        } else if (Date.now() - start > timeout) {
          clearInterval(iv);
          reject(new Error(errorMsg));
        }
      }, 250);
    });
  }

  async function done(grades) {
    console.log("[EKoa Scraper] Scraping complete, sending data:", grades.length);
    await chrome.runtime.sendMessage({ type: "SCRAPER_DONE", grades });
  }

  async function error(message) {
    console.error("[EKoa Scraper] Error:", message);
    await chrome.runtime.sendMessage({ type: "SCRAPER_ERROR", message });
  }

  // ── Step 1: Wait for page to have at least one <select> element with options ──
  try {
    await waitFor(
      () => [...document.querySelectorAll("select")].some(s => s.options.length > 1),
      15000,
      "Sayfa yüklenemedi. Lütfen internet bağlantınızı kontrol edin."
    );
  } catch (e) {
    console.warn("[EKoa Scraper] Page wait failed, trying anyway...");
    // Continue — page may still have loaded even if our condition timed out
  }
  // Extra wait for Select2 and cascading dropdowns to initialize
  await sleep(1500);

  // ── Step 2: Auto-select all unselected dropdowns ──
  // Finds every <select> on the page. If it shows "Seçiniz" or has no value,
  // picks the first real option and fires a change event so dependent dropdowns cascade.
  const getSelects = () => [...document.querySelectorAll("select")].filter(s => s.options.length > 1);

  for (const sel of getSelects()) {
    const selectedText = (sel.options[sel.selectedIndex]?.text || "").trim();
    const isEmpty = !sel.value || sel.value === "0" || sel.value === ""
      || selectedText.includes("Seçiniz") || selectedText.includes("Seçin")
      || selectedText === "-";

    if (isEmpty) {
      console.log(`[EKoa Scraper] Auto-selecting dropdown: ${sel.id || sel.name || "(no id)"}`);
      sel.selectedIndex = 1;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      await sleep(1500); // wait for cascade
    }
  }

  // ── Step 3: Click "Listele" if table is not yet visible ──
  const getTable = () =>
    document.getElementById("dgListem")
    ?? document.querySelector("table[id*='dgList']")
    ?? document.querySelector("table[id*='dgOgrenci']")
    ?? document.querySelector("table[id*='GridView']")
    ?? document.querySelector(".dgListem")
    ?? document.querySelector("table.GridView")
    ?? document.querySelector("table.grid");

  const hasTableData = () => {
    const t = getTable();
    return t && t.querySelectorAll("tr").length > 1;
  };

  if (!hasTableData()) {
    const listeleBtn = [...document.querySelectorAll("input[type='submit'], button, a")]
      .find((b) => {
        const txt = (b.value || b.textContent || b.title || "").toLowerCase().trim();
        return txt.includes("listele") || txt.includes("sorgula") || txt === "ara";
      });

    if (listeleBtn) {
      console.log("[EKoa Scraper] Clicking Listele...");
      listeleBtn.click();
      await sleep(3000);
    }
  }

  // ── Step 4: Wait for the student table ──
  try {
    await waitFor(hasTableData, 20000, "Öğrenci listesi yüklenemedi. Muhtemel sebepler: sınıf veya ders seçili değil, 'Listele' butonuna basılmadı, ya da internet bağlantısı yavaş. Not girişi sayfasında sınıf ve dersi seçip 'Listele'ye bastıktan sonra tekrar deneyin.");
  } catch (e) {
    await error(e.message);
    return;
  }

  // ── Step 5: Scrape the table ──
  const table = getTable();
  if (!table) {
    await error("Not tablosu sayfada bulunamadı. Sayfanın tam yüklendiğinden emin olun ve 'Notları Getir'e tekrar basın. Sorun devam ederse sayfayı yenileyip tekrar deneyin.");
    return;
  }

  const rows = [...table.querySelectorAll("tr")];
  const grades = [];

  // Scan every row until a cell matching the predicate is found.
  // Colspan values are accumulated so the returned index maps directly
  // onto data-row cell indices — handles e-okul's two-row header structure.
  function findColByText(tableRows, matchFn) {
    for (const row of tableRows) {
      let col = 0;
      for (const cell of row.querySelectorAll("td, th")) {
        const txt = (cell.textContent || "").trim().toLowerCase().replace(/\s+/g, " ");
        const span = parseInt(cell.getAttribute("colspan") || "1");
        if (matchFn(txt)) return col;
        col += span;
      }
    }
    return -1;
  }

  let noColIndex   = findColByText(rows, txt => txt === "okul no" || txt === "öğrenci no" || txt === "numara" || txt === "no");
  let nameColIndex = findColByText(rows, txt => txt === "adı soyadı" || txt === "ad soyad" || txt.includes("adı soyadı"));

  if (noColIndex   === -1) noColIndex   = 0;
  if (nameColIndex === -1) nameColIndex = 1;

  console.log(`[EKoa Scraper] Column detection: No=${noColIndex}, Name=${nameColIndex}`);

  for (const tr of rows) {
    if (tr.querySelector("th") || (tr.innerText || "").includes("Toplam") || (tr.innerText || "").includes("Sayfa")) continue;

    const cells = [...tr.querySelectorAll("td")];
    if (cells.length < 2) continue;

    const no   = cells[noColIndex]?.textContent.trim();
    const name = cells[nameColIndex]?.textContent.trim();

    if (!no || isNaN(parseInt(no)) || no.length < 1) continue;
    if (!name || !isNaN(parseInt(name.replace(/\s/g, "")))) continue;

    // Puanı is always the rightmost numeric column — scan right-to-left.
    let score = null;
    for (let i = cells.length - 1; i > nameColIndex; i--) {
      const raw = (cells[i].textContent || "").trim().replace(",", ".");
      const match = raw.match(/^(\d+(?:\.\d+)?)$/);
      if (match) {
        const val = parseFloat(match[1]);
        if (!isNaN(val) && val >= 0 && val <= 100) {
          score = Math.round(val);
          break;
        }
      }
    }

    grades.push({
      no,
      name,
      score,
      skip: score === null || score < 0,
    });
  }

  if (grades.length === 0) {
    await error("Not sayfasında öğrenci bulunamadı. Muhtemel sebepler: yanlış sayfa açıldı (not girişi sayfasında değilsiniz), sınıf veya ders seçilmedi, ya da tabloda henüz öğrenci yok. Not girişi sayfasında sınıf ve ders seçip 'Listele'ye bastıktan sonra tekrar deneyin.");
    return;
  }

  console.log(`[EKoa Scraper] Successfully scraped ${grades.length} students.`);
  await done(grades);
})();
