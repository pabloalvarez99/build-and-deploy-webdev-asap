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
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  })
  return app
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdmin())
}

export function getStorageBucket() {
  return getStorage(getFirebaseAdmin()).bucket()
}

// Named export for modules that import adminAuth directly (middleware, api-helpers)
export const adminAuth = getAdminAuth()
