// app/api/payment-info/rdoute.ts
// IBAN/ödeme bilgilerini Redis'te saklar
import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_SECRET = process.env.ADMIN_SECRET!;
const PAYMENT_KEY  = 'payment:iban:info';

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

async function redisDel(key: string) {
  await fetch(`${REDIS_URL}/del/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
}

// ─── GET: Herkese açık — ödeme sayfasında gösterilir ─────────────────────────
export async function GET() {
  try {
    const raw = await redisGet(PAYMENT_KEY);
    if (!raw) {
      return NextResponse.json({ success: false, error: 'Ödeme bilgisi henüz eklenmemiş.' }, { status: 404 });
    }
    const data = JSON.parse(raw);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── POST: Sadece admin — ödeme bilgisini güncelle ───────────────────────────
export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { bankName, accountHolder, iban, branch, note } = body;
    if (!bankName || !accountHolder || !iban) {
      return NextResponse.json({ success: false, error: 'Banka adı, hesap sahibi ve IBAN zorunludur.' }, { status: 400 });
    }
    // IBAN format kontrolü (TR ile başlayan 26 karakter)
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    if (!/^TR\d{24}$/.test(cleanIban)) {
      return NextResponse.json({ success: false, error: 'Geçersiz IBAN formatı. TR ile başlayan 26 karakter olmalıdır.' }, { status: 400 });
    }
    const data = {
      bankName:      bankName.trim(),
      accountHolder: accountHolder.trim(),
      iban:          cleanIban,
      branch:        (branch || '').trim(),
      note:          (note || '').trim(),
      updatedAt:     Date.now(),
    };
    await redisSet(PAYMENT_KEY, JSON.stringify(data));
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── DELETE: Sadece admin — ödeme bilgisini sil ──────────────────────────────
export async function DELETE(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
  }
  try {
    await redisDel(PAYMENT_KEY);
    return NextResponse.json({ success: true, message: 'Ödeme bilgisi silindi.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
