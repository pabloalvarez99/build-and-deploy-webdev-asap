'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { orderApi } from '@/lib/api';
import { MapPin, FileText, Mail, Loader2, ShieldCheck, Store, CreditCard, Phone, Clock, ShoppingCart, ClipboardList, Check } from 'lucide-react';
import { formatPrice } from '@/lib/format';

type PaymentMethod = 'mercadopago' | 'store';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart, clearCart, getSessionId } = useCartStore();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('store');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Chilean phone: +56 9 XXXX XXXX or 9 XXXX XXXX or just digits 8+
    const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
    return /^\d{8,12}$/.test(cleaned);
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;

    const trimmedName = name.trim();
    const trimmedSurname = surname.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Por favor ingresa tu nombre (mínimo 2 caracteres)');
      return;
    }

    if (!trimmedSurname || trimmedSurname.length < 2) {
      setError('Por favor ingresa tu apellido (mínimo 2 caracteres)');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Por favor ingresa un email válido (ejemplo: tu@email.com)');
      return;
    }

    if (paymentMethod === 'store' && !validatePhone(trimmedPhone)) {
      setError('Por favor ingresa un teléfono válido (ejemplo: 9 1234 5678)');
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

        clearCart();
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

        clearCart();
        router.push(`/checkout/reservation?order_id=${response.order_id}&code=${response.pickup_code}&expires=${encodeURIComponent(response.expires_at)}&total=${response.total}`);
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Error al procesar el pedido';
      if (raw.includes('MercadoPago') || raw.includes('back_urls') || raw.includes('preference')) {
        setError('Error al conectar con MercadoPago. Por favor intenta nuevamente.');
      } else if (raw.includes('stock') || raw.includes('Stock')) {
        setError('Algunos productos no tienen suficiente stock disponible.');
      } else if (raw.includes('not found')) {
        setError('Uno de los productos ya no está disponible. Revisa tu carrito.');
      } else {
        setError(raw);
      }
      setIsProcessing(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Carrito vacío</h1>
        <p className="text-slate-500 text-lg mb-6">Agrega productos antes de continuar</p>
        <button onClick={() => router.push('/')} className="btn btn-primary text-lg">
          Ver productos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Finalizar compra</h1>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-0 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-emerald-700 hidden sm:inline">Carrito</span>
        </div>
        <div className="w-8 sm:w-12 h-0.5 bg-emerald-600" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">2</div>
          <span className="text-sm font-medium text-emerald-700 hidden sm:inline">Datos y pago</span>
        </div>
        <div className="w-8 sm:w-12 h-0.5 bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-sm font-bold">3</div>
          <span className="text-sm font-medium text-slate-400 hidden sm:inline">Confirmación</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Payment Method Selection - Large cards */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Método de pago
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className="p-5 rounded-2xl border-2 border-slate-200 text-left min-h-[80px] opacity-50 cursor-not-allowed relative"
            >
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-7 h-7 text-slate-400" />
                <span className="font-bold text-slate-900 text-lg">Pagar ahora</span>
                <span className="ml-auto text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Próximamente</span>
              </div>
              <p className="text-slate-500">
                Tarjeta o transferencia vía Webpay Plus
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPaymentMethod('store')}
              className={`p-5 rounded-2xl border-2 transition-all text-left min-h-[80px] ${
                paymentMethod === 'store'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Store className={`w-7 h-7 ${paymentMethod === 'store' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="font-bold text-slate-900 text-lg">Pagar en tienda</span>
              </div>
              <p className="text-slate-500">
                Reserva y paga cuando retires tus productos
              </p>
            </button>
          </div>

          {paymentMethod === 'store' && (
            <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-amber-800">
                  <p className="font-bold">Tu reserva será válida por 4 horas</p>
                  <p>Recibirás un código de retiro por email</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Información personal
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="checkout-name" className="block font-semibold text-slate-700 mb-2">
                Nombre *
              </label>
              <input
                id="checkout-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan"
                className="input"
                required
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor="checkout-surname" className="block font-semibold text-slate-700 mb-2">
                Apellido *
              </label>
              <input
                id="checkout-surname"
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Perez"
                className="input"
                required
                autoComplete="family-name"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Email de contacto *
            </h2>
          </div>
          <input
            id="checkout-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="input"
            required
            autoComplete="email"
          />
          <p className="text-slate-500 mt-2" id="email-help">
            Enviaremos la confirmación a este email
          </p>
        </div>

        {/* Phone (for store pickup) */}
        {paymentMethod === 'store' && (
          <div className="bg-white rounded-2xl border-2 border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Phone className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Teléfono de contacto *
              </h2>
            </div>
            <input
              id="checkout-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+56 9 1234 5678"
              className="input"
              required
              autoComplete="tel"
            />
            <p className="text-slate-500 mt-2">
              Te contactaremos cuando tu pedido esté listo
            </p>
          </div>
        )}

        {/* Shipping Address (only for MercadoPago) */}
        {paymentMethod === 'mercadopago' && (
          <div className="bg-white rounded-2xl border-2 border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Dirección de envío
              </h2>
            </div>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Ingresa tu dirección completa..."
              className="input min-h-[100px]"
            />
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
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

        {/* Order Summary - Inline, not sidebar */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Resumen del pedido
          </h2>

          <div className="space-y-3 border-b-2 border-slate-100 pb-4 mb-4">
            {cart.items.map((item) => (
              <div key={item.product_id} className="flex justify-between">
                <span className="text-slate-600 line-clamp-1 flex-1 mr-4">
                  {item.product_name} x{item.quantity}
                </span>
                <span className="text-slate-900 font-semibold flex-shrink-0">
                  {formatPrice(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-b-2 border-slate-100 pb-4 mb-4">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="text-slate-700 font-semibold">{formatPrice(cart.total)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{paymentMethod === 'store' ? 'Retiro' : 'Envío'}</span>
              <span className="text-emerald-600 font-semibold">Gratis</span>
            </div>
          </div>

          <div className="flex justify-between items-end mb-6">
            <span className="text-lg font-bold text-slate-900">Total</span>
            <span className="text-3xl font-black text-emerald-700">{formatPrice(cart.total)}</span>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={isProcessing || !email || !name || !surname || (paymentMethod === 'store' && !phone)}
            className={`w-full py-4 px-4 font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors min-h-[64px] ${
              paymentMethod === 'mercadopago'
                ? 'bg-[#009ee3] hover:bg-[#0080c3] text-white shadow-lg shadow-blue-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Procesando...
              </>
            ) : paymentMethod === 'mercadopago' ? (
              'Pagar con MercadoPago'
            ) : (
              <>
                <Store className="w-6 h-6" />
                Confirmar reserva
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 mt-4 text-slate-400">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-base">
              {paymentMethod === 'mercadopago'
                ? 'Pago seguro con MercadoPago'
                : 'Reserva garantizada por 4 horas'
              }
            </span>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/carrito')}
              className="text-emerald-600 font-semibold hover:underline text-base"
            >
              Volver al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
