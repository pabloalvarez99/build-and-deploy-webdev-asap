import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
}

// Only initialize Firebase in the browser. During SSR prerender there is no
// user interaction so auth methods are never called (they're inside useEffect).
function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') return {} as Auth
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  return getAuth(app)
}

export const auth = getFirebaseAuth()
