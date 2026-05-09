'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, Package, Star, RotateCcw } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { calcPoints } from '@/lib/loyalty-utils';
import CheckoutProgress from '@/components/CheckoutProgress';

export default function CartPage() {
  const { cart, fetchCart, updateQuantity, removeFromCart, addToCart, isLoading } = useCartStore();
  const { user } = useAuthStore();
  const [undoToast, setUndoToast] = useState<{ productId: string; name: string; quantity: number } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRemove = (productId: string, name: string, quantity: number) => {
    removeFromCart(productId);
    setUndoToast({ productId, name, quantity });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoToast(null), 5000);
  };

  const handleUndo = async () => {
    if (!undoToast) return;
    await addToCart(undoToast.productId, undoToast.quantity);
    setUndoToast(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 py-4 sm:py-6 pb-28 md:pb-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">Mi Carrito</h1>
        {cart && cart.items.length > 0 && <CheckoutProgress current={1} />}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700 text-center py-16 px-6">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Tu carrito está vacío
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg max-w-sm mx-auto">
              Explora nuestro catálogo y encuentra lo que necesitas
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-cyan-600 text-white px-8 py-4 rounded-2xl hover:bg-cyan-700 transition-colors font-bold text-lg min-h-[56px]"
            >
              Ver catálogo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {cart.items.map((item) => (
                  <div key={item.product_id} className="p-4 sm:p-5 flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-50 dark:bg-slate-800 rounded-2xl flex-shrink-0 relative border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
                      {item.product_image ? (
                        <Image
                          src={item.product_image}
                          alt={item.product_name}
                          fill
                          sizes="(max-width: 640px) 80px, 112px"
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div>
                        <Link
                          href={`/producto/${item.product_slug}`}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors line-clamp-2 leading-snug text-base sm:text-lg"
                        >
                          {item.product_name}
                        </Link>
                        {item.discount_percent && item.original_price ? (
                          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-slate-400 dark:text-slate-500 line-through">{formatPrice(parseFloat(item.original_price))}</span>
                            <span className="text-base text-emerald-600 dark:text-emerald-400 font-semibold">{formatPrice(parseFloat(item.price))} c/u</span>
                            <span className="text-xs font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">-{item.discount_percent}%</span>
                          </div>
                        ) : (
                          <p className="text-base text-slate-500 dark:text-slate-400 mt-1.5">
                            {formatPrice(parseFloat(item.price))} c/u
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-2">
                        {formatPrice(parseFloat(item.subtotal))}
                      </span>

                      {/* Controls row - flex-wrap prevents overflow on small screens */}
                      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                        {/* Quantity controls */}
                        <div className="flex items-center border-2 border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
                            disabled={item.quantity <= 1}
                            aria-label={`Reducir cantidad de ${item.product_name}`}
                          >
                            <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <span className="w-10 sm:w-12 text-center font-bold text-lg text-slate-900 dark:text-slate-100" aria-label={`Cantidad: ${item.quantity}`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
                            disabled={item.quantity >= item.stock}
                            aria-label={`Aumentar cantidad de ${item.product_name}`}
                          >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(item.product_id, item.product_name, item.quantity)}
                          className="w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors"
                          aria-label={`Eliminar ${item.product_name} del carrito`}
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary - Always visible, not sidebar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                Resumen del pedido
              </h2>

              <div className="space-y-3 border-b-2 border-slate-100 dark:border-slate-700 pb-4 mb-4">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal ({cart.items.reduce((acc, item) => acc + item.quantity, 0)} productos)</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatPrice(parseFloat(cart.total))}</span>
                </div>
                {cart.items.some(i => i.original_price && i.discount_percent) && (() => {
                  const savings = cart.items.reduce((sum, i) => {
                    if (i.original_price && i.discount_percent) {
                      return sum + (parseFloat(i.original_price) - parseFloat(i.price)) * i.quantity;
                    }
                    return sum;
                  }, 0);
                  return savings > 0 ? (
                    <div className="flex justify-between text-red-500">
                      <span className="font-semibold">Descuentos</span>
                      <span className="font-bold">-{formatPrice(savings)}</span>
                    </div>
                  ) : null;
                })()}
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Envío</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Gratis</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-4">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Total</span>
                <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{formatPrice(parseFloat(cart.total))}</span>
              </div>

              {/* Loyalty points preview */}
              {user && calcPoints(parseFloat(cart.total)) > 0 && (
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-2xl px-4 py-3 mb-4">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-400 flex-shrink-0" />
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Ganarás <strong>{calcPoints(parseFloat(cart.total))} punto{calcPoints(parseFloat(cart.total)) !== 1 ? 's' : ''}</strong> con esta compra
                  </p>
                </div>
              )}

              {!user && (
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-2xl px-4 py-3 mb-4">
                  <Star className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <Link href="/auth/register" className="font-bold underline">Crea tu cuenta</Link> y gana {calcPoints(parseFloat(cart.total))} punto{calcPoints(parseFloat(cart.total)) !== 1 ? 's' : ''} con esta compra
                  </p>
                </div>
              )}

              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white py-4 px-4 rounded-2xl hover:bg-cyan-700 transition-colors font-bold text-lg shadow-lg shadow-cyan-600/20 min-h-[56px]"
              >
                Continuar al pago
                <ArrowRight className="w-5 h-5" />
              </Link>

              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline text-base"
                >
                  Seguir comprando
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky mobile bottom bar */}
      {cart && cart.items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{formatPrice(parseFloat(cart.total))}</span>
            </div>
            <Link
              href="/checkout"
              className="flex-1 max-w-[60%] flex items-center justify-center gap-2 bg-cyan-600 text-white py-3 px-4 rounded-2xl font-bold text-base min-h-[52px] shadow-lg shadow-cyan-600/20"
            >
              Continuar
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}

      {undoToast && (
        <div className="fixed bottom-24 md:bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-auto z-50" role="status" aria-live="polite">
          <div className="flex items-center gap-3 bg-slate-900 dark:bg-slate-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/10">
            <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium text-base flex-1 truncate max-w-[220px]">Eliminado: {undoToast.name}</span>
            <button
              onClick={handleUndo}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-bold text-sm min-h-[40px] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Deshacer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
