import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = 'https://galyaiptv.com.tr';
const OG_IMAGE_PATH = '/og-image.png'; 

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // page.tsx'teki başlık buraya eklendi
    default: 'IPTV Satın Al | 4K IPTV Paketleri – Galya IPTV',
    template: '%s | Galya IPTV',
  },
  description:
    'Türkiye\'nin en kaliteli IPTV hizmeti. 85.000+ kanal, 4K yayın. ₺500\'den başlayan fiyatlarla en iyi IPTV server. Ücretsiz test al.', // page.tsx'ten alındı
  keywords: [
    'iptv satın al',
    'iptv fiyat',
    '4k iptv',
    'en iyi iptv',
    'iptv server',
    'iptv nedir',
    'iptv satın al ucuz',
    'donmayan iptv',
    'premium iptv',
    'galya iptv',
    'iptv türkiye',
    'iptv test',
  ],
  authors: [{ name: 'Galya IPTV', url: SITE_URL }],
  creator: 'Galya IPTV',
  publisher: 'Galya IPTV',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: SITE_URL,
    siteName: 'Galya IPTV',
    title: 'IPTV Satın Al | 4K IPTV Paketleri – Galya IPTV',
    description:
      'Türkiye\'nin en kaliteli IPTV hizmeti. 85.000+ kanal, 4K yayın ve donmayan altyapıyla hemen testinizi başlatın.',
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: 'Galya IPTV - Premium 4K IPTV Hizmeti',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IPTV Satın Al | 4K IPTV Paketleri – Galya IPTV',
    description:
      '85.000+ kanal ve 4K yayın kalitesiyle Türkiye’nin en iyi IPTV deneyimi.',
    images: [OG_IMAGE_PATH],
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', // Search Console kodunu buraya eklemeyi unutmayın
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Galya IPTV',
  alternateName: ['Galya IP TV', 'Galaxy IPTV', 'Galya TV'],
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: "Türkiye'nin en kaliteli IPTV hizmeti sağlayıcısı. 85.000+ kanal, 4K yayın, 7/24 destek.",
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+447441921660', // page.tsx'teki güncel numara ile senkronize edildi
    contactType: 'customer service',
    availableLanguage: ['Turkish', 'English'],
  },
  sameAs: ['https://wa.me/447441921660'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#0891b2" /> {/* Sitedeki markör rengiyle uyumlu hale getirildi */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="bg-[#080f10] text-white antialiased">{children}</body>
    </html>
  );
}
