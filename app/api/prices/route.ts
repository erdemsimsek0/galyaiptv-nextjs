import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_COUPONS,
  DEFAULT_DEVICE_MULTIPLIERS,
  DEFAULT_PRICES,
  type CouponDefinition,
  type PricingConfig,
} from '@/lib/catalog';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_SECRET = process.env.ADMIN_SECRET!;
const PRICES_KEY = 'config:pricing';

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  const json = await res.json();
  return json.result ?? null;
}

async function redisSet(key: string, value: string) {
  await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
}

function mergeConfig(raw?: Partial<PricingConfig> | null): PricingConfig {
  return {
    prices: { ...DEFAULT_PRICES, ...(raw?.prices ?? {}) },
    deviceMultipliers: { ...DEFAULT_DEVICE_MULTIPLIERS, ...(raw?.deviceMultipliers ?? {}) },
    coupons: Array.isArray(raw?.coupons) ? raw!.coupons! : DEFAULT_COUPONS,
    updatedAt: raw?.updatedAt,
  };
}

function validateCoupons(coupons: CouponDefinition[]) {
  for (const coupon of coupons) {
    if (!coupon.code || !coupon.label) return 'Kupon kodu ve adı zorunludur.';
    if (!['percent', 'fixed'].includes(coupon.type)) return 'Geçersiz kupon tipi.';
    if (typeof coupon.value !== 'number' || coupon.value <= 0) return 'Geçersiz kupon değeri.';
  }
  return null;
}

export async function GET() {
  try {
    const raw = await redisGet(PRICES_KEY);
    if (!raw) {
      return NextResponse.json({
        success: true,
        ...mergeConfig(),
        isDefault: true,
      });
    }

    const parsed = mergeConfig(JSON.parse(raw) as Partial<PricingConfig>);
    return NextResponse.json({ success: true, ...parsed, isDefault: false });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({
      success: true,
      ...mergeConfig(),
      isDefault: true,
      warning: message,
    });
  }
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<PricingConfig>;
    const prices = body.prices ?? DEFAULT_PRICES;
    const deviceMultipliers = body.deviceMultipliers ?? DEFAULT_DEVICE_MULTIPLIERS;
    const coupons = body.coupons ?? DEFAULT_COUPONS;

    for (const [key, val] of Object.entries(prices)) {
      if (typeof val !== 'number' || val <= 0 || val > 99999) {
        return NextResponse.json({ success: false, error: `Geçersiz fiyat: ${key}` }, { status: 400 });
      }
    }

    for (const [key, val] of Object.entries(deviceMultipliers)) {
      if (typeof val !== 'number' || val < 1 || val > 5) {
        return NextResponse.json({ success: false, error: `Geçersiz cihaz çarpanı: ${key}` }, { status: 400 });
      }
    }

    const couponError = validateCoupons(coupons);
    if (couponError) {
      return NextResponse.json({ success: false, error: couponError }, { status: 400 });
    }

    const config = mergeConfig({ prices, deviceMultipliers, coupons, updatedAt: Date.now() });
    await redisSet(PRICES_KEY, JSON.stringify(config));

    return NextResponse.json({ success: true, ...config });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    await fetch(`${REDIS_URL}/del/${encodeURIComponent(PRICES_KEY)}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    return NextResponse.json({ success: true, ...mergeConfig(), isDefault: true, message: 'Varsayılan fiyatlara döndürüldü.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
