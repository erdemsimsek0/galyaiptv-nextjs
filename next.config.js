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
    ],
  },
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
