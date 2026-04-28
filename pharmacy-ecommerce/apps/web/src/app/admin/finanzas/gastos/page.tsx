'use client';

import { useState, useEffect, useCallback } from 'react';
import { Receipt, Plus, Trash2, Loader2, X, RefreshCw } from 'lucide-react';

interface Category { id: string; name: string; type: string; sort_order: number; }
interface Gasto {
  id: string;
  category_id: string;
  description: string;
  amount: number;
  expense_date: string;
  paid_at: string | null;
  payment_method: string | null;
  gasto_categories: Category;
}
interface Recurring {
  id: string;
  category_id: string;
  description: string;
  amount: number;
  day_of_month: number;
  active: boolean;
  gasto_categories: Category;
}

function formatCLP(n: number) { return `$${Math.round(n).toLocaleString('es-CL')}`; }
function thisMonth() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }

const PAYMENT_METHODS = ['transferencia','efectivo','cheque','debito','credito'];

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState(thisMonth());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'gastos' | 'recurrentes'>('gastos');
  const [showForm, setShowForm] = useState(false);
  const [showRecForm, setShowRecForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [form, setForm] = useState({ category_id: '', description: '', amount: '', expense_date: '', payment_method: 'transferencia' });
  const [recForm, setRecForm] = useState({ category_id: '', description: '', amount: '', day_of_month: '1' });

  const loadGastos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '30', month });
    const res = await fetch(`/api/admin/finanzas/gastos?${params}`);
    const data = await res.json();
    setGastos(data.gastos || []);
    setTotal(data.total || 0);
    setCategories(data.categories || []);
    setLoading(false);
  }, [page, month]);

  const loadRecurring = useCallback(async () => {
    const res = await fetch('/api/admin/finanzas/gastos/recurring');
    const data = await res.json();
    setRecurring(data.recurring || []);
    if (data.categories?.length) setCategories(data.categories);
  }, []);

  useEffect(() => { loadGastos(); }, [loadGastos]);
  useEffect(() => { loadRecurring(); }, [loadRecurring]);

  const deleteGasto = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    await fetch(`/api/admin/finanzas/gastos/${id}`, { method: 'DELETE' });
    loadGastos();
  };

  const generateFromRecurring = async (id: string) => {
    setGenerating(id);
    const res = await fetch(`/api/admin/finanzas/gastos/recurring/${id}`, { method: 'POST' });
    if (!res.ok) { const d = await res.json(); alert(d.error || 'Error'); }
    else { loadGastos(); }
    setGenerating(null);
  };

  const deleteRecurring = async (id: string) => {
    if (!confirm('¿Eliminar plantilla recurrente?')) return;
    await fetch(`/api/admin/finanzas/gastos/recurring/${id}`, { method: 'DELETE' });
    loadRecurring();
  };

  const submitGasto = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/finanzas/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowForm(false);
      setForm({ category_id: '', description: '', amount: '', expense_date: '', payment_method: 'transferencia' });
      loadGastos();
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setSaving(false); }
  };

  const submitRecurring = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/finanzas/gastos/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...recForm, amount: parseFloat(recForm.amount), day_of_month: parseInt(recForm.day_of_month) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowRecForm(false);
      setRecForm({ category_id: '', description: '', amount: '', day_of_month: '1' });
      loadRecurring();
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setSaving(false); }
  };

  const totalMes = gastos.reduce((s, g) => s + g.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-600" />
          Gastos
        </h2>
        <button
          onClick={() => tab === 'gastos' ? setShowForm(true) : setShowRecForm(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {tab === 'gastos' ? 'Nuevo Gasto' : 'Nueva Plantilla'}
        </button>
      </div>

      <div className="flex gap-2">
        {(['gastos', 'recurrentes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm rounded-xl font-medium transition-colors ${tab === t ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {t === 'gastos' ? 'Gastos' : 'Recurrentes'}
          </button>
        ))}
      </div>

      {tab === 'gastos' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <input type="month" value={month} onChange={e => { setMonth(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            {!loading && <span className="text-sm text-slate-500">Total mes: <strong className="text-red-600">{formatCLP(totalMes)}</strong></span>}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              {gastos.length === 0 ? (
                <p className="text-sm text-slate-400 p-6 text-center">Sin gastos para este mes.</p>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-700">
                  {gastos.map(g => (
                    <div key={g.id} className="flex items-center justify-between px-4 py-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{g.description}</p>
                        <p className="text-xs text-slate-500">{g.gasto_categories.name} · {new Date(g.expense_date + 'T12:00:00').toLocaleDateString('es-CL')}</p>
                      </div>
                      <p className="text-sm font-bold text-red-600 shrink-0">{formatCLP(g.amount)}</p>
                      <button onClick={() => deleteGasto(g.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {total > 30 && (
            <div className="flex justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Anterior</button>
              <span className="px-3 py-1.5 text-sm text-slate-500">{page} / {Math.ceil(total/30)}</span>
              <button disabled={page >= Math.ceil(total/30)} onClick={() => setPage(p => p+1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Siguiente</button>
            </div>
          )}
        </>
      )}

      {tab === 'recurrentes' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          {recurring.length === 0 ? (
            <p className="text-sm text-slate-400 p-6 text-center">Sin plantillas recurrentes. Crea una para auto-generar gastos fijos cada mes.</p>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {recurring.map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{r.description}</p>
                    <p className="text-xs text-slate-500">{r.gasto_categories.name} · día {r.day_of_month} de cada mes</p>
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 shrink-0">{formatCLP(r.amount)}</p>
                  <button
                    onClick={() => generateFromRecurring(r.id)}
                    disabled={generating === r.id}
                    title="Generar gasto este mes"
                    className="p-1.5 text-emerald-500 hover:text-emerald-700 transition-colors shrink-0"
                  >
                    {generating === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteRecurring(r.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Nuevo Gasto</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Categoría</label>
                <select value={form.category_id} onChange={e => setForm(f => ({...f, category_id: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Seleccionar...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Descripción</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Monto ($CLP)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Fecha del gasto</label>
                <input type="date" value={form.expense_date} onChange={e => setForm(f => ({...f, expense_date: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Método de pago</label>
                <select value={form.payment_method} onChange={e => setForm(f => ({...f, payment_method: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={submitGasto} disabled={saving || !form.category_id || !form.description || !form.amount || !form.expense_date} className="flex-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowRecForm(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Nueva Plantilla Recurrente</h3>
              <button onClick={() => setShowRecForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Categoría</label>
                <select value={recForm.category_id} onChange={e => setRecForm(f => ({...f, category_id: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Seleccionar...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Descripción</label>
                <input type="text" value={recForm.description} onChange={e => setRecForm(f => ({...f, description: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Monto mensual ($CLP)</label>
                <input type="number" value={recForm.amount} onChange={e => setRecForm(f => ({...f, amount: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Día del mes (1-28)</label>
                <input type="number" min={1} max={28} value={recForm.day_of_month} onChange={e => setRecForm(f => ({...f, day_of_month: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowRecForm(false)} className="flex-1 px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={submitRecurring} disabled={saving || !recForm.category_id || !recForm.description || !recForm.amount} className="flex-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
