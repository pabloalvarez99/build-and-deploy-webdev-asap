'use client';

import { useState } from 'react';
import { X, RotateCcw, Plus, Minus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/lib/format';

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
}

interface DevolucionItem {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  restock: boolean;
  max_quantity: number;
}

interface Props {
  orderId: string;
  orderItems: OrderItem[];
  onClose: () => void;
  onSuccess: () => void;
}

const MOTIVOS = [
  'Producto defectuoso',
  'Producto vencido',
  'Error en pedido',
  'Cambio de opinión',
  'Producto no llega',
  'Otro',
];

const METODOS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'credito_tienda', label: 'Crédito en tienda' },
  { value: 'webpay', label: 'Reversa Webpay' },
];

export default function DevolucionModal({ orderId, orderItems, onClose, onSuccess }: Props) {
  const [items, setItems] = useState<DevolucionItem[]>(
    orderItems.map(i => ({
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: 0,
      unit_price: i.price_at_purchase,
      restock: true,
      max_quantity: i.quantity,
    }))
  );
  const [motivo, setMotivo] = useState('');
  const [motivoCustom, setMotivoCustom] = useState('');
  const [notas, setNotas] = useState('');
  const [metodo, setMetodo] = useState('efectivo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const selectedItems = items.filter(i => i.quantity > 0);
  const totalDevuelto = selectedItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const motivoFinal = motivo === 'Otro' ? motivoCustom : motivo;

  function setQty(idx: number, qty: number) {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, quantity: Math.max(0, Math.min(qty, item.max_quantity)) } : item
    ));
  }

  function toggleRestock(idx: number) {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, restock: !item.restock } : item
    ));
  }

  async function handleSubmit() {
    if (!motivoFinal.trim()) { setError('Selecciona o escribe un motivo'); return; }
    if (selectedItems.length === 0) { setError('Selecciona al menos un producto a devolver'); return; }

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/devoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          tipo: 'venta',
          motivo: motivoFinal,
          notas: notas || undefined,
          metodo_reembolso: metodo,
          items: selectedItems.map(i => ({
            product_id: i.product_id,
            product_name: i.product_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            restock: i.restock,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al registrar devolución');
      }

      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-orange-500" />
            Registrar Devolución
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="font-medium">Devolución registrada exitosamente</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Productos a devolver
            </h3>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                    item.quantity > 0
                      ? 'border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatPrice(item.unit_price)} c/u · máx. {item.max_quantity}
                    </p>
                  </div>

                  {/* Cantidad */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setQty(idx, item.quantity - 1)}
                      disabled={item.quantity === 0}
                      className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center disabled:opacity-40 hover:bg-orange-200 dark:hover:bg-orange-700"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={item.max_quantity}
                      value={item.quantity}
                      onChange={e => setQty(idx, parseInt(e.target.value) || 0)}
                      className="w-12 text-center text-sm font-bold border border-slate-200 dark:border-slate-600 rounded-lg py-1 bg-white dark:bg-slate-700 dark:text-white"
                    />
                    <button
                      onClick={() => setQty(idx, item.quantity + 1)}
                      disabled={item.quantity >= item.max_quantity}
                      className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center disabled:opacity-40 hover:bg-orange-200 dark:hover:bg-orange-700"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Restock toggle */}
                  {item.quantity > 0 && (
                    <button
                      onClick={() => toggleRestock(idx)}
                      className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                        item.restock
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.restock ? '↑ Stock' : 'Sin stock'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Motivo</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {MOTIVOS.map(m => (
                <button
                  key={m}
                  onClick={() => setMotivo(m)}
                  className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-colors ${
                    motivo === m
                      ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-orange-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {motivo === 'Otro' && (
              <input
                type="text"
                placeholder="Describe el motivo..."
                value={motivoCustom}
                onChange={e => setMotivoCustom(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white"
              />
            )}
          </div>

          {/* Método reembolso */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Método de reembolso</label>
            <div className="flex flex-wrap gap-2">
              {METODOS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMetodo(m.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-colors ${
                    metodo === m.value
                      ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-cyan-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Notas internas (opcional)
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Observaciones adicionales..."
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
          <div>
            {selectedItems.length > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total a devolver:{' '}
                <span className="font-bold text-orange-600 dark:text-orange-400 text-base">
                  {formatPrice(totalDevuelto)}
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || success || selectedItems.length === 0 || !motivoFinal.trim()}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar devolución
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
