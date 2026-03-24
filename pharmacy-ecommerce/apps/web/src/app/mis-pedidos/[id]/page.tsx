'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { orderApi, OrderWithItems } from '@/lib/api';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, MapPin, Store, Printer, MessageCircle, Check } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-5 h-5" /> },
  reserved: { label: 'Reservado', color: 'bg-amber-100 text-amber-800', icon: <Store className="w-5 h-5" /> },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-5 h-5" /> },
  processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-800', icon: <Package className="w-5 h-5" /> },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800', icon: <Truck className="w-5 h-5" /> },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-5 h-5" /> },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-5 h-5" /> },
};

// Delivery flow
const deliveryFlow = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
// Store pickup flow (no "shipped")
const pickupFlow = ['reserved', 'processing', 'delivered'];

const pickupLabels: Record<string, string> = {
  reserved: 'Reservado',
  processing: 'Preparando',
  delivered: 'Retirado',
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

function OrderTimeline({ currentStatus, isPickup }: { currentStatus: string; isPickup: boolean }) {
  const isCancelled = currentStatus === 'cancelled';
  const flow = isPickup ? pickupFlow : deliveryFlow;
  const currentIndex = flow.indexOf(currentStatus);

  return (
    <div className="card p-5 sm:p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Estado del pedido</h2>

      {isCancelled ? (
        <div className="flex items-center justify-center gap-3 py-4 bg-red-50 rounded-xl">
          <XCircle className="w-6 h-6 text-red-500" />
          <span className="text-lg font-medium text-red-700">Orden cancelada</span>
        </div>
      ) : (
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute top-4 sm:top-5 left-0 right-0 h-1 bg-slate-200 rounded">
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
              const label = isPickup
                ? (pickupLabels[status] ?? statusConfig[status]?.label)
                : statusConfig[status]?.label;

              return (
                <div key={status} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-emerald-200' : ''}`}
                  >
                    {statusIcons[status]}
                  </div>
                  <span
                    className={`mt-2 text-[11px] sm:text-xs font-medium text-center ${
                      isCompleted ? 'text-emerald-600' : 'text-slate-400'
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
          <div className="h-8 bg-slate-200 rounded w-32" />
          <div className="card p-6 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-24 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Pedido no encontrado</h1>
        <Link href="/mis-pedidos" className="btn btn-primary">
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  const isStorePickup = order.payment_provider === 'store';
  let status = statusConfig[order.status] || statusConfig.pending;

  if (isStorePickup && order.status === 'reserved') {
    status = { label: 'Pendiente aprobación', color: 'bg-amber-100 text-amber-800', icon: <Clock className="w-5 h-5" /> };
  } else if (isStorePickup && order.status === 'processing') {
    status = { label: 'Aprobado - Listo para retiro', color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-5 h-5" /> };
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
        className="inline-flex items-center text-slate-600 hover:text-emerald-600 mb-6 min-h-[48px]"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Volver a mis pedidos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Pedido #{order.id.slice(0, 8)}
          </h1>
          <p className="text-slate-500 mt-1">{date}</p>
        </div>
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${status.color}`}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Status Timeline */}
      <OrderTimeline currentStatus={order.status} isPickup={isStorePickup} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="card p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Productos</h2>
            <div className="space-y-4">
              {order.items.map((item) => {
                const price = parseFloat(item.price_at_purchase);
                const subtotal = price * item.quantity;

                return (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-medium text-slate-900">{item.product_name}</p>
                      <p className="text-base text-slate-500">
                        {formatPrice(price)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
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
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Dirección de envío
                </h2>
              </div>
              <p className="text-slate-600">{order.shipping_address}</p>
            </div>
          )}

          {/* Store Pickup Info */}
          {isStorePickup && order.pickup_code && (
            <div className="card p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <Store className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-slate-900">Retiro en tienda</h2>
              </div>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-amber-700 font-medium mb-2">Código de retiro</p>
                <p className="text-4xl font-mono font-black tracking-[0.3em] text-amber-900">{order.pickup_code}</p>
              </div>
              {order.status === 'reserved' && (
                <p className="text-amber-700 text-center mt-3">Tu reserva está pendiente de aprobación por la farmacia.</p>
              )}
              {order.status === 'processing' && (
                <p className="text-emerald-700 text-center mt-3 font-medium">Reserva aprobada. Acércate a la farmacia para retirar y pagar.</p>
              )}
              {order.reservation_expires_at && order.status === 'reserved' && (
                <p className="text-sm text-amber-600 text-center mt-2">
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
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Notas
              </h2>
              <p className="text-slate-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sm:p-6 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Resumen</h2>
              <button
                onClick={() => window.print()}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Imprimir pedido"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 border-b border-slate-100 pb-4 mb-4">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({order.items.length} {order.items.length === 1 ? 'producto' : 'productos'})</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isStorePickup ? 'Retiro en tienda' : 'Envío'}</span>
                <span className="text-emerald-600">Gratis</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold text-slate-900 mb-6">
              <span>Total</span>
              <span className="text-emerald-600">{formatPrice(total)}</span>
            </div>

            {/* WhatsApp Support */}
            <a
              href={`https://wa.me/56993649604?text=${encodeURIComponent(`Hola, tengo una consulta sobre mi pedido #${order.id.slice(0, 8)} en Tu Farmacia`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors font-medium min-h-[48px]"
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
