/**
 * Prisma client singleton with Cloud SQL connector.
 * Uses @google-cloud/cloud-sql-connector for secure IAM-based connection
 * without IP allowlisting. Limits pool to 5 connections (critical for serverless).
 */
import { PrismaClient } from '@prisma/client'
import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector'
import { GoogleAuth } from 'google-auth-library'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined
}

async function createPrismaClient(): Promise<PrismaClient> {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!)
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const connector = new Connector({ auth })

  const clientOpts = await connector.getOptions({
    instanceConnectionName: process.env.CLOUD_SQL_INSTANCE!.trim(),
    ipType: IpAddressTypes.PUBLIC,
    authType: AuthTypes.PASSWORD,
  })

  const pool = new pg.Pool({
    ...clientOpts,
    user: process.env.DB_USER!.trim(),
    password: process.env.DB_PASSWORD!.trim(),
    database: process.env.DB_NAME!.trim(),
    max: 1,
    min: 0,
    idleTimeoutMillis: 10000,
    // Esperar hasta 8s si no hay slots disponibles antes de lanzar error
    connectionTimeoutMillis: 8000,
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
