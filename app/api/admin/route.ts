// app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL    = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN  = process.env.UPSTASH_REDIS_REST_TOKEN!;
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
async function redisSet(key: string, value: string, ttlSeconds: number) {
  await redis(['SET', key, value, 'EX', ttlSeconds]);
}
async function redisDel(key: string) {
  await redis(['DEL', key]);
}

function isAdmin(req: NextRequest) {
  return req.headers.get('x-admin-secret') === ADMIN_SECRET;
}

// ─── GET — admin: tüm bildirimleri listele ────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAdmin(req))
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

  try {
    const keys = await redisKeys('payment:notification:*');
    const notifications = [];

    for (const key of keys) {
      const val = await redisGet(key);
      if (!val) continue;
      const record = JSON.parse(val);
      notifications.push({
        ...record,
        createdAtFormatted: new Date(record.createdAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
      });
    }

    // En yeni önce
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    const pending  = notifications.filter(n => n.status === 'pending').length;
    const approved = notifications.filter(n => n.status === 'approved').length;
    const rejected = notifications.filter(n => n.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      total: notifications.length,
      pending,
      approved,
      rejected,
      notifications,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
// İki farklı kullanım:
//   1. Kullanıcıdan FormData (ödeme sayfası): email, plan, duration, devices, amount, senderName, receipt?
//   2. Adminden JSON: action = 'assign_subscription' | 'reject_notification'
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // ── Admin aksiyonları (JSON) ──────────────────────────────────────────────
    if (contentType.includes('application/json')) {
      if (!isAdmin(req))
        return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

      const body = await req.json() as {
        action?: string;
        email?: string;
        plan?: string;
        durationDays?: number;
        username?: string;
        password?: string;
      };

      // Abonelik onayla ve aktif et
      if (body.action === 'assign_subscription') {
        if (!body.email || !body.plan || !body.durationDays)
          return NextResponse.json({ success: false, error: 'Email, plan ve süre gerekli.' }, { status: 400 });

        const key = `payment:notification:${body.email}`;
        const val = await redisGet(key);
        if (!val)
          return NextResponse.json({ success: false, error: 'Bildirim bulunamadı.' }, { status: 404 });

        const record = JSON.parse(val);
        record.status      = 'approved';
        record.approvedAt  = Date.now();
        record.assignedPlan = body.plan;
        if (body.username) record.assignedUsername = body.username;
        if (body.password) record.assignedPassword = body.password;

        // 90 günlük TTL ile kaydet (arşiv için)
        await redisSet(key, JSON.stringify(record), 90 * 86400);

        return NextResponse.json({
          success: true,
          message: `${body.email} için ${body.plan} aboneliği onaylandı.`,
        });
      }

      // Bildirimi reddet
      if (body.action === 'reject_notification') {
        if (!body.email)
          return NextResponse.json({ success: false, error: 'Email gerekli.' }, { status: 400 });

        const key = `payment:notification:${body.email}`;
        const val = await redisGet(key);
        if (val) {
          const record = JSON.parse(val);
          record.status     = 'rejected';
          record.rejectedAt = Date.now();
          await redisSet(key, JSON.stringify(record), 30 * 86400);
        }

        return NextResponse.json({ success: true, message: 'Bildirim reddedildi.' });
      }

      return NextResponse.json({ success: false, error: 'Geçersiz aksiyon.' }, { status: 400 });
    }

    // ── Kullanıcı bildirimi (FormData — ödeme sayfasından) ────────────────────
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData  = await req.formData();
      const email     = (formData.get('email')      as string) || '';
      const plan      = (formData.get('plan')       as string) || '';
      const duration  = (formData.get('duration')   as string) || '';
      const devices   = (formData.get('devices')    as string) || '';
      const amount    = (formData.get('amount')     as string) || '';
      const senderName = (formData.get('senderName') as string) || '';

      if (!email)
        return NextResponse.json({ success: false, error: 'Email gerekli.' }, { status: 400 });

      // Mükerrer bildirimi engelle: aynı email için bekleyen varsa güncelle
      const key = `payment:notification:${email}`;

      const record = {
        email,
        plan,
        duration,
        devices,
        amount,
        senderName,
        status:    'pending',
        createdAt: Date.now(),
        // Dekont dosyası: şimdilik sadece var/yok bilgisi kaydediyoruz
        // (Dosya depolama için Vercel Blob veya benzeri entegrasyon gerekir)
        hasReceipt: formData.has('receipt') && (formData.get('receipt') as File)?.size > 0,
      };

      // 7 günlük TTL
      await redisSet(key, JSON.stringify(record), 7 * 86400);

      return NextResponse.json({ success: true, message: 'Ödeme bildirimi alındı.' });
    }

    return NextResponse.json({ success: false, error: 'Desteklenmeyen içerik türü.' }, { status: 415 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── DELETE — bildirimi tamamen sil ──────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req))
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

  try {
    const { email } = await req.json() as { email?: string };
    if (!email)
      return NextResponse.json({ success: false, error: 'Email gerekli.' }, { status: 400 });

    await redisDel(`payment:notification:${email}`);
    return NextResponse.json({ success: true, message: `${email} bildirimi silindi.` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
