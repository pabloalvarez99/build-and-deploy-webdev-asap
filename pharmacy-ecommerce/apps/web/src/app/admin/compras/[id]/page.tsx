'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { purchaseOrderApi, type PurchaseOrder } from '@/lib/api'
import {
  ClipboardList, ArrowLeft, CheckCircle2, Clock, XCircle,
  Package, Calendar, Hash, User, FileText, PackageCheck, Printer,
  Pencil, Save, Trash2, X as XIcon, ImageIcon,
} from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  draft: { label: 'Borrador', icon: <Clock className="w-4 h-4" />, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  received: { label: 'Recibida', icon: <CheckCircle2 className="w-4 h-4" />, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Cancelada', icon: <XCircle className="w-4 h-4" />, cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

function formatCLP(value: string | null | number) {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? parseInt(value) : value
  return `$${num.toLocaleString('es-CL')}`
}

export default function CompraDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isReceiving, setIsReceiving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  // editDraft: itemId → { quantity, unit_cost }
  const [editDraft, setEditDraft] = useState<Record<string, { quantity: string; unit_cost: string }>>({})
  const [deletingItem, setDeletingItem] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    load()
  }, [user, router, params.id])

  async function load() {
    setIsLoading(true)
    try {
      const data = await purchaseOrderApi.get(params.id as string)
      setOrder(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  function startEdit() {
    if (!order) return
    const draft: Record<string, { quantity: string; unit_cost: string }> = {}
    for (const item of order.items ?? []) {
      draft[item.id] = {
        quantity: String(item.quantity),
        unit_cost: String(typeof item.unit_cost === 'string' ? parseInt(item.unit_cost) : Math.round(Number(item.unit_cost))),
      }
    }
    setEditDraft(draft)
    setIsEditing(true)
  }

  async function handleSaveEdit() {
    if (!order) return
    setIsSavingEdit(true)
    try {
      const items = Object.entries(editDraft).map(([id, v]) => ({
        id,
        quantity: Math.max(1, parseInt(v.quantity) || 1),
        unit_cost: Math.max(0, parseInt(v.unit_cost) || 0),
      }))
      const res = await fetch(`/api/admin/purchase-orders/${order.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) { alert((await res.text()) || 'Error al guardar'); return }
      setIsEditing(false)
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleDeleteItem(itemId: string, name: string) {
    if (!order || !confirm(`¿Eliminar "${name}" de la OC?`)) return
    setDeletingItem(itemId)
    try {
      const res = await fetch(`/api/admin/purchase-orders/${order.id}/items?item_id=${itemId}`, { method: 'DELETE' })
      if (!res.ok) { alert((await res.text()) || 'Error al eliminar'); return }
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeletingItem(null)
    }
  }

  async function handleReceive() {
    if (!order) return
    const mappedCount = (order.items ?? []).filter((i) => i.product_id).length
    if (mappedCount === 0) {
      alert('No hay productos mapeados. Ve a "Nueva compra" y mapea los productos antes de recibir.')
      return
    }
    if (!confirm(`¿Confirmar recepción? Se actualizará el stock de ${mappedCount} producto(s).`)) return
    setIsReceiving(true)
    try {
      const res = await fetch(`/api/admin/purchase-orders/${order.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const err = await res.text()
        alert(err || 'Error al recibir OC')
        return
      }
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al recibir')
    } finally {
      setIsReceiving(false)
    }
  }

  async function handleCancel() {
    if (!order || !confirm('¿Cancelar esta orden de compra?')) return
    setIsCancelling(true)
    try {
      await purchaseOrderApi.update(order.id, { status: 'cancelled' as PurchaseOrder['status'] })
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6 h-48" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">Orden no encontrada</p>
        <button onClick={() => router.push('/admin/compras')} className="mt-4 text-emerald-600 hover:underline text-sm">
          Volver a compras
        </button>
      </div>
    )
  }

  const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.draft

  return (
    <div className="max-w-2xl mx-auto space-y-6" id="purchase-order-print">
      {/* Header */}
      <div className="flex items-center gap-3 print:hidden">
        <button
          onClick={() => router.push('/admin/compras')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Orden de Compra
          </h1>
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${st.cls}`}>
            {st.icon}{st.label}
          </span>
        </div>
        <button
          onClick={() => window.print()}
          className="ml-auto flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block text-center mb-6">
        <p className="text-xl font-bold">Tu Farmacia — Orden de Compra</p>
        <p className="text-sm text-slate-500">
          {order.suppliers?.name} · {new Date(order.created_at).toLocaleDateString('es-CL')}
          {order.invoice_number ? ` · Factura #${order.invoice_number}` : ''}
        </p>
      </div>

      {/* Info card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Proveedor</p>
              {order.suppliers?.id ? (
                <Link href={`/admin/proveedores/${order.suppliers.id}`} className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                  {order.suppliers.name}
                </Link>
              ) : (
                <p className="font-semibold text-slate-900 dark:text-white">{order.suppliers?.name ?? '—'}</p>
              )}
            </div>
          </div>
          {order.invoice_number && (
            <div className="flex items-start gap-2">
              <Hash className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">N° Factura</p>
                <p className="font-semibold text-slate-900 dark:text-white">{order.invoice_number}</p>
              </div>
            </div>
          )}
          {order.invoice_date && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Fecha factura</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {new Date(order.invoice_date).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Registrada por</p>
              <p className="font-semibold text-slate-900 dark:text-white">{order.created_by}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fecha ingreso</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                {new Date(order.created_at).toLocaleDateString('es-CL')}
              </p>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="flex items-start gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600 dark:text-slate-400">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Invoice image */}
      {order.image_url && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden print:hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900 dark:text-white">Imagen de Factura</h2>
            </div>
            <a
              href={order.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Ver imagen completa
            </a>
          </div>
          <div className="p-4">
            <a href={order.image_url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.image_url}
                alt="Factura"
                className="w-full rounded-xl object-contain max-h-96 bg-slate-50 dark:bg-slate-900 cursor-zoom-in hover:opacity-90 transition-opacity"
              />
            </a>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Productos ({order.items?.length ?? 0})
          </h2>
          {order.status === 'draft' && !isEditing && (
            <button
              onClick={startEdit}
              className="print:hidden flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <XIcon className="w-3.5 h-3.5" />
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingEdit ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="px-6 py-4">
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate text-sm">
                      {item.products?.name ?? item.product_name_invoice ?? '—'}
                    </p>
                    {!item.product_id && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">Sin mapear</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      <label className="text-xs text-slate-400">Cant.</label>
                      <input
                        type="number"
                        min="1"
                        value={editDraft[item.id]?.quantity ?? item.quantity}
                        onChange={(e) => setEditDraft((d) => ({ ...d, [item.id]: { ...d[item.id], quantity: e.target.value } }))}
                        className="w-16 text-right text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <label className="text-xs text-slate-400">Costo unit.</label>
                      <input
                        type="number"
                        min="0"
                        value={editDraft[item.id]?.unit_cost ?? Math.round(Number(item.unit_cost))}
                        onChange={(e) => setEditDraft((d) => ({ ...d, [item.id]: { ...d[item.id], unit_cost: e.target.value } }))}
                        className="w-24 text-right text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.products?.name ?? item.product_name_invoice ?? 'este item')}
                      disabled={deletingItem === item.id}
                      className="mt-4 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40"
                      title="Eliminar item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {item.products?.name ?? item.product_name_invoice ?? '—'}
                    </p>
                    {item.supplier_product_code && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Código proveedor: {item.supplier_product_code}</p>
                    )}
                    {!item.product_id && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">Sin mapear</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.quantity} × {formatCLP(item.unit_cost)}</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{formatCLP(item.subtotal)}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <span className="font-medium text-slate-700 dark:text-slate-300">Total</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCLP(order.total_cost)}</span>
        </div>
      </div>

      {/* Actions (hidden on print) */}
      {order.status === 'draft' && (
        <div className="flex gap-3 print:hidden">
          <button
            onClick={handleReceive}
            disabled={isReceiving || isCancelling || isEditing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40"
          >
            <PackageCheck className="w-4 h-4" />
            {isReceiving ? 'Recibiendo...' : 'Recibir OC'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isCancelling || isReceiving || isEditing}
            className="px-4 py-3 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
          >
            {isCancelling ? '...' : 'Cancelar'}
          </button>
        </div>
      )}
      {order.status === 'received' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Orden recibida — stock actualizado
        </div>
      )}
    </div>
  )
}
