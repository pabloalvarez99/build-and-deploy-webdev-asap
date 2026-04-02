'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { orderApi, OrderWithItems } from '@/lib/api';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, MapPin, Store, Printer, MessageCircle, Check } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', icon: <Clock className="w-5 h-5" /> },
  reserved: { label: 'Reservado', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300', icon: <Store className="w-5 h-5" /> },
  paid: { label: 'Pagado', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', icon: <CheckCircle className="w-5 h-5" /> },
  processing: { label: 'Procesando', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', icon: <Package className="w-5 h-5" /> },
  shipped: { label: 'Enviado', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300', icon: <Truck className="w-5 h-5" /> },
  delivered: { label: 'Entregado', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', icon: <CheckCircle className="w-5 h-5" /> },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', icon: <XCircle className="w-5 h-5" /> },
};

// Delivery flow
const deliveryFlow = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
// Store pickup flow (no "shipped")
const pickupFlow = ['reserved', 'processing', 'delivered'];
// Webpay online payment flow
const webpayFlow = ['paid', 'processing', 'delivered'];

const pickupLabels: Record<string, string> = {
  reserved: 'Reservado',
  processing: 'Preparando',
  delivered: 'Retirado',
};

const webpayLabels: Record<string, string> = {
  paid: 'Pagado',
  processing: 'Preparando',
  delivered: 'Entregado',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />,
  reserved: <Store className="w-4 h-4 sm:w-5 sm:h-5" />,
  paid: <Check className="w-4 h-4 sm:w-5 sm:h-5" />,
  processing: <Package className="w-4 h-4 sm:w-5 sm:h-5" />,
  shipped: <Truck className="w-4 h-4 sm:w-5 sm:h-5" />,
  delivered: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
  cancelled: <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
};

function OrderTimeline({ currentStatus, isPickup, isWebpay }: { currentStatus: string; isPickup: boolean; isWebpay: boolean }) {
  const isCancelled = currentStatus === 'cancelled';
  const flow = isPickup ? pickupFlow : isWebpay ? webpayFlow : deliveryFlow;
  const currentIndex = flow.indexOf(currentStatus);

  const getLabel = (status: string) => {
    if (isPickup) return pickupLabels[status] ?? statusConfig[status]?.label;
    if (isWebpay) return webpayLabels[status] ?? statusConfig[status]?.label;
    return statusConfig[status]?.label;
  };

  return (
    <div className="card p-5 sm:p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Estado del pedido</h2>

      {isCancelled ? (
        <div className="flex items-center justify-center gap-3 py-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <XCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
          <span className="text-lg font-medium text-red-700 dark:text-red-400">Orden cancelada</span>
        </div>
      ) : (
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute top-4 sm:top-5 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 rounded">
            <div
              className="absolute h-full bg-emerald-500 rounded transition-all duration-500"
              style={{ width: `${(currentIndex / (flow.length - 1)) * 100}%` }}
            />
          </div>

          {/* Status points */}
          <div className="relative flex justify-between">
            {flow.map((status, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;
              const label = getLabel(status);

              return (
                <div key={status} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                    } ${isCurrent ? 'ring-4 ring-emerald-200 dark:ring-emerald-800' : ''}`}
                  >
                    {statusIcons[status]}
                  </div>
                  <span
                    className={`mt-2 text-[11px] sm:text-xs font-medium text-center ${
                      isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { user } = useAuthStore();

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadOrder();
  }, [user, router, orderId]);

  const loadOrder = async () => {
    try {
      const data = await orderApi.get(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          <div className="card p-6 space-y-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Pedido no encontrado</h1>
        <Link href="/mis-pedidos" className="btn btn-primary">
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  const isStorePickup = order.payment_provider === 'store';
  const isWebpay = order.payment_provider === 'webpay';
  let status = statusConfig[order.status] || statusConfig.pending;

  if (isStorePickup && order.status === 'reserved') {
    status = { label: 'Pendiente aprobación', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300', icon: <Clock className="w-5 h-5" /> };
  } else if (isStorePickup && order.status === 'processing') {
    status = { label: 'Listo para retiro', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300', icon: <CheckCircle className="w-5 h-5" /> };
  }

  const total = parseFloat(order.total);
  const date = new Date(order.created_at).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/mis-pedidos"
        className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 mb-6 min-h-[48px]"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Volver a mis pedidos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Pedido #{order.id.slice(0, 8)}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">{date}</p>
        </div>
        <span className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium flex-shrink-0 whitespace-nowrap ${status.color}`}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Status Timeline */}
      <OrderTimeline currentStatus={order.status} isPickup={isStorePickup} isWebpay={isWebpay} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="card p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Productos</h2>
            <div className="space-y-4">
              {order.items.map((item) => {
                const price = parseFloat(item.price_at_purchase);
                const subtotal = price * item.quantity;

                return (
                  <div key={item.id} className="flex justify-between items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100 leading-snug">{item.product_name}</p>
                      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatPrice(price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 flex-shrink-0">
                      {formatPrice(subtotal)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="card p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Dirección de envío
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400">{order.shipping_address}</p>
            </div>
          )}

          {/* Store Pickup Info */}
          {isStorePickup && order.pickup_code && (
            <div className="card p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <Store className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Retiro en tienda</h2>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-center">
                <p className="text-amber-700 dark:text-amber-400 font-medium mb-2">Código de retiro</p>
                <p className="text-3xl sm:text-4xl font-mono font-black tracking-widest sm:tracking-[0.3em] text-amber-900 dark:text-amber-300">{order.pickup_code}</p>
              </div>
              {order.status === 'reserved' && (
                <p className="text-amber-700 dark:text-amber-400 text-center mt-3">Tu reserva está pendiente de aprobación por la farmacia.</p>
              )}
              {order.status === 'processing' && (
                <p className="text-emerald-700 dark:text-emerald-400 text-center mt-3 font-medium">Reserva aprobada. Acércate a la farmacia para retirar y pagar.</p>
              )}
              {order.reservation_expires_at && order.status === 'reserved' && (
                <p className="text-sm text-amber-600 dark:text-amber-400 text-center mt-2">
                  Válida hasta: {new Date(order.reservation_expires_at).toLocaleDateString('es-CL', {
                    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="card p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                Notas
              </h2>
              <p className="text-slate-600 dark:text-slate-400">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sm:p-6 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Resumen</h2>
              <button
                onClick={() => window.print()}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Imprimir pedido"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal ({order.items.length} {order.items.length === 1 ? 'producto' : 'productos'})</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{isStorePickup ? 'Retiro en tienda' : isWebpay ? 'Pago Webpay' : 'Envío'}</span>
                <span className="text-emerald-600 dark:text-emerald-400">Gratis</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              <span>Total</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(total)}</span>
            </div>

            {/* WhatsApp Support */}
            <a
              href={`https://wa.me/56993649604?text=${encodeURIComponent(`Hola, tengo una consulta sobre mi pedido #${order.id.slice(0, 8)} en Tu Farmacia`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors font-medium min-h-[48px]"
            >
              <MessageCircle className="w-5 h-5" />
              ¿Consultas? Escríbenos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
