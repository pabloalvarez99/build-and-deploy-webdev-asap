'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/format';
import { CalendarClock, AlertTriangle, Plus, Trash2, Tag, X } from 'lucide-react';

interface Batch {
  id: string;
  product_id: string;
  batch_code: string | null;
  expiry_date: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  products: {
    id: string;
    name: string;
    slug: string;
    stock: number;
    discount_percent: number | null;
    categories: { name: string } | null;
  };
}

interface BatchSummary {
  expired: number;
  soon30: number;
  soon90: number;
  total: number;
}

export default function VencimientosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'' | 'expired' | 'soon30' | 'soon90'>('');
  const [showForm, setShowForm] = useState(false);
  const [liquidModal, setLiquidModal] = useState<Batch | null>(null);
  const [liquidDiscount, setLiquidDiscount] = useState(20);
  const [form, setForm] = useState({
    product_id: '', product_name: '', batch_code: '', expiry_date: '', quantity: 1, notes: '',
  });
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<{ id: string; name: string; stock: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [liquidating, setLiquidating] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    load();
  }, [user, router, filter]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/batches${filter ? `?filter=${filter}` : ''}`);
      const data = await res.json();
      setBatches(data.batches || []);
      setSummary(data.summary || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function searchProducts(q: string) {
    if (q.length < 2) { setProductResults([]); return; }
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setProductResults(data.products || []);
    } catch { setProductResults([]); }
  }

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productSearch), 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  async function submit() {
    if (!form.product_id || !form.expiry_date || !form.quantity) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity) }),
      });
      if (!res.ok) throw new Error();
      setForm({ product_id: '', product_name: '', batch_code: '', expiry_date: '', quantity: 1, notes: '' });
      setProductSearch('');
      setProductResults([]);
      setShowForm(false);
      load();
    } catch { alert('Error guardando'); }
    finally { setSaving(false); }
  }

  async function deleteBatch(id: string) {
    if (!confirm('¿Eliminar este lote?')) return;
    await fetch(`/api/admin/batches/${id}`, { method: 'DELETE' });
    load();
  }

  async function liquidate() {
    if (!liquidModal) return;
    setLiquidating(true);
    try {
      // Apply discount to product
      const res = await fetch(`/api/admin/products/${liquidModal.products.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount_percent: liquidDiscount }),
      });
      if (!res.ok) throw new Error('Error aplicando descuento');
      setLiquidModal(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setLiquidating(false);
    }
  }

  async function writeOff(batch: Batch) {
    if (!confirm(`¿Dar de baja ${batch.quantity} unidades de ${batch.products.name}?`)) return;
    try {
      const res = await fetch('/api/admin/stock-movements/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: batch.products.id,
          delta: -batch.quantity,
          notes: `Vencimiento lote ${batch.batch_code || batch.id.slice(0, 8)} — ${batch.expiry_date.slice(0, 10)}`,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await deleteBatch(batch.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  function expiryStatus(dateStr: string): 'expired' | 'soon30' | 'soon90' | 'ok' {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'expired';
    if (diff <= 30) return 'soon30';
    if (diff <= 90) return 'soon90';
    return 'ok';
  }

  function statusBadge(status: ReturnType<typeof expiryStatus>, dateStr: string) {
    const d = new Date(dateStr);
    const days = Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (status === 'expired') return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Vencido hace {Math.abs(days)}d</span>;
    if (status === 'soon30') return <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Vence en {days}d</span>;
    if (status === 'soon90') return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Vence en {days}d</span>;
    return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">OK ({days}d)</span>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Vencimientos</h1>
            <p className="text-sm text-slate-500">Control de lotes y fechas de vencimiento</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> Nuevo lote
        </button>
      </div>

      {/* KPI cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-4">
            <p className="text-xs text-red-600 dark:text-red-400">Vencidos</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{summary.expired}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-4">
            <p className="text-xs text-orange-600 dark:text-orange-400">Vencen en 30 días</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{summary.soon30}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-4">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Vencen en 90 días</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{summary.soon90}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500">Total lotes</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.total}</p>
          </div>
        </div>
      )}

      {/* New batch form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Registrar lote</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 relative">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Producto *</label>
              <input type="text" value={productSearch || form.product_name}
                onChange={(e) => { setProductSearch(e.target.value); setForm({ ...form, product_name: e.target.value, product_id: '' }); }}
                placeholder="Buscar producto..."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm" />
              {productResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {productResults.map((p) => (
                    <button key={p.id} onClick={() => { setForm({ ...form, product_id: p.id, product_name: p.name }); setProductSearch(p.name); setProductResults([]); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex justify-between">
                      <span>{p.name}</span><span className="text-xs text-slate-400">stock: {p.stock}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">N° Lote</label>
              <input type="text" value={form.batch_code} onChange={(e) => setForm({ ...form, batch_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Fecha vencimiento *</label>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cantidad *</label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Notas</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
            <button onClick={submit} disabled={saving || !form.product_id || !form.expiry_date}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'Todos' },
          { value: 'expired', label: '🔴 Vencidos' },
          { value: 'soon30', label: '🟠 30 días' },
          { value: 'soon90', label: '🟡 90 días' },
        ].map(({ value, label }) => (
          <button key={value} onClick={() => setFilter(value as '' | 'expired' | 'soon30' | 'soon90')}
            className={`px-3 py-2 rounded-xl text-sm border ${filter === value ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Batches list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">Producto</th>
                  <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">Lote</th>
                  <th className="text-center px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">Vencimiento</th>
                  <th className="text-right px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">Cantidad</th>
                  <th className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {batches.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Sin lotes registrados</td></tr>
                )}
                {batches.map((b) => {
                  const status = expiryStatus(b.expiry_date);
                  return (
                    <tr key={b.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 ${status === 'expired' ? 'bg-red-50/50 dark:bg-red-900/10' : status === 'soon30' ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-xs">{b.products.name}</p>
                        {b.products.categories && <p className="text-xs text-slate-400">{b.products.categories.name}</p>}
                        {b.products.discount_percent && (
                          <p className="text-xs text-orange-600">Descuento activo: {b.products.discount_percent}%</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.batch_code || <span className="text-slate-400">—</span>}</td>
                      <td className="px-4 py-3 text-center">{new Date(b.expiry_date).toLocaleDateString('es-CL')}</td>
                      <td className="px-4 py-3 text-right font-medium">{b.quantity}</td>
                      <td className="px-4 py-3">{statusBadge(status, b.expiry_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => { setLiquidModal(b); setLiquidDiscount(b.products.discount_percent ?? 20); }} title="Liquidar"
                            className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600" >
                            <Tag className="w-4 h-4" />
                          </button>
                          <button onClick={() => writeOff(b)} title="Dar de baja"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteBatch(b.id)} title="Eliminar lote"
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Liquidate modal */}
      {liquidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setLiquidModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Liquidar producto</h2>
              <button onClick={() => setLiquidModal(null)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{liquidModal.products.name}</p>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Descuento: <span className="font-bold text-orange-600">{liquidDiscount}%</span>
              </label>
              <input type="range" min={5} max={80} step={5} value={liquidDiscount}
                onChange={(e) => setLiquidDiscount(parseInt(e.target.value))}
                className="w-full" />
              <p className="text-xs text-slate-500">
                Precio actual: {formatPrice(liquidModal.products.stock)} →
                Se aplicará {liquidDiscount}% de descuento en el producto
              </p>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setLiquidModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
              <button onClick={liquidate} disabled={liquidating}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50">
                {liquidating ? 'Aplicando...' : 'Aplicar descuento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
