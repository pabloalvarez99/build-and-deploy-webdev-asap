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
  RefreshCw,
  Info,
} from 'lucide-react';

interface LoyaltyTransaction {
  id: string;
  points: number;
  reason: string;
  order_id: string | null;
  created_at: string;
}

interface LoyaltyData {
  transactions: LoyaltyTransaction[];
  total_points: number;
  points_value: number;
}

interface OrderStats {
  totalSpent: number;
  orderCount: number;
}

const REASON_LABELS: Record<string, string> = {
  purchase: 'Compra online',
  redemption: 'Canje de puntos',
  redemption_restore: 'Restauración canje',
  pos_sale: 'Venta en tienda',
  cancelled: 'Cancelación',
  admin_add: 'Ajuste (+)',
  admin_deduct: 'Ajuste (−)',
};

function getReasonIcon(reason: string, points: number): string {
  if (reason === 'cancelled') return '❌';
  if (reason === 'redemption' || reason === 'redemption_restore') return '🔄';
  if (points > 0) return '⭐';
  return '🔄';
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
  return `Hace ${Math.floor(diffDays / 365)} año${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
}

function formatAbsoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5 flex flex-col gap-1">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

function LoyaltySkeleton() {
  return (
    <div className="space-y-3 px-6 py-4">
      <div className="h-16 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
      <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse w-3/4" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

export default function MiCuentaPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loyaltyError, setLoyaltyError] = useState(false);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingLoyalty, setIsLoadingLoyalty] = useState(true);

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
    loadLoyalty();
  }, [user, router]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const ordersRes = await fetch('/api/orders?limit=50');
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const orders = data.orders ?? [];
        const totalSpent = orders
          .filter((o: { status: string }) => !['cancelled', 'pending'].includes(o.status))
          .reduce((sum: number, o: { total: string }) => sum + parseFloat(o.total), 0);
        setOrderStats({ totalSpent, orderCount: data.total ?? orders.length });
      }
    } catch (err) {
      console.error('Error loading order stats:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadLoyalty = async () => {
    setIsLoadingLoyalty(true);
    setLoyaltyError(false);
    try {
      const res = await fetch('/api/loyalty/transactions');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: LoyaltyData = await res.json();
      setLoyaltyData(data);
    } catch (err) {
      console.error('Error loading loyalty data:', err);
      setLoyaltyError(true);
    } finally {
      setIsLoadingLoyalty(false);
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

  const points = loyaltyData?.total_points ?? 0;
  // Progress toward next 50-point milestone
  const pointsInCycle = points % 50;
  const progressPct = (pointsInCycle / 50) * 100;
  const pointsToNext = 50 - pointsInCycle;

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
              value={String(points)}
              sub={points > 0 ? `= ${formatPrice(points * POINTS_TO_CLP)} de descuento` : 'empieza a acumular'}
            />
          </div>
        )}
      </div>

      {/* ── Section B: Puntos de Fidelización ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400 flex-shrink-0" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Puntos de Fidelización</h2>
          </div>
          {!isLoadingLoyalty && (
            <button
              onClick={loadLoyalty}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Actualizar puntos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {isLoadingLoyalty ? (
          <LoyaltySkeleton />
        ) : loyaltyError ? (
          <div className="px-6 py-8 text-center space-y-3">
            <XCircle className="w-10 h-10 mx-auto text-red-400" />
            <p className="text-slate-600 dark:text-slate-400 text-base font-medium">
              No se pudieron cargar tus puntos
            </p>
            <button
              onClick={loadLoyalty}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors min-h-[48px]"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* Big points summary */}
            <div className="px-6 py-6 bg-amber-50 dark:bg-amber-900/10">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                <div>
                  <p className="text-6xl font-black text-amber-600 dark:text-amber-400 leading-none">
                    {points}
                  </p>
                  <p className="text-base text-amber-700 dark:text-amber-500 mt-1 font-semibold">
                    puntos disponibles
                  </p>
                  {points > 0 && (
                    <p className="text-sm text-amber-600 dark:text-amber-500 mt-0.5">
                      = {formatPrice(points * POINTS_TO_CLP)} de descuento disponible
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 text-sm text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
                    1 punto = {formatPrice(POINTS_TO_CLP)}
                  </span>
                </div>
              </div>

              {/* Progress bar toward next 50-point milestone */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-amber-700 dark:text-amber-500 font-medium">
                  <span>{pointsInCycle} / 50 puntos en este ciclo</span>
                  <span>
                    {pointsInCycle === 0 && points > 0
                      ? '¡Hito alcanzado!'
                      : `Faltan ${pointsToNext} para el próximo hito`}
                  </span>
                </div>
                <div className="w-full h-3 bg-amber-200 dark:bg-amber-900/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${pointsInCycle === 0 && points > 0 ? 100 : progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* CTA info banner */}
            <div className="mx-6 my-4 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>¿Cómo canjear tus puntos?</strong> Selecciona{' '}
                <em>Retiro en tienda</em> en el checkout y activa el toggle de puntos.
              </p>
            </div>

            {/* Transaction history */}
            <div className="border-t border-slate-100 dark:border-slate-700">
              <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Últimos movimientos
                </h3>
              </div>

              {loyaltyData!.transactions.length === 0 ? (
                <div className="px-6 py-10 text-center space-y-2">
                  <Star className="w-12 h-12 mx-auto text-amber-300 dark:text-amber-700" />
                  <p className="text-base font-medium text-slate-600 dark:text-slate-400">
                    Aún no tienes movimientos
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    ¡Empieza a comprar para ganar puntos!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {loyaltyData!.transactions.map((tx) => (
                    <div key={tx.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
                          tx.reason === 'cancelled'
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : tx.points > 0
                            ? 'bg-amber-100 dark:bg-amber-900/30'
                            : 'bg-slate-100 dark:bg-slate-700'
                        }`}
                      >
                        {getReasonIcon(tx.reason, tx.points)}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {REASON_LABELS[tx.reason] ?? tx.reason}
                        </p>
                        <p
                          className="text-sm text-slate-400 dark:text-slate-500 cursor-default"
                          title={formatAbsoluteDate(tx.created_at)}
                        >
                          {formatRelativeDate(tx.created_at)}
                        </p>
                      </div>

                      {/* Points badge */}
                      <span
                        className={`text-lg font-black flex-shrink-0 px-3 py-1 rounded-xl ${
                          tx.reason === 'cancelled'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : tx.points > 0
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
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
