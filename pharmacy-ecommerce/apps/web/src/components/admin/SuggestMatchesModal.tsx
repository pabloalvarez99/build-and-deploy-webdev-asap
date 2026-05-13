'use client'

import { useEffect, useState } from 'react'
import { X as XIcon, Sparkles, CheckCircle2 } from 'lucide-react'

interface Candidate {
  product_id: string
  product_name: string
  product_stock: number
  score: number
  inter: number
  confident: boolean
}

interface ItemSuggestion {
  item_id: string
  product_name_invoice: string | null
  supplier_product_code: string | null
  quantity: number
  candidates: Candidate[]
}

interface Props {
  orderId: string
  onClose: () => void
  onApplied: () => void
}

export function SuggestMatchesModal({ orderId, onClose, onApplied }: Props) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ItemSuggestion[]>([])
  // map item_id -> selected product_id (or null = skip)
  const [selected, setSelected] = useState<Record<string, string | null>>({})
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSuggestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  async function fetchSuggestions() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/purchase-orders/${orderId}/suggest-matches`, {
        method: 'POST',
      })
      if (!res.ok) {
        setError(await res.text() || 'Error cargando sugerencias')
        return
      }
      const data = await res.json()
      const sugs: ItemSuggestion[] = data.suggestions ?? []
      setItems(sugs)
      // pre-select first confident candidate per item
      const initial: Record<string, string | null> = {}
      for (const s of sugs) {
        const first = s.candidates.find((c) => c.confident)
        initial[s.item_id] = first ? first.product_id : null
      }
      setSelected(initial)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando sugerencias')
    } finally {
      setLoading(false)
    }
  }

  async function applySelected() {
    const toApply = Object.entries(selected).filter(([, pid]) => pid !== null) as [string, string][]
    if (toApply.length === 0) return
    setApplying(true)
    setError(null)
    try {
      for (const [itemId, productId] of toApply) {
        const res = await fetch(`/api/admin/purchase-orders/${orderId}/map-product`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: itemId, product_id: productId }),
        })
        if (!res.ok) {
          setError(`Falló item ${itemId}: ${await res.text()}`)
          setApplying(false)
          return
        }
      }
      onApplied()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error aplicando')
    } finally {
      setApplying(false)
    }
  }

  const selectedCount = Object.values(selected).filter((v) => v !== null).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Sugerir matches</h2>
            {items.length > 0 && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {items.length} item{items.length !== 1 ? 's' : ''} sin mapear
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
          >
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
          {loading && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              Buscando sugerencias…
            </div>
          )}
          {!loading && error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
              {error}
            </div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              Sin items unmapped. Nada que sugerir.
            </div>
          )}

          {!loading && items.map((item) => (
            <div
              key={item.item_id}
              className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white text-sm">
                  {item.product_name_invoice ?? '—'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cantidad: {item.quantity}
                  {item.supplier_product_code && ` · Código: ${item.supplier_product_code}`}
                </p>
              </div>

              {item.candidates.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Sin candidatos. Mapear manualmente o crear producto nuevo.
                </p>
              ) : (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                    <input
                      type="radio"
                      name={`sel-${item.item_id}`}
                      checked={selected[item.item_id] === null}
                      onChange={() => setSelected((s) => ({ ...s, [item.item_id]: null }))}
                      className="accent-slate-500"
                    />
                    <span className="text-slate-500 dark:text-slate-400 italic">Omitir</span>
                  </label>
                  {item.candidates.map((c) => (
                    <label
                      key={c.product_id}
                      className={`flex items-center gap-2 cursor-pointer text-sm p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        selected[item.item_id] === c.product_id
                          ? 'bg-emerald-50 dark:bg-emerald-900/20'
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name={`sel-${item.item_id}`}
                        checked={selected[item.item_id] === c.product_id}
                        onChange={() => setSelected((s) => ({ ...s, [item.item_id]: c.product_id }))}
                        className="accent-emerald-600"
                      />
                      <span className="flex-1 text-slate-900 dark:text-white truncate">
                        {c.product_name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                        stock {c.product_stock}
                      </span>
                      <span
                        className={`text-xs font-mono px-1.5 py-0.5 rounded shrink-0 ${
                          c.confident
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}
                        title={`inter=${c.inter} score=${c.score.toFixed(2)}`}
                      >
                        {(c.score * 100).toFixed(0)}%
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cerrar
            </button>
            <button
              onClick={applySelected}
              disabled={applying || selectedCount === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40"
            >
              <CheckCircle2 className="w-4 h-4" />
              {applying ? 'Aplicando…' : `Aplicar ${selectedCount}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
