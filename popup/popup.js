const STORAGE = {
  grades:    "ekoa_grades",
  grades_ts: "ekoa_grades_ts",
};

async function load() {
  const res = await chrome.storage.local.get([STORAGE.grades, STORAGE.grades_ts]);
  const grades = res[STORAGE.grades] ?? [];
  const ts     = res[STORAGE.grades_ts] ?? null;

  const countEl = document.getElementById("grade-count");
  const tsEl    = document.getElementById("grade-ts");

  if (grades.length > 0) {
    countEl.textContent = `${grades.length} öğrenci`;
    countEl.classList.remove("empty");
  } else {
    countEl.textContent = "Yok";
    countEl.classList.add("empty");
  }

  if (ts) {
    tsEl.textContent = new Date(ts).toLocaleString("tr-TR");
    tsEl.classList.remove("empty");
  } else {
    tsEl.textContent = "—";
    tsEl.classList.add("empty");
  }
}

// Two-step confirmation (confirm() is blocked in extension popups)
let clearTimer = null;
const clearBtn = document.getElementById("btn-clear");
clearBtn.addEventListener("click", async () => {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
    clearBtn.textContent = "🗑 Saklanan Notları Sil";
    clearBtn.style.background = "";
    await chrome.storage.local.remove([STORAGE.grades, STORAGE.grades_ts]);
    await load();
  } else {
    clearBtn.textContent = "⚠️ Emin misin? Tekrar bas!";
    clearBtn.style.background = "#fef2f2";
    clearTimer = setTimeout(() => {
      clearTimer = null;
      clearBtn.textContent = "🗑 Saklanan Notları Sil";
      clearBtn.style.background = "";
    }, 3000);
  }
});

// Tab switching
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
  });
});

load();
