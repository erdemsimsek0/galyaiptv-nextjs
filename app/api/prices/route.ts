// app/api/prices/route.ts
// Paket fiyatlarını Redis'te saklar — tüm sayfalar buradan okur
import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL    = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN  = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_SECRET = process.env.ADMIN_SECRET!;
const PRICES_KEY   = 'config:prices';

// Varsayılan fiyatlar — Redis'te kayıt yoksa bunlar kullanılır
export const DEFAULT_PRICES: Record<string, number> = {
  max:    229.90,
  sports: 159.90,
  cinema: 129.90,
};

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  const json = await res.json();
  return json.result ?? null;
}

async function redisSet(key: string, value: string) {
  await fetch(
    `${REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`,
    { headers: { Authorization: `Bearer ${REDIS_TOKEN}` }, cache: 'no-store' }
  );
}

// ─── GET: Herkese açık — tüm sayfalarda kullanılır ───────────────────────────
export async function GET() {
  try {
    const raw = await redisGet(PRICES_KEY);
    if (!raw) {
      return NextResponse.json({ success: true, prices: DEFAULT_PRICES, isDefault: true });
    }
    const prices = JSON.parse(raw);
    return NextResponse.json({ success: true, prices, isDefault: false });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    // Hata durumunda varsayılan fiyatları döndür
    return NextResponse.json({ success: true, prices: DEFAULT_PRICES, isDefault: true, warning: message });
  }
}

// ─── POST: Sadece admin ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { prices } = body as { prices: Record<string, number> };

    if (!prices || typeof prices !== 'object') {
      return NextResponse.json({ success: false, error: 'Geçersiz veri.' }, { status: 400 });
    }

    // Validasyon: her fiyat pozitif sayı olmalı
    for (const [key, val] of Object.entries(prices)) {
      if (typeof val !== 'number' || val <= 0 || val > 99999) {
        return NextResponse.json(
          { success: false, error: `Geçersiz fiyat: ${key} = ${val}` },
          { status: 400 }
        );
      }
    }

    // Sadece bilinen paket id'lerini kabul et
    const allowed = Object.keys(DEFAULT_PRICES);
    const filtered: Record<string, number> = {};
    for (const id of allowed) {
      if (prices[id] !== undefined) filtered[id] = Math.round(prices[id] * 100) / 100;
    }

    await redisSet(PRICES_KEY, JSON.stringify(filtered));
    return NextResponse.json({ success: true, prices: filtered });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── DELETE: Varsayılanlara sıfırla ──────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
  }
  try {
    await fetch(`${REDIS_URL}/del/${encodeURIComponent(PRICES_KEY)}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    return NextResponse.json({ success: true, prices: DEFAULT_PRICES, message: 'Varsayılan fiyatlara döndürüldü.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
