import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, Package, Store, Truck, X, AlertCircle, MessageCircle } from 'lucide-react';
import { getDb } from '@/lib/db';
import { statusToTimeline, TimelineStep } from '@/lib/tracking';
import { formatPrice } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Seguimiento de pedido · Tu Farmacia',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: { token: string };
}

const STEP_ICON: Record<TimelineStep['key'], typeof Check> = {
  placed: Package,
  paid: Check,
  preparing: Clock,
  ready: Store,
  delivered: Truck,
};

export default async function SeguimientoPage({ params }: PageProps) {
  const { token } = params;
  if (!token || !/^[a-f0-9]{32,64}$/i.test(token)) notFound();

  const db = await getDb();
  const order = await db.orders.findUnique({
    where: { tracking_token: token },
    select: {
      id: true,
      status: true,
      total: true,
      payment_provider: true,
      pickup_code: true,
      reservation_expires_at: true,
      created_at: true,
      updated_at: true,
      guest_name: true,
      order_items: { select: { product_name: true, quantity: true, price_at_purchase: true } },
    },
  });

  if (!order) notFound();

  const timeline = statusToTimeline(order.status, order.payment_provider);
  const isCancelled = order.status === 'cancelled' || order.status === 'rejected';
  const isReady = order.status === 'approved' || order.status === 'ready';
  const isDelivered = order.status === 'completed' || order.status === 'delivered';
  const shortId = order.id.substring(0, 8).toUpperCase();
  const created = new Date(order.created_at).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' });
  const expires = order.reservation_expires_at
    ? new Date(order.reservation_expires_at).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' })
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-sm text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">← Volver a Tu Farmacia</Link>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">Seguimiento de pedido</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pedido <span className="font-mono font-bold text-slate-700 dark:text-slate-200">#{shortId}</span> · {created}
          </p>
          {order.guest_name && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              A nombre de <strong className="text-slate-700 dark:text-slate-200">{order.guest_name}</strong>
            </p>
          )}
        </div>

        {/* Status banner */}
        {isCancelled ? (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <X className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-900 dark:text-red-300">Pedido cancelado</p>
                <p className="text-sm text-red-700 dark:text-red-400">No se realizó cargo ni se descontó stock.</p>
              </div>
            </div>
          </div>
        ) : isReady ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <Store className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-emerald-900 dark:text-emerald-300 text-lg">¡Listo para retirar!</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-3">Acércate a la farmacia con tu código de retiro.</p>
                {order.pickup_code && (
                  <div className="bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl px-4 py-3 inline-block">
                    <p className="text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-semibold">Código retiro</p>
                    <p className="font-mono font-black text-3xl tracking-[0.3em] text-emerald-700 dark:text-emerald-400">{order.pickup_code}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : isDelivered ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 mb-6 flex items-center gap-3">
            <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <p className="font-bold text-emerald-900 dark:text-emerald-300">Pedido entregado. Gracias por tu compra.</p>
          </div>
        ) : (
          <div className="bg-cyan-50 dark:bg-cyan-900/20 border-2 border-cyan-200 dark:border-cyan-800 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-cyan-900 dark:text-cyan-300">Estamos preparando tu pedido</p>
                <p className="text-sm text-cyan-700 dark:text-cyan-400">Te avisaremos por correo cuando esté listo para retirar.</p>
                {order.pickup_code && (
                  <p className="text-sm text-cyan-700 dark:text-cyan-400 mt-2">
                    Código: <span className="font-mono font-bold">{order.pickup_code}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Estado</h2>
          <ol className="space-y-4">
            {timeline.map((step) => {
              const Icon = STEP_ICON[step.key];
              const dotClass =
                step.state === 'done'
                  ? 'bg-emerald-500 text-white'
                  : step.state === 'active'
                  ? 'bg-cyan-500 text-white ring-4 ring-cyan-200 dark:ring-cyan-900/50'
                  : step.state === 'cancelled'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-400 dark:text-red-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600';
              const labelClass =
                step.state === 'done' || step.state === 'active'
                  ? 'text-slate-900 dark:text-slate-100 font-semibold'
                  : 'text-slate-400 dark:text-slate-500';
              return (
                <li key={step.key} className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition ${dotClass}`} aria-hidden>
                    {step.state === 'done' ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </span>
                  <span className={`text-base ${labelClass}`}>{step.label}</span>
                  {step.state === 'active' && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 font-bold">Actual</span>
                  )}
                </li>
              );
            })}
          </ol>
          {expires && !isCancelled && !isDelivered && (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Reserva válida hasta {expires}
            </p>
          )}
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Productos</h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {order.order_items.map((item, i) => (
              <li key={i} className="flex items-center justify-between py-2.5 gap-3">
                <span className="text-sm text-slate-700 dark:text-slate-200 flex-1 min-w-0 truncate">
                  {item.product_name} <span className="text-slate-400">×{item.quantity}</span>
                </span>
                <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 flex-shrink-0">
                  {formatPrice(Number(item.price_at_purchase) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-200">Total</span>
            <span className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-400">{formatPrice(order.total.toString())}</span>
          </div>
        </div>

        {/* Help */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">¿Tienes alguna duda sobre tu pedido?</p>
          <a
            href={`https://wa.me/56993649604?text=${encodeURIComponent(`Hola! Consulta sobre mi pedido #${shortId}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#1ebe5d] transition-colors min-h-[48px]"
          >
            <MessageCircle className="w-4 h-4" />
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
