'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { orderApi } from '@/lib/api';
import { Loader2, ShieldCheck, Store, Phone, User, Mail, Lock, Eye, EyeOff, CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/format';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart, clearCart, getSessionId } = useCartStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleReserve = async () => {
    if (!cart || cart.items.length === 0) return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.replace(/[\s\-\(\)]/g, '');
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Ingresa tu nombre');
      return;
    }
    if (!/^\+?\d{8,12}$/.test(trimmedPhone)) {
      setError('Ingresa un teléfono válido (ej: 912345678)');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Ingresa un email válido');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsProcessing(true);
    setError('');

    // 1. Create account (or sign in if exists from previous attempt)
    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          name: trimmedName,
          surname: '',
          phone: trimmedPhone,
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) {
        if (regData.error?.includes('Ya existe')) {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { error: signInError } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
          if (signInError) {
            setError('Ya existe una cuenta con este email. Verifica tu contraseña o inicia sesión.');
            setIsProcessing(false);
            return;
          }
        } else {
          setError(regData.error || 'Error al crear la cuenta');
          setIsProcessing(false);
          return;
        }
      }
    } catch {
      setError('Error al crear la cuenta. Intenta nuevamente.');
      setIsProcessing(false);
      return;
    }

    // 2. Create store-pickup reservation
    try {
      const items = cart.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const response = await orderApi.storePickup({
        items,
        name: trimmedName,
        surname: '',
        email: trimmedEmail,
        phone: trimmedPhone,
        session_id: getSessionId(),
      });

      clearCart();
      router.push(
        `/checkout/reservation?order_id=${response.order_id}&code=${response.pickup_code}&expires=${encodeURIComponent(response.expires_at)}&total=${response.total}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el pedido';
      if (msg.includes('stock') || msg.includes('Stock')) {
        setError('Algunos productos no tienen suficiente stock.');
      } else if (msg.includes('not found')) {
        setError('Uno de los productos ya no está disponible.');
      } else {
        setError(msg);
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

  const itemCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
          <Store className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Reservar pedido</h1>
        <p className="text-slate-500 mt-1">Retira y paga en tienda</p>
      </div>

      {/* Order summary - compact */}
      <div className="bg-slate-50 rounded-2xl border-2 border-slate-100 p-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-600 font-medium">{itemCount} producto{itemCount > 1 ? 's' : ''}</span>
          <span className="text-2xl font-black text-emerald-700">{formatPrice(cart.total)}</span>
        </div>
        {cart.items.length <= 4 && (
          <div className="mt-3 space-y-1.5">
            {cart.items.map((item) => (
              <div key={item.product_id} className="flex justify-between text-sm text-slate-500">
                <span className="line-clamp-1 mr-3">{item.product_name} x{item.quantity}</span>
                <span className="flex-shrink-0 font-medium text-slate-700">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment method selector */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-700 mb-3">Método de pago</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Store pickup — active */}
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 cursor-default">
            <Store className="w-7 h-7 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700 text-center leading-tight">Retiro en tienda</span>
            <span className="text-xs text-emerald-600 font-medium">Pagas al retirar</span>
          </div>
          {/* Webpay — disabled */}
          <div className="relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed select-none">
            <CreditCard className="w-7 h-7 text-slate-400" />
            <span className="text-sm font-semibold text-slate-400 text-center leading-tight">Webpay Plus</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Próximamente</span>
          </div>
        </div>
      </div>

      {/* Single form card */}
      <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 space-y-4">

        {/* Name */}
        <div>
          <label htmlFor="ck-name" className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
            <User className="w-5 h-5 text-emerald-600" />
            Nombre completo
          </label>
          <input
            id="ck-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Pérez"
            className="input"
            autoComplete="name"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="ck-phone" className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
            <Phone className="w-5 h-5 text-emerald-600" />
            Teléfono
          </label>
          <input
            id="ck-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9 1234 5678"
            className="input"
            autoComplete="tel"
          />
          <p className="text-sm text-slate-400 mt-1">Te avisamos cuando tu pedido esté listo</p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="ck-email" className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            Email
          </label>
          <input
            id="ck-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="input"
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="ck-pass" className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            Contraseña
          </label>
          <div className="relative">
            <input
              id="ck-pass"
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
          <p className="text-sm text-slate-400 mt-1">Para ver tus pedidos después</p>
        </div>

        <p className="text-sm text-slate-500 text-center">
          ¿Ya tienes cuenta?{' '}
          <a href="/auth/login" className="text-emerald-700 font-semibold hover:underline">
            Inicia sesión
          </a>
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mt-4">
          <p className="text-red-600 font-semibold text-center">{error}</p>
          {error.includes('Ya existe') && (
            <a href="/auth/login" className="block text-center text-emerald-700 font-semibold underline text-sm mt-2">
              Ir a iniciar sesión
            </a>
          )}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleReserve}
        disabled={isProcessing || !name || !phone || !email || !password}
        className="w-full mt-4 py-4 px-4 font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors min-h-[64px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Reservando...
          </>
        ) : (
          <>
            <Store className="w-6 h-6" />
            Reservar pedido
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 mt-3 text-slate-400">
        <ShieldCheck className="w-5 h-5" />
        <span className="text-sm">Reserva válida por 24 horas — pagas al retirar</span>
      </div>

      <div className="mt-3 text-center">
        <button
          onClick={() => router.push('/carrito')}
          className="text-emerald-600 font-semibold hover:underline text-base"
        >
          Volver al carrito
        </button>
      </div>
    </div>
  );
}
