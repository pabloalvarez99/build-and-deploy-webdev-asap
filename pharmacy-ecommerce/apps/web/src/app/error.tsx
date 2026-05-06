'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Page error:', error);
    }
  }, [error]);

  const supportText = `Hola! Tuve un error en el sitio${error.digest ? ` (ref: ${error.digest})` : ''}.`;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <div className="text-center max-w-md" role="alert" aria-live="assertive">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">Algo salió mal</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-2">
          Ocurrió un error inesperado. Por favor intenta nuevamente.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-slate-400 dark:text-slate-600 mb-6 select-all">
            ref: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button
            onClick={reset}
            className="btn btn-primary text-lg inline-flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="btn btn-outline text-lg inline-flex items-center gap-2"
          >
            <Home className="w-5 h-5" aria-hidden="true" />
            Ir al inicio
          </Link>
          <a
            href={`https://wa.me/56993649604?text=${encodeURIComponent(supportText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn text-lg inline-flex items-center gap-2 bg-[#25D366] text-white hover:bg-[#1ebe5d]"
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
            Soporte
          </a>
        </div>
      </div>
    </div>
  );
}
