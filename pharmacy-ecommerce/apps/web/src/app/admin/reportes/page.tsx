'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/format';
import { Download, TrendingUp, ShoppingBag, Calculator, Package } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ReportData {
  kpis: { totalRevenue: number; totalOrders: number; avgTicket: number };
  salesByDay: { date: string; ventas: number; ordenes: number }[];
  topProducts: { name: string; units: number; revenue: number; category: string }[];
  byCategory: { name: string; revenue: number; units: number }[];
}

const PERIODS = [
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
];

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];

function getFromDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export default function AdminReportesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const from = getFromDate(period);
      const to = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/admin/reportes?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json());
    } catch {
      // Silently fail, show empty state
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    loadData();
  }, [user, router, loadData]);

  const exportCSV = () => {
    if (!data) return;
    const headers = ['Producto', 'Categoría', 'Unidades vendidas', 'Revenue (CLP)'];
    const rows = data.topProducts.map(p => [p.name, p.category, p.units, Math.round(p.revenue)]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reportes_${getFromDate(period)}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!user || user.role !== 'admin') return null;

  const kpiCards = data ? [
    { label: 'Revenue total', value: formatPrice(data.kpis.totalRevenue), icon: TrendingUp, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    { label: 'Órdenes pagadas', value: String(data.kpis.totalOrders), icon: ShoppingBag, bg: 'bg-blue-100', color: 'text-blue-600' },
    { label: 'Ticket promedio', value: formatPrice(data.kpis.avgTicket), icon: Calculator, bg: 'bg-purple-100', color: 'text-purple-600' },
    { label: 'Productos distintos', value: String(data.topProducts.length), icon: Package, bg: 'bg-orange-100', color: 'text-orange-600' },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Reportes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Ventas reales · solo órdenes pagadas/procesadas/enviadas/entregadas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                period === p.days
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={exportCSV}
            disabled={loading || !data}
            className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map(kpi => (
              <div key={kpi.label} className="card p-5">
                <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Sales by day line chart */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Ventas por día</h3>
              {data.salesByDay.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500 text-sm py-10 text-center">Sin datos para este período</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.salesByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="date"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickFormatter={d => d.slice(5)}
                      />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(v) => [formatPrice(Number(v)), 'Ventas']} />
                      <Line
                        type="monotone"
                        dataKey="ventas"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* By category pie */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Revenue por categoría</h3>
              {data.byCategory.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500 text-sm py-10 text-center">Sin datos para este período</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.byCategory.slice(0, 8)}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        label={false}
                        labelLine={false}
                      >
                        {data.byCategory.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatPrice(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Top products horizontal bar */}
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Top 10 productos más vendidos (unidades)</h3>
            {data.topProducts.length === 0 ? (
              <p className="text-slate-400 text-sm py-10 text-center">Sin datos para este período</p>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.topProducts.slice(0, 10)}
                    layout="vertical"
                    margin={{ left: 10, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={200}
                      stroke="#94A3B8"
                      fontSize={10}
                      tickFormatter={n => n.length > 25 ? n.slice(0, 25) + '…' : n}
                    />
                    <Tooltip />
                    <Bar dataKey="units" fill="#10B981" radius={[0, 4, 4, 0]} name="Unidades" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Detail table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Detalle por producto</h3>
              <span className="text-sm text-slate-400 dark:text-slate-500">{data.topProducts.length} productos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    {['#', 'Producto', 'Categoría', 'Unidades', 'Revenue'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {data.topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500 font-mono">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{p.category}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-700 dark:text-slate-300">{p.units}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">{formatPrice(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card p-12 text-center text-slate-400 dark:text-slate-500">
          No hay datos para el período seleccionado
        </div>
      )}
    </div>
  );
}
