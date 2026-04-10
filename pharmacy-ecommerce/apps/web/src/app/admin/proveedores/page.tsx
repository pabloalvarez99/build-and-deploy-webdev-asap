'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { supplierApi, type Supplier } from '@/lib/api'
import { Truck, Plus, Edit2, Trash2, Phone, Mail, Globe, Package, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

const emptyForm = {
  name: '', rut: '', contact_name: '', contact_email: '',
  contact_phone: '', website: '', notes: '', active: true,
}

export default function ProveedoresPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [includeInactive, setIncludeInactive] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    load()
  }, [user, router, includeInactive])

  async function load() {
    setIsLoading(true)
    try {
      const data = await supplierApi.list(includeInactive)
      setSuppliers(data.suppliers)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  function openCreate() {
    setEditingSupplier(null)
    setFormData(emptyForm)
    setShowForm(true)
  }

  function openEdit(s: Supplier) {
    setEditingSupplier(s)
    setFormData({
      name: s.name, rut: s.rut || '', contact_name: s.contact_name || '',
      contact_email: s.contact_email || '', contact_phone: s.contact_phone || '',
      website: s.website || '', notes: s.notes || '', active: s.active,
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) return
    setIsSaving(true)
    try {
      if (editingSupplier) {
        await supplierApi.update(editingSupplier.id, formData)
      } else {
        await supplierApi.create(formData)
      }
      setShowForm(false)
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    try {
      await supplierApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Proveedores</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{suppliers.length} proveedor(es)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded"
            />
            Ver inactivos
          </label>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo proveedor
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-5 animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3" />
              <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-20">
          <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Sin proveedores registrados</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Agrega tu primer proveedor para comenzar</p>
          <button onClick={openCreate} className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
            Crear proveedor
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <div key={s.id} className={`bg-white dark:bg-slate-800 rounded-2xl border-2 p-5 space-y-3 ${s.active ? 'border-slate-100 dark:border-slate-700' : 'border-slate-200 dark:border-slate-600 opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/admin/proveedores/${s.id}`} className="font-semibold text-slate-900 dark:text-white text-lg leading-tight hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{s.name}</Link>
                  {s.rut && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">RUT {s.rut}</p>}
                  {!s.active && <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">Inactivo</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(s)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Editar">
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                  <button onClick={() => setDeleteConfirm(s)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Eliminar">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                {s.contact_name && <p className="text-slate-700 dark:text-slate-300">{s.contact_name}</p>}
                {s.contact_phone && (
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5" />{s.contact_phone}
                  </div>
                )}
                {s.contact_email && (
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Mail className="w-3.5 h-3.5" />{s.contact_email}
                  </div>
                )}
                {s.website && (
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Globe className="w-3.5 h-3.5" />
                    <a href={s.website} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 truncate max-w-[180px]">{s.website}</a>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Package className="w-3.5 h-3.5" />
                  {s._count?.purchase_orders ?? 0} OC(s)
                </div>
                {s.last_order && (
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    Último: {new Date(s.last_order.created_at).toLocaleDateString('es-CL')}
                  </div>
                )}
                <button
                  onClick={() => router.push(`/admin/compras?supplier_id=${s.id}`)}
                  className="ml-auto flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Ver compras
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-5">
                {editingSupplier ? 'Editar proveedor' : 'Nuevo proveedor'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ej: Mediven S.A."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">RUT</label>
                  <input
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="76.123.456-7"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contacto</label>
                    <input
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                    <input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="ventas@proveedor.cl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sitio web</label>
                  <input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://proveedor.cl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    placeholder="Condiciones de pago, días de entrega, etc."
                  />
                </div>
                {editingSupplier && (
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="rounded"
                    />
                    Proveedor activo
                  </label>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
                  >
                    {isSaving ? 'Guardando...' : editingSupplier ? 'Guardar cambios' : 'Crear proveedor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">¿Eliminar proveedor?</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-5">
              Se eliminará <strong>{deleteConfirm.name}</strong>. Esta acción no se puede deshacer.
              Si tiene órdenes de compra asociadas, no podrá eliminarse.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
