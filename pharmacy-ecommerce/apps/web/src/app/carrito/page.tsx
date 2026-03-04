'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, Package } from 'lucide-react';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const { cart, fetchCart, updateQuantity, removeFromCart, isLoading } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Mi Carrito</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white p-4 rounded-2xl flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-slate-100 rounded w-2/3" />
                  <div className="h-5 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-slate-100 text-center py-16 px-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Tu carrito está vacío
            </h2>
            <p className="text-slate-500 mb-8 text-lg max-w-sm mx-auto">
              Explora nuestro catálogo y encuentra lo que necesitas
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-lg min-h-[56px]"
            >
              Ver catálogo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {cart.items.map((item) => (
                  <div key={item.product_id} className="p-4 flex gap-4">
                    {/* Product Image */}
                    <div className="w-28 h-28 bg-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center border-2 border-slate-100 overflow-hidden">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-slate-300" />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <Link
                          href={`/producto/${item.product_slug}`}
                          className="font-bold text-slate-900 hover:text-emerald-600 transition-colors line-clamp-2 leading-snug"
                        >
                          {item.product_name}
                        </Link>
                        <p className="text-base text-slate-500 mt-1">
                          {formatPrice(parseFloat(item.price))} c/u
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity controls - Large buttons */}
                        <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-14 h-14 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-30"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="w-12 text-center font-bold text-lg text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="w-14 h-14 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-slate-900">
                            {formatPrice(parseFloat(item.subtotal))}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.product_id)}
                            className="w-14 h-14 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary - Always visible, not sidebar */}
            <div className="bg-white rounded-2xl border-2 border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Resumen del pedido
              </h2>

              <div className="space-y-3 border-b-2 border-slate-100 pb-4 mb-4">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal ({cart.items.reduce((acc, item) => acc + item.quantity, 0)} productos)</span>
                  <span className="font-semibold text-slate-700">{formatPrice(parseFloat(cart.total))}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Envio</span>
                  <span className="text-emerald-600 font-semibold">Gratis</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-6">
                <span className="text-lg font-bold text-slate-900">Total</span>
                <span className="text-3xl font-black text-emerald-700">{formatPrice(parseFloat(cart.total))}</span>
              </div>

              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 px-4 rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-lg shadow-lg shadow-emerald-600/20 min-h-[56px]"
              >
                Continuar al pago
                <ArrowRight className="w-5 h-5" />
              </Link>

              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="text-emerald-600 font-semibold hover:underline text-base"
                >
                  Seguir comprando
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
