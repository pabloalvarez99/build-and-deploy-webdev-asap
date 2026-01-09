'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { orderApi, PaginatedOrders } from '@/lib/api';
import { Package, ChevronRight, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-800', icon: <Package className="w-4 h-4" /> },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
};

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [orders, setOrders] = useState<PaginatedOrders | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    loadOrders();
  }, [token, router, currentPage]);

  const loadOrders = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await orderApi.list(token, { page: currentPage, limit: 10 });
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !token) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis Pedidos</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-32" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
                <div className="h-8 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : !orders || orders.orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No tienes pedidos
          </h2>
          <p className="text-gray-500 mb-6">
            Cuando realices una compra, aparecera aqui
          </p>
          <Link href="/" className="btn btn-primary">
            Explorar productos
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const total = parseFloat(order.total);
              const date = new Date(order.created_at).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <Link
                  key={order.id}
                  href={`/mis-pedidos/${order.id}`}
                  className="card p-6 hover:shadow-md transition-shadow block"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Pedido #{order.id.slice(0, 8)}</p>
                      <p className="font-semibold text-gray-900 mt-1">${total.toFixed(2)}</p>
                      <p className="text-sm text-gray-500 mt-1">{date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {orders.total_pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-gray-600">
                Pagina {currentPage} de {orders.total_pages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(orders.total_pages, p + 1))}
                disabled={currentPage === orders.total_pages}
                className="btn btn-secondary disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
