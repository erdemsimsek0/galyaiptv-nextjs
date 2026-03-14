'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Tipler ───────────────────────────────────────────────────────────────────

type TrialRecord = {
  key: string;
  email: string;
  ip: string;
  selectedPackage: string;
  createdAt: number;
  createdAtFormatted: string;
  ttlSeconds: number;
  daysLeft: number;
};

type ApiResponse = {
  success: boolean;
  totalEmails: number;
  totalIPs: number;
  packageStats: Record<string, number>;
  records: TrialRecord[];
  error?: string;
};

// Spin kayıtları localStorage'dan okunur (client-side)
// Backend entegrasyonu için: GET /api/spin/records → SpinRecord[]
type SpinRecord = {
  phone: string;       // normalize edilmiş numara (5xxxxxxxxx)
  prizeIndex: number;
  prizeLabel: string;
  wonAt: number;
  wonAtFormatted: string;
  expired: boolean;
};

const SPIN_PRIZES_LABELS = [
  '%5 İndirim', '%10 İndirim', '+7 Gün Ücretsiz',
  '+15 Gün Hediye', '%20 İndirim', '%8 İndirim',
];
const PRIZE_VALID_MS = 15 * 60 * 1000;
const LS_SPIN_KEY    = 'galya_spin_entries';

function loadSpinRecords(): SpinRecord[] {
  try {
    const raw = localStorage.getItem(LS_SPIN_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, { prizeIndex: number; wonAt: number }>;
    return Object.entries(map).map(([phone, v]) => ({
      phone,
      prizeIndex: v.prizeIndex,
      prizeLabel: SPIN_PRIZES_LABELS[v.prizeIndex] ?? '?',
      wonAt: v.wonAt,
      wonAtFormatted: new Date(v.wonAt).toLocaleString('tr-TR'),
      expired: Date.now() - v.wonAt > PRIZE_VALID_MS,
    })).sort((a, b) => b.wonAt - a.wonAt);
  } catch { return []; }
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, variant }: {
  label: string; value: number | string; icon: string;
  variant: 'purple' | 'blue' | 'green' | 'orange' | 'pink';
}) {
  const styles = {
    purple: { border: 'border-purple-800/50', bg: 'bg-purple-900/10', text: 'text-purple-400' },
    blue:   { border: 'border-blue-800/50',   bg: 'bg-blue-900/10',   text: 'text-blue-400'   },
    green:  { border: 'border-green-800/50',  bg: 'bg-green-900/10',  text: 'text-green-400'  },
    orange: { border: 'border-orange-800/50', bg: 'bg-orange-900/10', text: 'text-orange-400' },
    pink:   { border: 'border-pink-800/50',   bg: 'bg-pink-900/10',   text: 'text-pink-400'   },
  }[variant];
  return (
    <div className={`rounded-xl border p-4 ${styles.border} ${styles.bg}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${styles.text}`}>{value}</div>
      <div className="text-gray-400 text-xs mt-1">{label}</div>
    </div>
  );
}

// ─── DaysLeftBadge ────────────────────────────────────────────────────────────

function DaysLeftBadge({ days }: { days: number }) {
  const cls = days <= 1
    ? 'bg-red-900/40 text-red-400 border-red-800/50'
    : days <= 3
    ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50'
    : 'bg-green-900/40 text-green-400 border-green-800/50';
  return (
    <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${cls}`}>
      {days} gün
    </span>
  );
}

// ─── Sekme bileşeni ───────────────────────────────────────────────────────────

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        active
          ? 'bg-[#7c3aed] text-white'
          : 'bg-[#1f2937] text-gray-400 hover:text-white border border-[#374151]'
      }`}>
      {children}
    </button>
  );
}

// ─── Ana Component ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [secret,      setSecret]      = useState('');
  const [authed,      setAuthed]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [data,        setData]        = useState<ApiResponse | null>(null);
  const [error,       setError]       = useState('');
  const [deletingEmail, setDeleting]  = useState<string | null>(null);
  const [search,      setSearch]      = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeTab,   setActiveTab]   = useState<'trials' | 'spin'>('trials');
  const [spinRecords, setSpinRecords] = useState<SpinRecord[]>([]);
  const [spinSearch,  setSpinSearch]  = useState('');

  const fetchData = useCallback(async (adminSecret: string) => {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/admin', { headers: { 'x-admin-secret': adminSecret } });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Hata oluştu.');
        if (res.status === 401) setAuthed(false);
      } else {
        setData(json);
        setLastRefresh(new Date());
      }
    } catch { setError('Sunucuya bağlanılamadı.'); }
    finally { setLoading(false); }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthed(true);
    await fetchData(secret);
    // Spin kayıtlarını localStorage'dan yükle
    // Backend entegrasyonu: fetch('/api/spin/records',{headers:{'x-admin-secret':secret}})
    setSpinRecords(loadSpinRecords());
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`"${email}" için 7 günlük limiti sıfırlamak istediğinize emin misiniz?`)) return;
    setDeleting(email);
    try {
      const res  = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success) { await fetchData(secret); }
      else { alert(json.error || 'Silme başarısız.'); }
    } catch { alert('Sunucuya bağlanılamadı.'); }
    finally { setDeleting(null); }
  };

  const handleDeleteSpin = (phone: string) => {
    if (!confirm(`"${phone}" numarasının çark kaydını silmek istediğinize emin misiniz?`)) return;
    try {
      const raw = localStorage.getItem(LS_SPIN_KEY);
      if (!raw) return;
      const map = JSON.parse(raw);
      delete map[phone];
      localStorage.setItem(LS_SPIN_KEY, JSON.stringify(map));
      setSpinRecords(loadSpinRecords());
    } catch { alert('Silme başarısız.'); }
    // Backend entegrasyonu: fetch('/api/spin/records',{method:'DELETE',body:JSON.stringify({phone}),headers:{'x-admin-secret':secret}})
  };

  // 30 saniyede bir otomatik yenile
  useEffect(() => {
    if (!authed || !secret) return;
    const id = setInterval(() => {
      fetchData(secret);
      setSpinRecords(loadSpinRecords()); // spin de yenile
    }, 30000);
    return () => clearInterval(id);
  }, [authed, secret, fetchData]);

  const records    = data?.records ?? [];
  const filtered   = records.filter(r =>
    search === '' || r.email.toLowerCase().includes(search.toLowerCase()) ||
    r.ip.includes(search) || r.selectedPackage.toLowerCase().includes(search.toLowerCase())
  );
  const spinFiltered = spinRecords.filter(r =>
    spinSearch === '' || r.phone.includes(spinSearch) || r.prizeLabel.toLowerCase().includes(spinSearch.toLowerCase())
  );

  const today24h   = records.filter(r => Date.now() - r.createdAt < 86400000).length;
  const packageStats = data?.packageStats ?? {};
  const maxPkg     = Math.max(...Object.values(packageStats), 1);

  // Spin istatistikleri
  const spinToday  = spinRecords.filter(r => Date.now() - r.wonAt < 86400000).length;
  const spinActive = spinRecords.filter(r => !r.expired).length;
  const prizeCount = SPIN_PRIZES_LABELS.reduce((acc, label) => {
    acc[label] = spinRecords.filter(r => r.prizeLabel === label).length;
    return acc;
  }, {} as Record<string, number>);

  // ─── Login ──────────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#111827] border border-[#7c3aed] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1 text-center">Admin Paneli</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Galya IPTV</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="Admin şifresi" value={secret}
              onChange={e => setSecret(e.target.value)}
              className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-3 outline-none focus:border-[#7c3aed] transition-colors"/>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading || !secret}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Panel ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Admin Paneli</h1>
            <p className="text-gray-500 text-xs mt-1">
              {lastRefresh ? `Son güncelleme: ${lastRefresh.toLocaleTimeString('tr-TR')}` : 'Yükleniyor...'}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { fetchData(secret); setSpinRecords(loadSpinRecords()); }}
              disabled={loading}
              className="bg-[#1f2937] hover:bg-[#374151] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm border border-[#374151] transition-colors">
              {loading ? '⟳ Yükleniyor...' : '⟳ Yenile'}
            </button>
            <button onClick={() => { setAuthed(false); setData(null); setSecret(''); }}
              className="bg-red-900/40 hover:bg-red-900/60 text-red-400 px-4 py-2 rounded-xl text-sm border border-red-800/50 transition-colors">
              Çıkış
            </button>
          </div>
        </div>

        {/* Sekme geçişi */}
        <div className="flex gap-3">
          <Tab active={activeTab === 'trials'} onClick={() => setActiveTab('trials')}>
            🧪 Test Talepleri {data && `(${data.totalEmails})`}
          </Tab>
          <Tab active={activeTab === 'spin'} onClick={() => setActiveTab('spin')}>
            🎡 Çark Kayıtları {`(${spinRecords.length})`}
          </Tab>
        </div>

        {/* ── TEST TALEPLERI SEKMESİ ─────────────────────────────────────────── */}
        {activeTab === 'trials' && (
          <>
            {/* Stat kartları */}
            {data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Toplam Açılan Test" value={data.totalEmails} icon="🧪" variant="purple"/>
                <StatCard label="Son 24 Saat"        value={today24h}         icon="📅" variant="blue"/>
                <StatCard label="Aktif Kayıt"        value={records.length}   icon="📊" variant="green"/>
                <StatCard label="Redis Kayıt"        value={data.totalIPs + data.totalEmails} icon="🗄️" variant="orange"/>
              </div>
            )}

            {/* Paket ilgi grafiği */}
            {Object.keys(packageStats).length > 0 && (
              <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-5">📦 Paket İlgisi</h2>
                <div className="space-y-3">
                  {Object.entries(packageStats).sort((a,b) => b[1]-a[1]).map(([pkg, count]) => (
                    <div key={pkg} className="flex items-center gap-3">
                      <div className="w-40 shrink-0 text-sm text-gray-300 truncate" title={pkg}>{pkg}</div>
                      <div className="flex-1 bg-[#1f2937] rounded-full h-7 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                          style={{ width:`${Math.max((count/maxPkg)*100,8)}%` }}>
                          <span className="text-xs font-bold text-white">{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Arama */}
            <input type="text" placeholder="Email, IP veya paket adı ile ara..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-3 outline-none focus:border-[#7c3aed] transition-colors text-sm"/>

            {error && (
              <div className="bg-red-900/30 border border-red-800/50 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
            )}
            {loading && !data && <div className="text-center py-20 text-gray-400">Yükleniyor...</div>}
            {!loading && data && filtered.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                {search ? 'Arama sonucu bulunamadı.' : 'Henüz test kaydı yok.'}
              </div>
            )}

            {/* Tablo */}
            {filtered.length > 0 && (
              <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1f2937] text-gray-400 text-xs uppercase tracking-wider bg-[#0f172a]">
                        <th className="text-left px-4 py-3">Email</th>
                        <th className="text-left px-4 py-3">Seçilen Paket</th>
                        <th className="text-left px-4 py-3">IP Adresi</th>
                        <th className="text-left px-4 py-3">Tarih</th>
                        <th className="text-left px-4 py-3">Kalan</th>
                        <th className="text-left px-4 py-3">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((record, i) => (
                        <tr key={record.key}
                          className={`border-b border-[#1f2937] last:border-0 hover:bg-[#1f2937]/60 transition-colors ${i%2===0?'':'bg-[#0f172a]/40'}`}>
                          <td className="px-4 py-3"><span className="text-white font-medium">{record.email}</span></td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-purple-900/40 text-purple-300 border border-purple-800/50 px-2 py-1 rounded-lg whitespace-nowrap">
                              {record.selectedPackage}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-gray-400 text-xs bg-[#1f2937] px-2 py-1 rounded">{record.ip}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{record.createdAtFormatted}</td>
                          <td className="px-4 py-3"><DaysLeftBadge days={record.daysLeft}/></td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDelete(record.email)}
                              disabled={deletingEmail === record.email}
                              className="bg-red-900/40 hover:bg-red-900/70 disabled:opacity-40 text-red-400 text-xs px-3 py-1.5 rounded-lg border border-red-800/50 transition-colors whitespace-nowrap">
                              {deletingEmail === record.email ? '...' : 'Limiti Sıfırla'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-[#1f2937] text-xs text-gray-500 flex justify-between">
                  <span>{filtered.length} kayıt</span>
                  <span>Her 30 saniyede otomatik yenilenir</span>
                </div>
              </div>
            )}

            {/* Ham Redis */}
            {data && (
              <details className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
                <summary className="cursor-pointer text-gray-400 text-sm hover:text-white transition-colors select-none">
                  🗄️ Ham Redis Verileri ({data.records.length} kayıt)
                </summary>
                <pre className="mt-4 text-xs text-green-400 font-mono overflow-auto max-h-96 bg-[#0b0b0f] p-4 rounded-xl leading-relaxed">
                  {JSON.stringify(data.records, null, 2)}
                </pre>
              </details>
            )}
          </>
        )}

        {/* ── ÇARK KAYITLARI SEKMESİ ───────────────────────────────────────── */}
        {activeTab === 'spin' && (
          <>
            {/* Stat kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Toplam Katılım" value={spinRecords.length} icon="🎡" variant="purple"/>
              <StatCard label="Son 24 Saat"    value={spinToday}          icon="📅" variant="blue"/>
              <StatCard label="Aktif Ödül"     value={spinActive}         icon="⏱" variant="green"/>
              <StatCard label="Süresi Dolmuş"  value={spinRecords.length - spinActive} icon="⌛" variant="orange"/>
            </div>

            {/* Ödül dağılımı grafiği */}
            {spinRecords.length > 0 && (
              <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-5">🏆 Ödül Dağılımı</h2>
                <div className="space-y-3">
                  {Object.entries(prizeCount)
                    .filter(([,c]) => c > 0)
                    .sort((a,b) => b[1]-a[1])
                    .map(([label, count]) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="w-40 shrink-0 text-sm text-gray-300">{label}</div>
                        <div className="flex-1 bg-[#1f2937] rounded-full h-6 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#c084fc] rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                            style={{ width:`${Math.max((count/Math.max(spinRecords.length,1))*100,6)}%` }}>
                            <span className="text-xs font-bold text-white">{count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  * Çark kayıtları şu an localStorage'dan okunuyor. Backend entegrasyonu için{' '}
                  <code className="text-purple-400">GET /api/spin/records</code> endpoint'i ekleyin.
                </p>
              </div>
            )}

            {/* Arama */}
            <input type="text" placeholder="Telefon numarası veya ödül ile ara..."
              value={spinSearch} onChange={e => setSpinSearch(e.target.value)}
              className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-3 outline-none focus:border-[#7c3aed] transition-colors text-sm"/>

            {spinRecords.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                Henüz çark kaydı yok.
                <p className="text-xs mt-2 text-gray-600">Kayıtlar kullanıcının tarayıcı localStorage&apos;ından okunur.</p>
              </div>
            )}

            {spinFiltered.length > 0 && (
              <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1f2937] text-gray-400 text-xs uppercase tracking-wider bg-[#0f172a]">
                        <th className="text-left px-4 py-3">Telefon</th>
                        <th className="text-left px-4 py-3">Kazanılan Ödül</th>
                        <th className="text-left px-4 py-3">Tarih / Saat</th>
                        <th className="text-left px-4 py-3">Durum</th>
                        <th className="text-left px-4 py-3">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spinFiltered.map((rec, i) => (
                        <tr key={rec.phone}
                          className={`border-b border-[#1f2937] last:border-0 hover:bg-[#1f2937]/60 transition-colors ${i%2===0?'':'bg-[#0f172a]/40'}`}>
                          <td className="px-4 py-3">
                            <span className="font-mono text-white">+90 {rec.phone}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-purple-900/40 text-purple-300 border border-purple-800/50 px-2 py-1 rounded-lg">
                              {rec.prizeLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                            {rec.wonAtFormatted}
                          </td>
                          <td className="px-4 py-3">
                            {rec.expired ? (
                              <span className="text-xs bg-gray-800/60 text-gray-500 border border-gray-700/50 px-2 py-1 rounded-lg">Süresi doldu</span>
                            ) : (
                              <span className="text-xs bg-green-900/40 text-green-400 border border-green-800/50 px-2 py-1 rounded-lg">Aktif</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDeleteSpin(rec.phone)}
                              className="bg-red-900/40 hover:bg-red-900/70 text-red-400 text-xs px-3 py-1.5 rounded-lg border border-red-800/50 transition-colors whitespace-nowrap">
                              Kaydı Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-[#1f2937] text-xs text-gray-500 flex justify-between">
                  <span>{spinFiltered.length} kayıt</span>
                  <span>Kayıt silince kullanıcı tekrar katılabilir</span>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
