'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Store, Clock, Copy, CheckCircle } from 'lucide-react';
import { Suspense, useState } from 'react';
import { formatPrice } from '@/lib/format';

function ReservationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const code = searchParams.get('code');
  const expires = searchParams.get('expires');
  const total = searchParams.get('total');
  const [copied, setCopied] = useState(false);

  const expiresDate = expires ? new Date(expires) : null;
  const formattedExpires = expiresDate
    ? expiresDate.toLocaleDateString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-8">
        <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Store className="w-10 h-10 text-emerald-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reserva confirmada
        </h1>
        <p className="text-gray-600">
          Tu pedido ha sido reservado exitosamente
        </p>
      </div>

      {/* Pickup Code */}
      {code && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-6 text-center">
          <p className="text-sm font-medium text-emerald-700 mb-2">
            Codigo de retiro
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-mono font-bold tracking-[0.3em] text-emerald-800">
              {code}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-emerald-100 transition-colors"
              title="Copiar codigo"
            >
              {copied ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <Copy className="w-5 h-5 text-emerald-600" />
              )}
            </button>
          </div>
          <p className="text-xs text-emerald-600 mt-2">
            Presenta este codigo al retirar tu pedido
          </p>
        </div>
      )}

      {/* Order Details */}
      <div className="card p-6 mb-6 space-y-4">
        {orderId && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">N de orden</span>
            <span className="font-mono text-gray-900 text-xs">{orderId}</span>
          </div>
        )}
        {total && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total a pagar en tienda</span>
            <span className="font-semibold text-gray-900">{formatPrice(total)}</span>
          </div>
        )}
        {formattedExpires && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Valida hasta</span>
            <span className="text-gray-900">{formattedExpires}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Estado</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            Pendiente de retiro
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
        <h3 className="font-semibold text-blue-900 mb-3">Instrucciones de retiro</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Acercate a la farmacia dentro de las proximas 48 horas</li>
          <li>Indica tu codigo de retiro <strong>{code}</strong> al personal</li>
          <li>Realiza el pago en tienda (efectivo, tarjeta o transferencia)</li>
          <li>Retira tus productos</li>
        </ol>
      </div>

      <div className="space-y-4">
        <Link href="/" className="btn btn-primary block text-center">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}

export default function ReservationPage() {
  return (
    <Suspense fallback={<div className="text-center py-16">Cargando...</div>}>
      <ReservationContent />
    </Suspense>
  );
}
