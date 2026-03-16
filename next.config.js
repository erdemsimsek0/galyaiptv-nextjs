/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'http', hostname: 'pro4kiptv.xyz' },
      { protocol: 'https', hostname: 'pro4kiptv.xyz' },
    ],
  },
  compress: true,
  poweredByHeader: false,
  // HTTP sunuculara erişim için
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
