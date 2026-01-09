'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus } from 'lucide-react';

export default function CartPage() {
  const { cart, fetchCartLocal, updateQuantityLocal, removeFromCartLocal, isLoading } = useCartStore();

  useEffect(() => {
    fetchCartLocal();
  }, [fetchCartLocal]);

  const total = cart ? parseFloat(cart.total) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Carrito</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 py-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
              <div className="h-8 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Tu carrito esta vacio
          </h2>
          <p className="text-gray-500 mb-6">
            Agrega productos para comenzar tu compra
          </p>
          <Link href="/" className="btn btn-primary">
            Ver catalogo
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card p-6 space-y-4">
              {cart.items.map((item) => (
                <div key={item.product_id} className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 text-center p-2">
                    {item.product_name}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                    <p className="text-primary-600 font-semibold">${parseFloat(item.price).toFixed(0)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantityLocal(item.product_id, item.quantity - 1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantityLocal(item.product_id, item.quantity + 1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${parseFloat(item.subtotal).toFixed(0)}</p>
                    <button
                      onClick={() => removeFromCartLocal(item.product_id)}
                      className="text-red-500 hover:text-red-700 mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen del pedido
              </h2>

              <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.item_count} items)</span>
                  <span>${total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envio</span>
                  <span className="text-green-600">Gratis</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-semibold text-gray-900 mb-6">
                <span>Total</span>
                <span>${total.toFixed(0)} CLP</span>
              </div>

              <Link
                href="/checkout"
                className="btn btn-primary w-full flex items-center justify-center space-x-2 py-3"
              >
                <span>Continuar al pago</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/"
                className="block text-center text-primary-600 hover:underline mt-4"
              >
                Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
