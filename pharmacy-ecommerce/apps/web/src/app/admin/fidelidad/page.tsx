'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { isAdminRole } from '@/lib/roles';
import { formatPrice } from '@/lib/format';
import { POINTS_TO_CLP } from '@/lib/loyalty-utils';
import {
  Star,
  Users,
  Wallet,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface StatsData {
  kpis: {
    totalMembers: number;
    totalPoints: number;
    totalClp: number;
    redemptionRate: number;
  };
  topClients: {
    id: string;
    name: string;
    loyalty_points: number;
    clp_value: number;
    tx_count: number;
  }[];
  recentTransactions: {
    id: string;
    user_id: string;
    profile_name: string;
    points: number;
    reason: string;
    order_id: string | null;
    created_at: string;
  }[];
  monthlyChart: {
    month: string;
    otorgados: number;
    canjeados: number;
  }[];
}

function formatMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });
}

export default function FidelidadPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (!isAdminRole(user.role)) { router.push('/'); return; }
    fetchStats();
  }, [user]);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/loyalty/stats');
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <p className="text-red-600 dark:text-red-400">{error ?? 'Sin datos'}</p>
        <button onClick={fetchStats} className="mt-2 text-sm text-emerald-600 underline">Reintentar</button>
      </div>
    );
  }

  const { kpis, topClients, recentTransactions, monthlyChart } = data;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
            <Star className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Programa de Fidelización</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">1 punto por cada $1.000 • 1 punto = {formatPrice(POINTS_TO_CLP)}</p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          label="Miembros con puntos"
          value={kpis.totalMembers.toLocaleString('es-CL')}
          bg="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <KpiCard
          icon={<Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          label="Puntos pendientes"
          value={kpis.totalPoints.toLocaleString('es-CL')}
          bg="bg-amber-50 dark:bg-amber-900/20"
        />
        <KpiCard
          icon={<Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          label="Valor CLP acumulado"
          value={formatPrice(kpis.totalClp)}
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          label="Tasa de canje"
          value={`${kpis.redemptionRate}%`}
          bg="bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Puntos otorgados vs canjeados — últimos 6 meses
        </h2>
        {monthlyChart.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">Sin datos de transacciones</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyChart.map((d) => ({ ...d, month: formatMonth(d.month) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(val) => [String(Number(val).toLocaleString('es-CL')) + ' pts']} />
              <Legend />
              <Bar dataKey="otorgados" name="Otorgados" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="canjeados" name="Canjeados" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top clients + recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 clients */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Top 10 clientes</h2>
          {topClients.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">Sin clientes con puntos</p>
          ) : (
            <div className="space-y-2">
              {topClients.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-400 text-white' :
                    i === 1 ? 'bg-slate-400 text-white' :
                    i === 2 ? 'bg-orange-400 text-white' :
                    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{c.tx_count} transacciones</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {c.loyalty_points.toLocaleString('es-CL')} pts
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatPrice(c.clp_value)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Últimas 20 transacciones</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">Sin transacciones</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  {t.points > 0 ? (
                    <ArrowUpCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <ArrowDownCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{t.profile_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${t.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {t.points > 0 ? '+' : ''}{t.points.toLocaleString('es-CL')} pts
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(t.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl p-4 border border-slate-200 dark:border-slate-700`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}
