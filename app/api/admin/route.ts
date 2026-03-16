// app/api/support/route.ts
import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL    = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN  = process.env.UPSTASH_REDIS_REST_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_SECRET = process.env.ADMIN_SECRET!;

// ─── Redis helpers ────────────────────────────────────────────────────────────
async function redis(command: unknown[]): Promise<unknown> {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Redis error: ${data.error}`);
  return data.result;
}
async function redisKeys(pattern: string): Promise<string[]> {
  return (await redis(['KEYS', pattern])) as string[];
}
async function redisGet(key: string): Promise<string | null> {
  return (await redis(['GET', key])) as string | null;
}
async function redisDel(key: string) { await redis(['DEL', key]); }
async function redisSet(key: string, value: string) {
  // Biletleri 90 gün sakla
  await redis(['SET', key, value, 'EX', 90 * 86400]);
}

function isAdmin(req: NextRequest) {
  return req.headers.get('x-admin-secret') === ADMIN_SECRET;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── POST — yeni destek talebi oluştur ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { email, issue, phone, note } = await req.json() as {
      email?: string; issue?: string; phone?: string; note?: string;
    };

    if (!email || !issue || !phone) {
      return NextResponse.json({ success: false, error: 'Email, konu ve telefon zorunludur.' }, { status: 400 });
    }

    // Rate limit: aynı email'den 1 saatte 3 talep
    const rateKey = `support:rate:${email}`;
    const rateRaw = await redisGet(rateKey);
    const rateCount = rateRaw ? parseInt(rateRaw) : 0;
    if (rateCount >= 3) {
      return NextResponse.json({ success: false, error: 'Çok fazla talep. 1 saat sonra tekrar deneyin.' }, { status: 429 });
    }
    await redis(['SET', rateKey, String(rateCount + 1), 'EX', 3600]);

    const id = generateId();
    const now = Date.now();
    const ticket = {
      id,
      email,
      issue,
      phone: phone.trim(),
      note: note?.trim() || '',
      status: 'open',
      createdAt: now,
      createdAtFormatted: new Date(now).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
    };

    await redisSet(`support:ticket:${id}`, JSON.stringify(ticket));

    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── GET — tüm biletleri getir (admin) ───────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Yetkisiz.' }, { status: 401 });
  }

  try {
    const keys = await redisKeys('support:ticket:*');
    const tickets = [];

    for (const key of keys) {
      const val = await redisGet(key);
      if (!val) continue;
      tickets.push(JSON.parse(val));
    }

    // En yeniden eskiye sırala
    tickets.sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({ success: true, tickets });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── PATCH — talebi kapat ────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Yetkisiz.' }, { status: 401 });
  }

  try {
    const { id } = await req.json() as { id?: string };
    if (!id) return NextResponse.json({ success: false, error: 'ID gerekli.' }, { status: 400 });

    const key = `support:ticket:${id}`;
    const val = await redisGet(key);
    if (!val) return NextResponse.json({ success: false, error: 'Talep bulunamadı.' }, { status: 404 });

    const ticket = JSON.parse(val);
    ticket.status = 'closed';
    ticket.closedAt = Date.now();

    await redisSet(key, JSON.stringify(ticket));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── DELETE — talebi sil ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Yetkisiz.' }, { status: 401 });
  }

  try {
    const { id } = await req.json() as { id?: string };
    if (!id) return NextResponse.json({ success: false, error: 'ID gerekli.' }, { status: 400 });

    await redisDel(`support:ticket:${id}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
