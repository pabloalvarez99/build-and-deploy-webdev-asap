'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/format';
import { Download, TrendingUp, ShoppingBag, Calculator, Package, TrendingDown, Store, Globe } from 'lucide-react';
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
  Legend,
} from 'recharts';

interface ReportData {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    avgTicket: number;
    totalCost: number;
    grossMargin: number;
    marginPct: number;
  };
  prevKpis?: {
    totalRevenue: number;
    totalOrders: number;
    avgTicket: number;
  };
  channelBreakdown: {
    online: { orders: number; revenue: number };
    pos: { orders: number; revenue: number; cash: number; debit: number; credit: number };
  };
  salesByDay: { date: string; ventas: number; ordenes: number; ventas_pos: number; ordenes_pos: number }[];
  topProducts: {
    name: string; units: number; revenue: number; cost: number;
    has_cost: boolean; category: string; margin: number | null; margin_pct: number | null;
  }[];
  topByMargin: {
    name: string; units: number; revenue: number; cost: number;
    has_cost: boolean; category: string; margin: number | null; margin_pct: number | null;
  }[];
  byCategory: { name: string; revenue: number; units: number; cost: number; margin: number }[];
}

const PERIODS = [
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
];

const TABS = [
  { id: 'ventas', label: 'Ventas' },
  { id: 'financiero', label: 'Financiero' },
];

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];

function getFromDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function pct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

function deltaPct(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

function DeltaBadge({ curr, prev }: { curr: number; prev: number }) {
  const d = deltaPct(curr, prev);
  if (d === null) return null;
  const positive = d >= 0;
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${positive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
      {positive ? '▲' : '▼'} {Math.abs(d).toFixed(1)}%
    </span>
  );
}

export default function AdminReportesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [period, setPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState<'ventas' | 'financiero'>('ventas');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const from = getFromDate(period);
      const to = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/admin/reportes?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json());
    } catch {
      // Silently fail
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
    const headers = ['Producto', 'Categoría', 'Unidades', 'Revenue (CLP)', 'Costo (CLP)', 'Margen (CLP)', '% Margen'];
    const rows = data.topProducts.map((p) => [
      p.name, p.category, p.units,
      Math.round(p.revenue),
      p.has_cost ? Math.round(p.cost) : '',
      p.margin !== null ? Math.round(p.margin) : '',
      p.margin_pct !== null ? p.margin_pct.toFixed(1) + '%' : '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reportes_financieros_${getFromDate(period)}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!user || user.role !== 'admin') return null;

  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const axisColor = isDark ? '#64748B' : '#94A3B8';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Reportes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Órdenes online + ventas POS</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PERIODS.map((p) => (
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
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'ventas' | 'financiero')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPI cards — always visible */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Revenue total', value: formatPrice(data.kpis.totalRevenue), icon: TrendingUp, bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400', curr: data.kpis.totalRevenue, prev: data.prevKpis?.totalRevenue },
              { label: 'Órdenes', value: String(data.kpis.totalOrders), icon: ShoppingBag, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400', curr: data.kpis.totalOrders, prev: data.prevKpis?.totalOrders },
              { label: 'Ticket promedio', value: formatPrice(data.kpis.avgTicket), icon: Calculator, bg: 'bg-purple-100 dark:bg-purple-900/30', color: 'text-purple-600 dark:text-purple-400', curr: data.kpis.avgTicket, prev: data.prevKpis?.avgTicket },
              { label: 'Costo total', value: data.kpis.totalCost > 0 ? formatPrice(data.kpis.totalCost) : '—', icon: TrendingDown, bg: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-500 dark:text-red-400', curr: null, prev: null },
              { label: 'Margen bruto', value: data.kpis.grossMargin > 0 ? formatPrice(data.kpis.grossMargin) : '—', icon: TrendingUp, bg: 'bg-teal-100 dark:bg-teal-900/30', color: 'text-teal-600 dark:text-teal-400', curr: null, prev: null },
              { label: '% Margen', value: data.kpis.marginPct > 0 ? pct(data.kpis.marginPct) : '—', icon: Package, bg: 'bg-orange-100 dark:bg-orange-900/30', color: 'text-orange-600 dark:text-orange-400', curr: null, prev: null },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5">
                <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{kpi.value}</p>
                {kpi.curr != null && kpi.prev != null && (
                  <div className="mt-1.5">
                    <DeltaBadge curr={kpi.curr} prev={kpi.prev} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {activeTab === 'ventas' && (
            <>
              {/* Channel breakdown */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Canal Online</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(data.channelBreakdown.online.revenue)}</p>
                    <p className="text-xs text-slate-400">{data.channelBreakdown.online.orders} órdenes</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Canal POS</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(data.channelBreakdown.pos.revenue)}</p>
                    <p className="text-xs text-slate-400">
                      {data.channelBreakdown.pos.orders} ventas ·{' '}
                      {data.channelBreakdown.pos.cash} efect. ·{' '}
                      {data.channelBreakdown.pos.debit} déb. ·{' '}
                      {data.channelBreakdown.pos.credit} créd.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sales by day stacked line */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Ventas por día (Online vs POS)</h3>
                {data.salesByDay.length === 0 ? (
                  <p className="text-slate-400 text-sm py-10 text-center">Sin datos para este período</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.salesByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="date" stroke={axisColor} fontSize={11} tickFormatter={(d) => d.slice(5)} />
                        <YAxis stroke={axisColor} fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => [formatPrice(Number(v))]} />
                        <Legend />
                        <Line type="monotone" dataKey="ventas" stroke="#3B82F6" strokeWidth={2} dot={false} name="Online" />
                        <Line type="monotone" dataKey="ventas_pos" stroke="#10B981" strokeWidth={2} dot={false} name="POS" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* By category pie */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Revenue por categoría</h3>
                  {data.byCategory.length === 0 ? (
                    <p className="text-slate-400 text-sm py-10 text-center">Sin datos</p>
                  ) : (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data.byCategory.slice(0, 8)} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={false} labelLine={false}>
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

                {/* Top products bar */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Top 10 por unidades</h3>
                  {data.topProducts.length === 0 ? (
                    <p className="text-slate-400 text-sm py-10 text-center">Sin datos</p>
                  ) : (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topProducts.slice(0, 10)} layout="vertical" margin={{ left: 0, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                          <XAxis type="number" stroke={axisColor} fontSize={10} />
                          <YAxis dataKey="name" type="category" width={160} stroke={axisColor} fontSize={9} tickFormatter={(n) => n.length > 20 ? n.slice(0, 20) + '…' : n} />
                          <Tooltip />
                          <Bar dataKey="units" fill="#10B981" radius={[0, 4, 4, 0]} name="Unidades" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Detail table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Detalle por producto</h3>
                  <span className="text-sm text-slate-400">{data.topProducts.length} productos</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        {['#', 'Producto', 'Categoría', 'Uds.', 'Revenue', 'Margen'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {data.topProducts.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="px-4 py-3 text-sm text-slate-400 font-mono">{i + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{p.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{p.category}</td>
                          <td className="px-4 py-3 text-sm font-mono text-slate-700 dark:text-slate-300">{p.units}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">{formatPrice(p.revenue)}</td>
                          <td className="px-4 py-3 text-sm">
                            {p.margin_pct !== null ? (
                              <span className={`font-semibold ${p.margin_pct >= 20 ? 'text-emerald-600 dark:text-emerald-400' : p.margin_pct >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                {pct(p.margin_pct)}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-xs">sin costo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'financiero' && (
            <>
              {/* Margin note */}
              {data.kpis.totalCost === 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-5 py-4 text-sm text-amber-700 dark:text-amber-400">
                  Los márgenes requieren que los productos tengan <strong>precio de costo</strong> registrado (se ingresa al recibir una OC de compra).
                </div>
              )}

              {/* Top products by margin bar chart */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Top 10 productos por margen bruto</h3>
                {data.topByMargin.length === 0 ? (
                  <p className="text-slate-400 text-sm py-10 text-center">Sin datos de costo para calcular márgenes</p>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.topByMargin} layout="vertical" margin={{ left: 0, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                        <XAxis type="number" stroke={axisColor} fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <YAxis dataKey="name" type="category" width={170} stroke={axisColor} fontSize={9} tickFormatter={(n) => n.length > 22 ? n.slice(0, 22) + '…' : n} />
                        <Tooltip formatter={(v) => [formatPrice(Number(v))]} />
                        <Bar dataKey="margin" name="Margen" radius={[0, 4, 4, 0]}>
                          {data.topByMargin.map((entry, i) => (
                            <Cell key={i} fill={(entry.margin ?? 0) >= 0 ? '#10B981' : '#EF4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Category margin */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Revenue vs Costo por categoría</h3>
                {data.byCategory.length === 0 ? (
                  <p className="text-slate-400 text-sm py-10 text-center">Sin datos</p>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.byCategory.slice(0, 10)} layout="vertical" margin={{ left: 0, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                        <XAxis type="number" stroke={axisColor} fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <YAxis dataKey="name" type="category" width={150} stroke={axisColor} fontSize={10} tickFormatter={(n) => n.length > 18 ? n.slice(0, 18) + '…' : n} />
                        <Tooltip formatter={(v) => [formatPrice(Number(v))]} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" radius={[0, 2, 2, 0]} />
                        <Bar dataKey="cost" name="Costo" fill="#EF4444" radius={[0, 2, 2, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Financial detail table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Tabla financiera por producto</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        {['Producto', 'Categoría', 'Uds.', 'Revenue', 'Costo', 'Margen $', '% Margen'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {data.topProducts.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-[200px] truncate">{p.name}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.category}</td>
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{p.units}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{formatPrice(p.revenue)}</td>
                          <td className="px-4 py-3 text-red-600 dark:text-red-400">
                            {p.has_cost ? formatPrice(p.cost) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {p.margin !== null
                              ? <span className={p.margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{formatPrice(p.margin)}</span>
                              : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="px-4 py-3 font-bold">
                            {p.margin_pct !== null ? (
                              <span className={`${p.margin_pct >= 20 ? 'text-emerald-600 dark:text-emerald-400' : p.margin_pct >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                {pct(p.margin_pct)}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-12 text-center text-slate-400 dark:text-slate-500">
          No hay datos para el período seleccionado
        </div>
      )}
    </div>
  );
}
