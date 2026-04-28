'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { isOwnerRole } from '@/lib/roles';
import { formatPrice } from '@/lib/format';
import {
  TrendingUp, DollarSign, AlertTriangle, CheckCircle, Search, Download,
  Settings, Save, X, ChevronDown, ChevronUp,
} from 'lucide-react';

interface OverheadSettings {
  overhead_rent: number;
  overhead_golan: number;
  overhead_accountant: number;
  overhead_salaries: number;
  overhead_other: number;
  overhead_tax_rate: number;
  overhead_sales_target: number;
  overhead_margin_alert: number;
}

interface CostSummary {
  overhead_total: number;
  overhead_pct: number;
  sales_target: number;
  products_green: number;
  products_amber: number;
  products_red: number;
  products_no_cost: number;
}

interface CostItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  cost_price: number | null;
  discount_percent: number | null;
  discounted_price: number;
  stock: number;
  category: string | null;
  gross_margin: number | null;
  net_margin: number | null;
  net_margin_pct: number | null;
  overhead_per_unit: number;
  status: 'green' | 'amber' | 'red' | 'no_cost';
}

type SortField = 'name' | 'price' | 'cost_price' | 'net_margin_pct' | 'net_margin';

export default function CostosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<CostItem[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [settings, setSettings] = useState<OverheadSettings>({
    overhead_rent: 0, overhead_golan: 0, overhead_accountant: 0,
    overhead_salaries: 0, overhead_other: 0, overhead_tax_rate: 19,
    overhead_sales_target: 1, overhead_margin_alert: 10,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'red' | 'amber' | 'green' | 'no_cost'>('');
  const [sortField, setSortField] = useState<SortField>('net_margin_pct');
  const [sortAsc, setSortAsc] = useState(true);
  const [simDiscount, setSimDiscount] = useState(0);

  useEffect(() => {
    if (!user || !isOwnerRole(user.role)) { router.push('/'); return; }
    load();
  }, [user, router]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/costos');
      if (!res.ok) throw new Error('Error loading');
      const data = await res.json();
      setSettings(data.settings);
      setSummary(data.summary);
      setItems(data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/costos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Error saving');
      await load();
      setShowSettings(false);
    } catch (e) {
      alert('Error guardando configuración');
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    let list = items;
    if (search) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter) list = list.filter((i) => i.status === statusFilter);
    list = [...list].sort((a, b) => {
      let av: number | null | string = a[sortField] as number | null | string;
      let bv: number | null | string = b[sortField] as number | null | string;
      if (av === null) av = sortAsc ? Infinity : -Infinity;
      if (bv === null) bv = sortAsc ? Infinity : -Infinity;
      if (typeof av === 'string') return sortAsc ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [items, search, statusFilter, sortField, sortAsc]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  }

  function statusBadge(status: CostItem['status']) {
    if (status === 'green') return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Buen margen</span>;
    if (status === 'amber') return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Margen bajo</span>;
    if (status === 'red') return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Negativo</span>;
    return <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">Sin costo</span>;
  }

  function exportCSV() {
    const headers = ['Nombre', 'Categoría', 'Precio venta', 'Costo', 'Margen bruto', 'Overhead/u', 'Margen neto', 'Margen neto %', 'Estado'];
    const rows = filtered.map((i) => [
      i.name, i.category ?? '',
      i.price, i.cost_price ?? '', i.gross_margin ?? '', i.overhead_per_unit,
      i.net_margin ?? '', i.net_margin_pct ?? '', i.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'costos.csv'; a.click();
  }

  // Simulator: apply discount to items and recalc
  const simItems = useMemo(() => {
    if (simDiscount === 0) return null;
    return filtered.map((item) => {
      const simPrice = item.price * (1 - simDiscount / 100);
      const taxRate = settings.overhead_tax_rate;
      const priceAfterTax = simPrice / (1 + taxRate / 100);
      const overheadPct = settings.overhead_sales_target > 0
        ? settings.overhead_rent + settings.overhead_golan + settings.overhead_accountant +
          settings.overhead_salaries + settings.overhead_other
        : 0;
      const overheadPerUnit = settings.overhead_sales_target > 0
        ? (overheadPct / settings.overhead_sales_target) * simPrice
        : 0;
      const grossMargin = item.cost_price !== null ? priceAfterTax - item.cost_price : null;
      const netMargin = grossMargin !== null ? grossMargin - overheadPerUnit : null;
      const netMarginPct = netMargin !== null && simPrice > 0 ? (netMargin / simPrice) * 100 : null;
      return { ...item, netMarginPct };
    });
  }, [simDiscount, filtered, settings]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Análisis de Costos</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Margen neto por producto incluido overhead operacional</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
            <Settings className="w-4 h-4" /> Costos fijos
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Overhead config — modal overlay (no layout shift) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Costos Fijos Mensuales</h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'overhead_rent', label: 'Arriendo' },
                { key: 'overhead_golan', label: 'ERP (Golan)' },
                { key: 'overhead_accountant', label: 'Contador' },
                { key: 'overhead_salaries', label: 'Sueldos + imposiciones' },
                { key: 'overhead_other', label: 'Otros fijos' },
                { key: 'overhead_tax_rate', label: 'Tasa IVA (%)' },
                { key: 'overhead_sales_target', label: 'Venta objetivo mensual' },
                { key: 'overhead_margin_alert', label: 'Alerta margen mín. (%)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
                  <input
                    type="number"
                    value={settings[key as keyof OverheadSettings]}
                    onChange={(e) => setSettings({ ...settings, [key]: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
              <button onClick={saveSettings} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Overhead mensual</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatPrice(summary.overhead_total)}</p>
            <p className="text-xs text-slate-500 mt-1">{summary.overhead_pct}% sobre venta objetivo</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Margen OK (&gt;10%)</p>
            <p className="text-2xl font-bold text-green-600">{summary.products_green}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Margen bajo (0-10%)</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.products_amber}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Margen negativo</p>
            <p className="text-2xl font-bold text-red-600">{summary.products_red}</p>
          </div>
        </div>
      )}

      {/* Simulator */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Simulador de descuento:</span>
          <input
            type="range" min={0} max={50} step={1} value={simDiscount}
            onChange={(e) => setSimDiscount(parseInt(e.target.value))}
            className="flex-1 min-w-32 max-w-xs"
          />
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 w-12">{simDiscount}%</span>
          {simDiscount > 0 && simItems && (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              → {simItems.filter((i) => (i.netMarginPct ?? 0) > 10).length} OK / {simItems.filter((i) => (i.netMarginPct ?? 0) < 0).length} negativos
            </span>
          )}
          {simDiscount > 0 && <button onClick={() => setSimDiscount(0)} className="text-xs text-slate-500 hover:text-slate-700"><X className="w-3 h-3" /></button>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Buscar producto..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm"
          />
        </div>
        {(['', 'green', 'amber', 'red', 'no_cost'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
              statusFilter === s
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {s === '' ? 'Todos' : s === 'green' ? '✓ Buen margen' : s === 'amber' ? '⚠ Margen bajo' : s === 'red' ? '✗ Negativo' : 'Sin costo'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1">Producto <SortIcon field="name" /></button>
                </th>
                <th className="text-right px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                  <button onClick={() => toggleSort('price')} className="flex items-center gap-1 ml-auto">Precio <SortIcon field="price" /></button>
                </th>
                <th className="text-right px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                  <button onClick={() => toggleSort('cost_price')} className="flex items-center gap-1 ml-auto">Costo <SortIcon field="cost_price" /></button>
                </th>
                <th className="text-right px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">G. fijos/u</th>
                <th className="text-right px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                  <button onClick={() => toggleSort('net_margin')} className="flex items-center gap-1 ml-auto">Margen neto <SortIcon field="net_margin" /></button>
                </th>
                <th className="text-right px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                  <button onClick={() => toggleSort('net_margin_pct')} className="flex items-center gap-1 ml-auto">% <SortIcon field="net_margin_pct" /></button>
                </th>
                <th className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((item, idx) => {
                const sim = simItems?.[idx];
                const simPct = sim?.netMarginPct;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-xs">{item.name}</div>
                      {item.category && <div className="text-xs text-slate-500">{item.category}</div>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatPrice(item.price)}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                      {item.cost_price !== null ? formatPrice(item.cost_price) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{formatPrice(item.overhead_per_unit)}</td>
                    <td className="px-4 py-3 text-right">
                      {item.net_margin !== null ? (
                        <span className={item.net_margin < 0 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}>
                          {formatPrice(item.net_margin)}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.net_margin_pct !== null ? (
                        <div>
                          <span className={`font-medium ${item.net_margin_pct < 0 ? 'text-red-600' : item.net_margin_pct < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {item.net_margin_pct}%
                          </span>
                          {simDiscount > 0 && simPct !== null && simPct !== undefined && (
                            <div className={`text-xs ${simPct < 0 ? 'text-red-500' : simPct < 10 ? 'text-yellow-500' : 'text-green-500'}`}>
                              → {Math.round(simPct * 10) / 10}%
                            </div>
                          )}
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">{statusBadge(item.status)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-500">
          {filtered.length} de {items.length} productos
        </div>
      </div>
    </div>
  );
}
