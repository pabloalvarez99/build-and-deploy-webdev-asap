'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { orderApi, PaginatedOrders } from '@/lib/api';
import { Package, ChevronRight, Clock, CheckCircle, XCircle, Truck, Store, Star } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400', icon: <Clock className="w-4 h-4" /> },
  reserved: { label: 'Reservado', color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400', icon: <Store className="w-4 h-4" /> },
  paid: { label: 'Pagado', color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
  processing: { label: 'Procesando', color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400', icon: <Package className="w-4 h-4" /> },
  shipped: { label: 'Enviado', color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Entregado', color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400', icon: <XCircle className="w-4 h-4" /> },
};

export default function MyOrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<PaginatedOrders | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/mis-pedidos');
      return;
    }
    loadOrders();
    if (currentPage === 1) loadLoyalty();
  }, [user, router, currentPage]);

  const loadLoyalty = async () => {
    try {
      const res = await fetch('/api/loyalty');
      if (res.ok) {
        const data = await res.json();
        setLoyaltyPoints(data.points);
      }
    } catch {}
  };

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderApi.list({ page: currentPage, limit: 10 });
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Mis Pedidos</h1>
        {loyaltyPoints !== null && (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-2xl px-4 py-3 self-start">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500 flex-shrink-0" />
            <div>
              <p className="text-xl font-black text-amber-700 dark:text-amber-400">{loyaltyPoints} punto{loyaltyPoints !== 1 ? 's' : ''}</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">acumulados</p>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                </div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : !orders || orders.orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No tienes pedidos
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Cuando realices una compra, aparecerá aquí
          </p>
          <Link href="/" className="btn btn-primary">
            Explorar productos
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.orders.map((order) => {
              const isStorePickup = order.payment_provider === 'store';
              let status = statusConfig[order.status] || statusConfig.pending;

              // Override labels for store-pickup orders
              if (isStorePickup && order.status === 'reserved') {
                status = { label: 'Pendiente aprobación', color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400', icon: <Clock className="w-4 h-4" /> };
              } else if (isStorePickup && order.status === 'processing') {
                status = { label: 'Aprobado - Listo para retiro', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400', icon: <CheckCircle className="w-4 h-4" /> };
              }

              const total = parseFloat(order.total);
              const date = new Date(order.created_at).toLocaleDateString('es-CL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <Link
                  key={order.id}
                  href={`/mis-pedidos/${order.id}`}
                  className="card p-4 sm:p-6 hover:shadow-md transition-shadow block"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Pedido #{order.id.slice(0, 8)}</p>
                      <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">{formatPrice(total)}</p>
                      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">{date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500" />
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
              <span className="px-4 py-2 text-slate-600 dark:text-slate-400">
                Página {currentPage} de {orders.total_pages}
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
