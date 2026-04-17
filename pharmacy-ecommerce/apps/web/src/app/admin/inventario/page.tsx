'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/format';
import {
  Warehouse, Search, Download, AlertTriangle, Package, TrendingUp,
  ChevronDown, ChevronUp, ArrowUpDown, DollarSign, X,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  slug: string;
  stock: number;
  price: number;
  cost_price: number | null;
  retail_value: number;
  cost_value: number | null;
  margin_pct: number | null;
  category: string;
  low_stock: boolean;
  supplier: { id: string; name: string; code: string | null } | null;
}

interface InventorySummary {
  total_products: number;
  products_with_cost: number;
  total_retail_value: number;
  total_cost_value: number;
  gross_margin_value: number;
  margin_pct: number;
  low_stock_threshold: number;
}

type SortField = 'name' | 'stock' | 'price' | 'cost_price' | 'retail_value' | 'margin_pct';

export default function InventarioPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'' | 'low' | 'out' | 'no_cost'>('');
  const [sortField, setSortField] = useState<SortField>('retail_value');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    loadInventory();
  }, [user, router]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setItems(data.items);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(field === 'name'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
    return sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />;
  };

  const filtered = useMemo(() => {
    let arr = items;
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || (i.supplier?.name || '').toLowerCase().includes(q));
    }
    if (filter === 'low') arr = arr.filter(i => i.low_stock && i.stock > 0);
    else if (filter === 'out') arr = arr.filter(i => i.stock === 0);
    else if (filter === 'no_cost') arr = arr.filter(i => i.cost_price === null);

    return [...arr].sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0;
      switch (sortField) {
        case 'name': va = a.name; vb = b.name; break;
        case 'stock': va = a.stock; vb = b.stock; break;
        case 'price': va = a.price; vb = b.price; break;
        case 'cost_price': va = a.cost_price ?? -1; vb = b.cost_price ?? -1; break;
        case 'retail_value': va = a.retail_value; vb = b.retail_value; break;
        case 'margin_pct': va = a.margin_pct ?? -999; vb = b.margin_pct ?? -999; break;
      }
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [items, search, filter, sortField, sortAsc]);

  const exportCSV = () => {
    const headers = ['Producto', 'Categoría', 'Proveedor', 'Stock', 'Precio Venta', 'Precio Costo', 'Valor Retail', 'Valor Costo', '% Margen'];
    const rows = filtered.map(i => [
      i.name, i.category, i.supplier?.name ?? '',
      i.stock, i.price, i.cost_price ?? '',
      Math.round(i.retail_value), i.cost_value != null ? Math.round(i.cost_value) : '',
      i.margin_pct != null ? i.margin_pct.toFixed(1) + '%' : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const outOfStock = items.filter(i => i.stock === 0).length;
  const lowStock = items.filter(i => i.low_stock && i.stock > 0).length;
  const noCost = items.filter(i => i.cost_price === null).length;

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Warehouse className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Inventario</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Valorización y estado del stock</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          disabled={loading || filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="animate-pulse h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Valor retail total</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{formatPrice(summary.total_retail_value)}</p>
            <p className="text-xs text-slate-400 mt-1">{summary.total_products} productos activos</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Valor costo total</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {summary.total_cost_value > 0 ? formatPrice(summary.total_cost_value) : '—'}
            </p>
            <p className="text-xs text-slate-400 mt-1">{summary.products_with_cost} productos con costo</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5">
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Margen bruto en stock</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {summary.gross_margin_value > 0 ? formatPrice(summary.gross_margin_value) : '—'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {summary.margin_pct > 0 ? `${summary.margin_pct.toFixed(1)}% margen` : 'Sin datos de costo'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Alertas de stock</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{outOfStock + lowStock}</p>
            <p className="text-xs text-slate-400 mt-1">{outOfStock} sin stock · {lowStock} bajo mínimo</p>
          </div>
        </div>
      ) : null}

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto, categoría o proveedor..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {(['', 'low', 'out', 'no_cost'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors whitespace-nowrap ${
              filter === f
                ? f === '' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                           : f === 'out' ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                           : f === 'low' ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                           : 'border-slate-400 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            {f === '' ? `Todos (${items.length})` : f === 'low' ? `Bajo mínimo (${lowStock})` : f === 'out' ? `Sin stock (${outOfStock})` : `Sin costo (${noCost})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">Cargando inventario...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">Sin resultados</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 text-xs text-slate-400">
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
              {filter || search ? ' (filtrado)' : ''}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    {([
                      { key: 'name', label: 'Producto' },
                      { key: null, label: 'Categoría' },
                      { key: null, label: 'Proveedor' },
                      { key: 'stock', label: 'Stock' },
                      { key: 'price', label: 'P. Venta' },
                      { key: 'cost_price', label: 'P. Costo' },
                      { key: 'retail_value', label: 'Valor Retail' },
                      { key: 'margin_pct', label: '% Margen' },
                    ] as { key: SortField | null; label: string }[]).map(({ key, label }) => (
                      <th
                        key={label}
                        onClick={() => key && handleSort(key)}
                        className={`px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap ${key ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none' : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          {key && <SortIcon field={key} />}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map((item) => (
                    <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${item.stock === 0 ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-[220px] truncate">
                        {item.name}
                        {item.low_stock && item.stock > 0 && (
                          <span className="ml-2 text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">bajo</span>
                        )}
                        {item.stock === 0 && (
                          <span className="ml-2 text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-semibold">agotado</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.category}</td>
                      <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">
                        {item.supplier ? item.supplier.name : <span className="text-slate-200 dark:text-slate-700">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={item.stock === 0 ? 'text-red-500 dark:text-red-400' : item.low_stock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatPrice(item.price)}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {item.cost_price != null ? formatPrice(item.cost_price) : <span className="text-slate-300 dark:text-slate-600 text-xs">sin costo</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {formatPrice(item.retail_value)}
                      </td>
                      <td className="px-4 py-3 font-bold whitespace-nowrap">
                        {item.margin_pct != null ? (
                          <span className={item.margin_pct >= 20 ? 'text-emerald-600 dark:text-emerald-400' : item.margin_pct >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}>
                            {item.margin_pct.toFixed(1)}%
                          </span>
                        ) : <span className="text-slate-300 dark:text-slate-600 text-xs font-normal">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/productos?search=${encodeURIComponent(item.name.slice(0, 30))}`}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Quick links */}
      {!loading && (outOfStock > 0 || lowStock > 0) && (
        <div className="flex flex-wrap gap-3">
          {outOfStock > 0 && (
            <Link
              href="/admin/productos?stock=out"
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              {outOfStock} sin stock — gestionar
            </Link>
          )}
          {lowStock > 0 && (
            <Link
              href="/admin/productos?stock=low"
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              {lowStock} bajo mínimo — gestionar
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
