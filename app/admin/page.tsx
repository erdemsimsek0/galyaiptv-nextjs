'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Tipler ───────────────────────────────────────────────────────────────────
type TrialRecord = {
  key:               string;
  email:             string;
  ip:                string;
  selectedPackage:   string;
  username:          string;
  password:          string;
  createdAt:         number;
  createdAtFormatted:string;
  ttlSeconds:        number;
  daysLeft:          number;
  trialExpired:      boolean;
  trialHoursLeft:    string;
  trialStatus:       'active' | 'expired';
};

type IpRecord = { ip: string; email: string; daysLeft: number };

type ApiResponse = {
  success:      boolean;
  totalEmails:  number;
  totalIPs:     number;
  packageStats: Record<string, number>;
  records:      TrialRecord[];
  ipRecords:    IpRecord[];
  error?:       string;
};

interface PaymentInfo {
  bankName: string; accountHolder: string; iban: string; branch: string; note: string; updatedAt: number;
}

// ─── Yardımcı bileşenler ──────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  const colors: Record<string, string> = {
    purple: 'border-purple-800/50 bg-purple-900/10 text-purple-400',
    blue:   'border-blue-800/50   bg-blue-900/10   text-blue-400',
    green:  'border-green-800/50  bg-green-900/10  text-green-400',
    orange: 'border-orange-800/50 bg-orange-900/10 text-orange-400',
    red:    'border-red-800/50    bg-red-900/10    text-red-400',
    pink:   'border-pink-800/50   bg-pink-900/10   text-pink-400',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.purple}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${colors[color]?.split(' ')[2]}`}>{value}</div>
      <div className="text-gray-400 text-xs mt-1">{label}</div>
    </div>
  );
}

function Badge({ children, variant }: { children: React.ReactNode; variant: 'green' | 'red' | 'yellow' | 'gray' | 'purple' }) {
  const v = {
    green:  'bg-green-900/40  text-green-400  border-green-800/50',
    red:    'bg-red-900/40    text-red-400    border-red-800/50',
    yellow: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50',
    gray:   'bg-gray-800/60   text-gray-500   border-gray-700/50',
    purple: 'bg-purple-900/40 text-purple-300 border-purple-800/50',
  }[variant];
  return <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${v}`}>{children}</span>;
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-[#7c3aed] text-white' : 'bg-[#1f2937] text-gray-400 hover:text-white border border-[#374151]'}`}>
      {children}
    </button>
  );
}

// ─── IBAN Yönetim Sekmesi ─────────────────────────────────────────────────────
function PaymentTab({ secret }: { secret: string }) {
  const [info, setInfo]       = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [msgType, setMsgType] = useState<'ok'|'err'>('ok');
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ bankName: '', accountHolder: '', iban: '', branch: '', note: '' });

  const showMsg = (text: string, type: 'ok'|'err' = 'ok') => {
    setMsg(text); setMsgType(type); setTimeout(() => setMsg(''), 4000);
  };

  useEffect(() => {
    setLoading(true);
    fetch('/api/payment-info')
      .then(r => r.json())
      .then(d => {
        if (d.success) { setInfo(d.data); setForm({ bankName: d.data.bankName, accountHolder: d.data.accountHolder, iban: d.data.iban, branch: d.data.branch || '', note: d.data.note || '' }); }
        else setEditing(true);
      })
      .catch(() => showMsg('Yüklenemedi.', 'err'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/payment-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.success) { setInfo(d.data); setEditing(false); showMsg('Kaydedildi ✓'); }
      else showMsg(d.error || 'Hata.', 'err');
    } catch { showMsg('Bağlantı hatası.', 'err'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('IBAN bilgisini silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch('/api/payment-info', { method: 'DELETE', headers: { 'x-admin-secret': secret } });
      const d = await res.json();
      if (d.success) { setInfo(null); setEditing(true); setForm({ bankName: '', accountHolder: '', iban: '', branch: '', note: '' }); showMsg('Silindi.'); }
      else showMsg(d.error || 'Hata.', 'err');
    } catch { showMsg('Bağlantı hatası.', 'err'); }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Yükleniyor...</div>;

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">💳 IBAN / Ödeme Bilgileri</h2>
        {info && !editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="text-xs bg-[#1f2937] border border-[#374151] text-gray-300 px-3 py-1.5 rounded-lg hover:text-white">Düzenle</button>
            <button onClick={handleDelete} className="text-xs bg-red-900/40 border border-red-800/50 text-red-400 px-3 py-1.5 rounded-lg">Sil</button>
          </div>
        )}
      </div>

      {msg && <div className={`mb-4 rounded-xl px-4 py-2.5 text-sm ${msgType === 'ok' ? 'bg-green-900/30 text-green-400 border border-green-800/50' : 'bg-red-900/30 text-red-400 border border-red-800/50'}`}>{msg}</div>}

      {!editing && info ? (
        <div className="space-y-3">
          {[['Banka', info.bankName], ['Hesap Sahibi', info.accountHolder], ['IBAN', info.iban], ['Şube', info.branch || '—'], ['Not', info.note || '—']].map(([label, val]) => (
            <div key={label} className="flex gap-3">
              <span className="w-28 shrink-0 text-xs text-gray-500 uppercase tracking-wider pt-0.5">{label}</span>
              <span className="font-mono text-sm text-white break-all">{val}</span>
            </div>
          ))}
          <p className="text-xs text-gray-600 mt-4">Son güncelleme: {new Date(info.updatedAt).toLocaleString('tr-TR')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[
            { field: 'bankName', label: 'Banka Adı *', placeholder: 'Garanti BBVA' },
            { field: 'accountHolder', label: 'Hesap Sahibi *', placeholder: 'Ad Soyad' },
            { field: 'iban', label: 'IBAN *', placeholder: 'TR00 0000 0000 0000 0000 0000 00' },
            { field: 'branch', label: 'Şube (opsiyonel)', placeholder: 'Merkez' },
            { field: 'note', label: 'Not (opsiyonel)', placeholder: 'EFT açıklamasına e-postanızı yazınız' },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="mb-1.5 block text-xs font-semibold text-gray-400">{label}</label>
              <input type="text" value={form[field as keyof typeof form]} placeholder={placeholder}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-2.5 outline-none focus:border-[#7c3aed] transition-colors text-sm" />
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !form.bankName || !form.accountHolder || !form.iban}
              className="flex-1 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            {info && <button onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl bg-[#1f2937] border border-[#374151] text-gray-400 text-sm hover:text-white">İptal</button>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Test Kayıtları Sekmesi ───────────────────────────────────────────────────
function TrialsTab({ data, secret, onRefresh }: { data: ApiResponse; secret: string; onRefresh: () => void }) {
  const [search, setSearch]         = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all'|'active'|'expired'>('all');
  const [actionMsg, setActionMsg]   = useState('');

  const showMsg = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 4000); };

  const doAction = async (action: string, email: string, ipAddr?: string) => {
    const labels: Record<string, string> = {
      reset_email: `${email} için 7 günlük limiti sıfırla?`,
      terminate_trial: `${email} test hesabını sonlandır?`,
      reset_full: `${email} için TÜM kayıtları sil (IP dahil)?`,
      reset_ip: `${ipAddr} IP limitini sıfırla?`,
    };
    if (!confirm(labels[action])) return;
    setActionLoading(email + action);
    try {
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email, ip: ipAddr }),
      });
      const d = await res.json();
      if (d.success) { showMsg(d.message); onRefresh(); }
      else showMsg(d.error || 'Hata oluştu.');
    } catch { showMsg('Bağlantı hatası.'); }
    finally { setActionLoading(null); }
  };

  const records = data.records ?? [];
  const filtered = records.filter(r => {
    const matchSearch = search === '' || r.email.toLowerCase().includes(search.toLowerCase()) || r.ip.includes(search) || r.username.includes(search);
    const matchStatus = filterStatus === 'all' || r.trialStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount  = records.filter(r => !r.trialExpired).length;
  const expiredCount = records.filter(r =>  r.trialExpired).length;
  const today24h     = records.filter(r => Date.now() - r.createdAt < 86400000).length;
  const packageStats = data.packageStats ?? {};
  const maxPkg       = Math.max(...Object.values(packageStats), 1);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Toplam Test"  value={data.totalEmails} icon="🧪" color="purple" />
        <StatCard label="Son 24 Saat"  value={today24h}         icon="📅" color="blue" />
        <StatCard label="Test Aktif"   value={activeCount}      icon="✅" color="green" />
        <StatCard label="Test Bitmiş"  value={expiredCount}     icon="⌛" color="orange" />
      </div>

      {/* Paket dağılımı */}
      {Object.keys(packageStats).length > 0 && (
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-4">📦 Paket İlgisi</h3>
          <div className="space-y-2.5">
            {Object.entries(packageStats).sort((a,b)=>b[1]-a[1]).map(([pkg, count]) => (
              <div key={pkg} className="flex items-center gap-3">
                <div className="w-32 shrink-0 text-xs text-gray-300 truncate">{pkg}</div>
                <div className="flex-1 bg-[#1f2937] rounded-full h-6 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${Math.max((count/maxPkg)*100, 8)}%` }}>
                    <span className="text-[10px] font-bold text-white">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Email, IP veya kullanıcı adı ara..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-2.5 outline-none focus:border-[#7c3aed] text-sm" />
        <div className="flex gap-2">
          {(['all','active','expired'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterStatus===s ? 'bg-[#7c3aed] text-white' : 'bg-[#1f2937] text-gray-400 border border-[#374151] hover:text-white'}`}>
              {s === 'all' ? 'Tümü' : s === 'active' ? '✅ Aktif' : '⌛ Bitmiş'}
            </button>
          ))}
        </div>
      </div>

      {actionMsg && (
        <div className="bg-blue-900/20 border border-blue-800/40 text-blue-300 rounded-xl px-4 py-2.5 text-sm">{actionMsg}</div>
      )}

      {/* Tablo */}
      {filtered.length > 0 ? (
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f2937] text-gray-400 text-xs uppercase tracking-wider bg-[#0f172a]">
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Kullanıcı / Şifre</th>
                  <th className="text-left px-4 py-3">IP</th>
                  <th className="text-left px-4 py-3">Paket</th>
                  <th className="text-left px-4 py-3">Tarih</th>
                  <th className="text-left px-4 py-3">Test Durumu</th>
                  <th className="text-left px-4 py-3">Redis TTL</th>
                  <th className="text-left px-4 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.key}
                    className={`border-b border-[#1f2937] last:border-0 hover:bg-[#1f2937]/60 transition-colors ${i%2===0?'':'bg-[#0f172a]/40'}`}>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium text-xs break-all">{r.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-gray-300">{r.username}</div>
                      <div className="font-mono text-xs text-gray-500">{r.password}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-gray-400 text-xs bg-[#1f2937] px-2 py-1 rounded">{r.ip}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="purple">{r.selectedPackage}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{r.createdAtFormatted}</td>
                    <td className="px-4 py-3">
                      {r.trialExpired
                        ? <Badge variant="gray">Bitti</Badge>
                        : <Badge variant="green">Aktif · {r.trialHoursLeft}s</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      {r.daysLeft <= 1
                        ? <Badge variant="red">{r.daysLeft}g</Badge>
                        : r.daysLeft <= 3
                        ? <Badge variant="yellow">{r.daysLeft}g</Badge>
                        : <Badge variant="green">{r.daysLeft}g</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        {/* Email limitini sıfırla */}
                        <button
                          onClick={() => doAction('reset_email', r.email)}
                          disabled={actionLoading === r.email + 'reset_email'}
                          className="text-[10px] bg-blue-900/30 hover:bg-blue-900/60 text-blue-400 px-2 py-1 rounded border border-blue-800/40 transition-colors disabled:opacity-40 text-left">
                          📧 Email Sıfırla
                        </button>
                        {/* IP sıfırla */}
                        {r.ip !== 'bilinmiyor' && (
                          <button
                            onClick={() => doAction('reset_ip', r.email, r.ip)}
                            disabled={actionLoading === r.email + 'reset_ip'}
                            className="text-[10px] bg-orange-900/30 hover:bg-orange-900/60 text-orange-400 px-2 py-1 rounded border border-orange-800/40 transition-colors disabled:opacity-40 text-left">
                            🌐 IP Sıfırla
                          </button>
                        )}
                        {/* Testi sonlandır */}
                        {!r.trialExpired && (
                          <button
                            onClick={() => doAction('terminate_trial', r.email)}
                            disabled={actionLoading === r.email + 'terminate_trial'}
                            className="text-[10px] bg-yellow-900/30 hover:bg-yellow-900/60 text-yellow-400 px-2 py-1 rounded border border-yellow-800/40 transition-colors disabled:opacity-40 text-left">
                            ⏹ Testi Sonlandır
                          </button>
                        )}
                        {/* Tam sil */}
                        <button
                          onClick={() => doAction('reset_full', r.email)}
                          disabled={actionLoading === r.email + 'reset_full'}
                          className="text-[10px] bg-red-900/30 hover:bg-red-900/60 text-red-400 px-2 py-1 rounded border border-red-800/40 transition-colors disabled:opacity-40 text-left">
                          🗑 Tümünü Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#1f2937] text-xs text-gray-500 flex flex-wrap gap-2 justify-between">
            <span>{filtered.length} / {records.length} kayıt gösteriliyor</span>
            <span>30s'de otomatik yenilenir</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">{search ? 'Arama sonucu bulunamadı.' : 'Henüz test kaydı yok.'}</div>
      )}
    </div>
  );
}

// ─── IP Kayıtları Sekmesi ─────────────────────────────────────────────────────
function IpTab({ data, secret, onRefresh }: { data: ApiResponse; secret: string; onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const resetIp = async (ip: string) => {
    if (!confirm(`${ip} IP limitini sıfırlamak istediğinize emin misiniz?`)) return;
    setActionLoading(ip);
    try {
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_ip', ip }),
      });
      const d = await res.json();
      if (d.success) { showMsg(d.message); onRefresh(); }
      else showMsg(d.error || 'Hata.');
    } catch { showMsg('Bağlantı hatası.'); }
    finally { setActionLoading(null); }
  };

  const ipRecords = data.ipRecords ?? [];
  const filtered  = ipRecords.filter(r => search === '' || r.ip.includes(search) || r.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Toplam IP Kaydı" value={ipRecords.length} icon="🌐" color="blue" />
        <StatCard label="Benzersiz IP"     value={new Set(ipRecords.map(r=>r.ip)).size} icon="🔒" color="purple" />
      </div>

      <input type="text" placeholder="IP adresi veya email ara..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-2.5 outline-none focus:border-[#7c3aed] text-sm" />

      {msg && <div className="bg-blue-900/20 border border-blue-800/40 text-blue-300 rounded-xl px-4 py-2.5 text-sm">{msg}</div>}

      {filtered.length > 0 ? (
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2937] text-gray-400 text-xs uppercase tracking-wider bg-[#0f172a]">
                <th className="text-left px-4 py-3">IP Adresi</th>
                <th className="text-left px-4 py-3">E-posta</th>
                <th className="text-left px-4 py-3">TTL</th>
                <th className="text-left px-4 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.ip} className={`border-b border-[#1f2937] last:border-0 hover:bg-[#1f2937]/60 ${i%2===0?'':'bg-[#0f172a]/40'}`}>
                  <td className="px-4 py-3"><span className="font-mono text-white text-xs">{r.ip}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.daysLeft <= 1 ? 'red' : r.daysLeft <= 3 ? 'yellow' : 'green'}>{r.daysLeft} gün</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => resetIp(r.ip)} disabled={actionLoading === r.ip}
                      className="text-xs bg-orange-900/30 hover:bg-orange-900/60 text-orange-400 px-3 py-1.5 rounded border border-orange-800/40 transition-colors disabled:opacity-40">
                      {actionLoading === r.ip ? '...' : '🌐 IP Sıfırla'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[#1f2937] text-xs text-gray-500">{filtered.length} kayıt</div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">IP kaydı bulunamadı.</div>
      )}
    </div>
  );
}



// ─── Ödeme Bildirimleri + Kullanıcı Yönetimi Sekmesi ─────────────────────────
function PaymentsTab({ secret }: { secret: string }) {
  const [notifications, setNotifications] = useState<{
    email: string; plan: string; amount: string; paymentCode: string;
    status: string; createdAt: number; createdAtFormatted: string;
    approvedAt?: number; assignedPlan?: string;
  }[]>([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState('');
  const [msgType, setMsgType]   = useState<'ok'|'err'>('ok');
  const [assigning, setAssigning] = useState<string|null>(null);
  const [assignForm, setAssignForm] = useState<Record<string, {plan:string;days:string;username:string;password:string}>>({});

  const showMsg = (text: string, type: 'ok'|'err' = 'ok') => {
    setMsg(text); setMsgType(type); setTimeout(() => setMsg(''), 5000);
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments', { headers: { 'x-admin-secret': secret } });
      const d = await res.json();
      if (d.success) setNotifications(d.notifications || []);
      else showMsg(d.error || 'Hata', 'err');
    } catch { showMsg('Bağlantı hatası', 'err'); }
    finally { setLoading(false); }
  }, [secret]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleAssign = async (email: string) => {
    const form = assignForm[email] || { plan: '', days: '', username: '', password: '' };
    if (!form.plan || !form.days) { showMsg('Plan ve süre gerekli', 'err'); return; }
    setAssigning(email);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          action: 'assign_subscription',
          email,
          plan: form.plan,
          durationDays: Number(form.days),
          username: form.username,
          password: form.password,
        }),
      });
      const d = await res.json();
      if (d.success) { showMsg(d.message); fetchNotifications(); setAssigning(null); }
      else showMsg(d.error || 'Hata', 'err');
    } catch { showMsg('Bağlantı hatası', 'err'); }
    finally { setAssigning(null); }
  };

  const handleReject = async (email: string) => {
    if (!confirm(`${email} bildirimini reddet?`)) return;
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ action: 'reject_notification', email }),
      });
      const d = await res.json();
      if (d.success) { showMsg('Reddedildi.'); fetchNotifications(); }
    } catch { showMsg('Hata', 'err'); }
  };

  const pending   = notifications.filter(n => n.status === 'pending');
  const approved  = notifications.filter(n => n.status === 'approved');
  const rejected  = notifications.filter(n => n.status === 'rejected');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">💳 Ödeme Bildirimleri</h2>
        <button onClick={fetchNotifications} className="text-xs bg-[#1f2937] border border-[#374151] text-gray-400 px-3 py-1.5 rounded-lg hover:text-white">
          ⟳ Yenile
        </button>
      </div>

      {msg && <div className={`rounded-xl px-4 py-3 text-sm border ${msgType==='ok'?'bg-green-900/30 text-green-400 border-green-800/50':'bg-red-900/30 text-red-400 border-red-800/50'}`}>{msg}</div>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Bekleyen"  value={pending.length}  icon="⏳" color="orange" />
        <StatCard label="Onaylanan" value={approved.length} icon="✅" color="green" />
        <StatCard label="Reddedilen" value={rejected.length} icon="❌" color="red" />
      </div>

      {loading && <div className="text-center py-10 text-gray-400">Yükleniyor...</div>}

      {/* Pending notifications */}
      {pending.length > 0 && (
        <div className="bg-[#111827] border border-orange-800/30 rounded-2xl overflow-hidden">
          <div className="border-b border-[#1f2937] px-5 py-3 bg-orange-900/10">
            <h3 className="text-sm font-bold text-orange-400">⏳ Bekleyen Bildirimler ({pending.length})</h3>
          </div>
          <div className="divide-y divide-[#1f2937]">
            {pending.map(n => (
              <div key={n.email} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{n.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.createdAtFormatted}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {n.plan && <Badge variant="purple">{n.plan}</Badge>}
                      {n.amount && <Badge variant="green">₺{n.amount}</Badge>}
                      {n.paymentCode && <Badge variant="yellow">Kod: {n.paymentCode}</Badge>}
                    </div>
                  </div>
                  <button onClick={() => handleReject(n.email)}
                    className="text-xs bg-red-900/30 text-red-400 border border-red-800/40 px-3 py-1.5 rounded-lg hover:bg-red-900/50">
                    Reddet
                  </button>
                </div>

                {/* Assign form */}
                <div className="rounded-xl bg-[#0f172a] border border-[#1f2937] p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Abonelik Tanımla</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">Plan</label>
                      <select value={assignForm[n.email]?.plan || ''}
                        onChange={e => setAssignForm(p => ({ ...p, [n.email]: { ...p[n.email], plan: e.target.value } }))}
                        className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-[#7c3aed]">
                        <option value="" className="bg-[#0f172a]">Seç...</option>
                        <option value="GalyaStream Max" className="bg-[#0f172a]">GalyaStream Max</option>
                        <option value="GalyaStream Sports" className="bg-[#0f172a]">GalyaStream Sports</option>
                        <option value="GalyaStream Cinema" className="bg-[#0f172a]">GalyaStream Cinema</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">Süre (gün)</label>
                      <input type="number" placeholder="30" min="1"
                        value={assignForm[n.email]?.days || ''}
                        onChange={e => setAssignForm(p => ({ ...p, [n.email]: { ...p[n.email], days: e.target.value } }))}
                        className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-[#7c3aed]" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">Kullanıcı Adı (opsiyonel)</label>
                      <input type="text" placeholder="username"
                        value={assignForm[n.email]?.username || ''}
                        onChange={e => setAssignForm(p => ({ ...p, [n.email]: { ...p[n.email], username: e.target.value } }))}
                        className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-[#7c3aed] font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">Şifre (opsiyonel)</label>
                      <input type="text" placeholder="password"
                        value={assignForm[n.email]?.password || ''}
                        onChange={e => setAssignForm(p => ({ ...p, [n.email]: { ...p[n.email], password: e.target.value } }))}
                        className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-[#7c3aed] font-mono" />
                    </div>
                  </div>
                  <button onClick={() => handleAssign(n.email)} disabled={assigning === n.email}
                    className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                    {assigning === n.email ? 'Tanımlanıyor...' : '✓ Aboneliği Onayla & Aktif Et'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden">
          <div className="border-b border-[#1f2937] px-5 py-3">
            <h3 className="text-sm font-bold text-green-400">✅ Onaylanan Bildirimler ({approved.length})</h3>
          </div>
          <div className="divide-y divide-[#1f2937]">
            {approved.map(n => (
              <div key={n.email} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white">{n.email}</p>
                  <p className="text-xs text-gray-500">{n.createdAtFormatted} · {n.assignedPlan}</p>
                </div>
                <Badge variant="green">Onaylı</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="text-center py-16 text-gray-500">Henüz ödeme bildirimi yok.</div>
      )}
    </div>
  );
}

// ─── Fiyat Yönetimi Sekmesi ───────────────────────────────────────────────────
const PLAN_LABELS: Record<string, { name: string; color: string; emoji: string }> = {
  max:    { name: 'GalyaStream Max',    color: '#ef4444', emoji: '👑' },
  sports: { name: 'GalyaStream Sports', color: '#22c55e', emoji: '⚽' },
  cinema: { name: 'GalyaStream Cinema', color: '#f59e0b', emoji: '🎬' },
};
const DEFAULT_PRICES_ADMIN: Record<string, number> = { max: 229.90, sports: 159.90, cinema: 129.90 };

function PricesTab({ secret }: { secret: string }) {
  const [prices,  setPrices]  = useState<Record<string, number>>(DEFAULT_PRICES_ADMIN);
  const [form,    setForm]    = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [msgType, setMsgType] = useState<'ok'|'err'>('ok');
  const [isDefault, setIsDefault] = useState(true);

  const showMsg = (text: string, type: 'ok'|'err' = 'ok') => {
    setMsg(text); setMsgType(type); setTimeout(() => setMsg(''), 5000);
  };

  useEffect(() => {
    fetch('/api/prices')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setPrices(d.prices);
          setIsDefault(d.isDefault ?? false);
          const f: Record<string, string> = {};
          Object.entries(d.prices).forEach(([k, v]) => { f[k] = String(v); });
          setForm(f);
        }
      })
      .catch(() => showMsg('Fiyatlar yüklenemedi.', 'err'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    // Validasyon
    const parsed: Record<string, number> = {};
    for (const [key, val] of Object.entries(form)) {
      const num = parseFloat(val.replace(',', '.'));
      if (isNaN(num) || num <= 0) {
        showMsg(`Geçersiz fiyat: ${PLAN_LABELS[key]?.name || key}`, 'err'); return;
      }
      parsed[key] = num;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ prices: parsed }),
      });
      const d = await res.json();
      if (d.success) {
        setPrices(d.prices); setIsDefault(false);
        showMsg('✓ Fiyatlar güncellendi. Tüm sayfalara yansıdı.');
      } else showMsg(d.error || 'Hata.', 'err');
    } catch { showMsg('Bağlantı hatası.', 'err'); }
    finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!confirm('Fiyatları varsayılan değerlere sıfırlamak istediğinize emin misiniz?')) return;
    setSaving(true);
    try {
      const res = await fetch('/api/prices', { method: 'DELETE', headers: { 'x-admin-secret': secret } });
      const d = await res.json();
      if (d.success) {
        setPrices(d.prices); setIsDefault(true);
        const f: Record<string, string> = {};
        Object.entries(d.prices).forEach(([k, v]) => { f[k] = String(v); });
        setForm(f);
        showMsg('Varsayılan fiyatlara döndürüldü.');
      } else showMsg(d.error || 'Hata.', 'err');
    } catch { showMsg('Bağlantı hatası.', 'err'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Fiyatlar yükleniyor...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">💰 Paket Fiyat Yönetimi</h2>
          <p className="text-xs text-gray-500 mt-1">
            {isDefault ? '⚠️ Şu an varsayılan fiyatlar kullanılıyor.' : '✓ Özel fiyatlar aktif.'}
          </p>
        </div>
        {!isDefault && (
          <button onClick={handleReset} disabled={saving}
            className="text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
            Varsayılana Sıfırla
          </button>
        )}
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm border ${msgType === 'ok' ? 'bg-green-900/30 text-green-400 border-green-800/50' : 'bg-red-900/30 text-red-400 border-red-800/50'}`}>
          {msg}
        </div>
      )}

      {/* Fiyat kartları */}
      <div className="grid gap-4">
        {Object.entries(PLAN_LABELS).map(([id, meta]) => (
          <div key={id} className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5"
            style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{meta.emoji}</span>
              <div>
                <p className="font-bold text-white">{meta.name}</p>
                <p className="text-xs text-gray-500">Aylık baz fiyat (TL)</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-500">Mevcut</p>
                <p className="font-mono font-bold" style={{ color: meta.color }}>
                  ₺{(prices[id] ?? DEFAULT_PRICES_ADMIN[id]).toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs text-gray-400">Yeni Fiyat (₺)</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">₺</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="99999"
                    value={form[id] ?? ''}
                    onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))}
                    className="flex-1 bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-2.5 outline-none focus:border-[#7c3aed] transition-colors text-sm font-mono"
                    placeholder={String(DEFAULT_PRICES_ADMIN[id])}
                  />
                </div>
              </div>
              {/* Hızlı değişim butonları */}
              <div className="flex flex-col gap-1.5 pt-5">
                {[-10, -5, +5, +10].map(delta => (
                  <button key={delta}
                    onClick={() => {
                      const current = parseFloat((form[id] || String(prices[id])).replace(',', '.')) || 0;
                      const newVal  = Math.max(1, Math.round((current + delta) * 100) / 100);
                      setForm(p => ({ ...p, [id]: String(newVal) }));
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${delta > 0 ? 'border-green-800/50 bg-green-900/20 text-green-400 hover:bg-green-900/40' : 'border-red-800/50 bg-red-900/20 text-red-400 hover:bg-red-900/40'}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>
            </div>

            {/* İndirim hesaplayıcı */}
            {form[id] && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                {[{ label: '1 Ay', m: 1, d: 0 }, { label: '6 Ay (%5)', m: 6, d: 5 }, { label: '12 Ay (%20)', m: 12, d: 20 }].map(({ label, m, d }) => {
                  const base  = parseFloat(form[id].replace(',', '.')) || 0;
                  const total = Math.round(base * (1 - d/100) * m * 100) / 100;
                  return (
                    <div key={label} className="rounded-lg bg-[#1f2937] p-2 text-center">
                      <p className="text-gray-500">{label}</p>
                      <p className="font-mono font-semibold text-white">₺{total.toFixed(2).replace('.', ',')}</p>
                      <p className="text-gray-600">/{m === 1 ? 'ay' : `${m} ay`}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
          {saving ? 'Kaydediliyor...' : '💾 Fiyatları Kaydet & Yayınla'}
        </button>
      </div>

      <div className="rounded-xl border border-[#1f2937] bg-[#0f172a] p-4 text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-400">ℹ️ Nasıl Çalışır?</p>
        <p>• Fiyatlar Redis&apos;te saklanır, tüm sayfalar her yüklemede API&apos;den çeker.</p>
        <p>• Ana sayfa paket kartları, abonelik sayfası ve ödeme özeti anlık güncellenir.</p>
        <p>• Varsayılan fiyatlar: Max ₺229,90 · Sports ₺159,90 · Cinema ₺129,90</p>
        <p>• İndirimler otomatik hesaplanır (6 ay %5, 12 ay %20).</p>
      </div>
    </div>
  );
}

// ─── Ana Admin Bileşeni ───────────────────────────────────────────────────────
export default function AdminPage() {
  const [secret,    setSecret]    = useState('');
  const [authed,    setAuthed]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [data,      setData]      = useState<ApiResponse | null>(null);
  const [error,     setError]     = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'trials'|'ips'|'payment'|'prices'|'payments'>('trials');

  const fetchData = useCallback(async (s: string) => {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/admin', { headers: { 'x-admin-secret': s } });
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
  };

  useEffect(() => {
    if (!authed || !secret) return;
    const id = setInterval(() => fetchData(secret), 30000);
    return () => clearInterval(id);
  }, [authed, secret, fetchData]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#111827] border border-[#7c3aed] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1 text-center">Admin Paneli</h1>
          <p className="text-gray-400 text-sm text-center mb-6">GalyaStream</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="Admin şifresi" value={secret}
              onChange={e => setSecret(e.target.value)}
              className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-3 outline-none focus:border-[#7c3aed] transition-colors" />
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

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Admin Paneli</h1>
            <p className="text-gray-500 text-xs mt-1">
              {lastRefresh ? `Son güncelleme: ${lastRefresh.toLocaleTimeString('tr-TR')}` : 'Yükleniyor...'}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => fetchData(secret)} disabled={loading}
              className="bg-[#1f2937] hover:bg-[#374151] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm border border-[#374151]">
              {loading ? '⟳ Yükleniyor...' : '⟳ Yenile'}
            </button>
            <button onClick={() => { setAuthed(false); setData(null); setSecret(''); }}
              className="bg-red-900/40 hover:bg-red-900/60 text-red-400 px-4 py-2 rounded-xl text-sm border border-red-800/50">
              Çıkış
            </button>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="flex flex-wrap gap-3">
          <Tab active={activeTab === 'trials'} onClick={() => setActiveTab('trials')}>
            🧪 Test Talepleri {data ? `(${data.totalEmails})` : ''}
          </Tab>
          <Tab active={activeTab === 'ips'} onClick={() => setActiveTab('ips')}>
            🌐 IP Kayıtları {data ? `(${data.totalIPs})` : ''}
          </Tab>
          <Tab active={activeTab === 'payment'} onClick={() => setActiveTab('payment')}>
            💳 IBAN Yönetimi
          </Tab>
          <Tab active={activeTab === 'payments'} onClick={() => setActiveTab('payments')}>
            💳 Ödemeler {data ? '' : ''}
          </Tab>
          <Tab active={activeTab === 'prices'} onClick={() => setActiveTab('prices')}>
            💰 Fiyat Yönetimi
          </Tab>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading && !data && (
          <div className="text-center py-20 text-gray-400">Veriler yükleniyor...</div>
        )}

        {activeTab === 'trials' && data && (
          <TrialsTab data={data} secret={secret} onRefresh={() => fetchData(secret)} />
        )}

        {activeTab === 'ips' && data && (
          <IpTab data={data} secret={secret} onRefresh={() => fetchData(secret)} />
        )}

        {activeTab === 'payment' && (
          <PaymentTab secret={secret} />
        )}

        {activeTab === 'payments' && (
          <PaymentsTab secret={secret} />
        )}

        {activeTab === 'prices' && (
          <PricesTab secret={secret} />
        )}
      </div>
    </div>
  );
}
