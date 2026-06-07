// E-Okul Rapor Asistanı — Scraper
// Runs in the background grade tab. Scrapes student grades and reports back.

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

  // ── Step 1: Wait for the page to be ready (Select2 class dropdown populated) ──
  try {
    await waitFor(
      () => {
        const el = document.getElementById("select2-cmbSubeler-container") 
                  || document.getElementById("cmbSubeler");
        return el && (el.getAttribute("title") || el.value || "").trim().length > 0;
      },
      15000,
      "Sınıf seçici yüklenemedi. Lütfen internet bağlantınızı kontrol edin."
    );
  } catch (e) {
    console.warn("[EKoa Scraper] Select2 wait failed, waiting extra 3s...");
    await sleep(3000);
  }

  // ── Step 2: Ensure a class and lesson are selected ──
  // E-Okul often remembers the last selection. If not, we try to pick the first valid one.
  const selections = [
    { id: "cmbSubeler", containerId: "select2-cmbSubeler-container" },
    { id: "cmbBeceriler", containerId: "select2-cmbBeceriler-container" },
    { id: "cmbDersler", containerId: "select2-cmbDersler-container" } // Some pages use cmbDersler
  ];

  for (const sel of selections) {
    const el = document.getElementById(sel.id);
    const container = document.getElementById(sel.containerId);
    const title = container?.getAttribute("title")?.trim() || el?.value || "";

    if (el && (!title || title === "Seçiniz" || title === "0")) {
      if (el.options.length > 1) {
        el.selectedIndex = 1;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        await sleep(1500);
      }
    }
  }

  // ── Step 3: Click "Listele" if table is not yet visible ──
  const getTable = () => {
    return document.getElementById("dgListem")
      ?? document.querySelector("table[id*='dgList']")
      ?? document.querySelector(".dgListem")
      ?? document.querySelector("table.GridView");
  };

  const hasTableData = () => {
    const t = getTable();
    return t && t.querySelectorAll("tr").length > 1; // At least header + 1 row
  };

  if (!hasTableData()) {
    const listeleBtn = [...document.querySelectorAll("input[type='submit'], button, a")]
      .find((b) => {
        const txt = (b.value || b.textContent || b.title || "").toLowerCase();
        return txt.includes("listele") || txt.includes("sorgula");
      });
    
    if (listeleBtn) {
      console.log("[EKoa Scraper] Clicking Listele...");
      listeleBtn.click();
      await sleep(3000);
    }
  }

  // ── Step 4: Wait for the student table ──
  try {
    await waitFor(hasTableData, 20000, "Öğrenci tablosu yüklenemedi. Sınıf ve ders seçili olduğundan emin olun.");
  } catch (e) {
    await error(e.message);
    return;
  }

  // ── Step 5: Scrape the table ──
  const table = getTable();
  if (!table) {
    await error("Tablo elementi bulunamadı.");
    return;
  }

  const rows = [...table.querySelectorAll("tr")];
  const grades = [];

  let scoreColIndex = -1;
  let noColIndex = -1;
  let nameColIndex = -1;

  // Scan every row until a cell matching the predicate is found.
  // Colspan values are accumulated so the returned index maps directly
  // onto data-row cell indices — this handles e-okul's two-row header
  // where "1.Sınav" spans 4 columns (Y, D, K, Ort.) in the sub-header.
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

  scoreColIndex = findColByText(rows, txt => txt === "puanı" || txt === "puan");
  if (scoreColIndex === -1)
    scoreColIndex = findColByText(rows, txt => txt.includes("puan") || txt.includes("başarı"));

  noColIndex   = findColByText(rows, txt => txt === "okul no" || txt === "öğrenci no" || txt === "numara" || txt === "no");
  nameColIndex = findColByText(rows, txt => txt === "adı soyadı" || txt === "ad soyad" || txt.includes("adı soyadı"));

  if (noColIndex   === -1) noColIndex   = 0;
  if (nameColIndex === -1) nameColIndex = 1;

  console.log(`[EKoa Scraper] Column detection: No=${noColIndex}, Name=${nameColIndex}, Score=${scoreColIndex}`);

  // Parse data rows
  for (const tr of rows) {
    // Skip rows that look like headers or footers
    if (tr.querySelector("th") || tr.innerText.includes("Toplam") || tr.innerText.includes("Sayfa")) continue;

    const cells = [...tr.querySelectorAll("td")];
    if (cells.length < 2) continue;

    const no   = cells[noColIndex]?.textContent.trim();
    const name = cells[nameColIndex]?.textContent.trim();

    // Student number validation (must be numeric and not too short/long usually)
    if (!no || isNaN(parseInt(no)) || no.length < 1) continue; 

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

    // Double check: if name looks like a number or is empty, it's probably not a student row
    if (!name || !isNaN(parseInt(name.replace(/\s/g, "")))) continue;

    grades.push({ 
      no, 
      name, 
      score, 
      skip: score === null || score < 0 
    });
  }

  if (grades.length === 0) {
    await error("Tabloda öğrenci bulunamadı. Lütfen doğru sayfada (Not Girişi) olduğunuzdan emin olun.");
    return;
  }

  console.log(`[EKoa Scraper] Successfully scraped ${grades.length} students.`);
  await done(grades);
})();
