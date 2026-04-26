'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/format';
import { POINTS_TO_CLP } from '@/lib/loyalty-utils';
import {
  Star,
  UserCircle,
  Phone,
  Mail,
  User,
  TrendingUp,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
} from 'lucide-react';

interface LoyaltyTransaction {
  id: string;
  points: number;
  reason: string;
  order_id: string | null;
  created_at: string;
}

interface LoyaltyHistory {
  transactions: LoyaltyTransaction[];
  totalEarned: number;
  totalRedeemed: number;
}

interface OrderStats {
  totalSpent: number;
  orderCount: number;
}

const REASON_LABELS: Record<string, string> = {
  purchase: 'Compra web',
  redemption: 'Canje',
  redemption_restore: 'Restauración canje',
  pos_sale: 'Compra en tienda',
  admin_add: 'Ajuste (+)',
  admin_deduct: 'Ajuste (−)',
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5 flex flex-col gap-1">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

export default function MiCuentaPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [history, setHistory] = useState<LoyaltyHistory | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Profile edit state
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/mi-cuenta');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [loyaltyRes, historyRes, ordersRes] = await Promise.all([
        fetch('/api/loyalty'),
        fetch('/api/loyalty/history'),
        fetch('/api/orders?limit=50'),
      ]);

      if (loyaltyRes.ok) {
        const data = await loyaltyRes.json();
        setLoyaltyPoints(data.points ?? 0);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data);
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const orders = data.orders ?? [];
        const totalSpent = orders
          .filter((o: { status: string }) => !['cancelled', 'pending'].includes(o.status))
          .reduce((sum: number, o: { total: string }) => sum + parseFloat(o.total), 0);
        setOrderStats({ totalSpent, orderCount: data.total ?? orders.length });
      }
    } catch (err) {
      console.error('Error loading account data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSavePhone = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setSaveError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar');
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── Section A: Header + Stats ── */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Hola, {user.name?.split(' ')[0] || 'bienvenido/a'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
          </div>
        </div>

        {isLoadingData ? (
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5 animate-pulse h-24"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="Total gastado"
              value={formatPrice(orderStats?.totalSpent ?? 0)}
              sub="en pedidos completados"
            />
            <StatCard
              label="Pedidos"
              value={String(orderStats?.orderCount ?? 0)}
              sub="realizados"
            />
            <StatCard
              label="Puntos actuales"
              value={String(loyaltyPoints ?? 0)}
              sub={loyaltyPoints ? `= ${formatPrice((loyaltyPoints ?? 0) * POINTS_TO_CLP)} de descuento` : 'empieza a acumular'}
            />
          </div>
        )}
      </div>

      {/* ── Section B: Puntos de Fidelidad ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400 flex-shrink-0" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Puntos de Fidelidad</h2>
        </div>

        {/* Big points display */}
        <div className="px-6 py-6 bg-amber-50 dark:bg-amber-900/10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-5xl font-black text-amber-600 dark:text-amber-400">
              {loyaltyPoints ?? 0}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-500 mt-1 font-medium">
              puntos disponibles
            </p>
            {(loyaltyPoints ?? 0) > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                = {formatPrice((loyaltyPoints ?? 0) * POINTS_TO_CLP)} de descuento en tu próxima compra
              </p>
            )}
          </div>
          {history && (
            <div className="text-right text-sm text-slate-500 dark:text-slate-400 space-y-1">
              <p>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{history.totalEarned}</span> ganados
              </p>
              <p>
                <span className="text-red-500 dark:text-red-400 font-bold">−{history.totalRedeemed}</span> canjeados
              </p>
            </div>
          )}
        </div>

        {/* Transaction history */}
        {isLoadingData ? (
          <div className="px-6 py-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !history || history.transactions.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
            <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aún no tienes transacciones de puntos</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {history.transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black ${
                      tx.points > 0
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {tx.points > 0 ? '+' : '−'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {REASON_LABELS[tx.reason] ?? tx.reason}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-base font-black flex-shrink-0 ${
                    tx.points > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section C: Mi Perfil ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <User className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Mi Perfil</h2>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <Mail className="w-4 h-4 inline mr-1.5 opacity-70" />
              Correo electrónico
            </label>
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-base select-all">
              {user.email}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              El correo no se puede cambiar desde aquí.
            </p>
          </div>

          {/* Name (readonly) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <User className="w-4 h-4 inline mr-1.5 opacity-70" />
              Nombre
            </label>
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-base">
              {user.name || '—'}
            </div>
          </div>

          {/* Phone (editable) */}
          <div>
            <label
              htmlFor="phone-input"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              <Phone className="w-4 h-4 inline mr-1.5 opacity-70" />
              Teléfono
            </label>
            <div className="flex gap-2">
              <input
                id="phone-input"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setSaveStatus('idle'); }}
                placeholder="+56 9 1234 5678"
                className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-base focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 transition-colors min-h-[48px]"
              />
              <button
                onClick={handleSavePhone}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white font-semibold text-base transition-colors min-h-[48px] min-w-[48px] flex-shrink-0"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Guardar</span>
              </button>
            </div>

            {/* Feedback */}
            {saveStatus === 'success' && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 mt-2">
                <CheckCircle className="w-4 h-4" />
                Teléfono guardado correctamente
              </p>
            )}
            {saveStatus === 'error' && (
              <p className="flex items-center gap-1.5 text-sm text-red-500 dark:text-red-400 mt-2">
                <XCircle className="w-4 h-4" />
                {saveError}
              </p>
            )}

            {/* Important note */}
            <div className="mt-3 flex items-start gap-2 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl px-4 py-3">
              <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-cyan-700 dark:text-cyan-300">
                <strong>Importante:</strong> Tu teléfono te permite acumular puntos en compras presenciales en nuestra farmacia.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <a
          href="/mis-pedidos"
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-300 dark:hover:border-cyan-700 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors text-sm font-medium min-h-[48px]"
        >
          <ShoppingBag className="w-4 h-4" />
          Ver mis pedidos
        </a>
      </div>
    </div>
  );
}
