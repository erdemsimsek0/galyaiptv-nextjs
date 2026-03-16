/**
 * lib/rate-limit.ts
 * API spam koruması için basit in-memory rate limiter.
 * Daha büyük ölçekte Redis tabanlı çözüme geçilebilir.
 *
 * Kullanım (API route içinde):
 *   import { checkRateLimit } from '@/lib/rate-limit';
 *
 *   const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
 *   if (!checkRateLimit(ip)) {
 *     return NextResponse.json({ error: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });
 *   }
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// IP → istek sayısı + sıfırlanma zamanı
const store = new Map<string, RateLimitEntry>();

// Eski kayıtları temizle (bellek sızıntısını önler)
function evict() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}

// Her 5 dakikada bir temizlik
if (typeof setInterval !== 'undefined') {
  setInterval(evict, 5 * 60 * 1000);
}

/**
 * @param identifier  IP adresi veya e-posta gibi benzersiz bir anahtar
 * @param limit       İzin verilen maksimum istek sayısı (varsayılan: 5)
 * @param windowMs    Pencere süresi ms cinsinden (varsayılan: 60 saniye)
 * @returns true → istek kabul edildi, false → limit aşıldı
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60 * 1000,
): boolean {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    // Yeni pencere başlat
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count += 1;
  return true;
}

/**
 * Kalan istek hakkını döndürür.
 * API yanıtında header olarak göndermek için kullanılabilir.
 */
export function getRemainingRequests(
  identifier: string,
  limit: number = 5,
): number {
  const entry = store.get(identifier);
  if (!entry || Date.now() > entry.resetAt) return limit;
  return Math.max(0, limit - entry.count);
}

/**
 * Sıfırlanmaya kalan süreyi saniye cinsinden döndürür.
 */
export function getResetSeconds(identifier: string): number {
  const entry = store.get(identifier);
  if (!entry || Date.now() > entry.resetAt) return 0;
  return Math.ceil((entry.resetAt - Date.now()) / 1000);
}
