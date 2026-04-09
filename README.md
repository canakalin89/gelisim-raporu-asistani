# 📋 Gelişim Raporu Asistanı

> **e-Okul gelişim raporu formlarını otomatik dolduran Chrome uzantısı.**  
> Not tabanlı veya manuel modda çalışır. Giriş gerektirmez.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-v2.0.1-blue?logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/geli%C5%9Fim-raporu-asistan%C4%B1/ljcjidfmpfnilniagebhccolaidkpogb)

---

## ✨ Özellikler

- 📝 **Not tabanlı mod** — Öğrenci not sayfasından notları okuyarak rapor cümlelerini otomatik seçer
- ✋ **Manuel mod** — Tüm öğrenciler için istediğin ifadeyi tek tıkla doldurur
- 🧹 **Temizle** — Formdaki tüm seçimleri sıfırlar
- 🔐 **Giriş gerektirmez** — Kullanıcı hesabı veya kayıt yok
- ⚡ **e-Okul entegrasyonu** — Doğrudan MEB e-Okul platformunda çalışır

---

## 🚀 Kurulum

### Chrome Web Store (Önerilen)

[Chrome Web Store'dan Ekle →](https://chromewebstore.google.com/detail/geli%C5%9Fim-raporu-asistan%C4%B1/ljcjidfmpfnilniagebhccolaidkpogb)

### Manuel Kurulum (Geliştirici Modu)

1. Bu repoyu klonla veya ZIP olarak indir
2. Chrome'da `chrome://extensions` adresine git
3. Sağ üstten **"Geliştirici modu"**nu aç
4. **"Paketlenmemiş öğe yükle"** butonuna tıkla
5. İndirdiğin klasörü seç

---

## 🛠️ Nasıl Çalışır?

Uzantı iki aşamalı çalışır:

| Adım | Sayfa | Betik | Görev |
|------|-------|-------|-------|
| 1 | Not listesi (`OOK07003` / `IOK10007`) | `content/scraper.js` | Öğrenci notlarını okur ve `storage`'a kaydeder |
| 2 | Gelişim raporu formu (`OOK07015` / `IOK10016`) | `content/panel.js` | Kaydedilen notlara göre formu doldurur |

Popup (`popup/popup.html`) üzerinden mod seçimi ve tetikleme yapılır.

---

## 📁 Proje Yapısı

```
gelisim-raporu-asistani/
├── manifest.json          # Uzantı tanımı (Manifest V3)
├── background.js          # Service worker
├── content/
│   ├── panel.js           # Form doldurma / temizleme
│   └── scraper.js         # Not verisi okuma
├── popup/
│   ├── popup.html         # Uzantı arayüzü
│   └── popup.js           # Popup mantığı
└── icons/                 # Uzantı simgeleri
```

---

## 🏫 Desteklenen Sayfalar

| Kurum | Sayfa |
|-------|-------|
| Ortaöğretim | `e-okul.meb.gov.tr/OrtaOgretim/OKL/OOK07015.aspx` |
| İlköğretim | `e-okul.meb.gov.tr/IlkOgretim/OKL/IOK10016.aspx` |

---

## 👤 Geliştirici

**Can Akalın** — Lise İngilizce Öğretmeni  
[Portfolio](https://canakalin89.github.io/portfolio) · [GitHub](https://github.com/canakalin89)

---

## 📄 Lisans

MIT
