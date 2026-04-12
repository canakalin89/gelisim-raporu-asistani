# 📋 Gelişim Raporu Asistanı

> E-Okul gelişim raporu formlarını otomatik dolduran, not tabanlı veya manuel çalışabilen ücretsiz bir Chrome eklentisi.  
> **Giriş gerektirmez · Tamamen yerel · Hiçbir veri dışarı gönderilmez.**

---

## 🔗 Hızlı Erişim

| | Bağlantı |
|---|---|
| 🧩 **Chrome Web Mağazası** | [Eklentiyi İndir](https://chromewebstore.google.com/detail/geli%C5%9Fim-raporu-asistan%C4%B1/ljcjidfmpfnilniagebhccolaidkpogb?authuser=0&hl=tr) |
| 🎬 **Tanıtım Videosu** | [YouTube'da İzle](https://www.youtube.com/watch?v=XK_5AS_5VDw) |
| 🌐 **Web Sitesi** | [canhoca.netlify.app](https://canhoca.netlify.app) |

---

## 📌 Nedir?

**Gelişim Raporu Asistanı**, Millî Eğitim Bakanlığı'nın E-Okul sistemi üzerindeki gelişim raporu formlarını hızlı ve hatasız doldurmak için tasarlanmış bir Chrome tarayıcı eklentisidir.

Desteklenen sayfalar:
- **Ortaöğretim** → `e-okul.meb.gov.tr/OrtaOgretim/OKL/OOK07015.aspx`
- **İlköğretim** → `e-okul.meb.gov.tr/IlkOgretim/OKL/IOK10016.aspx`

---

## ✨ Özellikler

| Özellik | Açıklama |
|---|---|
| 📊 **Not Tabanlı Mod** | E-Okul'dan öğrenci notlarını otomatik çeker; nota göre seviye atar |
| ✏️ **Manuel Mod** | Rastgele, sabit değer veya aralık yöntemiyle formu doldurur |
| 🧹 **Toplu Temizleme** | Tüm rapor cevaplarını tek tıkla siler (çift onay mekanizmalı) |
| 🔒 **Gizlilik** | Hiçbir sunucuya veri göndermez; her şey tarayıcıda yerel olarak çalışır |
| ⚡ **Hız Ayarları** | Açılış, işlem ve kayıt gecikmelerini özelleştirebilirsiniz |
| 🔁 **Önbellek** | Çekilen notlar yerel depoya kaydedilir; tekrar tekrar çekme gerekmez |

---

## 🎬 Nasıl Çalışır?

Eklentinin kullanımını adım adım anlatan tanıtım videosunu izleyebilirsiniz:

[![Gelişim Raporu Asistanı Tanıtım Videosu](https://img.youtube.com/vi/XK_5AS_5VDw/maxresdefault.jpg)](https://www.youtube.com/watch?v=XK_5AS_5VDw)

---

## 🚀 Kurulum

1. [Chrome Web Mağazası](https://chromewebstore.google.com/detail/geli%C5%9Fim-raporu-asistan%C4%B1/ljcjidfmpfnilniagebhccolaidkpogb?authuser=0&hl=tr) sayfasına gidin.
2. **"Chrome'a Ekle"** butonuna tıklayın.
3. İzinleri onaylayın.
4. E-Okul gelişim raporu sayfasını açın — eklenti otomatik olarak devreye girer.

---

## 📖 Kullanım Kılavuzu

### 📊 Not Tabanlı Mod

1. E-Okul'da **sınıf** ve **ders** seçin, **"Listele"** butonuna basın.
2. Eklenti panelinde **"Notları Getir"** butonuna tıklayın — notlar otomatik olarak çekilir.
3. Gerekirse listede **not** veya **atla (⊘)** durumunu düzenleyin.
4. **"Not Tabanlı"** modunu seçip **"Başlat"** butonuna basın.

> **Not → Seviye dönüşüm tablosu:**
> 
> | Puan | Seviye |
> |------|--------|
> | 85 ve üzeri | 5 |
> | 70 – 84 | 4 |
> | 50 – 69 | 3 |
> | 25 – 49 | 2 |
> | 25'in altı | 1 |

---

### ✏️ Manuel Mod

1. **"Manuel"** modunu seçin.
2. Yöntemi belirleyin:
   - 🎲 **Rastgele** — belirtilen aralıkta rastgele seviye atar
   - 📌 **Sabit Değer** — tüm öğrencilere aynı seviyeyi girer
   - 📏 **Aralık** — minimum ve maksimum arasında dağıtır
3. **"Başlat"** butonuna basın.

---

### 🧹 Hepsini Temizle

1. **"Temizle"** butonuna bir kez basın — onay uyarısı görünür.
2. **3 saniye içinde** tekrar basın — tüm cevaplar silinir.

---

### ⚙️ Önce Temizle Seçeneği

| Seçenek | Davranış |
|---|---|
| **Butonlar** | "Temizle" butonlarına tıklar |
| **Seçimi Kaldır** | Radio butonları uncheck eder |
| **Temizleme Yok** | Mevcut duruma dokunmaz |

---

### ⏱ Hız Ayarları

İnternet bağlantınız yavaşsa gecikme değerlerini artırmanız önerilir.

| Ayar | Önerilen Değer |
|---|---|
| Açılış gecikmesi | 1200 ms |
| İşlem gecikmesi | 800 ms |
| Kayıt gecikmesi | 1000 ms |

---

## 🗂️ Proje Yapısı

```
gelisim-raporu-asistani/
├── manifest.json        # Eklenti manifest dosyası (Manifest V3)
├── background.js        # Service Worker — sekme yönetimi ve mesajlaşma
├── content/
│   ├── panel.js         # Rapor sayfasına enjekte edilen ana panel
│   └── scraper.js       # Not sayfasından öğrenci notlarını çeken betik
├── popup/
│   ├── popup.html       # Eklenti popup arayüzü
│   └── popup.js         # Popup mantığı (önbellek görüntüleme, sekme geçişi)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔧 Teknik Detaylar

- **Manifest Sürümü:** V3
- **İzinler:** `storage`, `tabs`
- **Host İzni:** `https://e-okul.meb.gov.tr/*`
- **Diller:** JavaScript (%87.6), HTML (%12.4)
- **Versiyon:** 1.1.1

### Mimari

```
popup.js
   └── chrome.storage.local  (önbellek okuma/silme)

background.js (Service Worker)
   ├── OPEN_SCRAPER_TAB  → scraper sekmesini arka planda açar
   ├── SCRAPER_DONE      → notları storage'a kaydeder, panel'e bildirir, sekmeyi kapatır
   └── SCRAPER_ERROR     → hata mesajını panel'e iletir, sekmeyi kapatır

content/scraper.js  (not sayfasında çalışır)
   └── Öğrenci tablosunu okur → SCRAPER_DONE / SCRAPER_ERROR mesajı gönderir

content/panel.js  (rapor sayfasında çalışır)
   └── Formu doldurur / temizler; kullanıcı panelini yönetir
```

---

## 🔒 Gizlilik & Güvenlik

- ✅ Hiçbir kullanıcı verisi dışarıya gönderilmez.
- ✅ E-Okul'a giriş bilgisi istenmez veya saklanmaz.
- ✅ Çekilen notlar yalnızca tarayıcının yerel deposunda (`chrome.storage.local`) tutulur.
- ✅ Eklenti yalnızca `e-okul.meb.gov.tr` domaininde çalışır.

---

## 📬 İletişim & Destek

Hata bildirimi, öneri veya yardım için:

- 📧 **E-posta:** [supertacos89@gmail.com](mailto:supertacos89@gmail.com?subject=Gelişim%20Raporu%20Asistanı%20-%20Geri%20Bildirim)
- 🐛 **GitHub Issues:** [Sorun Bildir](https://github.com/canakalin89/gelisim-raporu-asistani/issues)

---

## 📄 Lisans

Bu proje açık kaynaklıdır. Katkıda bulunmak için fork'layabilir veya pull request açabilirsiniz.

---

<p align="center">
  <b>Gelişim Raporu Asistanı</b> · v1.1.1 · Öğretmenler için, öğretmenler tarafından ❤️
</p>