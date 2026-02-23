import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = 'https://galyaiptv.com.tr';
// ÖNEMLİ: Görselin adının public klasöründekiyle aynı olduğundan ve uzantısından (.jpg / .png) emin ol!
const OG_IMAGE_PATH = '/og-image.jpg'; 

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Galya IPTV - IPTV Satın Al | Premium IPTV Hizmeti 2025',
    template: '%s | Galya IPTV',
  },
  description:
    'Galya IPTV ile donmayan, kesintisiz ve 4K kalitesinde yayın keyfini yaşayın. 10.000+ kanal seçeneği ve 7/24 teknik destekle Türkiye’nin en iyi IPTV sağlayıcısıyız.',
  keywords: [
    'iptv satın al',
    'iptv satın al ucuz',
    'donmayan iptv',
    '4k iptv',
    'premium iptv',
    'galya iptv',
    'iptv türkiye',
    'iptv test',
    'iptv paket',
    'en iyi iptv',
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
    title: 'Galya IPTV - IPTV Satın Al | Premium IPTV Hizmeti',
    description:
      'Türkiye’nin en kaliteli IPTV hizmeti. 10.000+ kanal, 4K yayın ve donmayan sunucu altyapısıyla hemen aboneliğinizi başlatın ve kesintisiz yayının tadını çıkarın!',
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: 'Galya IPTV - Premium IPTV Hizmeti',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galya IPTV - IPTV Satın Al | Premium IPTV Hizmeti',
    description:
      'Türkiye’nin en kaliteli IPTV hizmeti. 10.000+ kanal, 4K yayın ve 7/24 destek ile kesintisiz TV deneyimi burada.',
    images: [OG_IMAGE_PATH],
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', // Burayı Search Console'dan aldığın kodla değiştir
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Galya IPTV',
  alternateName: ['Galya IP TV', 'Galaxy IPTV', 'Galya TV'],
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: 'Türkiye\'nin en kaliteli IPTV hizmeti sağlayıcısı. 10.000+ kanal, 4K yayın, 7/24 destek.',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+44-7445-508352',
    contactType: 'customer service',
    availableLanguage: ['Turkish', 'English'],
  },
  sameAs: ['https://wa.me/447445508352'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#8B5CF6" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
