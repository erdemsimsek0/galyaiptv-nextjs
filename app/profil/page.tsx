'use client';

// DÜZELTME: 'use client' direktifi en üstte olmalı.
// 'force-dynamic' App Router'da sadece Server Component'lerde çalışır;
// Client Component'te bu satır etkisizdir — kaldırıldı.
// Eğer bu sayfanın önbelleklenmemesi gerekiyorsa, bir üst layout/server wrapper'a taşıyın.

import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TrialCreds {
  email?:    string;
  username:  string;
  password:  string;
  startedAt: number;
}

function useTrialCreds(email: string | null | undefined): TrialCreds | null {
  const [c, setC] = useState<TrialCreds | null>(null);
  useEffect(() => {
    if (!email) return;

    // localStorage'ı kontrol et — ama email eşleşiyor mu doğrula
    try {
      const raw = localStorage.getItem('galya_trial_creds');
      if (raw) {
        const p = JSON.parse(raw);
        if (p.username && p.email === email) {
          setC(p); // Hızlı göster, sonra Redis'ten doğrula
        } else {
          // Farklı hesabın verisi — temizle
          localStorage.removeItem('galya_trial_creds');
        }
      }
    } catch { /* */ }

    // Her zaman Redis'ten doğru veriyi çek
    fetch('/api/test-talep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_trial', email }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.username) {
          const cr = { email, username: data.username, password: data.password, startedAt: data.startedAt };
          setC(cr);
          try { localStorage.setItem('galya_trial_creds', JSON.stringify(cr)); } catch { /* */ }
        } else {
          // Redis'te bu email için test yok — localStorage'ı da temizle
          setC(null);
          try { localStorage.removeItem('galya_trial_creds'); } catch { /* */ }
        }
      })
      .catch(() => { /* network error */ });
  }, [email]);
  return c;
}

function useCountdown(startedAt: number | null): { display: string; expired: boolean } {
  const TOTAL = 3 * 60 * 60 * 1000;
  const [rem, setRem] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const calc = () => Math.max(0, TOTAL - (Date.now() - startedAt));
    setRem(calc());
    const id = setInterval(() => setRem(calc()), 1000);
    return () => clearInterval(id);
  }, [startedAt, TOTAL]);
  if (!startedAt || rem <= 0) return { display: '00:00:00', expired: true };
  const h = Math.floor(rem / 3600000);
  const m = Math.floor((rem % 3600000) / 60000);
  const s = Math.floor((rem % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { display: `${pad(h)}:${pad(m)}:${pad(s)}`, expired: false };
}

// ── Abonelik verisi ──────────────────────────────────────────────────────────
interface Subscription {
  plan: string;
  durationDays: number;
  username: string;
  password: string;
  assignedAt: number;
  expiresAt: number;
  remainingDays: number;
  expiresFormatted: string;
}

function useSubscription(email: string | null | undefined): Subscription | null {
  const [sub, setSub] = useState<Subscription | null>(null);
  useEffect(() => {
    if (!email) return;
    fetch(`/api/subscription?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => { if (data.success) setSub(data.subscription); })
      .catch(() => {});
  }, [email]);
  return sub;
}

function CopyBtn({ value }: { value: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setOk(true);
        setTimeout(() => setOk(false), 2000);
      }}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] transition-all ${ok ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400' : 'border-[#1e2d42] text-[#6b7280] hover:border-[#3b82f6]/40 hover:text-[#3b82f6]'}`}
    >
      {ok ? '✓' : (
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden="true">
          <path d="M4 2a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2zm2-1a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1z"/>
          <path d="M0 5a2 2 0 012-2h1v1H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-1h1v1a2 2 0 01-2 2H2a2 2 0 01-2-2z"/>
        </svg>
      )}
    </button>
  );
}

// ── Logo: resim yüklenemezse metin fallback ─────────────────────────────────
function LogoWithFallback({ className = 'h-8 w-auto' }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="text-sm font-bold text-white">
        Galya<span className="text-[#3b82f6]">Stream</span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="GalyaStream"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

// ── İç bileşen: SessionProvider içinde çalışır ────────────────────────────
function ProfilInner() {
  const { data: session, status } = useSession();
  const router  = useRouter();
  const userEmail = session?.user?.email ?? null;
  const creds   = useTrialCreds(userEmail);
  const { display: countdown, expired } = useCountdown(creds?.startedAt ?? null);
  const subscription = useSubscription(userEmail);

  // ── Tüm state'ler — erken return'lerden ÖNCE ──────────────────────────────
  const [signingOut, setSigningOut] = useState(false);
  const [trialModal, setTrialModal] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialMsg, setTrialMsg] = useState('');
  const [trialProgress, setTrialProgress] = useState(0);
  const trialProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [refCopied, setRefCopied] = useState(false);
  const [showSupport, setShowSupport]       = useState(false);
  const [supportStep, setSupportStep]       = useState<'select'|'form'|'done'>('select');
  const [selectedIssue, setSelectedIssue]   = useState('');
  const [supportPhone, setSupportPhone]     = useState('');
  const [supportNote, setSupportNote]       = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportMsg, setSupportMsg]         = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/giris');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#07111f] flex items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-[#3b82f6]" viewBox="0 0 24 24" fill="none" aria-label="Yükleniyor">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (!session) return null;

  const user  = session.user!;
  const name  = user.name  || user.email?.split('@')[0] || 'Kullanıcı';
  const email = user.email || '';
  const avatar= user.image;

  const openTrialModal = () => {
    setTrialMsg('');
    setTrialProgress(0);
    setTrialModal(true);
    createDirectTrial();
  };

  const createDirectTrial = async () => {
    const emailToUse = session?.user?.email || '';
    if (!emailToUse) return;
    setTrialLoading(true);
    setTrialMsg('');
    setTrialProgress(0);

    // Progress bar animasyonu
    if (trialProgressRef.current) clearInterval(trialProgressRef.current);
    trialProgressRef.current = setInterval(() => {
      setTrialProgress(prev => {
        if (prev >= 90) { clearInterval(trialProgressRef.current!); return 90; }
        return prev + (90 / (35000 / 300));
      });
    }, 300);

    try {
      const res = await fetch('/api/test-talep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_direct', email: emailToUse }),
      });
      const data = await res.json();
      if (trialProgressRef.current) clearInterval(trialProgressRef.current);

      if (data.success) {
        setTrialProgress(100);
        const cr = { email: emailToUse, username: data.username, password: data.password, startedAt: data.startedAt || Date.now() };
        try { localStorage.setItem('galya_trial_creds', JSON.stringify(cr)); } catch { /* */ }
        setTimeout(() => {
          setTrialModal(false);
          setTrialLoading(false);
          window.location.reload();
        }, 1200);
      } else {
        setTrialMsg(data.error || 'Test oluşturulamadı.');
        setTrialLoading(false);
      }
    } catch {
      if (trialProgressRef.current) clearInterval(trialProgressRef.current);
      setTrialMsg('Sunucuya bağlanılamadı.');
      setTrialLoading(false);
    }
  };

  // ── Referans sistemi ──────────────────────────────────────────────────────
  const referralCode = email ? btoa(email).replace(/=/g, '').slice(0, 10).toUpperCase() : '';
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${referralCode}` : '';
  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  };

  // ── Destek talebi ─────────────────────────────────────────────────────────
  const SUPPORT_ISSUES = [
    { id: 'stream_error',   icon: '📺', title: 'Yayın açılmıyor',        desc: 'Kanal veya içerik yüklenmiyor' },
    { id: 'buffering',      icon: '⏳', title: 'Takılma / Donma',         desc: 'Yayın sürekli kesiliyor' },
    { id: 'login',          icon: '🔑', title: 'Giriş sorunu',            desc: 'Kullanıcı adı / şifre çalışmıyor' },
    { id: 'payment',        icon: '💳', title: 'Ödeme / Abonelik',        desc: 'Ödeme veya paket sorunu' },
    { id: 'missing_channel',icon: '📡', title: 'Kanal eksik',             desc: 'İstediğim kanal listede yok' },
    { id: 'other',          icon: '💬', title: 'Diğer',                   desc: 'Başka bir konu hakkında' },
  ];

  const openSupport = () => { setSupportStep('select'); setSelectedIssue(''); setSupportPhone(''); setSupportNote(''); setSupportMsg(''); setShowSupport(true); };
  const submitSupport = async () => {
    if (!supportPhone.trim()) { setSupportMsg('Telefon numarası zorunludur.'); return; }
    setSupportLoading(true); setSupportMsg('');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, issue: selectedIssue, phone: supportPhone, note: supportNote }),
      });
      const d = await res.json();
      if (d.success) setSupportStep('done');
      else setSupportMsg(d.error || 'Gönderilemedi.');
    } catch { setSupportMsg('Sunucuya bağlanılamadı.'); }
    finally { setSupportLoading(false); }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: '/' });
  };

  const SERVER = 'http://pro4kiptv.xyz:2086';
  const m3u    = creds
    ? `${SERVER}/get.php?username=${creds.username}&password=${creds.password}&type=m3u&output=ts`
    : '';

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      {/* Header — ana sayfayla aynı tasarım */}
      <div className="sticky top-0 z-50 border-b border-[#1e2d42] bg-[#07111f]/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <LogoWithFallback />
          </Link>

          {/* Orta nav — ana sayfa, Paketler, Özellikler, SSS */}
          <div className="hidden items-center md:flex">
            <div className="flex items-center gap-1 rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] px-2 py-1.5">
              {[
                { href: '/',            label: 'Ana Sayfa' },
                { href: '/#paketler',   label: 'Paketler' },
                { href: '/#ozellikler', label: 'Özellikler' },
                { href: '/#sss',        label: 'SSS' },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="rounded-xl px-4 py-1.5 text-sm font-medium text-[#8b9ab3] transition-colors hover:bg-[#162035] hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Sağ: avatar (Profilim butonu yok — zaten bu sayfadayız) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3b82f6] text-xs font-bold text-white">
                {name[0]?.toUpperCase() || 'U'}
              </span>
              <span className="hidden md:inline text-white">{name}</span>
            </div>
            {subscription ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/>
                </span>
                <span className="text-xs font-bold text-emerald-400">{subscription.plan} · {subscription.remainingDays} gün</span>
              </div>
            ) : (
              <Link href="/abonelik"
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-amber-600">
                Premium&apos;a Geç
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-lg px-3 py-6 space-y-3 sm:px-4 sm:py-8 sm:space-y-4">

        {/* ── Kullanıcı kartı ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-[#3b82f6]/40 sm:h-14 sm:w-14"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e3a5f] text-lg font-bold text-[#3b82f6] border-2 border-[#3b82f6]/40 sm:h-14 sm:w-14 sm:text-xl">
                  {name[0].toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">✓</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-bold text-white">{name}</p>
              <p className="truncate text-sm text-[#6b7280]">{email}</p>
            </div>
          </div>

          {creds && !subscription && (
            <div className={`mt-4 rounded-xl border px-4 py-3 ${expired ? 'border-red-500/40 bg-red-950/20' : 'border-emerald-500/30 bg-emerald-950/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                {!expired && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/>
                  </span>
                )}
                {expired && <span className="text-red-400 text-sm">⛔</span>}
                <span className={`text-xs font-semibold ${expired ? 'text-red-400' : 'text-white'}`}>
                  {expired ? 'Test Süresi Doldu' : '✅ Aktif Test Hesabı'}
                </span>
              </div>
              {!expired && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#6b7280]">Kalan süre</span>
                  <span className="font-mono text-xl font-black text-emerald-400 tracking-widest sm:text-2xl">{countdown}</span>
                </div>
              )}
              {expired && (
                <p className="text-[11px] text-red-400/70">Abonelik satın alarak izlemeye devam edin.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Abonelik Durumu ───────────────────────────────────────────────── */}
        {subscription && (
          <div className="rounded-2xl border border-emerald-500/30 bg-[#071a10] overflow-hidden">
            <div className="border-b border-emerald-500/20 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/>
                </span>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Aktif Abonelik</p>
              </div>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                {subscription.plan}
              </span>
            </div>

            {/* Kalan süre */}
            <div className="px-5 py-4 border-b border-emerald-500/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#6b7280]">Kalan Süre</span>
                <span className="text-2xl font-black text-white">{subscription.remainingDays} <span className="text-sm font-semibold text-[#6b7280]">gün</span></span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1e2d42]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                  style={{ width: `${Math.min(100, (subscription.remainingDays / subscription.durationDays) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-[10px] text-[#4b5563]">Bitiş: {subscription.expiresFormatted}</p>
            </div>

            {/* Kullanıcı adı / şifre */}
            {subscription.username && (
              <>
                {[
                  { label: 'Kullanıcı Adı', value: subscription.username },
                  { label: 'Şifre',         value: subscription.password },
                  { label: 'Server URL',    value: 'http://pro4kiptv.xyz:2086' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between border-b border-emerald-500/10 px-5 py-3 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">{row.label}</p>
                      <p className="mt-0.5 truncate font-mono text-sm font-semibold text-white">{row.value}</p>
                    </div>
                    <CopyBtn value={row.value} />
                  </div>
                ))}
              </>
            )}

            {/* Uzat butonu — %25 indirim rozeti */}
            <div className="px-5 py-3 bg-emerald-950/30">
              <Link href="/abonelik"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700">
                🔄 Aboneliği Uzat
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">%25 İNDİRİM</span>
              </Link>
            </div>
          </div>
        )}

        {/* ── Hızlı İşlemler ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] overflow-hidden">
          <div className="border-b border-[#1e2d42] px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Hızlı İşlemler</p>
          </div>
          <Link href="/kurulum-rehberi" className="flex items-center gap-4 border-b border-[#1e2d42] px-5 py-4 transition-colors hover:bg-[#0d1a2a]">
            <span className="text-xl">📺</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Uygulamada İzle</p>
              <p className="text-xs text-[#6b7280]">Kurulum rehberi</p>
            </div>
            <span className="text-[#4b5563]">›</span>
          </Link>
          <Link href="/abonelik" className="flex items-center gap-4 border-b border-[#1e2d42] px-5 py-4 transition-colors hover:bg-[#0d1a2a]">
            <span className="text-xl">👑</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Aboneliği Yönet</p>
              <p className="text-xs text-[#6b7280]">Paket yükselt veya değiştir</p>
            </div>
            <span className="text-[#4b5563]">›</span>
          </Link>
          {!creds && !subscription && (
            <button onClick={openTrialModal} className="flex w-full items-center gap-4 px-5 py-4 transition-colors hover:bg-[#0d1a2a]">
              <span className="text-xl">⚡</span>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-white">Ücretsiz Test Al</p>
                <p className="text-xs text-[#6b7280]">3 saatlik ücretsiz test</p>
              </div>
              <span className="text-[#4b5563]">›</span>
            </button>
          )}
        </div>

        {/* ── Test Bilgileri — sadece abonelik yoksa göster ─────────────── */}
        {creds && !subscription && (
          <div className={`rounded-2xl border overflow-hidden ${
            expired
              ? 'border-red-500/50 bg-[#1a0808]'
              : 'border-emerald-500/30 bg-[#071a10]'
          }`}>
            <div className={`border-b px-5 py-3 flex items-center justify-between ${
              expired ? 'border-red-500/20' : 'border-emerald-500/20'
            }`}>
              <div className="flex items-center gap-2">
                {!expired && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/>
                  </span>
                )}
                {expired && <span className="text-red-500 text-sm">⛔</span>}
                <p className={`text-xs font-bold uppercase tracking-widest ${
                  expired ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {expired ? 'Test Süresi Doldu' : 'Test Bilgileri'}
                </p>
              </div>
              {!expired && (
                <Link href="/kurulum-rehberi" className="text-xs text-[#3b82f6] hover:underline">
                  Kurulum Rehberi →
                </Link>
              )}
            </div>

            {/* Bilgiler — sadece süresi dolmamışsa göster */}
            {!expired ? (
              <>
                {[
                  { label: 'Kullanıcı Adı', value: creds.username },
                  { label: 'Şifre',         value: creds.password },
                  { label: 'Server URL',    value: SERVER },
                  { label: 'M3U URL',       value: m3u },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between border-b border-emerald-500/10 px-5 py-3 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">{row.label}</p>
                      <p className="mt-0.5 truncate font-mono text-sm font-semibold text-white">{row.value}</p>
                    </div>
                    <CopyBtn value={row.value} />
                  </div>
                ))}
                <div className="px-5 py-3 bg-emerald-950/30">
                  <Link href="/abonelik"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700">
                    👑 Premium&apos;a Geç →
                  </Link>
                </div>
              </>
            ) : (
              /* Süresi doldu — sadece abonelik çağrısı */
              <div className="px-5 py-5 text-center space-y-3">
                <p className="text-sm text-red-400/80">3 saatlik test süreniz sona erdi.</p>
                <Link href="/abonelik"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition-all hover:bg-red-700">
                  👑 Abonelik Satın Al →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Arkadaş Davet Et ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] overflow-hidden">
          <div className="border-b border-[#1e2d42] px-5 py-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Arkadaş Davet Et</p>
            <span className="text-xs text-[#3b82f6] bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-0.5 rounded-full">Yakında ödül sistemi</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="text-sm font-semibold text-white">Davet linkinizi paylaşın</p>
                <p className="text-xs text-[#6b7280] mt-0.5">Arkadaşlarınız bu link üzerinden kayıt olsun. Yakında referans ödülleri aktif olacak.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#060e1a] border border-[#1e2d42] rounded-xl px-3 py-2.5">
              <span className="flex-1 font-mono text-xs text-[#6b7280] truncate">{referralLink || 'galyastream.com/?ref=...'}</span>
              <button onClick={copyReferral}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${refCopied ? 'bg-emerald-600 text-white' : 'bg-[#3b82f6] hover:bg-[#2563eb] text-white'}`}>
                {refCopied ? '✓ Kopyalandı' : 'Kopyala'}
              </button>
            </div>
            <div className="flex gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(`GalyaStream'i dene! ${referralLink}`)}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#1e2d42] bg-[#060e1a] py-2 text-xs font-semibold text-[#6b7280] hover:text-white hover:border-white/20 transition-all">
                📱 WhatsApp
              </a>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("GalyaStream'i dene!")}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#1e2d42] bg-[#060e1a] py-2 text-xs font-semibold text-[#6b7280] hover:text-white hover:border-white/20 transition-all">
                ✈️ Telegram
              </a>
            </div>
          </div>
        </div>

        {/* ── Destek Talebi ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] overflow-hidden">
          <div className="border-b border-[#1e2d42] px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Destek</p>
          </div>
          <button onClick={openSupport} className="flex w-full items-center gap-4 px-5 py-4 transition-colors hover:bg-[#0d1a2a]">
            <span className="text-xl">🎫</span>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-white">Destek Talebi Aç</p>
              <p className="text-xs text-[#6b7280]">Sorun yaşıyorsanız bize bildirin</p>
            </div>
            <span className="text-[#4b5563]">›</span>
          </button>
        </div>

        {/* ── Hesap ─────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] overflow-hidden">
          <div className="border-b border-[#1e2d42] px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Hesap</p>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-base">📧</span>
              <div>
                <p className="text-sm font-semibold text-white">E-posta</p>
                <p className="text-xs text-[#6b7280]">{email}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-[#1e2d42] px-5 py-4">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-3 text-left transition-colors hover:text-red-400 disabled:opacity-50"
            >
              <span className="text-base">↩️</span>
              <div>
                <p className="text-sm font-semibold text-red-400/80">
                  {signingOut ? 'Çıkış yapılıyor...' : 'Oturumu Kapat'}
                </p>
                <p className="text-xs text-[#4b5563]">Hesabınızdan çıkış yapın</p>
              </div>
            </button>
          </div>
        </div>

      </main>

      {/* ── Test Oluşturma Modal ──────────────────────────────────────────── */}
      {trialModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07111f] p-4 sm:p-6">
          <div className="w-full max-w-sm text-center">
            {trialMsg ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-950/50 text-3xl">⚠️</div>
                <h3 className="mb-2 text-lg font-bold text-white">Bir Sorun Oluştu</h3>
                <p className="mb-6 text-sm text-red-400">{trialMsg}</p>
                <button onClick={() => setTrialModal(false)}
                  className="rounded-xl border border-[#1e2d42] px-6 py-2.5 text-sm text-[#6b7280] hover:text-white">
                  Kapat
                </button>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-xl font-black text-white">Galya<span className="text-[#3b82f6]">Stream</span></p>
                </div>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#1e3a5f] text-4xl">
                  {trialProgress >= 100 ? '✅' : '⚡'}
                </div>
                <h2 className="mb-2 text-xl font-bold text-white">
                  {trialProgress >= 100 ? 'Test Hesabınız Hazır!' : 'Test Hesabı Oluşturuluyor...'}
                </h2>
                <p className="mb-8 text-sm text-[#6b7280]">
                  {trialProgress >= 100
                    ? 'Sayfa yenileniyor...'
                    : 'Lütfen bekleyin, bu işlem 30–40 saniye sürebilir.'}
                </p>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#1e2d42]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] transition-all duration-300 ease-out"
                    style={{ width: `${trialProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-[#4b5563]">
                  <span>
                    {trialProgress < 30 ? 'Yayın bağlantısı kuruluyor...'
                      : trialProgress < 60 ? 'Hesap oluşturuluyor...'
                      : trialProgress < 90 ? 'Son kontroller yapılıyor...'
                      : 'Tamamlandı!'}
                  </span>
                  <span className="font-mono">{Math.round(trialProgress)}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* ── Destek Talebi Modal ───────────────────────────────────────────── */}
      {showSupport && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0a1525] border border-[#1e2d42] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d42]">
              <p className="font-bold text-white">🎫 Destek Talebi</p>
              <button onClick={() => setShowSupport(false)} className="text-[#6b7280] hover:text-white text-lg leading-none">✕</button>
            </div>

            {supportStep === 'select' && (
              <div className="p-5 space-y-3">
                <p className="text-sm text-[#6b7280]">Yaşadığınız sorunu seçin:</p>
                <div className="grid grid-cols-2 gap-2">
                  {SUPPORT_ISSUES.map(issue => (
                    <button key={issue.id} onClick={() => { setSelectedIssue(issue.id); setSupportStep('form'); }}
                      className="flex flex-col items-start gap-1 rounded-xl border border-[#1e2d42] bg-[#060e1a] p-3 text-left hover:border-[#3b82f6]/40 hover:bg-[#3b82f6]/5 transition-all">
                      <span className="text-xl">{issue.icon}</span>
                      <p className="text-xs font-semibold text-white">{issue.title}</p>
                      <p className="text-[10px] text-[#6b7280]">{issue.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {supportStep === 'form' && (
              <div className="p-5 space-y-4">
                {/* Seçilen sorun */}
                <div className="flex items-center gap-2 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-3 py-2">
                  <span>{SUPPORT_ISSUES.find(i => i.id === selectedIssue)?.icon}</span>
                  <span className="text-sm font-semibold text-white">{SUPPORT_ISSUES.find(i => i.id === selectedIssue)?.title}</span>
                  <button onClick={() => setSupportStep('select')} className="ml-auto text-xs text-[#3b82f6] hover:underline">Değiştir</button>
                </div>

                {/* Telefon */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">Telefon Numaranız <span className="text-red-400">*</span></label>
                  <input
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={supportPhone}
                    onChange={e => setSupportPhone(e.target.value)}
                    className="w-full bg-[#060e1a] border border-[#1e2d42] text-white rounded-xl px-4 py-2.5 outline-none focus:border-[#3b82f6] transition-colors text-sm"
                  />
                </div>

                {/* Not */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">Açıklama (opsiyonel)</label>
                  <textarea
                    placeholder="Sorunu daha detaylı anlatın..."
                    value={supportNote}
                    onChange={e => setSupportNote(e.target.value)}
                    rows={3}
                    className="w-full bg-[#060e1a] border border-[#1e2d42] text-white rounded-xl px-4 py-2.5 outline-none focus:border-[#3b82f6] transition-colors text-sm resize-none"
                  />
                </div>

                {supportMsg && <p className="text-xs text-red-400">{supportMsg}</p>}

                <button onClick={submitSupport} disabled={supportLoading}
                  className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                  {supportLoading ? 'Gönderiliyor...' : '📨 Talebi Gönder'}
                </button>
              </div>
            )}

            {supportStep === 'done' && (
              <div className="p-8 text-center space-y-4">
                <div className="text-5xl">✅</div>
                <div>
                  <p className="font-bold text-white text-lg">Talebiniz Alındı!</p>
                  <p className="text-sm text-[#6b7280] mt-1">En kısa sürede sizinle iletişime geçeceğiz.</p>
                </div>
                <button onClick={() => setShowSupport(false)}
                  className="rounded-xl bg-[#1e2d42] px-6 py-2.5 text-sm text-white hover:bg-[#263548]">
                  Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dışa açılan bileşen: kendi SessionProvider'ını taşır ─────────────────
export default function ProfilPage() {
  return (
    <SessionProvider>
      <ProfilInner />
    </SessionProvider>
  );
}
