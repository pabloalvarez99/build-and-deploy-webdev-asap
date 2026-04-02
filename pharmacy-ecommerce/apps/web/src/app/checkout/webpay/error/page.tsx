'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle, RefreshCw } from 'lucide-react';
import { Suspense } from 'react';

const REASON_MESSAGES: Record<string, string> = {
  cancelled: 'Cancelaste el pago en Webpay.',
  rejected: 'Tu pago fue rechazado por el banco.',
  no_token: 'No se recibió confirmación de Webpay.',
  order_not_found: 'No se encontró la orden asociada al pago.',
  internal: 'Ocurrió un error al procesar tu pago.',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'internal';
  const message = REASON_MESSAGES[reason] || REASON_MESSAGES.internal;
  const token = searchParams.get('token');

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center mb-8">
        <div className="bg-red-100 dark:bg-red-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Pago no completado
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">{message}</p>
      </div>

      {token && (
        <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-2xl p-5 mb-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Token Transbank (para validación)</p>
          <p className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all">{token}</p>
        </div>
      )}

      <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-8">
        <p className="text-amber-800 dark:text-amber-400 font-medium text-center">
          No se realizó ningún cobro. Puedes intentar nuevamente o elegir pagar en tienda.
        </p>
      </div>

      <div className="space-y-3">
        <Link
          href="/checkout"
          className="flex items-center justify-center gap-3 w-full min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Intentar nuevamente
        </Link>
        <Link href="/carrito" className="btn btn-secondary block text-center text-lg w-full min-h-[56px]">
          Volver al carrito
        </Link>
      </div>
    </div>
  );
}

export default function WebpayErrorPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-lg text-slate-400 dark:text-slate-500">Cargando...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
