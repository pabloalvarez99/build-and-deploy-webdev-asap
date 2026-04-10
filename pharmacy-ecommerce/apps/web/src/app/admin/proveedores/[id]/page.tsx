'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { supplierApi, type Supplier } from '@/lib/api'
import {
  Truck, ArrowLeft, Mail, Phone, Globe, FileText, ClipboardList,
  Package, CheckCircle2, Clock, XCircle, Hash,
} from 'lucide-react'
import Link from 'next/link'

interface PurchaseOrderSummary {
  id: string
  status: string
  invoice_number: string | null
  invoice_date: string | null
  total_cost: string | null
  created_at: string
  _count?: { items: number }
}

interface SupplierDetail extends Supplier {
  purchase_orders?: PurchaseOrderSummary[]
  supplier_product_mappings?: Array<{
    id: string
    supplier_code: string
    products: { name: string; stock: number } | null
  }>
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  draft:     { label: 'Borrador', icon: <Clock className="w-3.5 h-3.5" />,        cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  received:  { label: 'Recibida', icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  cancelled: { label: 'Cancelada', icon: <XCircle className="w-3.5 h-3.5" />,     cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
}

function formatCLP(v: string | null | number) {
  if (v === null || v === undefined) return '—'
  const n = typeof v === 'string' ? parseInt(v) : v
  return `$${n.toLocaleString('es-CL')}`
}

export default function ProveedorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    load()
  }, [user, router, params.id])

  async function load() {
    setLoading(true)
    try {
      const data = await supplierApi.get(params.id as string) as SupplierDetail
      setSupplier(data)
    } catch { /* fail */ }
    finally { setLoading(false) }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
        <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">Proveedor no encontrado</p>
        <button onClick={() => router.push('/admin/proveedores')} className="mt-4 text-emerald-600 hover:underline text-sm">
          Volver a proveedores
        </button>
      </div>
    )
  }

  const orders = (supplier.purchase_orders ?? []) as PurchaseOrderSummary[]
  const mappings = supplier.supplier_product_mappings ?? []
  const totalSpend = orders
    .filter((o) => o.status === 'received')
    .reduce((s, o) => s + (o.total_cost ? parseInt(o.total_cost) : 0), 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/proveedores')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <Truck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex-1 truncate">{supplier.name}</h1>
        {!supplier.active && (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Inactivo</span>
        )}
        <Link
          href={`/admin/compras/nueva?supplier_id=${supplier.id}`}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Package className="w-4 h-4" />
          Nueva OC
        </Link>
      </div>

      {/* Info card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          {supplier.rut && (
            <div className="flex items-start gap-2">
              <Hash className="w-4 h-4 text-slate-400 mt-0.5" />
              <div><p className="text-xs text-slate-500">RUT</p><p className="font-semibold text-slate-900 dark:text-white">{supplier.rut}</p></div>
            </div>
          )}
          {supplier.contact_name && (
            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 text-slate-400 mt-0.5" />
              <div><p className="text-xs text-slate-500">Contacto</p><p className="font-semibold text-slate-900 dark:text-white">{supplier.contact_name}</p></div>
            </div>
          )}
          {supplier.contact_email && (
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
              <div><p className="text-xs text-slate-500">Email</p><a href={`mailto:${supplier.contact_email}`} className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">{supplier.contact_email}</a></div>
            </div>
          )}
          {supplier.contact_phone && (
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
              <div><p className="text-xs text-slate-500">Teléfono</p><p className="font-semibold text-slate-900 dark:text-white">{supplier.contact_phone}</p></div>
            </div>
          )}
          {supplier.website && (
            <div className="flex items-start gap-2">
              <Globe className="w-4 h-4 text-slate-400 mt-0.5" />
              <div><p className="text-xs text-slate-500">Web</p><a href={supplier.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline truncate">{supplier.website}</a></div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <ClipboardList className="w-4 h-4 text-slate-400 mt-0.5" />
            <div><p className="text-xs text-slate-500">Total comprado</p><p className="font-bold text-slate-900 dark:text-white text-lg">{formatCLP(totalSpend)}</p></div>
          </div>
        </div>
        {supplier.notes && (
          <div className="flex items-start gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
            <p className="text-sm text-slate-600 dark:text-slate-400">{supplier.notes}</p>
          </div>
        )}
      </div>

      {/* Order history */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">Órdenes de compra ({orders.length})</h2>
          <Link href={`/admin/compras?supplier_id=${supplier.id}`} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
            Ver todas
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 text-sm">Sin órdenes de compra aún</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {orders.slice(0, 10).map((o) => {
              const st = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.draft
              return (
                <Link key={o.id} href={`/admin/compras/${o.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                    {st.icon}{st.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 dark:text-white">
                      {o.invoice_number ? `Factura #${o.invoice_number}` : `OC ${o.id.slice(0, 8)}...`}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(o.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCLP(o.total_cost)}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Mapped products */}
      {mappings.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-semibold text-slate-900 dark:text-white">Productos mapeados ({mappings.length})</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {mappings.slice(0, 20).map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-6 py-3">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{m.supplier_code}</span>
                <span className="flex-1 text-sm text-slate-900 dark:text-white">{m.products?.name ?? '—'}</span>
                {m.products && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">Stock: {m.products.stock}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
