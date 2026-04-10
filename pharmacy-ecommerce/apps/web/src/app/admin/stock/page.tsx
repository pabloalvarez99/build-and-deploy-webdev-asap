'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { TrendingUp, TrendingDown, Package, ChevronLeft, ChevronRight } from 'lucide-react'

interface StockMovement {
  id: string
  product_id: string | null
  delta: number
  reason: string
  admin_id: string
  created_at: string
  products: { id: string; name: string; slug: string } | null
}

const REASON_CONFIG: Record<string, { label: string; color: string }> = {
  purchase: { label: 'Compra OC', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  sale_pos: { label: 'Venta POS', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  sale: { label: 'Venta online', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
  cancelled: { label: 'Cancelación', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  adjustment: { label: 'Ajuste manual', color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400' },
}

const REASONS = ['', 'purchase', 'sale_pos', 'sale', 'cancelled', 'adjustment']

export default function StockMovementsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [reasonFilter, setReasonFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
  }, [user, router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '50' })
      if (reasonFilter) qs.set('reason', reasonFilter)
      const res = await fetch(`/api/admin/stock-movements?${qs}`)
      if (!res.ok) return
      const data = await res.json()
      setMovements(data.movements)
      setTotal(data.total)
      setTotalPages(data.total_pages)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }, [page, reasonFilter])

  useEffect(() => { load() }, [load])

  function handleReasonChange(r: string) {
    setReasonFilter(r)
    setPage(1)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Movimientos de Stock</h1>
        <span className="ml-auto text-sm text-slate-500 dark:text-slate-400">{total} registros</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {REASONS.map((r) => {
          const cfg = r ? REASON_CONFIG[r] : null
          return (
            <button
              key={r || 'all'}
              onClick={() => handleReasonChange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                reasonFilter === r
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {cfg ? cfg.label : 'Todos'}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Sin movimientos para este filtro</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  {['Fecha', 'Producto', 'Delta', 'Motivo', 'Usuario'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {movements.map((m) => {
                  const cfg = REASON_CONFIG[m.reason] ?? { label: m.reason, color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400' }
                  const isPositive = m.delta > 0
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-xs">
                        {new Date(m.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-[240px] truncate">
                        {m.products?.name ?? <span className="text-slate-400">Producto eliminado</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 font-bold w-fit px-2 py-0.5 rounded-lg text-sm ${
                          isPositive
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        }`}>
                          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {isPositive ? '+' : ''}{m.delta}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs truncate max-w-[140px]">
                        {m.admin_id}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
