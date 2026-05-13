'use client'

import { useEffect, useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Percent } from 'lucide-react'

interface MonthRow {
  month: string
  label: string
  sales: number
  costs: number
  margin: number
  margin_pct: number
}

interface MarginResponse {
  months: number
  data: MonthRow[]
  totals: { sales: number; costs: number; margin: number; margin_pct: number }
}

function formatCLP(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${Math.round(n)}`
}

function formatCLPFull(n: number): string {
  return `$${Math.round(n).toLocaleString('es-CL')}`
}

export function MarginChart() {
  const [months, setMonths] = useState(6)
  const [summary, setSummary] = useState<MarginResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let aborted = false
    setLoading(true)
    setError(null)
    fetch(`/api/admin/purchase-orders/monthly-margin?months=${months}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => { if (!aborted) setSummary(d) })
      .catch((e) => { if (!aborted) setError(e instanceof Error ? e.message : 'Error cargando margen') })
      .finally(() => { if (!aborted) setLoading(false) })
    return () => { aborted = true }
  }, [months])

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando margen…</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-red-200 dark:border-red-700 p-6">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }
  if (!summary) return null

  const t = summary.totals
  const marginPositive = t.margin >= 0
  const MarginIcon = marginPositive ? TrendingUp : TrendingDown

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Percent className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Margen mensual (ventas vs costos)</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ventas: orders paid/completed · costos: OC recibidas
          </span>
        </div>
        <select
          value={months}
          onChange={(e) => setMonths(parseInt(e.target.value, 10))}
          className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          <option value={3}>Últimos 3 meses</option>
          <option value={6}>Últimos 6 meses</option>
          <option value={12}>Últimos 12 meses</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
          <div className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-medium">Ventas</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{formatCLPFull(t.sales)}</div>
        </div>
        <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 px-4 py-3">
          <div className="text-[11px] uppercase tracking-wide text-rose-700 dark:text-rose-400 font-medium">Costos</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{formatCLPFull(t.costs)}</div>
        </div>
        <div className={`rounded-xl px-4 py-3 ${marginPositive ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
          <div className={`flex items-center gap-1 text-[11px] uppercase tracking-wide font-medium ${marginPositive ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'}`}>
            <MarginIcon className="w-3 h-3" />
            Margen
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{formatCLPFull(t.margin)}</div>
        </div>
        <div className={`rounded-xl px-4 py-3 ${marginPositive ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
          <div className={`text-[11px] uppercase tracking-wide font-medium ${marginPositive ? 'text-violet-700 dark:text-violet-400' : 'text-amber-700 dark:text-amber-400'}`}>% Margen</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{t.margin_pct.toFixed(1)}%</div>
        </div>
      </div>

      {summary.data.every((d) => d.sales === 0 && d.costs === 0) ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
          Sin movimientos en el período.
        </p>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={summary.data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tickFormatter={formatCLP} tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                tick={{ fontSize: 12 }}
                domain={[(dataMin: number) => Math.min(0, Math.floor(dataMin)), (dataMax: number) => Math.max(100, Math.ceil(dataMax))]}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                formatter={((value: unknown, name: unknown) => {
                  const v = typeof value === 'number' ? value : Number(value ?? 0)
                  const n = String(name ?? '')
                  if (n === '% Margen') return [`${v.toFixed(1)}%`, n]
                  return [formatCLPFull(v), n]
                }) as never}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="sales" name="Ventas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="costs" name="Costos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="margin_pct"
                name="% Margen"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
