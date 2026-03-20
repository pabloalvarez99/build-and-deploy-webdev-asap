'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Page error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Algo salió mal</h1>
        <p className="text-lg text-slate-500 mb-8">
          Ocurrió un error inesperado. Por favor intenta nuevamente.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn btn-primary text-lg inline-flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="btn btn-secondary text-lg inline-flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
