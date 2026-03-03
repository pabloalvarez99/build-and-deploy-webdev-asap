'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';

interface Movement {
  id: string;
  delta: number;
  reason: string;
  created_at: string;
  profiles: { name: string | null; email: string } | null;
}

interface StockModalProps {
  productId: string;
  productName: string;
  currentStock: number;
  onClose: () => void;
  onStockUpdated: (productId: string, newStock: number) => void;
}

const REASONS = [
  { value: 'reposicion', label: 'Reposición de stock' },
  { value: 'correccion', label: 'Corrección de inventario' },
  { value: 'merma', label: 'Merma / pérdida' },
  { value: 'inventario', label: 'Ajuste por inventario físico' },
];

export function StockModal({ productId, productName, currentStock, onClose, onStockUpdated }: StockModalProps) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('reposicion');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/products/${productId}/stock`)
      .then((r) => r.json())
      .then((data) => setMovements(Array.isArray(data) ? data : []))
      .catch(() => setMovements([]))
      .finally(() => setLoadingHistory(false));
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(amount);
    if (!qty || qty <= 0) { setError('Ingresa una cantidad válida'); return; }
    const delta = adjustType === 'add' ? qty : -qty;
    if (currentStock + delta < 0) { setError('El stock no puede quedar negativo'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta, reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar'); return; }
      onStockUpdated(productId, data.stock);
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="font-bold text-slate-900">Ajustar Stock</h2>
            <p className="text-sm text-slate-500 truncate max-w-[300px]">{productName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current stock */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <p className="text-sm text-slate-500">Stock actual</p>
          <p className={`text-3xl font-bold ${currentStock === 0 ? 'text-red-600' : currentStock <= 10 ? 'text-orange-600' : 'text-slate-900'}`}>
            {currentStock} <span className="text-base font-normal text-slate-400">unidades</span>
          </p>
        </div>

        {/* Adjust form */}
        <form onSubmit={handleSubmit} className="p-6 border-b border-slate-200 shrink-0 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdjustType('add')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors ${adjustType === 'add' ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400' : 'bg-slate-100 text-slate-600'}`}
            >
              <TrendingUp className="w-4 h-4" /> Agregar
            </button>
            <button
              type="button"
              onClick={() => setAdjustType('subtract')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors ${adjustType === 'subtract' ? 'bg-red-100 text-red-700 ring-2 ring-red-400' : 'bg-slate-100 text-slate-600'}`}
            >
              <TrendingDown className="w-4 h-4" /> Restar
            </button>
          </div>

          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Cantidad"
            className="input w-full text-center text-2xl font-bold"
            autoFocus
          />

          <select value={reason} onChange={(e) => setReason(e.target.value)} className="input w-full">
            {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn btn-primary w-full disabled:opacity-50">
            {saving ? 'Guardando...' : `${adjustType === 'add' ? 'Agregar' : 'Restar'} ${amount || '?'} unidades`}
          </button>
        </form>

        {/* History */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-3 sticky top-0 bg-white border-b border-slate-100">
            <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Historial de movimientos
            </p>
          </div>
          {loadingHistory ? (
            <div className="p-6 text-center text-slate-400 text-sm">Cargando...</div>
          ) : movements.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">Sin movimientos registrados</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {movements.map((m) => (
                <div key={m.id} className="px-6 py-3 flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${m.delta > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {m.delta > 0 ? '+' : ''}{m.delta}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{REASONS.find(r => r.value === m.reason)?.label || m.reason}</p>
                    <p className="text-xs text-slate-400">
                      {m.profiles?.name || m.profiles?.email || 'Admin'} · {new Date(m.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
