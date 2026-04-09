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

## 📖 Kullanım Kılavuzu

### Adım 1 — Kurulumu Tamamla

Uzantıyı [Chrome Web Store](https://chromewebstore.google.com/detail/geli%C5%9Fim-raporu-asistan%C4%B1/ljcjidfmpfnilniagebhccolaidkpogb)'dan yükledikten sonra Chrome araç çubuğunda 🧩 simgesine tıkla, uzantıyı sabitle.

---

### Adım 2 — e-Okul'a Giriş Yap

[e-Okul](https://e-okul.meb.gov.tr)'a normal şekilde giriş yap. Uzantı ek bir giriş gerektirmez; e-Okul oturumunu kullanır.

---

### 📊 Not Tabanlı Mod

> Öğrencilerin notlarına göre rapor cümlelerini otomatik seçer.

**1. Not sayfasını aç**

- Ortaöğretim: `Okul Karnesi > Gelişim Raporu > Not Girişi`
- Sayfada **sınıfı** ve **dersi** seç → **Listele**'ye bas

**2. Notları Getir**

- Gelişim raporu formunda uzantı paneli açılır
- **"Notları Getir"** butonuna bas — uzantı arka planda not sayfasını açıp notları çeker ve kapatır

**3. Kontrol Et (isteğe bağlı)**

- Çekilen notları listede görebilirsin
- Yanlış görünen bir notu manuel düzenleyebilirsin
- Bir öğrenciyi atlamak için ⊘ simgesine bas

**4. Başlat**

- **"Not Tabanlı"** modunu seç → **"Başlat"**'a bas
- Form tüm öğrenciler için otomatik dolar

**Not → Seviye Dönüşümü:**

| Puan | Seviye |
|------|--------|
| 85 ve üzeri | 5 — Çok İyi |
| 70 – 84 | 4 — İyi |
| 50 – 69 | 3 — Orta |
| 25 – 49 | 2 — Geliştirilmeli |
| 25'in altı | 1 — Yetersiz |

---

### ✏️ Manuel Mod

> Tüm öğrencilere aynı değeri ya da belirli bir aralığı atamak için kullanılır.

1. Gelişim raporu formunu aç
2. **"Manuel"** modunu seç
3. Yöntemi belirle:
   - **Sabit değer** — tüm öğrencilere aynı seviye
   - **Rastgele** — belirtilen aralıkta rastgele seviye
   - **Aralık** — alt/üst sınır girerek dağıtım yap
4. **"Başlat"**'a bas

---

### 🧹 Formu Temizleme

Doldurulmuş formu sıfırlamak için:

1. Panelde **"Hepsini Temizle"** butonuna bas
2. Buton rengi değişir ve onay ister
3. **3 saniye içinde tekrar bas** — tüm seçimler kaldırılır

---

### ⚙️ Hız Ayarları

İnternet bağlantın yavaşsa işlemler hata verebilir. Paneldeki gecikme değerlerini artır:

| Ayar | Önerilen |
|------|----------|
| Açılış gecikmesi | 1200 ms |
| İşlem gecikmesi | 800 ms |
| Kayıt gecikmesi | 1000 ms |

---

### 🗑 Önbelleği Temizleme

Uzantı popup'ında **"Saklanan Notları Sil"** butonu önbellekteki not verisini siler. Farklı bir sınıf için yeni not çekimi yapmadan önce önbelleği temizlemek iyi bir alışkanlıktır.

---

## 👤 Geliştirici

**Can Akalın** — Lise İngilizce Öğretmeni  
[Portfolio](https://canakalin89.github.io/portfolio) · [GitHub](https://github.com/canakalin89)

---

## 📄 Lisans

MIT
