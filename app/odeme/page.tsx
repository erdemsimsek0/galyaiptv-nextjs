'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SessionProvider, useSession } from 'next-auth/react';
import { Suspense } from 'react';
import QRCode from 'qrcode';

interface PaymentInfo {
  bankName:      string;
  accountHolder: string;
  iban:          string;
  accountNo?:    string;
  branch?:       string;
  note?:         string;
}

function CopyBtn({ value }: { value: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className={`flex shrink-0 items-center justify-center rounded-lg p-2 transition-colors ${ok ? 'text-emerald-400' : 'text-[#4a5a70] hover:text-white'}`}
    >
      {ok ? (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/></svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z"/><path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z"/></svg>
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
    if (!senderName.trim()) { return; }
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
              className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition-colors ${file ? 'border-emerald-500 bg-emerald-950/20' : 'border-[#1e2d42] bg-[#070f1c] hover:border-[#3b82f6]'}`}
            >
              <svg className="h-6 w-6 text-[#3a4a5c]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
              <p className="text-xs text-[#5a6a80]">{file ? <span className="text-emerald-400">{file.name} ✓</span> : <>Dosya seçmek için tıklayın<br /><span className="text-[10px] text-[#3a4a5c]">Görsel veya belge — Maks. 10MB</span></>}</p>
            </div>
            <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
            <p className="mt-1.5 text-[11px] text-[#3a4a5c]">* Dekont yüklerseniz ödemeniz daha hızlı onaylanır.</p>
          </div>
        </div>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/447441921660?text=${encodeURIComponent(waMsg)}`}
          target="_blank" rel="noopener noreferrer"
          className="mx-5 mb-3 flex items-center justify-center gap-2 rounded-xl border border-[#25d36633] bg-[#25d36610] py-3 text-sm font-bold text-[#25d366]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp'tan Bildir
        </a>

        {/* Butonlar */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          <button onClick={onClose} className="rounded-xl border border-[#1e2d42] bg-transparent py-3 text-sm font-bold text-[#8b9ab3]">İptal</button>
          <button onClick={submit} disabled={loading} className="rounded-xl bg-emerald-500 py-3 text-sm font-black text-[#071a0e] disabled:opacity-60">
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
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const paket  = searchParams.get('paket')   || 'Premium';
  const sure   = searchParams.get('sure')    || '';
  const toplam = searchParams.get('toplam')  || '0';
  const indirim = searchParams.get('indirim') || '0';
  const original = searchParams.get('orijinal') || '';
  const cihaz  = searchParams.get('cihaz')   || '1';

  const userEmail = session?.user?.email || '';
  const userName  = session?.user?.name  || '';

  // Fiyat hesapları
  const totalNum   = parseFloat(toplam);
  const origNum    = parseFloat(original);
  const savedNum   = Math.round((origNum - totalNum) * 100) / 100;
  const fmt = (n: number) => { const [i, d] = n.toFixed(2).split('.'); return `${i},${d}`; };

  useEffect(() => {
    fetch('/api/payment-info')
      .then(r => r.json())
      .then(data => {
        if (data.success) setPaymentInfo(data.data);
        else setError('Ödeme bilgisi bulunamadı.');
      })
      .catch(() => setError('Ödeme bilgisi yüklenemedi.'))
      .finally(() => setLoading(false));
  }, []);

  // IBAN'dan QR üret
  useEffect(() => {
    if (paymentInfo?.iban && qrRef.current) {
      QRCode.toCanvas(qrRef.current, `IBAN:${paymentInfo.iban.replace(/\s/g, '')}`, {
        width: 120, margin: 1, color: { dark: '#000000', light: '#ffffff' }
      });
    }
  }, [paymentInfo]);

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#060d18] p-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-950/50 text-4xl">✅</div>
        <h1 className="mb-2 text-2xl font-black text-white">Bildiriminiz Alındı!</h1>
        <p className="mb-6 max-w-xs text-sm text-[#5a6a80]">Ödemeniz onaylandıktan sonra hesabınız aktif edilecektir. Genellikle 5–15 dakika içinde bildirim yapılır.</p>
        <Link href="/profil" className="rounded-xl border border-[#1e2d42] px-6 py-3 text-sm font-semibold text-[#8b9ab3] hover:text-white">Profilime Git →</Link>
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

      {/* Back */}
      <div className="mx-auto max-w-5xl px-4">
        <Link href="/abonelik" className="mb-4 flex items-center gap-1.5 text-sm text-[#5a6a80] hover:text-white">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd"/></svg>
          Planı Değiştir
        </Link>
      </div>

      {/* Ana Grid */}
      <main className="mx-auto grid max-w-5xl gap-5 px-4 pb-16 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          {/* Ödeme Yöntemi Tabları */}
          <div className="grid grid-cols-2 gap-3">
            {/* Kredi Kartı - Pasif */}
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#131f30] bg-[#0a1320] p-5 opacity-40 cursor-not-allowed">
              <svg className="h-6 w-6 text-[#4a5a70]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              <span className="text-sm font-bold text-[#4a5a70]">Kredi Kartı</span>
            </div>
            {/* Havale/EFT - Aktif */}
            <div className="relative flex flex-col items-center gap-2 rounded-2xl border-2 border-emerald-500 bg-[#071a0e] p-5">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black text-[#071a0e]">%5 İNDİRİM</span>
              <svg className="h-6 w-6 text-emerald-400 mt-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              <span className="text-sm font-bold text-white">Havale/EFT</span>
            </div>
          </div>

          {/* Uyarı Kutusu */}
          <div className="rounded-2xl border border-amber-500/20 bg-[#150e00] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-400">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
              Ödeme Yaparken Dikkat Edin
            </div>
            <ul className="flex flex-col gap-2">
              {['Açıklama kısmını kesinlikle boş bırakın.', 'Gönderilecek tutar birebir aynı olmalıdır.', 'Aksi halde ödemeniz otomatik olarak onaylanmaz.'].map(t => (
                <li key={t} className="flex items-start gap-2 text-xs text-amber-700">
                  <span className="mt-0.5 text-amber-500">•</span>{t}
                </li>
              ))}
            </ul>
          </div>

          {/* Banka Kartı */}
          {loading && <div className="h-40 animate-pulse rounded-2xl bg-[#0a1320]" />}
          {error && <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-400">{error}</div>}
          {paymentInfo && (
            <div className="flex overflow-hidden rounded-2xl border border-[#131f30] bg-[#0a1320]">
              {/* QR */}
              <div className="flex w-36 shrink-0 items-center justify-center bg-white p-4">
                <canvas ref={qrRef} />
              </div>
              {/* Bilgiler */}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-center justify-between border-b border-[#131f30] pb-3">
                  <span className="text-xs text-[#5a6a80]">Banka</span>
                  <span className="text-sm font-bold">{paymentInfo.bankName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#131f30] pb-3">
                  <span className="text-xs text-[#5a6a80]">Alıcı</span>
                  <span className="text-sm font-bold uppercase">{paymentInfo.accountHolder}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#131f30] bg-[#0d1525] px-3 py-2.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a5a70]">IBAN</p>
                    <p className="font-mono text-sm font-bold">{paymentInfo.iban.replace(/(.{4})/g, '$1 ').trim()}</p>
                  </div>
                  <CopyBtn value={paymentInfo.iban.replace(/\s/g, '')} />
                </div>
                {paymentInfo.accountNo && (
                  <div className="flex items-center justify-between rounded-xl border border-[#131f30] bg-[#0d1525] px-3 py-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a5a70]">Hesap No</p>
                      <p className="font-mono text-sm font-bold">{paymentInfo.accountNo}</p>
                    </div>
                    <CopyBtn value={paymentInfo.accountNo} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gönder Butonu */}
          {paymentInfo && (
            <button
              onClick={() => setShowModal(true)}
              className="w-full rounded-2xl bg-white py-4 text-base font-black text-[#060d18] transition-all hover:bg-gray-100"
            >
              Ödemeyi Gönderdim
            </button>
          )}
        </div>

        {/* ─── Sipariş Özeti ─────────────────────────────── */}
        <div className="rounded-2xl border border-[#131f30] bg-[#0a1320] overflow-hidden lg:sticky lg:top-4 self-start">
          <div className="border-b border-[#131f30] px-5 py-4">
            <p className="text-base font-bold">Sipariş Özeti</p>
          </div>
          <div className="flex items-center justify-between border-b border-[#131f30] px-5 py-3.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
              {paket} · {sure} · {cihaz} Cihaz
            </div>
            <svg className="h-4 w-4 text-[#4a5a70]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
          </div>
          <div className="flex flex-col gap-3 border-b border-[#131f30] px-5 py-4">
            {original && <div className="flex justify-between text-sm"><span className="text-[#5a6a80]">Ara Toplam</span><span className="font-semibold">₺{fmt(origNum)}</span></div>}
            {savedNum > 0 && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-emerald-400">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
                  Toplam Tasarruf
                </span>
                <span className="font-semibold text-emerald-400">-₺{fmt(savedNum)}</span>
              </div>
            )}
          </div>
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
