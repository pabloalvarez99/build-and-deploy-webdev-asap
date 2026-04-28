/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@prisma/client',
      '@prisma/adapter-pg',
      '@google-cloud/cloud-sql-connector',
      'google-auth-library',
      'firebase-admin',
      'pg',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
}

module.exports = nextConfig
