'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Tiplerd ───────────────────────────────────────────────────────────────────
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
        <StatCard label="Toplam Test"  value={data.totalEmails ?? 0} icon="🧪" color="purple" />
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
    email: string; plan: string; duration?: string; devices?: string; amount: string; senderName?: string; paymentCode?: string; hasReceipt?: boolean; couponCode?: string; couponDiscount?: string;
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
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{n.email}</p>
                    {n.senderName && <p className="text-xs text-gray-300 mt-0.5">👤 {n.senderName}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{n.createdAtFormatted}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {n.plan && <Badge variant="purple">{n.plan}</Badge>}
                      {n.duration && <Badge variant="gray">{n.duration}</Badge>}
                      {n.devices && <Badge variant="gray">{n.devices} Cihaz</Badge>}
                      {n.amount && <Badge variant="green">₺{n.amount}</Badge>}
                      {n.couponCode && <Badge variant="yellow">🎟 {n.couponCode} (-₺{n.couponDiscount || '0'})</Badge>}
                      {n.hasReceipt && <Badge variant="green">📎 Dekont Var</Badge>}
                    </div>
                  </div>
                  <button onClick={() => handleReject(n.email)}
                    className="text-xs bg-red-900/30 text-red-400 border border-red-800/40 px-3 py-1.5 rounded-lg hover:bg-red-900/50 shrink-0">
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

// ─── Destek Talepleri Sekmesi ─────────────────────────────────────────────────
const ISSUE_LABELS: Record<string, { icon: string; label: string }> = {
  stream_error:    { icon: '📺', label: 'Yayın açılmıyor' },
  buffering:       { icon: '⏳', label: 'Takılma / Donma' },
  login:           { icon: '🔑', label: 'Giriş sorunu' },
  payment:         { icon: '💳', label: 'Ödeme / Abonelik' },
  missing_channel: { icon: '📡', label: 'Kanal eksik' },
  other:           { icon: '💬', label: 'Diğer' },
};

function SupportTab({ secret }: { secret: string }) {
  const [tickets, setTickets]   = useState<{
    id: string; email: string; issue: string; phone: string; note: string;
    status: 'open'|'closed'; createdAt: number; createdAtFormatted: string;
  }[]>([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState('');
  const [msgType, setMsgType]   = useState<'ok'|'err'>('ok');
  const [filter, setFilter]     = useState<'all'|'open'|'closed'>('all');
  const [closing, setClosing]   = useState<string|null>(null);

  const showMsg = (text: string, type: 'ok'|'err' = 'ok') => {
    setMsg(text); setMsgType(type); setTimeout(() => setMsg(''), 4000);
  };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/support', { headers: { 'x-admin-secret': secret } });
      const d = await res.json();
      if (d.success) setTickets(d.tickets || []);
      else showMsg(d.error || 'Hata', 'err');
    } catch { showMsg('Bağlantı hatası', 'err'); }
    finally { setLoading(false); }
  }, [secret]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const closeTicket = async (id: string) => {
    setClosing(id);
    try {
      const res = await fetch('/api/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d.success) { showMsg('Kapatıldı.'); fetchTickets(); }
      else showMsg(d.error || 'Hata', 'err');
    } catch { showMsg('Bağlantı hatası', 'err'); }
    finally { setClosing(null); }
  };

  const deleteTicket = async (id: string) => {
    if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch('/api/support', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d.success) { showMsg('Silindi.'); fetchTickets(); }
      else showMsg(d.error || 'Hata', 'err');
    } catch { showMsg('Bağlantı hatası', 'err'); }
  };

  const filtered = tickets.filter(t => filter === 'all' || t.status === filter);
  const openCount   = tickets.filter(t => t.status === 'open').length;
  const closedCount = tickets.filter(t => t.status === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Toplam Talep" value={tickets.length} icon="🎫" color="purple" />
        <StatCard label="Açık"         value={openCount}       icon="🔴" color="orange" />
        <StatCard label="Kapatıldı"    value={closedCount}     icon="✅" color="green" />
      </div>

      {/* Filtre + Yenile */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {(['all','open','closed'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filter===s ? 'bg-[#7c3aed] text-white' : 'bg-[#1f2937] text-gray-400 border border-[#374151] hover:text-white'}`}>
              {s === 'all' ? 'Tümü' : s === 'open' ? '🔴 Açık' : '✅ Kapatıldı'}
            </button>
          ))}
        </div>
        <button onClick={fetchTickets} className="ml-auto text-xs bg-[#1f2937] border border-[#374151] text-gray-400 px-3 py-2 rounded-xl hover:text-white">
          ⟳ Yenile
        </button>
      </div>

      {msg && <div className={`rounded-xl px-4 py-3 text-sm border ${msgType==='ok'?'bg-green-900/30 text-green-400 border-green-800/50':'bg-red-900/30 text-red-400 border-red-800/50'}`}>{msg}</div>}

      {loading && <div className="text-center py-16 text-gray-400">Yükleniyor...</div>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          {filter === 'all' ? 'Henüz destek talebi yok.' : 'Bu kategoride talep bulunamadı.'}
        </div>
      )}

      {/* Ticket listesi */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(t => {
            const meta = ISSUE_LABELS[t.issue] || { icon: '💬', label: t.issue };
            return (
              <div key={t.id}
                className={`rounded-2xl border p-5 space-y-3 ${t.status === 'open' ? 'bg-[#111827] border-orange-800/30' : 'bg-[#0f1520] border-[#1f2937]'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${t.status === 'open' ? 'bg-orange-900/40 text-orange-400 border-orange-800/50' : 'bg-green-900/40 text-green-400 border-green-800/50'}`}>
                        {t.status === 'open' ? '🔴 Açık' : '✅ Kapatıldı'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-lg border bg-purple-900/30 text-purple-300 border-purple-800/40 font-medium">
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                    <p className="font-semibold text-white text-sm">{t.email}</p>
                    <p className="text-xs text-gray-500">{t.createdAtFormatted}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {t.status === 'open' && (
                      <button onClick={() => closeTicket(t.id)} disabled={closing === t.id}
                        className="text-xs bg-green-900/30 hover:bg-green-900/60 text-green-400 px-3 py-1.5 rounded-lg border border-green-800/40 transition-colors disabled:opacity-40">
                        {closing === t.id ? '...' : '✓ Kapat'}
                      </button>
                    )}
                    <button onClick={() => deleteTicket(t.id)}
                      className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded-lg border border-red-800/40 transition-colors">
                      🗑
                    </button>
                  </div>
                </div>

                {/* Detaylar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl bg-[#0d1a2a] border border-[#1e2d42] p-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Telefon</p>
                    <p className="text-sm font-mono text-white">{t.phone}</p>
                  </div>
                  {t.note && (
                    <div className="sm:col-span-1">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Açıklama</p>
                      <p className="text-sm text-gray-300">{t.note}</p>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-gray-600 font-mono">ID: {t.id}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Müşteri Timeline + Yenileme Hatırlatma Sekmesi ───────────────────────────
function CustomersTab({ secret }: { secret: string }) {
  const [customers, setCustomers] = useState<Array<{
    email: string;
    plan: string | null;
    expiresFormatted: string;
    daysLeft: number | null;
    username: string;
    password: string;
    lastReminderFormatted: string;
    openTickets: number;
    timeline: Array<{ title: string; detail: string; status: string; createdAtFormatted: string }>;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers', { headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) setCustomers(data.customers || []);
      else setMsg(data.error || 'Müşteri verileri alınamadı.');
    } catch { setMsg('Bağlantı hatası.'); }
    finally { setLoading(false); }
  }, [secret]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const sendReminder = async (email: string) => {
    setSending(email);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ action: 'send_renewal_reminder', email, note: 'Admin panelinden manuel hatırlatma' }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`${email} için yenileme hatırlatması kaydedildi.`);
        fetchCustomers();
      } else setMsg(data.error || 'Hatırlatma kaydedilemedi.');
    } catch { setMsg('Bağlantı hatası.'); }
    finally { setSending(null); }
  };

  const filtered = customers.filter(customer => query === '' || customer.email.toLowerCase().includes(query.toLowerCase()) || (customer.plan || '').toLowerCase().includes(query.toLowerCase()));
  const dueSoon = customers.filter(customer => customer.daysLeft !== null && customer.daysLeft <= 7).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Toplam Müşteri" value={customers.length} icon="👥" color="blue" />
        <StatCard label="7 Gün İçinde Yenileme" value={dueSoon} icon="🔔" color="orange" />
        <StatCard label="Açık Ticket" value={customers.reduce((sum, c) => sum + c.openTickets, 0)} icon="🎫" color="purple" />
        <StatCard label="Hatırlatma Gönderilen" value={customers.filter(c => c.lastReminderFormatted).length} icon="✉️" color="green" />
      </div>

      <div className="flex flex-wrap gap-3">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Email veya plan ara..." className="flex-1 min-w-60 bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-2.5 outline-none focus:border-[#7c3aed] text-sm" />
        <button onClick={fetchCustomers} className="text-xs bg-[#1f2937] border border-[#374151] text-gray-300 px-4 py-2.5 rounded-xl">⟳ Yenile</button>
      </div>

      {msg && <div className="rounded-xl border border-blue-800/40 bg-blue-900/20 px-4 py-3 text-sm text-blue-300">{msg}</div>}
      {loading && <div className="text-center py-16 text-gray-400">Müşteriler yükleniyor...</div>}

      <div className="space-y-4">
        {filtered.map(customer => (
          <div key={customer.email} className="rounded-2xl border border-[#1f2937] bg-[#111827] p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-white">{customer.email}</p>
                <p className="mt-1 text-xs text-gray-400">{customer.plan || 'Abonelik yok'} · {customer.daysLeft === null ? 'Bitiş bilgisi yok' : `${customer.daysLeft} gün kaldı`}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {customer.plan && <Badge variant="green">{customer.plan}</Badge>}
                  {customer.openTickets > 0 && <Badge variant="yellow">{customer.openTickets} açık ticket</Badge>}
                  {customer.lastReminderFormatted && <Badge variant="purple">Son hatırlatma: {customer.lastReminderFormatted}</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => sendReminder(customer.email)} disabled={sending === customer.email} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                  {sending === customer.email ? 'Gönderiliyor...' : '🔔 Yenileme Hatırlat'}
                </button>
              </div>
            </div>

            {(customer.username || customer.password) && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {customer.username && <div className="rounded-xl bg-[#0f172a] px-4 py-3 text-xs text-gray-300"><p className="text-[10px] uppercase tracking-wider text-gray-500">Kullanıcı adı</p><p className="mt-1 font-mono text-white">{customer.username}</p></div>}
                {customer.password && <div className="rounded-xl bg-[#0f172a] px-4 py-3 text-xs text-gray-300"><p className="text-[10px] uppercase tracking-wider text-gray-500">Şifre</p><p className="mt-1 font-mono text-white">{customer.password}</p></div>}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-[#1f2937] bg-[#0f172a] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Müşteri Timeline</p>
              <div className="space-y-3">
                {customer.timeline.slice(0, 8).map((event, index) => (
                  <div key={`${customer.email}-${index}`} className="flex gap-3">
                    <div className={`mt-1 h-2.5 w-2.5 rounded-full ${event.status === 'success' ? 'bg-emerald-400' : event.status === 'warning' || event.status === 'pending' || event.status === 'open' ? 'bg-amber-400' : event.status === 'approved' ? 'bg-emerald-400' : event.status === 'rejected' || event.status === 'closed' ? 'bg-red-400' : 'bg-blue-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">{event.title}</p>
                        <span className="text-[11px] text-gray-500 whitespace-nowrap">{event.createdAtFormatted}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">{event.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
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
const DEFAULT_DEVICE_MULTIPLIERS_ADMIN: Record<string, number> = { '1': 1, '2': 1.6, '3': 2.2 };

function PricesTab({ secret }: { secret: string }) {
  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES_ADMIN);
  const [deviceMultipliers, setDeviceMultipliers] = useState<Record<string, string>>({ '1': '1', '2': '1.6', '3': '2.2' });
  const [coupons, setCoupons] = useState<Array<{ code: string; label: string; type: 'percent' | 'fixed'; value: string; minMonths: string; active: boolean }>>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
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
          setPrices(d.prices || DEFAULT_PRICES_ADMIN);
          setIsDefault(d.isDefault ?? false);
          const f: Record<string, string> = {};
          Object.entries(d.prices || DEFAULT_PRICES_ADMIN).forEach(([k, v]) => { f[k] = String(v); });
          setForm(f);
          const multiplierForm: Record<string, string> = {};
          Object.entries(d.deviceMultipliers || DEFAULT_DEVICE_MULTIPLIERS_ADMIN).forEach(([k, v]) => { multiplierForm[k] = String(v); });
          setDeviceMultipliers(multiplierForm);
          setCoupons((d.coupons || []).map((coupon: Record<string, unknown>) => ({
            code: String(coupon.code || ''),
            label: String(coupon.label || ''),
            type: (coupon.type === 'fixed' ? 'fixed' : 'percent'),
            value: String(coupon.value || ''),
            minMonths: String(coupon.minMonths || ''),
            active: Boolean(coupon.active),
          })));
        }
      })
      .catch(() => showMsg('Fiyatlar yüklenemedi.', 'err'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const parsedPrices: Record<string, number> = {};
    for (const [key, val] of Object.entries(form)) {
      const num = parseFloat(val.replace(',', '.'));
      if (isNaN(num) || num <= 0) {
        showMsg(`Geçersiz fiyat: ${PLAN_LABELS[key]?.name || key}`, 'err');
        return;
      }
      parsedPrices[key] = num;
    }

    const parsedMultipliers: Record<string, number> = {};
    for (const [key, val] of Object.entries(deviceMultipliers)) {
      const num = parseFloat(val.replace(',', '.'));
      if (isNaN(num) || num < 1) {
        showMsg(`Geçersiz cihaz çarpanı: ${key}`, 'err');
        return;
      }
      parsedMultipliers[key] = num;
    }

    const parsedCoupons = coupons
      .filter(coupon => coupon.code.trim() && coupon.label.trim())
      .map(coupon => ({
        code: coupon.code.trim().toUpperCase(),
        label: coupon.label.trim(),
        type: coupon.type,
        value: parseFloat(coupon.value.replace(',', '.')),
        minMonths: coupon.minMonths ? Number(coupon.minMonths) : undefined,
        active: coupon.active,
      }));

    if (parsedCoupons.some(coupon => Number.isNaN(coupon.value) || coupon.value <= 0)) {
      showMsg('Kupon değerleri geçersiz.', 'err');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ prices: parsedPrices, deviceMultipliers: parsedMultipliers, coupons: parsedCoupons }),
      });
      const d = await res.json();
      if (d.success) {
        setPrices(d.prices);
        setIsDefault(false);
        showMsg('✓ Fiyat, cihaz çarpanı ve kampanyalar güncellendi.');
      } else showMsg(d.error || 'Hata.', 'err');
    } catch { showMsg('Bağlantı hatası.', 'err'); }
    finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!confirm('Tüm fiyat ve kampanyaları varsayılan değerlere döndürmek istiyor musunuz?')) return;
    setSaving(true);
    try {
      const res = await fetch('/api/prices', { method: 'DELETE', headers: { 'x-admin-secret': secret } });
      const d = await res.json();
      if (d.success) window.location.reload();
      else showMsg(d.error || 'Hata.', 'err');
    } catch { showMsg('Bağlantı hatası.', 'err'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Fiyatlar yükleniyor...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">💰 Fiyat · Cihaz · Kampanya Yönetimi</h2>
          <p className="text-xs text-gray-500 mt-1">{isDefault ? '⚠️ Varsayılan ayarlar aktif.' : '✓ Özel ticari ayarlar aktif.'}</p>
        </div>
        <button onClick={handleReset} disabled={saving} className="text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors">Sıfırla</button>
      </div>

      {msg && <div className={`rounded-xl px-4 py-3 text-sm border ${msgType === 'ok' ? 'bg-green-900/30 text-green-400 border-green-800/50' : 'bg-red-900/30 text-red-400 border-red-800/50'}`}>{msg}</div>}

      <div className="grid gap-4">
        {Object.entries(PLAN_LABELS).map(([id, meta]) => (
          <div key={id} className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5" style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-bold text-white">{meta.emoji} {meta.name}</p>
                <p className="text-xs text-gray-500">Aylık baz fiyat</p>
              </div>
              <input type="number" step="0.01" value={form[id] ?? ''} onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))} className="w-40 bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-2.5 text-sm font-mono" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-5">
        <h3 className="text-sm font-bold text-white mb-4">📱 Cihaz Sayısına Göre Fiyatlandırma</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(deviceMultipliers).map(([key, value]) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs text-gray-500">{key} cihaz çarpanı</label>
              <input type="number" step="0.01" min="1" value={value} onChange={e => setDeviceMultipliers(prev => ({ ...prev, [key]: e.target.value }))} className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-2.5 text-sm font-mono" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">🎟 Kupon / Kampanya Altyapısı</h3>
          <button onClick={() => setCoupons(prev => [...prev, { code: '', label: '', type: 'percent', value: '', minMonths: '', active: true }])} className="text-xs bg-[#7c3aed] px-3 py-1.5 rounded-lg text-white font-semibold">+ Kupon Ekle</button>
        </div>
        <div className="space-y-3">
          {coupons.map((coupon, index) => (
            <div key={`${coupon.code}-${index}`} className="grid gap-3 md:grid-cols-6 rounded-xl border border-[#1f2937] bg-[#0f172a] p-4">
              <input value={coupon.code} onChange={e => setCoupons(prev => prev.map((item, idx) => idx === index ? { ...item, code: e.target.value.toUpperCase() } : item))} placeholder="Kod" className="bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white" />
              <input value={coupon.label} onChange={e => setCoupons(prev => prev.map((item, idx) => idx === index ? { ...item, label: e.target.value } : item))} placeholder="Kampanya adı" className="bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white md:col-span-2" />
              <select value={coupon.type} onChange={e => setCoupons(prev => prev.map((item, idx) => idx === index ? { ...item, type: e.target.value as 'percent' | 'fixed' } : item))} className="bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white">
                <option value="percent">%</option>
                <option value="fixed">TL</option>
              </select>
              <input value={coupon.value} onChange={e => setCoupons(prev => prev.map((item, idx) => idx === index ? { ...item, value: e.target.value } : item))} placeholder="Değer" className="bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white" />
              <input value={coupon.minMonths} onChange={e => setCoupons(prev => prev.map((item, idx) => idx === index ? { ...item, minMonths: e.target.value } : item))} placeholder="Min ay" className="bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white" />
              <div className="flex items-center justify-between gap-2 md:col-span-6">
                <label className="flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={coupon.active} onChange={e => setCoupons(prev => prev.map((item, idx) => idx === index ? { ...item, active: e.target.checked } : item))} /> Aktif</label>
                <button onClick={() => setCoupons(prev => prev.filter((_, idx) => idx !== index))} className="text-xs text-red-400">Sil</button>
              </div>
            </div>
          ))}
          {coupons.length === 0 && <p className="text-sm text-gray-500">Henüz kampanya yok.</p>}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">{saving ? 'Kaydediliyor...' : '💾 Ticari Ayarları Kaydet'}</button>
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
  const [activeTab, setActiveTab] = useState<'trials'|'ips'|'payment'|'prices'|'payments'|'support'|'customers'>('trials');

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
            🧪 Test Talepleri {data ? `(${data.totalEmails ?? 0})` : ''}
          </Tab>
          <Tab active={activeTab === 'ips'} onClick={() => setActiveTab('ips')}>
            🌐 IP Kayıtları {data ? `(${data.totalIPs ?? 0})` : ''}
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
          <Tab active={activeTab === 'support'} onClick={() => setActiveTab('support')}>
            🎫 Destek Talepleri
          </Tab>
          <Tab active={activeTab === 'customers'} onClick={() => setActiveTab('customers')}>
            👥 Müşteri Timeline
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

        {activeTab === 'support' && (
          <SupportTab secret={secret} />
        )}

        {activeTab === 'customers' && (
          <CustomersTab secret={secret} />
        )}
      </div>
    </div>
  );
}
