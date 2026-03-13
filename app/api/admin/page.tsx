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

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState('');
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async (adminSecret: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin', { headers: { 'x-admin-secret': adminSecret } });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Hata oluştu.');
        if (res.status === 401) setAuthed(false);
      } else {
        setData(json);
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
    setDeletingEmail(email);
    try {
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success) await fetchData(secret);
      else alert(json.error || 'Silme başarısız.');
    } catch {
      alert('Sunucuya bağlanılamadı.');
    } finally {
      setDeletingEmail(null);
    }
  };

  useEffect(() => {
    if (authed && secret) {
      const interval = setInterval(() => fetchData(secret), 30000);
      return () => clearInterval(interval);
    }
  }, [authed, secret, fetchData]);

  const filtered = (data?.records ?? []).filter(
    (r) =>
      search === '' ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.ip.includes(search) ||
      r.selectedPackage.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Login ────────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#111827] border border-[#7c3aed] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Admin Paneli</h1>
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

  // ─── Panel ────────────────────────────────────────────────────────────────

  const packageStats = data?.packageStats ?? {};
  const maxPackageCount = Math.max(...Object.values(packageStats), 1);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Paneli</h1>
            <p className="text-gray-400 text-sm mt-1">Galya IPTV — Trial Yönetimi</p>
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
            <StatCard label="Toplam Test" value={data.totalEmails} icon="🧪" color="purple" />
            <StatCard label="Son 24 Saat" value={(data.records ?? []).filter(r => Date.now() - r.createdAt < 86400000).length} icon="📅" color="blue" />
            <StatCard label="Aktif Kayıt" value={data.records.length} icon="📊" color="green" />
            <StatCard label="Redis Kayıt" value={data.totalIPs + data.totalEmails} icon="🗄️" color="orange" />
          </div>
        )}

        {/* Paket İlgi Grafiği */}
        {data && Object.keys(packageStats).length > 0 && (
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-5">📦 Paket İlgisi</h2>
            <div className="space-y-3">
              {Object.entries(packageStats)
                .sort((a, b) => b[1] - a[1])
                .map(([pkg, count]) => (
                  <div key={pkg} className="flex items-center gap-3">
                    <div className="w-36 shrink-0 text-sm text-gray-300 truncate">{pkg}</div>
                    <div className="flex-1 bg-[#1f2937] rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${(count / maxPackageCount) * 100}%` }}
                      >
                        <span className="text-xs font-bold text-white">{count}</span>
                      </div>
                    </div>
                    <div className="w-8 text-right text-sm text-gray-400 shrink-0">{count}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Arama */}
        <input
          type="text"
          placeholder="Email, IP veya paket ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-2.5 outline-none focus:border-[#7c3aed] transition-colors text-sm"
        />

        {/* Tablo */}
        {loading && !data ? (
          <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Kayıt bulunamadı.</div>
        ) : (
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1f2937] text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Seçilen Paket</th>
                    <th className="text-left px-4 py-3">IP</th>
                    <th className="text-left px-4 py-3">Tarih</th>
                    <th className="text-left px-4 py-3">Kalan</th>
                    <th className="text-left px-4 py-3">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record, i) => (
                    <tr
                      key={record.key}
                      className={`border-b border-[#1f2937] last:border-0 hover:bg-[#1f2937]/50 transition-colors ${i % 2 === 0 ? '' : 'bg-[#0f172a]/30'}`}
                    >
                      <td className="px-4 py-3 text-white font-medium">{record.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-purple-900/40 text-purple-300 border border-purple-800/50 px-2 py-1 rounded-lg">
                          {record.selectedPackage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-gray-400 text-xs bg-[#1f2937] px-2 py-1 rounded">
                          {record.ip}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{record.createdAtFormatted}</td>
                      <td className="px-4 py-3"><DaysLeftBadge days={record.daysLeft} /></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(record.email)}
                          disabled={deletingEmail === record.email}
                          className="bg-red-900/40 hover:bg-red-900/70 disabled:opacity-40 text-red-400 text-xs px-3 py-1.5 rounded-lg border border-red-800/50 transition-colors"
                        >
                          {deletingEmail === record.email ? 'Siliniyor...' : 'Sıfırla'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-[#1f2937] text-xs text-gray-500">
              {filtered.length} kayıt · Her 30 saniyede otomatik yenilenir
            </div>
          </div>
        )}

        {/* Ham Redis verileri */}
        {data && (
          <details className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
            <summary className="cursor-pointer text-gray-400 text-sm hover:text-white transition-colors select-none">
              🗄️ Ham Redis Verileri ({data.records.length} kayıt)
            </summary>
            <pre className="mt-4 text-xs text-green-400 font-mono overflow-auto max-h-96 bg-[#0b0b0f] p-4 rounded-xl">
              {JSON.stringify(data.records, null, 2)}
            </pre>
          </details>
        )}

      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: 'purple' | 'blue' | 'green' | 'orange' }) {
  const styles = {
    purple: 'border-purple-800/50 bg-purple-900/10 text-purple-400',
    blue: 'border-blue-800/50 bg-blue-900/10 text-blue-400',
    green: 'border-green-800/50 bg-green-900/10 text-green-400',
    orange: 'border-orange-800/50 bg-orange-900/10 text-orange-400',
  };
  return (
    <div className={`rounded-xl border p-4 ${styles[color].split(' ').slice(0, 2).join(' ')}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${styles[color].split(' ')[2]}`}>{value}</div>
      <div className="text-gray-400 text-xs mt-1">{label}</div>
    </div>
  );
}

function DaysLeftBadge({ days }: { days: number }) {
  const color = days <= 1 ? 'bg-red-900/40 text-red-400 border-red-800/50'
    : days <= 3 ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50'
    : 'bg-green-900/40 text-green-400 border-green-800/50';
  return <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${color}`}>{days} gün</span>;
}
