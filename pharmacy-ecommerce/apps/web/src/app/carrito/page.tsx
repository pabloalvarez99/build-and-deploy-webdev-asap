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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Mi Carrito</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white p-4 rounded-lg flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
                <div className="h-8 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Tu carrito está vacío
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              ¡Explora nuestro catálogo y encuentra todo lo que necesitas para tu salud y bienestar!
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Ver catálogo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {cart.items.map((item) => (
                    <div key={item.product_id} className="p-4 sm:p-6 flex gap-4 sm:gap-6">
                      {/* Product Image/Icon */}
                      <div className="w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center border border-gray-100">
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
                          <Package className="w-8 h-8 text-gray-300" />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <Link 
                            href={`/producto/${item.product_slug}`}
                            className="text-base font-medium text-gray-900 hover:text-emerald-600 transition-colors line-clamp-2 mb-1"
                          >
                            {item.product_name}
                          </Link>
                          <p className="text-sm text-gray-500">
                            {formatPrice(parseFloat(item.price))} c/u
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                            <button
                              onClick={() => updateQuantityLocal(item.product_id, item.quantity - 1)}
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-l-lg transition-colors disabled:opacity-50"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center text-sm font-medium text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantityLocal(item.product_id, item.quantity + 1)}
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-r-lg transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-base font-bold text-gray-900">
                              {formatPrice(parseFloat(item.subtotal))}
                            </span>
                            <button
                              onClick={() => removeFromCartLocal(item.product_id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Resumen del pedido
                </h2>

                <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.items.reduce((acc, item) => acc + item.quantity, 0)} productos)</span>
                    <span className="font-medium">{formatPrice(parseFloat(cart.total))}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Envío</span>
                    <span className="text-emerald-600 font-medium">Gratis</span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-6">
                  <span className="text-base font-medium text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">{formatPrice(parseFloat(cart.total))}</span>
                </div>

                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm hover:shadow"
                >
                  Continuar al pago
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="mt-4 text-center">
                  <Link
                    href="/"
                    className="text-sm text-gray-500 hover:text-emerald-600 hover:underline transition-colors"
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
