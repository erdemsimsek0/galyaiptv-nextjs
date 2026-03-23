'use client';

import Link from 'next/link';
import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

interface Subscription {
  plan: string;
  username: string;
  password: string;
  remainingDays: number;
  expiresFormatted: string;
}

interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

interface XtreamItem {
  name?: string;
  stream_id?: number;
  series_id?: number;
  stream_icon?: string;
}

interface PanelLineState {
  inChannels: string[];
  notInChannels: string[];
}

interface XtreamDashboard {
  account: {
    user_info?: {
      username?: string;
      status?: string;
      exp_date?: string;
      active_cons?: string;
      max_connections?: string;
      allowed_output_formats?: string[];
    };
    server_info?: {
      url?: string;
      https_port?: string;
      port?: string;
      server_protocol?: string;
      timezone?: string;
    };
  };
  liveCategories: XtreamCategory[];
  vodCategories: XtreamCategory[];
  seriesCategories: XtreamCategory[];
}

type ContentType = 'live' | 'vod' | 'series';

const DEFAULT_SERVER_URL = 'http://pro4kiptv.xyz:2086';

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${copied ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-[#1e2d42] bg-[#0d1a2a] text-[#9ca3af] hover:border-[#3b82f6]/40 hover:text-white'}`}
    >
      {copied ? 'Kopyalandı' : 'Kopyala'}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">{label}</p>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function XtreamGirisInner() {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState<XtreamDashboard | null>(null);
  const [activeType, setActiveType] = useState<ContentType>('live');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [items, setItems] = useState<XtreamItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [lineState, setLineState] = useState<PanelLineState | null>(null);
  const [lineSaving, setLineSaving] = useState(false);
  const [lineError, setLineError] = useState('');
  const [selectedEnabled, setSelectedEnabled] = useState<string[]>([]);
  const [selectedDisabled, setSelectedDisabled] = useState<string[]>([]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    setSubscriptionLoading(true);
    fetch(`/api/subscription?email=${encodeURIComponent(session.user.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setSubscription(null);
          return;
        }
        setSubscription(data.subscription);
        setServerUrl(DEFAULT_SERVER_URL);
        setUsername(data.subscription.username || '');
        setPassword(data.subscription.password || '');
      })
      .catch(() => setSubscription(null))
      .finally(() => setSubscriptionLoading(false));
  }, [session?.user?.email, status]);

  const m3uLink = useMemo(() => {
    if (!serverUrl || !username || !password) return '';
    const cleanServer = serverUrl.replace(/\/$/, '');
    return `${cleanServer}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u&output=ts`;
  }, [password, serverUrl, username]);

  const categories = useMemo(() => {
    if (!dashboard) return [];
    if (activeType === 'live') return dashboard.liveCategories;
    if (activeType === 'vod') return dashboard.vodCategories;
    return dashboard.seriesCategories;
  }, [activeType, dashboard]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setDashboard(null);
    setItems([]);
    setSelectedCategoryId('');
    setLineState(null);
    setLineError('');

    try {
      const res = await fetch('/api/xtream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dashboard', serverUrl, username, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Xtream API girişi başarısız.');
        return;
      }

      setDashboard(data.dashboard);

      const lineRes = await fetch('/api/panel-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'load', username }),
      });
      const lineData = await lineRes.json();
      if (lineRes.ok && lineData.success) {
        setLineState(lineData.lines);
        setSelectedEnabled([]);
        setSelectedDisabled([]);
      } else {
        setLineError(lineData.error || 'Kanal düzenleme ekranı panelden yüklenemedi.');
      }
    } catch {
      setError('Xtream API paneline bağlanırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const moveSelectedChannels = (direction: 'disable' | 'enable') => {
    setLineState((current) => {
      if (!current) return current;

      if (direction === 'disable') {
        const moving = current.inChannels.filter((channel) => selectedEnabled.includes(channel));
        return {
          inChannels: current.inChannels.filter((channel) => !selectedEnabled.includes(channel)),
          notInChannels: [...current.notInChannels, ...moving],
        };
      }

      const moving = current.notInChannels.filter((channel) => selectedDisabled.includes(channel));
      return {
        inChannels: [...current.inChannels, ...moving],
        notInChannels: current.notInChannels.filter((channel) => !selectedDisabled.includes(channel)),
      };
    });

    setSelectedEnabled([]);
    setSelectedDisabled([]);
  };

  const saveLineChanges = async () => {
    if (!lineState) return;
    setLineSaving(true);
    setError('');
    setLineError('');
    try {
      const res = await fetch('/api/panel-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          username,
          inChannels: lineState.inChannels,
          notInChannels: lineState.notInChannels,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLineError(data.error || 'Kanal değişiklikleri kaydedilemedi.');
        return;
      }
      setLineState(data.lines);
      setSelectedEnabled([]);
      setSelectedDisabled([]);
    } catch {
      setError('Kanal değişiklikleri kaydedilirken bağlantı hatası oluştu.');
    } finally {
      setLineSaving(false);
    }
  };

  const loadCategoryItems = async (contentType: ContentType, categoryId: string) => {
    setActiveType(contentType);
    setSelectedCategoryId(categoryId);
    setItemsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/xtream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'items', serverUrl, username, password, contentType, categoryId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Kategori içeriği alınamadı.');
        return;
      }
      setItems(data.items || []);
    } catch {
      setError('Kategori içeriği alınırken bağlantı hatası oluştu.');
    } finally {
      setItemsLoading(false);
    }
  };

  const userInfo = dashboard?.account?.user_info;
  const totalManagedChannels = lineState ? lineState.inChannels.length + lineState.notInChannels.length : 0;

  return (
    <div className="min-h-screen bg-[#07111f] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#8b9ab3] transition-colors hover:text-white">← Ana sayfaya dön</Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/kurulum-rehberi" className="inline-flex items-center gap-2 rounded-xl border border-[#1e2d42] bg-[#0d1a2a] px-4 py-2 text-sm font-semibold text-[#9ca3af] transition-all hover:border-[#3b82f6]/40 hover:text-white">Kurulum Rehberi</Link>
            <Link href="/profil" className="inline-flex items-center gap-2 rounded-xl border border-[#1e2d42] bg-[#0d1a2a] px-4 py-2 text-sm font-semibold text-[#9ca3af] transition-all hover:border-[#3b82f6]/40 hover:text-white">Profilim</Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#1e2d42] bg-[#0a1525] p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#3b82f6]">Xtream API Girişi</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Bilgileri gir, giriş yap ve kullanıcı paneline eriş</h1>
            <p className="mt-3 text-sm leading-6 text-[#8b9ab3] sm:text-base">Sunucu URL, kullanıcı adı ve şifreyi yazdıktan sonra doğrudan Xtream API oturumu açılır. Girişten sonra hesap durumu, kategoriler ve kategori içeriği aynı sayfada yüklenir.</p>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4 rounded-3xl border border-[#1e2d42] bg-[#07111f] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">Giriş Formu</p>
                  <h2 className="mt-1 text-xl font-bold text-white">Xtream API Bilgileri</h2>
                </div>
                {subscription ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-300">Aktif Abonelik</p>
                    <p className="mt-1 text-sm font-bold text-white">{subscription.plan}</p>
                    <p className="mt-1 text-xs text-[#8b9ab3]">{subscription.remainingDays} gün · {subscription.expiresFormatted}</p>
                  </div>
                ) : null}
              </div>

              {subscriptionLoading && <div className="rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] px-4 py-3 text-sm text-[#8b9ab3]">Abonelik bilgileri kontrol ediliyor, varsa alanlar otomatik doldurulacak...</div>}

              {[
                { label: 'Sunucu URL', value: serverUrl, setValue: setServerUrl, placeholder: 'http://pro4kiptv.xyz:2086' },
                { label: 'Kullanıcı Adı', value: username, setValue: setUsername, placeholder: 'kullanici_adi' },
                { label: 'Şifre', value: password, setValue: setPassword, placeholder: 'sifre' },
              ].map((field) => (
                <div key={field.label} className="rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">{field.label}</label>
                    <CopyBtn value={field.value} />
                  </div>
                  <input value={field.value} onChange={(event) => field.setValue(event.target.value)} placeholder={field.placeholder} className="w-full rounded-xl border border-[#1e2d42] bg-[#07111f] px-4 py-3 font-mono text-sm text-white outline-none transition-all focus:border-[#3b82f6]/50" />
                </div>
              ))}

              <button onClick={handleLogin} disabled={loading || !serverUrl || !username || !password} className="w-full rounded-2xl bg-[#3b82f6] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap ve Paneli Aç'}
              </button>

              <div className="rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">M3U Linki</p>
                  <CopyBtn value={m3uLink} />
                </div>
                <p className="break-all font-mono text-xs leading-6 text-[#8b9ab3]">{m3uLink || 'Sunucu URL, kullanıcı adı ve şifreyi girince M3U linki burada oluşur.'}</p>
              </div>

              {error && <div className="rounded-2xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>}
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-[#1e2d42] bg-[#07111f] p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#818cf8]">Kullanıcı Paneli</p>
                    <h2 className="mt-1 text-xl font-bold text-white">Hesap ve içerik görünümü</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${dashboard ? 'bg-emerald-500/10 text-emerald-300' : 'bg-[#0d1a2a] text-[#8b9ab3]'}`}>{dashboard ? 'Bağlandı' : 'Bağlantı yok'}</span>
                </div>

                {dashboard ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <StatCard label="Durum" value={userInfo?.status || 'Bilinmiyor'} />
                    <StatCard label="Kullanıcı" value={userInfo?.username || username} />
                    <StatCard label="Bağlantı" value={`${userInfo?.active_cons || '0'} / ${userInfo?.max_connections || '0'}`} />
                    <StatCard label="Canlı Kategoriler" value={String(dashboard.liveCategories.length)} />
                    <StatCard label="Film Kategorileri" value={String(dashboard.vodCategories.length)} />
                    <StatCard label="Dizi Kategorileri" value={String(dashboard.seriesCategories.length)} />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#1e2d42] bg-[#0d1a2a] p-6 text-sm text-[#8b9ab3]">Önce soldaki bilgileri doldurup giriş yapın. Ardından kullanıcı paneli, kategoriler ve içerik listesi burada görünecek.</div>
                )}
              </div>

              {lineError && (
                <div className="rounded-3xl border border-red-500/25 bg-red-950/20 p-5 sm:p-6">
                  <p className="text-sm font-bold text-red-300">Kanal düzenleme ekranı yüklenemedi</p>
                  <p className="mt-2 text-sm leading-6 text-red-200/90">{lineError}</p>
                </div>
              )}

              {lineState && (
                <div className="rounded-3xl border border-[#1e2d42] bg-[#07111f] p-5 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">Kanal Yönetimi</p>
                      <h2 className="mt-1 text-xl font-bold text-white">IN / NOT IN listelerini Galyastream içinden yönet</h2>
                      <p className="mt-2 text-sm text-[#8b9ab3]">
                        Bu ekran paneldeki edit alanını arka planda açar. Soldaki aktif kanalları kapatabilir, sağdakileri tekrar aktif edip Save ile panelde kaydedebilirsin.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-right">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-amber-200">Toplam Kanal</p>
                        <p className="mt-1 text-lg font-black text-white">{totalManagedChannels}</p>
                      </div>
                      <button onClick={saveLineChanges} disabled={lineSaving} className="rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-amber-600 disabled:opacity-60">
                        {lineSaving ? 'Kaydediliyor...' : 'Save ile Kaydet'}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-bold text-white">IN - Aktif Kanallar</p>
                        <span className="text-xs text-emerald-300">{lineState.inChannels.length}</span>
                      </div>
                      <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
                        {lineState.inChannels.map((channel) => (
                          <button key={channel} onClick={() => setSelectedEnabled((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel])} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-all ${selectedEnabled.includes(channel) ? 'border-emerald-400/60 bg-emerald-500/10 text-white' : 'border-[#1e2d42] bg-[#0d1a2a] text-[#cbd5e1]'}`}>
                            <span className="truncate">{channel}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-row items-center justify-center gap-3 lg:flex-col">
                      <button onClick={() => moveSelectedChannels('disable')} disabled={selectedEnabled.length === 0} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200 transition-all hover:bg-red-500/20 disabled:opacity-50">
                        → NOT IN
                      </button>
                      <button onClick={() => moveSelectedChannels('enable')} disabled={selectedDisabled.length === 0} className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-bold text-sky-200 transition-all hover:bg-sky-500/20 disabled:opacity-50">
                        ← IN
                      </button>
                    </div>

                    <div className="rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-bold text-white">NOT IN - Kapalı Kanallar</p>
                        <span className="text-xs text-[#8b9ab3]">{lineState.notInChannels.length}</span>
                      </div>
                      <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
                        {lineState.notInChannels.map((channel) => (
                          <button key={channel} onClick={() => setSelectedDisabled((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel])} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-all ${selectedDisabled.includes(channel) ? 'border-sky-400/60 bg-sky-500/10 text-white' : 'border-[#1e2d42] bg-[#07111f] text-[#cbd5e1]'}`}>
                            <span className="truncate">{channel}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {dashboard && (
                <div className="grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
                  <div className="rounded-3xl border border-[#1e2d42] bg-[#07111f] p-5 sm:p-6">
                    <div className="mb-4 flex flex-wrap gap-2">
                      {[
                        { key: 'live', label: `Canlı TV (${dashboard.liveCategories.length})` },
                        { key: 'vod', label: `Filmler (${dashboard.vodCategories.length})` },
                        { key: 'series', label: `Diziler (${dashboard.seriesCategories.length})` },
                      ].map((tab) => (
                        <button key={tab.key} onClick={() => { setActiveType(tab.key as ContentType); setItems([]); setSelectedCategoryId(''); }} className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${activeType === tab.key ? 'bg-[#3b82f6] text-white' : 'bg-[#0d1a2a] text-[#8b9ab3] hover:text-white'}`}>
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                      {categories.map((category) => (
                        <button key={category.category_id} onClick={() => loadCategoryItems(activeType, category.category_id)} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${selectedCategoryId === category.category_id ? 'border-[#3b82f6]/60 bg-[#132033]' : 'border-[#1e2d42] bg-[#0d1a2a] hover:border-[#3b82f6]/30 hover:bg-[#132033]'}`}>
                          <div>
                            <p className="text-sm font-bold text-white">{category.category_name}</p>
                            <p className="text-[11px] text-[#8b9ab3]">Kategori ID: {category.category_id}</p>
                          </div>
                          <span className="text-[#6b7280]">→</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[#1e2d42] bg-[#07111f] p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">İçerik Listesi</p>
                        <h3 className="mt-1 text-lg font-bold text-white">Seçili kategori içeriği</h3>
                      </div>
                      {itemsLoading && <span className="text-xs text-[#8b9ab3]">Yükleniyor...</span>}
                    </div>

                    {selectedCategoryId ? (
                      items.length > 0 ? (
                        <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                          {items.map((item, index) => (
                            <div key={`${item.stream_id || item.series_id || item.name || 'item'}-${index}`} className="flex items-center justify-between rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] px-4 py-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-white">{item.name || 'İsimsiz içerik'}</p>
                                <p className="mt-1 text-[11px] text-[#8b9ab3]">ID: {item.stream_id || item.series_id || '-'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-[#1e2d42] bg-[#0d1a2a] p-6 text-sm text-[#8b9ab3]">Bu kategoride listelenecek içerik bulunamadı veya henüz yüklenmedi.</div>
                      )
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#1e2d42] bg-[#0d1a2a] p-6 text-sm text-[#8b9ab3]">Soldan bir kategori seçin. İçerikler burada gösterilecek.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function XtreamGirisPage() {
  return <SessionProvider><XtreamGirisInner /></SessionProvider>;
}
