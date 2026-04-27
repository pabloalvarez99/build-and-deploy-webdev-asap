'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Loader2, Filter, UserCheck, ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';

interface Prescription {
  id: string;
  product_name: string;
  quantity: number;
  patient_name: string;
  is_controlled: boolean;
  dispensed_at: string;
}

interface Shift {
  id: string;
  pharmacist_name: string;
  pharmacist_rut: string;
  shift_start: string;
  shift_end: string | null;
  notes: string | null;
  rx_count: number;
  prescriptions: Prescription[];
}

interface PageData {
  shifts: Shift[];
  total: number;
  page: number;
  limit: number;
}

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function duration(start: string, end: string | null) {
  if (!end) return 'En curso';
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TurnosFarmaceuticoPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/admin/turnos-farmaceutico?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [from, to, page]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    load();
  }, [user, router, load]);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <UserCheck className="w-6 h-6 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Turnos Farmacéutico</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400">Filtros:</span>
        </div>
        <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}
          className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" />
        <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}
          className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
      ) : !data || data.shifts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Sin turnos para el período seleccionado.</div>
      ) : (
        <div className="space-y-3">
          {data.shifts.map(shift => (
            <div key={shift.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              {/* Shift header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer select-none"
                onClick={() => toggleExpand(shift.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-xl p-2 shrink-0">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{shift.pharmacist_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{shift.pharmacist_rut}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 ml-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Inicio</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{fmtDt(shift.shift_start)}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Fin</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {shift.shift_end ? fmtDt(shift.shift_end) : <span className="text-amber-500">En curso</span>}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Duración</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{duration(shift.shift_start, shift.shift_end)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Recetas</p>
                    <p className="text-lg font-bold text-emerald-600">{shift.rx_count}</p>
                  </div>
                  {shift.rx_count > 0
                    ? (expanded.has(shift.id) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)
                    : <div className="w-4" />
                  }
                </div>
              </div>

              {/* Mobile date row */}
              <div className="sm:hidden px-4 pb-3 -mt-2 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>Inicio: <span className="text-slate-700 dark:text-slate-200">{fmtDt(shift.shift_start)}</span></span>
                <span>Fin: <span className="text-slate-700 dark:text-slate-200">{shift.shift_end ? fmtDt(shift.shift_end) : 'En curso'}</span></span>
              </div>

              {shift.notes && (
                <p className="px-4 pb-3 text-xs text-slate-500 dark:text-slate-400 italic">{shift.notes}</p>
              )}

              {/* Prescriptions */}
              {expanded.has(shift.id) && shift.prescriptions.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-700 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Hora</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Producto</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Paciente</th>
                        <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Q</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shift.prescriptions.map(rx => (
                        <tr key={rx.id} className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                            {new Date(rx.dispensed_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1.5">
                              {rx.is_controlled && <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                              <span className="text-slate-800 dark:text-slate-100">{rx.product_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{rx.patient_name}</td>
                          <td className="px-4 py-2 text-center text-slate-700 dark:text-slate-200">{rx.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data.total} turnos · página {page}/{totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
