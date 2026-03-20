'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle, RefreshCw, MessageCircle } from 'lucide-react';
import { Suspense } from 'react';

function CheckoutFailureContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-10 h-10 text-red-600" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Pago no completado
      </h1>

      <p className="text-slate-600 mb-2">
        Tu pago no pudo ser procesado. No se ha realizado ningún cargo.
      </p>

      {orderId && (
        <p className="text-slate-500 mb-4">
          Referencia: <span className="font-mono font-bold text-slate-700">{orderId.slice(0, 8)}</span>
        </p>
      )}

      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-8">
        <p className="text-base text-amber-800 font-bold mb-2">Posibles causas:</p>
        <ul className="text-base text-amber-700 space-y-1">
          <li>Fondos insuficientes en la tarjeta</li>
          <li>Datos de pago incorrectos</li>
          <li>El pago fue cancelado manualmente</li>
        </ul>
      </div>

      <div className="space-y-3">
        <Link href="/" className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-4 px-4 rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-lg min-h-[56px]">
          <RefreshCw className="w-5 h-5" />
          Volver a intentar
        </Link>
        <a
          href="https://wa.me/56993649604?text=Hola%2C%20tuve%20un%20problema%20con%20mi%20pago%20en%20Tu%20Farmacia"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-white text-slate-700 py-4 px-4 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 transition-colors font-bold text-lg min-h-[56px]"
        >
          <MessageCircle className="w-5 h-5" />
          Contactar soporte
        </a>
      </div>
    </div>
  );
}

export default function CheckoutFailurePage() {
  return (
    <Suspense fallback={<div className="text-center py-16">Cargando...</div>}>
      <CheckoutFailureContent />
    </Suspense>
  );
}
