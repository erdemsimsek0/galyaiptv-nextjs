/** @type {import('next').NextConfig} */

// HTTP sunuculara fetch için gerekli
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'http',  hostname: 'pro4kiptv.xyz', port: '2086' },
      { protocol: 'https', hostname: 'pro4kiptv.xyz', port: '2086' },
      { protocol: 'http',  hostname: '**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  compress: true,
  poweredByHeader: false,

  // Vercel'de HTTP kaynaklara sunucu tarafı fetch için gerekli
  experimental: {
    serverComponentsExternalPackages: [],
  },

  // --- YÖNLENDİRMELER BURADA BAŞLIYOR ---
  async redirects() {
    return [
      {
        source: '/araclar', // Eski adresiniz (path)
        destination: 'https://www.hedef-site.com', // Gitmesini istediğiniz tam adres
        permanent: true, // true yaparsanız 308 (Kalıcı), false yaparsanız 307 (Geçici) yönlendirme yapar
      },
    ];
  },
  // --- YÖNLENDİRMELER BURADA BİTİYOR ---

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
