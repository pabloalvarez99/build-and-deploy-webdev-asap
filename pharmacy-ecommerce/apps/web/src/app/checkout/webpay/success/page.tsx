'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Printer, Star } from 'lucide-react';
import { Suspense, useEffect } from 'react';
import { formatPrice } from '@/lib/format';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { calcPoints } from '@/lib/loyalty-utils';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const total = searchParams.get('total');
  const name = searchParams.get('name');
  const token = searchParams.get('token');
  const { clearCart } = useCartStore();
  const { user } = useAuthStore();

  const pointsEarned = user && total ? calcPoints(Number(total)) : 0;

  // Clear cart now that payment is confirmed
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center mb-8">
        <div className="bg-emerald-100 dark:bg-emerald-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          ¡Pago exitoso!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Tu compra fue procesada correctamente
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5 mb-5 space-y-4">
        {name && (
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Cliente</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{name}</span>
          </div>
        )}
        {orderId && (
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">N° de orden</span>
            <span className="font-mono text-slate-900 dark:text-slate-100 text-sm">{orderId.substring(0, 8)}...</span>
          </div>
        )}
        {total && (
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Total pagado</span>
            <span className="font-bold text-lg text-emerald-700 dark:text-emerald-400">{formatPrice(total)}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400">Método de pago</span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            Webpay Plus
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400">Estado</span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            Pagado
          </span>
        </div>
      </div>

      {pointsEarned > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-5 mb-5 flex items-center gap-4">
          <div className="bg-amber-100 dark:bg-amber-800/50 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0">
            <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
          </div>
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-300 text-lg">
              ¡Ganaste {pointsEarned} punto{pointsEarned !== 1 ? 's' : ''}!
            </p>
            <p className="text-amber-700 dark:text-amber-400 text-sm mt-0.5">
              Se sumaron a tu cuenta de fidelización
            </p>
          </div>
        </div>
      )}

      {token && (
        <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-2xl p-5 mb-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Token Transbank (para validación)</p>
          <p className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all">{token}</p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-8">
        <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 text-lg">¿Qué sigue?</h3>
        <ol className="text-blue-800 dark:text-blue-400 space-y-2 list-decimal list-inside">
          <li>Recibirás un email de confirmación</li>
          <li>Prepararemos tu pedido</li>
          <li>Te avisaremos cuando esté listo para retirar</li>
        </ol>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => window.print()}
          className="btn btn-secondary w-full text-lg flex items-center justify-center gap-2"
        >
          <Printer className="w-5 h-5" />
          Imprimir comprobante
        </button>
        <Link href="/" className="btn btn-primary block text-center text-lg w-full min-h-[56px]">
          Seguir comprando
        </Link>
        {orderId && (
          <Link href="/mis-pedidos" className="block text-center text-emerald-600 dark:text-emerald-400 font-semibold hover:underline text-base py-2">
            Ver mis pedidos
          </Link>
        )}
      </div>
    </div>
  );
}

export default function WebpaySuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-lg text-slate-400 dark:text-slate-500">Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
