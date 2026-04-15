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

  // Detect column indices based on headers
  let scoreColIndex = -1;
  let noColIndex = -1;
  let nameColIndex = -1;

  const headerRows = rows.filter(r => r.querySelector("th") || r.classList.contains("header") || r.classList.contains("GridViewHeader") || r.style.fontWeight === "bold");
  const headerRow = headerRows[headerRows.length - 1] || rows[0]; // Use last header row if multiple

  if (headerRow) {
    const cells = [...headerRow.querySelectorAll("td, th")];
    const headerTexts = cells.map(c => (c.textContent || "").toLowerCase().trim());
    console.log("[EKoa Scraper] Found headers:", headerTexts);

    headerTexts.forEach((txt, i) => {
      // 1. Student Number
      if (txt.includes("no") || txt.includes("numara")) {
        noColIndex = i;
      }
      // 2. Student Name
      if (txt.includes("ad") || txt.includes("soyad") || txt.includes("öğrenci")) {
        nameColIndex = i;
      }
      
      // 3. Score Column (Puanı)
      // We look for "puan", "not", "ort.", "başarı"
      // If we find multiple, we prefer:
      // - Match for "puanı"
      // - Match for "puan"
      // - The last one found (usually the average or latest exam)
      if (txt.includes("puan") || txt.includes("not") || txt.includes("ort") || txt.includes("başarı")) {
        const isBetterMatch = (
          scoreColIndex === -1 || 
          txt.includes("puanı") || 
          txt === "puan" ||
          (!headerTexts[scoreColIndex].includes("puanı") && headerTexts[scoreColIndex] !== "puan")
        );
        
        if (isBetterMatch) {
          scoreColIndex = i;
        }
      }
    });
  }

  // Defaults if detection failed
  if (noColIndex === -1) noColIndex = 0;
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

    let score = null;
    if (scoreColIndex >= 0 && cells[scoreColIndex]) {
      const raw = cells[scoreColIndex].textContent.trim().replace(",", ".");
      // Use regex to find the first number (integer or float) in the cell
      // This handles cases like "85,00" or "85 (Geçti)"
      const match = raw.match(/(\d+(\.\d+)?)/);
      if (match) {
        const parsed = parseFloat(match[1]);
        if (!isNaN(parsed)) score = Math.round(parsed);
      }
    }
    
    // Fallback: if score still null, try searching all cells after name for a valid numeric score
    if (score === null) {
      for (let i = nameColIndex + 1; i < cells.length; i++) {
        const raw = cells[i].textContent.trim().replace(",", ".");
        const match = raw.match(/(\d+(\.\d+)?)/);
        if (match) {
          const val = parseFloat(match[1]);
          if (!isNaN(val) && val >= 0 && val <= 100) {
            score = Math.round(val);
            break;
          }
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
