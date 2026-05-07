import { defineConfig } from 'prisma/config'

// Used by Prisma CLI (db pull, migrate, studio) — requires DATABASE_URL when invoked.
// Set DATABASE_URL to Cloud SQL Auth Proxy URL when running CLI commands locally.
// Runtime connections use the Cloud SQL connector adapter in src/lib/db.ts.
// Build-time `prisma generate` does not connect — placeholder fallback keeps Vercel
// Preview env (no DATABASE_URL) working without exposing prod creds.

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
  migrations: {
    path: 'prisma/migrations',
  },
})
