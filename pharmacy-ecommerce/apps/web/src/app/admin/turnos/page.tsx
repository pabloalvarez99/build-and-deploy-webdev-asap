'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock, RefreshCw, Loader2, AlertCircle, Download,
  ChevronLeft, ChevronRight, TrendingUp, Banknote,
  CreditCard, Smartphone, ArrowUpDown, FileText,
} from 'lucide-react';

interface CajaCierre {
  id: string;
  turno_inicio: string;
  turno_fin: string;
  fondo_inicial: number;
  ventas_efectivo: number;
  ventas_debito: number;
  ventas_credito: number;
  ventas_total: number;
  num_transacciones: number;
  efectivo_esperado: number;
  efectivo_contado: number;
  diferencia: number;
  notas: string | null;
  cerrado_por: string | null;
}

interface Response {
  items: CajaCierre[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

function fmtCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

function duracion(inicio: string, fin: string) {
  const mins = Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function DiferenciaCell({ v }: { v: number }) {
  if (v === 0) return <span className="text-emerald-600 dark:text-emerald-400 font-bold">$0</span>;
  const abs = Math.abs(v);
  const color = abs > 5000 ? 'text-red-600 dark:text-red-400' : abs > 1000 ? 'text-amber-600 dark:text-amber-400' : 'text-yellow-600 dark:text-yellow-400';
  return <span className={`font-bold ${color}`}>{v > 0 ? '+' : ''}{fmtCLP(v)}</span>;
}

export default function TurnosCajaPage() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/admin/turnos?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar turnos');
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [page, from, to]);

  useEffect(() => { load(); }, [load]);

  const handleFilter = () => { setPage(1); load(1); };

  const handleCsv = () => {
    const params = new URLSearchParams({ format: 'csv' });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    window.open(`/api/admin/turnos?${params}`, '_blank');
  };

  const items = data?.items ?? [];
  const pg = data?.pagination;

  // Aggregate stats for filtered period
  const totalVentas = items.reduce((s, c) => s + c.ventas_total, 0);
  const totalTransacciones = items.reduce((s, c) => s + c.num_transacciones, 0);
  const totalDiferencia = items.reduce((s, c) => s + c.diferencia, 0);
  const turnosConError = items.filter(c => Math.abs(c.diferencia) > 1000).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            Historial de Turnos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Registro de cierres de caja y arqueos
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => load()}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date filter */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Desde</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-emerald-400 focus:outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Hasta</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-emerald-400 focus:outline-none" />
          </div>
          <button onClick={handleFilter}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors">
            Filtrar
          </button>
          {(from || to) && (
            <button onClick={() => { setFrom(''); setTo(''); setPage(1); }}
              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              Limpiar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Period summary */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Ventas período', value: fmtCLP(totalVentas), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Transacciones', value: totalTransacciones, icon: ArrowUpDown, color: 'text-slate-700 dark:text-slate-200' },
            { label: 'Dif. acumulada', value: fmtCLP(totalDiferencia), icon: Banknote, color: Math.abs(totalDiferencia) > 5000 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200' },
            { label: 'Turnos con error', value: turnosConError, icon: AlertCircle, color: turnosConError > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <kpi.icon className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
              </div>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay turnos registrados</p>
          <p className="text-sm mt-1">Los cierres de caja aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(c => {
            const isExpanded = expanded === c.id;
            const absDif = Math.abs(c.diferencia);
            const dificColor = c.diferencia === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
              : absDif > 5000 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';

            return (
              <div key={c.id}
                className={`rounded-2xl border-2 transition-all ${isExpanded ? 'border-emerald-400 dark:border-emerald-600 shadow-sm' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                <button className="w-full text-left p-4" onClick={() => setExpanded(isExpanded ? null : c.id)}>
                  <div className="flex items-center gap-3">
                    {/* Date */}
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {new Date(c.turno_fin).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {fmtDate(c.turno_inicio)} → {fmtDate(c.turno_fin)}
                        </span>
                        <span className="text-xs text-slate-400">({duracion(c.turno_inicio, c.turno_fin)})</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-500">{c.cerrado_por ?? 'Sin registrar'}</span>
                        <span className="text-xs text-slate-400">· {c.num_transacciones} transacciones</span>
                      </div>
                    </div>

                    {/* Ventas + diferencia */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{fmtCLP(c.ventas_total)}</p>
                      <DiferenciaCell v={c.diferencia} />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                      {/* Breakdown by payment method */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: 'Efectivo', value: c.ventas_efectivo, icon: Banknote },
                          { label: 'Débito', value: c.ventas_debito, icon: CreditCard },
                          { label: 'Crédito', value: c.ventas_credito, icon: Smartphone },
                        ].map(m => (
                          <div key={m.label} className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3 text-center">
                            <m.icon className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">{m.label}</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{fmtCLP(m.value)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Caja detail */}
                      <div className={`rounded-xl border p-3 space-y-1.5 ${dificColor}`}>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Fondo inicial</span>
                          <span className="font-medium text-slate-800 dark:text-slate-100">{fmtCLP(c.fondo_inicial)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Efectivo esperado</span>
                          <span className="font-medium text-slate-800 dark:text-slate-100">{fmtCLP(c.efectivo_esperado)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Efectivo contado</span>
                          <span className="font-medium text-slate-800 dark:text-slate-100">{fmtCLP(c.efectivo_contado)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold border-t border-current/20 pt-1.5 mt-1.5">
                          <span>Diferencia</span>
                          <DiferenciaCell v={c.diferencia} />
                        </div>
                      </div>

                      {c.notas && (
                        <div className="flex items-start gap-2 mt-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3">
                          <FileText className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                          {c.notas}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pg && pg.pages > 1 && (
        <div className="flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Página {pg.page} de {pg.pages} · {pg.total} turnos
          </span>
          <button disabled={page >= pg.pages} onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
