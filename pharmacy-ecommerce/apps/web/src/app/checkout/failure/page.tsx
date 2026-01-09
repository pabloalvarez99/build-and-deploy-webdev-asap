'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function CheckoutFailurePage() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-10 h-10 text-red-600" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Pago fallido
      </h1>

      <p className="text-gray-600 mb-8">
        Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.
      </p>

      <div className="space-y-4">
        <Link href="/carrito" className="btn btn-primary block">
          Volver al carrito
        </Link>
        <Link href="/" className="btn btn-secondary block">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
