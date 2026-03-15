'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, SessionProvider } from 'next-auth/react';

// ─── Tipler ───────────────────────────────────────────────────────────────────
type PlatformId = 'android' | 'androidtv' | 'iphone' | 'smarttv' | 'windows' | 'mag';

interface AppInfo {
  id: string;
  name: string;
  logo: string;        // /app-icons/[logo] olarak yüklenecek
  downloadUrl: string;
  setupTime: string;
  recommended?: boolean;
  videoSrc?: string;   // /kurulum-videos/[video] — opsiyonel
  steps: { title: string; desc: string }[];
}

interface Platform {
  id: PlatformId;
  label: string;
  icon: string;
  apps: AppInfo[];
}

const SERVER_URL = 'http://pro4kiptv.xyz:2086';

// ─── Logo dosya adları — /public/app-icons/ klasörüne yükleyin ───────────────
// Her logo için beklenen dosya adı aşağıda belirtilmiştir.
const PLATFORMS: Platform[] = [
  {
    id: 'android',
    label: 'Android Telefon/Tablet',
    icon: '📱',
    apps: [
      {
        id: 'onestream',
        name: '1Stream Player',
        logo: 'logo-1stream.png',          // /public/app-icons/logo-1stream.png
        downloadUrl: 'https://play.google.com/store/apps/details?id=com.nst.iptvsmarterstvbox',
        setupTime: '3 dakika',
        recommended: false,
        steps: [
          { title: 'Play Store\'dan İndir', desc: 'Play Store\'dan "1Stream Player" uygulamasını indirin ve açın.' },
          { title: 'Xtream Codes Seç', desc: '"Xtream Codes API" ile giriş seçeneğine tıklayın.' },
          { title: 'Bilgileri Gir', desc: 'Sağ paneldeki Server URL, kullanıcı adı ve şifreyi girin.' },
          { title: 'Kullanıcı Ekle', desc: '"Ekle" butonuna basın. Kanal listesi otomatik yüklenir.' },
          { title: 'İzlemeye Başla', desc: 'Canlı TV, Film veya Dizi sekmesinden izlemeye başlayın.' },
        ],
      },
      {
        id: 'xpiptv',
        name: 'XP IPTV',
        logo: 'logo-xpiptv.png',           // /public/app-icons/logo-xpiptv.png
        downloadUrl: 'https://play.google.com/store/apps/details?id=com.nst.iptvsmarters',
        setupTime: '3 dakika',
        recommended: true,
        steps: [
          { title: 'Play Store\'dan İndir', desc: 'Play Store\'dan "XP IPTV" uygulamasını indirin ve açın.' },
          { title: 'Xtream Codes Seç', desc: '"Xtream Codes API" seçeneğine tıklayın.' },
          { title: 'Bilgileri Gir', desc: 'Server URL, kullanıcı adı ve şifreyi sağ panelden kopyalayıp girin.' },
          { title: 'Bağlan', desc: '"Bağlan" butonuna basın. İçerikler yüklenmeye başlar.' },
          { title: 'İzlemeye Başla', desc: 'Kategorilerden istediğinizi seçin.' },
        ],
      },
      {
        id: '9xtream',
        name: '9Xtream',
        logo: 'logo-9xtream.png',           // /public/app-icons/logo-9xtream.png
        downloadUrl: 'https://play.google.com/store/apps/details?id=com.nineiptv.player',
        setupTime: '4 dakika',
        recommended: false,
        steps: [
          { title: 'Play Store\'dan İndir', desc: 'Play Store\'dan "9Xtream" uygulamasını indirin.' },
          { title: 'Yeni Hesap Ekle', desc: '"Add Xtream Codes API" seçeneğine tıklayın.' },
          { title: 'Bilgileri Gir', desc: 'Server, kullanıcı adı ve şifreyi girin.' },
          { title: 'Ekle', desc: '"Ekle" butonuna basın.' },
          { title: 'İzlemeye Başla', desc: 'Live TV, VOD veya Series sekmesinden izleyin.' },
        ],
      },
    ],
  },
  {
    id: 'androidtv',
    label: 'Android TV',
    icon: '📺',
    apps: [
      {
        id: 'tivimate',
        name: 'TiviMate',
        logo: 'logo-tivimate.png',          // /public/app-icons/logo-tivimate.png
        downloadUrl: 'https://play.google.com/store/apps/details?id=ar.tvplayer.tv',
        setupTime: '4 dakika',
        recommended: true,
        steps: [
          { title: 'Play Store\'dan İndir', desc: 'Android TV\'de Play Store\'dan "TiviMate" indirin.' },
          { title: 'M3U Playlist Ekle', desc: '"Add playlist" → "M3U playlist" seçin.' },
          { title: 'M3U Linkini Gir', desc: 'Sağ paneldeki M3U URL\'sini kopyalayıp yapıştırın.' },
          { title: 'EPG Ayarla (İsteğe Bağlı)', desc: 'Program rehberi için EPG URL\'si ekleyebilirsiniz.' },
          { title: 'İzlemeye Başla', desc: 'Kurulum tamamlandı! Kategorileri keşfedin.' },
        ],
      },
      {
        id: 'smartersandroidtv',
        name: 'IPTV Smarters Pro',
        logo: 'logo-smarters.png',          // /public/app-icons/logo-smarters.png
        downloadUrl: 'https://play.google.com/store/apps/details?id=com.nst.iptvsmarterstvbox',
        setupTime: '4 dakika',
        recommended: false,
        steps: [
          { title: 'Store\'dan İndir', desc: 'Android TV Play Store\'dan "IPTV Smarters Pro" indirin.' },
          { title: 'Xtream Codes Seç', desc: '"Login with Xtream Codes API" seçin.' },
          { title: 'Bilgileri Gir', desc: 'Server URL, kullanıcı adı ve şifreyi girin.' },
          { title: 'Giriş Yap', desc: '"Add User" butonuna basın.' },
          { title: 'İzlemeye Başla', desc: 'Live TV, Movies veya Series seçin.' },
        ],
      },
      {
        id: 'ottnavigator',
        name: 'OTT Navigator',
        logo: 'logo-ottnavigator.png',      // /public/app-icons/logo-ottnavigator.png
        downloadUrl: 'https://play.google.com/store/apps/details?id=studio.blackhole.ottnavigator',
        setupTime: '5 dakika',
        recommended: false,
        steps: [
          { title: 'Play Store\'dan İndir', desc: 'OTT Navigator uygulamasını indirin.' },
          { title: 'Playlist Ekle', desc: '"+" → "Xtream Codes" seçin.' },
          { title: 'Bilgileri Gir', desc: 'Server, kullanıcı adı ve şifreyi girin.' },
          { title: 'Kaydet', desc: '"Save" butonuna basın.' },
          { title: 'İzlemeye Başla', desc: 'Kanalları ve içerikleri keşfedin.' },
        ],
      },
    ],
  },
  {
    id: 'iphone',
    label: 'iPhone/iPad',
    icon: '🍎',
    apps: [
      {
        id: 'gse',
        name: 'GSE Smart IPTV',
        logo: 'logo-gse.png',               // /public/app-icons/logo-gse.png
        downloadUrl: 'https://apps.apple.com/app/gse-smart-iptv-live-player/id1379998724',
        setupTime: '3 dakika',
        recommended: true,
        steps: [
          { title: 'App Store\'dan İndir', desc: 'App Store\'dan "GSE Smart IPTV" indirin.' },
          { title: 'Remote Codes Ekle', desc: '"Remote Codes" → "Xtream API" seçin.' },
          { title: 'Bilgileri Gir', desc: 'Server URL, kullanıcı adı ve şifreyi girin.' },
          { title: 'Kaydet', desc: '"Save" butonuna basın.' },
          { title: 'İzlemeye Başla', desc: 'IPTV, Films veya Series seçin.' },
        ],
      },
      {
        id: 'smarters-ios',
        name: 'IPTV Smarters Pro',
        logo: 'logo-smarters.png',          // /public/app-icons/logo-smarters.png
        downloadUrl: 'https://apps.apple.com/app/iptv-smarters-player-lite/id1628995509',
        setupTime: '3 dakika',
        recommended: false,
        steps: [
          { title: 'App Store\'dan İndir', desc: 'App Store\'dan "IPTV Smarters Player" indirin.' },
          { title: 'Xtream Codes Seç', desc: '"Xtream Codes API" ile giriş seçin.' },
          { title: 'Bilgileri Gir', desc: 'Server URL, kullanıcı adı ve şifreyi girin.' },
          { title: 'Add User', desc: '"Add User" butonuna basın.' },
          { title: 'İzlemeye Başla', desc: 'İçerikleri keşfedin.' },
        ],
      },
      {
        id: 'flex',
        name: 'Flex IPTV',
        logo: 'logo-flex.png',              // /public/app-icons/logo-flex.png
        downloadUrl: 'https://apps.apple.com/app/flex-iptv/id1182930255',
        setupTime: '3 dakika',
        recommended: false,
        steps: [
          { title: 'App Store\'dan İndir', desc: 'App Store\'dan "Flex IPTV" indirin.' },
          { title: 'Kaynak Ekle', desc: '"+" → "Xtream" seçin.' },
          { title: 'Bilgileri Gir', desc: 'Server, kullanıcı adı ve şifreyi girin.' },
          { title: 'Kaydet', desc: '"Done" butonuna basın.' },
          { title: 'İzlemeye Başla', desc: 'Kanalları ve içerikleri izleyin.' },
        ],
      },
    ],
  },
  {
    id: 'smarttv',
    label: 'Samsung Tizen',
    icon: '🖥️',
    apps: [
      {
        id: 'hotiptv',
        name: 'Hot IPTV Player',
        logo: 'logo-hotiptv.png',           // /public/app-icons/logo-hotiptv.png
        downloadUrl: 'https://hot-iptv.net',
        setupTime: '5 dakika',
        recommended: true,
        steps: [
          { title: 'Samsung Apps\'i Aç', desc: 'TV\'de Samsung Apps → "Hot IPTV Player" arayın ve indirin.' },
          { title: 'Kodu Not Al', desc: 'Uygulama bir aktivasyon kodu gösterecek. Not alın.' },
          { title: 'Web Aktivasyonu', desc: 'Telefon/bilgisayardan hot-iptv.net adresini açın, kodu girin.' },
          { title: 'Bilgileri Gir', desc: 'Server URL, kullanıcı adı ve şifreyi girerek kaydedin.' },
          { title: 'TV\'yi Yenile', desc: 'Uygulamayı yenileyin. Kanallar otomatik yüklenir.' },
        ],
      },
    ],
  },
  {
    id: 'windows',
    label: 'Windows / macOS',
    icon: '💻',
    apps: [
      {
        id: 'smarters-pc',
        name: 'Smarters Player Pro',
        logo: 'logo-smarters.png',          // /public/app-icons/logo-smarters.png
        downloadUrl: 'https://www.smarters.live',
        setupTime: '4 dakika',
        recommended: true,
        steps: [
          { title: 'smarters.live\'dan İndir', desc: 'smarters.live adresinden Windows/Mac sürümünü indirin ve kurun.' },
          { title: 'Xtream Codes Seç', desc: '"Login with Xtream Codes API" seçin.' },
          { title: 'Bilgileri Gir', desc: 'Host, kullanıcı adı ve şifreyi girin.' },
          { title: 'Add User', desc: '"Add User" butonuna tıklayın.' },
          { title: 'İzlemeye Başla', desc: 'Live TV, Movies ve Series bölümlerini keşfedin.' },
        ],
      },
      {
        id: 'vlc',
        name: 'VLC Media Player',
        logo: 'logo-vlc.png',               // /public/app-icons/logo-vlc.png
        downloadUrl: 'https://www.videolan.org/vlc/',
        setupTime: '2 dakika',
        recommended: false,
        steps: [
          { title: 'VLC\'yi İndir', desc: 'videolan.org adresinden VLC indirin ve kurun.' },
          { title: 'Ağ Akışı Aç', desc: 'Medya → Ağ Akışı Aç (Ctrl+N) menüsüne gidin.' },
          { title: 'M3U Linkini Yapıştır', desc: 'Sağ paneldeki M3U URL\'sini kopyalayıp yapıştırın.' },
          { title: 'Oynat', desc: '"Oynat" butonuna basın. Kanal listesi yüklenir.' },
          { title: 'Kanal Seç', desc: 'Oynatma listesinden istediğiniz kanalı seçin.' },
        ],
      },
    ],
  },
  {
    id: 'mag',
    label: 'MAG Cihazlar',
    icon: '📦',
    apps: [
      {
        id: 'mag-portal',
        name: 'Dahili Portal',
        logo: 'logo-mag.png',               // /public/app-icons/logo-mag.png
        downloadUrl: 'https://wa.me/447441921660?text=MAG%20cihaz%20aktivasyonu%20istiyorum',
        setupTime: '5 dakika',
        recommended: true,
        steps: [
          { title: 'Ayarlara Git', desc: 'MAG cihazında: Sistem → Sunucular → Portal 1 menüsüne gidin.' },
          { title: 'Portal URL Gir', desc: `Portal URL: ${SERVER_URL}/c/ adresini girin.` },
          { title: 'Kaydet ve Yeniden Başlat', desc: 'Kaydet\'e basın. Cihazı yeniden başlatın.' },
          { title: 'MAC Adresini Bildirin', desc: 'Cihazınızın MAC adresini WhatsApp\'tan bize gönderin.' },
          { title: 'Aktivasyon Bekleyin', desc: 'Aktivasyon onaylandıktan sonra içerikler yüklenir.' },
        ],
      },
    ],
  },
];

// ─── Trial creds hook (Redis + localStorage) ──────────────────────────────────
interface TrialCreds {
  email?: string;
  username: string;
  password: string;
  startedAt: number;
}

function useTrialCreds(email: string | null | undefined): { creds: TrialCreds | null; loading: boolean } {
  const [creds, setCreds] = useState<TrialCreds | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // LocalStorage'dan hızlı oku
    try {
      const raw = localStorage.getItem('galya_trial_creds');
      if (raw) {
        const p = JSON.parse(raw);
        if (p.username && (!p.email || p.email === email)) {
          setCreds(p);
          setLoading(false);
        }
      }
    } catch { /* */ }

    if (!email) { setLoading(false); return; }

    // Redis'ten doğrula
    fetch('/api/test-talep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_trial', email }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.username) {
          const cr = { email: email ?? undefined, username: data.username, password: data.password, startedAt: data.startedAt };
          setCreds(cr);
          try { localStorage.setItem('galya_trial_creds', JSON.stringify(cr)); } catch { /* */ }
        } else {
          setCreds(null);
        }
      })
      .catch(() => { /* keep localStorage value */ })
      .finally(() => setLoading(false));
  }, [email]);

  return { creds, loading };
}

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(startedAt: number | null) {
  const TOTAL = 3 * 60 * 60 * 1000;
  const [rem, setRem] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const calc = () => Math.max(0, TOTAL - (Date.now() - startedAt));
    setRem(calc());
    const id = setInterval(() => setRem(calc()), 1000);
    return () => clearInterval(id);
  }, [startedAt, TOTAL]);
  const expired = !startedAt || rem <= 0;
  const h = Math.floor(rem / 3600000);
  const m = Math.floor((rem % 3600000) / 60000);
  const s = Math.floor((rem % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { display: `${pad(h)}:${pad(m)}:${pad(s)}`, expired };
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ value }: { value: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs transition-all ${ok ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-400' : 'border-[#1e2d42] text-[#6b7280] hover:border-[#3b82f6]/50 hover:text-[#3b82f6]'}`}>
      {ok ? '✓' : (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
          <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
          <path d="M0 5a2 2 0 0 1 2-2h1v1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2z"/>
        </svg>
      )}
    </button>
  );
}

// ─── Sağ panel: Test bilgileri ────────────────────────────────────────────────
function CredentialsPanel({ creds, loading, selectedApp }: {
  creds: TrialCreds | null;
  loading: boolean;
  selectedApp: AppInfo | null;
}) {
  const { display: countdown, expired } = useCountdown(creds?.startedAt ?? null);
  const SERVER = SERVER_URL;
  const m3u = creds ? `${SERVER}/get.php?username=${creds.username}&password=${creds.password}&type=m3u&output=ts` : '';
  const [m3uOpen, setM3uOpen] = useState(false);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] p-5 space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-[#1e2d42]" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-[#1e2d42]" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-[#1e2d42]" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-[#1e2d42]" />
      </div>
    );
  }

  if (!creds) {
    return (
      <div className="rounded-2xl border border-dashed border-[#1e2d42] bg-[#060e1a] p-6 text-center">
        <div className="mb-3 text-3xl opacity-30">🔒</div>
        <p className="mb-1 text-sm font-semibold text-white">Giriş Bilgileri Yok</p>
        <p className="mb-4 text-xs text-[#6b7280]">
          {selectedApp ? `${selectedApp.name} kurulumu için test bilgilerinizi görüntüleyin.` : 'Bir uygulama seçin ve kurulum bilgilerinizi görün.'}
        </p>
        <Link href="/giris" className="inline-flex items-center gap-1.5 rounded-xl bg-[#3b82f6] px-4 py-2 text-xs font-bold text-white hover:bg-[#2563eb]">
          Giriş Yap →
        </Link>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] p-5 text-center">
        <p className="mb-2 text-sm font-semibold text-[#6b7280]">⌛ Test Süresi Doldu</p>
        <p className="mb-4 text-xs text-[#4b5563]">Premium pakete geçerek izlemeye devam edin.</p>
        <Link href="/abonelik" className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600">
          👑 Premium&apos;a Geç →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#1e2d42] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/>
          </span>
          <p className="text-xs font-semibold text-white">Giriş Bilgileriniz</p>
          <p className="text-[10px] text-[#6b7280]">Bu bilgileri uygulamaya girin</p>
        </div>
        <span className="font-mono text-xs font-bold text-emerald-400">{countdown}</span>
      </div>

      <div className="divide-y divide-[#1e2d42]">
        {[
          { label: 'SERVER URL', value: SERVER },
          { label: 'KULLANICI ADI', value: creds.username },
          { label: 'ŞİFRE', value: creds.password },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[#4b5563]">{row.label}</p>
              <p className="mt-0.5 truncate font-mono text-sm text-white">{row.value}</p>
            </div>
            <CopyBtn value={row.value} />
          </div>
        ))}

        {/* M3U açılır */}
        <div>
          <button onClick={() => setM3uOpen(v => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#0d1a2a]">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[#4b5563]">🔗 M3U URL</span>
            </div>
            <span className={`text-xs text-[#4b5563] transition-transform ${m3uOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {m3uOpen && (
            <div className="border-t border-[#1e2d42] px-4 py-3">
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-[#4b5563]">M3U URL</p>
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate font-mono text-xs text-[#8b9ab3]">{m3u}</p>
                <CopyBtn value={m3u} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── App kartı ────────────────────────────────────────────────────────────────
function AppCard({ app, onClick, selected }: { app: AppInfo; onClick: () => void; selected: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all ${selected ? 'border-[#3b82f6]/60 bg-[#0d1a2a]' : 'border-[#1e2d42] bg-[#0a1020] hover:border-[#3b82f6]/30 hover:bg-[#0c1525]'}`}>
      {/* Logo */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1e2d42] bg-[#111827]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/app-icons/${app.logo}`} alt={app.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
          }} />
        <span className="hidden h-full w-full items-center justify-center text-lg font-bold text-white">
          {app.name[0]}
        </span>
      </div>
      {/* Bilgi */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-white">{app.name}</p>
          {app.recommended && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">★ Önerilen</span>
          )}
        </div>
        <p className="text-xs text-[#6b7280]">⏱ {app.setupTime}</p>
      </div>
      <span className="text-[#4b5563] text-lg">→</span>
    </button>
  );
}

// ─── Detay paneli (seçili uygulama) ───────────────────────────────────────────
function AppDetail({ app, creds, credsLoading }: { app: AppInfo; creds: TrialCreds | null; credsLoading: boolean }) {
  const SERVER = SERVER_URL;
  const m3u = creds ? `${SERVER}/get.php?username=${creds.username}&password=${creds.password}&type=m3u&output=ts` : '';

  return (
    <div className="space-y-6">
      {/* Uygulama başlığı + indirme butonu */}
      <div className="flex items-center gap-4 rounded-2xl border border-[#1e2d42] bg-[#0a1525] px-5 py-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1e2d42] bg-[#111827]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/app-icons/${app.logo}`} alt={app.name} className="h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-lg">{app.name}</p>
          <p className="text-xs text-[#6b7280]">⏱ Kurulum süresi: {app.setupTime}</p>
        </div>
        <a href={app.downloadUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#2563eb]">
          ↗ İndir
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sol: Kurulum adımları */}
        <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Kurulum Adımları</p>
          <ol className="space-y-4">
            {app.steps.map((s, i) => (
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
        </div>

        {/* Sağ: Canlı bilgiler */}
        <div className="space-y-4">
          <CredentialsPanel creds={creds} loading={credsLoading} selectedApp={app} />

          {/* WhatsApp destek */}
          <a href={`https://wa.me/447441921660?text=${encodeURIComponent(`Merhaba, ${app.name} kurulumunda yardıma ihtiyacım var.`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366]/10 border border-[#25d366]/20 py-3 text-sm font-semibold text-[#25d366] transition-all hover:bg-[#25d366]/20">
            💬 Kurulumda Sorun Var? WhatsApp Destek
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Header bileşeni ──────────────────────────────────────────────────────────
function KurulumHeader() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';

  return (
    <div className="border-b border-[#1e2d42] bg-[#07111f]/95 backdrop-blur-md px-4 py-3 sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Galya IPTV" className="h-8 w-auto"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'inline';
            }} />
          <span className="hidden text-sm font-bold text-white">Galya <span className="text-[#3b82f6]">IPTV</span></span>
        </Link>

        <div className="hidden items-center gap-1 rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] px-2 py-1.5 md:flex">
          {[
            { href: '/',            label: 'Ana Sayfa' },
            { href: '/#paketler',   label: 'Paketler' },
            { href: '/#ozellikler', label: 'Özellikler' },
            { href: '/#sss',        label: 'SSS' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="rounded-xl px-4 py-1.5 text-sm font-medium text-[#8b9ab3] transition-colors hover:bg-[#162035] hover:text-white">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link href="/profil" className="flex items-center gap-2 text-sm font-medium text-[#8b9ab3] transition-colors hover:text-white">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1e3a5f] text-xs font-bold text-[#3b82f6]">
                  {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
                Profilim
              </Link>
              <Link href="/abonelik" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-amber-600">
                👑 Premium
              </Link>
            </>
          ) : (
            <>
              <Link href="/giris" className="text-sm font-medium text-[#8b9ab3] transition-colors hover:text-white">
                Giriş Yap
              </Link>
              <Link href="/kayit" className="rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#2563eb]">
                Ücretsiz Test Al
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Ana bileşen ──────────────────────────────────────────────────────────────
function KurulumInner() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email ?? null;
  const { creds, loading: credsLoading } = useTrialCreds(userEmail);

  const [activePlatform, setActivePlatform] = useState<PlatformId>('android');
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);

  const platform = PLATFORMS.find(p => p.id === activePlatform)!;

  // Platform değişince ilk uygulamayı seç
  useEffect(() => {
    setSelectedApp(platform.apps[0]);
  }, [activePlatform, platform.apps]);

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <KurulumHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">

        {/* Başlık */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-black tracking-tight md:text-5xl">
            {selectedApp ? selectedApp.name : 'Uygulamada İzle'}
          </h1>
          <p className="text-base text-[#8b9ab3]">Platformunu seç, uygulamayı indir ve izlemeye başla</p>
        </div>

        {/* Platform tab'ları */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => setActivePlatform(p.id)}
              className={`rounded-full border px-5 py-2 text-sm font-semibold transition-all ${activePlatform === p.id ? 'border-white bg-white text-[#07111f]' : 'border-[#1e2d42] text-[#8b9ab3] hover:border-[#3b82f6]/40 hover:text-white'}`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Uygulama kartları */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {platform.apps.map(app => (
            <AppCard key={app.id} app={app}
              selected={selectedApp?.id === app.id}
              onClick={() => setSelectedApp(app)} />
          ))}
        </div>

        {/* Seçili uygulama detayı */}
        {selectedApp && (
          <AppDetail app={selectedApp} creds={creds} credsLoading={credsLoading} />
        )}

        {/* Alt CTA */}
        <div className="mt-12 rounded-2xl border border-[#1e2d42] bg-[#0a1525] p-6 text-center">
          <p className="mb-1 text-lg font-bold text-white">Kurulumda Takıldınız mı?</p>
          <p className="mb-5 text-sm text-[#8b9ab3]">WhatsApp destek hattımız 7/24 aktif. Uzaktan kurulum desteği de sağlıyoruz.</p>
          <a href="https://wa.me/447441921660?text=Merhaba%2C%20kurulum%20konusunda%20yard%C4%B1ma%20ihtiyac%C4%B1m%20var."
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25d366] px-8 py-3.5 font-bold text-white shadow-lg transition-colors hover:bg-[#1ebe5d]">
            💬 WhatsApp Destek Hattı
          </a>
        </div>
      </main>
    </div>
  );
}

// ─── Export: SessionProvider sarmalı ─────────────────────────────────────────
export default function KurulumRehberiPage() {
  return (
    <SessionProvider>
      <KurulumInner />
    </SessionProvider>
  );
}
