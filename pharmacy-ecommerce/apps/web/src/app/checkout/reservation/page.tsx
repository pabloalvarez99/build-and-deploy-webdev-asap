'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Store, Clock, Copy, CheckCircle, Printer, MessageCircle } from 'lucide-react';
import { Suspense, useState } from 'react';
import { formatPrice } from '@/lib/format';

const WHATSAPP_NUMBER = '56993649604';

function ReservationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const code = searchParams.get('code');
  const expires = searchParams.get('expires');
  const total = searchParams.get('total');
  const [copied, setCopied] = useState(false);

  const whatsappMessage = encodeURIComponent(
    `¡Hola! Quisiera confirmar mi reserva en Tu Farmacia.\n\n` +
    `📋 Código de retiro: *${code}*\n` +
    (orderId ? `🔖 N° de orden: ${orderId.substring(0, 8)}\n` : '') +
    (total ? `💰 Total a pagar: ${formatPrice(total)}\n` : '') +
    `\nQuedo a la espera de la confirmación. ¡Gracias!`
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

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
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center mb-8">
        <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
          <Store className="w-10 h-10 text-emerald-600" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Reserva confirmada
        </h1>
        <p className="text-slate-500 text-lg">
          Tu pedido ha sido reservado exitosamente
        </p>
      </div>

      {/* Pickup Code - Extra large for elderly */}
      {code && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 mb-5 text-center">
          <p className="font-semibold text-emerald-700 mb-3">
            Código de retiro
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-mono font-black tracking-[0.3em] text-emerald-800">
              {code}
            </span>
            <button
              onClick={handleCopy}
              className="p-3 rounded-xl hover:bg-emerald-100 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
              title="Copiar código"
            >
              {copied ? (
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              ) : (
                <Copy className="w-6 h-6 text-emerald-600" />
              )}
            </button>
          </div>
          <p className="text-emerald-600 mt-3">
            Presenta este código al retirar tu pedido
          </p>
        </div>
      )}

      {/* Order Details */}
      <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 mb-5 space-y-4">
        {orderId && (
          <div className="flex justify-between">
            <span className="text-slate-500">N° de orden</span>
            <span className="font-mono text-slate-900 text-sm">{orderId.substring(0, 8)}...</span>
          </div>
        )}
        {total && (
          <div className="flex justify-between">
            <span className="text-slate-500">Total a pagar en tienda</span>
            <span className="font-bold text-lg text-slate-900">{formatPrice(total)}</span>
          </div>
        )}
        {formattedExpires && (
          <div className="flex justify-between">
            <span className="text-slate-500">Válida hasta</span>
            <span className="text-slate-900">{formattedExpires}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Estado</span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-4 h-4" />
            Pendiente de aprobación
          </span>
        </div>
      </div>

      {/* Approval notice */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-5">
        <p className="text-amber-800 font-medium text-center">
          Tu reserva será revisada por la farmacia. Te confirmaremos a la brevedad.
        </p>
      </div>

      {/* Instructions - Larger text */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 mb-8">
        <h3 className="font-bold text-blue-900 mb-3 text-lg">Instrucciones de retiro</h3>
        <ol className="text-blue-800 space-y-3 list-decimal list-inside">
          <li>Espera la confirmación de la farmacia</li>
          <li>Acércate a la farmacia dentro de las próximas <strong>24 horas</strong></li>
          <li>Indica tu código de retiro <strong>{code}</strong> al personal</li>
          <li>Realiza el pago en tienda (efectivo, tarjeta o transferencia)</li>
          <li>Retira tus productos</li>
        </ol>
      </div>

      <div className="space-y-3">
        {/* WhatsApp - Primary CTA */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full min-h-[56px] rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-lg transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
          Confirmar reserva por WhatsApp
        </a>

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
      </div>
    </div>
  );
}

export default function ReservationPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-lg text-slate-400">Cargando...</div>}>
      <ReservationContent />
    </Suspense>
  );
}
