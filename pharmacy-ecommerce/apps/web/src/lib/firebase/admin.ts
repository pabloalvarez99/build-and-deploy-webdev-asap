import { getApps, initializeApp, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'

let app: App | undefined

function getFirebaseAdmin(): App {
  if (app) return app
  const existing = getApps()
  if (existing.length > 0) {
    app = existing[0]
    return app
  }
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!.trim(),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!.trim(),
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n').trim(),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET?.trim(),
  })
  return app
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdmin())
}

export function getStorageBucket() {
  return getStorage(getFirebaseAdmin()).bucket()
}

// Lazy proxy — Firebase Admin initializes on first method call, not at module load.
// This prevents build-time crashes when FIREBASE_* env vars aren't set.
import type { Auth } from 'firebase-admin/auth'
export const adminAuth = new Proxy({} as Auth, {
  get(_, prop: string | symbol) {
    return (getAdminAuth() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
