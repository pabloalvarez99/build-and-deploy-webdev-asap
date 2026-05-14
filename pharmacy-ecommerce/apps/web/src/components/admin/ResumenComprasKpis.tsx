'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Receipt, Trophy } from 'lucide-react'

interface TopProduct {
  product_id: string
  name: string
  qty: number
  spend: number
}

interface KpisResponse {
  months: number
  draft: { total: number; over_7d: number; pct_over_7d: number }
  avg_ticket: number
  received_count: number
  top_products: TopProduct[]
}

function formatCLP(n: number): string {
  return `$${Math.round(n).toLocaleString('es-CL')}`
}

export function ResumenComprasKpis() {
  const [data, setData] = useState<KpisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/purchase-orders/kpis?months=6')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [])

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 p-4 text-sm text-red-700 dark:text-red-400">
        Error cargando KPIs: {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-4 h-28 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Drafts sin recibir >7d */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Borradores sin recibir &gt;7d
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{data.draft.over_7d}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">/ {data.draft.total} drafts</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {data.draft.pct_over_7d}% del total
          </div>
        </div>

        {/* Ticket promedio */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1.5">
            <Receipt className="w-4 h-4 text-emerald-500" />
            Ticket promedio OC
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCLP(data.avg_ticket)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {data.received_count} OC recibidas · últimos {data.months}m
          </div>
        </div>

        {/* Total comprado ventana */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            Top productos (gasto)
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {data.top_products.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ítems únicos en top 5
          </div>
        </div>
      </div>

      {/* Top 5 productos comprados */}
      {data.top_products.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Top 5 productos comprados · últimos {data.months} meses</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <th className="text-left px-5 py-2 font-medium">#</th>
                <th className="text-left px-5 py-2 font-medium">Producto</th>
                <th className="text-right px-5 py-2 font-medium">Unidades</th>
                <th className="text-right px-5 py-2 font-medium">Gasto</th>
              </tr>
            </thead>
            <tbody>
              {data.top_products.map((p, i) => (
                <tr key={p.product_id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                  <td className="px-5 py-2 text-slate-500 dark:text-slate-400">{i + 1}</td>
                  <td className="px-5 py-2 text-slate-900 dark:text-white">{p.name}</td>
                  <td className="px-5 py-2 text-right text-slate-700 dark:text-slate-300">{p.qty.toLocaleString('es-CL')}</td>
                  <td className="px-5 py-2 text-right font-medium text-slate-900 dark:text-white">{formatCLP(p.spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
