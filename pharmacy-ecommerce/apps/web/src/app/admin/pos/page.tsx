'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { productApi } from '@/lib/api'
import {
  ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, Banknote,
  CheckCircle2, X, Receipt, Loader2, SmartphoneNfc, ScanLine, CheckCircle, AlertCircle,
} from 'lucide-react'

interface CartItem {
  product_id: string
  product_name: string
  price: number
  quantity: number
  stock: number
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  image_url?: string | null
  laboratory?: string | null
  presentation?: string | null
}

type PaymentMethod = 'pos_cash' | 'pos_debit' | 'pos_credit'

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'pos_cash', label: 'Efectivo', icon: <Banknote className="w-5 h-5" /> },
  { value: 'pos_debit', label: 'Débito', icon: <SmartphoneNfc className="w-5 h-5" /> },
  { value: 'pos_credit', label: 'Crédito', icon: <CreditCard className="w-5 h-5" /> },
]

function formatCLP(n: number) {
  return `$${Math.round(n).toLocaleString('es-CL')}`
}

export default function POSPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pos_cash')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [successOrder, setSuccessOrder] = useState<{ id: string; total: number } | null>(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  // Barcode scanner (HID keyboard emulator) — chars arrive < 50ms apart
  const barcodeBufferRef = useRef<{ char: string; time: number }[]>([])
  const barcodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [barcodeFlash, setBarcodeFlash] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    searchRef.current?.focus()
  }, [user, router])

  // Barcode scanner: global capture listener — intercepts before element handlers
  const handleBarcodeScan = useCallback(async (code: string) => {
    try {
      const res = await fetch(`/api/products?barcode=${encodeURIComponent(code)}&active_only=true&limit=1`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const product = data.products?.[0] as Product | undefined
      if (product) {
        addToCart(product)
        setBarcodeFlash({ ok: true, text: product.name })
      } else {
        setBarcodeFlash({ ok: false, text: `Código no encontrado: ${code}` })
      }
    } catch {
      setBarcodeFlash({ ok: false, text: `Error al buscar: ${code}` })
    }
    setTimeout(() => setBarcodeFlash(null), 2500)
  }, []) // addToCart is stable (no deps)

  useEffect(() => {
    // Barcode scanners send chars at ~0-5ms intervals (HID keyboard emulator).
    // Human typing is typically >80ms per keystroke.
    // Strategy: buffer chars in capture phase; if Enter arrives and all buffered
    // chars came in within 50ms each → it's a barcode scan, not manual input.
    const SCANNER_INTERVAL_MS = 50
    const MIN_BARCODE_LENGTH = 6

    function onKeyDown(e: KeyboardEvent) {
      const now = Date.now()
      const buf = barcodeBufferRef.current

      if (e.key === 'Enter') {
        if (barcodeTimeoutRef.current) {
          clearTimeout(barcodeTimeoutRef.current)
          barcodeTimeoutRef.current = null
        }
        if (buf.length >= MIN_BARCODE_LENGTH) {
          // Check: every consecutive interval must be short (scanner speed)
          let isScanner = true
          for (let i = 1; i < buf.length; i++) {
            if (buf[i].time - buf[i - 1].time > SCANNER_INTERVAL_MS) {
              isScanner = false
              break
            }
          }
          if (isScanner) {
            const code = buf.map((b) => b.char).join('')
            barcodeBufferRef.current = []
            e.preventDefault()
            e.stopPropagation()
            handleBarcodeScan(code)
            return
          }
        }
        barcodeBufferRef.current = []
        return
      }

      // Accumulate printable chars
      if (e.key.length === 1) {
        buf.push({ char: e.key, time: now })
        if (buf.length > 30) buf.shift() // cap buffer

        // Clear buffer if no more chars arrive within 200ms
        if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current)
        barcodeTimeoutRef.current = setTimeout(() => {
          barcodeBufferRef.current = []
        }, 200)
      } else if (!['Shift', 'CapsLock', 'Control', 'Alt', 'Meta'].includes(e.key)) {
        // Non-printable, non-modifier key → reset buffer
        barcodeBufferRef.current = []
      }
    }

    document.addEventListener('keydown', onKeyDown, { capture: true })
    return () => document.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [handleBarcodeScan])

  // Global '/' shortcut to focus search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setProducts([]); return }
    setIsSearching(true)
    try {
      const res = await productApi.list({ search: q, active_only: true, in_stock: false, limit: 20 })
      setProducts(res.products as unknown as Product[])
    } catch {
      setProducts([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchProducts(search), 300)
    return () => clearTimeout(t)
  }, [search, searchProducts])

  function addToCart(p: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === p.id)
      if (existing) {
        if (existing.quantity >= existing.stock) return prev
        return prev.map((i) =>
          i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      if (p.stock <= 0) return prev
      return [...prev, { product_id: p.id, product_name: p.name, price: p.price, quantity: 1, stock: p.stock }]
    })
  }

  function updateQty(product_id: string, delta: number) {
    setCart((prev) =>
      prev.flatMap((i) => {
        if (i.product_id !== product_id) return [i]
        const newQty = i.quantity + delta
        if (newQty <= 0) return []
        if (newQty > i.stock) return [i]
        return [{ ...i, quantity: newQty }]
      })
    )
  }

  function removeFromCart(product_id: string) {
    setCart((prev) => prev.filter((i) => i.product_id !== product_id))
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const change = cashReceived ? Math.max(0, parseFloat(cashReceived) - total) : 0

  async function handleSale() {
    if (cart.length === 0) return
    setIsProcessing(true)
    try {
      const res = await fetch('/api/admin/pos/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({
            product_id: i.product_id,
            product_name: i.product_name,
            quantity: i.quantity,
            price: i.price,
          })),
          payment_method: paymentMethod,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        alert(err || 'Error al procesar venta')
        return
      }
      const data = await res.json()
      setSuccessOrder({ id: data.id, total })
      setCart([])
      setSearch('')
      setProducts([])
      setCustomerName('')
      setCustomerPhone('')
      setCashReceived('')
      setShowPayModal(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al procesar venta')
    } finally {
      setIsProcessing(false)
    }
  }

  if (successOrder) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6 px-4">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Venta completada</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Total cobrado: {formatCLP(successOrder.total)}</p>
          <p className="text-xs text-slate-400 mt-1">ID: {successOrder.id.slice(0, 8)}...</p>
        </div>
        <button
          onClick={() => { setSuccessOrder(null); searchRef.current?.focus() }}
          className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          Nueva venta
        </button>
        <button
          onClick={() => router.push('/admin/ordenes')}
          className="w-full py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Ver en órdenes
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      {/* Left: Product search */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex items-center gap-3 flex-wrap">
          <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Punto de Venta</h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full ml-auto">
            <ScanLine className="w-3.5 h-3.5" />
            <span>Lector de barras activo</span>
          </div>
        </div>

        {/* Barcode scan flash */}
        {barcodeFlash && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 ${
            barcodeFlash.ok
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300'
          }`}>
            {barcodeFlash.ok
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span className="line-clamp-1">{barcodeFlash.text}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && products.length > 0) {
                addToCart(products[0])
                setSearch('')
              }
            }}
            placeholder="Buscar producto… (/ para enfocar, Enter para agregar)"
            className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none text-sm"
          />
          {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto">
          {products.length === 0 && search.trim() === '' && (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Busca un producto para agregar al carrito</p>
            </div>
          )}
          {products.length === 0 && search.trim() !== '' && !isSearching && (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <p>Sin resultados para "{search}"</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((p) => {
              const inCart = cart.find((i) => i.product_id === p.id)
              const outOfStock = p.stock <= 0
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={outOfStock || (!!inCart && inCart.quantity >= p.stock)}
                  className={`group text-left p-3 rounded-xl border-2 transition-all ${
                    outOfStock || (inCart && inCart.quantity >= p.stock)
                      ? 'border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed'
                      : inCart
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400 hover:shadow-md'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight">{p.name}</p>
                  {p.laboratory && <p className="text-xs text-slate-400 mt-0.5 truncate">{p.laboratory}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCLP(p.price)}</span>
                    <span className="text-xs text-slate-400">Stock: {p.stock}</span>
                  </div>
                  {inCart && (
                    <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      En carrito: {inCart.quantity}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="lg:w-96 flex flex-col gap-3 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-4 lg:h-full overflow-hidden">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-bold text-slate-900 dark:text-white">Carrito</h2>
          {cart.length > 0 && (
            <span className="ml-auto text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {cart.length === 0 && (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Agrega productos</p>
            </div>
          )}
          {cart.map((item) => (
            <div key={item.product_id} className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight line-clamp-2">{item.product_name}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{formatCLP(item.price)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => updateQty(item.product_id, -1)}
                  className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.product_id, 1)}
                  disabled={item.quantity >= item.stock}
                  className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total + Payment method */}
        {cart.length > 0 && (
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">
            {/* Payment method selector */}
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-medium border-2 transition-all ${
                    paymentMethod === m.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCLP(total)}</span>
            </div>

            {/* Pay button */}
            <button
              onClick={() => setShowPayModal(true)}
              className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 active:scale-95 transition-all"
            >
              Cobrar
            </button>
            <button
              onClick={() => setCart([])}
              className="w-full py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              Limpiar carrito
            </button>
          </div>
        )}
      </div>

      {/* Payment confirmation modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirmar pago</h3>
              <button
                onClick={() => setShowPayModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 space-y-2">
              {cart.map((i) => (
                <div key={i.product_id} className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400 flex-1 truncate pr-2">{i.product_name} × {i.quantity}</span>
                  <span className="font-medium text-slate-900 dark:text-white shrink-0">{formatCLP(i.price * i.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 dark:border-slate-600 pt-2 flex justify-between font-bold">
                <span className="text-slate-900 dark:text-white">Total</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-lg">{formatCLP(total)}</span>
              </div>
            </div>

            {/* Method display */}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>Método:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}
              </span>
            </div>

            {/* Cash change calculator */}
            {paymentMethod === 'pos_cash' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Efectivo recibido</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none text-lg font-semibold"
                />
                {cashReceived && parseFloat(cashReceived) >= total && (
                  <div className="flex justify-between text-sm bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-xl">
                    <span className="text-emerald-700 dark:text-emerald-400">Vuelto</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCLP(change)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Optional customer info */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre (opcional)"
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Teléfono (opcional)"
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSale}
              disabled={isProcessing}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Confirmar venta</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
