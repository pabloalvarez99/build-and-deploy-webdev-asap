'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Error en el panel</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Ocurrio un error al cargar esta seccion. Intenta nuevamente.
        </p>
        <button
          onClick={reset}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Reintentar
        </button>
      </div>
    </div>
  );
}
