'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, Fingerprint } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirect = rawRedirect.startsWith('/') ? rawRedirect : '/';

  const { register, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Format RUT as user types: 12.345.678-9
  const formatRut = (value: string) => {
    let clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length > 9) clean = clean.slice(0, 9);
    if (clean.length <= 1) return clean;
    const dv = clean.slice(-1);
    const body = clean.slice(0, -1);
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted}-${dv}`;
  };

  // Validate Chilean RUT with modulo 11
  const validateRut = (rutStr: string): boolean => {
    const clean = rutStr.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length < 7 || clean.length > 9) return false;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    let sum = 0;
    let mul = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * mul;
      mul = mul === 7 ? 2 : mul + 1;
    }
    const expected = 11 - (sum % 11);
    const expectedDv = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected);
    return dv === expectedDv;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    if (!rut.trim()) {
      setValidationError('El RUT es obligatorio para acumular puntos');
      return;
    }
    if (!validateRut(rut)) {
      setValidationError('El RUT ingresado no es válido');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await register(email, password, name || undefined, rut.replace(/[^0-9kK]/g, '').toUpperCase());
      router.push(redirect);
    } catch {
      // Error is handled in store
    }
  };

  const loginHref = redirect !== '/'
    ? `/auth/login?redirect=${encodeURIComponent(redirect)}`
    : '/auth/login';

  const displayError = validationError || error;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card p-5 sm:p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Crear Cuenta</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Regístrate para empezar a comprar
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-1.5">
            <span className="text-amber-500">⭐</span>
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Gana puntos en cada compra</span>
          </div>
        </div>

        {displayError && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 dark:text-red-400 text-base">{displayError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nombre (opcional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input pl-10"
                placeholder="Tu nombre"
                autoComplete="given-name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rut" className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
              RUT <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                id="rut"
                type="text"
                value={rut}
                onChange={(e) => setRut(formatRut(e.target.value))}
                className="input pl-10"
                placeholder="12.345.678-9"
                required
                autoComplete="off"
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Necesario para acumular puntos de fidelidad</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10 pr-12"
                placeholder="Min. 6 caracteres"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pl-10 pr-12"
                placeholder="Repite tu contraseña"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-4 text-xl disabled:opacity-50"
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="text-center text-slate-500 dark:text-slate-400 mt-6 text-base">
          ¿Ya tienes cuenta?{' '}
          <Link href={loginHref} className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold text-base">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <RegisterContent />
    </Suspense>
  );
}
