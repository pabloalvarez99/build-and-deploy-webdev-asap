'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Scale, Upload, RefreshCw, Loader2, AlertCircle, CheckCircle2,
  ChevronDown, ChevronUp, TrendingDown, Package, Search, X,
} from 'lucide-react';

interface SupplierPrice {
  supplier_id: string;
  supplier_name: string;
  unit_price: number;
  valid_from: string;
  valid_until: string | null;
  notes: string | null;
  is_best: boolean;
}

interface CompareRow {
  product_id: string;
  product_name: string;
  product_price: number | null;
  stock: number;
  suppliers: SupplierPrice[];
  best_supplier: string;
  best_price: number;
  worst_price: number;
  saving_pct: number;
}

interface Supplier { id: string; name: string }

function formatCLP(n: number) { return '$' + Math.round(n).toLocaleString('es-CL'); }

export default function ComparadorPage() {
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  // Upload state
  const [uploadSupplier, setUploadSupplier] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Manual price entry
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ supplier_id: '', product_id: '', unit_price: '', product_search: '', product_name: '' });
  const [productResults, setProductResults] = useState<{ id: string; name: string }[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cmpRes, supRes] = await Promise.all([
        fetch('/api/admin/supplier-prices/compare', { credentials: 'include' }),
        fetch('/api/admin/suppliers', { credentials: 'include' }),
      ]);
      if (!cmpRes.ok) throw new Error('Error al cargar comparador');
      if (!supRes.ok) throw new Error('Error al cargar proveedores');
      const cmpData = await cmpRes.json();
      const supData = await supRes.json();
      setRows(cmpData.rows);
      setSuppliers(supData.suppliers ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleUpload = async () => {
    if (!fileRef.current?.files?.[0] || !uploadSupplier) return;
    setUploading(true);
    setUploadResult(null);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', fileRef.current.files[0]);
      fd.append('supplier_id', uploadSupplier);
      const res = await fetch('/api/admin/supplier-prices/import', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al importar');
      setUploadResult(data);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al importar');
    } finally {
      setUploading(false);
    }
  };

  const searchProducts = async (q: string) => {
    if (!q || q.length < 2) { setProductResults([]); return; }
    setProductSearchLoading(true);
    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}&limit=8`, { credentials: 'include' });
      const data = await res.json();
      setProductResults((data.products ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
    } catch {
      setProductResults([]);
    } finally {
      setProductSearchLoading(false);
    }
  };

  const handleSavePrice = async () => {
    if (!addForm.supplier_id || !addForm.product_id || !addForm.unit_price) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/supplier-prices', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: addForm.supplier_id,
          product_id: addForm.product_id,
          unit_price: Number(addForm.unit_price),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setShowAddModal(false);
      setAddForm({ supplier_id: '', product_id: '', unit_price: '', product_search: '', product_name: '' });
      setProductResults([]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const filtered = rows.filter(r =>
    !search || r.product_name.toLowerCase().includes(search.toLowerCase()) ||
    r.best_supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-emerald-500" />
            Comparador de Precios
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Compara precios de proveedores e identifica el más conveniente
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Upload className="w-4 h-4" />
            Agregar precio
          </button>
          <button onClick={load} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Upload Excel */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-500" />
          Importar lista de precios (Excel)
        </h2>
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Proveedor</label>
            <select
              value={uploadSupplier}
              onChange={e => setUploadSupplier(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="">— Seleccionar —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Archivo Excel <span className="text-slate-400">(col: codigo/producto, precio)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-900/20 dark:file:text-emerald-400 hover:file:bg-emerald-100 cursor-pointer"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading || !uploadSupplier}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-all"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Importando...' : 'Importar'}
          </button>
        </div>
        {uploadResult && (
          <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                {uploadResult.imported} precios importados · {uploadResult.skipped} omitidos
              </p>
              {uploadResult.errors.length > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  No encontrados: {uploadResult.errors.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar producto o proveedor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats bar */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Productos comparados</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{rows.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Mayor ahorro</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {rows[0]?.saving_pct ?? 0}%
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Ahorro promedio</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.saving_pct, 0) / rows.length) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Comparison table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <Scale className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {rows.length === 0
              ? 'No hay precios cargados aún'
              : 'Sin resultados para la búsqueda'}
          </p>
          <p className="text-sm mt-1">
            {rows.length === 0
              ? 'Importa una lista de precios o agrega precios manualmente'
              : 'Prueba con otro término'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(row => {
            const isOpen = expanded.has(row.product_id);
            return (
              <div key={row.product_id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => toggleExpand(row.product_id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{row.product_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400">Stock: {row.stock}</span>
                      {row.product_price && (
                        <span className="text-xs text-slate-400">· PVP: {formatCLP(row.product_price)}</span>
                      )}
                      <span className="text-xs text-slate-400">· {row.suppliers.length} proveedores</span>
                    </div>
                  </div>

                  {/* Best price */}
                  <div className="hidden sm:block text-right shrink-0">
                    <p className="text-xs text-slate-400">Mejor precio</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCLP(row.best_price)}</p>
                    <p className="text-xs text-slate-400">{row.best_supplier}</p>
                  </div>

                  {/* Saving badge */}
                  {row.saving_pct > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl shrink-0">
                      <TrendingDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {row.saving_pct}% ahorro
                      </span>
                    </div>
                  )}

                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  }
                </button>

                {/* Expanded supplier list */}
                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                    {row.suppliers.map(sp => (
                      <div
                        key={sp.supplier_id}
                        className={`flex items-center gap-3 px-4 py-3 ${sp.is_best ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{sp.supplier_name}</p>
                            {sp.is_best && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-semibold">
                                MEJOR
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Desde {sp.valid_from}
                            {sp.valid_until && ` · Hasta ${sp.valid_until}`}
                            {sp.notes && ` · ${sp.notes}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${sp.is_best ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {formatCLP(sp.unit_price)}
                          </p>
                          {!sp.is_best && row.saving_pct > 0 && (
                            <p className="text-xs text-red-500 dark:text-red-400">
                              +{formatCLP(sp.unit_price - row.best_price)} vs mejor
                            </p>
                          )}
                          {row.product_price && sp.is_best && (
                            <p className="text-xs text-slate-400">
                              Margen: {Math.round(((row.product_price - sp.unit_price) / row.product_price) * 100)}%
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add price modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-900 dark:text-white">Agregar precio de proveedor</h2>
              <button onClick={() => { setShowAddModal(false); setProductResults([]); setAddForm({ supplier_id: '', product_id: '', unit_price: '', product_search: '', product_name: '' }); }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Proveedor</label>
                <select
                  value={addForm.supplier_id}
                  onChange={e => setAddForm(f => ({ ...f, supplier_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-emerald-400 focus:outline-none"
                >
                  <option value="">— Seleccionar proveedor —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Producto</label>
                {addForm.product_id ? (
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 text-sm">
                    <span className="text-slate-800 dark:text-slate-100">{addForm.product_name}</span>
                    <button onClick={() => setAddForm(f => ({ ...f, product_id: '', product_name: '', product_search: '' }))}
                      className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar producto..."
                      value={addForm.product_search}
                      onChange={e => {
                        setAddForm(f => ({ ...f, product_search: e.target.value }));
                        searchProducts(e.target.value);
                      }}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-emerald-400 focus:outline-none"
                    />
                    {productSearchLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                    )}
                    {productResults.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {productResults.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { setAddForm(f => ({ ...f, product_id: p.id, product_name: p.name, product_search: p.name })); setProductResults([]); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Precio unitario (CLP)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={addForm.unit_price}
                  onChange={e => setAddForm(f => ({ ...f, unit_price: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowAddModal(false); setProductResults([]); setAddForm({ supplier_id: '', product_id: '', unit_price: '', product_search: '', product_name: '' }); }}
                  className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePrice}
                  disabled={saving || !addForm.supplier_id || !addForm.product_id || !addForm.unit_price}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                  {saving ? 'Guardando...' : 'Guardar precio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
