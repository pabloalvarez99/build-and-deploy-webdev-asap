import type { PrismaConfig } from 'prisma'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// prisma.config.ts is used by Prisma CLI (migrate, db pull, studio).
// Runtime connections use the adapter in src/lib/db.ts (Cloud SQL connector).
// This config handles LOCAL development via Cloud SQL Auth Proxy.

export default {
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrate: {
    async adapter() {
      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
      })
      return new PrismaPg(pool)
    },
  },
} satisfies PrismaConfig
