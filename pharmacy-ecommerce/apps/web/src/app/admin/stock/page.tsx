'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { productApi } from '@/lib/api'
import { TrendingUp, TrendingDown, Package, ChevronLeft, ChevronRight, Plus, Minus, X, Search, Loader2, Download, AlertTriangle, ShoppingCart, Upload, FileText, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/format'

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

interface AdjustProduct { id: string; name: string; stock: number }

export default function StockMovementsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [reasonFilter, setReasonFilter] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productFilter, setProductFilter] = useState<{ id: string; name: string } | null>(null)
  const [productSearchResults, setProductSearchResults] = useState<{ id: string; name: string }[]>([])
  const [productSearching, setProductSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'movimientos' | 'inventario'>('movimientos')
  const [invFilter, setInvFilter] = useState<'all' | 'low' | 'out'>('all')
  const [invSearch, setInvSearch] = useState('')
  const [inventory, setInventory] = useState<{
    summary: { total_products: number; products_with_cost: number; total_retail_value: number; total_cost_value: number; gross_margin_value: number; margin_pct: number; low_stock_threshold: number };
    items: Array<{ id: string; name: string; slug: string; stock: number; price: number; cost_price: number | null; retail_value: number; cost_value: number | null; margin_pct: number | null; category: string; low_stock: boolean; supplier: { id: string; name: string; code: string } | null }>;
  } | null>(null)
  const [inventoryLoading, setInventoryLoading] = useState(false)

  // Adjust modal state
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjSearch, setAdjSearch] = useState('')
  const [adjProducts, setAdjProducts] = useState<AdjustProduct[]>([])
  const [adjSearching, setAdjSearching] = useState(false)
  const [adjProduct, setAdjProduct] = useState<AdjustProduct | null>(null)
  const [adjDelta, setAdjDelta] = useState('')
  const [adjNotes, setAdjNotes] = useState('')
  const [adjSaving, setAdjSaving] = useState(false)

  // Stock import modal state
  const [showImport, setShowImport] = useState(false)
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'applying' | 'done'>('upload')
  const [importRows, setImportRows] = useState<{ barcode?: string; external_id?: string; quantity: number }[]>([])
  const [importPreview, setImportPreview] = useState<{ product_id: string; name: string; old_stock: number | null; new_stock: number; delta: number | null; key: string }[]>([])
  const [importUnmatched, setImportUnmatched] = useState<string[]>([])
  const [importResult, setImportResult] = useState<{ updated: number; unmatched: number } | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
  }, [user, router])

  useEffect(() => {
    if (!adjSearch.trim()) { setAdjProducts([]); return }
    const t = setTimeout(async () => {
      setAdjSearching(true)
      try {
        const res = await productApi.list({ search: adjSearch, limit: 8, active_only: true })
        setAdjProducts((res.products as unknown as AdjustProduct[]))
      } catch { setAdjProducts([]) }
      finally { setAdjSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [adjSearch])

  useEffect(() => {
    if (!productSearch.trim()) { setProductSearchResults([]); return }
    const t = setTimeout(async () => {
      setProductSearching(true)
      try {
        const res = await productApi.list({ search: productSearch, limit: 8, active_only: false })
        setProductSearchResults(res.products.map(p => ({ id: p.id, name: p.name })))
      } catch { setProductSearchResults([]) }
      finally { setProductSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [productSearch])

  async function loadInventory(filter = invFilter, search = invSearch) {
    setInventoryLoading(true)
    try {
      const qs = new URLSearchParams()
      if (filter !== 'all') qs.set('filter', filter)
      if (search) qs.set('search', search)
      const res = await fetch(`/api/admin/inventory?${qs}`)
      if (res.ok) setInventory(await res.json())
    } catch { /* fail silently */ }
    finally { setInventoryLoading(false) }
  }

  useEffect(() => {
    if (activeTab === 'inventario') loadInventory()
  }, [activeTab, invFilter])

  // Debounced search
  useEffect(() => {
    if (activeTab !== 'inventario') return
    const t = setTimeout(() => loadInventory(invFilter, invSearch), 300)
    return () => clearTimeout(t)
  }, [invSearch])

  function exportInventoryCSV() {
    if (!inventory) return
    const headers = ['Producto', 'Categoría', 'Stock', 'Precio venta', 'Precio costo', 'Valor retail', 'Valor costo', '% Margen', 'Proveedor']
    const rows = inventory.items.map((i) => [
      i.name, i.category, i.stock,
      Math.round(i.price), i.cost_price != null ? Math.round(i.cost_price) : '',
      Math.round(i.retail_value), i.cost_value != null ? Math.round(i.cost_value) : '',
      i.margin_pct != null ? i.margin_pct.toFixed(1) + '%' : '',
      i.supplier?.name ?? '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  async function handleAdjust() {
    if (!adjProduct || !adjDelta || adjDelta === '0') return
    const delta = parseInt(adjDelta)
    if (isNaN(delta) || delta === 0) return
    setAdjSaving(true)
    try {
      const res = await fetch('/api/admin/stock-movements/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: adjProduct.id, delta, notes: adjNotes }),
      })
      if (!res.ok) { alert(await res.text()); return }
      const data = await res.json()
      alert(`✓ Stock actualizado: ${data.product_name} → ${data.new_stock} unidades`)
      setShowAdjust(false)
      setAdjProduct(null); setAdjSearch(''); setAdjDelta(''); setAdjNotes('')
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setAdjSaving(false)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '50' })
      if (reasonFilter) qs.set('reason', reasonFilter)
      if (productFilter) qs.set('product_id', productFilter.id)
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
  }, [page, reasonFilter, productFilter])

  useEffect(() => { load() }, [load])

  function handleReasonChange(r: string) {
    setReasonFilter(r)
    setPage(1)
  }

  function parseStockCSV(text: string): { barcode?: string; external_id?: string; quantity: number }[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    if (lines.length === 0) return []
    const sep = lines[0].includes('\t') ? '\t' : ','
    const parsed: { barcode?: string; external_id?: string; quantity: number }[] = []

    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ''))
      if (cols.length < 2) continue
      const code = cols[0]
      const qty = parseFloat(cols[1].replace(',', '.'))
      if (!code || isNaN(qty)) continue
      // Skip header row if first column looks like text label
      if (i === 0 && isNaN(parseFloat(code))) continue
      // Determine if it's a barcode (numeric, ≥8 chars) or external_id
      const isBarcode = /^\d{8,}$/.test(code)
      parsed.push(isBarcode ? { barcode: code, quantity: qty } : { external_id: code, quantity: qty })
    }
    return parsed
  }

  async function handleStockFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    const text = await file.text()
    const rows = parseStockCSV(text)
    if (rows.length === 0) { setImportError('No se encontraron filas válidas en el archivo.'); return }
    setImportRows(rows)
    setImportLoading(true)
    try {
      const res = await fetch('/api/admin/stock-movements/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, dry_run: true }),
      })
      if (!res.ok) { setImportError('Error al previsualizar los cambios.'); return }
      const data = await res.json()
      setImportPreview(data.preview || [])
      setImportUnmatched(data.unmatched_keys || [])
      setImportStep('preview')
    } catch { setImportError('Error de red al previsualizar.') }
    finally { setImportLoading(false) }
  }

  async function handleApplyStockImport() {
    setImportStep('applying')
    setImportLoading(true)
    try {
      const res = await fetch('/api/admin/stock-movements/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importRows, dry_run: false }),
      })
      if (!res.ok) { setImportStep('preview'); setImportError('Error al aplicar cambios.'); return }
      const data = await res.json()
      setImportResult(data)
      setImportStep('done')
      if (activeTab === 'inventario') loadInventory()
      else load()
    } catch { setImportStep('preview'); setImportError('Error de red al aplicar.') }
    finally { setImportLoading(false) }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stock</h1>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(['movimientos', 'inventario'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'movimientos' ? 'Movimientos' : 'Inventario'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setShowImport(true); setImportStep('upload'); setImportError(null); setImportResult(null) }}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
          <button
            onClick={() => setShowAdjust(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajustar stock
          </button>
        </div>
      </div>

      {/* ── TAB: INVENTARIO ── */}
      {activeTab === 'inventario' && (
        <>
          {/* Inventory filters */}
          <div className="flex gap-2 flex-wrap items-center">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'low', label: 'Stock bajo', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
              { key: 'out', label: 'Agotados', icon: <X className="w-3.5 h-3.5" /> },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setInvFilter(f.key as 'all' | 'low' | 'out')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  invFilter === f.key
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {f.icon}{f.label}
              </button>
            ))}
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52"
              />
            </div>
          </div>

          {inventoryLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}
            </div>
          ) : inventory ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                {[
                  { label: 'Productos en stock', value: String(inventory.summary.total_products) },
                  { label: 'Con precio costo', value: String(inventory.summary.products_with_cost) },
                  { label: 'Valor retail', value: formatPrice(inventory.summary.total_retail_value) },
                  { label: 'Valor costo', value: inventory.summary.total_cost_value > 0 ? formatPrice(inventory.summary.total_cost_value) : '—' },
                  { label: 'Margen potencial', value: inventory.summary.gross_margin_value > 0 ? formatPrice(inventory.summary.gross_margin_value) : '—' },
                  { label: '% Margen', value: inventory.summary.margin_pct > 0 ? `${inventory.summary.margin_pct.toFixed(1)}%` : '—' },
                ].map((card) => (
                  <div key={card.label} className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{inventory.items.length} productos</p>
                  <button
                    onClick={exportInventoryCSV}
                    className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <Download className="w-4 h-4" /> CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        {['Producto', 'Stock', 'Precio', 'Costo', 'Valor retail', '% Margen', 'Proveedor'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {inventory.items.map((item) => (
                        <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 ${item.stock === 0 ? 'opacity-60' : ''}`}>
                          <td className="px-4 py-3 max-w-[200px]">
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                            <p className="text-xs text-slate-400">{item.category}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-mono font-bold ${item.stock === 0 ? 'text-red-600 dark:text-red-400' : item.low_stock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
                              {item.stock}
                            </span>
                            {item.low_stock && item.stock > 0 && <AlertTriangle className="inline w-3.5 h-3.5 text-amber-500 ml-1" />}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatPrice(item.price)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {item.cost_price != null ? <span className="text-red-600 dark:text-red-400">{formatPrice(item.cost_price)}</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{formatPrice(item.retail_value)}</td>
                          <td className="px-4 py-3 font-bold">
                            {item.margin_pct != null ? (
                              <span className={item.margin_pct >= 20 ? 'text-emerald-600 dark:text-emerald-400' : item.margin_pct >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}>
                                {item.margin_pct.toFixed(1)}%
                              </span>
                            ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {item.supplier ? (
                              <div className="flex items-center gap-2">
                                <Link href={`/admin/proveedores/${item.supplier.id}`} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline truncate max-w-[100px]">
                                  {item.supplier.name}
                                </Link>
                                {item.low_stock && (
                                  <Link
                                    href={`/admin/compras/nueva?supplier_id=${item.supplier.id}`}
                                    title="Crear orden de compra"
                                    className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                  </Link>
                                )}
                              </div>
                            ) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400"><p>Error cargando inventario</p></div>
          )}
        </>
      )}

      {/* ── TAB: MOVIMIENTOS (filters + table) ── */}
      {activeTab === 'movimientos' && <>
      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-start">
        {/* Product search filter */}
        <div className="relative">
          {productFilter ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-lg text-sm text-emerald-800 dark:text-emerald-300">
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span className="max-w-[160px] truncate">{productFilter.name}</span>
              <button onClick={() => { setProductFilter(null); setProductSearch('') }} className="ml-1 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Filtrar por producto..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {productSearching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-slate-400" />}
              {productSearchResults.length > 0 && productSearch && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 w-64 max-h-48 overflow-y-auto">
                  {productSearchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setProductFilter(p); setProductSearch(''); setProductSearchResults([]); setPage(1) }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 truncate"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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
      </> }

      {/* Adjust modal */}
      {showAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ajuste manual de stock</h3>
              <button onClick={() => setShowAdjust(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product search */}
            {!adjProduct ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Buscar producto</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={adjSearch}
                    onChange={(e) => setAdjSearch(e.target.value)}
                    placeholder="Nombre del producto..."
                    autoFocus
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none text-sm"
                  />
                  {adjSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {adjProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setAdjProduct(p); setAdjSearch('') }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 flex justify-between items-center transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Stock: {p.stock}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{adjProduct.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Stock actual: {adjProduct.stock}</p>
                  </div>
                  <button onClick={() => setAdjProduct(null)} className="text-slate-400 hover:text-slate-600 text-xs underline">Cambiar</button>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Delta (positivo = entrada, negativo = salida)</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAdjDelta((v) => String((parseInt(v) || 0) - 1))} className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold hover:bg-red-200 transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={adjDelta}
                      onChange={(e) => setAdjDelta(e.target.value)}
                      placeholder="0"
                      className="flex-1 text-center py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-bold focus:border-emerald-500 focus:outline-none"
                    />
                    <button onClick={() => setAdjDelta((v) => String((parseInt(v) || 0) + 1))} className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold hover:bg-emerald-200 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {adjDelta && !isNaN(parseInt(adjDelta)) && (
                    <p className="text-xs text-slate-500 text-center">
                      Stock nuevo: <strong>{adjProduct.stock + (parseInt(adjDelta) || 0)}</strong>
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Motivo (opcional)</label>
                  <input
                    type="text"
                    value={adjNotes}
                    onChange={(e) => setAdjNotes(e.target.value)}
                    placeholder="Ej: conteo físico, merma, devolución..."
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleAdjust}
                  disabled={adjSaving || !adjDelta || adjDelta === '0' || isNaN(parseInt(adjDelta))}
                  className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {adjSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Confirmar ajuste'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stock Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Importar stock desde CSV</h3>
              <button
                onClick={() => setShowImport(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {importStep === 'upload' && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Formato del archivo CSV:</p>
                  <p>• Dos columnas: <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">código,cantidad</code></p>
                  <p>• Código: código de barra (≥8 dígitos) o código externo</p>
                  <p>• Cantidad: stock absoluto (no delta)</p>
                  <p>• Separador: coma o tabulador, con o sin encabezado</p>
                </div>
                {importError && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{importError}</p>
                )}
                <label className={`flex flex-col items-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-colors ${importLoading ? 'opacity-50 pointer-events-none' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-600'}`}>
                  {importLoading
                    ? <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    : <FileText className="w-8 h-8 text-slate-400" />
                  }
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {importLoading ? 'Procesando...' : 'Seleccionar archivo CSV'}
                  </span>
                  <input type="file" accept=".csv,.txt" className="hidden" onChange={handleStockFileSelect} disabled={importLoading} />
                </label>
              </div>
            )}

            {importStep === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">
                    {importPreview.length} productos encontrados
                  </span>
                  {importUnmatched.length > 0 && (
                    <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                      {importUnmatched.length} sin coincidencia
                    </span>
                  )}
                </div>

                {importError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{importError}</p>
                )}

                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                      <tr>
                        {['Producto', 'Stock actual', 'Stock nuevo', 'Delta'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {importPreview.map((row) => {
                        const delta = row.delta ?? 0
                        return (
                          <tr key={row.product_id} className={delta !== 0 ? '' : 'opacity-50'}>
                            <td className="px-3 py-2 text-slate-800 dark:text-slate-200 max-w-[180px] truncate">{row.name}</td>
                            <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">{row.old_stock ?? '?'}</td>
                            <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-slate-100">{row.new_stock}</td>
                            <td className="px-3 py-2">
                              {delta !== 0 ? (
                                <span className={`font-bold text-xs px-1.5 py-0.5 rounded ${delta > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                  {delta > 0 ? '+' : ''}{delta}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">sin cambio</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {importUnmatched.length > 0 && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                    Sin coincidencia: {importUnmatched.slice(0, 10).join(', ')}{importUnmatched.length > 10 ? ` y ${importUnmatched.length - 10} más` : ''}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setImportStep('upload')}
                    className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleApplyStockImport}
                    disabled={importPreview.filter((r) => r.delta !== 0).length === 0}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Aplicar {importPreview.filter((r) => r.delta !== 0).length} cambios
                  </button>
                </div>
              </div>
            )}

            {importStep === 'applying' && (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">Aplicando cambios de stock...</p>
              </div>
            )}

            {importStep === 'done' && importResult && (
              <div className="space-y-4">
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <p className="text-xl font-bold text-slate-900 dark:text-white">Stock actualizado</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {importResult.updated} productos actualizados
                    {importResult.unmatched > 0 && ` · ${importResult.unmatched} sin coincidencia`}
                  </p>
                </div>
                <button
                  onClick={() => setShowImport(false)}
                  className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
