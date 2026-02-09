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

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Pago no completado
      </h1>

      <p className="text-gray-600 mb-2">
        Tu pago no pudo ser procesado. No se ha realizado ningun cargo.
      </p>

      {orderId && (
        <p className="text-gray-500 mb-4">
          Referencia: <span className="font-mono font-medium text-gray-700">{orderId.slice(0, 8)}</span>
        </p>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
        <p className="text-sm text-amber-800 font-medium mb-1">Posibles causas:</p>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>Fondos insuficientes en la tarjeta</li>
          <li>Datos de pago incorrectos</li>
          <li>El pago fue cancelado manualmente</li>
        </ul>
      </div>

      <div className="space-y-3">
        <Link href="/" className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
          <RefreshCw className="w-4 h-4" />
          Volver a intentar
        </Link>
        <a
          href="https://wa.me/56912345678?text=Hola%2C%20tuve%20un%20problema%20con%20mi%20pago"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-white text-gray-700 py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
        >
          <MessageCircle className="w-4 h-4" />
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
