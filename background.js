// E-Okul Rapor Asistanı — Background Service Worker
// Manages the scraper tab lifecycle and relays messages between panel and scraper.

const MSG = {
  OPEN_SCRAPER_TAB: "OPEN_SCRAPER_TAB",
  SCRAPER_DONE:     "SCRAPER_DONE",
  SCRAPER_ERROR:    "SCRAPER_ERROR",
  NOTIFY_PANEL:     "NOTIFY_PANEL",
};

const URLS = {
  orta_grades: "https://e-okul.meb.gov.tr/OrtaOgretim/OKL/OOK07003.aspx",
  ilk_grades:  "https://e-okul.meb.gov.tr/IlkOgretim/OKL/IOK10007.aspx",
};

const STORAGE = {
  grades:    "ekoa_grades",
  grades_ts: "ekoa_grades_ts",
};

// In-memory state (transient — lost if service worker is killed, which is acceptable)
let scraperTabId = null;
let panelTabId   = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {

    case MSG.OPEN_SCRAPER_TAB: {
      panelTabId = sender.tab?.id ?? null;
      const url = sender.tab?.url?.includes("OrtaOgretim")
        ? URLS.orta_grades
        : URLS.ilk_grades;

      chrome.tabs.create({ url, active: false }, (tab) => {
        scraperTabId = tab.id;
        sendResponse({ ok: true });
      });
      return true; // async
    }

    case MSG.SCRAPER_DONE: {
      const grades = msg.grades ?? [];
      chrome.storage.local.set({
        [STORAGE.grades]:    grades,
        [STORAGE.grades_ts]: Date.now(),
      });

      if (panelTabId !== null) {
        chrome.tabs.sendMessage(panelTabId, {
          type:  MSG.NOTIFY_PANEL,
          status: "done",
          count: grades.length,
        }).catch(() => {}); // panel tab may have navigated away
      }

      if (scraperTabId !== null) {
        chrome.tabs.remove(scraperTabId).catch(() => {});
        scraperTabId = null;
      }

      sendResponse({ ok: true });
      break;
    }

    case MSG.SCRAPER_ERROR: {
      if (panelTabId !== null) {
        chrome.tabs.sendMessage(panelTabId, {
          type:    MSG.NOTIFY_PANEL,
          status:  "error",
          message: msg.message ?? "Bilinmeyen hata",
        }).catch(() => {});
      }

      if (scraperTabId !== null) {
        chrome.tabs.remove(scraperTabId).catch(() => {});
        scraperTabId = null;
      }

      sendResponse({ ok: true });
      break;
    }

    default:
      sendResponse({ ok: false });
  }
});
