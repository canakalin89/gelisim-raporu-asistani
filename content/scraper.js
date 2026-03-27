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
    await chrome.runtime.sendMessage({ type: "SCRAPER_DONE", grades });
  }

  async function error(message) {
    await chrome.runtime.sendMessage({ type: "SCRAPER_ERROR", message });
  }

  // ── Step 1: Wait for the page to be ready (Select2 class dropdown populated) ──
  try {
    await waitFor(
      () => {
        const el = document.getElementById("select2-cmbSubeler-container");
        return el && (el.getAttribute("title") || "").trim().length > 0;
      },
      15000,
      "Sınıf seçici yüklenemedi"
    );
  } catch (e) {
    // Fallback: wait for any select with options
    await sleep(3000);
  }

  // ── Step 2: Ensure a class is selected ──
  const classContainer = document.getElementById("select2-cmbSubeler-container");
  let classTitle = classContainer?.getAttribute("title")?.trim() ?? "";

  if (!classTitle || classTitle === "Seçiniz") {
    const classSelect = document.getElementById("cmbSubeler");
    if (classSelect && classSelect.options.length > 1) {
      classSelect.selectedIndex = 1;
      classSelect.dispatchEvent(new Event("change", { bubbles: true }));
      await sleep(2000);
      classTitle = document.getElementById("select2-cmbSubeler-container")
        ?.getAttribute("title")?.trim() ?? classSelect.options[1]?.text ?? "";
    }
  }

  // ── Step 3: Ensure a lesson is selected ──
  const lessonContainer = document.getElementById("select2-cmbBeceriler-container");
  let lessonTitle = lessonContainer?.getAttribute("title")?.trim() ?? "";

  if (!lessonTitle || lessonTitle === "Seçiniz") {
    const lessonSelect = document.getElementById("cmbBeceriler");
    if (lessonSelect && lessonSelect.options.length > 1) {
      lessonSelect.selectedIndex = 1;
      lessonSelect.dispatchEvent(new Event("change", { bubbles: true }));
      await sleep(2000);
      lessonTitle = document.getElementById("select2-cmbBeceriler-container")
        ?.getAttribute("title")?.trim() ?? lessonSelect.options[1]?.text ?? "";
    }
  }

  // ── Step 4: Click "Listele" if table is not yet visible ──
  const hasTable = () => {
    const t = document.getElementById("dgListem")
      ?? document.querySelector("table[id*='dgList']");
    return t && t.querySelectorAll("tbody tr").length > 0;
  };

  if (!hasTable()) {
    const listeleBtn = [...document.querySelectorAll("input[type='submit'], button")]
      .find((b) => (b.value || b.textContent || "").toLowerCase().includes("listele"));
    if (listeleBtn) {
      listeleBtn.click();
      await sleep(2000);
    }
  }

  // ── Step 5: Wait for the student table ──
  try {
    await waitFor(hasTable, 15000, "Öğrenci tablosu yüklenemedi");
  } catch (e) {
    await error(e.message);
    return;
  }

  // ── Step 6: Scrape the table ──
  const table = document.getElementById("dgListem")
    ?? document.querySelector("table[id*='dgList']");

  if (!table) {
    await error("Tablo elementi bulunamadı");
    return;
  }

  const rows = [...table.querySelectorAll("tbody tr")];
  const grades = [];

  // Detect header row to find "Puan" column index
  let scoreColIndex = -1;
  const headerRow = table.querySelector("thead tr") ?? rows[0];
  if (headerRow) {
    [...headerRow.querySelectorAll("td, th")].forEach((cell, i) => {
      const txt = (cell.textContent || "").toLowerCase();
      if (txt.includes("puan") || txt.includes("not")) scoreColIndex = i;
    });
  }

  // Parse data rows
  // Typical dgListem layout: [0]=no, [1]=name, [2..]=other cols, last or scoreColIndex=score
  for (const tr of rows) {
    // Skip header rows
    if (tr.querySelector("th")) continue;

    const cells = [...tr.querySelectorAll("td")];
    if (cells.length < 2) continue;

    const no   = cells[0].textContent.trim();
    const name = cells[1].textContent.trim();

    if (!no || isNaN(parseInt(no))) continue; // not a student row

    let score = null;
    if (scoreColIndex >= 0 && cells[scoreColIndex]) {
      const raw = cells[scoreColIndex].textContent.trim().replace(",", ".");
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) score = Math.round(parsed);
    } else {
      // Fallback: last numeric cell
      for (let i = cells.length - 1; i >= 2; i--) {
        const raw = cells[i].textContent.trim().replace(",", ".");
        const parsed = parseFloat(raw);
        if (!isNaN(parsed)) { score = Math.round(parsed); break; }
      }
    }

    grades.push({ no, name, score, skip: score === null || score <= 0 });
  }

  if (grades.length === 0) {
    await error("Tabloda öğrenci bulunamadı. Sınıf/ders seçili olduğundan emin olun.");
    return;
  }

  await done(grades);
})();
