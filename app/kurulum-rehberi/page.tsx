'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Metadata notu ────────────────────────────────────────────────────────────
// layout.tsx veya metadata.ts dosyasına ekle:
// export const metadata = {
//   title: 'Kurulum Rehberi | Galya IPTV',
//   description: 'Galya IPTV kurulum adımları. Smart TV, Android, iPhone, Windows ve daha fazlası için adım adım kurulum rehberi.',
// };

// ─── Tip ve Veri ──────────────────────────────────────────────────────────────
type PlatformId = 'android' | 'androidtv' | 'iphone' | 'smarttv' | 'windows' | 'mag';

interface PlatformApp {
  name: string;
  icon: string; // emoji fallback
  imgSrc?: string;
}

interface Platform {
  id: PlatformId;
  label: string;
  sub: string;
  icon: string;
  appCount: number;
  setupTime: string;
  apps: PlatformApp[];
  steps: { title: string; desc: string }[];
  note?: string;
}

const SERVER_URL = 'http://pro4kiptv.xyz:2086';

const PLATFORMS: Platform[] = [
  {
    id: 'android',
    label: 'Android Telefon/Tablet',
    sub: 'Samsung, Xiaomi, Huawei...',
    icon: '📱',
    appCount: 3,
    setupTime: '3-4 dakika',
    apps: [
      { name: 'IPTV Smarters Pro', icon: '1️⃣', imgSrc: '/app-icons/smarters.png' },
      { name: 'TiviMate', icon: '2️⃣', imgSrc: '/app-icons/tivimate.png' },
      { name: 'GSE Smart IPTV', icon: '3️⃣', imgSrc: '/app-icons/gse.png' },
    ],
    steps: [
      { title: 'Uygulamayı İndir', desc: 'Play Store\'dan "IPTV Smarters Pro" uygulamasını indirin ve açın.' },
      { title: 'Xtream Codes Seç', desc: '"Xtream Codes API ile Giriş" seçeneğine tıklayın.' },
      { title: 'Bilgileri Gir', desc: `Sunucu: ${SERVER_URL} — Kullanıcı adı ve şifrenizi girin.` },
      { title: 'Kullanıcı Ekle', desc: '"Kullanıcı Ekle" butonuna basın. Kanal listesi otomatik yüklenir.' },
      { title: 'İzlemeye Başla', desc: 'Canlı TV, Film veya Dizi bölümünden izlemek istediğinizi seçin.' },
    ],
    note: 'TiviMate uygulaması daha gelişmiş bir arayüz sunar. EPG (program rehberi) desteği mevcuttur.',
  },
  {
    id: 'androidtv',
    label: 'Android TV',
    sub: 'Android TV Box, Fire TV Stick...',
    icon: '📺',
    appCount: 3,
    setupTime: '4-5 dakika',
    apps: [
      { name: 'IPTV Smarters Pro', icon: '1️⃣', imgSrc: '/app-icons/smarters.png' },
      { name: 'TiviMate', icon: '2️⃣', imgSrc: '/app-icons/tivimate.png' },
      { name: 'Kodi', icon: '3️⃣', imgSrc: '/app-icons/kodi.png' },
    ],
    steps: [
      { title: 'Play Store\'dan İndir', desc: 'Android TV veya Fire TV\'de Play Store / Amazon Store\'dan "TiviMate" indirin.' },
      { title: 'Uygulamayı Aç', desc: 'TiviMate uygulamasını başlatın ve "M3U ile Ekle" seçeneğini seçin.' },
      { title: 'M3U Linkini Yapıştır', desc: 'Bilgilerinizdeki M3U linkini kopyalayıp yapıştırın, "Sonraki" deyin.' },
      { title: 'EPG Ayarla', desc: 'Program rehberi için EPG URL\'nizi isteğe bağlı olarak ekleyebilirsiniz.' },
      { title: 'Kanalları Keşfet', desc: 'Kurulum tamamlandı! Kategori ve kanallar otomatik yüklenir.' },
    ],
    note: 'Fire TV Stick için önce "Bilinmeyen kaynaklara izin ver" ayarını etkinleştirmeniz gerekebilir.',
  },
  {
    id: 'iphone',
    label: 'iPhone/iPad',
    sub: 'iOS 14 ve üzeri',
    icon: '🍎',
    appCount: 3,
    setupTime: '2-3 dakika',
    apps: [
      { name: 'GSE Smart IPTV', icon: '1️⃣', imgSrc: '/app-icons/gse.png' },
      { name: 'IPTV Smarters Pro', icon: '2️⃣', imgSrc: '/app-icons/smarters.png' },
      { name: 'Flex IPTV', icon: '3️⃣', imgSrc: '/app-icons/flex.png' },
    ],
    steps: [
      { title: 'App Store\'dan İndir', desc: 'App Store\'dan "GSE Smart IPTV" uygulamasını indirin.' },
      { title: 'Remote Codes Ekle', desc: 'Uygulamada "Remote Codes" → "Xtream API" seçeneğine gidin.' },
      { title: 'Bilgileri Gir', desc: `Sunucu: ${SERVER_URL} — Kullanıcı adı ve şifrenizi girin.` },
      { title: 'Kaydet', desc: '"Ekle" veya "Save" butonuna basın. İçerikler yüklenmeye başlar.' },
      { title: 'İzlemeye Başla', desc: 'IPTV, Filmler veya Diziler bölümünden seçim yapın.' },
    ],
    note: 'AirPlay özelliği ile iPhone ekranını Apple TV veya Smart TV\'ye yansıtabilirsiniz.',
  },
  {
    id: 'smarttv',
    label: 'Samsung Tizen',
    sub: 'Samsung Smart TV (Tizen OS)',
    icon: '🖥️',
    appCount: 1,
    setupTime: '5-6 dakika',
    apps: [
      { name: 'Hot IPTV Player', icon: '1️⃣', imgSrc: '/app-icons/hotiptv.png' },
    ],
    steps: [
      { title: 'Samsung Apps\'i Aç', desc: 'TV\'nizde Samsung Apps mağazasını açın ve "Hot IPTV Player" arayın.' },
      { title: 'Uygulamayı Kur', desc: 'Hot IPTV Player\'ı indirin. Uygulama bir aktivasyon kodu gösterecek.' },
      { title: 'Web Aktivasyonu', desc: 'Telefon veya bilgisayardan hot-iptv.net adresini açın, kodu girin.' },
      { title: 'Sunucu Bilgilerini Gir', desc: 'Aynı sayfada kullanıcı adı ve şifrenizi girerek kaydedin.' },
      { title: 'TV\'yi Yenile', desc: 'TV\'deki uygulamayı yenileyin. Kanallar otomatik yüklenecektir.' },
    ],
    note: 'Samsung TV\'nizde otomatik güncelleme açıksa kapatmanız önerilir. Tizen OS 4.0+ gereklidir.',
  },
  {
    id: 'windows',
    label: 'Windows / macOS',
    sub: 'Bilgisayar ve dizüstü',
    icon: '💻',
    appCount: 2,
    setupTime: '4-5 dakika',
    apps: [
      { name: 'Smarters Player Pro', icon: '1️⃣', imgSrc: '/app-icons/smarters.png' },
      { name: 'VLC Media Player', icon: '2️⃣', imgSrc: '/app-icons/vlc.png' },
    ],
    steps: [
      { title: 'Smarters\'ı İndir', desc: 'smarters.live adresinden "Smarters Player Pro" yazılımını indirin ve kurun.' },
      { title: 'Xtream Codes ile Giriş', desc: '"Login with Xtream Codes API" seçeneğini seçin.' },
      { title: 'Bilgileri Gir', desc: `Host: ${SERVER_URL} — Kullanıcı adı ve şifrenizi girin.` },
      { title: 'Add User', desc: '"Add User" butonuna tıklayın. İçerikler yüklenecektir.' },
      { title: 'İzlemeye Başla', desc: 'Live TV, Filmler ve Diziler bölümlerinden içerik seçin.' },
    ],
    note: 'VLC alternatifi için: Ortam → Ağ Akışı Aç → M3U linkini yapıştırın ve "Oynat" deyin.',
  },
  {
    id: 'mag',
    label: 'MAG Cihazlar',
    sub: 'MAG 256, 322, 352 ve üzeri',
    icon: '📦',
    appCount: 1,
    setupTime: '5-8 dakika',
    apps: [
      { name: 'Dahili Portal', icon: '1️⃣' },
    ],
    steps: [
      { title: 'Ayarlara Git', desc: 'MAG cihazınızda: Sistem → Sunucular → Portal 1 menüsüne gidin.' },
      { title: 'Portal URL Gir', desc: `Portal URL alanına ${SERVER_URL}/c/ adresini girin.` },
      { title: 'Kaydet ve Yeniden Başlat', desc: 'Kaydet\'e basın. Cihazı yeniden başlatın.' },
      { title: 'MAC Adresi Bildirin', desc: 'Cihazınızın MAC adresini WhatsApp üzerinden bize gönderin.' },
      { title: 'Aktivasyon Bekleyin', desc: 'Aktivasyon onaylandıktan sonra içerikler yüklenecektir.' },
    ],
    note: 'MAG cihazları için MAC adres aktivasyonu gereklidir. WhatsApp\'tan destek alabilirsiniz.',
  },
];

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs transition-all ${copied ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-400' : 'border-[#1e3a5f] text-[#6b7280] hover:border-[#3b82f6]/50 hover:text-[#3b82f6]'}`}
    >
      {copied ? '✓' : (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
          <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
          <path d="M0 5a2 2 0 0 1 2-2h1v1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2z"/>
        </svg>
      )}
    </button>
  );
}


// ─── localStorage'dan gerçek test bilgilerini oku ─────────────────────────────
const LS_KEY = 'galya_modal_progress'; // aynı key ana sayfadaki gibi

interface TrialCreds {
  username: string;
  password: string;
  startedAt: number; // ms timestamp
}

function useTrialCredentials(): TrialCreds | null {
  const [creds, setCreds] = useState<TrialCreds | null>(null);

  useEffect(() => {
    // Önce direkt trial credentials anahtarına bak
    // Ana sayfada test tamamlanınca localStorage'a farklı bir key ile kaydediyoruz
    // Burada iki olası kaynağı kontrol ediyoruz
    try {
      // 1. 'galya_trial_creds' — modal adım 4'te set edilen bilgiler
      const raw = localStorage.getItem('galya_trial_creds');
      if (raw) {
        const parsed = JSON.parse(raw) as TrialCreds;
        if (parsed.username && parsed.password) { setCreds(parsed); return; }
      }
      // 2. Fallback: galya_modal_progress içinde saklanan bilgi
      const prog = localStorage.getItem(LS_KEY);
      if (prog) {
        const p = JSON.parse(prog);
        if (p.username && p.password && p.startedAt) setCreds(p as TrialCreds);
      }
    } catch { /* ignore */ }
  }, []);

  return creds;
}

// ─── Kalan süre hesapla ───────────────────────────────────────────────────────
function useCountdown(startedAt: number): string {
  const TOTAL = 3 * 60 * 60 * 1000; // 3 saat
  const [remaining, setRemaining] = useState(() => Math.max(0, TOTAL - (Date.now() - startedAt)));

  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, TOTAL - (Date.now() - startedAt))), 1000);
    return () => clearInterval(id);
  }, [startedAt, TOTAL]);

  if (remaining <= 0) return 'Süresi doldu';
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ─── Test bilgileri kartı ─────────────────────────────────────────────────────
function TrialCredentialsCard({ creds }: { creds: TrialCreds }) {
  const SERVER = 'http://pro4kiptv.xyz:2086';
  const m3u    = `${SERVER}/get.php?username=${creds.username}&password=${creds.password}&type=m3u&output=ts`;
  const countdown = useCountdown(creds.startedAt);
  const isExpired = countdown === 'Süresi doldu';

  const rows = [
    { label: 'KULLANICI ADI', value: creds.username },
    { label: 'ŞİFRE',         value: creds.password },
    { label: 'SERVER URL',    value: SERVER },
    { label: 'M3U URL',       value: m3u },
  ];

  return (
    <div className={`mb-8 rounded-2xl border p-5 ${isExpired ? 'border-[#1e2d42] bg-[#0a0f18] opacity-60' : 'border-[#3b82f6]/30 bg-[#0a1525]'}`}>
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {!isExpired && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          )}
          <p className="text-sm font-semibold text-white">
            {isExpired ? '⌛ Test Süresi Doldu' : '🔗 Kurulum Bilgileriniz'}
          </p>
        </div>
        {/* Geri sayım */}
        <span className={`rounded-lg border px-3 py-1 font-mono text-sm font-bold ${
          isExpired
            ? 'border-[#1e2d42] text-[#4b5563]'
            : 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400'
        }`}>
          {isExpired ? '00:00:00' : countdown}
        </span>
      </div>

      {isExpired ? (
        <div className="text-center py-4">
          <p className="text-sm text-[#6b7280] mb-4">Test süreniz sona erdi. Paketi satın alarak kesintisiz izlemeye devam edebilirsiniz.</p>
          <a
            href="https://wa.me/447441921660?text=Merhaba%2C%20sat%C4%B1n%20almak%20istiyorum."
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25d366] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1ebe5d]"
          >
            💬 WhatsApp ile Satın Al
          </a>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-2 rounded-xl border border-[#1e2d42] bg-[#060e1a] px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-[#4b5563]">{row.label}</p>
                <p className="mt-0.5 truncate font-mono text-sm font-medium text-[#8b9ab3]">{row.value}</p>
              </div>
              <CopyBtn value={row.value} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Test yok kartı ──────────────────────────────────────────────────────────
function NoTrialCard() {
  return (
    <div className="mb-8 rounded-2xl border border-dashed border-[#1e2d42] bg-[#060e1a] p-6 text-center">
      <div className="mb-3 text-3xl opacity-40">🔒</div>
      <p className="mb-1 font-semibold text-white">Henüz Test Hesabınız Yok</p>
      <p className="mb-5 text-sm text-[#6b7280]">
        Kurulum bilgilerinizi görmek için önce ücretsiz test hesabı açın.
        Bilgiler buraya otomatik olarak yüklenecektir.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#3b82f6]/25 transition-colors hover:bg-[#2563eb]"
      >
        ⚡ Ücretsiz Test Al
      </Link>
    </div>
  );
}

// ─── Platform Kart bileşeni ───────────────────────────────────────────────────
function PlatformCard({ platform }: { platform: Platform }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${open ? 'border-[#3b82f6]/50 bg-[#0c1628]' : 'border-[#1e2d42] bg-[#0a1020] hover:border-[#3b82f6]/30 hover:bg-[#0c1525]'}`}
    >
      {/* Kart başlığı — tıklanabilir */}
      <button
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-colors ${open ? 'bg-[#1e3a5f]' : 'bg-[#111827]'}`}>
          {platform.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white">{platform.label}</p>
          <p className="text-xs text-[#6b7280]">{platform.sub}</p>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-[#4b5563]">
            <span>{platform.appCount} uygulama</span>
            <span>·</span>
            <span>⏱ {platform.setupTime}</span>
          </div>
        </div>
        {/* Uygulama ikonları — mini önizleme */}
        <div className="hidden items-center gap-1 sm:flex">
          {platform.apps.slice(0, 3).map((app) => (
            <div key={app.name} title={app.name}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111827] border border-[#1e2d42] text-sm overflow-hidden">
              {app.imgSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={app.imgSrc} alt={app.name} className="h-full w-full object-cover rounded-lg"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <span className="text-xs">{app.icon}</span>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs ml-2">
          <span className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 font-medium transition-colors ${open ? 'border-[#3b82f6]/40 bg-[#1e3a5f]/60 text-[#3b82f6]' : 'border-[#1e2d42] text-[#6b7280] hover:text-white'}`}>
            {open ? '↑ Kapat' : 'Seç →'}
          </span>
        </div>
      </button>

      {/* Açılır içerik */}
      {open && (
        <div className="border-t border-[#1e2d42] px-5 pb-6 pt-5">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Sol: Adımlar */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Kurulum Adımları</p>
              <ol className="space-y-3">
                {platform.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3b82f6] text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{s.title}</p>
                      <p className="text-xs leading-relaxed text-[#8b9ab3]">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {platform.note && (
                <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-950/20 px-4 py-3">
                  <p className="text-xs leading-relaxed text-amber-400">💡 {platform.note}</p>
                </div>
              )}
            </div>

            {/* Sağ: Uygulamalar + Sunucu bilgileri */}
            <div className="space-y-4">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Önerilen Uygulamalar</p>
                <div className="space-y-2">
                  {platform.apps.map((app, i) => (
                    <div key={app.name} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${i === 0 ? 'border-[#3b82f6]/30 bg-[#1e3a5f]/20' : 'border-[#1e2d42] bg-[#0d1525]'}`}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111827] border border-[#1e2d42] text-sm overflow-hidden">
                        {app.imgSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={app.imgSrc} alt={app.name} className="h-full w-full object-cover rounded-lg"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <span>{app.icon}</span>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${i === 0 ? 'text-white' : 'text-[#8b9ab3]'}`}>{app.name}</span>
                      {i === 0 && <span className="ml-auto rounded-full bg-[#3b82f6]/20 px-2 py-0.5 text-[10px] font-semibold text-[#3b82f6]">Önerilen</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hızlı referans bilgileri */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Bağlantı Bilgileri</p>
                <div className="space-y-2 rounded-xl border border-[#1e2d42] bg-[#060e1a] p-3">
                  {[
                    { label: 'SUNUCU URL', value: SERVER_URL },
                    { label: 'PORT', value: '2086' },
                    { label: 'KULLANICI ADI', value: 'Test bilginizden alın' },
                    { label: 'ŞİFRE', value: 'Test bilginizden alın' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4b5563]">{row.label}</span>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="rounded-md bg-[#0d1a2a] px-2 py-0.5 font-mono text-xs text-[#8b9ab3] truncate max-w-[160px]">{row.value}</span>
                        {row.value !== 'Test bilginizden alın' && <CopyBtn value={row.value} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp destek butonu */}
              <a
                href={`https://wa.me/447441921660?text=${encodeURIComponent(`Merhaba, ${platform.label} kurulumunda yardıma ihtiyacım var.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1ebe5d]"
              >
                💬 Kurulumda Sorun Var? WhatsApp Destek
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────
export default function KurulumRehberiPage() {
  const trialCreds = useTrialCredentials();
  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      {/* ─── Header bağlantısı (ana header yok, basit nav) ─────────────── */}
      <div className="border-b border-[#1e2d42] bg-[#07111f]/95 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Galya IPTV" className="h-8 w-auto object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-base font-bold text-white">Galya <span className="text-[#3b82f6]">IPTV</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/#paketler" className="text-sm text-[#8b9ab3] transition-colors hover:text-white">Paketler</Link>
            <Link href="/#sss" className="text-sm text-[#8b9ab3] transition-colors hover:text-white">S.S.S</Link>
            <a
              href="https://wa.me/447441921660?text=Merhaba%2C%20sat%C4%B1n%20almak%20istiyorum."
              target="_blank" rel="noopener noreferrer"
              className="rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2563eb]"
            >
              Ücretsiz Test Al
            </a>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Başlık */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1e3a5f] bg-[#0d1a2a] px-4 py-1.5 text-xs text-[#8b9ab3]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />
            Tüm platformlar için adım adım rehber
          </div>
          <h1 className="mb-3 text-4xl font-black tracking-tight md:text-5xl">
            Uygulamada İzle
          </h1>
          <p className="text-base text-[#8b9ab3]">
            Platformunu seç, uygulamayı indir ve izlemeye başla
          </p>
        </div>

        {/* ── Test bilgileri — sadece gerçek test bilgileri gösterilir ── */}
        {trialCreds ? (
          <TrialCredentialsCard creds={trialCreds} />
        ) : (
          <NoTrialCard />
        )}

        {/* Platform kartları */}
        <div className="space-y-3">
          {PLATFORMS.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>

        {/* Alt CTA */}
        <div className="mt-12 rounded-2xl border border-[#1e3a5f] bg-[#0d1a2a] p-6 text-center">
          <p className="mb-1 text-lg font-bold text-white">Kurulumda Takıldınız mı?</p>
          <p className="mb-5 text-sm text-[#8b9ab3]">
            WhatsApp destek hattımız 7/24 aktif. Uzaktan kurulum desteği de sağlıyoruz.
          </p>
          <a
            href="https://wa.me/447441921660?text=Merhaba%2C%20kurulum%20konusunda%20yard%C4%B1ma%20ihtiyac%C4%B1m%20var."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25d366] px-8 py-3.5 font-bold text-white shadow-lg transition-colors hover:bg-[#1ebe5d]"
          >
            💬 WhatsApp Destek Hattı
          </a>
          <p className="mt-4 text-xs text-[#374151]">
            Henüz test hesabınız yok mu?{' '}
            <Link href="/" className="text-[#3b82f6] transition-colors hover:underline">
              Buradan ücretsiz test alın →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
