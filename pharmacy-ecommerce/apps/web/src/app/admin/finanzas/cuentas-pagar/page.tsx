'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  paid_at: string;
  notes: string | null;
}

interface PO {
  id: string;
  invoice_number: string | null;
  total_cost: number | null;
  paid: boolean;
  paid_at: string | null;
  payment_method_ap: string | null;
  due_date: string | null;
  created_at: string;
  suppliers: { id: string; name: string };
  purchase_payments: Payment[];
}

function formatCLP(n: number) {
  return `$${Math.round(n).toLocaleString('es-CL')}`;
}

function formatDate(s: string | null) {
  if (!s) return '-';
  return new Date(s).toLocaleDateString('es-CL');
}

function isOverdue(po: PO) {
  if (po.paid || !po.due_date) return false;
  return new Date(po.due_date) < new Date();
}

export default function CuentasPagarPage() {
  const [orders, setOrders] = useState<PO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'false' | 'true' | ''>('false');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [payModal, setPayModal] = useState<PO | null>(null);
  const [paying, setPaying] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'transferencia', paid_at: '', notes: '', mark_fully_paid: true });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filter) params.set('paid', filter);
    const res = await fetch(`/api/admin/finanzas/ap?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const openPay = (po: PO) => {
    setPayForm({
      amount: po.total_cost ? String(Math.round(po.total_cost)) : '',
      payment_method: 'transferencia',
      paid_at: new Date().toISOString().split('T')[0],
      notes: '',
      mark_fully_paid: true,
    });
    setPayModal(po);
  };

  const submitPay = async () => {
    if (!payModal) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/admin/finanzas/ap/${payModal.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(payForm.amount),
          payment_method: payForm.payment_method,
          paid_at: payForm.paid_at || undefined,
          notes: payForm.notes || undefined,
          mark_fully_paid: payForm.mark_fully_paid,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setPayModal(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          Cuentas por Pagar
        </h2>
        <div className="flex gap-2">
          {(['false', 'true', ''] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                filter === f
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {f === 'false' ? 'Pendientes' : f === 'true' ? 'Pagadas' : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          {orders.length === 0 ? (
            <p className="text-sm text-slate-400 p-6 text-center">Sin órdenes de compra en este estado.</p>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {orders.map((po) => {
                const overdue = isOverdue(po);
                const paidAmount = po.purchase_payments.reduce((s, p) => s + Number(p.amount), 0);
                return (
                  <div key={po.id}>
                    <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
                      <div className="shrink-0">
                        {po.paid ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : overdue ? (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {po.suppliers.name}
                          {po.invoice_number && <span className="text-slate-400 ml-2 text-xs">#{po.invoice_number}</span>}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatCLP(po.total_cost || 0)} · Vence: {formatDate(po.due_date)}
                          {overdue && <span className="text-red-500 ml-1 font-medium">VENCIDA</span>}
                        </p>
                        {paidAmount > 0 && !po.paid && (
                          <p className="text-xs text-emerald-600">Abonado: {formatCLP(paidAmount)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!po.paid && (
                          <button
                            onClick={() => openPay(po)}
                            className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            Registrar Pago
                          </button>
                        )}
                        {po.purchase_payments.length > 0 && (
                          <button
                            onClick={() => setExpanded(expanded === po.id ? null : po.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {expanded === po.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                    {expanded === po.id && po.purchase_payments.length > 0 && (
                      <div className="px-12 pb-3 space-y-1">
                        {po.purchase_payments.map((p) => (
                          <div key={p.id} className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>{formatDate(p.paid_at)} · {p.payment_method}</span>
                            <span className="font-medium text-emerald-600">{formatCLP(Number(p.amount))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Anterior</button>
          <span className="px-3 py-1.5 text-sm text-slate-500">{page} / {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Siguiente</button>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPayModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Registrar Pago</h3>
            <p className="text-sm text-slate-500">{payModal.suppliers.name} · Total: {formatCLP(payModal.total_cost || 0)}</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Monto ($CLP)</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Método de pago</label>
                <select value={payForm.payment_method} onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="debito">Débito</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Fecha de pago</label>
                <input type="date" value={payForm.paid_at} onChange={e => setPayForm(f => ({ ...f, paid_at: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Notas (opcional)</label>
                <input type="text" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                <input type="checkbox" checked={payForm.mark_fully_paid} onChange={e => setPayForm(f => ({ ...f, mark_fully_paid: e.target.checked }))} className="w-4 h-4 text-emerald-600 rounded" />
                Marcar como pagada completamente
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setPayModal(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={submitPay} disabled={paying || !payForm.amount} className="flex-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {paying && <Loader2 className="w-4 h-4 animate-spin" />}
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
