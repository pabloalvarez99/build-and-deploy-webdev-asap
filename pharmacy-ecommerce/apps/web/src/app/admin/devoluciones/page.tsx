'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/format';
import { RotateCcw, Search, Filter, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface DevolucionItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  restock: boolean;
}

interface Devolucion {
  id: string;
  order_id: string | null;
  tipo: string;
  motivo: string;
  notas: string | null;
  total_devuelto: number;
  metodo_reembolso: string | null;
  procesado_por: string | null;
  created_at: string;
  orders: { id: string; guest_name: string | null; guest_email: string | null } | null;
  items: DevolucionItem[];
}

const TIPOS = [
  { value: '', label: 'Todos' },
  { value: 'venta', label: 'Venta' },
  { value: 'compra', label: 'Compra' },
];

const METODOS = {
  efectivo: 'Efectivo',
  credito_tienda: 'Crédito tienda',
  webpay: 'Webpay',
};

export default function DevolucionesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [tipo, setTipo] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login?redirect=/admin/devoluciones');
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (tipo) params.set('tipo', tipo);
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const res = await fetch(`/api/admin/devoluciones?${params}`);
      if (!res.ok) throw new Error('Error cargando devoluciones');
      const data = await res.json();
      setDevoluciones(data.devoluciones);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [page, tipo, from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalDevuelto = devoluciones.reduce((s, d) => s + d.total_devuelto, 0);

  if (authLoading) return null;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-orange-500" />
            Devoluciones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {total} registro{total !== 1 ? 's' : ''} — Total devuelto: {formatPrice(totalDevuelto)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={e => { setTipo(e.target.value); setPage(1); }}
              className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white"
            >
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Desde</label>
            <input
              type="date"
              value={from}
              onChange={e => { setFrom(e.target.value); setPage(1); }}
              className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Hasta</label>
            <input
              type="date"
              value={to}
              onChange={e => { setTo(e.target.value); setPage(1); }}
              className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white"
            />
          </div>
          {(tipo || from || to) && (
            <button
              onClick={() => { setTipo(''); setFrom(''); setTo(''); setPage(1); }}
              className="text-sm text-slate-500 hover:text-red-500 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mr-2" />
            Cargando...
          </div>
        ) : devoluciones.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Sin devoluciones registradas</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {devoluciones.map(dev => (
              <div key={dev.id}>
                <div
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                  onClick={() => setExpanded(expanded === dev.id ? null : dev.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        dev.tipo === 'venta'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {dev.tipo}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white truncate">
                        {dev.motivo}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-3">
                      <span>{new Date(dev.created_at).toLocaleString('es-CL')}</span>
                      {dev.procesado_por && <span>por {dev.procesado_por.split('@')[0]}</span>}
                      {dev.orders && (
                        <span>
                          Orden:{' '}
                          <a
                            href={`/admin/ordenes/${dev.orders.id}`}
                            onClick={e => e.stopPropagation()}
                            className="text-cyan-600 hover:underline inline-flex items-center gap-1"
                          >
                            {dev.orders.id.slice(0, 8)}…
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </span>
                      )}
                      {dev.metodo_reembolso && (
                        <span>Reembolso: {METODOS[dev.metodo_reembolso as keyof typeof METODOS] || dev.metodo_reembolso}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {formatPrice(dev.total_devuelto)}
                    </div>
                    <div className="text-xs text-slate-400">{dev.items.length} ítem{dev.items.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>

                {/* Items expandibles */}
                {expanded === dev.id && (
                  <div className="px-4 pb-4 bg-slate-50 dark:bg-slate-700/30">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600">
                          <th className="text-left py-2">Producto</th>
                          <th className="text-right py-2">Cant.</th>
                          <th className="text-right py-2">Precio unit.</th>
                          <th className="text-right py-2">Subtotal</th>
                          <th className="text-center py-2">Restock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {dev.items.map(item => (
                          <tr key={item.id}>
                            <td className="py-2 text-slate-800 dark:text-slate-200">{item.product_name}</td>
                            <td className="py-2 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                            <td className="py-2 text-right text-slate-600 dark:text-slate-400">{formatPrice(item.unit_price)}</td>
                            <td className="py-2 text-right font-medium text-slate-800 dark:text-slate-200">{formatPrice(item.quantity * item.unit_price)}</td>
                            <td className="py-2 text-center">
                              {item.restock
                                ? <span className="text-green-600 text-xs font-medium">✓ Sí</span>
                                : <span className="text-slate-400 text-xs">No</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 dark:border-slate-600">
                          <td colSpan={3} className="py-2 text-right font-bold text-slate-700 dark:text-slate-300">Total devuelto:</td>
                          <td className="py-2 text-right font-bold text-orange-600 dark:text-orange-400">{formatPrice(dev.total_devuelto)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                    {dev.notas && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">Notas: {dev.notas}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Página {page} de {pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
