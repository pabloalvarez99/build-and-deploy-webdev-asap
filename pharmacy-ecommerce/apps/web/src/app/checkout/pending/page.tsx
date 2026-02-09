'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Clock, Mail } from 'lucide-react';
import { Suspense } from 'react';

function CheckoutPendingContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Clock className="w-10 h-10 text-yellow-600" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Pago en proceso
      </h1>

      <p className="text-gray-600 mb-2">
        Tu pago esta siendo procesado. Esto puede tardar unos minutos.
      </p>

      {orderId && (
        <p className="text-gray-500 mb-4">
          Numero de orden: <span className="font-mono font-medium text-gray-700">{orderId.slice(0, 8)}</span>
        </p>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
        <div className="flex items-center justify-center gap-2 text-blue-700 mb-1">
          <Mail className="w-5 h-5" />
          <span className="text-sm font-medium">Te notificaremos por email</span>
        </div>
        <p className="text-xs text-blue-600">
          Cuando el pago sea confirmado, recibiras un email de MercadoPago con el comprobante
        </p>
      </div>

      <div className="space-y-3">
        <Link href="/" className="block w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-center">
          Seguir comprando
        </Link>
        <Link href="/mis-pedidos" className="block w-full bg-white text-gray-700 py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium text-center">
          Ver mis pedidos
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutPendingPage() {
  return (
    <Suspense fallback={<div className="text-center py-16">Cargando...</div>}>
      <CheckoutPendingContent />
    </Suspense>
  );
}
