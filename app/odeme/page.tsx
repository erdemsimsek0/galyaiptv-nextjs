'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface PaymentInfo {
  bankName:      string;
  accountHolder: string;
  iban:          string;
  branch:        string;
  note:          string;
  updatedAt:     number;
}

interface OrderSummary {
  packageName: string; // "Max", "Sports", "Cinema"
  duration:    string; // "1 Ay", "6 Ay", "12 Ay"
  originalTL:  number; // indirim öncesi
  totalTL:     number; // ödenecek toplam
  discount:    number; // % indirim (0 ise yok)
}

// ─── Kopyala butonu ───────────────────────────────────────────────────────────
function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
        copied
          ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400'
          : 'border-[#1e2d42] text-[#6b7280] hover:border-[#3b82f6]/40 hover:text-[#3b82f6]'
      }`}
    >
      {copied ? (
        <><svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor"><path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>Kopyalandı</>
      ) : (
        <><svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"/></svg>{label || 'Kopyala'}</>
      )}
    </button>
  );
}

// ─── Sipariş Özeti ────────────────────────────────────────────────────────────
function OrderSummaryCard({ order }: { order: OrderSummary }) {
  const savingsTL = order.originalTL - order.totalTL;
  return (
    <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-white">Sipariş Özeti</h3>
        <span className="rounded-full border border-[#1e2d42] px-2.5 py-0.5 text-[11px] text-[#6b7280]">
          {order.packageName} · {order.duration}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-[#8b9ab3]">
          <span>Paket</span><span className="text-white">{order.packageName}</span>
        </div>
        <div className="flex justify-between text-[#8b9ab3]">
          <span>Süre</span><span className="text-white">{order.duration}</span>
        </div>
        <div className="my-2 h-px bg-[#1e2d42]" />
        <div className="flex justify-between text-[#8b9ab3]">
          <span>Ara Toplam</span>
          <span className={order.discount > 0 ? 'line-through text-[#4b5563]' : 'text-white'}>
            ₺{order.originalTL.toFixed(2).replace('.', ',')}
          </span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zM0 8a8 8 0 1116 0A8 8 0 010 8z"/><path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/></svg>
              Toplam Tasarruf
            </span>
            <span className="text-emerald-400">-₺{savingsTL.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
        <div className="my-2 h-px bg-[#1e2d42]" />
        <div className="flex justify-between">
          <span className="font-semibold text-white">Toplam</span>
          <div className="text-right">
            {order.discount > 0 && (
              <div className="text-xs line-through text-[#4b5563]">₺{order.originalTL.toFixed(2).replace('.', ',')}</div>
            )}
            <span className="text-xl font-extrabold text-white">
              ₺{order.totalTL.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {order.discount > 0 && (
        <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-2">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-emerald-400">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
          </svg>
          <span className="text-xs text-emerald-400">%{order.discount} indirim uygulandı</span>
        </div>
      )}
    </div>
  );
}

// ─── İçerik (useSearchParams kullanan kısım) ──────────────────────────────────
function OdemeContent() {
  const searchParams  = useSearchParams();
  const [payInfo, setPayInfo]     = useState<PaymentInfo | null>(null);
  const [loadingInfo, setLoading] = useState(true);
  const [infoError, setInfoError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // URL parametrelerinden sipariş bilgisi
  const packageName = searchParams.get('paket')    || 'Max';
  const duration    = searchParams.get('sure')     || '1 Ay';
  const totalTL     = parseFloat(searchParams.get('toplam')  || '229.90');
  const originalTL  = parseFloat(searchParams.get('orijinal') || String(totalTL));
  const discount    = parseInt(searchParams.get('indirim')   || '0', 10);

  const order: OrderSummary = { packageName, duration, originalTL, totalTL, discount };

  // IBAN bilgilerini admin API'den çek
  const fetchPayInfo = useCallback(async () => {
    setLoading(true); setInfoError('');
    try {
      const res  = await fetch('/api/payment-info');
      const json = await res.json();
      if (json.success) { setPayInfo(json.data); }
      else { setInfoError(json.error || 'Ödeme bilgileri yüklenemedi.'); }
    } catch {
      setInfoError('Sunucuya bağlanılamadı. Lütfen sayfayı yenileyin.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPayInfo(); }, [fetchPayInfo]);

  // IBAN'ı gruplara böl (TR12 3456 7890 ...)
  const formatIBAN = (iban: string) =>
    iban.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Başlık */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-black tracking-tight md:text-4xl">Premium&apos;a Yükselt</h1>
        <p className="text-sm text-[#6b7280]">Binlerce film, dizi ve canlı yayın seni bekliyor</p>
      </div>

      {/* Adım göstergesi */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">✓</span>
          <span className="text-sm font-semibold text-emerald-400">Plan Seçin</span>
        </div>
        <div className="h-px w-10 bg-[#1e2d42]" />
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3b82f6] text-xs font-bold text-white">2</span>
          <span className="text-sm font-semibold text-white">Ödeme</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

        {/* Sol: Ödeme yöntemi */}
        <div className="space-y-5">
          {/* Geri dön */}
          <Link href="/#paketler" className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] transition-colors hover:text-white">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor"><path fillRule="evenodd" d="M9.78 4.22a.75.75 0 010 1.06L6.56 8l3.22 2.72a.75.75 0 11-.98 1.14l-3.75-3.25a.75.75 0 010-1.12l3.75-3.25a.75.75 0 011.0.72z"/></svg>
            Planı Değiştir
          </Link>

          {/* Ödeme yöntemi seçimi — sadece Havale/EFT */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Ödeme Yöntemi</p>
            <div className="flex gap-3">
              {/* Kredi Kartı — devre dışı */}
              <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-[#1e2d42] bg-[#0a1020] px-4 py-4 opacity-40 cursor-not-allowed">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#4b5563]" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
                </svg>
                <span className="text-xs font-medium text-[#4b5563]">Kredi Kartı</span>
                <span className="rounded-full bg-[#1e2d42] px-2 py-0.5 text-[9px] text-[#4b5563]">Yakında</span>
              </div>

              {/* Havale/EFT — aktif, seçili */}
              <div className="relative flex flex-1 flex-col items-center gap-2 rounded-xl border-2 border-[#3b82f6] bg-[#0c1628] px-4 py-4">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#3b82f6] px-3 py-0.5 text-[10px] font-bold text-white">
                  %5 İNDİRİM
                </div>
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#3b82f6]" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 21l18-18M3 6.5h11M3 10.5h8M3 14.5h5M14 14l3 3 4-4"/>
                </svg>
                <span className="text-xs font-bold text-white">Havale / EFT</span>
              </div>
            </div>
          </div>

          {/* IBAN Bilgileri */}
          <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525]">
            <div className="border-b border-[#1e2d42] px-5 py-4">
              <h3 className="font-semibold text-white">Banka Bilgileri</h3>
              <p className="mt-0.5 text-xs text-[#6b7280]">Aşağıdaki hesaba ödeme yapın</p>
            </div>

            {loadingInfo ? (
              <div className="flex items-center justify-center gap-3 px-5 py-10">
                <svg className="h-5 w-5 animate-spin text-[#3b82f6]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span className="text-sm text-[#6b7280]">Banka bilgileri yükleniyor...</span>
              </div>
            ) : infoError ? (
              <div className="px-5 py-8 text-center">
                <p className="mb-3 text-sm text-red-400">{infoError}</p>
                <button onClick={fetchPayInfo} className="rounded-lg border border-[#1e2d42] px-4 py-2 text-xs text-[#6b7280] transition-colors hover:text-white">
                  Tekrar Dene
                </button>
              </div>
            ) : payInfo ? (
              <div className="divide-y divide-[#1e2d42]">
                {/* Banka Adı */}
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Banka</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{payInfo.bankName}</p>
                    {payInfo.branch && <p className="text-xs text-[#6b7280]">{payInfo.branch}</p>}
                  </div>
                </div>

                {/* Hesap Sahibi */}
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Hesap Sahibi</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{payInfo.accountHolder}</p>
                  </div>
                  <CopyBtn value={payInfo.accountHolder} />
                </div>

                {/* IBAN */}
                <div className="px-5 py-3.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">IBAN</p>
                    <CopyBtn value={payInfo.iban.replace(/\s/g, '')} label="IBAN Kopyala" />
                  </div>
                  <p className="font-mono text-base font-bold tracking-widest text-white">
                    {formatIBAN(payInfo.iban)}
                  </p>
                </div>

                {/* Tutar */}
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Gönderilecek Tutar</p>
                    <p className="mt-0.5 text-xl font-extrabold text-[#3b82f6]">
                      ₺{order.totalTL.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <CopyBtn value={order.totalTL.toFixed(2)} label="Tutarı Kopyala" />
                </div>
              </div>
            ) : null}
          </div>

          {/* Uyarı kutusu */}
          {payInfo && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-4">
              <div className="mb-2 flex items-center gap-2">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-amber-400">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                </svg>
                <p className="text-sm font-semibold text-amber-400">Ödeme Yaparken Dikkat Edin</p>
              </div>
              <ul className="space-y-1 text-xs leading-relaxed text-amber-300/80">
                <li>• <strong className="text-amber-300">Açıklama kısmını kesinlikle boş</strong> bırakın.</li>
                <li>• Gönderilecek tutar <strong className="text-amber-300">birebir aynı</strong> olmalıdır.</li>
                <li>• Aksi halde ödemeniz otomatik olarak onaylanmaz.</li>
                {payInfo.note && payInfo.note !== 'Açıklama kısmını kesinlikle boş bırakın. Gönderilecek tutar birebir aynı olmalıdır.' && (
                  <li>• {payInfo.note}</li>
                )}
              </ul>
            </div>
          )}

          {/* Onay butonu */}
          {payInfo && !confirmed && (
            <button
              onClick={() => setConfirmed(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1e2d42] bg-[#0d1a2a] py-4 text-sm font-semibold text-white transition-all hover:border-[#3b82f6]/40 hover:bg-[#162035]"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#3b82f6]">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
              </svg>
              Okudum, Anladım
            </button>
          )}

          {/* Ödeme yapıldı bildirimi */}
          {confirmed && payInfo && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center">
              <div className="mb-3 text-3xl">✅</div>
              <p className="mb-1 font-semibold text-white">Ödemenizi Yaptınız mı?</p>
              <p className="mb-4 text-sm text-[#8b9ab3]">
                Ödeme onaylandıktan sonra hesabınız genellikle <strong className="text-white">15 dakika</strong> içinde aktif edilir.
                Gecikmeler için WhatsApp&apos;tan iletişime geçin.
              </p>
              <a
                href={`https://wa.me/447441921660?text=${encodeURIComponent(`Merhaba, ${order.packageName} ${order.duration} paket için ₺${order.totalTL.toFixed(2)} ödeme yaptım. Onay bekliyorum.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25d366] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1ebe5d]"
              >
                💬 WhatsApp&apos;tan Bildir
              </a>
            </div>
          )}
        </div>

        {/* Sağ: Sipariş özeti */}
        <div>
          <OrderSummaryCard order={order} />

          {/* Güven işaretleri */}
          <div className="mt-4 space-y-2">
            {[
              { icon: '🔒', text: 'SSL güvenli bağlantı' },
              { icon: '⚡', text: 'Onay sonrası anında aktivasyon' },
              { icon: '💬', text: '7/24 WhatsApp destek' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2.5 text-xs text-[#6b7280]">
                <span className="text-base">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Ana export ───────────────────────────────────────────────────────────────
export default function OdemePage() {
  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      {/* Basit header */}
      <div className="border-b border-[#1e2d42] bg-[#07111f]/95 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Galya IPTV" className="h-8 w-auto object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-base font-bold text-white">Galya <span className="text-[#3b82f6]">IPTV</span></span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-[#6b7280]">
            <span>🔒</span><span>Güvenli Ödeme</span>
          </div>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-24">
          <svg className="h-8 w-8 animate-spin text-[#3b82f6]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      }>
        <OdemeContent />
      </Suspense>
    </div>
  );
}
