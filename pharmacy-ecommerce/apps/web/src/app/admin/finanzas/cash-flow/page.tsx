'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface DayEntry {
  date: string;
  inflow: number;
  outflow: number;
  projected_outflow: number;
  balance: number;
  is_past: boolean;
}

function formatCLP(n: number) { return `$${Math.round(n).toLocaleString('es-CL')}`; }
function shortDate(s: string) {
  const d = new Date(s + 'T12:00:00');
  return `${d.getDate()}/${d.getMonth()+1}`;
}

export default function CashFlowPage() {
  const [days, setDays] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/finanzas/cash-flow')
      .then(r => r.json())
      .then(d => setDays(d.days || []))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = days.find(d => d.date === today);

  const chartData = days
    .filter((_, i) => i % 2 === 0)
    .map(d => ({
      name: shortDate(d.date),
      Balance: d.balance,
      is_past: d.is_past,
    }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-emerald-600" />
        Cash Flow — 30d reales + 30d proyección
      </h2>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
              <p className="text-xs text-slate-500">Balance acumulado hoy</p>
              <p className={`text-xl font-bold ${(todayEntry?.balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCLP(todayEntry?.balance || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
              <p className="text-xs text-slate-500">Ingresos reales 30d</p>
              <p className="text-xl font-bold text-emerald-600">{formatCLP(days.filter(d => d.is_past).reduce((s, d) => s + d.inflow, 0))}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
              <p className="text-xs text-slate-500">Salidas proyectadas 30d</p>
              <p className="text-xl font-bold text-red-600">{formatCLP(days.filter(d => !d.is_past).reduce((s, d) => s + d.projected_outflow, 0))}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Balance acumulado (real + proyectado)</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v) => formatCLP(Number(v))} />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 2" />
                <Area type="monotone" dataKey="Balance" stroke="#10b981" fill="url(#balGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 mt-2">Datos pasados: reales. Futuros: OC vencimiento + recurrentes activos.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Próximas salidas proyectadas</h3>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-64 overflow-y-auto">
              {days.filter(d => !d.is_past && d.projected_outflow > 0).map(d => (
                <div key={d.date} className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {new Date(d.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-sm font-medium text-red-600">{formatCLP(d.projected_outflow)}</span>
                </div>
              ))}
              {days.filter(d => !d.is_past && d.projected_outflow > 0).length === 0 && (
                <p className="text-sm text-slate-400 p-4 text-center">Sin salidas proyectadas en los próximos 30 días.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
