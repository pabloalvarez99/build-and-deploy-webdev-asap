'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  RefreshCw, AlertTriangle, Loader2, CheckCircle2, AlertCircle,
  Package, TrendingDown, ShoppingCart, ChevronRight, X,
  Sliders, ArrowRight, ExternalLink, Info, Scale,
} from 'lucide-react';

interface Suggestion {
  id: string;
  name: string;
  stock: number;
  units_sold_30d: number;
  avg_daily_units: number;
  dias_inventario: number | null;
  suggested_qty: number;
  cost_price: number | null;
  estimated_cost: number | null;
  category: string;
  image_url: string | null;
  urgency: 'critico' | 'alto' | 'medio';
  supplier: { id: string; name: string } | null;
}

interface Supplier { id: string; name: string }

interface Data {
  suggestions: Suggestion[];
  suppliers: Supplier[];
  meta: { total: number; critico: number; alto: number; medio: number; total_estimated_cost: number };
}

interface BestPrice {
  product_id: string;
  best_supplier: string;
  best_price: number;
  saving_pct: number;
}

function formatPrice(n: number) { return '$' + Math.round(n).toLocaleString('es-CL'); }

const URGENCY = {
  critico: { label: 'Crítico', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', dot: 'bg-red-500', border: 'border-red-200 dark:border-red-800' },
  alto: { label: 'Urgente', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800' },
  medio: { label: 'Bajo stock', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', dot: 'bg-blue-400', border: 'border-blue-100 dark:border-blue-800' },
};

export default function ReposicionPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bestPrices, setBestPrices] = useState<Map<string, BestPrice>>(new Map());
  const [targetDays, setTargetDays] = useState(30);
  const [thresholdDays, setThresholdDays] = useState(14);
  const [showConfig, setShowConfig] = useState(false);
  const [filterUrgency, setFilterUrgency] = useState<'all' | 'critico' | 'alto' | 'medio'>('all');
  const [filterSupplier, setFilterSupplier] = useState('');

  // Selection for PO creation
  const [selected, setSelected] = useState<Map<string, { qty: number; unit_cost: number; name: string }>>(new Map());
  const [showPOModal, setShowPOModal] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [creatingPO, setCreatingPO] = useState(false);
  const [poResult, setPoResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reposRes, pricesRes] = await Promise.all([
        fetch(`/api/admin/reposicion?target_days=${targetDays}&threshold_days=${thresholdDays}`, { credentials: 'include' }),
        fetch('/api/admin/supplier-prices/compare', { credentials: 'include' }),
      ]);
      if (!reposRes.ok) throw new Error('Error al cargar datos');
      setData(await reposRes.json());
      setSelected(new Map());
      if (pricesRes.ok) {
        const priceData = await pricesRes.json();
        const map = new Map<string, BestPrice>();
        for (const row of priceData.rows ?? []) {
          map.set(row.product_id, row as BestPrice);
        }
        setBestPrices(map);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [targetDays, thresholdDays]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (s: Suggestion) => {
    setSelected(prev => {
      const next = new Map(prev);
      if (next.has(s.id)) {
        next.delete(s.id);
      } else {
        next.set(s.id, { qty: s.suggested_qty, unit_cost: s.cost_price ?? 0, name: s.name });
      }
      return next;
    });
  };

  const updateQty = (id: string, qty: number) => {
    setSelected(prev => {
      const next = new Map(prev);
      const item = next.get(id);
      if (item) next.set(id, { ...item, qty: Math.max(1, qty) });
      return next;
    });
  };

  const handleCreatePO = async () => {
    if (!poSupplierId || selected.size === 0) return;
    setCreatingPO(true);
    try {
      const items = Array.from(selected.entries()).map(([product_id, v]) => ({
        product_id, product_name: v.name, quantity: v.qty, unit_cost: v.unit_cost,
      }));
      const res = await fetch('/api/admin/reposicion', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_id: poSupplierId, items }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setPoResult(json.po_id);
      setSelected(new Map());
      setShowPOModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear OC');
    } finally {
      setCreatingPO(false);
    }
  };

  const filtered = data?.suggestions.filter(s => {
    if (filterUrgency !== 'all' && s.urgency !== filterUrgency) return false;
    if (filterSupplier && s.supplier?.id !== filterSupplier) return false;
    return true;
  }) ?? [];

  const selectedTotal = Array.from(selected.values()).reduce((sum, v) => sum + v.qty * v.unit_cost, 0);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-amber-500" />
            Reposición de Stock
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Productos que necesitan reabastecimiento basado en velocidad de ventas
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowConfig(v => !v)}
            className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${showConfig ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            title="Configurar">
            <Sliders className="w-5 h-5 text-slate-500" />
          </button>
          <button onClick={load} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4">Parámetros de cálculo</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Mostrar productos con stock para menos de <strong>{thresholdDays} días</strong>
              </label>
              <input type="range" min={3} max={30} value={thresholdDays}
                onChange={e => setThresholdDays(Number(e.target.value))}
                className="w-full accent-amber-500" />
              <div className="flex justify-between text-xs text-slate-400">
                <span>3 días</span><span>30 días</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Sugerir cantidad para <strong>{targetDays} días</strong> de stock
              </label>
              <input type="range" min={7} max={90} value={targetDays}
                onChange={e => setTargetDays(Number(e.target.value))}
                className="w-full accent-amber-500" />
              <div className="flex justify-between text-xs text-slate-400">
                <span>7 días</span><span>90 días</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {poResult && (
        <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            Orden de compra creada correctamente
          </div>
          <Link href={`/admin/compras/${poResult}`}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
            Ver OC <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Críticos', value: data.meta.critico, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: 'Urgentes', value: data.meta.alto, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Bajo stock', value: data.meta.medio, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Costo estimado', value: formatPrice(data.meta.total_estimated_cost), color: 'text-slate-800 dark:text-slate-100', bg: 'bg-white dark:bg-slate-800' },
            ].map(kpi => (
              <div key={kpi.label} className={`${kpi.bg} rounded-2xl border border-slate-100 dark:border-slate-700 p-4`}>
                <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            {(['all', 'critico', 'alto', 'medio'] as const).map(u => (
              <button key={u} onClick={() => setFilterUrgency(u)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterUrgency === u
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                }`}>
                {u === 'all' ? 'Todos' : URGENCY[u].label}
                {u !== 'all' && data.meta[u] > 0 && (
                  <span className="ml-1 opacity-70">{data.meta[u]}</span>
                )}
              </button>
            ))}
            {data.suppliers.length > 0 && (
              <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:outline-none focus:border-amber-400 ml-auto">
                <option value="">Todos los proveedores</option>
                {data.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>

          {/* Product list */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay productos que reabastecer</p>
              <p className="text-sm mt-1">Ajusta los parámetros o el stock está bien cubierto</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(s => {
                const u = URGENCY[s.urgency];
                const isSelected = selected.has(s.id);
                return (
                  <div key={s.id}
                    className={`bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all ${
                      isSelected ? 'border-amber-400 dark:border-amber-500 shadow-sm shadow-amber-100 dark:shadow-amber-900/20' : `${u.border}`
                    }`}>
                    <div className="flex items-center gap-3 p-4">
                      {/* Checkbox */}
                      <button onClick={() => toggleSelect(s)}
                        className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-300 dark:border-slate-600 hover:border-amber-400'
                        }`}>
                        {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                      </button>

                      {/* Image */}
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 shrink-0 overflow-hidden">
                        {s.image_url ? (
                          <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                        ) : <Package className="w-5 h-5 m-2.5 text-slate-400" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-400">{s.category}</span>
                          {s.supplier && <span className="text-xs text-slate-400">· {s.supplier.name}</span>}
                          {bestPrices.has(s.id) && (() => {
                            const bp = bestPrices.get(s.id)!;
                            return (
                              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                <Scale className="w-3 h-3" />
                                {bp.best_supplier}: {formatPrice(bp.best_price)}
                                {bp.saving_pct > 0 && <span className="text-slate-400">({bp.saving_pct}% ahorro)</span>}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-4 text-xs text-right">
                        <div>
                          <p className="text-slate-400">Stock</p>
                          <p className={`font-bold ${s.stock === 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>{s.stock}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Ventas/día</p>
                          <p className="font-bold text-slate-700 dark:text-slate-200">{s.avg_daily_units.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Días restantes</p>
                          <p className={`font-bold ${s.dias_inventario === null ? 'text-slate-400' : s.dias_inventario <= 3 ? 'text-red-600 dark:text-red-400' : s.dias_inventario <= 7 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {s.dias_inventario === null ? '—' : `${s.dias_inventario}d`}
                          </p>
                        </div>
                      </div>

                      {/* Urgency + suggested qty */}
                      <div className="flex flex-col items-end gap-1.5 ml-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.color}`}>
                          {u.label}
                        </span>
                        {isSelected ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQty(s.id, (selected.get(s.id)?.qty ?? 1) - 1)}
                              className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-sm">
                              -
                            </button>
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 w-8 text-center">
                              {selected.get(s.id)?.qty}
                            </span>
                            <button onClick={() => updateQty(s.id, (selected.get(s.id)?.qty ?? 1) + 1)}
                              className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-sm">
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Sugerido: <strong>{s.suggested_qty}</strong>
                            {s.estimated_cost && ` (${formatPrice(s.estimated_cost)})`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {/* Floating create PO bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-0 right-0 z-40 flex justify-center px-4">
          <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-4 max-w-lg w-full">
            <div className="flex-1">
              <p className="text-sm font-semibold">{selected.size} producto{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}</p>
              {selectedTotal > 0 && <p className="text-xs opacity-70">Costo estimado: {formatPrice(selectedTotal)}</p>}
            </div>
            <button onClick={() => { setShowPOModal(true); setPoResult(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-sm font-semibold transition-all">
              <ShoppingCart className="w-4 h-4" />
              Crear OC
            </button>
            <button onClick={() => setSelected(new Map())} className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-black/10">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create PO modal */}
      {showPOModal && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" /> Nueva Orden de Compra
              </h2>
              <button onClick={() => setShowPOModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Proveedor</label>
                <select value={poSupplierId} onChange={e => setPoSupplierId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-amber-400 focus:outline-none">
                  <option value="">— Seleccionar proveedor —</option>
                  {data.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5">
                {Array.from(selected.entries()).map(([id, v]) => (
                  <div key={id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-200 truncate flex-1 mr-2">{v.name}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold shrink-0">×{v.qty}</span>
                    {v.unit_cost > 0 && <span className="text-slate-400 text-xs ml-2 shrink-0">{formatPrice(v.qty * v.unit_cost)}</span>}
                  </div>
                ))}
              </div>

              {selectedTotal > 0 && (
                <div className="flex justify-between text-sm font-semibold text-slate-800 dark:text-slate-100">
                  <span>Total estimado</span>
                  <span className="text-amber-600 dark:text-amber-400">{formatPrice(selectedTotal)}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowPOModal(false)}
                  className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleCreatePO}
                  disabled={creatingPO || !poSupplierId}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  {creatingPO ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {creatingPO ? 'Creando...' : 'Crear OC'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
        <div className="flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Las sugerencias se calculan en base a ventas de los últimos 30 días. Productos con más de {thresholdDays} días de cobertura no aparecen. La cantidad sugerida cubre {targetDays} días de ventas proyectadas.</p>
        </div>
      </div>
    </div>
  );
}
