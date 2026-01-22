'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { orderApi } from '@/lib/api';
import { MapPin, FileText, Mail, Loader2, ShieldCheck, Store, CreditCard, Phone, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/format';

type PaymentMethod = 'mercadopago' | 'store';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCartLocal, clearCartLocal, getSessionId } = useCartStore();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago');
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

    if (paymentMethod === 'store' && (!phone || phone.trim().length < 8)) {
      setError('Por favor ingresa un telefono valido para contactarte');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const items = cart.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      if (paymentMethod === 'mercadopago') {
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
      } else {
        const response = await orderApi.storePickup({
          items,
          name: name.trim(),
          surname: surname.trim(),
          email,
          phone: phone.trim(),
          notes: notes || undefined,
          session_id: getSessionId(),
        });

        clearCartLocal();
        router.push(`/checkout/reservation?order_id=${response.order_id}&code=${response.pickup_code}&expires=${encodeURIComponent(response.expires_at)}&total=${response.total}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pedido');
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar compra</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Method Selection */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Metodo de pago
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('mercadopago')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  paymentMethod === 'mercadopago'
                    ? 'border-[#009ee3] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className={`w-6 h-6 ${paymentMethod === 'mercadopago' ? 'text-[#009ee3]' : 'text-gray-400'}`} />
                  <span className="font-semibold text-gray-900">Pagar ahora</span>
                </div>
                <p className="text-sm text-gray-600">
                  Paga con tarjeta, transferencia o efectivo via MercadoPago
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('store')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  paymentMethod === 'store'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Store className={`w-6 h-6 ${paymentMethod === 'store' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className="font-semibold text-gray-900">Reservar y pagar en tienda</span>
                </div>
                <p className="text-sm text-gray-600">
                  Reserva tus productos y paga cuando los retires
                </p>
              </button>
            </div>

            {paymentMethod === 'store' && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Tu reserva sera valida por 48 horas</p>
                    <p>Recibiras un codigo de retiro por email para presentar en tienda</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Name and Surname */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-emerald-600" />
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
              <Mail className="w-5 h-5 text-emerald-600" />
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

          {/* Phone (for store pickup) */}
          {paymentMethod === 'store' && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Telefono de contacto *
                </h2>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="input"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Te contactaremos cuando tu pedido este listo
              </p>
            </div>
          )}

          {/* Shipping Address (only for MercadoPago) */}
          {paymentMethod === 'mercadopago' && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-emerald-600" />
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
          )}

          {/* Notes */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Notas adicionales
              </h2>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={paymentMethod === 'store'
                ? "Horario preferido de retiro, consultas, etc."
                : "Instrucciones especiales, horarios de entrega, etc."
              }
              className="input min-h-[80px]"
            />
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
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{paymentMethod === 'store' ? 'Retiro' : 'Envio'}</span>
                <span className="text-green-600">Gratis</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold text-gray-900 mb-6">
              <span>Total</span>
              <span>{formatPrice(cart.total)}</span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isProcessing || !email || !name || !surname || (paymentMethod === 'store' && !phone)}
              className={`w-full py-3 px-4 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors ${
                paymentMethod === 'mercadopago'
                  ? 'bg-[#009ee3] hover:bg-[#0080c3] text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : paymentMethod === 'mercadopago' ? (
                'Pagar con MercadoPago'
              ) : (
                <>
                  <Store className="w-5 h-5" />
                  Confirmar reserva
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-4 text-gray-500">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs">
                {paymentMethod === 'mercadopago'
                  ? 'Pago seguro con MercadoPago'
                  : 'Reserva garantizada por 48 horas'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
