'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { purchaseOrderApi, supplierApi, type PurchaseOrder, type Supplier } from '@/lib/api'
import { ClipboardList, Plus, Eye, Filter, CheckCircle2, Clock, XCircle } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  draft: { label: 'Borrador', icon: <Clock className="w-3.5 h-3.5" />, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  received: { label: 'Recibida', icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Cancelada', icon: <XCircle className="w-3.5 h-3.5" />, cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

function formatCLP(value: string | null) {
  if (!value) return '—'
  return `$${parseInt(value).toLocaleString('es-CL')}`
}

export default function ComprasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()

  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [supplierFilter, setSupplierFilter] = useState(searchParams.get('supplier_id') || '')

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await purchaseOrderApi.list({
        page,
        limit: 20,
        status: statusFilter || undefined,
        supplier_id: supplierFilter || undefined,
      })
      setOrders(data.orders)
      setTotal(data.total)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, supplierFilter])

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    supplierApi.list().then((d) => setSuppliers(d.suppliers)).catch(console.error)
  }, [user, router])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Órdenes de Compra</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{total} orden(es)</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/admin/compras/nueva')}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva compra
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Filter className="w-4 h-4" />
          Filtros:
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="received">Recibida</option>
          <option value="cancelled">Cancelada</option>
        </select>
        <select
          value={supplierFilter}
          onChange={(e) => { setSupplierFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todos los proveedores</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-4 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Sin órdenes de compra</p>
          <button
            onClick={() => router.push('/admin/compras/nueva')}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            Crear primera compra
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const st = STATUS_LABELS[o.status] ?? STATUS_LABELS.draft
            return (
              <div
                key={o.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-4 flex items-center gap-4 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                onClick={() => router.push(`/admin/compras/${o.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {o.suppliers?.name ?? '—'}
                    </span>
                    {o.invoice_number && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Factura #{o.invoice_number}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>
                      {st.icon}{st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                    <span>{new Date(o.created_at).toLocaleDateString('es-CL')}</span>
                    {o._count && <span>{o._count.items} producto(s)</span>}
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatCLP(o.total_cost)}</span>
                  </div>
                </div>
                <Eye className="w-5 h-5 text-slate-400 shrink-0" />
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400">Página {page} de {Math.ceil(total / 20)}</span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
