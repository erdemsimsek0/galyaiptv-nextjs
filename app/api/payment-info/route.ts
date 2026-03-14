import { NextRequest, NextResponse } from 'next/server';

// ─── Kurulum notları ──────────────────────────────────────────────────────────
// Hiçbir ek paket gerekmez. Upstash REST API native fetch ile çağrılır.
//
// .env.local'e ekle:
//   UPSTASH_REDIS_REST_URL=https://xxx-yyy.upstash.io
//   UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxx
//   ADMIN_SECRET=gizli-admin-sifresi
//
// Upstash REST API dökümantasyonu: https://upstash.com/docs/redis/sdks/py/getstarted

const REDIS_URL    = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN  = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_SECRET = process.env.ADMIN_SECRET!;
const REDIS_KEY    = 'galya:payment_info';

// ─── Upstash REST yardımcıları ────────────────────────────────────────────────
async function redisGet<T>(key: string): Promise<T | null> {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (json.result === null || json.result === undefined) return null;
  // Upstash string olarak döner, JSON parse et
  try {
    return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
  } catch {
    return json.result as T;
  }
}

async function redisSet(key: string, value: unknown, exSeconds: number): Promise<void> {
  // SET key value EX seconds
  await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}?EX=${exSeconds}`, {
    method: 'GET', // Upstash REST GET yöntemi ile de set yapılabiliyor
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
}

async function redisDel(key: string): Promise<void> {
  await fetch(`${REDIS_URL}/del/${encodeURIComponent(key)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
}

// ─── Tip ──────────────────────────────────────────────────────────────────────
export interface PaymentInfo {
  bankName:      string; // "Ziraat Bankası"
  accountHolder: string; // "Ahmet Yılmaz"
  iban:          string; // "TR12 0001 0017 4512 3456 7890 12"
  branch:        string; // "İstanbul Şubesi" (isteğe bağlı)
  note:          string; // Ödeme yaparken dikkat edilecekler
  updatedAt:     number; // ms timestamp
}

// ─── GET — ödeme bilgilerini herkese açık getir ───────────────────────────────
export async function GET() {
  try {
    const data = await redisGet<PaymentInfo>(REDIS_KEY);
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Ödeme bilgisi henüz tanımlanmamış.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('payment-info GET error:', err);
    return NextResponse.json({ success: false, error: 'Sunucu hatası.' }, { status: 500 });
  }
}

// ─── POST — admin IBAN bilgilerini günceller ──────────────────────────────────
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (!secret || secret !== ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const body = await req.json() as Partial<PaymentInfo>;

    if (!body.bankName || !body.accountHolder || !body.iban) {
      return NextResponse.json(
        { success: false, error: 'bankName, accountHolder ve iban zorunludur.' },
        { status: 400 }
      );
    }

    // IBAN format kontrolü
    const ibanClean = body.iban.replace(/\s/g, '');
    if (!ibanClean.startsWith('TR') || ibanClean.length !== 26) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir TR IBAN girin (TR + 24 karakter).' },
        { status: 400 }
      );
    }

    const payload: PaymentInfo = {
      bankName:      body.bankName.trim(),
      accountHolder: body.accountHolder.trim(),
      iban:          body.iban.trim(),
      branch:        body.branch?.trim() ?? '',
      note:          body.note?.trim() ?? 'Açıklama kısmını kesinlikle boş bırakın. Gönderilecek tutar birebir aynı olmalıdır.',
      updatedAt:     Date.now(),
    };

    await redisSet(REDIS_KEY, payload, 365 * 24 * 3600); // 365 gün TTL

    return NextResponse.json({ success: true, data: payload });
  } catch (err) {
    console.error('payment-info POST error:', err);
    return NextResponse.json({ success: false, error: 'Sunucu hatası.' }, { status: 500 });
  }
}

// ─── DELETE — ödeme bilgisini temizle ─────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (!secret || secret !== ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    await redisDel(REDIS_KEY);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('payment-info DELETE error:', err);
    return NextResponse.json({ success: false, error: 'Sunucu hatası.' }, { status: 500 });
  }
}
