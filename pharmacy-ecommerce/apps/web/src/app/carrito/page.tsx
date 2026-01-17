'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, Package } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import Image from 'next/image';

export default function CartPage() {
  const { cart, fetchCartLocal, updateQuantityLocal, removeFromCartLocal, isLoading } = useCartStore();

  useEffect(() => {
    fetchCartLocal();
  }, [fetchCartLocal]);

  return (
    <div className="min-h-screen bg-background text-slate-200 py-8 selection:bg-primary-500/20">
      <div className="fixed inset-0 bg-gradient-to-tr from-primary-900/10 via-background to-background pointer-events-none z-[-1]" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Mi Carrito</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white/5 p-4 rounded-xl flex items-center gap-4 border border-white/5">
                <div className="w-16 h-16 bg-white/5 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-white/5 rounded w-1/2" />
                  <div className="h-4 bg-white/5 rounded w-1/4" />
                </div>
                <div className="h-8 bg-white/5 rounded w-24" />
              </div>
            ))}
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="bg-surface/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 text-center py-20 px-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Tu carrito está vacío
            </h2>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto text-lg">
              ¡Explora nuestro catálogo y encuentra todo lo que necesitas para tu salud!
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3.5 rounded-xl hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 font-medium"
            >
              Ver catálogo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-surface/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 overflow-hidden">
                <div className="divide-y divide-white/5">
                  {cart.items.map((item) => (
                    <div key={item.product_id} className="p-4 sm:p-6 flex gap-4 sm:gap-6 group transition-colors hover:bg-white/[0.02]">
                      {/* Product Image/Icon */}
                      <div className="w-24 h-24 bg-white/5 rounded-xl flex-shrink-0 flex items-center justify-center border border-white/5">
                        {item.product_image ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={item.product_image}
                              alt={item.product_name}
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                        ) : (
                          <Package className="w-10 h-10 text-slate-600" />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <Link 
                            href={`/producto/${item.product_slug}`}
                            className="text-lg font-medium text-white hover:text-primary-400 transition-colors line-clamp-2 mb-1"
                          >
                            {item.product_name}
                          </Link>
                          <p className="text-sm text-slate-400">
                            {formatPrice(parseFloat(item.price))} c/u
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border border-white/10 rounded-lg bg-surface/50">
                            <button
                              onClick={() => updateQuantityLocal(item.product_id, item.quantity - 1)}
                              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-l-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center text-sm font-medium text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantityLocal(item.product_id, item.quantity + 1)}
                              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-r-lg transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-white">
                              {formatPrice(parseFloat(item.subtotal))}
                            </span>
                            <button
                              onClick={() => removeFromCartLocal(item.product_id)}
                              className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-surface/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6">
                  Resumen del pedido
                </h2>

                <div className="space-y-4 border-b border-white/10 pb-6 mb-6">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal ({cart.items.reduce((acc, item) => acc + item.quantity, 0)} productos)</span>
                    <span className="font-medium text-slate-200">{formatPrice(parseFloat(cart.total))}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Envío</span>
                    <span className="text-primary-400 font-medium">Gratis</span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                  <span className="text-lg font-medium text-white">Total</span>
                  <span className="text-3xl font-bold text-white tracking-tight">{formatPrice(parseFloat(cart.total))}</span>
                </div>

                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-4 px-4 rounded-xl hover:bg-primary-500 transition-all font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40"
                >
                  Continuar al pago
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <div className="mt-6 text-center">
                  <Link
                    href="/"
                    className="text-sm text-slate-500 hover:text-primary-400 hover:underline transition-colors"
                  >
                    Seguir comprando
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
