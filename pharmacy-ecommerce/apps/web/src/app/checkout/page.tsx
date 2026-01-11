'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { orderApi } from '@/lib/api';
import { MapPin, FileText, CreditCard, Mail, Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCartLocal, clearCartLocal, getSessionId } = useCartStore();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCartLocal();
  }, [fetchCartLocal]);

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;

    if (!name || name.trim().length === 0) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    if (!surname || surname.trim().length === 0) {
      setError('Por favor ingresa tu apellido');
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un email valido');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const items = cart.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const response = await orderApi.guestCheckout({
        items,
        name: name.trim(),
        surname: surname.trim(),
        email,
        shipping_address: shippingAddress || undefined,
        notes: notes || undefined,
        session_id: getSessionId(),
      });

      clearCartLocal();
      window.location.href = response.init_point;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
      setIsProcessing(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Carrito vacio</h1>
        <p className="text-gray-600 mb-6">Agrega productos antes de continuar</p>
        <button onClick={() => router.push('/')} className="btn btn-primary">
          Ver productos
        </button>
      </div>
    );
  }

  const total = parseFloat(cart.total);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar compra</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Name and Surname */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Informacion personal *
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Perez"
                  className="input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Email de contacto *
              </h2>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="input"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Enviaremos la confirmacion de tu pedido a este email
            </p>
          </div>

          {/* Shipping Address */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Direccion de envio
              </h2>
            </div>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Ingresa tu direccion completa..."
              className="input min-h-[100px]"
            />
          </div>

          {/* Notes */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Notas adicionales
              </h2>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones especiales, horarios de entrega, etc."
              className="input min-h-[80px]"
            />
          </div>

          {/* Payment Method */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Metodo de pago
              </h2>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-medium">MercadoPago</p>
              <p className="text-blue-600 text-sm mt-1">
                Seras redirigido a MercadoPago para completar el pago de forma segura.
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Resumen del pedido
            </h2>

            <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
              {cart.items.map((item) => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.product_name} x{item.quantity}
                  </span>
                  <span className="text-gray-900">
                    ${parseFloat(item.subtotal).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${total.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Envio</span>
                <span className="text-green-600">Gratis</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold text-gray-900 mb-6">
              <span>Total</span>
              <span>${total.toFixed(0)} CLP</span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isProcessing || !email || !name || !surname}
              className="btn btn-primary w-full py-3 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Pagar con MercadoPago'
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Al continuar, aceptas nuestros terminos y condiciones
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
