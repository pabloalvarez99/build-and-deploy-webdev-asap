'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Store, Clock, Copy, CheckCircle, MessageCircle, Star } from 'lucide-react';
import { Suspense, useState } from 'react';
import { formatPrice } from '@/lib/format';
import { useAuthStore } from '@/store/auth';
import { calcPoints } from '@/lib/loyalty-utils';

const WHATSAPP_NUMBER = '56993649604';

function ReservationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const code = searchParams.get('code');
  const expires = searchParams.get('expires');
  const total = searchParams.get('total');
  const paidWithWebpay = searchParams.get('paid') === 'webpay';
  const [copied, setCopied] = useState(false);
  const { user } = useAuthStore();

  const pointsToEarn = user && total ? calcPoints(Number(total)) : 0;

  const whatsappMessage = encodeURIComponent(
    `Hola! Quisiera confirmar mi reserva en Tu Farmacia.\n\n` +
    `Código de retiro: *${code}*\n` +
    (orderId ? `N° de orden: ${orderId.substring(0, 8)}\n` : '') +
    (total ? `Total a pagar: ${formatPrice(total)}\n` : '') +
    `\nQuedo a la espera de la confirmación. Gracias!`
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
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Success header */}
      <div className="text-center mb-6">
        <div className="bg-emerald-100 dark:bg-emerald-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          {paidWithWebpay ? '¡Pago confirmado!' : 'Reserva creada'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Confirma por WhatsApp para que preparen tu pedido
        </p>
      </div>

      {/* Pickup Code - Extra large */}
      {code && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 mb-5 text-center">
          <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-2 text-lg">
            Tu código de retiro
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-3xl sm:text-5xl font-mono font-black tracking-widest sm:tracking-[0.3em] text-emerald-800 dark:text-emerald-300">
              {code}
            </span>
            <button
              onClick={handleCopy}
              className="p-3 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
              title="Copiar código"
            >
              {copied ? (
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              ) : (
                <Copy className="w-6 h-6 text-emerald-600" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Order info - compact */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5 mb-5 space-y-3">
        {total && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Total a pagar en tienda</span>
            <span className="font-bold text-xl text-slate-900 dark:text-slate-100">{formatPrice(total)}</span>
          </div>
        )}
        {formattedExpires && (
          <div className="flex justify-between items-start gap-2">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Válida hasta
            </span>
            <span className="text-slate-900 dark:text-slate-100 text-right">{formattedExpires}</span>
          </div>
        )}
      </div>

      {/* Loyalty points preview */}
      {pointsToEarn > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-5 mb-5 flex items-center gap-4">
          <div className="bg-amber-100 dark:bg-amber-800/50 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0">
            <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
          </div>
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-300 text-lg">
              Ganarás {pointsToEarn} punto{pointsToEarn !== 1 ? 's' : ''}
            </p>
            <p className="text-amber-700 dark:text-amber-400 text-sm mt-0.5">
              Se acreditarán cuando retires tu pedido
            </p>
          </div>
        </div>
      )}

      {/* Steps - simple and big */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-5">
        <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-3 text-lg">Pasos para retirar</h3>
        <ol className="text-blue-800 dark:text-blue-300 space-y-3 text-base">
          <li className="flex gap-3">
            <span className="bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-200 w-7 h-7 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
            <span>Confirma tu reserva por <strong>WhatsApp</strong> (botón abajo)</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-200 w-7 h-7 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
            <span>La farmacia prepara tu pedido y te avisa</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-200 w-7 h-7 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
            <span>Retira y paga en tienda (efectivo, tarjeta o transferencia)</span>
          </li>
        </ol>
      </div>

      {/* WhatsApp CTA - prominent */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full min-h-[64px] rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-lg transition-colors shadow-lg"
      >
        <MessageCircle className="w-7 h-7" />
        Confirmar por WhatsApp
      </a>

      <Link
        href="/"
        className="btn btn-secondary block text-center text-lg w-full min-h-[56px] mt-3"
      >
        Seguir comprando
      </Link>
      {orderId && !user && (
        <Link
          href={`/rastrear-pedido?id=${orderId.substring(0, 8)}`}
          className="block text-center text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium text-sm py-2 mt-1"
        >
          Rastrear el estado de este pedido →
        </Link>
      )}
    </div>
  );
}

export default function ReservationPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-lg text-slate-400 dark:text-slate-500">Cargando...</div>}>
      <ReservationContent />
    </Suspense>
  );
}
