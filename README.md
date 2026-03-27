# Galya IPTV - Next.js Projesi

## Kurulum

```bash
npm install
npm run dev
```

## ✅ Netlify ile Deploy (Önerilen)

Bu proje Netlify için optimize      edilmiştir.

### Yöntem 1 — Dosya Sürükle-Bırak (En Kolay)
1. Bilgisayarınızda terminali açın ve proje klasörüne gelin
2. `npm install` çalıştırın
3. `npm run build` çalıştırın → `out/` klasörü oluşur
4. [app.netlify.com](https://app.netlify.com) → "Add new site" → "Deploy manually"
5. **`out/` klasörünü** sürükleyip bırakın ✅

### Yöntem 2 — GitHub ile Otomatik Deploy
1. Bu klasörü GitHub'a yükleyin
2. Netlify → "Add new site" → "Import an existing project"
3. GitHub repo'yu seçin
4. Build ayarları otomatik algılanır (`netlify.toml` sayesinde)
5. Deploy edin ✅

## Vercel ile Deploy

1. [vercel.com](https://vercel.com) adresine gidin ve GitHub ile giriş yapın
2. "New Project" tıklayın
3. GitHub repo'yu seçin → Deploy ✅

## Yapılan SEO İyileştirmeleri

### ❌ Kaldırılan Hatalar
- **Gizli keyword stuffing div** (`left: -9999px`) → Google ceza veriyordu
- Aşırı keyword meta tag → spam sinyali veriyordu
- SPA (React) → Arama motorları JS'i render edemiyordu

### ✅ Eklenen SEO Özellikleri
- **Next.js App Router** → Sunucu taraflı render (SSR/SSG), Google tam indexler
- **Sayfa bazlı metadata** → Her sayfa kendi title/description/canonical'ına sahip
- **Structured Data (JSON-LD)** → Organization, Product, FAQ, Article, Blog schema
- **sitemap.xml** → `/sitemap.xml` otomatik üretilir
- **robots.txt** → `/robots.txt` otomatik üretilir
- **OpenGraph + Twitter Card** → Sosyal medya paylaşımları zengin görünür
- **Blog sistemi** → 6 SEO odaklı makale, genişletilebilir yapı
- **Canonical URL** → Her sayfada doğru canonical
- **Security headers** → X-Frame-Options, nosniff

## Blog Yazısı Ekleme

`lib/blog-posts.ts` dosyasına yeni obje ekleyin:

```ts
{
  slug: 'yeni-yazi',
  title: 'Başlık',
  description: 'Meta description',
  date: '2025-02-01',
  category: 'Rehber',
  content: `## Başlık\n\nİçerik buraya...`,
}
```

## Google Search Console

1. Google Search Console'a giriş yapın
2. `https://galyaiptv.com.tr` alan adını ekleyin
3. `layout.tsx` içindeki `YOUR_GOOGLE_VERIFICATION_CODE` kısmını güncelleyin
4. Sitemap olarak `https://galyaiptv.com.tr/sitemap.xml` ekleyin

## Panel Otomasyonu (Railway + Tarayıcı Botu)

Bu projede kullanıcı profilindeki **Panel Otomasyonu** kartı, arka planda panel hesabına giriş yapıp kullanıcı detayını okumak veya yenileme aksiyonu tetiklemek için hazırlandı.

### Gerekli ortam değişkenleri

Backend tarafında aşağıdaki değişkenleri tanımlayın:

- `PANEL_AUTOMATION_URL`: Panel giriş adresi
- `PANEL_AUTOMATION_USERNAME`: Botun panel kullanıcı adı
- `PANEL_AUTOMATION_PASSWORD`: Botun panel şifresi
- `PANEL_AUTOMATION_HEADLESS`: `false` verilmezse headless çalışır
- `PANEL_AUTOMATION_SELECTORS`: Panel HTML yapısına göre selector JSON'u

### `PANEL_AUTOMATION_SELECTORS` örneği

```json
{
  "usernameInput": "input[name='username']",
  "passwordInput": "input[name='password']",
  "submitButton": "button[type='submit']",
  "postLoginReady": ".sidebar",
  "userSearchInput": "input[placeholder='Kullanıcı ara']",
  "userSearchButton": "button[data-role='search']",
  "userRow": "table tbody tr",
  "userRowEmail": "td:nth-child(3)",
  "userRowUsername": "td:nth-child(2)",
  "openUserButton": "button[data-role='open-user']",
  "detailReady": ".user-detail",
  "statusField": "[data-field='status']",
  "expiryField": "[data-field='expires']",
  "packageField": "[data-field='package']",
  "refreshButton": "button[data-role='refresh-user']",
  "linePageReady": ".table-responsive",
  "lineSearchInput": "input[placeholder='Search Users']",
  "lineUserRow": "table tbody tr",
  "lineUserRowUsername": "td:nth-child(2)",
  "lineEditButton": "button[data-role='edit-line']",
  "lineEditorReady": ".modal.show",
  "lineInSelect": "select[name='bouquets[]']",
  "lineNotInSelect": "select[name='bouquets_not_in[]']",
  "lineSaveButton": "button[type='submit']"
}
```

### Akış

1. Kullanıcı `/profil` sayfasında **Durumu Oku** veya **Panelde Yenile** butonuna basar.
2. `POST /api/panel-automation` oturumdaki kullanıcıyı ve aktif aboneliği doğrular.
3. Backend, Puppeteer + Chromium ile panele giriş yapar.
4. Kullanıcı e-posta/kullanıcı adına göre aranır.
5. Durum bilgisi okunur veya yenileme butonu tetiklenir.
6. Sonuç UI'de kullanıcıya sade bir kart olarak gösterilir.

> Not: Kanal yönetimi ekranı farklı panel temalarında değişebildiği için, gerekirse `line*` selector alanlarını doldurarak IN / NOT IN editörünü daha kararlı hale getirebilirsiniz.
