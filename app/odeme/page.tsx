'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SessionProvider, useSession } from 'next-auth/react';
import { Suspense } from 'react';

interface PaymentInfo {
  bankName:      string;
  accountHolder: string;
  iban:          string;
  accountNo?:    string;
  branch?:       string;
  note?:         string;
  paymentCode?:  string;
}

// ─── Kopyala Butonu ──────────────────────────────────────────────────────────
function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
        ok ? 'bg-emerald-950/60 text-emerald-400' : 'bg-[#0d1525] text-[#4a5a70] hover:text-white'
      }`}
    >
      {ok ? (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/></svg>
          Kopyalandı
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z"/><path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z"/></svg>
          {label || 'Kopyala'}
        </>
      )}
    </button>
  );
}

// ─── Ödeme Bildirimi Modalı ──────────────────────────────────────────────────
interface ModalProps {
  total: string;
  paket: string;
  sure: string;
  cihaz: string;
  userEmail: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentModal({ total, paket, sure, cihaz, userEmail, userName, onClose, onSuccess }: ModalProps) {
  const [senderName, setSenderName] = useState(userName);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const waMsg = `Merhaba, ödeme yaptım.\nPaket: ${paket} - ${sure} - ${cihaz} Cihaz\nTutar: ₺${total}\nGönderen: ${senderName || '(belirtilmedi)'}\nE-posta: ${userEmail || '(belirtilmedi)'}`;

  async function submit() {
    if (!senderName.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', userEmail);
      formData.append('plan', paket);
      formData.append('duration', sure);
      formData.append('devices', cihaz);
      formData.append('amount', total);
      formData.append('senderName', senderName.trim());
      if (file) formData.append('receipt', file);
      await fetch('/api/payments', { method: 'POST', body: formData });
    } catch { /* sessiz */ }
    setLoading(false);
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#1e2d42] bg-[#0d1525]" onClick={e => e.stopPropagation()}>
        {/* Başlık */}
        <div className="flex items-start justify-between border-b border-[#131f30] p-5">
          <div>
            <h2 className="text-base font-bold text-white">Ödeme Bildirimi</h2>
            <p className="mt-0.5 text-xs text-[#5a6a80]">Ödeme bilgilerinizi ve dekontunuzu gönderin, en kısa sürede kontrol edilecektir.</p>
          </div>
          <button onClick={onClose} className="ml-3 shrink-0 text-[#5a6a80] hover:text-white">✕</button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Tutar */}
          <div className="rounded-xl bg-[#070f1c] px-4 py-3">
            <p className="text-xs text-[#5a6a80]">Ödeme Tutarı</p>
            <p className="text-2xl font-black text-white">₺{total}</p>
          </div>

          {/* Ad Soyad */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#8b9ab3]">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z"/></svg>
              Gönderen Ad Soyad <span className="text-red-400">*</span>
            </label>
            <input
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              placeholder="Ahmet Yılmaz"
              className="w-full rounded-xl border border-[#1e2d42] bg-[#070f1c] px-3.5 py-2.5 text-sm text-white placeholder-[#3a4a5c] outline-none focus:border-[#3b82f680]"
            />
          </div>

          {/* Dekont */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#8b9ab3]">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd"/></svg>
              Dekont / Makbuz
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition-colors ${
                file ? 'border-emerald-500 bg-emerald-950/20' : 'border-[#1e2d42] bg-[#070f1c] hover:border-[#3b82f6]'
              }`}
            >
              <svg className="h-6 w-6 text-[#3a4a5c]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
              <p className="text-xs text-[#5a6a80]">
                {file
                  ? <span className="text-emerald-400">{file.name} ✓</span>
                  : <><span>Dosya seçmek için tıklayın</span><br /><span className="text-[10px] text-[#3a4a5c]">Görsel veya belge — Maks. 10MB</span></>
                }
              </p>
            </div>
            <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
            <p className="mt-1.5 text-[11px] text-[#3a4a5c]">* Dekont yüklerseniz ödemeniz daha hızlı onaylanır.</p>
          </div>
        </div>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/447441921660?text=${encodeURIComponent(waMsg)}`}
          target="_blank" rel="noopener noreferrer"
          className="mx-5 mb-3 flex items-center justify-center gap-2 rounded-xl border border-[#25d36633] bg-[#25d36610] py-3 text-sm font-bold text-[#25d366] hover:bg-[#25d36618] transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp&apos;tan Bildir
        </a>

        {/* Butonlar */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          <button onClick={onClose} className="rounded-xl border border-[#1e2d42] bg-transparent py-3 text-sm font-bold text-[#8b9ab3] hover:text-white transition-colors">İptal</button>
          <button onClick={submit} disabled={loading} className="rounded-xl bg-emerald-500 py-3 text-sm font-black text-[#071a0e] transition-opacity disabled:opacity-60">
            {loading ? 'Gönderiliyor...' : 'Bildirimi Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ana Sayfa ───────────────────────────────────────────────────────────────
function OdemeInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);

  const paket    = searchParams.get('paket')    || 'Premium';
  const sure     = searchParams.get('sure')     || '';
  const toplam   = searchParams.get('toplam')   || '0';
  const original = searchParams.get('orijinal') || '';
  const cihaz    = searchParams.get('cihaz')    || '1';

  const userEmail = session?.user?.email || '';
  const userName  = session?.user?.name  || '';

  const totalNum = parseFloat(toplam);
  const origNum  = parseFloat(original);
  const savedNum = Math.round((origNum - totalNum) * 100) / 100;
  const fmt = (n: number) => { const [i, d] = n.toFixed(2).split('.'); return `${i},${d}`; };

  useEffect(() => {
    fetch('/api/payment-info')
      .then(r => r.json())
      .then(data => {
        if (data.success) setPaymentInfo(data.data);
        else setError('Ödeme bilgisi bulunamadı. WhatsApp üzerinden iletişime geçin.');
      })
      .catch(() => setError('Ödeme bilgisi yüklenemedi.'))
      .finally(() => setLoading(false));
  }, []);

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#060d18] p-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-950/50 text-4xl">✅</div>
        <h1 className="mb-2 text-2xl font-black text-white">Bildiriminiz Alındı!</h1>
        <p className="mb-6 max-w-xs text-sm text-[#5a6a80]">
          Ödemeniz onaylandıktan sonra hesabınız aktif edilecektir. Genellikle 5–15 dakika içinde bildirim yapılır.
        </p>
        <Link href="/profil" className="rounded-xl border border-[#1e2d42] px-6 py-3 text-sm font-semibold text-[#8b9ab3] hover:text-white">
          Profilime Git →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060d18] text-white">
      {/* Header */}
      <div className="border-b border-[#1e2d42] bg-[#060d18]/95 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-sm font-bold">Galya<span className="text-[#3b82f6]">Stream</span></Link>
          <Link href="/abonelik" className="text-xs text-[#5a6a80] hover:text-white">← Paketlere Dön</Link>
        </div>
      </div>

      {/* Hero */}
      <div className="py-8 text-center">
        <h1 className="mb-2 text-3xl font-black">Abonelik Satın Al</h1>
        <p className="mb-6 text-sm text-[#5a6a80]">Binlerce film, dizi ve canlı yayın seni bekliyor</p>
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500">
              <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/></svg>
            </span>
            <span className="text-sm font-bold">Plan Seçin</span>
          </div>
          <div className="h-px w-10 bg-[#1e2d42]" />
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3b82f6]">
              <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M2.5 4A1.5 1.5 0 001 5.5v1h18v-1A1.5 1.5 0 0017.5 4h-15zM19 8.5H1V14.5A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5V8.5z"/></svg>
            </span>
            <span className="text-sm font-bold">Ödeme</span>
          </div>
        </div>
      </div>

      {/* Geri */}
      <div className="mx-auto max-w-5xl px-4">
        <Link href="/abonelik" className="mb-4 flex items-center gap-1.5 text-sm text-[#5a6a80] hover:text-white">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd"/></svg>
          Planı Değiştir
        </Link>
      </div>

      <main className="mx-auto grid max-w-5xl gap-5 px-4 pb-16 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">

          {/* Ödeme Yöntemi */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex cursor-not-allowed flex-col items-center gap-2 rounded-2xl border border-[#131f30] bg-[#0a1320] p-5 opacity-40">
              <svg className="h-6 w-6 text-[#4a5a70]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              <span className="text-sm font-bold text-[#4a5a70]">Kredi Kartı</span>
            </div>
            <div className="relative flex flex-col items-center gap-2 rounded-2xl border-2 border-emerald-500 bg-[#071a0e] p-5">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black text-[#071a0e]">%5 İNDİRİM</span>
              <svg className="mt-1 h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              <span className="text-sm font-bold text-white">Havale/EFT</span>
            </div>
          </div>

          {/* Loading */}
          {loading && <div className="h-28 animate-pulse rounded-2xl bg-[#0a1320]" />}

          {/* AŞAMA 1: Admin notu + Onay (IBAN görünmeden önce) */}
          {paymentInfo && !accepted && (
            <div className="overflow-hidden rounded-2xl border border-amber-500/25 bg-[#150e00]">
              <div className="flex items-center gap-2.5 border-b border-amber-500/20 px-5 py-4">
                <svg className="h-5 w-5 shrink-0 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-bold text-amber-400">Ödeme Yaparken Dikkat Edin</span>
              </div>

              <div className="px-5 py-4">
                {paymentInfo.note ? (
                  <p className="text-sm leading-relaxed text-amber-200/80">{paymentInfo.note}</p>
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {[
                      'Açıklama kısmına kesinlikle aşağıdaki ödeme kodunu yazınız.',
                      'Gönderilecek tutar birebir aynı olmalıdır.',
                      'Aksi halde ödemeniz otomatik olarak onaylanmaz.',
                    ].map(t => (
                      <li key={t} className="flex items-start gap-2.5 text-sm text-amber-200/80">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Onay */}
              <div className="border-t border-amber-500/20 px-5 py-4">
                <div className="mb-4 flex cursor-pointer items-start gap-3" onClick={() => setChecked(v => !v)}>
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${checked ? 'border-amber-400 bg-amber-400/20' : 'border-amber-500/50'}`}>
                    {checked && (
                      <svg className="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/></svg>
                    )}
                  </div>
                  <span className="text-sm text-amber-300/80">Okudum, onaylıyorum. Ödeme talimatlarına uyacağım.</span>
                </div>
                <button
                  disabled={!checked}
                  onClick={() => setAccepted(true)}
                  className="w-full rounded-xl bg-amber-500 py-3 text-sm font-black text-[#1a0800] transition-all hover:opacity-90 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Okudum, Devam Et →
                </button>
              </div>
            </div>
          )}

          {/* AŞAMA 2: Banka bilgileri (onay sonrası açılır) */}
          {paymentInfo && accepted && (
            <>
              {/* Banka Bilgileri */}
              <div className="overflow-hidden rounded-2xl border border-[#131f30] bg-[#0a1320]">
                <div className="flex flex-col gap-2.5 p-4">
                  {/* Banka adı */}
                  <div className="flex items-center justify-between border-b border-[#131f30] pb-2.5">
                    <span className="text-xs text-[#5a6a80]">Banka</span>
                    <span className="text-sm font-bold">{paymentInfo.bankName}</span>
                  </div>
                  {/* Alıcı */}
                  <div className="flex items-center justify-between rounded-xl border border-[#131f30] bg-[#0d1525] px-3 py-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a5a70]">Alıcı</p>
                      <p className="text-sm font-bold uppercase">{paymentInfo.accountHolder}</p>
                    </div>
                    <CopyBtn value={paymentInfo.accountHolder} />
                  </div>
                  {/* IBAN */}
                  <div className="flex items-center justify-between rounded-xl border border-[#131f30] bg-[#0d1525] px-3 py-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a5a70]">IBAN</p>
                      <p className="font-mono text-sm font-bold">{paymentInfo.iban.replace(/(.{4})/g, '$1 ').trim()}</p>
                    </div>
                    <CopyBtn value={paymentInfo.iban.replace(/\s/g, '')} />
                  </div>
                  {/* Hesap No (varsa) */}
                  {paymentInfo.accountNo && (
                    <div className="flex items-center justify-between rounded-xl border border-[#131f30] bg-[#0d1525] px-3 py-2.5">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a5a70]">Hesap No</p>
                        <p className="font-mono text-sm font-bold">{paymentInfo.accountNo}</p>
                      </div>
                      <CopyBtn value={paymentInfo.accountNo} />
                    </div>
                  )}
                  {/* Açıklamaya Yazılacak Kod */}
                  {(paymentInfo.paymentCode || paymentInfo.note) && (() => {
                    const rawCode  = (paymentInfo.paymentCode || paymentInfo.note || '');
                    const numOnly  = rawCode.replace(/\D/g, '');
                    const copyVal  = numOnly;
                    return (
                      <div className="flex items-center justify-between rounded-xl border border-[#131f30] bg-[#0d1525] px-3 py-2.5">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a5a70]">Açıklama Kodu</p>
                          <p className="font-mono text-sm font-bold">{numOnly}</p>
                          <p className="mt-0.5 text-[10px] text-[#4a5a70]">⚠ Havale/EFT açıklama kısmına bu kodu yazınız.</p>
                        </div>
                        <CopyBtn value={copyVal} />
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Ödemeyi Gönderdim */}
              <button
                onClick={() => setShowModal(true)}
                className="w-full rounded-2xl bg-white py-4 text-base font-black text-[#060d18] transition-all hover:bg-gray-100 active:scale-[.99]"
              >
                Ödemeyi Gönderdim
              </button>
            </>
          )}

          {/* Hata */}
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4">
              <p className="text-sm text-red-400">{error}</p>
              <a href="https://wa.me/447441921660" target="_blank" rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#25d366]">
                WhatsApp&apos;tan iletişime geç →
              </a>
            </div>
          )}
        </div>

        {/* ─── Sipariş Özeti ─────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-[#131f30] bg-[#0a1320] self-start lg:sticky lg:top-4">
          <div className="border-b border-[#131f30] px-5 py-4">
            <p className="text-base font-bold">Sipariş Özeti</p>
          </div>

          {/* Plan satırı */}
          <div className="flex items-center justify-between border-b border-[#131f30] px-5 py-3.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <svg className="h-4 w-4 text-[#4a5a70]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5z"/>
              </svg>
              {paket} · {sure} · {cihaz} Cihaz
            </div>
            <svg className="h-4 w-4 text-[#4a5a70]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
          </div>

          {/* Paket detayları */}
          <div className="border-b border-[#131f30]">
            {[
              { d: 'M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5z', label: 'Paket', value: paket },
              { d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z', label: 'Süre', value: sure },
              { d: 'M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z', label: 'Cihaz', value: `${cihaz} Cihaz` },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-5 py-2.5">
                <div className="flex items-center gap-2 text-sm text-[#5a6a80]">
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d={row.d}/></svg>
                  {row.label}
                </div>
                <span className="text-sm font-bold text-white">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Fiyat */}
          <div className="flex flex-col gap-3 border-b border-[#131f30] px-5 py-4">
            {original && (
              <div className="flex justify-between text-sm">
                <span className="text-[#5a6a80]">Ara Toplam</span>
                <span className="font-semibold">₺{fmt(origNum)}</span>
              </div>
            )}
            {savedNum > 0 && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
                  Toplam Tasarruf
                </span>
                <span className="font-semibold text-emerald-400">-₺{fmt(savedNum)}</span>
              </div>
            )}
          </div>

          {/* Toplam */}
          <div className="px-5 py-4">
            <div className="flex items-end justify-between">
              <span className="font-bold">Toplam</span>
              <div className="text-right">
                {savedNum > 0 && <p className="text-xs text-[#2a3a4e] line-through">₺{fmt(origNum)}</p>}
                <p className="text-2xl font-black">₺{fmt(totalNum)}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <PaymentModal
          total={fmt(totalNum)}
          paket={paket}
          sure={sure}
          cihaz={cihaz}
          userEmail={userEmail}
          userName={userName}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); setSuccess(true); }}
        />
      )}
    </div>
  );
}

function OdemePageContent() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060d18] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3b82f6] border-t-transparent" /></div>}>
      <OdemeInner />
    </Suspense>
  );
}

export default function OdemePage() {
  return <SessionProvider><OdemePageContent /></SessionProvider>;
}
