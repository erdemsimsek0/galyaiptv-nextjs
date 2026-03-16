'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { useSession, SessionProvider } from 'next-auth/react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrialCreds {
  email?: string;
  username: string;
  password: string;
  startedAt: number;
}

interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

interface XtreamStream {
  stream_id: number;
  name: string;
  stream_icon: string;
  epg_channel_id?: string;
  stream_type?: string;
  rating?: string;
  added?: string;
  cover?: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  releasedate?: string;
  duration?: string;
  series_id?: number;
  num?: number;
  year?: string;
  category_id?: string;
}

interface XtreamSeries extends XtreamStream {
  series_id: number;
  cover: string;
  plot: string;
  genre: string;
  releasedate: string;
  rating: string;
  last_modified: string;
}

type ContentType = 'live' | 'movies' | 'series';
type ViewMode = 'home' | 'browse';

// ─── URL helpers ──────────────────────────────────────────────────────────────
function streamUrl(username: string, password: string, streamId: number) {
  return `/api/stream?type=live&u=${username}&p=${password}&id=${streamId}`;
}
function vodUrl(username: string, password: string, streamId: number) {
  return `/api/stream?type=movie&u=${username}&p=${password}&id=${streamId}`;
}

// ─── Countdown hook (izole — ana component'i yeniden render ettirmez) ─────────
function useCountdown(startedAt: number) {
  const TRIAL_TOTAL = 3 * 60 * 60 * 1000;
  const [remaining, setRemaining] = useState(Math.max(0, TRIAL_TOTAL - (Date.now() - startedAt)));
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining(r => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { str: `${pad(h)}:${pad(m)}:${pad(s)}`, expired: remaining <= 0, remaining };
}

// ─── Countdown display (ayrı component — sadece bu re-render olur) ────────────
const CountdownBadge = memo(function CountdownBadge({ startedAt }: { startedAt: number }) {
  const { str, expired } = useCountdown(startedAt);
  if (expired) {
    return (
      <Link href="/abonelik" className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white">
        👑 Premium&apos;a Geç
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span className="font-mono text-xs font-bold text-emerald-400">{str}</span>
    </div>
  );
});

// ─── Video Player ─────────────────────────────────────────────────────────────
const VideoPlayer = memo(function VideoPlayer({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError(false);
    setLoading(true);

    // Önceki instance'ı temizle
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    video.src = '';

    const isLive = src.includes('type=live');

    const load = async () => {
      if (isLive) {
        try {
          const { default: Hls } = await import('hls.js');
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,          // ✅ Worker açık: main thread serbest kalır
              lowLatencyMode: true,
              maxBufferLength: 10,         // ✅ Buffer küçük: bellek tasarrufu
              maxMaxBufferLength: 20,
              startLevel: -1,              // ✅ Otomatik kalite seçimi
            });
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setLoading(false);
              video.play().catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (_: unknown, data: { fatal: boolean }) => {
              if (data.fatal) {
                hls.destroy();
                hlsRef.current = null;
                video.src = src.replace('.m3u8', '.ts');
                video.load();
                video.play().catch(() => setError(true));
              }
            });
            return;
          }
        } catch { /**/ }
      }
      video.src = src;
      video.load();
      video.play().catch(() => {});
    };

    video.onloadeddata = () => setLoading(false);
    video.oncanplay = () => setLoading(false);
    video.onerror = () => { setError(true); setLoading(false); };

    const timeout = setTimeout(() => {
      if (video.readyState === 0) { setError(true); setLoading(false); }
    }, 30000);

    load();
    return () => {
      clearTimeout(timeout);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      video.src = '';
    };
  }, [src]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        <p className="text-white font-semibold truncate max-w-[70%]">{title}</p>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-lg">✕</button>
      </div>
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
          <div className="text-4xl mb-4">📺</div>
          <p className="text-white font-semibold mb-2">Yayın yüklenemedi</p>
          <p className="text-white/50 text-sm mb-6">Bu kanal şu an erişilebilir olmayabilir.</p>
          <button onClick={onClose} className="rounded-xl bg-white/10 px-6 py-2.5 text-sm text-white hover:bg-white/20">Geri Dön</button>
        </div>
      ) : (
        <video ref={videoRef} className="w-full h-full" controls autoPlay playsInline />
      )}
    </div>
  );
});

// ─── Content Card — memo ile gereksiz re-render engellenir ────────────────────
// ÖNEMLİ: imgError state'i kaldırıldı, onError handler basitleştirildi.
// Her kart artık sıfır internal state → çok daha hafif.
const ContentCard = memo(function ContentCard({ item, onClick, type }: {
  item: XtreamStream | XtreamSeries;
  onClick: () => void;
  type: ContentType;
}) {
  const img = (item as XtreamSeries).cover || item.stream_icon || '';

  return (
    <button onClick={onClick}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-[#1a1a2e] border border-white/5 hover:border-white/20 hover:scale-[1.03] transition-all duration-200 text-left">
      <div className={`relative overflow-hidden bg-[#0d0d1a] ${type === 'live' ? 'aspect-video' : 'aspect-[2/3]'}`}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-20">{type === 'live' ? '📺' : type === 'movies' ? '🎬' : '📺'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-2xl bg-white/20 rounded-full w-10 h-10 flex items-center justify-center backdrop-blur-sm">▶</span>
        </div>
        {item.rating && Number(item.rating) > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 rounded-md px-1.5 py-0.5">
            <span className="text-yellow-400 text-[10px]">★</span>
            <span className="text-white text-[10px] font-semibold">{Number(item.rating).toFixed(1)}</span>
          </div>
        )}
        {type === 'live' && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600/90 rounded-md px-1.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-white text-[9px] font-bold">CANLI</span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-white text-xs font-semibold truncate">{item.name}</p>
        {(item as XtreamSeries).genre && (
          <p className="text-white/40 text-[10px] truncate mt-0.5">{(item as XtreamSeries).genre}</p>
        )}
        {(item as XtreamSeries).releasedate && (
          <p className="text-white/40 text-[10px] mt-0.5">{(item as XtreamSeries).releasedate?.slice(0, 4)}</p>
        )}
      </div>
    </button>
  );
});

// ─── Virtual Scroll Grid ──────────────────────────────────────────────────────
// Binlerce kart yerine sadece görünen alandakileri render eder.
// Dışarıdan sadece items + render fonksiyonu alır → tamamen yeniden kullanılabilir.
const ITEM_HEIGHT_LIVE = 120;   // aspect-video kart yüksekliği (yaklaşık)
const ITEM_HEIGHT_CONTENT = 220; // aspect-[2/3] kart yüksekliği (yaklaşık)
const OVERSCAN = 2; // ekranın üstünde/altında kaç satır önceden render edilsin

function VirtualGrid({ items, type, onItemClick }: {
  items: (XtreamStream | XtreamSeries)[];
  type: ContentType;
  onItemClick: (item: XtreamStream | XtreamSeries) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(800);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Scroll ve resize dinle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => setScrollTop(container.scrollTop);
    const onResize = () => {
      setContainerHeight(container.clientHeight);
      setContainerWidth(container.clientWidth);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    onResize();
    return () => { container.removeEventListener('scroll', onScroll); ro.disconnect(); };
  }, []);

  // Sütun sayısını ekran genişliğine göre hesapla
  const cols = useMemo(() => {
    if (type === 'live') {
      if (containerWidth >= 1280) return 6;
      if (containerWidth >= 1024) return 5;
      if (containerWidth >= 768) return 4;
      if (containerWidth >= 640) return 3;
      return 2;
    } else {
      if (containerWidth >= 1280) return 8;
      if (containerWidth >= 1024) return 6;
      if (containerWidth >= 768) return 5;
      if (containerWidth >= 640) return 4;
      return 3;
    }
  }, [containerWidth, type]);

  const ITEM_HEIGHT = type === 'live' ? ITEM_HEIGHT_LIVE : ITEM_HEIGHT_CONTENT;
  const GAP = 12;
  const rowHeight = ITEM_HEIGHT + GAP;
  const totalRows = Math.ceil(items.length / cols);
  const totalHeight = totalRows * rowHeight;

  // Hangi satırların görünür olduğunu hesapla
  const firstVisibleRow = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const lastVisibleRow = Math.min(totalRows - 1, Math.ceil((scrollTop + containerHeight) / rowHeight) + OVERSCAN);

  // Sadece görünen satırlardaki itemları render et
  const visibleItems = useMemo(() => {
    const result = [];
    for (let row = firstVisibleRow; row <= lastVisibleRow; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (index >= items.length) break;
        result.push({ item: items[index], row, col, index });
      }
    }
    return result;
  }, [items, firstVisibleRow, lastVisibleRow, cols]);

  // Her sütunun genişliği
  const colWidth = `calc((100% - ${(cols - 1) * GAP}px) / ${cols})`;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4"
      style={{ position: 'relative' }}
    >
      {/* Toplam yüksekliği tutan boş spacer — scroll bar doğru çalışsın */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, row, col, index }) => (
          <div
            key={item.stream_id || (item as XtreamSeries).series_id || index}
            style={{
              position: 'absolute',
              top: row * rowHeight,
              left: col === 0 ? 0 : `calc(${col} * (${colWidth} + ${GAP}px))`,
              width: colWidth,
              height: ITEM_HEIGHT,
            }}
          >
            <ContentCard
              item={item}
              type={type}
              onClick={() => onItemClick(item)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal = memo(function DetailModal({ item, creds, activeTab, onClose }: {
  item: XtreamStream | XtreamSeries;
  creds: TrialCreds;
  activeTab: ContentType;
  onClose: () => void;
}) {
  const [episodes, setEpisodes] = useState<Record<string, { id: number; title: string; episode_num: number }[]>>({});
  const [season, setSeason] = useState('1');
  const [playingSrc, setPlayingSrc] = useState('');
  const [playingTitle, setPlayingTitle] = useState('');
  const [loadingEp, setLoadingEp] = useState(false);

  useEffect(() => {
    if (activeTab !== 'series') return;
    const seriesItem = item as XtreamSeries;
    if (!seriesItem.series_id) return;
    setLoadingEp(true);
    fetch('/api/xtream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: creds.username, password: creds.password, action: 'get_series_info', extra: { series_id: String(seriesItem.series_id) } }),
    })
      .then(r => r.json())
      .then(data => { if (data.episodes) setEpisodes(data.episodes); })
      .catch(() => {})
      .finally(() => setLoadingEp(false));
  }, [item, creds, activeTab]);

  const cover = (item as XtreamSeries).cover || item.stream_icon || '';
  const plot = (item as XtreamSeries).plot || '';
  const genre = (item as XtreamSeries).genre || '';
  const year = (item as XtreamSeries).releasedate?.slice(0, 4) || (item as XtreamSeries).year || '';
  const seasons = Object.keys(episodes).sort((a, b) => Number(a) - Number(b));

  return (
    <>
      {playingSrc && <VideoPlayer src={playingSrc} title={playingTitle} onClose={() => { setPlayingSrc(''); setPlayingTitle(''); }} />}
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="w-full max-w-2xl bg-[#0f0f1a] rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="relative">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={item.name} className="w-full h-48 sm:h-64 object-cover" />
            ) : (
              <div className="w-full h-32 bg-[#1a1a2e] flex items-center justify-center"><span className="text-5xl opacity-20">🎬</span></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a]/40 to-transparent" />
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">✕</button>
          </div>
          <div className="px-5 pb-6 -mt-8 relative">
            <h2 className="text-2xl font-black text-white mb-1">{item.name}</h2>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {activeTab === 'series' && <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded">Dizi</span>}
              {activeTab === 'movies' && <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded">Film</span>}
              {genre && <span className="text-xs text-white/50">{genre}</span>}
              {year && <span className="text-xs text-white/50">• {year}</span>}
              {item.rating && Number(item.rating) > 0 && (
                <span className="flex items-center gap-1 text-xs text-yellow-400">★ {Number(item.rating).toFixed(1)}</span>
              )}
            </div>
            {plot && <p className="text-sm text-white/60 leading-relaxed mb-5">{plot}</p>}
            {activeTab === 'movies' && (
              <button onClick={() => { setPlayingSrc(vodUrl(creds.username, creds.password, item.stream_id)); setPlayingTitle(item.name); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-black text-black hover:bg-white/90 mb-4">
                ▶ İzle
              </button>
            )}
            {activeTab === 'series' && (
              <div>
                {loadingEp ? (
                  <div className="flex justify-center py-6"><div className="h-6 w-6 rounded-full border-2 border-white/10 border-t-white animate-spin" /></div>
                ) : seasons.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-white">Bölümler</p>
                      <select value={season} onChange={e => setSeason(e.target.value)}
                        className="bg-white/10 border border-white/20 text-white text-xs rounded-lg px-3 py-1.5 outline-none">
                        {seasons.map(s => <option key={s} value={s} className="bg-[#0f0f1a]">{s}. Sezon</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      {(episodes[season] || []).map(ep => (
                        <button key={ep.id}
                          onClick={() => { setPlayingSrc(`/api/stream?type=series&u=${creds.username}&p=${creds.password}&id=${ep.id}`); setPlayingTitle(ep.title || `${item.name} - S${season}E${ep.episode_num}`); }}
                          className="flex w-full items-center gap-3 rounded-xl bg-white/5 hover:bg-white/10 p-3 text-left transition-colors">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white">{ep.episode_num}</span>
                          <p className="text-sm text-white truncate">{ep.title || `Bölüm ${ep.episode_num}`}</p>
                          <span className="ml-auto text-white/30 text-lg">▶</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-white/30 py-6 text-sm">Bölüm bulunamadı</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

// ─── Home Screen ──────────────────────────────────────────────────────────────
const HomeScreen = memo(function HomeScreen({ creds, onNavigate }: {
  creds: TrialCreds;
  onNavigate: (tab: ContentType) => void;
}) {
  const { str, expired } = useCountdown(creds.startedAt);
  const h = Math.floor(Math.max(0, 3 * 60 * 60 * 1000 - (Date.now() - creds.startedAt)) / 3600000);
  const m = Math.floor((Math.max(0, 3 * 60 * 60 * 1000 - (Date.now() - creds.startedAt)) % 3600000) / 60000);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative px-6 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#3b82f6]/10 blur-3xl" />
        </div>
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/60">
            {expired ? (
              <><span className="text-amber-400">⌛</span> Test süreniz doldu</>
            ) : (
              <><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
                Aktif Test — <span className="font-mono font-bold text-emerald-400">{str}</span></>
            )}
          </div>
          <h1 className="mb-2 text-3xl sm:text-4xl font-black text-white">Hoş Geldiniz! 👋</h1>
          <p className="text-white/50 text-sm mb-8">Premium eğlence deneyimine hazır mısınız?</p>
          <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto mb-10">
            {[
              { icon: '🎬', value: '15.000+', label: 'Film & Dizi' },
              { icon: '📡', value: '1.500+', label: 'Canlı Kanal' },
              { icon: '⚡', value: '4K HDR', label: 'Ultra Kalite' },
              { icon: '🎧', value: '7/24', label: 'Canlı Destek' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl bg-white/5 border border-white/10 p-3">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-white font-black text-xs sm:text-sm">{s.value}</div>
                <div className="text-white/30 text-[9px]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-6 pb-10">
        <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Hızlı Erişim</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { tab: 'live' as ContentType, icon: '📡', title: 'Canlı Yayınlar', desc: 'Spor, haber, eğlence ve daha fazlası', color: 'from-red-900/30 to-red-950/10 border-red-500/20' },
            { tab: 'movies' as ContentType, icon: '🎬', title: 'Filmler', desc: '15.000+ film arşivi, tüm türler', color: 'from-blue-900/30 to-blue-950/10 border-blue-500/20' },
            { tab: 'series' as ContentType, icon: '📺', title: 'Diziler', desc: 'Yerli, yabancı, tüm platformlar', color: 'from-purple-900/30 to-purple-950/10 border-purple-500/20' },
          ].map(item => (
            <button key={item.tab} onClick={() => onNavigate(item.tab)}
              className={`flex items-center gap-4 rounded-2xl border bg-gradient-to-br ${item.color} p-5 text-left hover:scale-[1.02] transition-all`}>
              <span className="text-3xl">{item.icon}</span>
              <div>
                <p className="font-bold text-white">{item.title}</p>
                <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
              </div>
              <span className="ml-auto text-white/20 text-lg">›</span>
            </button>
          ))}
        </div>

        {expired && (
          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-center">
            <p className="text-amber-400 font-bold mb-2">⌛ Test Süreniz Doldu</p>
            <p className="text-white/50 text-sm mb-4">Premium pakete geçerek kesintisiz izlemeye devam edin.</p>
            <Link href="/abonelik" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-amber-600">
              👑 Premium&apos;a Geç →
            </Link>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Bağlantı Bilgileriniz</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[{ label: 'Kullanıcı Adı', value: creds.username }, { label: 'Şifre', value: creds.password }].map(row => (
              <div key={row.label} className="rounded-xl bg-white/5 p-3">
                <p className="text-white/30 text-[10px] mb-1">{row.label}</p>
                <p className="font-mono text-white text-xs truncate">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── No Trial screen ──────────────────────────────────────────────────────────
function NoTrialScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[#070714] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#3b82f6]/10 blur-3xl" />
      </div>
      <div className="relative z-10 max-w-lg">
        <div className="mb-6 text-6xl">🎬</div>
        <h1 className="mb-3 text-4xl font-black text-white tracking-tight">Galya<span className="text-[#3b82f6]">Stream</span> Player</h1>
        <p className="mb-8 text-lg text-white/60">15.000+ film, dizi ve 1.500+ canlı kanal. Hemen izlemeye başla.</p>
        <div className="mb-10 grid grid-cols-4 gap-3">
          {[
            { icon: '🎬', value: '15.000+', label: 'Film & Dizi' },
            { icon: '📡', value: '1.500+', label: 'Canlı Kanal' },
            { icon: '⚡', value: '4K HDR', label: 'Ultra Kalite' },
            { icon: '🎧', value: '7/24', label: 'Canlı Destek' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-white/5 border border-white/10 p-3">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-white font-black text-sm">{s.value}</div>
              <div className="text-white/40 text-[10px]">{s.label}</div>
            </div>
          ))}
        </div>
        <Link href="/profil" className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-base font-black text-black transition-all hover:bg-white/90 hover:scale-[1.02] mb-3">
          <span>▶</span> 3 Saat Ücretsiz Dene
        </Link>
        <p className="text-white/30 text-xs">*Deneme sürecinde herhangi bir ödeme yapmazsınız</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">Zaten hesabınız var mı?</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <button onClick={onLogin} className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
          Giriş Yap
        </button>
      </div>
    </div>
  );
}

// ─── Main Player ──────────────────────────────────────────────────────────────
function PlayerApp({ creds }: { creds: TrialCreds }) {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [activeTab, setActiveTab] = useState<ContentType>('live');
  const [categories, setCategories] = useState<XtreamCategory[]>([]);
  const [items, setItems] = useState<(XtreamStream | XtreamSeries)[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [playingSrc, setPlayingSrc] = useState('');
  const [playingTitle, setPlayingTitle] = useState('');
  const [selectedItem, setSelectedItem] = useState<XtreamStream | XtreamSeries | null>(null);

  // ─── Debounce: kullanıcı yazmayı bitirince filtrele ──────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // ─── filteredItems: useMemo ile sadece bağımlılıklar değişince hesaplanır ──
  // setFilteredItems state'i tamamen kaldırıldı — gereksiz re-render önlendi.
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeCat !== 'all') {
      result = result.filter(i => String((i as XtreamStream).category_id) === activeCat);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q));
    }
    return result;
  }, [items, activeCat, debouncedSearch]);

  // ─── fetchContent: sadece kullanıcı sekmiye tıklandığında çalışır ─────────
  const fetchContent = useCallback(async (type: ContentType) => {
    setLoading(true);
    setItems([]);
    setCategories([]);
    setActiveCat('all');
    setSearch('');
    setDebouncedSearch('');
    setFetchError('');
    try {
      const { username, password } = creds;
      const catAction = type === 'live' ? 'get_live_categories' : type === 'movies' ? 'get_vod_categories' : 'get_series_categories';
      const streamAction = type === 'live' ? 'get_live_streams' : type === 'movies' ? 'get_vod_streams' : 'get_series';

      const [catRes, streamRes] = await Promise.all([
        fetch('/api/xtream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, action: catAction }) }),
        fetch('/api/xtream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, action: streamAction }) }),
      ]);

      const catsData = await catRes.json();
      const streamsData = await streamRes.json();

      if (catsData.error || streamsData.error) {
        setFetchError(catsData.error || streamsData.error || 'Bağlantı hatası');
        return;
      }
      setCategories(Array.isArray(catsData) ? catsData : []);
      setItems(Array.isArray(streamsData) ? streamsData : []);
    } catch (e) {
      setFetchError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [creds]);

  const handleTabChange = useCallback((tab: ContentType) => {
    setActiveTab(tab);
    setViewMode('browse');
    fetchContent(tab);
  }, [fetchContent]);

  // ─── handleItemClick stable referans — ContentCard gereksiz re-render olmaz ─
  const handleItemClick = useCallback((item: XtreamStream | XtreamSeries) => {
    if (activeTab === 'series') {
      setSelectedItem(item);
    } else if (activeTab === 'live') {
      setPlayingSrc(streamUrl(creds.username, creds.password, item.stream_id));
      setPlayingTitle(item.name);
    } else {
      setPlayingSrc(vodUrl(creds.username, creds.password, item.stream_id));
      setPlayingTitle(item.name);
    }
  }, [activeTab, creds]);

  const { expired } = useCountdown(creds.startedAt);

  return (
    <div className="min-h-screen bg-[#070714] text-white">
      {playingSrc && (
        <VideoPlayer src={playingSrc} title={playingTitle} onClose={() => { setPlayingSrc(''); setPlayingTitle(''); }} />
      )}
      {selectedItem && (
        <DetailModal item={selectedItem} creds={creds} activeTab={activeTab} onClose={() => setSelectedItem(null)} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#070714]/95 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-base font-black text-white">Galya<span className="text-[#3b82f6]">Stream</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-2xl p-1">
            <button onClick={() => setViewMode('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === 'home' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}>
              🏠 Ana Sayfa
            </button>
            {([
              { tab: 'live' as ContentType, icon: '📡', label: 'Canlı' },
              { tab: 'movies' as ContentType, icon: '🎬', label: 'Filmler' },
              { tab: 'series' as ContentType, icon: '📺', label: 'Diziler' },
            ] as const).map(({ tab, icon, label }) => (
              <button key={tab} onClick={() => handleTabChange(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode !== 'home' && activeTab === tab ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}>
                <span>{icon}</span> {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* CountdownBadge izole component — sadece o re-render olur */}
            <CountdownBadge startedAt={creds.startedAt} />
            <Link href="/profil" className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white">
              <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">P</span>
              Profil
            </Link>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex md:hidden border-t border-white/5">
          {([
            { tab: 'live' as ContentType, icon: '📡', label: 'Canlı' },
            { tab: 'movies' as ContentType, icon: '🎬', label: 'Filmler' },
            { tab: 'series' as ContentType, icon: '📺', label: 'Diziler' },
          ] as const).map(({ tab, icon, label }) => (
            <button key={tab} onClick={() => handleTabChange(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all ${activeTab === tab && viewMode !== 'home' ? 'text-white border-b-2 border-[#3b82f6]' : 'text-white/40'}`}>
              {icon} {label}
            </button>
          ))}
        </div>
      </header>

      {expired && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center">
          <p className="text-xs font-semibold text-amber-400">
            ⌛ Test süreniz doldu —{' '}
            <Link href="/abonelik" className="underline">Şimdi Premium&apos;a Geç →</Link>
          </p>
        </div>
      )}

      <div className="flex h-[calc(100vh-56px)] overflow-hidden">
        {viewMode === 'home' && <HomeScreen creds={creds} onNavigate={handleTabChange} />}

        {viewMode === 'browse' && (
          <>
            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-white/5 overflow-y-auto py-4">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">Kategoriler</p>
              <button onClick={() => setActiveCat('all')}
                className={`px-3 py-2 text-xs text-left transition-colors rounded-lg mx-1 ${activeCat === 'all' ? 'text-white font-semibold bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                Tümü {items.length > 0 && <span className="text-white/30">({items.length})</span>}
              </button>
              {categories.map(cat => (
                <button key={cat.category_id} onClick={() => setActiveCat(cat.category_id)}
                  className={`px-3 py-2 text-xs text-left leading-snug transition-colors rounded-lg mx-1 break-words ${activeCat === cat.category_id ? 'text-white font-semibold bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                  {cat.category_name}
                </button>
              ))}
            </aside>

            {/* Main content — flex column, VirtualGrid flex-1 alır */}
            <main className="flex-1 flex flex-col overflow-hidden">
              {/* Arama + mobil kategori */}
              <div className="shrink-0 bg-[#070714]/95 backdrop-blur-md px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                    <span className="text-white/30 text-sm">🔍</span>
                    <input
                      type="text"
                      placeholder={activeTab === 'live' ? 'Kanal ara...' : activeTab === 'movies' ? 'Film ara...' : 'Dizi ara...'}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
                    />
                    {filteredItems.length > 0 && (
                      <span className="text-white/20 text-xs">{filteredItems.length}</span>
                    )}
                  </div>
                </div>
                {/* Mobil kategori pills */}
                <div className="flex gap-2 overflow-x-auto mt-2 pb-1 lg:hidden scrollbar-hide">
                  <button onClick={() => setActiveCat('all')}
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${activeCat === 'all' ? 'border-white bg-white text-black' : 'border-white/20 text-white/60'}`}>
                    Tümü
                  </button>
                  {categories.slice(0, 20).map(cat => (
                    <button key={cat.category_id} onClick={() => setActiveCat(cat.category_id)}
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${activeCat === cat.category_id ? 'border-white bg-white text-black' : 'border-white/20 text-white/60'}`}>
                      {cat.category_name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-[#3b82f6] animate-spin" />
                </div>
              ) : fetchError ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="text-4xl mb-3">⚠️</div>
                  <p className="text-white/60 mb-2">Bağlantı hatası</p>
                  <p className="text-white/30 text-sm mb-4">{fetchError}</p>
                  <button onClick={() => fetchContent(activeTab)}
                    className="rounded-xl bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/20">
                    Tekrar Dene
                  </button>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-white/30">
                  <div className="text-4xl mb-3">🔍</div>
                  <p>Sonuç bulunamadı</p>
                </div>
              ) : (
                // ✅ VirtualGrid: sadece görünen kartları render eder
                <VirtualGrid
                  items={filteredItems}
                  type={activeTab}
                  onItemClick={handleItemClick}
                />
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Auth wrapper ─────────────────────────────────────────────────────────────
function IzleInner() {
  const { data: session, status } = useSession();
  const [creds, setCreds] = useState<TrialCreds | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    try {
      const raw = localStorage.getItem('galya_trial_creds');
      if (raw) {
        const p = JSON.parse(raw);
        if (p.username && (!p.email || p.email === session?.user?.email)) {
          setCreds(p);
          setLoading(false);
          return;
        }
      }
    } catch { /**/ }

    if (session?.user?.email) {
      fetch('/api/test-talep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_trial', email: session.user.email }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.username) {
            const cr = { email: session.user!.email!, username: data.username, password: data.password, startedAt: data.startedAt };
            setCreds(cr);
            try { localStorage.setItem('galya_trial_creds', JSON.stringify(cr)); } catch { /**/ }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [status, session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#070714] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-[#3b82f6] animate-spin" />
      </div>
    );
  }

  if (!creds) return <NoTrialScreen onLogin={() => {}} />;
  return <PlayerApp creds={creds} />;
}

export default function IzlePage() {
  return (
    <SessionProvider>
      <IzleInner />
    </SessionProvider>
  );
}
