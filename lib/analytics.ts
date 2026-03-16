/**
 * lib/analytics.ts
 * Google Analytics 4 ve Meta Pixel için merkezi event takip yardımcısı.
 *
 * Kurulum:
 *   1. GA4: layout.tsx içine <Script> ile gtag.js ekleyin
 *   2. Meta Pixel: layout.tsx içine fbq snippet ekleyin
 *   3. NEXT_PUBLIC_GA_ID ve NEXT_PUBLIC_META_PIXEL_ID .env dosyasına ekleyin
 *
 * Kullanım:
 *   import { trackEvent, trackPageView, trackPurchaseIntent } from '@/lib/analytics';
 *   trackEvent('button_click', { label: 'satin_al', paket: 'Max' });
 *   trackPurchaseIntent('Max', 229.90, '12ay');
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function isBrowser() {
  return typeof window !== 'undefined';
}

// ─── Genel event gönderici ────────────────────────────────────────────────────
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>,
): void {
  if (!isBrowser()) return;

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', eventName, properties ?? {});
  }

  // Meta Pixel
  if (window.fbq) {
    window.fbq('track', eventName, properties ?? {});
  }
}

// ─── Sayfa görüntüleme ────────────────────────────────────────────────────────
export function trackPageView(url: string): void {
  if (!isBrowser()) return;

  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID ?? '', {
      page_path: url,
    });
  }

  if (window.fbq) {
    window.fbq('track', 'PageView');
  }
}

// ─── Satın alma niyeti (paket butonu tıklandı) ────────────────────────────────
export function trackPurchaseIntent(
  paketAdi: string,
  fiyat: number,
  sure: string,
): void {
  trackEvent('purchase_intent', {
    item_name: paketAdi,
    value: fiyat,
    currency: 'TRY',
    duration: sure,
  });

  // Meta: InitiateCheckout standardı
  if (isBrowser() && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_name: paketAdi,
      value: fiyat,
      currency: 'TRY',
    });
  }
}

// ─── Ücretsiz test başlatıldı ─────────────────────────────────────────────────
export function trackTrialStart(email?: string): void {
  trackEvent('trial_start', { has_email: !!email });

  if (isBrowser() && window.fbq) {
    window.fbq('track', 'Lead');
  }
}

// ─── WhatsApp butonuna tıklandı ───────────────────────────────────────────────
export function trackWhatsAppClick(source: string): void {
  trackEvent('whatsapp_click', { source });
}

// ─── OTP doğrulandı ──────────────────────────────────────────────────────────
export function trackOtpVerified(): void {
  trackEvent('otp_verified');
}
