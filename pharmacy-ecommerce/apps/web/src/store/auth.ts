import { create } from 'zustand'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onIdTokenChanged,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { User } from '@/lib/api'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  initialized: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string, rut?: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

/** Exchange Firebase ID token for a server-side session cookie */
async function createSession(idToken: string): Promise<string> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) throw new Error('Error al crear sesión')
  const data = await res.json()
  return data.role || 'user'
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,
  error: null,
  initialized: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await fbUser.getIdToken()
      const role = await createSession(idToken)

      set({
        user: {
          id: fbUser.uid,
          email: fbUser.email!,
          name: fbUser.displayName || null,
          role,
          created_at: fbUser.metadata.creationTime || new Date().toISOString(),
        },
        isLoading: false,
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al iniciar sesión'
      set({ error: msg, isLoading: false })
      throw error
    }
  },

  register: async (email: string, password: string, name?: string, rut?: string) => {
    set({ isLoading: true, error: null })
    try {
      // Use API route so Firebase Admin can set displayName and auto-confirm
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, rut }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al registrarse')
      }

      // Sign in immediately after registration
      const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password)
      if (name) await updateProfile(fbUser, { displayName: name })
      const idToken = await fbUser.getIdToken()
      await createSession(idToken)

      set({
        user: {
          id: fbUser.uid,
          email: fbUser.email!,
          name: name || null,
          role: 'user',
          created_at: fbUser.metadata.creationTime || new Date().toISOString(),
        },
        isLoading: false,
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al registrarse'
      set({ error: msg, isLoading: false })
      throw error
    }
  },

  logout: async () => {
    await signOut(auth)
    await fetch('/api/auth/session', { method: 'DELETE' })
    set({ user: null, error: null })
  },

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      // Listen for token changes to keep client state in sync with Firebase
      await new Promise<void>((resolve) => {
        const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
          unsubscribe()
          if (!fbUser) {
            set({ user: null, isLoading: false, initialized: true })
            resolve()
            return
          }
          const idToken = await fbUser.getIdToken()
          const role = await createSession(idToken)
          set({
            user: {
              id: fbUser.uid,
              email: fbUser.email!,
              name: fbUser.displayName || null,
              role,
              created_at: fbUser.metadata.creationTime || new Date().toISOString(),
            },
            isLoading: false,
            initialized: true,
          })
          resolve()
        })
      })
    } catch {
      set({ user: null, isLoading: false, initialized: true })
    }
  },

  clearError: () => set({ error: null }),
}))
