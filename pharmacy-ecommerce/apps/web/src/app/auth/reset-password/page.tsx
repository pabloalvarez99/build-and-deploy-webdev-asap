'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oobCode = searchParams.get('oobCode') || ''
  const mode = searchParams.get('mode') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  // Verify the reset code from the URL is valid before showing the form
  useEffect(() => {
    if (mode !== 'resetPassword' || !oobCode) {
      setError('Enlace inválido o expirado. Solicita uno nuevo.')
      return
    }
    verifyPasswordResetCode(auth, oobCode)
      .then(() => setReady(true))
      .catch(() => setError('Este enlace ha expirado o ya fue usado. Solicita uno nuevo.'))
  }, [oobCode, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsLoading(true)
    try {
      await confirmPasswordReset(auth, oobCode, password)
      setDone(true)
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="card p-5 sm:p-8 w-full max-w-md text-center py-4">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">¡Contraseña actualizada!</h1>
          <p className="text-slate-600 dark:text-slate-300">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          {error ? (
            <div className="card p-6 max-w-md">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 dark:text-red-400 text-base mb-4">{error}</p>
              <a href="/auth/forgot-password" className="btn btn-primary">
                Solicitar nuevo enlace
              </a>
            </div>
          ) : (
            <>
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Verificando enlace...</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card p-5 sm:p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Nueva contraseña</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Ingresa tu nueva contraseña</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 dark:text-red-400 text-base">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirm" className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input pl-10"
                placeholder="Repite la contraseña"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-3 disabled:opacity-50"
          >
            {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
