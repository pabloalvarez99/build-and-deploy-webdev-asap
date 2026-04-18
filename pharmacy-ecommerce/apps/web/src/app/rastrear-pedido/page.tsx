'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Package, CheckCircle, Clock, Store, XCircle, Truck, AlertCircle, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import Link from 'next/link';

interface TrackResult {
  id: string;
  short_id: string;
  status: string;
  status_label: string;
  total: string;
  created_at: string;
  pickup_code: string | null;
  payment_provider: string | null;
  items: { product_name: string; quantity: number; subtotal: string }[];
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  pending:    { icon: <Clock className="w-8 h-8" />,        color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' },
  reserved:   { icon: <Store className="w-8 h-8" />,        color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' },
  paid:       { icon: <CheckCircle className="w-8 h-8" />,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700' },
  processing: { icon: <CheckCircle className="w-8 h-8" />,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700' },
  completed:  { icon: <CheckCircle className="w-8 h-8" />,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700' },
  shipped:    { icon: <Truck className="w-8 h-8" />,        color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' },
  delivered:  { icon: <CheckCircle className="w-8 h-8" />,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700' },
  cancelled:  { icon: <XCircle className="w-8 h-8" />,      color: 'text-red-500 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' },
};

function TrackContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('id') || '');
  const [contact, setContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !contact.trim()) return;
    setIsLoading(true);
    setError('');
    setResult(null);

    const trimId = orderId.trim().toLowerCase().replace(/-/g, '');
    const trimContact = contact.trim().toLowerCase();

    // Detect if input is email or phone
    const isEmail = trimContact.includes('@');
    const params = new URLSearchParams({ id: trimId });
    if (isEmail) {
      params.set('email', trimContact);
    } else {
      params.set('phone', trimContact.replace(/\D/g, ''));
    }

    try {
      const res = await fetch(`/api/orders/track?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No pudimos encontrar tu pedido');
      } else {
        setResult(data);
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const statusConf = result ? (STATUS_CONFIG[result.status] || STATUS_CONFIG.pending) : null;

  return (
    <div className="min-h-[80vh] max-w-lg mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Rastrear Pedido</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
          Ingresa el número de tu pedido y tu email o teléfono
        </p>
      </div>

      <form onSubmit={handleSearch} className="card p-5 sm:p-8 space-y-5 mb-6">
        <div>
          <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
            Número de pedido
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Ej: 3F8A1B2C"
              className="input pl-10 font-mono tracking-wider uppercase"
              autoComplete="off"
              required
            />
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1.5">
            Encuéntralo en el email de confirmación o en la pantalla de éxito
          </p>
        </div>

        <div>
          <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tu email o teléfono
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="tu@email.com o 912345678"
            className="input"
            autoComplete="email"
            required
          />
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 dark:text-red-400 text-base">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full py-4 text-xl disabled:opacity-50"
        >
          {isLoading ? 'Buscando...' : 'Buscar pedido'}
        </button>
      </form>

      {result && statusConf && (
        <div className="space-y-4">
          {/* Status card */}
          <div className={`rounded-2xl border-2 p-6 text-center ${statusConf.bg}`}>
            <div className={`flex justify-center mb-3 ${statusConf.color}`}>
              {statusConf.icon}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pedido #{result.short_id}</p>
            <h2 className={`text-2xl font-black ${statusConf.color}`}>{result.status_label}</h2>
            {result.pickup_code && (
              <div className="mt-3 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 inline-block">
                <p className="text-xs text-slate-500 mb-1">Código de retiro</p>
                <p className="text-3xl font-mono font-black tracking-widest text-emerald-800 dark:text-emerald-300">{result.pickup_code}</p>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="card p-5 space-y-3">
            <div className="flex justify-between text-slate-600 dark:text-slate-400 text-base">
              <span>Fecha</span>
              <span>{new Date(result.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 text-base">
              <span>Total</span>
              <span className="font-black text-xl text-emerald-700 dark:text-emerald-400">{formatPrice(result.total)}</span>
            </div>
            <hr className="border-slate-100 dark:border-slate-700" />
            {result.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex-1">{item.product_name} × {item.quantity}</span>
                <span className="font-semibold flex-shrink-0">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <a
              href={`https://wa.me/56993649604?text=${encodeURIComponent(`Hola! Quiero consultar sobre mi pedido #${result.short_id}. Estado actual: ${result.status_label}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full min-h-[56px] rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-lg transition-colors"
            >
              Consultar por WhatsApp
            </a>
            <Link href="/" className="btn btn-secondary block text-center text-lg w-full min-h-[56px]">
              Seguir comprando
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <TrackContent />
    </Suspense>
  );
}
