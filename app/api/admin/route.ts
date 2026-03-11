// app/api/admin/route.ts
import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_SECRET = process.env.ADMIN_SECRET!;

// ─── Redis Helpers ────────────────────────────────────────────────────────────

async function redis(command: unknown[]): Promise<unknown> {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
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

async function redisTTL(key: string): Promise<number> {
  return (await redis(['TTL', key])) as number;
}

async function redisDel(key: string): Promise<void> {
  await redis(['DEL', key]);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret');
  return secret === ADMIN_SECRET;
}

// ─── GET: Tüm trial kayıtlarını listele ───────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const emailKeys = await redisKeys('trial:email:*');
    const ipKeys = await redisKeys('trial:ip:*');

    const records: {
      key: string;
      type: 'email' | 'ip';
      identifier: string;
      email: string;
      ip: string;
      createdAt: number;
      createdAtFormatted: string;
      ttlSeconds: number;
      daysLeft: number;
    }[] = [];

    for (const key of [...emailKeys, ...ipKeys]) {
      const val = await redisGet(key);
      const ttl = await redisTTL(key);
      if (!val) continue;

      const record = JSON.parse(val);
      const isEmail = key.startsWith('trial:email:');
      const identifier = key.replace('trial:email:', '').replace('trial:ip:', '');

      records.push({
        key,
        type: isEmail ? 'email' : 'ip',
        identifier,
        email: record.email,
        ip: record.ip,
        createdAt: record.createdAt,
        createdAtFormatted: new Date(record.createdAt).toLocaleString('tr-TR', {
          timeZone: 'Europe/Istanbul',
        }),
        ttlSeconds: ttl,
        daysLeft: Math.ceil(ttl / 86400),
      });
    }

    // En yeni önce
    records.sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({
      success: true,
      totalEmails: emailKeys.length,
      totalIPs: ipKeys.length,
      records,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── DELETE: Belirli bir kaydı sil (limiti sıfırla) ───────────────────────────

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email gerekli.' }, { status: 400 });
    }

    // Email kaydını sil
    await redisDel(`trial:email:${email}`);

    // IP kaydını bulmak için tüm IP kayıtlarını tara, bu emaile ait olanı sil
    const ipKeys = await redisKeys('trial:ip:*');
    for (const key of ipKeys) {
      const val = await redisGet(key);
      if (!val) continue;
      const record = JSON.parse(val);
      if (record.email === email) {
        await redisDel(key);
      }
    }

    return NextResponse.json({ success: true, message: `${email} için limit sıfırlandı.` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
