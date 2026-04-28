'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MonthData {
  month: number;
  ingresos: number;
  gastos: number;
  margen: number;
  ingresos_prev: number;
  gastos_prev: number;
  margen_prev: number;
}
interface PylData {
  year: number;
  months: MonthData[];
  ytd: { ingresos: number; gastos: number; margen: number };
}

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function formatCLP(n: number) { return `$${Math.round(n).toLocaleString('es-CL')}`; }
function pct(cur: number, prev: number) {
  if (!prev) return null;
  const d = ((cur - prev) / Math.abs(prev)) * 100;
  return (d >= 0 ? '+' : '') + d.toFixed(1) + '%';
}

export default function PylPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<PylData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/finanzas/pyl?year=${year}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [year]);

  const chartData = data?.months.map(m => ({
    name: MONTH_NAMES[m.month - 1],
    Ingresos: m.ingresos,
    Gastos: m.gastos,
    Margen: m.margen,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          P&L — {year}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 w-12 text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} disabled={year >= new Date().getFullYear()} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Ingresos YTD', value: data.ytd.ingresos, color: 'text-emerald-600' },
              { label: 'Gastos YTD', value: data.ytd.gastos, color: 'text-red-600' },
              { label: 'Margen YTD', value: data.ytd.margen, color: data.ytd.margen >= 0 ? 'text-emerald-600' : 'text-red-600' },
            ].map(k => (
              <div key={k.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{formatCLP(k.value)}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v) => formatCLP(Number(v))} />
                <Legend />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="Gastos" fill="#ef4444" radius={[4,4,0,0]} />
                <Bar dataKey="Margen" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Mes</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Ingresos</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">YoY</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Gastos</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {data.months.map(m => {
                    const yoy = pct(m.ingresos, m.ingresos_prev);
                    return (
                      <tr key={m.month} className={m.ingresos === 0 ? 'opacity-40' : ''}>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{MONTH_NAMES[m.month-1]}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatCLP(m.ingresos)}</td>
                        <td className={`px-4 py-3 text-right text-xs ${yoy && yoy.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{yoy || '-'}</td>
                        <td className="px-4 py-3 text-right text-red-500">{formatCLP(m.gastos)}</td>
                        <td className={`px-4 py-3 text-right font-bold ${m.margen >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCLP(m.margen)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
