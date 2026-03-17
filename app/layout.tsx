import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

const SITE_URL = 'https://www.galyastream.com';
const OG_IMAGE_PATH = '/og-image.png';
const GA_ID = 'G-SZKFJ8NW2R';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'IPTV Satın Al | 4K IPTV Paketleri – GalyaStream',
    template: '%s | GalyaStream',
  },
  description:
    "Türkiye'nin en kaliteli IPTV hizmeti. 85.000+ kanal, 4K yayın. ₺500'den başlayan fiyatlarla en iyi IPTV server. Ücretsiz test al.",
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
    'GalyaStream',
    'iptv türkiye',
    'iptv test',
  ],
  authors: [{ name: 'GalyaStream', url: SITE_URL }],
  creator: 'GalyaStream',
  publisher: 'GalyaStream',
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
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'android-chrome', url: '/android-chrome-192x192.png', sizes: '192x192' },
      { rel: 'android-chrome', url: '/android-chrome-512x512.png', sizes: '512x512' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: SITE_URL,
    siteName: 'GalyaStream',
    title: 'IPTV Satın Al | 4K IPTV Paketleri – GalyaStream',
    description:
      "Türkiye'nin en kaliteli IPTV hizmeti. 85.000+ kanal, 4K yayın ve donmayan altyapıyla hemen testinizi başlatın.",
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: 'GalyaStream - Premium 4K IPTV Hizmeti',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IPTV Satın Al | 4K IPTV Paketleri – GalyaStream',
    description:
      "85.000+ kanal ve 4K yayın kalitesiyle Türkiye'nin en iyi IPTV deneyimi.",
    images: [OG_IMAGE_PATH],
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GalyaStream',
  alternateName: ['GalyaStream', 'Galya Stream', 'Galya TV'],
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    "Türkiye'nin en kaliteli IPTV hizmeti sağlayıcısı. 85.000+ kanal, 4K yayın, 7/24 destek.",
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+447441921660',
    contactType: 'customer service',
    availableLanguage: ['Turkish', 'English'],
  },
  sameAs: ['https://wa.me/447441921660'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#3b82f6" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="bg-[#080f10] text-white antialiased">
        {children}

        {/* ─── Google Analytics 4 ───────────────────────────────────────────── */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}</Script>
      </body>
    </html>
  );
}
