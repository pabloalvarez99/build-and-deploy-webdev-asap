'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useLoyaltyStore } from '@/store/loyalty';
import { orderApi } from '@/lib/api';
import { calcPoints, POINTS_TO_CLP } from '@/lib/loyalty-utils';
import { Loader2, ShieldCheck, Store, Phone, User, Mail, CreditCard, Check, MessageCircle, X, Star, Banknote } from 'lucide-react';
import { formatPrice } from '@/lib/format';

type PaymentMethod = 'store' | 'webpay';

const WHATSAPP_NUMBER = '56993649604';
const PHONE_RE = /^(\+?56)?9\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart, clearCart, getSessionId } = useCartStore();
  const { user } = useAuthStore();
  const { points: storePoints, loadLoyalty } = useLoyaltyStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('store');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [stockShortages, setStockShortages] = useState<{ product_name: string; requested: number; available: number }[]>([]);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const loyaltyPoints = user ? (storePoints ?? 0) : 0;
  const modalRef = useRef<HTMLDivElement>(null);
  const modalTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  useEffect(() => {
    if (!showWhatsAppModal) return;
    modalTriggerRef.current = (document.activeElement as HTMLElement) || null;
    const node = modalRef.current;
    if (!node) return;

    const focusables = () => Array.from(
      node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('aria-hidden'));

    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); setShowWhatsAppModal(false); return; }
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      modalTriggerRef.current?.focus();
    };
  }, [showWhatsAppModal]);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!user) { setUsePoints(false); return; }
    loadLoyalty();
  }, [user, loadLoyalty]);

  const validatePhoneStr = (v: string) => {
    const n = v.replace(/[\s\-()]/g, '');
    if (!n) return 'Ingresa tu teléfono';
    if (!PHONE_RE.test(n)) return 'Celular chileno inválido (ej: 9 1234 5678)';
    return '';
  };
  const validateEmailStr = (v: string, required: boolean) => {
    const t = v.trim();
    if (!t) return required ? 'Ingresa tu email' : '';
    if (!EMAIL_RE.test(t)) return 'Email inválido';
    return '';
  };

  const validate = () => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) return 'Ingresa tu nombre';
    const pe = validatePhoneStr(phone);
    if (pe) return pe;
    const ee = validateEmailStr(email, paymentMethod === 'webpay');
    if (ee) return ee;
    return null;
  };

  const buildWhatsAppUrl = () => {
    if (!cart) return '#';
    const itemLines = cart.items.map(i => `- ${i.product_name} x${i.quantity} (${formatPrice(i.subtotal)})`).join('\n');
    const message = encodeURIComponent(
      `Hola! Tengo una consulta sobre los siguientes productos:\n\n${itemLines}\n\nTotal: ${formatPrice(cart.total)}\n\nNombre: ${name.trim() || '...'}\n\n¿Me pueden ayudar? Gracias!`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  };

  const handleSubmit = () => {
    if (!cart || cart.items.length === 0) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setStockShortages([]);

    if (paymentMethod === 'webpay') {
      processWebpay();
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
      const response = await orderApi.storePickup({
        items,
        name: trimmedName,
        surname: '',
        email: trimmedEmail || undefined,
        phone: trimmedPhone,
        session_id: getSessionId(),
        use_points: usePoints && loyaltyPoints > 0 && !!user,
      });
      clearCart();
      router.push(`/checkout/reservation?order_id=${response.order_id}&code=${response.pickup_code}&expires=${encodeURIComponent(response.expires_at)}&total=${response.total}`);
    } catch (err) {
      const e = err as Error & { code?: string; items?: unknown };
      if (e?.code === 'STOCK_INSUFFICIENT' && Array.isArray(e.items)) {
        setStockShortages(e.items as { product_name: string; requested: number; available: number }[]);
        setError('Algunos productos no tienen stock suficiente. Ajusta cantidades en el carrito.');
      } else {
        setError(err instanceof Error ? err.message : 'Error al procesar el pedido');
      }
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
  const cartTotal = Number(cart.total);
  const pointsDiscount = (usePoints && paymentMethod === 'store')
    ? Math.min(loyaltyPoints * POINTS_TO_CLP, cartTotal)
    : 0;
  const effectiveTotal = cartTotal - pointsDiscount;
  const pointsToEarn = calcPoints(effectiveTotal);
  const canSubmit = !!name && !!phone && (paymentMethod === 'webpay' ? !!email : true) && !phoneError && !emailError;

  return (
    <>
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="webpay-modal-title" aria-describedby="webpay-modal-desc">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowWhatsAppModal(false)} aria-hidden="true" />
          <div ref={modalRef} className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-slate-100 dark:border-slate-700 w-full max-w-[calc(100vw-2rem)] sm:max-w-md p-4 sm:p-6">
            <button
              onClick={() => setShowWhatsAppModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
              </div>
              <div>
                <h2 id="webpay-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">¿Tienes dudas antes de pagar?</h2>
                <p id="webpay-modal-desc" className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Puedes pagar con tarjeta directo o consultar primero por WhatsApp.
                </p>
              </div>
            </div>

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

            <button
              onClick={processWebpay}
              className="w-full py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-base transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <CreditCard className="w-5 h-5" />
              Pagar ahora sin preguntar
            </button>

            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 font-bold text-base transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Tengo dudas — preguntar por WhatsApp
            </a>

            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
              Si surge algún problema con tu pedido, el pago será reembolsado.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="text-center mb-5">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Finalizar pedido</h1>
          {user && (
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Hola, <span className="font-semibold text-emerald-700 dark:text-emerald-400">{user.name || user.email}</span>
            </p>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{itemCount} producto{itemCount > 1 ? 's' : ''}</span>
            <span className={`text-2xl font-black ${pointsDiscount > 0 ? 'line-through text-slate-400 dark:text-slate-500 text-lg' : 'text-emerald-700 dark:text-emerald-400'}`}>
              {formatPrice(cart.total)}
            </span>
          </div>
          {pointsDiscount > 0 && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-amber-700 dark:text-amber-400">Descuento puntos</span>
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">-{formatPrice(pointsDiscount)}</span>
            </div>
          )}
          {pointsDiscount > 0 && (
            <div className="flex justify-between items-center mt-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Total a pagar</span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{formatPrice(effectiveTotal)}</span>
            </div>
          )}
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

          {user && loyaltyPoints > 0 && paymentMethod === 'store' && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
              <button
                type="button"
                onClick={() => setUsePoints(!usePoints)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border-2 transition-all ${
                  usePoints
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className={`w-5 h-5 flex-shrink-0 ${usePoints ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${usePoints ? 'text-amber-800 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      Usar {loyaltyPoints} punto{loyaltyPoints !== 1 ? 's' : ''}
                    </p>
                    <p className={`text-xs ${usePoints ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                      = {formatPrice(Math.min(loyaltyPoints * POINTS_TO_CLP, cartTotal))} de descuento
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  usePoints ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-500'
                }`}>
                  {usePoints && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            </div>
          )}

          {user && pointsToEarn > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                Ganarás <strong>{pointsToEarn} punto{pointsToEarn > 1 ? 's' : ''}</strong> con esta compra
              </p>
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3">
          <Store className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">Retiro en tienda</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">Tu pedido quedará reservado y lo retiras cuando quieras</p>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3">¿Cómo quieres pagar?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('store')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'store'
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                  : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              <Banknote className={`w-7 h-7 ${paymentMethod === 'store' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
              <div className="text-center">
                <p className={`text-sm font-semibold leading-tight ${paymentMethod === 'store' ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  Pagar en tienda
                </p>
                <p className={`text-xs mt-0.5 ${paymentMethod === 'store' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`}>
                  Al retirar tu pedido
                </p>
              </div>
              {paymentMethod === 'store' && <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('webpay')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'webpay'
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                  : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              <CreditCard className={`w-7 h-7 ${paymentMethod === 'webpay' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
              <div className="text-center">
                <p className={`text-sm font-semibold leading-tight ${paymentMethod === 'webpay' ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  Pagar con Webpay
                </p>
                <p className={`text-xs mt-0.5 ${paymentMethod === 'webpay' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`}>
                  Débito o crédito online
                </p>
              </div>
              {paymentMethod === 'webpay' && <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
            </button>
          </div>

          {paymentMethod === 'webpay' && (
            <div className="mt-2 flex items-center justify-between gap-2 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl px-3 py-2">
              <p className="text-xs text-cyan-700 dark:text-cyan-300">Pago seguro con Webpay Plus.</p>
              <button type="button" onClick={() => setShowWhatsAppModal(true)}
                className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline whitespace-nowrap">
                ¿Dudas? Pregunta por WhatsApp
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5 space-y-4">
          {user && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                Sesión activa — tus datos están pre-completados
              </p>
            </div>
          )}

          <div>
            <label htmlFor="ck-name" className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <User className="w-5 h-5 text-cyan-600" />Nombre completo
            </label>
            <input id="ck-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez" className="input" autoComplete="name" />
          </div>
          <div>
            <label htmlFor="ck-phone" className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <Phone className="w-5 h-5 text-cyan-600" />Teléfono
            </label>
            <input id="ck-phone" type="tel" value={phone}
              onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(''); }}
              onBlur={(e) => setPhoneError(validatePhoneStr(e.target.value))}
              placeholder="9 1234 5678" className="input" autoComplete="tel"
              inputMode="numeric" pattern="[0-9+\s\-]*"
              aria-invalid={!!phoneError} aria-describedby={phoneError ? 'ck-phone-err' : undefined} />
            {phoneError && (
              <p id="ck-phone-err" className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{phoneError}</p>
            )}
          </div>
          <div>
            <label htmlFor="ck-email" className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <Mail className="w-5 h-5 text-cyan-600" />
              Email
              {paymentMethod === 'store' && !user && (
                <span className="text-slate-400 dark:text-slate-500 font-normal text-sm">(opcional)</span>
              )}
            </label>
            <input id="ck-email" type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
              onBlur={(e) => setEmailError(validateEmailStr(e.target.value, paymentMethod === 'webpay'))}
              placeholder={paymentMethod === 'store' && !user ? 'Para recibir confirmación (opcional)' : 'tu@email.com'}
              className={`input ${user ? 'bg-slate-100 dark:bg-slate-900/60 cursor-not-allowed text-slate-500 dark:text-slate-400' : ''}`}
              autoComplete="email" inputMode="email"
              readOnly={!!user} aria-readonly={!!user}
              title={user ? 'Editar en Mi Cuenta' : undefined}
              aria-invalid={!!emailError} aria-describedby={emailError ? 'ck-email-err' : (user ? 'ck-email-help' : undefined)} />
            {user && !emailError && (
              <p id="ck-email-help" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Editar en <a href="/mi-cuenta" className="text-cyan-700 dark:text-cyan-400 font-semibold hover:underline">Mi Cuenta</a>.
              </p>
            )}
            {emailError && (
              <p id="ck-email-err" className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{emailError}</p>
            )}
          </div>

          {!user && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              ¿Ya tienes cuenta?{' '}
              <a href="/auth/login" className="text-cyan-700 dark:text-cyan-400 font-semibold hover:underline">Inicia sesión</a>
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mt-4" role="alert">
            <p className="text-red-700 dark:text-red-400 font-semibold text-center">{error}</p>
            {stockShortages.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-red-700 dark:text-red-300">
                {stockShortages.map(s => (
                  <li key={s.product_name} className="flex justify-between gap-3">
                    <span className="line-clamp-1">{s.product_name}</span>
                    <span className="flex-shrink-0 font-semibold">pediste {s.requested} · stock {s.available}</span>
                  </li>
                ))}
                <li className="pt-2 mt-2 border-t border-red-200 dark:border-red-800">
                  <button type="button" onClick={() => router.push('/carrito')}
                    className="w-full text-center font-semibold text-red-700 dark:text-red-300 hover:underline">
                    Volver al carrito y ajustar cantidades
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isProcessing || !canSubmit}
          className="w-full mt-4 py-4 px-4 font-bold text-xl rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors min-h-[64px] bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/20"
        >
          {isProcessing ? (
            <><Loader2 className="w-6 h-6 animate-spin" />Procesando...</>
          ) : paymentMethod === 'webpay' ? (
            <><CreditCard className="w-6 h-6" />Reservar y pagar con Webpay</>
          ) : (
            <><Store className="w-6 h-6" />Reservar pedido — pago en tienda</>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 mt-3 text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-sm">
            {paymentMethod === 'webpay' ? 'Pago seguro con Webpay Plus — retiras en tienda' : 'Reserva válida por 24 horas — pagas al retirar'}
          </span>
        </div>

        <div className="mt-3 text-center">
          <button onClick={() => router.push('/carrito')} className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline text-base">
            Volver al carrito
          </button>
        </div>
      </div>
    </>
  );
}
