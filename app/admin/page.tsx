'use client';

import { useState, useEffect, useCallback } from 'react';

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

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, variant }: {
  label: string; value: number; icon: string;
  variant: 'purple' | 'blue' | 'green' | 'orange';
}) {
  const border = { purple: 'border-purple-800/50', blue: 'border-blue-800/50', green: 'border-green-800/50', orange: 'border-orange-800/50' }[variant];
  const bg    = { purple: 'bg-purple-900/10',     blue: 'bg-blue-900/10',     green: 'bg-green-900/10',     orange: 'bg-orange-900/10'     }[variant];
  const text  = { purple: 'text-purple-400',      blue: 'text-blue-400',      green: 'text-green-400',      orange: 'text-orange-400'      }[variant];
  return (
    <div className={`rounded-xl border p-4 ${border} ${bg}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${text}`}>{value}</div>
      <div className="text-gray-400 text-xs mt-1">{label}</div>
    </div>
  );
}

// ─── Days Left Badge ──────────────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [secret, setSecret]         = useState('');
  const [authed, setAuthed]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [data, setData]             = useState<ApiResponse | null>(null);
  const [error, setError]           = useState('');
  const [deletingEmail, setDeleting] = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async (adminSecret: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin', {
        headers: { 'x-admin-secret': adminSecret },
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Hata oluştu.');
        if (res.status === 401) setAuthed(false);
      } else {
        setData(json);
        setLastRefresh(new Date());
      }
    } catch {
      setError('Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthed(true);
    await fetchData(secret);
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`"${email}" için 7 günlük limiti sıfırlamak istediğinize emin misiniz?`)) return;
    setDeleting(email);
    try {
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchData(secret);
      } else {
        alert(json.error || 'Silme başarısız.');
      }
    } catch {
      alert('Sunucuya bağlanılamadı.');
    } finally {
      setDeleting(null);
    }
  };

  // 30 saniyede bir otomatik yenile
  useEffect(() => {
    if (!authed || !secret) return;
    const id = setInterval(() => fetchData(secret), 30000);
    return () => clearInterval(id);
  }, [authed, secret, fetchData]);

  const records = data?.records ?? [];
  const filtered = records.filter((r) =>
    search === '' ||
    r.email.toLowerCase().includes(search.toLowerCase()) ||
    r.ip.includes(search) ||
    r.selectedPackage.toLowerCase().includes(search.toLowerCase())
  );

  const today24h = records.filter((r) => Date.now() - r.createdAt < 86400000).length;
  const packageStats = data?.packageStats ?? {};
  const maxPkg = Math.max(...Object.values(packageStats), 1);

  // ─── Login ──────────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#111827] border border-[#7c3aed] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1 text-center">Admin Paneli</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Galya IPTV</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Admin şifresi"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-3 outline-none focus:border-[#7c3aed] transition-colors"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || !secret}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
            >
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
            <button
              onClick={() => fetchData(secret)}
              disabled={loading}
              className="bg-[#1f2937] hover:bg-[#374151] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm border border-[#374151] transition-colors"
            >
              {loading ? '⟳ Yükleniyor...' : '⟳ Yenile'}
            </button>
            <button
              onClick={() => { setAuthed(false); setData(null); setSecret(''); }}
              className="bg-red-900/40 hover:bg-red-900/60 text-red-400 px-4 py-2 rounded-xl text-sm border border-red-800/50 transition-colors"
            >
              Çıkış
            </button>
          </div>
        </div>

        {/* İstatistik kartları */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Toplam Açılan Test"  value={data.totalEmails} icon="🧪" variant="purple" />
            <StatCard label="Son 24 Saat"  value={today24h}         icon="📅" variant="blue"   />
            <StatCard label="Aktif Kayıt"  value={records.length}   icon="📊" variant="green"  />
            <StatCard label="Redis Kayıt"  value={data.totalIPs + data.totalEmails} icon="🗄️" variant="orange" />
          </div>
        )}

        {/* Paket ilgi grafiği */}
        {Object.keys(packageStats).length > 0 && (
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-5">📦 Paket İlgisi</h2>
            <div className="space-y-3">
              {Object.entries(packageStats)
                .sort((a, b) => b[1] - a[1])
                .map(([pkg, count]) => (
                  <div key={pkg} className="flex items-center gap-3">
                    <div className="w-40 shrink-0 text-sm text-gray-300 truncate" title={pkg}>{pkg}</div>
                    <div className="flex-1 bg-[#1f2937] rounded-full h-7 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${Math.max((count / maxPkg) * 100, 8)}%` }}
                      >
                        <span className="text-xs font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Arama */}
        <input
          type="text"
          placeholder="Email, IP veya paket adı ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-3 outline-none focus:border-[#7c3aed] transition-colors text-sm"
        />

        {/* Hata */}
        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-400 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Yükleniyor */}
        {loading && !data && (
          <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
        )}

        {/* Boş */}
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
                    <tr
                      key={record.key}
                      className={`border-b border-[#1f2937] last:border-0 hover:bg-[#1f2937]/60 transition-colors ${i % 2 === 0 ? '' : 'bg-[#0f172a]/40'}`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-white font-medium">{record.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-purple-900/40 text-purple-300 border border-purple-800/50 px-2 py-1 rounded-lg whitespace-nowrap">
                          {record.selectedPackage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-gray-400 text-xs bg-[#1f2937] px-2 py-1 rounded">
                          {record.ip}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {record.createdAtFormatted}
                      </td>
                      <td className="px-4 py-3">
                        <DaysLeftBadge days={record.daysLeft} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(record.email)}
                          disabled={deletingEmail === record.email}
                          className="bg-red-900/40 hover:bg-red-900/70 disabled:opacity-40 text-red-400 text-xs px-3 py-1.5 rounded-lg border border-red-800/50 transition-colors whitespace-nowrap"
                        >
                          {deletingEmail === record.email ? '...' : 'Limiti Sıfırla'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-[#1f2937] text-xs text-gray-500 flex justify-between">
              <span>{filtered.length} kayıt gösteriliyor</span>
              <span>Her 30 saniyede otomatik yenilenir</span>
            </div>
          </div>
        )}

        {/* Ham Redis verisi */}
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

      </div>
    </div>
  );
}
