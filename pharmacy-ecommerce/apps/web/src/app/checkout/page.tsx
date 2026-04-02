'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { orderApi } from '@/lib/api';
import { Loader2, ShieldCheck, Store, Phone, User, Mail, Lock, Eye, EyeOff, CreditCard, Check, MessageCircle, X, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/format';

type PaymentMethod = 'store' | 'webpay';

const WHATSAPP_NUMBER = '56993649604';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart, clearCart, getSessionId } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('store');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const validate = () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.replace(/[\s\-\(\)]/g, '');
    const trimmedEmail = email.trim();
    if (!trimmedName || trimmedName.length < 2) return 'Ingresa tu nombre';
    if (!/^\+?\d{8,12}$/.test(trimmedPhone)) return 'Teléfono inválido (ej: 912345678)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return 'Email inválido';
    if (paymentMethod === 'store' && password.length < 6) return 'Contraseña mínimo 6 caracteres';
    return null;
  };

  const buildWhatsAppUrl = () => {
    if (!cart) return '#';
    const itemLines = cart.items.map(i => `- ${i.product_name} x${i.quantity} (${formatPrice(i.subtotal)})`).join('\n');
    const message = encodeURIComponent(
      `Hola! Antes de pagar por Webpay, quisiera confirmar disponibilidad de los siguientes productos:\n\n${itemLines}\n\nTotal: ${formatPrice(cart.total)}\n\nNombre: ${name.trim() || '...'}\n\n¿Están disponibles para compra online? Gracias!`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  };

  const handleSubmit = () => {
    if (!cart || cart.items.length === 0) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');

    if (paymentMethod === 'webpay') {
      // Show WhatsApp confirmation before charging real money
      setShowWhatsAppModal(true);
      return;
    }
    processStorePickup();
  };

  const processWebpay = async () => {
    if (!cart) return;
    setShowWhatsAppModal(false);
    setIsProcessing(true);
    setError('');

    const trimmedName = name.trim();
    const trimmedPhone = phone.replace(/[\s\-\(\)]/g, '');
    const trimmedEmail = email.trim();
    const items = cart.items.map(item => ({ product_id: item.product_id, quantity: item.quantity }));

    try {
      const res = await fetch('/api/webpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, name: trimmedName, surname: '', email: trimmedEmail, phone: trimmedPhone, session_id: getSessionId() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al iniciar pago'); setIsProcessing(false); return; }

      clearCart();
      const form = document.createElement('form');
      form.action = data.url;
      form.method = 'POST';
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'token_ws';
      input.value = data.token;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } catch {
      setError('Error al conectar con Webpay');
      setIsProcessing(false);
    }
  };

  const processStorePickup = async () => {
    if (!cart) return;
    setIsProcessing(true);
    setError('');

    const trimmedName = name.trim();
    const trimmedPhone = phone.replace(/[\s\-\(\)]/g, '');
    const trimmedEmail = email.trim();
    const items = cart.items.map(item => ({ product_id: item.product_id, quantity: item.quantity }));

    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password, name: trimmedName, surname: '', phone: trimmedPhone }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) {
        if (regData.error?.includes('Ya existe')) {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { error: signInError } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
          if (signInError) { setError('Ya existe una cuenta. Verifica tu contraseña.'); setIsProcessing(false); return; }
        } else {
          setError(regData.error || 'Error al crear la cuenta');
          setIsProcessing(false);
          return;
        }
      }
    } catch {
      setError('Error al crear la cuenta');
      setIsProcessing(false);
      return;
    }

    try {
      const response = await orderApi.storePickup({
        items,
        name: trimmedName,
        surname: '',
        email: trimmedEmail,
        phone: trimmedPhone,
        session_id: getSessionId(),
      });
      clearCart();
      router.push(`/checkout/reservation?order_id=${response.order_id}&code=${response.pickup_code}&expires=${encodeURIComponent(response.expires_at)}&total=${response.total}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el pedido';
      setError(msg.includes('stock') ? 'Algunos productos no tienen suficiente stock.' : msg);
      setIsProcessing(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Carrito vacío</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-6">Agrega productos antes de continuar</p>
        <button onClick={() => router.push('/')} className="btn btn-primary text-lg">Ver productos</button>
      </div>
    );
  }

  const itemCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
  const canSubmit = name && phone && email && (paymentMethod === 'webpay' || password.length >= 6);

  return (
    <>
      {/* WhatsApp confirmation modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowWhatsAppModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-slate-100 dark:border-slate-700 w-full max-w-md p-6">
            <button
              onClick={() => setShowWhatsAppModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Confirma disponibilidad primero</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Antes de pagar con tarjeta, confirma por WhatsApp que los productos están disponibles.
                </p>
              </div>
            </div>

            {/* Cart summary in modal */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 mb-4 space-y-1.5">
              {cart.items.map(item => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300 line-clamp-1 mr-2">{item.product_name} x{item.quantity}</span>
                  <span className="text-slate-700 dark:text-slate-200 font-medium flex-shrink-0">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-600">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Total</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400">{formatPrice(cart.total)}</span>
              </div>
            </div>

            {/* WhatsApp button */}
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-base transition-colors mb-3"
            >
              <MessageCircle className="w-5 h-5" />
              Confirmar disponibilidad por WhatsApp
            </a>

            {/* Proceed to pay */}
            <button
              onClick={processWebpay}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Ya confirmé — proceder al pago
            </button>

            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
              Si la farmacia no confirma disponibilidad, el pago será reembolsado.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Finalizar pedido</h1>
        </div>

        {/* Order summary */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{itemCount} producto{itemCount > 1 ? 's' : ''}</span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{formatPrice(cart.total)}</span>
          </div>
          {cart.items.length <= 4 && (
            <div className="mt-3 space-y-1.5">
              {cart.items.map((item) => (
                <div key={item.product_id} className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span className="line-clamp-1 mr-3">{item.product_name} x{item.quantity}</span>
                  <span className="flex-shrink-0 font-medium text-slate-700 dark:text-slate-300">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment method selector */}
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3">Método de pago</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('store')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'store'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              <Store className={`w-7 h-7 ${paymentMethod === 'store' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
              <div className="text-center">
                <p className={`text-sm font-semibold leading-tight ${paymentMethod === 'store' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  Retiro en tienda
                </p>
                <p className={`text-xs mt-0.5 ${paymentMethod === 'store' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  Pagas al retirar
                </p>
              </div>
              {paymentMethod === 'store' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('webpay')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'webpay'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              <CreditCard className={`w-7 h-7 ${paymentMethod === 'webpay' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
              <div className="text-center">
                <p className={`text-sm font-semibold leading-tight ${paymentMethod === 'webpay' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  Webpay Plus
                </p>
                <p className={`text-xs mt-0.5 ${paymentMethod === 'webpay' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  Débito o crédito
                </p>
              </div>
              {paymentMethod === 'webpay' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </button>
          </div>

          {/* Webpay note */}
          {paymentMethod === 'webpay' && (
            <div className="mt-2 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
              <MessageCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Se solicitará confirmación por WhatsApp antes de procesar el pago online.
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5 space-y-4">
          <div>
            <label htmlFor="ck-name" className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <User className="w-5 h-5 text-emerald-600" />Nombre completo
            </label>
            <input id="ck-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez" className="input" autoComplete="name" />
          </div>
          <div>
            <label htmlFor="ck-phone" className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <Phone className="w-5 h-5 text-emerald-600" />Teléfono
            </label>
            <input id="ck-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="9 1234 5678" className="input" autoComplete="tel" />
          </div>
          <div>
            <label htmlFor="ck-email" className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <Mail className="w-5 h-5 text-emerald-600" />Email
            </label>
            <input id="ck-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com" className="input" autoComplete="email" />
          </div>

          {paymentMethod === 'store' && (
            <div>
              <label htmlFor="ck-pass" className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <Lock className="w-5 h-5 text-emerald-600" />Contraseña
              </label>
              <div className="relative">
                <input id="ck-pass" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                  className="input pr-12" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Para ver tus pedidos después</p>
            </div>
          )}

          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            ¿Ya tienes cuenta?{' '}
            <a href="/auth/login" className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">Inicia sesión</a>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mt-4">
            <p className="text-red-600 dark:text-red-400 font-semibold text-center">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isProcessing || !canSubmit}
          className="w-full mt-4 py-4 px-4 font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors min-h-[64px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
        >
          {isProcessing ? (
            <><Loader2 className="w-6 h-6 animate-spin" />Procesando...</>
          ) : paymentMethod === 'webpay' ? (
            <><CreditCard className="w-6 h-6" />Continuar con Webpay</>
          ) : (
            <><Store className="w-6 h-6" />Reservar pedido</>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 mt-3 text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-sm">
            {paymentMethod === 'webpay' ? 'Pago seguro con Webpay Plus' : 'Reserva válida por 24 horas — pagas al retirar'}
          </span>
        </div>

        <div className="mt-3 text-center">
          <button onClick={() => router.push('/carrito')} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline text-base">
            Volver al carrito
          </button>
        </div>
      </div>
    </>
  );
}
