/**
 * Prisma client singleton with Cloud SQL connector.
 * Uses @google-cloud/cloud-sql-connector for secure IAM-based connection
 * without IP allowlisting. Limits pool to 5 connections (critical for serverless).
 */
import { PrismaClient } from '@prisma/client'
import { Connector } from '@google-cloud/cloud-sql-connector'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined
}

async function createPrismaClient(): Promise<PrismaClient> {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!)
  const connector = new Connector({ auth: credentials })

  const clientOpts = await connector.getOptions({
    instanceConnectionName: process.env.CLOUD_SQL_INSTANCE!, // project:region:instance
    ipType: 'PUBLIC',
    authType: 'PASSWORD',
  })

  const pool = new pg.Pool({
    ...clientOpts,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    max: 5,
  })

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

let _initPromise: Promise<PrismaClient> | null = null

export async function getDb(): Promise<PrismaClient> {
  // In development, reuse across hot-reloads to avoid exhausting connections
  if (process.env.NODE_ENV === 'development') {
    if (!global._prisma) {
      global._prisma = await createPrismaClient()
    }
    return global._prisma
  }

  // In production (Vercel serverless), cache per function instance
  if (!_initPromise) {
    _initPromise = createPrismaClient()
  }
  return _initPromise
}
