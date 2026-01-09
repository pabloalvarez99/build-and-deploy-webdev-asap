'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Suspense } from 'react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Pago exitoso!
      </h1>

      <p className="text-gray-600 mb-2">
        Gracias por tu compra. Tu pedido ha sido procesado correctamente.
      </p>

      {orderId && (
        <p className="text-gray-500 mb-8">
          Numero de orden: <span className="font-mono font-medium">{orderId}</span>
        </p>
      )}

      <div className="space-y-4">
        <Link href="/mis-pedidos" className="btn btn-primary block">
          Ver mis pedidos
        </Link>
        <Link href="/" className="btn btn-secondary block">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-16">Cargando...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
