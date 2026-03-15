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
        Galya <span className="text-[#3b82f6]">IPTV</span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Galya IPTV"
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
  const [signingOut, setSigningOut] = useState(false);
  const [trialModal, setTrialModal] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialMsg, setTrialMsg] = useState('');

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
    setTrialModal(true);
    // Giriş yapılmış kullanıcı için direkt test oluştur
    createDirectTrial();
  };

  const createDirectTrial = async () => {
    const emailToUse = session?.user?.email || '';
    if (!emailToUse) return;
    setTrialLoading(true);
    setTrialMsg('Test hesabı oluşturuluyor...');
    try {
      const res = await fetch('/api/test-talep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_trial', email }),
      });
      const data = await res.json();
      if (data.success) {
        const cr = { username: data.username, password: data.password, startedAt: data.startedAt || Date.now() };
        try { localStorage.setItem('galya_trial_creds', JSON.stringify(cr)); } catch { /* */ }
        setTrialModal(false);
        window.location.reload();
      } else {
        setTrialMsg(data.error || 'Test oluşturulamadı.');
      }
    } catch {
      setTrialMsg('Sunucuya bağlanılamadı.');
    } finally {
      setTrialLoading(false);
    }
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
      {/* Header */}
      <div className="border-b border-[#1e2d42] bg-[#07111f]/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoWithFallback />
          </Link>
          <Link href="/" className="text-xs text-[#6b7280] transition-colors hover:text-white">
            Ana Sayfa
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-lg px-4 py-8 space-y-4">

        {/* ── Kullanıcı kartı ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={name}
                  className="h-14 w-14 rounded-full object-cover border-2 border-[#3b82f6]/40"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1e3a5f] text-xl font-bold text-[#3b82f6] border-2 border-[#3b82f6]/40">
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

          {creds && (
            <div className={`mt-4 rounded-xl border px-4 py-3 ${expired ? 'border-[#1e2d42] bg-[#060e1a]' : 'border-emerald-500/30 bg-emerald-950/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                {!expired && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/>
                  </span>
                )}
                <span className="text-xs font-semibold text-white">
                  {expired ? '⌛ Test Süresi Doldu' : '✅ Aktif Test Hesabı'}
                </span>
              </div>
              {!expired && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#6b7280]">Kalan süre</span>
                  <span className="font-mono text-2xl font-black text-emerald-400 tracking-widest">{countdown}</span>
                </div>
              )}
            </div>
          )}
        </div>

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
          <button onClick={openTrialModal} className="flex w-full items-center gap-4 px-5 py-4 transition-colors hover:bg-[#0d1a2a]">
            <span className="text-xl">⚡</span>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-white">Ücretsiz Test Al</p>
              <p className="text-xs text-[#6b7280]">{creds && !expired ? 'Aktif testiniz var — yenile' : '3 saatlik ücretsiz test'}</p>
            </div>
            <span className="text-[#4b5563]">›</span>
          </button>
        </div>

        {/* ── Test Bilgileri ─────────────────────────────────────────────── */}
        {creds && (
          <div className="rounded-2xl border border-[#3b82f6]/20 bg-[#0a1525] overflow-hidden">
            <div className="border-b border-[#1e2d42] px-5 py-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Test Bilgileri</p>
              <Link href="/kurulum-rehberi" className="text-xs text-[#3b82f6] hover:underline">
                Kurulum Rehberi →
              </Link>
            </div>
            {[
              { label: 'Kullanıcı Adı', value: creds.username },
              { label: 'Şifre',         value: creds.password },
              { label: 'Server URL',    value: SERVER },
              { label: 'M3U URL',       value: m3u },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between border-b border-[#1e2d42] px-5 py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">{row.label}</p>
                  <p className="mt-0.5 truncate font-mono text-sm text-[#8b9ab3]">{row.value}</p>
                </div>
                <CopyBtn value={row.value} />
              </div>
            ))}
          </div>
        )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e2d42] bg-[#0a1525] p-8 shadow-2xl text-center">
            {trialLoading ? (
              <>
                <svg className="mx-auto mb-4 h-10 w-10 animate-spin text-[#3b82f6]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-sm font-semibold text-white">Test hesabı oluşturuluyor...</p>
                <p className="mt-1 text-xs text-[#6b7280]">Bu işlem 30–40 saniye sürebilir.</p>
              </>
            ) : trialMsg ? (
              <>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-950/50 text-2xl">⚠️</div>
                <p className="text-sm text-red-400">{trialMsg}</p>
                <button onClick={() => setTrialModal(false)} className="mt-4 text-xs text-[#6b7280] hover:text-white">Kapat</button>
              </>
            ) : null}
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
