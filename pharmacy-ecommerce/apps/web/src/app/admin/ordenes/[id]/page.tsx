'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { orderApi, OrderWithItems } from '@/lib/api';
import { ArrowLeft, Package, MapPin, FileText, User, Mail, Printer, Check, Clock, Truck, CheckCircle, XCircle, Store, Phone, Calendar } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const statusOptions = [
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'reserved', label: 'Reservado', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'paid', label: 'Pagado', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'processing', label: 'Procesando', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'shipped', label: 'Enviado', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'delivered', label: 'Entregado', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
];

const statusFlow = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
const reservationFlow = ['reserved', 'paid', 'delivered'];

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-5 h-5" />,
  reserved: <Store className="w-5 h-5" />,
  paid: <Check className="w-5 h-5" />,
  processing: <Package className="w-5 h-5" />,
  shipped: <Truck className="w-5 h-5" />,
  delivered: <CheckCircle className="w-5 h-5" />,
  cancelled: <XCircle className="w-5 h-5" />,
};

function OrderTimeline({ currentStatus, isReservation }: { currentStatus: string; isReservation: boolean }) {
  const isCancelled = currentStatus === 'cancelled';
  const flow = isReservation ? reservationFlow : statusFlow;
  const currentIndex = flow.indexOf(currentStatus);

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        {isReservation ? 'Estado de la Reserva' : 'Estado del Pedido'}
      </h2>

      {isCancelled ? (
        <div className="flex items-center justify-center gap-3 py-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <XCircle className="w-6 h-6 text-red-500" />
          <span className="text-lg font-medium text-red-700 dark:text-red-400">
            {isReservation ? 'Reserva Cancelada' : 'Orden Cancelada'}
          </span>
        </div>
      ) : (
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 dark:bg-slate-700 rounded">
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
              const statusInfo = statusOptions.find((s) => s.value === status);

              return (
                <div key={status} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                    } ${isCurrent ? 'ring-4 ring-emerald-200 dark:ring-emerald-900' : ''}`}
                  >
                    {statusIcons[status]}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'
                    }`}
                  >
                    {statusInfo?.label}
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

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { user, token } = useAuthStore();

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) {
      router.push('/');
      return;
    }
    loadOrder();
  }, [token, user, router, orderId]);

  const loadOrder = async () => {
    if (!token) return;

    try {
      const data = await orderApi.get(token, orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!token || !order) return;

    try {
      await orderApi.updateStatus(token, order.id, newStatus);
      loadOrder();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-32" />
          <div className="card p-6 space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
            <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Orden no encontrada</h1>
        <Link href="/admin/ordenes" className="btn btn-primary">
          Volver a ordenes
        </Link>
      </div>
    );
  }

  const currentStatus = statusOptions.find((s) => s.value === order.status);
  const total = parseFloat(order.total);
  const date = new Date(order.created_at).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orden #{order.id.slice(0, 8)}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{date}</p>
        </div>

        <select
          value={order.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`px-4 py-2 rounded-lg font-medium ${currentStatus?.color || 'bg-gray-100'}`}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status Timeline */}
      <OrderTimeline currentStatus={order.status} isReservation={order.payment_provider === 'store'} />

      {/* Store Pickup Info */}
      {order.payment_provider === 'store' && (order.pickup_code || order.reservation_expires_at) && (
        <div className="card p-6 mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3 mb-4">
            <Store className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-orange-800 dark:text-orange-300">
              Informacion de Retiro en Tienda
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {order.pickup_code && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Codigo de Retiro</p>
                <p className="text-3xl font-mono font-bold text-orange-600 dark:text-orange-400 tracking-widest">
                  {order.pickup_code}
                </p>
              </div>
            )}
            {order.reservation_expires_at && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Valido Hasta</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(order.reservation_expires_at).toLocaleDateString('es-CL', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {new Date(order.reservation_expires_at) < new Date() && order.status === 'reserved' && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                    Reserva expirada
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Productos</h2>
            </div>
            <div className="space-y-3">
              {order.items.map((item) => {
                const price = parseFloat(item.price_at_purchase);
                const subtotal = price * item.quantity;

                return (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-700 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatPrice(price)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatPrice(subtotal)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Info */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cliente</h2>
              {!order.user_id && (order.guest_name || order.guest_email) && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium rounded-full">
                  Invitado
                </span>
              )}
            </div>
            <div className="space-y-3">
              {(order.guest_name || order.guest_surname) && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {order.guest_name} {order.guest_surname}
                  </span>
                </div>
              )}
              {order.guest_email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${order.guest_email}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">
                    {order.guest_email}
                  </a>
                </div>
              )}
              {order.customer_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${order.customer_phone}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">
                    {order.customer_phone}
                  </a>
                </div>
              )}
              {order.user_id && (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  ID Usuario: <span className="font-mono">{order.user_id.slice(0, 8)}...</span>
                </p>
              )}
              {!order.user_id && !order.guest_name && !order.guest_email && (
                <p className="text-gray-500 dark:text-gray-400 italic">Sin informacion de cliente</p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Direccion de envio
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{order.shipping_address}</p>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notas</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumen</h2>
              <button
                onClick={() => window.print()}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                title="Imprimir orden"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 border-b border-gray-100 dark:border-slate-700 pb-4 mb-4">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal ({order.items.length} productos)</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Envio</span>
                <span className="text-green-600 dark:text-green-400">Gratis</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white mb-6">
              <span>Total</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(total)}</span>
            </div>

            {/* Payment Info */}
            {order.mercadopago_preference_id && (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 text-xs space-y-2 mb-6">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Info de Pago</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Preference ID:</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">{order.mercadopago_preference_id.slice(0, 12)}...</span>
                </div>
                {order.mercadopago_payment_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Payment ID:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">{order.mercadopago_payment_id}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-4 border-t border-gray-100 dark:border-slate-700 space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">Acciones rapidas</p>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    disabled={order.status === opt.value}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      order.status === opt.value
                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                        : `${opt.color} hover:opacity-80`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
