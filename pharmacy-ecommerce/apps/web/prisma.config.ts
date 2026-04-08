import { defineConfig, env } from 'prisma/config'

// Used by Prisma CLI (db pull, migrate, studio) — requires DATABASE_URL.
// Set DATABASE_URL to Cloud SQL Auth Proxy URL when running CLI commands locally.
// Runtime connections use the Cloud SQL connector adapter in src/lib/db.ts.

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
  },
})
