// app/api/admin/route.ts
// v2 — test sonlandırma, IP sıfırlama, email sıfırlama, detaylı kayıtlar
import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
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
async function redisTTL(key: string): Promise<number> {
  return (await redis(['TTL', key])) as number;
}
async function redisDel(key: string) { await redis(['DEL', key]); }
async function redisSet(key: string, value: string, ttl: number) {
  await redis(['SET', key, value, 'EX', ttl]);
}

function isAuthorized(req: NextRequest) {
  return req.headers.get('x-admin-secret') === ADMIN_SECRET;
}

// ─── GET — tüm kayıtları getir ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthorized(req))
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

  try {
    const emailKeys = await redisKeys('trial:email:*');
    const ipKeys    = await redisKeys('trial:ip:*');

    const records = [];
    const packageStats: Record<string, number> = {};

    for (const key of emailKeys) {
      const val = await redisGet(key);
      const ttl = await redisTTL(key);
      if (!val) continue;
      const record = JSON.parse(val);
      const pkg = record.selectedPackage || 'Belirtilmedi';
      packageStats[pkg] = (packageStats[pkg] || 0) + 1;

      // Test süresi: 3 saat (10800 saniye). createdAt'tan hesapla
      const trialTTL = 3 * 60 * 60 * 1000; // 3 saat ms
      const elapsed  = Date.now() - (record.createdAt || 0);
      const trialExpired = elapsed > trialTTL;
      const trialRemainingMs = Math.max(0, trialTTL - elapsed);
      const trialHoursLeft = (trialRemainingMs / 3600000).toFixed(1);

      records.push({
        key,
        email:              record.email,
        ip:                 record.ip || 'bilinmiyor',
        selectedPackage:    pkg,
        username:           record.username || '-',
        password:           record.password || '-',
        createdAt:          record.createdAt,
        createdAtFormatted: new Date(record.createdAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
        ttlSeconds:         ttl,
        daysLeft:           Math.ceil(ttl / 86400),
        trialExpired,
        trialHoursLeft:     trialExpired ? '0' : trialHoursLeft,
        trialStatus:        trialExpired ? 'expired' : 'active',
      });
    }

    // IP kayıtlarını ayrı tut (sadece hangi IP'lerin kayıtlı olduğunu görmek için)
    const ipRecords: { ip: string; email: string; daysLeft: number }[] = [];
    for (const key of ipKeys) {
      const val = await redisGet(key);
      const ttl = await redisTTL(key);
      if (!val) continue;
      const record = JSON.parse(val);
      ipRecords.push({
        ip: key.replace('trial:ip:', ''),
        email: record.email || '-',
        daysLeft: Math.ceil(ttl / 86400),
      });
    }

    records.sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({
      success: true,
      totalEmails: emailKeys.length,
      totalIPs:    ipKeys.length,
      packageStats,
      records,
      ipRecords,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── DELETE — çeşitli sıfırlama işlemleri ────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req))
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

  try {
    const body = await req.json();
    const { action, email, ip } = body as { action?: string; email?: string; ip?: string };

    // ── email limiti sıfırla (email + ilgili IP kayıtları) ───────────────────
    if (action === 'reset_email' || (!action && email)) {
      if (!email)
        return NextResponse.json({ success: false, error: 'Email gerekli.' }, { status: 400 });

      await redisDel(`trial:email:${email}`);

      // Bu email'e ait tüm IP kayıtlarını da sil
      const ipKeys = await redisKeys('trial:ip:*');
      for (const key of ipKeys) {
        const val = await redisGet(key);
        if (!val) continue;
        if (JSON.parse(val).email === email) await redisDel(key);
      }

      // Rate limit kayıtlarını da temizle
      await redisDel(`resend:${email}`);

      return NextResponse.json({ success: true, message: `${email} için tüm limitler sıfırlandı.` });
    }

    // ── sadece IP sıfırla ─────────────────────────────────────────────────────
    if (action === 'reset_ip') {
      if (!ip)
        return NextResponse.json({ success: false, error: 'IP gerekli.' }, { status: 400 });

      await redisDel(`trial:ip:${ip}`);
      await redisDel(`rate:otp:${ip}`);

      return NextResponse.json({ success: true, message: `${ip} IP limiti sıfırlandı.` });
    }

    // ── testi sonlandır (kullanıcıyı sil ama IP'yi tut) ──────────────────────
    if (action === 'terminate_trial') {
      if (!email)
        return NextResponse.json({ success: false, error: 'Email gerekli.' }, { status: 400 });

      // Email kaydını sil
      await redisDel(`trial:email:${email}`);
      await redisDel(`resend:${email}`);

      // Not: IP kaydını tutuyoruz ki aynı IP tekrar test alamasın
      return NextResponse.json({ success: true, message: `${email} test hesabı sonlandırıldı.` });
    }

    // ── email + IP tamamen sıfırla (tam temizleme) ────────────────────────────
    if (action === 'reset_full') {
      if (!email)
        return NextResponse.json({ success: false, error: 'Email gerekli.' }, { status: 400 });

      await redisDel(`trial:email:${email}`);
      await redisDel(`resend:${email}`);

      const ipKeys = await redisKeys('trial:ip:*');
      for (const key of ipKeys) {
        const val = await redisGet(key);
        if (!val) continue;
        const parsed = JSON.parse(val);
        if (parsed.email === email) {
          const ipAddr = key.replace('trial:ip:', '');
          await redisDel(key);
          await redisDel(`rate:otp:${ipAddr}`);
        }
      }

      return NextResponse.json({ success: true, message: `${email} için tüm kayıtlar silindi (IP dahil).` });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz aksiyon.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── PATCH — test süresini uzat veya paket güncelle ──────────────────────────
export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req))
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

  try {
    const { email, extraHours, newPackage } = await req.json() as {
      email?: string;
      extraHours?: number;
      newPackage?: string;
    };

    if (!email)
      return NextResponse.json({ success: false, error: 'Email gerekli.' }, { status: 400 });

    const key = `trial:email:${email}`;
    const val = await redisGet(key);
    if (!val)
      return NextResponse.json({ success: false, error: 'Kayıt bulunamadı.' }, { status: 404 });

    const record = JSON.parse(val);

    if (newPackage) record.selectedPackage = newPackage;

    const currentTTL = await redisTTL(key);
    const newTTL = currentTTL + (extraHours ? extraHours * 3600 : 0);

    await redisSet(key, JSON.stringify(record), Math.max(newTTL, 3600));

    return NextResponse.json({ success: true, message: `${email} güncellendi.` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
