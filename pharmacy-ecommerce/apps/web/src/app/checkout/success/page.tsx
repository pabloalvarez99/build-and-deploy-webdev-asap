'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ShieldCheck } from 'lucide-react';
import { Suspense } from 'react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-emerald-600" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Pago exitoso
      </h1>

      <p className="text-slate-600 mb-2">
        Gracias por tu compra. Tu pedido ha sido procesado correctamente.
      </p>

      {orderId && (
        <p className="text-slate-500 mb-4">
          Número de orden: <span className="font-mono font-bold text-slate-700">{orderId.slice(0, 8)}</span>
        </p>
      )}

      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 mb-8">
        <div className="flex items-center justify-center gap-2 text-emerald-700">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-base font-medium">Tu pago fue confirmado por MercadoPago</span>
        </div>
        <p className="text-sm text-emerald-600 mt-1">
          Recibirás la confirmación en tu email
        </p>
      </div>

      <div className="space-y-3">
        <Link href="/" className="flex items-center justify-center w-full bg-emerald-600 text-white py-4 px-4 rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-lg min-h-[56px]">
          Seguir comprando
        </Link>
        <Link href="/mis-pedidos" className="flex items-center justify-center w-full bg-white text-slate-700 py-4 px-4 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 transition-colors font-bold text-lg min-h-[56px]">
          Ver mis pedidos
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
