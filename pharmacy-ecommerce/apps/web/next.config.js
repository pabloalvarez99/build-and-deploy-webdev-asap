/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'http',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: true,
  },
  async rewrites() {
    return [
      // Product Service - proxy to Railway
      {
        source: '/backend/products/:path*',
        destination: 'https://empathetic-wisdom-production-7d2f.up.railway.app/api/:path*',
      },
      // Order Service - proxy to Railway
      {
        source: '/backend/orders/:path*',
        destination: 'https://build-and-deploy-webdev-asap-production.up.railway.app/api/:path*',
      },
      // Auth Service - proxy to Railway
      {
        source: '/backend/auth/:path*',
        destination: 'https://efficient-patience-production.up.railway.app/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig
