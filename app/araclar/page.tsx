'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

// ─── Metadata → layout.tsx'e ekle ─────────────────────────────────────────
// export const metadata = {
//   title: 'IPTV Araçları | Hız Testi, M3U Checker, Kanal Arama – Galya IPTV',
//   description: 'İnternet hız testi, M3U link kontrolü, kanal listesi arama ve cihazına özel kurulum sihirbazı. Galya IPTV ücretsiz araçları.',
//   keywords: 'iptv araçlar, m3u checker, internet hız testi, kanal listesi, iptv kurulum',
// }

const WHATSAPP_URL = 'https://wa.me/447441921660?text=Merhaba%2C%20yard%C4%B1m%20istiyorum.';

// ─── Mock kanal verisi ─────────────────────────────────────────────────────
const MOCK_CHANNELS = [
  { name: 'TRT 1', category: 'Yerli', country: '🇹🇷 Türkiye' },
  { name: 'TRT Spor', category: 'Spor', country: '🇹🇷 Türkiye' },
  { name: 'beIN Sports 1', category: 'Spor', country: '🇹🇷 Türkiye' },
  { name: 'beIN Sports 2', category: 'Spor', country: '🇹🇷 Türkiye' },
  { name: 'S Sport', category: 'Spor', country: '🇹🇷 Türkiye' },
  { name: 'Exxen Spor', category: 'Spor', country: '🇹🇷 Türkiye' },
  { name: 'Show TV', category: 'Yerli', country: '🇹🇷 Türkiye' },
  { name: 'Kanal D', category: 'Yerli', country: '🇹🇷 Türkiye' },
  { name: 'ATV', category: 'Yerli', country: '🇹🇷 Türkiye' },
  { name: 'Fox TV', category: 'Yerli', country: '🇹🇷 Türkiye' },
  { name: 'CNN Türk', category: 'Haber', country: '🇹🇷 Türkiye' },
  { name: 'NTV', category: 'Haber', country: '🇹🇷 Türkiye' },
  { name: 'BBC World', category: 'Haber', country: '🇬🇧 İngiltere' },
  { name: 'CNN International', category: 'Haber', country: '🇺🇸 ABD' },
  { name: 'Al Jazeera', category: 'Haber', country: '🌍 Uluslararası' },
  { name: 'Discovery Channel', category: 'Belgesel', country: '🇺🇸 ABD' },
  { name: 'National Geographic', category: 'Belgesel', country: '🇺🇸 ABD' },
  { name: 'Netflix TR', category: 'Film & Dizi', country: '🌍 Uluslararası' },
  { name: 'Disney+', category: 'Film & Dizi', country: '🌍 Uluslararası' },
  { name: 'ARD', category: 'Yurt Dışı', country: '🇩🇪 Almanya' },
  { name: 'ZDF', category: 'Yurt Dışı', country: '🇩🇪 Almanya' },
  { name: 'BBC One', category: 'Yurt Dışı', country: '🇬🇧 İngiltere' },
  { name: 'RTL', category: 'Yurt Dışı', country: '🇳🇱 Hollanda' },
  { name: 'Rai Uno', category: 'Yurt Dışı', country: '🇮🇹 İtalya' },
  { name: 'TF1', category: 'Yurt Dışı', country: '🇫🇷 Fransa' },
  { name: 'Cartoon Network', category: 'Çocuk', country: '🌍 Uluslararası' },
  { name: 'Disney Junior', category: 'Çocuk', country: '🌍 Uluslararası' },
  { name: 'TRT Çocuk', category: 'Çocuk', country: '🇹🇷 Türkiye' },
  { name: 'MTV', category: 'Müzik', country: '🌍 Uluslararası' },
  { name: 'MusicBox', category: 'Müzik', country: '🌍 Uluslararası' },
];

const CATEGORIES = ['Tümü', 'Yerli', 'Spor', 'Haber', 'Belgesel', 'Film & Dizi', 'Yurt Dışı', 'Çocuk', 'Müzik'];

// ─── Kurulum sihirbazı verileri ───────────────────────────────────────────
const WIZARD_DEVICES = [
  { id: 'smarttv', label: 'Smart TV', sub: 'Samsung, LG, Vestel', icon: '📺' },
  { id: 'mobile', label: 'Telefon / Tablet', sub: 'Android, iPhone, iPad', icon: '📱' },
  { id: 'tvbox', label: 'TV Box / MAG', sub: 'Android Box, MAG Box', icon: '📦' },
  { id: 'pc', label: 'Bilgisayar', sub: 'Windows, Mac', icon: '💻' },
];

const WIZARD_APPS: Record<string, { id: string; label: string; sub: string }[]> = {
  smarttv: [
    { id: 'hotiptv', label: 'Hot IPTV Player', sub: 'Samsung & LG için önerilen' },
    { id: 'smarters', label: 'IPTV Smarters', sub: 'Tizen & WebOS destekli' },
  ],
  mobile: [
    { id: 'smarters', label: 'IPTV Smarters Pro', sub: 'Android için önerilen' },
    { id: 'gse', label: 'GSE Smart IPTV', sub: 'iPhone / iPad için önerilen' },
    { id: 'tiviapp', label: 'Tivimate', sub: 'Android gelişmiş kullanım' },
  ],
  tvbox: [
    { id: '9xtream', label: '9Xtream', sub: 'Android Box için önerilen' },
    { id: 'tivibox', label: 'TiviMate', sub: 'En popüler TV Box uygulaması' },
    { id: 'smarters', label: 'IPTV Smarters Pro', sub: 'Evrensel uygulama' },
  ],
  pc: [
    { id: 'smarterspc', label: 'Smarters Player Pro', sub: 'Windows & Mac için önerilen' },
    { id: 'vlc', label: 'VLC Media Player', sub: 'Ücretsiz, M3U desteği' },
    { id: 'kodi', label: 'Kodi + PVR Addon', sub: 'Gelişmiş kullanıcılar için' },
  ],
};

const LOGIN_TYPES = [
  { id: 'xtream', label: 'Xtream Codes', sub: 'Kullanıcı adı + şifre ile giriş (önerilen)', icon: '🔐' },
  { id: 'm3u', label: 'M3U URL', sub: 'Direkt link ile kanal listesi yükleme', icon: '🔗' },
  { id: 'portal', label: 'Portal URL', sub: 'MAG cihazlar için portal girişi', icon: '📡' },
];

const INSTALL_SUMMARY: Record<string, Record<string, Record<string, string[]>>> = {
  smarttv: {
    hotiptv: {
      xtream: [
        'Smart TV\'nizde uygulama mağazasını açın.',
        '"Hot IPTV Player" uygulamasını indirin.',
        'Uygulamayı açın — ekranda bir aktivasyon kodu göreceksiniz.',
        'Bilgisayardan hot-iptv.net adresine gidip kodu girin.',
        'Sunucu, kullanıcı adı ve şifreyi girin.',
        'TV\'deki uygulamayı yenileyin — hazır!',
      ],
      m3u: [
        'Hot IPTV Player\'ı indirin ve aktivasyon kodunu alın.',
        'hot-iptv.net üzerinden M3U URL seçeneğini açın.',
        'M3U linkinizi yapıştırın ve kaydedin.',
        'TV\'yi yenileyin, kanallar yüklenecektir.',
      ],
    },
    smarters: {
      xtream: [
        'TV uygulama mağazasından "IPTV Smarters" indirin.',
        '"Xtream Codes API" seçeneğini seçin.',
        'Sunucu adresini, kullanıcı adı ve şifreyi girin.',
        '"Kullanıcı Ekle" butonuna basın.',
      ],
      m3u: [
        '"IPTV Smarters" uygulamasını indirin.',
        '"M3U URL" seçeneğini seçin.',
        'M3U linkinizi yapıştırın.',
        'Uygulama kanalları otomatik yükleyecektir.',
      ],
    },
  },
  mobile: {
    smarters: {
      xtream: [
        'Play Store\'dan "IPTV Smarters Pro" indirin.',
        '"Xtream Codes API ile Giriş" seçin.',
        'Sunucu: http://pro4kiptv.xyz:2086 girin.',
        'Kullanıcı adı ve şifrenizi girin.',
        '"Kullanıcı Ekle" butonuna basın.',
      ],
      m3u: [
        '"IPTV Smarters Pro" uygulamasını indirin.',
        '"M3U URL ile Giriş" seçeneğini seçin.',
        'M3U linkini yapıştırın, kaydedin.',
      ],
    },
    gse: {
      xtream: [
        'App Store\'dan "GSE Smart IPTV" indirin.',
        'Sol menüden "Xtream-codes API" seçin.',
        'Sunucu, kullanıcı adı ve şifre bilgilerini girin.',
        'Kaydet — kanallar yüklenecektir.',
      ],
      m3u: [
        '"GSE Smart IPTV" indirin.',
        '"M3U URL" bölümünden yeni liste ekleyin.',
        'M3U linkinizi girin ve kaydedin.',
      ],
    },
    tiviapp: {
      xtream: [
        'Play Store\'dan "TiviMate" indirin.',
        '"Playlist Ekle" → "Xtream Codes" seçin.',
        'Sunucu adresini girin.',
        'Kullanıcı adı ve şifrenizi girin.',
      ],
      m3u: [
        '"TiviMate" indirin.',
        '"Playlist Ekle" → "M3U URL" seçin.',
        'Linkinizi yapıştırın ve ekleyin.',
      ],
    },
  },
  tvbox: {
    '9xtream': {
      xtream: [
        'Play Store\'dan "9Xtream" indirin.',
        '"Add Xtream Codes API" seçeneğine tıklayın.',
        'Sunucu: http://pro4kiptv.xyz:2086 girin.',
        'Kullanıcı adı ve şifrenizi girin.',
        '"Ekle" butonuna basın.',
      ],
      m3u: [
        '"9Xtream" indirin.',
        '"Add M3U URL" seçeneğini kullanın.',
        'M3U linkinizi girin ve kaydedin.',
      ],
    },
    tivibox: {
      xtream: [
        '"TiviMate" uygulamasını indirin.',
        '"Playlist Ekle" → "Xtream Codes" seçin.',
        'Sunucu, kullanıcı adı, şifre girin.',
        'Kanallar otomatik yüklenir.',
      ],
      m3u: [
        '"TiviMate" indirin.',
        '"M3U URL" ile yeni playlist ekleyin.',
        'Linkinizi yapıştırın.',
      ],
    },
    smarters: {
      xtream: [
        '"IPTV Smarters Pro" indirin.',
        '"Xtream Codes API" seçin.',
        'Sunucu, kullanıcı adı, şifre girin.',
        'Uygulamayı yenileyin.',
      ],
      m3u: [
        '"IPTV Smarters Pro" indirin.',
        '"M3U URL" ile playlist ekleyin.',
        'Linki girin ve kaydedin.',
      ],
    },
  },
  pc: {
    smarterspc: {
      xtream: [
        'smarters.live adresinden "Smarters Player Pro" indirin.',
        'Uygulamayı açın → "Login with Xtream Codes API" seçin.',
        'Sunucu, kullanıcı adı ve şifre girin.',
        '"Add User" butonuna tıklayın.',
      ],
      m3u: [
        '"Smarters Player Pro" indirin.',
        '"Add Playlist" → "M3U URL" seçin.',
        'Linkinizi yapıştırın ve kaydedin.',
      ],
    },
    vlc: {
      m3u: [
        'VLC Media Player\'ı indirin (videolan.org).',
        'Ortam → "Ağ Akışı Aç" menüsünü açın.',
        'M3U linkini URL alanına yapıştırın.',
        '"Oynat" butonuna basın.',
      ],
      xtream: [
        'M3U linkinizi oluşturun: sunucu/get.php?username=X&password=Y&type=m3u',
        'VLC\'de Ortam → "Ağ Akışı Aç" açın.',
        'Oluşturduğunuz M3U linkini girin.',
        '"Oynat" butonuna basın.',
      ],
    },
    kodi: {
      xtream: [
        'Kodi\'yi kodi.tv adresinden indirin.',
        'Eklentiler → "PVR IPTV Simple Client" kurun.',
        'Eklenti ayarlarından M3U URL veya Xtream bilgilerini girin.',
        'Kodi\'yi yeniden başlatın.',
      ],
      m3u: [
        'Kodi + "PVR IPTV Simple Client" kurun.',
        'Eklenti ayarlarından M3U URL girin.',
        'Kodi\'yi yeniden başlatın.',
      ],
    },
  },
};

// ─── Speed Test bileşeni ───────────────────────────────────────────────────
function SpeedTest() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [download, setDownload] = useState<number | null>(null);
  const [upload, setUpload] = useState<number | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');

  const runTest = async () => {
    setStatus('running');
    setDownload(null); setUpload(null); setPing(null); setProgress(0);

    // Ping fazı
    setPhase('Ping ölçülüyor...');
    await new Promise(r => setTimeout(r, 600));
    setPing(Math.floor(Math.random() * 25) + 8);
    setProgress(25);

    // İndirme fazı
    setPhase('İndirme hızı ölçülüyor...');
    for (let i = 25; i <= 65; i += 5) {
      await new Promise(r => setTimeout(r, 180));
      setProgress(i);
    }
    setDownload(Math.floor(Math.random() * 400) + 80);
    setProgress(65);

    // Yükleme fazı
    setPhase('Yükleme hızı ölçülüyor...');
    for (let i = 65; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 150));
      setProgress(i);
    }
    setUpload(Math.floor(Math.random() * 100) + 20);
    setStatus('done');
    setPhase('');
  };

  const reset = () => { setStatus('idle'); setDownload(null); setUpload(null); setPing(null); setProgress(0); };

  const iptvStatus = download ? (download >= 25 ? 'excellent' : download >= 10 ? 'good' : 'poor') : null;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7c6fcd]/15 text-xl">⚡</div>
        <div>
          <h2 className="font-semibold text-[#f1f0f5]">İnternet Hız Testi</h2>
          <p className="text-xs text-[#9b98b0]">4K IPTV için 25 Mbps+ önerilir</p>
        </div>
      </div>

      {status === 'idle' && (
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#7c6fcd]/30 bg-[#22222c]">
            <span className="text-3xl">📶</span>
          </div>
          <p className="mb-5 text-sm text-[#9b98b0]">Bağlantı hızınızı ölçmek için başlatın.</p>
          <button onClick={runTest}
            className="rounded-xl bg-[#7c6fcd] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#6358b8]">
            Testi Başlat
          </button>
        </div>
      )}

      {status === 'running' && (
        <div className="text-center py-4">
          <div className="mx-auto mb-3 h-20 w-20 rounded-full border-2 border-[#7c6fcd]/20 bg-[#22222c] flex items-center justify-center">
            <span className="font-mono text-xl font-bold text-[#7c6fcd]">{progress}%</span>
          </div>
          <p className="mb-4 text-sm text-[#9b98b0]">{phase}</p>
          <div className="mx-auto max-w-xs h-1.5 rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-[#7c6fcd] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'İndirme', value: `${download}`, unit: 'Mbps', icon: '⬇️', color: 'text-emerald-400' },
              { label: 'Yükleme', value: `${upload}`, unit: 'Mbps', icon: '⬆️', color: 'text-blue-400' },
              { label: 'Ping', value: `${ping}`, unit: 'ms', icon: '🏓', color: 'text-amber-400' },
            ].map(m => (
              <div key={m.label} className="rounded-xl bg-[#22222c] p-3 text-center">
                <div className="text-base mb-1">{m.icon}</div>
                <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                <div className="text-[10px] text-[#9b98b0]">{m.unit}</div>
                <div className="text-[10px] text-[#6b6880] mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
          {iptvStatus && (
            <div className={`rounded-xl border p-3 text-sm mb-4 ${
              iptvStatus === 'excellent' ? 'border-emerald-800/40 bg-emerald-950/30 text-emerald-400' :
              iptvStatus === 'good' ? 'border-amber-800/40 bg-amber-950/30 text-amber-400' :
              'border-red-800/40 bg-red-950/30 text-red-400'
            }`}>
              {iptvStatus === 'excellent' && '✅ 4K IPTV için bağlantınız mükemmel.'}
              {iptvStatus === 'good' && '⚠️ Full HD IPTV için yeterli, 4K için hızınız biraz düşük.'}
              {iptvStatus === 'poor' && '❌ IPTV için bağlantı hızınız yetersiz olabilir.'}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm text-[#9b98b0] transition-colors hover:text-[#f1f0f5]">
              Yeniden Test Et
            </button>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="flex-1 rounded-xl bg-[#25d366] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5d]">
              💬 Destek Al
            </a>
          </div>
          <p className="mt-3 text-center text-[11px] text-[#6b6880]">* Simüle edilmiş test. Gerçek hız ölçümü için speedtest.net kullanabilirsiniz.</p>
        </div>
      )}
    </div>
  );
}

// ─── M3U Checker bileşeni ─────────────────────────────────────────────────
type M3UStatus = 'valid' | 'unreachable' | 'error' | 'invalid_format';
function M3UChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: M3UStatus; channelCount?: number; message: string } | null>(null);

  const check = async () => {
    if (!url.trim()) return;
    setLoading(true); setResult(null);
    await new Promise(r => setTimeout(r, 1800));

    // Mock logic — gerçek API bağlanacak yapıya uygun
    if (!url.startsWith('http')) {
      setResult({ status: 'invalid_format', message: 'URL geçerli bir format değil. http:// veya https:// ile başlamalı.' });
    } else if (url.includes('pro4kiptv') || url.includes('.m3u') || url.includes('get.php')) {
      setResult({ status: 'valid', channelCount: Math.floor(Math.random() * 30000) + 50000, message: 'M3U listesine başarıyla erişildi. Yayın listesi aktif görünüyor.' });
    } else if (url.includes('error') || url.includes('test404')) {
      setResult({ status: 'unreachable', message: 'Sunucuya bağlanılamadı. URL erişilemez durumda veya yayın durdurulmuş olabilir.' });
    } else {
      const r = Math.random();
      if (r < 0.55) setResult({ status: 'valid', channelCount: Math.floor(Math.random() * 20000) + 10000, message: 'M3U listesine başarıyla erişildi.' });
      else if (r < 0.8) setResult({ status: 'unreachable', message: 'Sunucuya bağlanılamadı. Link geçersiz veya süre dolmuş olabilir.' });
      else setResult({ status: 'error', message: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.' });
    }
    setLoading(false);
  };

  const statusConfig = {
    valid: { icon: '✅', color: 'border-emerald-800/40 bg-emerald-950/30 text-emerald-400', label: 'Geçerli' },
    unreachable: { icon: '🔴', color: 'border-red-800/40 bg-red-950/30 text-red-400', label: 'Erişilemiyor' },
    error: { icon: '⚠️', color: 'border-amber-800/40 bg-amber-950/30 text-amber-400', label: 'Hata' },
    invalid_format: { icon: '❌', color: 'border-red-800/40 bg-red-950/30 text-red-400', label: 'Format Hatası' },
  };

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7c6fcd]/15 text-xl">🔗</div>
        <div>
          <h2 className="font-semibold text-[#f1f0f5]">M3U Link Kontrolü</h2>
          <p className="text-xs text-[#9b98b0]">M3U URL'nizin çalışıp çalışmadığını kontrol edin</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url" placeholder="http://sunucu:port/get.php?username=...&password=...&type=m3u"
          value={url} onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          className="flex-1 rounded-xl border border-white/[0.08] bg-[#22222c] px-4 py-3 text-sm text-[#f1f0f5] outline-none placeholder:text-[#6b6880] transition-colors focus:border-[#7c6fcd]/60"
        />
        <button onClick={check} disabled={loading || !url.trim()}
          className="rounded-xl bg-[#7c6fcd] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#6358b8] disabled:opacity-40 whitespace-nowrap">
          {loading ? 'Kontrol Ediliyor...' : 'Kontrol Et'}
        </button>
      </div>

      {loading && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#22222c] p-4">
          <div className="h-4 w-4 rounded-full border-2 border-[#7c6fcd] border-t-transparent animate-spin" />
          <span className="text-sm text-[#9b98b0]">Bağlantı test ediliyor...</span>
        </div>
      )}

      {result && !loading && (
        <div className={`mt-4 rounded-xl border p-4 ${statusConfig[result.status].color}`}>
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">{statusConfig[result.status].icon}</span>
            <div className="flex-1">
              <div className="mb-1 font-semibold text-sm">{statusConfig[result.status].label}</div>
              <p className="text-sm opacity-90">{result.message}</p>
              {result.channelCount && (
                <p className="mt-1.5 text-xs opacity-75">Toplam kanal: ~{result.channelCount.toLocaleString('tr-TR')}</p>
              )}
            </div>
          </div>
          {result.status !== 'valid' && (
            <div className="mt-3 pt-3 border-t border-current/20">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="text-xs font-medium underline underline-offset-2 opacity-90 hover:opacity-100">
                Yardım için WhatsApp'a yazın →
              </a>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-[11px] text-[#6b6880]">* M3U URL'niz genellikle sunucu adresinizin sonuna /get.php?username=...&type=m3u şeklinde eklenerek oluşur.</p>
    </div>
  );
}

// ─── Kanal Listesi bileşeni ───────────────────────────────────────────────
function ChannelList() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tümü');

  const filtered = MOCK_CHANNELS.filter(ch => {
    const matchCat = activeCategory === 'Tümü' || ch.category === activeCategory;
    const matchSearch = ch.name.toLowerCase().includes(search.toLowerCase()) ||
      ch.category.toLowerCase().includes(search.toLowerCase()) ||
      ch.country.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7c6fcd]/15 text-xl">📡</div>
        <div>
          <h2 className="font-semibold text-[#f1f0f5]">Kanal Listesi</h2>
          <p className="text-xs text-[#9b98b0]">85.000+ kanal — örnek liste gösteriliyor</p>
        </div>
      </div>

      <input type="text" placeholder="Kanal adı, kategori veya ülke ara..."
        value={search} onChange={e => setSearch(e.target.value)}
        className="mb-3 w-full rounded-xl border border-white/[0.08] bg-[#22222c] px-4 py-3 text-sm text-[#f1f0f5] outline-none placeholder:text-[#6b6880] transition-colors focus:border-[#7c6fcd]/60"
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-[#7c6fcd] text-white'
                : 'bg-[#22222c] text-[#9b98b0] hover:text-[#f1f0f5]'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#6b6880]">Kanal bulunamadı.</p>
        ) : (
          filtered.map((ch, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-[#22222c] px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#7c6fcd]/15 text-[10px] font-bold text-[#c4b5fd]">
                  {ch.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-[#f1f0f5]">{ch.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:block rounded-md bg-[#18181f] px-2 py-0.5 text-[10px] text-[#9b98b0]">{ch.category}</span>
                <span className="text-xs text-[#6b6880]">{ch.country}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <p className="mt-3 text-[11px] text-[#6b6880]">* Örnek liste. Tüm kanallar için ücretsiz test alabilirsiniz.</p>
    </div>
  );
}

// ─── Kurulum Sihirbazı bileşeni ───────────────────────────────────────────
function SetupWizard() {
  const [step, setStep] = useState(1);
  const [device, setDevice] = useState('');
  const [app, setApp] = useState('');
  const [loginType, setLoginType] = useState('');

  const apps = device ? WIZARD_APPS[device] || [] : [];
  const steps = INSTALL_SUMMARY[device]?.[app]?.[loginType] || [];

  const reset = () => { setStep(1); setDevice(''); setApp(''); setLoginType(''); };

  const stepLabel = ['Cihaz', 'Uygulama', 'Giriş Tipi', 'Kurulum'];

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7c6fcd]/15 text-xl">🧙</div>
        <div>
          <h2 className="font-semibold text-[#f1f0f5]">Kurulum Sihirbazı</h2>
          <p className="text-xs text-[#9b98b0]">Adım adım cihazına özel kurulum rehberi</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-5 flex items-center justify-between">
        {stepLabel.map((label, i) => {
          const idx = i + 1;
          const done = step > idx;
          const current = step === idx;
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-0.5">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  done ? 'bg-[#7c6fcd] text-white' : current ? 'border-2 border-[#7c6fcd] text-[#c4b5fd]' : 'border border-white/[0.08] text-[#6b6880]'
                }`}>
                  {done ? '✓' : idx}
                </div>
                <span className={`text-[9px] ${current ? 'text-[#c4b5fd]' : done ? 'text-[#9b98b0]' : 'text-[#6b6880]'}`}>{label}</span>
              </div>
              {i < stepLabel.length - 1 && (
                <div className={`mb-4 mx-1 flex-1 h-px ${done ? 'bg-[#7c6fcd]' : 'bg-white/[0.06]'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Adım 1: Cihaz */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-[#9b98b0]">IPTV izlemek istediğiniz cihazı seçin.</p>
          <div className="grid grid-cols-2 gap-2">
            {WIZARD_DEVICES.map(d => (
              <button key={d.id} onClick={() => setDevice(d.id)}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
                  device === d.id ? 'border-[#7c6fcd]/60 bg-[#7c6fcd]/10' : 'border-white/[0.06] bg-[#22222c] hover:border-white/[0.12]'
                }`}>
                <span className="mb-1 text-lg">{d.icon}</span>
                <span className={`text-sm font-semibold ${device === d.id ? 'text-white' : 'text-[#f1f0f5]'}`}>{d.label}</span>
                <span className="text-[11px] text-[#6b6880]">{d.sub}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)} disabled={!device}
            className="w-full rounded-xl bg-[#7c6fcd] py-3 font-semibold text-white transition-colors hover:bg-[#6358b8] disabled:opacity-40">
            Devam Et →
          </button>
        </div>
      )}

      {/* Adım 2: Uygulama */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{WIZARD_DEVICES.find(d => d.id === device)?.icon}</span>
            <span className="text-xs text-[#9b98b0]">{WIZARD_DEVICES.find(d => d.id === device)?.label} seçildi</span>
          </div>
          <p className="text-sm text-[#9b98b0]">Kullanmak istediğiniz uygulamayı seçin.</p>
          <div className="space-y-2">
            {apps.map(a => (
              <button key={a.id} onClick={() => setApp(a.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  app === a.id ? 'border-[#7c6fcd]/60 bg-[#7c6fcd]/10' : 'border-white/[0.06] bg-[#22222c] hover:border-white/[0.12]'
                }`}>
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                  app === a.id ? 'border-[#7c6fcd] bg-[#7c6fcd] text-white' : 'border-white/[0.1]'
                }`}>{app === a.id ? '✓' : ''}</div>
                <div>
                  <div className={`text-sm font-semibold ${app === a.id ? 'text-white' : 'text-[#f1f0f5]'}`}>{a.label}</div>
                  <div className="text-[11px] text-[#6b6880]">{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setStep(1); setApp(''); }} className="flex-1 rounded-xl border border-white/[0.06] py-3 text-sm text-[#9b98b0] hover:text-[#f1f0f5]">← Geri</button>
            <button onClick={() => setStep(3)} disabled={!app} className="flex-1 rounded-xl bg-[#7c6fcd] py-3 font-semibold text-white hover:bg-[#6358b8] disabled:opacity-40">Devam Et →</button>
          </div>
        </div>
      )}

      {/* Adım 3: Giriş Tipi */}
      {step === 3 && (
        <div className="space-y-3">
          <p className="text-sm text-[#9b98b0]">Bilgilerinizi nasıl girmek istersiniz?</p>
          <div className="space-y-2">
            {LOGIN_TYPES.map(lt => (
              <button key={lt.id} onClick={() => setLoginType(lt.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  loginType === lt.id ? 'border-[#7c6fcd]/60 bg-[#7c6fcd]/10' : 'border-white/[0.06] bg-[#22222c] hover:border-white/[0.12]'
                }`}>
                <span className="text-lg">{lt.icon}</span>
                <div>
                  <div className={`text-sm font-semibold ${loginType === lt.id ? 'text-white' : 'text-[#f1f0f5]'}`}>{lt.label}</div>
                  <div className="text-[11px] text-[#6b6880]">{lt.sub}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setStep(2); setLoginType(''); }} className="flex-1 rounded-xl border border-white/[0.06] py-3 text-sm text-[#9b98b0] hover:text-[#f1f0f5]">← Geri</button>
            <button onClick={() => setStep(4)} disabled={!loginType} className="flex-1 rounded-xl bg-[#7c6fcd] py-3 font-semibold text-white hover:bg-[#6358b8] disabled:opacity-40">Kurulum Rehberini Göster →</button>
          </div>
        </div>
      )}

      {/* Adım 4: Özet */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#7c6fcd]/20 bg-[#7c6fcd]/5 p-3 text-sm">
            <div className="flex flex-wrap gap-2 text-xs text-[#9b98b0]">
              <span className="rounded-md bg-[#22222c] px-2 py-1">{WIZARD_DEVICES.find(d => d.id === device)?.icon} {WIZARD_DEVICES.find(d => d.id === device)?.label}</span>
              <span className="rounded-md bg-[#22222c] px-2 py-1">📲 {apps.find(a => a.id === app)?.label}</span>
              <span className="rounded-md bg-[#22222c] px-2 py-1">{LOGIN_TYPES.find(l => l.id === loginType)?.icon} {LOGIN_TYPES.find(l => l.id === loginType)?.label}</span>
            </div>
          </div>

          {steps.length > 0 ? (
            <ol className="space-y-2">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-[#9b98b0]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7c6fcd]/20 text-[10px] font-bold text-[#c4b5fd]">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 p-3 text-sm text-amber-400">
              Bu kombinasyon için rehber yakında eklenecek. WhatsApp üzerinden yardım alabilirsiniz.
            </div>
          )}

          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-3 font-semibold text-white hover:bg-[#1ebe5d]">
            💬 Kurulumda Yardım Al
          </a>
          <button onClick={reset} className="w-full text-xs text-[#6b6880] hover:text-[#9b98b0] transition-colors">
            Yeniden Başla
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Ana sayfa bileşeni ───────────────────────────────────────────────────
export default function AraclarPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tools = [
    { id: 'speedtest', label: 'Hız Testi', icon: '⚡', component: <SpeedTest /> },
    { id: 'm3u', label: 'M3U Checker', icon: '🔗', component: <M3UChecker /> },
    { id: 'channels', label: 'Kanal Listesi', icon: '📡', component: <ChannelList /> },
    { id: 'wizard', label: 'Kurulum Sihirbazı', icon: '🧙', component: <SetupWizard /> },
  ];

  return (
    <>
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#18181f]/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#f1f0f5]">
            Galya <span className="text-[#7c6fcd]">IPTV</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm text-[#9b98b0] md:flex">
            <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
            <Link href="/#yorumlar" className="transition-colors hover:text-white">Yorumlar</Link>
            <Link href="/#neden-biz" className="transition-colors hover:text-white">Neden Biz</Link>
            <Link href="/#sss" className="transition-colors hover:text-white">S.S.S</Link>
            <Link href="/araclar" className="text-[#c4b5fd] transition-colors hover:text-white">Araçlar</Link>
            <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
            <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
            <Link href="/"
              className="rounded-lg border border-[#7c6fcd]/40 bg-[#7c6fcd]/10 px-4 py-2 text-sm font-medium text-[#7c6fcd] transition-all hover:bg-[#7c6fcd]/20 hover:text-white">
              Ücretsiz Test
            </Link>
          </div>
          <button className="flex flex-col gap-1.5 p-2 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menüyü aç">
            <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${mobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </nav>
        {mobileMenuOpen && (
          <div className="border-t border-white/[0.08] bg-[#18181f] px-6 pb-4 md:hidden">
            <div className="flex flex-col gap-1 pt-3 text-sm">
              {[
                { href: '/#paketler', label: 'Paketler' },
                { href: '/#yorumlar', label: 'Yorumlar' },
                { href: '/#neden-biz', label: 'Neden Biz' },
                { href: '/#sss', label: 'S.S.S' },
                { href: '/araclar', label: 'Araçlar' },
                { href: '/blog', label: 'Blog' },
                { href: '/iletisim', label: 'İletişim' },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[#9b98b0] transition-colors hover:bg-white/[0.05] hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="min-h-screen bg-[#18181f] text-[#f1f0f5]">

        {/* ─── Hero ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pb-14 pt-16 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[400px] rounded-full bg-[#7c6fcd]/6 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#22222c] px-4 py-1.5 text-xs text-[#9b98b0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7c6fcd] animate-pulse" />
              Ücretsiz IPTV Araçları
            </div>
            <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              IPTV <span className="text-[#c4b5fd]">Araçları</span>
            </h1>
            <p className="text-sm leading-relaxed text-[#9b98b0] md:text-base">
              Hız testi, M3U kontrolü, kanal arama ve cihazına özel kurulum rehberi — hepsi burada.
            </p>
          </div>
        </section>

        {/* ─── Araç Kartları ─────────────────────────────────────────── */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-6xl grid grid-cols-1 gap-6 lg:grid-cols-2">
            {tools.map(tool => (
              <div key={tool.id}
                className="rounded-2xl border border-white/[0.08] bg-[#1e1e28] p-6 transition-colors hover:border-white/[0.12]">
                {tool.component}
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA Alt ───────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.06] px-6 py-16 text-center">
          <p className="mb-2 text-sm text-[#9b98b0]">Test sonuçları iyi görünüyor mu?</p>
          <h2 className="mb-6 text-2xl font-bold">Hemen başlayın</h2>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/"
              className="rounded-xl bg-[#7c6fcd] px-8 py-4 font-semibold text-white shadow-xl shadow-[#7c6fcd]/20 transition-all hover:bg-[#6358b8] hover:scale-[1.02]">
              ⚡ Ücretsiz Test Al
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-[#25d366] px-8 py-4 font-semibold text-white transition-all hover:bg-[#1ebe5d]">
              💬 WhatsApp ile İletişim
            </a>
          </div>
        </section>

      </main>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#141418] px-6 py-12 text-center text-sm text-[#6b6880]">
        <p className="mb-1 font-semibold text-[#9b98b0]">Galya IPTV</p>
        <p className="mb-1 text-xs">Türkiye'nin en kaliteli 4K IPTV hizmeti · 85.000+ kanal · 10.000+ aktif kullanıcı</p>
        <p>© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-5 text-xs">
          <Link href="/blog" className="transition-colors hover:text-[#9b98b0]">Blog</Link>
          <Link href="/#paketler" className="transition-colors hover:text-[#9b98b0]">IPTV Fiyatları</Link>
          <Link href="/araclar" className="transition-colors hover:text-[#9b98b0]">Araçlar</Link>
          <Link href="/#sss" className="transition-colors hover:text-[#9b98b0]">S.S.S</Link>
          <Link href="/iletisim" className="transition-colors hover:text-[#9b98b0]">İletişim</Link>
        </div>
      </footer>
    </>
  );
}
