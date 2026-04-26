'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { orderApi, PaginatedOrders } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { Package, ChevronRight, Clock, CheckCircle, XCircle, Truck, Store, Star, ChevronDown, RotateCcw } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400', icon: <Clock className="w-5 h-5" /> },
  reserved: { label: 'Reservado', color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400', icon: <Store className="w-5 h-5" /> },
  paid: { label: 'Pagado', color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400', icon: <CheckCircle className="w-5 h-5" /> },
  processing: { label: 'Procesando', color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400', icon: <Package className="w-5 h-5" /> },
  shipped: { label: 'Enviado', color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400', icon: <Truck className="w-5 h-5" /> },
  delivered: { label: 'Entregado', color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400', icon: <CheckCircle className="w-5 h-5" /> },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400', icon: <XCircle className="w-5 h-5" /> },
};

export default function MyOrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();

  const [orders, setOrders] = useState<PaginatedOrders | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [reordering, setReordering] = useState<string | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [loyaltyValue, setLoyaltyValue] = useState<number>(0);
  const [loyaltyTxs, setLoyaltyTxs] = useState<Array<{ id: string; points: number; reason: string; created_at: string }>>([]);
  const [showLoyaltyHistory, setShowLoyaltyHistory] = useState(false);

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
        setLoyaltyValue(data.points_value ?? 0);
        setLoyaltyTxs(data.transactions ?? []);
      }
    } catch {}
  };

  const handleReorder = async (orderId: string, items: Array<{ product_id: string | null; quantity: number }>) => {
    setReordering(orderId);
    for (const item of items) {
      if (item.product_id) {
        try {
          await addToCart(item.product_id, item.quantity);
        } catch {
          // skip products that no longer exist
        }
      }
    }
    setReordering(null);
    router.push('/carrito');
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
          <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-2xl self-start overflow-hidden">
            <button
              onClick={() => setShowLoyaltyHistory((p) => !p)}
              className="flex items-center gap-3 px-4 py-3 w-full text-left"
            >
              <Star className="w-6 h-6 text-amber-500 fill-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xl font-black text-amber-700 dark:text-amber-400">{loyaltyPoints} punto{loyaltyPoints !== 1 ? 's' : ''}</p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  {loyaltyValue > 0 ? `= ${formatPrice(loyaltyValue)} de descuento` : 'acumulados'}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform ${showLoyaltyHistory ? 'rotate-180' : ''}`} />
            </button>
            {showLoyaltyHistory && loyaltyTxs.length > 0 && (
              <div className="border-t border-amber-200 dark:border-amber-700 px-4 py-3 space-y-2 max-h-48 overflow-y-auto">
                {loyaltyTxs.map((t) => {
                  const labels: Record<string, string> = { purchase: 'Compra', redemption: 'Canje', redemption_restore: 'Restauración', admin_add: 'Ajuste (+)', admin_deduct: 'Ajuste (−)' };
                  return (
                    <div key={t.id} className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-medium text-amber-800 dark:text-amber-300">{labels[t.reason] || t.reason}</span>
                        <p className="text-amber-600 dark:text-amber-500">{new Date(t.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className={`font-bold ${t.points > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.points > 0 ? '+' : ''}{t.points}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
                <div
                  key={order.id}
                  className="card p-5 sm:p-6 hover:shadow-md transition-shadow hover:border-emerald-200 dark:hover:border-emerald-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-base text-slate-500 dark:text-slate-400">Pedido #{order.id.slice(0, 8)}</p>
                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{formatPrice(total)}</p>
                      <p className="text-base text-slate-500 dark:text-slate-400 mt-1">{date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => handleReorder(order.id, order.items)}
                      disabled={reordering === order.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 disabled:opacity-60 min-h-[44px] transition-colors"
                    >
                      <RotateCcw className={`w-4 h-4 ${reordering === order.id ? 'animate-spin' : ''}`} />
                      {reordering === order.id ? 'Agregando...' : 'Repetir'}
                    </button>
                    <Link
                      href={`/mis-pedidos/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 min-h-[44px] transition-colors"
                    >
                      Ver detalles
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
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
