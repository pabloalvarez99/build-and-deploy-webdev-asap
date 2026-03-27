'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { orderApi } from '@/lib/api';
import { FileText, Mail, Loader2, ShieldCheck, Store, Phone, Clock, Check, UserPlus, Eye, EyeOff, Lock, CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/format';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart, clearCart, getSessionId } = useCartStore();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'webpay' | 'store'>('webpay');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountError, setAccountError] = useState('');

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

    if (!validatePhone(trimmedPhone)) {
      setError('Por favor ingresa un teléfono válido (ejemplo: 9 1234 5678)');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsProcessing(true);
    setError('');
    setAccountError('');

    // Create account (required — blocks checkout if email already exists)
    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password, name: trimmedName, surname: trimmedSurname, phone: trimmedPhone || undefined }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) {
        setAccountError(regData.error || 'Error al crear la cuenta');
        setIsProcessing(false);
        return;
      }
    } catch {
      setAccountError('Error al crear la cuenta. Por favor intenta nuevamente.');
      setIsProcessing(false);
      return;
    }

    try {
      const items = cart.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const payload = {
        items,
        name: name.trim(),
        surname: surname.trim(),
        email,
        phone: phone.trim(),
        notes: notes || undefined,
        session_id: getSessionId(),
      };

      if (paymentMethod === 'webpay') {
        const res = await fetch('/api/webpay/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al iniciar pago');

        // Don't clear cart here — clear it on the success page so cancelled/rejected
        // payments allow the user to retry with their cart intact.
        // Submit form POST to Transbank (required by their protocol)
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.url;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'token_ws';
        input.value = data.token;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        return;
      }

      const response = await orderApi.storePickup(payload);

      clearCart();
      router.push(`/checkout/reservation?order_id=${response.order_id}&code=${response.pickup_code}&expires=${encodeURIComponent(response.expires_at)}&total=${response.total}`);
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Error al procesar el pedido';
      if (raw.includes('stock') || raw.includes('Stock')) {
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
        {/* Método de pago */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Método de pago</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Webpay Plus */}
            <button
              type="button"
              onClick={() => setPaymentMethod('webpay')}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                paymentMethod === 'webpay'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <CreditCard className={`w-6 h-6 flex-shrink-0 mt-0.5 ${paymentMethod === 'webpay' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <p className="font-bold text-slate-900">Pagar online</p>
                <p className="text-sm text-slate-500">Webpay Plus — tarjeta débito o crédito</p>
              </div>
              {paymentMethod === 'webpay' && <Check className="w-5 h-5 text-emerald-600 ml-auto flex-shrink-0" />}
            </button>

            {/* Pagar en tienda */}
            <button
              type="button"
              onClick={() => setPaymentMethod('store')}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                paymentMethod === 'store'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Store className={`w-6 h-6 flex-shrink-0 mt-0.5 ${paymentMethod === 'store' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <p className="font-bold text-slate-900">Pagar en tienda</p>
                <p className="text-sm text-slate-500">Reserva y paga al retirar</p>
              </div>
              {paymentMethod === 'store' && <Check className="w-5 h-5 text-emerald-600 ml-auto flex-shrink-0" />}
            </button>
          </div>

          {paymentMethod === 'store' && (
            <div className="mt-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-amber-800">
                  <p className="font-bold">Tu reserva será válida por 24 horas</p>
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
                placeholder="Pérez"
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

        {/* Phone */}
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

        {/* Create Account (required) */}
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className="w-6 h-6 text-emerald-600" />
            <div>
              <h2 className="text-lg font-bold text-emerald-800">Crear cuenta</h2>
              <p className="text-sm text-emerald-700">Para seguir tus pedidos en línea</p>
            </div>
          </div>

          {accountError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm font-medium">{accountError}</p>
              {accountError.includes('Ya existe') && (
                <a href="/auth/login" className="text-emerald-700 font-semibold underline text-sm mt-1 inline-block">
                  Iniciar sesión →
                </a>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1 text-slate-400" />
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="input pr-12"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-2">Confirmar contraseña *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="input"
                autoComplete="new-password"
              />
            </div>
            <p className="text-sm text-emerald-700">
              Tu cuenta se creará con el email <strong>{email || '...'}</strong>
            </p>
            <p className="text-sm text-slate-500">
              ¿Ya tienes cuenta?{' '}
              <a href="/auth/login" className="text-emerald-700 font-semibold hover:underline">
                Inicia sesión
              </a>
            </p>
          </div>
        </div>

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
            placeholder="Horario preferido de retiro, consultas, etc."
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
              <div key={item.product_id} className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <span className="text-slate-600 line-clamp-1">
                    {item.product_name} x{item.quantity}
                  </span>
                  {item.discount_percent && (
                    <span className="text-xs font-bold text-red-500">-{item.discount_percent}% OFF</span>
                  )}
                </div>
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
            {cart.items.some(i => i.discount_percent) && (() => {
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
            <div className="flex justify-between text-slate-500">
              <span>Retiro</span>
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
            disabled={isProcessing || !email || !name || !surname || !phone || !password || !confirmPassword}
            className="w-full py-4 px-4 font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors min-h-[64px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Procesando...
              </>
            ) : paymentMethod === 'webpay' ? (
              <>
                <CreditCard className="w-6 h-6" />
                Pagar con Webpay
              </>
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
              {paymentMethod === 'webpay' ? 'Pago seguro con Webpay Plus' : 'Reserva garantizada por 24 horas'}
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
