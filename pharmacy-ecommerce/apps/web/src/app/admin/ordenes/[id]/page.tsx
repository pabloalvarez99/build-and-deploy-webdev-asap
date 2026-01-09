'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { orderApi, OrderWithItems } from '@/lib/api';
import { ArrowLeft, Package, MapPin, FileText, User } from 'lucide-react';

const statusOptions = [
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'paid', label: 'Pagado', color: 'bg-green-100 text-green-800' },
  { value: 'processing', label: 'Procesando', color: 'bg-blue-100 text-blue-800' },
  { value: 'shipped', label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
  { value: 'delivered', label: 'Entregado', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
];

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-32" />
          <div className="card p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Orden no encontrada</h1>
        <Link href="/admin/ordenes" className="btn btn-primary">
          Volver a ordenes
        </Link>
      </div>
    );
  }

  const currentStatus = statusOptions.find((s) => s.value === order.status);
  const total = parseFloat(order.total);
  const date = new Date(order.created_at).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/admin/ordenes"
        className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Volver a ordenes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Orden #{order.id.slice(0, 8)}
          </h1>
          <p className="text-gray-500 mt-1">{date}</p>
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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
            </div>
            <div className="space-y-4">
              {order.items.map((item) => {
                const price = parseFloat(item.price_at_purchase);
                const subtotal = price * item.quantity;

                return (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-500">
                        ${price.toFixed(2)} x {item.quantity}
                      </p>
                      {item.product_id && (
                        <p className="text-xs text-gray-400 mt-1">
                          ID: {item.product_id.slice(0, 8)}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900">
                      ${subtotal.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Info */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Cliente</h2>
            </div>
            <p className="text-gray-600">
              {order.user_id ? `ID: ${order.user_id.slice(0, 8)}...` : 'Usuario eliminado'}
            </p>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Direccion de envio
                </h2>
              </div>
              <p className="text-gray-600">{order.shipping_address}</p>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Notas</h2>
              </div>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>

            <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Envio</span>
                <span className="text-green-600">Gratis</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold text-gray-900 mb-6">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {order.mercadopago_preference_id && (
              <div className="text-xs text-gray-500 space-y-1">
                <p>Preference ID: {order.mercadopago_preference_id}</p>
                {order.mercadopago_payment_id && (
                  <p>Payment ID: {order.mercadopago_payment_id}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
