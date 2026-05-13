'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface Supplier {
  id: string
  name: string
}

interface MonthRow {
  month: string
  label: string
  total: number
  [supplierName: string]: string | number
}

interface SummaryResponse {
  months: number
  data: MonthRow[]
  suppliers: Supplier[]
}

const COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ef4444', // red
  '#84cc16', // lime
]

function formatCLP(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${n}`
}

function formatCLPFull(n: number): string {
  return `$${Math.round(n).toLocaleString('es-CL')}`
}

export function MonthlySummaryChart() {
  const [months, setMonths] = useState(6)
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let aborted = false
    setLoading(true)
    setError(null)
    fetch(`/api/admin/purchase-orders/monthly-summary?months=${months}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text() || `HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => { if (!aborted) setSummary(d) })
      .catch((e) => { if (!aborted) setError(e instanceof Error ? e.message : 'Error cargando resumen') })
      .finally(() => { if (!aborted) setLoading(false) })
    return () => { aborted = true }
  }, [months])

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando resumen…</p>
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

  const totalPeriod = summary.data.reduce((acc, r) => acc + r.total, 0)
  const totalBySupplier = summary.suppliers.map((s) => ({
    ...s,
    total: summary.data.reduce((acc, r) => acc + Number(r[s.name] || 0), 0),
  })).sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Gasto mensual en compras</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">solo OCs recibidas</span>
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

        {summary.suppliers.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
            Sin OCs recibidas en el período.
          </p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatCLP} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v) => formatCLPFull(Number(v))}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {summary.suppliers.map((s, i) => (
                  <Bar key={s.id} dataKey={s.name} stackId="gasto" fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">Total período</h3>
          <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCLPFull(totalPeriod)}</span>
        </div>
        {totalBySupplier.length > 0 && (
          <div className="space-y-1.5">
            {totalBySupplier.map((s, i) => {
              const pct = totalPeriod > 0 ? (s.total / totalPeriod) * 100 : 0
              return (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">{s.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">{pct.toFixed(0)}%</span>
                  <span className="text-slate-900 dark:text-white font-medium tabular-nums">{formatCLPFull(s.total)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
