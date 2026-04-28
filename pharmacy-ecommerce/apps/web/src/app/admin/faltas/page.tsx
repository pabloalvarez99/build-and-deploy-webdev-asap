'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { isAdminRole } from '@/lib/roles';
import { BookX, Plus, CheckCircle, X, Search, Clock, Bell, Trash2 } from 'lucide-react';

interface Falta {
  id: string;
  product_id: string | null;
  product_name: string;
  customer_name: string | null;
  customer_phone: string | null;
  quantity: number;
  status: string;
  notes: string | null;
  notified_at: string | null;
  created_at: string;
  products: { name: string; slug: string; stock: number } | null;
}

export default function FaltasPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<{ id: string; name: string; stock: number }[]>([]);
  const [form, setForm] = useState({
    product_id: '', product_name: '', customer_name: '', customer_phone: '', quantity: 1, notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !isAdminRole(user.role)) { router.push('/'); return; }
    load();
  }, [user, router, statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/faltas?status=${statusFilter}`);
      const data = await res.json();
      setFaltas(data.faltas || []);
      if (data.pendingCount !== undefined) setPendingCount(data.pendingCount);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
    if (!form.product_name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/faltas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setForm({ product_id: '', product_name: '', customer_name: '', customer_phone: '', quantity: 1, notes: '' });
      setProductSearch('');
      setProductResults([]);
      setShowForm(false);
      load();
    } catch { alert('Error guardando'); }
    finally { setSaving(false); }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/faltas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function deleteFalta(id: string) {
    if (!confirm('¿Eliminar esta falta?')) return;
    await fetch(`/api/admin/faltas/${id}`, { method: 'DELETE' });
    load();
  }

  const filtered = faltas.filter((f) =>
    !search || f.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (f.customer_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <BookX className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Cuaderno de Faltas
              {pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  {pendingCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500">Productos que clientes solicitaron sin stock</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" /> Nueva falta
        </button>
      </div>

      {/* New falta form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Registrar falta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product search */}
            <div className="md:col-span-2 relative">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Producto *</label>
              <input
                type="text"
                value={productSearch || form.product_name}
                onChange={(e) => {
                  const v = e.target.value;
                  setProductSearch(v);
                  setForm({ ...form, product_name: v, product_id: '' });
                }}
                placeholder="Buscar producto en catálogo..."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
              />
              {productResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {productResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setForm({ ...form, product_id: p.id, product_name: p.name });
                        setProductSearch(p.name);
                        setProductResults([]);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between"
                    >
                      <span>{p.name}</span>
                      <span className={`text-xs ${p.stock === 0 ? 'text-red-500' : 'text-green-600'}`}>
                        stock: {p.stock}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nombre cliente</label>
              <input type="text" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Teléfono</label>
              <input type="text" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cantidad</label>
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
            <button onClick={submit} disabled={saving || !form.product_name}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm" />
        </div>
        {[
          { value: 'pending', label: '⏳ Pendiente' },
          { value: 'notified', label: '✓ Notificado' },
          { value: 'cancelled', label: '✗ Cancelado' },
        ].map(({ value, label }) => (
          <button key={value} onClick={() => setStatusFilter(value)}
            className={`px-3 py-2 rounded-xl text-sm border ${statusFilter === value ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500">
              Sin faltas registradas
            </div>
          )}
          {filtered.map((f) => (
            <div key={f.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-start gap-4">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${f.status === 'pending' ? 'bg-yellow-500' : f.status === 'notified' ? 'bg-green-500' : 'bg-slate-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{f.product_name}</p>
                    {f.products && f.products.stock > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400">Stock actual: {f.products.stock}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(f.created_at).toLocaleDateString('es-CL')}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                  {f.customer_name && <span>Cliente: {f.customer_name}</span>}
                  {f.customer_phone && <span>📞 {f.customer_phone}</span>}
                  <span>Cantidad: {f.quantity}</span>
                  {f.notes && <span>Nota: {f.notes}</span>}
                </div>
                {f.notified_at && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Notificado: {new Date(f.notified_at).toLocaleDateString('es-CL')}
                  </p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {f.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(f.id, 'notified')} title="Marcar notificado"
                      className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600">
                      <Bell className="w-4 h-4" />
                    </button>
                    <button onClick={() => updateStatus(f.id, 'cancelled')} title="Cancelar"
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button onClick={() => deleteFalta(f.id)} title="Eliminar"
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
