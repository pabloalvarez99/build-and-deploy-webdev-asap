'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Tag, Percent, Gift, Star, TrendingDown, ChevronRight,
  Loader2, CheckCircle2, AlertCircle, Settings, Zap, Trash2,
  ShoppingBag, Users, Coins, ToggleLeft, ToggleRight, Info,
  Package, RefreshCw, ArrowRight,
} from 'lucide-react';

interface DiscountProduct {
  id: string;
  name: string;
  price: string;
  discount_percent: number;
  category_name: string;
  stock: number;
  image_url?: string | null;
}

interface CategorySummary {
  name: string;
  count: number;
  avg_discount: number;
}

interface LoyaltyData {
  enabled: boolean;
  points_per_clp: number;
  clp_per_point: number;
  total_users_with_points: number;
  total_points_in_circulation: number;
  total_clp_equivalent: number;
  recent_transactions: { id: string; points: number; reason: string; user_id: string; created_at: string }[];
}

interface Category { id: string; name: string }

interface Data {
  summary: { total_discounted: number; by_category: CategorySummary[] };
  products: DiscountProduct[];
  categories: Category[];
  loyalty: LoyaltyData;
}

const TABS = [
  { id: 'descuentos', label: 'Descuentos activos', icon: Tag },
  { id: 'aplicar', label: 'Aplicar descuento', icon: Percent },
  { id: 'puntos', label: 'Programa de puntos', icon: Star },
] as const;
type Tab = typeof TABS[number]['id'];

function formatPrice(n: number) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

export default function DescuentosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('descuentos');
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply form state
  const [applyScope, setApplyScope] = useState<'all' | 'category'>('category');
  const [applyCategoryId, setApplyCategoryId] = useState('');
  const [applyPercent, setApplyPercent] = useState<number>(10);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyResult, setApplyResult] = useState<{ updated: number } | null>(null);

  // Remove state
  const [removeScope, setRemoveScope] = useState<'all' | 'category'>('category');
  const [removeCategoryId, setRemoveCategoryId] = useState('');
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeResult, setRemoveResult] = useState<{ updated: number } | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Loyalty config state
  const [loyaltyEdit, setLoyaltyEdit] = useState({ points_per_clp: 1000, clp_per_point: 100, enabled: true });
  const [loyaltySaving, setLoyaltySaving] = useState(false);
  const [loyaltySaved, setLoyaltySaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/descuentos', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar datos');
      const json = await res.json();
      setData(json);
      setLoyaltyEdit({
        points_per_clp: json.loyalty.points_per_clp,
        clp_per_point: json.loyalty.clp_per_point,
        enabled: json.loyalty.enabled,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApply = async () => {
    if (applyScope === 'category' && !applyCategoryId) return;
    setApplyLoading(true);
    setApplyResult(null);
    try {
      const res = await fetch('/api/admin/descuentos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_bulk',
          scope: applyScope,
          category_id: applyCategoryId || undefined,
          discount_percent: applyPercent,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setApplyResult({ updated: json.updated });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleRemove = async () => {
    setRemoveLoading(true);
    setRemoveResult(null);
    setShowRemoveConfirm(false);
    try {
      const res = await fetch('/api/admin/descuentos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_bulk',
          scope: removeScope,
          category_id: removeCategoryId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setRemoveResult({ updated: json.updated });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleSaveLoyalty = async () => {
    setLoyaltySaving(true);
    try {
      const res = await fetch('/api/admin/descuentos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_loyalty', points_per_clp: loyaltyEdit.points_per_clp, clp_per_point: loyaltyEdit.clp_per_point, loyalty_enabled: loyaltyEdit.enabled }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setLoyaltySaved(true);
      setTimeout(() => setLoyaltySaved(false), 3000);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoyaltySaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-rose-500" />
            Descuentos y Fidelización
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gestiona descuentos por producto y el programa de puntos
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Actualizar">
          <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
      )}

      {/* ───────────────── TAB: DESCUENTOS ACTIVOS ───────────────── */}
      {!loading && data && activeTab === 'descuentos' && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 col-span-2 sm:col-span-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Productos con descuento</p>
              <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1">{data.summary.total_discounted}</p>
            </div>
            {data.summary.by_category.slice(0, 3).map(cat => (
              <div key={cat.name} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{cat.name}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{cat.count}</p>
                <p className="text-xs text-rose-500 font-medium">Avg {cat.avg_discount}% off</p>
              </div>
            ))}
          </div>

          {/* Product list */}
          {data.products.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay descuentos activos</p>
              <p className="text-sm mt-1">Usa la pestaña "Aplicar descuento" para agregar</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                  Productos con descuento ({data.products.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[480px] overflow-y-auto">
                {data.products.map(p => {
                  const discountedPrice = Math.round(Number(p.price) * (1 - p.discount_percent / 100));
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.category_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="line-through text-xs text-slate-400">{formatPrice(Number(p.price))}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(discountedPrice)}</span>
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                          -{p.discount_percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────── TAB: APLICAR DESCUENTO ───────────────── */}
      {!loading && data && activeTab === 'aplicar' && (
        <div className="space-y-5">
          {/* Method cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Apply discount */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">Aplicar descuento</h3>
                  <p className="text-xs text-slate-500">Masivo o por categoría</p>
                </div>
              </div>

              {/* Scope selector */}
              <div className="flex gap-2">
                {([['category', 'Por categoría'], ['all', 'Todos los productos']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setApplyScope(val)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      applyScope === val
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {applyScope === 'category' && (
                <select
                  value={applyCategoryId}
                  onChange={e => setApplyCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:border-rose-400 focus:outline-none"
                >
                  <option value="">— Seleccionar categoría —</option>
                  {data.categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}

              {/* Percentage slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Porcentaje de descuento</label>
                  <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{applyPercent}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={70}
                  value={applyPercent}
                  onChange={e => setApplyPercent(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>1%</span>
                  <div className="flex gap-2">
                    {[5, 10, 15, 20, 30, 50].map(v => (
                      <button key={v} onClick={() => setApplyPercent(v)}
                        className={`px-1.5 py-0.5 rounded text-xs transition-colors ${applyPercent === v ? 'bg-rose-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                        {v}%
                      </button>
                    ))}
                  </div>
                  <span>70%</span>
                </div>
              </div>

              {/* Preview */}
              {applyScope === 'category' && applyCategoryId && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/40 rounded-xl px-3 py-2">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  Se aplicará {applyPercent}% de descuento a todos los productos de{' '}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {data.categories.find(c => c.id === applyCategoryId)?.name}
                  </strong>
                </div>
              )}
              {applyScope === 'all' && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Se aplicará {applyPercent}% a <strong>todos los productos activos</strong> de la tienda
                </div>
              )}

              {applyResult && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {applyResult.updated} productos actualizados
                </div>
              )}

              <button
                onClick={handleApply}
                disabled={applyLoading || (applyScope === 'category' && !applyCategoryId)}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                {applyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Percent className="w-4 h-4" />}
                {applyLoading ? 'Aplicando...' : `Aplicar ${applyPercent}% de descuento`}
              </button>
            </div>

            {/* Remove discount */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">Eliminar descuentos</h3>
                  <p className="text-xs text-slate-500">Resetear a precio normal</p>
                </div>
              </div>

              <div className="flex gap-2">
                {([['category', 'Por categoría'], ['all', 'Todos']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setRemoveScope(val)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      removeScope === val
                        ? 'border-slate-700 dark:border-slate-300 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {removeScope === 'category' && (
                <select
                  value={removeCategoryId}
                  onChange={e => setRemoveCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:border-slate-400 focus:outline-none"
                >
                  <option value="">— Seleccionar categoría —</option>
                  {data.categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}

              {removeResult && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {removeResult.updated} descuentos eliminados
                </div>
              )}

              <div className="flex-1" />

              {!showRemoveConfirm ? (
                <button
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={removeScope === 'category' && !removeCategoryId}
                  className="w-full py-3 border-2 border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-40 text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {removeScope === 'all' ? 'Eliminar todos los descuentos' : 'Eliminar descuentos de categoría'}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-600 dark:text-red-400 text-center font-medium">¿Confirmas esta acción?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowRemoveConfirm(false)}
                      className="flex-1 py-2.5 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleRemove} disabled={removeLoading}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {removeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Info block */}
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> Actualmente con descuento
                </p>
                {data.summary.by_category.length === 0 ? (
                  <p className="text-xs text-slate-400">Ningún producto tiene descuento</p>
                ) : data.summary.by_category.map(cat => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">{cat.name}</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">{cat.count} prod · {cat.avg_discount}% avg</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How-it-works */}
          <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 rounded-2xl border border-rose-100 dark:border-rose-800/30 p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-500" /> ¿Cómo funcionan los descuentos?
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: Tag, title: 'Se guarda en el producto', desc: 'El campo discount_percent se aplica automáticamente en la tienda, el POS y el carrito' },
                { icon: TrendingDown, title: 'Precio mostrado', desc: 'La tienda muestra precio tachado + precio final calculado. No es necesario editar cada precio.' },
                { icon: Zap, title: 'Aplicación masiva', desc: 'Puedes aplicar un descuento a cientos de productos en segundos eligiendo categoría o todos.' },
              ].map(item => (
                <div key={item.title} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                    <item.icon className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── TAB: PROGRAMA DE PUNTOS ───────────────── */}
      {!loading && data && activeTab === 'puntos' && (
        <div className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Clientes con puntos', value: data.loyalty.total_users_with_points.toLocaleString('es-CL'), icon: Users, color: 'text-violet-600 dark:text-violet-400' },
              { label: 'Puntos en circulación', value: data.loyalty.total_points_in_circulation.toLocaleString('es-CL'), icon: Coins, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Valor equivalente', value: formatPrice(data.loyalty.total_clp_equivalent), icon: Gift, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Por cada compra de', value: formatPrice(data.loyalty.points_per_clp), icon: Star, color: 'text-rose-600 dark:text-rose-400', suffix: '= 1 pto' },
            ].map(stat => (
              <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
                <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                {'suffix' in stat && <p className="text-xs text-slate-400">{stat.suffix}</p>}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* How points work — visual */}
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl border border-violet-100 dark:border-violet-800/30 p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-violet-500" />
              Cómo funciona el programa (modelo Walmart)
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{formatPrice(data.loyalty.points_per_clp)}</p>
                <p className="text-xs text-slate-500 mt-0.5">de compra</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-amber-500">1 pto</p>
                <p className="text-xs text-slate-500 mt-0.5">ganado</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(data.loyalty.clp_per_point)}</p>
                <p className="text-xs text-slate-500 mt-0.5">de descuento</p>
              </div>
              <div className="flex-1 min-w-[180px] bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Ejemplo</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compra de {formatPrice(50000)} → <span className="text-amber-600 font-bold">50 puntos</span> → <span className="text-emerald-600 font-bold">= {formatPrice(50 * data.loyalty.clp_per_point)}</span> en futuras compras
                </p>
              </div>
            </div>
          </div>

          {/* Config */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" /> Configuración del programa
              </h3>
              {/* Enable toggle */}
              <button
                onClick={() => setLoyaltyEdit(v => ({ ...v, enabled: !v.enabled }))}
                className="flex items-center gap-2 text-sm font-medium transition-colors"
              >
                {loyaltyEdit.enabled ? (
                  <><ToggleRight className="w-8 h-8 text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400">Activo</span></>
                ) : (
                  <><ToggleLeft className="w-8 h-8 text-slate-400" /><span className="text-slate-500">Inactivo</span></>
                )}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Points per CLP */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                  CLP necesarios para ganar 1 punto
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    min={100}
                    max={10000}
                    step={100}
                    value={loyaltyEdit.points_per_clp}
                    onChange={e => setLoyaltyEdit(v => ({ ...v, points_per_clp: Number(e.target.value) }))}
                    className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-violet-400 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-slate-400">Walmart usa $1.000 CLP = 1 punto</p>
              </div>

              {/* CLP per point */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                  Valor de 1 punto en CLP
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    step={10}
                    value={loyaltyEdit.clp_per_point}
                    onChange={e => setLoyaltyEdit(v => ({ ...v, clp_per_point: Number(e.target.value) }))}
                    className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-violet-400 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-slate-400">Actualmente 1 punto = $100 CLP</p>
              </div>
            </div>

            {/* Rate preview */}
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 text-xs text-violet-700 dark:text-violet-300">
              <strong>Tasa efectiva:</strong> Por cada {formatPrice(loyaltyEdit.points_per_clp)} gastados, el cliente recupera{' '}
              {formatPrice(loyaltyEdit.clp_per_point)} ({((loyaltyEdit.clp_per_point / loyaltyEdit.points_per_clp) * 100).toFixed(2)}% de cashback)
            </div>

            <button
              onClick={handleSaveLoyalty}
              disabled={loyaltySaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
            >
              {loyaltySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : loyaltySaved ? <CheckCircle2 className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
              {loyaltySaved ? '¡Guardado!' : loyaltySaving ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>

          {/* Recent transactions */}
          {data.loyalty.recent_transactions.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Últimas transacciones de puntos</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.loyalty.recent_transactions.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      t.points > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <span className={`text-xs font-bold ${t.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.points > 0 ? '+' : ''}{t.points}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{t.reason}</p>
                      <p className="text-xs text-slate-400">{t.user_id.slice(0, 8)}… · {new Date(t.created_at).toLocaleDateString('es-CL')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
