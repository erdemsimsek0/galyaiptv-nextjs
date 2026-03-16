'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SessionProvider, useSession } from 'next-auth/react';
import { Suspense } from 'react';

interface PaymentInfo {
  bankName:      string;
  accountHolder: string;
  iban:          string;
  branch:        string;
  note:          string;
  updatedAt:     number;
}

function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${ok ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-400' : 'border-[#1e2d42] bg-[#0d1a2a] text-[#6b7280] hover:border-[#3b82f6]/40 hover:text-white'}`}
    >
      {ok ? '✓ Kopyalandı' : (label || 'Kopyala')}
    </button>
  );
}

function OdemeInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // URL'den paket bilgilerini oku
  const paket   = searchParams.get('paket')   || 'Belirtilmedi';
  const sure    = searchParams.get('sure')    || '';
  const toplam  = searchParams.get('toplam')  || '';
  const indirim = searchParams.get('indirim') || '0';
  const original = searchParams.get('orijinal') || '';
  const cihaz   = searchParams.get('cihaz')   || '1';

  const userEmail = session?.user?.email || '';
  const userName  = session?.user?.name  || '';

  // WhatsApp onay mesajı
  const waMsg = `Merhaba, ödeme yaptım. Bilgiler:\nPaket: ${paket} ${sure}\nToplam: ₺${toplam}\nE-posta: ${userEmail || '(belirtiniz)'}\nAd Soyad: ${userName || '(belirtiniz)'}`;

  useEffect(() => {
    fetch('/api/payment-info')
      .then(r => r.json())
      .then(data => {
        if (data.success) setPaymentInfo(data.data);
        else setError('Ödeme bilgisi henüz eklenmemiş. Lütfen WhatsApp üzerinden iletişime geçin.');
      })
      .catch(() => setError('Ödeme bilgisi yüklenemedi.'))
      .finally(() => setLoading(false));
  }, []);

  if (confirmed) {
    return (
      <div className="min-h-screen bg-[#07111f] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-950/50 text-4xl">✅</div>
          <h1 className="mb-3 text-2xl font-black text-white">Ödeme Bildiriminiz Alındı!</h1>
          <p className="mb-6 text-sm text-[#8b9ab3]">
            Ödemeniz onaylandıktan sonra hesabınız aktif edilecektir. Genellikle 5–15 dakika içinde bildirim yapılır.
          </p>
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-left space-y-2">
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Sipariş Özeti</p>
            <div className="flex justify-between text-sm"><span className="text-[#8b9ab3]">Paket</span><span className="font-semibold text-white">{paket}</span></div>
            {sure && <div className="flex justify-between text-sm"><span className="text-[#8b9ab3]">Süre</span><span className="font-semibold text-white">{sure}</span></div>}
            {toplam && <div className="flex justify-between text-sm"><span className="text-[#8b9ab3]">Tutar</span><span className="font-bold text-emerald-400">₺{toplam}</span></div>}
            {userEmail && <div className="flex justify-between text-sm"><span className="text-[#8b9ab3]">E-posta</span><span className="font-semibold text-white text-xs truncate max-w-[180px]">{userEmail}</span></div>}
          </div>
          <a
            href={`https://wa.me/447441921660?text=${encodeURIComponent(waMsg)}`}
            target="_blank" rel="noopener noreferrer"
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-3.5 text-sm font-bold text-white"
          >
            💬 WhatsApp ile Ödeme Bildirimi Yap
          </a>
          <Link href="/profil" className="flex w-full items-center justify-center rounded-xl border border-[#1e2d42] py-3 text-sm font-medium text-[#8b9ab3] hover:text-white">
            Profilime Git →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      {/* Header */}
      <div className="border-b border-[#1e2d42] bg-[#07111f]/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="GalyaStream" className="h-8 w-auto" style={{ display: 'none' }}
              onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.display='block'; const n=e.currentTarget.nextElementSibling as HTMLElement; if(n) n.style.display='none'; }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; const n=e.currentTarget.nextElementSibling as HTMLElement; if(n) n.style.display='inline'; }} />
            <span className="hidden text-sm font-bold">Galya<span className="text-[#3b82f6]">Stream</span></span>
          </Link>
          <Link href="/abonelik" className="text-xs text-[#6b7280] hover:text-white">← Paketlere Dön</Link>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Adım göstergesi */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b82f6] text-xs font-bold text-white">✓</span>
            <span className="text-sm text-white">Plan Seçildi</span>
          </div>
          <div className="h-px w-8 bg-[#3b82f6]" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b82f6] text-xs font-bold text-white">2</span>
            <span className="text-sm font-semibold text-white">Ödeme</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Sol: IBAN bilgileri */}
          <div className="space-y-4">
            <h1 className="text-2xl font-black">Banka Havalesi ile Öde</h1>
            <p className="text-sm text-[#8b9ab3]">
              Aşağıdaki hesaba ödeme tutarını havale / EFT yapın. Ödemenizin ardından WhatsApp üzerinden bildirim yapmanız yeterlidir.
            </p>

            {loading && (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-[#1e2d42]" />)}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
                <p className="text-sm text-amber-400">{error}</p>
                <a href="https://wa.me/447441921660" target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#25d366] hover:underline">
                  💬 WhatsApp ile İletişime Geç →
                </a>
              </div>
            )}

            {paymentInfo && (
              <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] overflow-hidden">
                <div className="border-b border-[#1e2d42] px-5 py-3 flex items-center gap-2">
                  <span className="text-base">🏦</span>
                  <p className="text-sm font-semibold text-white">Banka Bilgileri</p>
                </div>

                {[
                  { label: 'Banka',         value: paymentInfo.bankName },
                  { label: 'Hesap Sahibi',  value: paymentInfo.accountHolder },
                  { label: 'IBAN',          value: paymentInfo.iban.replace(/(.{4})/g, '$1 ').trim() },
                  ...(paymentInfo.branch ? [{ label: 'Şube', value: paymentInfo.branch }] : []),
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-3 border-b border-[#1e2d42] px-5 py-3.5 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">{row.label}</p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-white">{row.value}</p>
                    </div>
                    <CopyBtn value={row.label === 'IBAN' ? paymentInfo.iban : row.value} />
                  </div>
                ))}

                {paymentInfo.note && (
                  <div className="border-t border-[#1e2d42] bg-[#0d1a2a] px-5 py-3">
                    <p className="text-xs text-[#6b7280]">💡 {paymentInfo.note}</p>
                  </div>
                )}
              </div>
            )}

            {/* Açıklama alanı uyarısı */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <div>
                  <p className="text-sm font-bold text-amber-400">Açıklamaya bu kodu yazın</p>
                  <p className="text-xs text-amber-300/70 mt-0.5">
                    Açıklamaya kodu yazmazsanız ödeme gerçekleşmeyip paranız askıda kalacaktır.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-[#0d1a2a] border border-amber-500/20 px-4 py-3">
                <span className="flex-1 font-mono text-xl font-black text-white tracking-widest">
                  {userEmail ? '87964103873' : '··········'}
                </span>
                {userEmail && (
                  <CopyBtn value={'87964103873'} label="Kopyala" />
                )}
              </div>
              <p className="text-[10px] text-amber-300/50">
                Bu kod hesabınıza özgüdür. Ödeme açıklamasına eksiksiz yazınız.
              </p>
            </div>

            {/* Ödeme Tamamlandı butonu */}
            {paymentInfo && (
              <button
                onClick={() => setConfirmed(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white transition-all hover:bg-emerald-700"
              >
                ✅ Ödemeyi Yaptım, Aktif Et
              </button>
            )}

            <a
              href={`https://wa.me/447441921660?text=${encodeURIComponent(waMsg)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25d366]/20 bg-[#25d366]/5 py-3.5 text-sm font-semibold text-[#25d366] transition-all hover:bg-[#25d366]/10"
            >
              💬 WhatsApp ile Bildirimi Yap
            </a>
          </div>

          {/* Sağ: Sipariş özeti */}
          <div className="space-y-4 lg:sticky lg:top-4">
            <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#4b5563]">Sipariş Özeti</p>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[#8b9ab3]">Paket</span>
                  <span className="text-sm font-semibold text-white">{paket}</span>
                </div>
                {sure && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[#8b9ab3]">Süre</span>
                    <span className="text-sm font-semibold text-white">{sure}</span>
                  </div>
                )}
                {cihaz && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[#8b9ab3]">Cihaz</span>
                    <span className="text-sm font-semibold text-white">{cihaz} Cihaz</span>
                  </div>
                )}
                {original && Number(indirim) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[#8b9ab3]">Normal Fiyat</span>
                    <span className="text-sm line-through text-[#4b5563]">₺{Number(original).toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                {Number(indirim) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-emerald-400">İndirim</span>
                    <span className="text-sm font-semibold text-emerald-400">%{indirim}</span>
                  </div>
                )}
                <div className="border-t border-[#1e2d42] pt-3 flex justify-between">
                  <span className="font-semibold text-white">Toplam</span>
                  <span className="text-xl font-black text-white">₺{toplam || '—'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#1e2d42] bg-[#060e1a] p-4 space-y-2">
              <p className="text-xs font-semibold text-[#4b5563] uppercase tracking-wider">Güvence</p>
              {['Anında aktivasyon (ödeme sonrası)', '7/24 WhatsApp destek', 'Tüm cihazlarda çalışır', 'Sorun çözüm garantisi'].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-[#8b9ab3]">
                  <span className="text-emerald-400">✓</span>{item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function OdemePageContent() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07111f] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3b82f6] border-t-transparent" /></div>}>
      <OdemeInner />
    </Suspense>
  );
}

export default function OdemePage() {
  return (
    <SessionProvider>
      <OdemePageContent />
    </SessionProvider>
  );
}
