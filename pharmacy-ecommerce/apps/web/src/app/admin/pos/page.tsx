'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { productApi, Category } from '@/lib/api'
import { calcPoints } from '@/lib/loyalty-utils'
import {
  ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, Banknote,
  CheckCircle2, X, Receipt, Loader2, SmartphoneNfc, ScanLine, CheckCircle, AlertCircle, User, History, BarChart3, Store,
  BookX, Shuffle,
} from 'lucide-react'
import { isControlledSubstance } from '@/lib/controlled-substances'

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
  prescription_type?: string | null
  active_ingredient?: string | null
}

type PaymentMethod = 'pos_cash' | 'pos_debit' | 'pos_credit' | 'pos_mixed'

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'pos_cash', label: 'Efectivo', icon: <Banknote className="w-5 h-5" /> },
  { value: 'pos_debit', label: 'Débito', icon: <SmartphoneNfc className="w-5 h-5" /> },
  { value: 'pos_credit', label: 'Crédito', icon: <CreditCard className="w-5 h-5" /> },
  { value: 'pos_mixed', label: 'Mixto', icon: <Shuffle className="w-5 h-5" /> },
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
  const [successOrder, setSuccessOrder] = useState<{
    id: string; total: number; items: CartItem[]; method: PaymentMethod;
    customer: string; change: number; date: string; discountAmount: number;
    loyaltyPointsEarned?: number;
  } | null>(null)
  const [pharmacyInfo, setPharmacyInfo] = useState<{
    name: string; address: string; phone: string;
  }>({ name: 'Tu Farmacia', address: 'Coquimbo, Chile', phone: '' })
  const [showPayModal, setShowPayModal] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const [discountType, setDiscountType] = useState<'%' | '$'>('%')
  const [discountValue, setDiscountValue] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  // Barcode scanner (HID keyboard emulator) — chars arrive < 50ms apart
  const barcodeBufferRef = useRef<{ char: string; time: number }[]>([])
  const barcodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [barcodeFlash, setBarcodeFlash] = useState<{ ok: boolean; text: string } | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [todayStats, setTodayStats] = useState<{
    count: number; revenue: number;
    cash: { count: number; amount: number };
    debit: { count: number; amount: number };
    credit: { count: number; amount: number };
  } | null>(null)
  const [showShiftSummary, setShowShiftSummary] = useState(false)
  const [rightTab, setRightTab] = useState<'cart' | 'history'>('cart')
  const [todaySales, setTodaySales] = useState<{
    id: string; created_at: string; total: string; payment_provider: string | null;
    guest_name: string | null; customer_phone: string | null;
    order_items: { product_name: string; quantity: number; price_at_purchase: string }[];
  }[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [customerHistory, setCustomerHistory] = useState<{
    found: boolean; name?: string | null; user_id?: string | null; loyalty_points?: number | null;
    visit_count?: number; top_products?: string[]; recent_orders?: { date: string; total: number; items: string }[];
  } | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Pickup lookup
  const [showPickupModal, setShowPickupModal] = useState(false)
  const [pickupCode, setPickupCode] = useState('')
  const [pickupOrder, setPickupOrder] = useState<{
    id: string; status: string; total: string; guest_name: string | null; guest_surname: string | null;
    guest_email: string | null; customer_phone: string | null; pickup_code: string | null;
    reservation_expires_at: string | null;
    items: { product_name: string; quantity: number; price_at_purchase: string }[];
  } | null>(null)
  const [pickupLoading, setPickupLoading] = useState(false)
  const [pickupError, setPickupError] = useState<string | null>(null)
  const [pickupApproving, setPickupApproving] = useState(false)
  const [pickupApproved, setPickupApproved] = useState(false)
  // Bioequivalentes
  const [bioModal, setBioModal] = useState<{ name: string; active_ingredient: string } | null>(null)
  const [bioResults, setBioResults] = useState<Product[]>([])
  const [bioLoading, setBioLoading] = useState(false)
  // Pago mixto
  const [mixedCash, setMixedCash] = useState('')
  const [mixedCard, setMixedCard] = useState('')
  // Shift awareness
  const [shiftFondo, setShiftFondo] = useState<number | null>(null)
  // Prescription data-capture modal (triggered at sale time, not cart-add)
  const [prescriptionModal, setPrescriptionModal] = useState<{
    items: Array<{ product_id: string; product_name: string; quantity: number; active_ingredient?: string | null; is_controlled: boolean }>
    forms: Array<{ patient_name: string; patient_rut: string; doctor_name: string; medical_center: string; prescription_number: string; prescription_date: string; is_controlled: boolean }>
    currentIdx: number
  } | null>(null)
  const pickupInputRef = useRef<HTMLInputElement>(null)
  const pickupDigitRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))

  const loadBioEquivalents = async (activeIngredient: string) => {
    setBioLoading(true)
    setBioResults([])
    try {
      const res = await fetch(`/api/products?active_ingredient=${encodeURIComponent(activeIngredient)}&in_stock=true&limit=20&active_only=true`)
      if (res.ok) {
        const data = await res.json()
        setBioResults(data.products || [])
      }
    } catch { /* ignore */ }
    finally { setBioLoading(false) }
  }

  const loadTodayStats = () => {
    // Compute today in Santiago local time (UTC-3 / UTC-4 depending on DST)
    const todayCL = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' })
    fetch(`/api/admin/orders?from=${todayCL}&to=${todayCL}&channel=pos&status=completed&limit=500`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((data: { orders?: { total: string | number; payment_provider?: string | null }[] } | null) => {
        if (!data?.orders) return
        const orders = data.orders
        const sum = (pp: string) => orders.filter(o => o.payment_provider === pp).reduce((s, o) => s + parseFloat(String(o.total)), 0)
        const cnt = (pp: string) => orders.filter(o => o.payment_provider === pp).length
        setTodayStats({
          count: orders.length,
          revenue: orders.reduce((s, o) => s + parseFloat(String(o.total)), 0),
          cash: { count: cnt('pos_cash'), amount: sum('pos_cash') },
          debit: { count: cnt('pos_debit'), amount: sum('pos_debit') },
          credit: { count: cnt('pos_credit'), amount: sum('pos_credit') },
        })
      })
      .catch(() => {})
  }

  const loadTodaySales = () => {
    const todayCL = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' })
    fetch(`/api/admin/orders?from=${todayCL}&to=${todayCL}&channel=pos&status=completed&limit=100`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.orders) {
          setTodaySales(data.orders)
          setHistoryLoaded(true)
        }
      })
      .catch(() => {})
  }

  // Load history when switching to tab
  useEffect(() => {
    if (rightTab === 'history' && !historyLoaded) loadTodaySales()
  }, [rightTab])

  // Customer phone lookup with debounce
  useEffect(() => {
    const digits = customerPhone.replace(/\D/g, '')
    if (digits.length < 4) { setCustomerHistory(null); return }
    const t = setTimeout(async () => {
      setHistoryLoading(true)
      try {
        const r = await fetch(`/api/admin/pos/customer-history?phone=${encodeURIComponent(digits)}`, { credentials: 'include' })
        if (r.ok) setCustomerHistory(await r.json())
        else setCustomerHistory(null)
      } catch { setCustomerHistory(null) }
      finally { setHistoryLoading(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [customerPhone])

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    searchRef.current?.focus()
    // Load categories for quick filter pills
    productApi.listCategories(true)
      .then(data => setCategories(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {})
    loadTodayStats()
    // Shift awareness — check if fondo was set
    fetch('/api/admin/arqueo', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setShiftFondo(data.fondo_inicial) })
      .catch(() => {})
    // Fetch pharmacy info for receipts (cached in state for the session)
    fetch('/api/admin/settings', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((s: Record<string, string> | null) => {
        if (!s) return
        setPharmacyInfo({
          name: s.pharmacy_name || 'Tu Farmacia',
          address: s.pharmacy_address || 'Coquimbo, Chile',
          phone: s.pharmacy_phone || '',
        })
      })
      .catch(() => {})
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

  const searchProducts = useCallback(async (q: string, category: string) => {
    if (!q.trim() && !category) { setProducts([]); setSearchError(null); return }
    setIsSearching(true)
    setSearchError(null)
    try {
      const res = await productApi.list({ search: q || undefined, category: category || undefined, active_only: true, in_stock: false, limit: 40 })
      setProducts(res.products as unknown as Product[])
    } catch (err) {
      setProducts([])
      setSearchError(err instanceof Error ? err.message : 'Error al buscar productos')
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchProducts(search, selectedCategory), 300)
    return () => clearTimeout(t)
  }, [search, selectedCategory, searchProducts])

  function addToCartDirect(p: Product) {
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

  function addToCart(p: Product) {
    addToCartDirect(p)
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

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discountNum = parseFloat(discountValue) || 0
  const discountAmount = discountType === '%'
    ? Math.round(subtotal * Math.min(discountNum, 100) / 100)
    : Math.min(Math.round(discountNum), subtotal)
  const total = Math.max(0, subtotal - discountAmount)
  const change = cashReceived ? Math.max(0, parseFloat(cashReceived) - total) : 0

  async function handleSale() {
    if (cart.length === 0) return

    // Check if any cart item requires a prescription
    const prescriptionItems = cart.filter(item => {
      const product = products.find(p => p.id === item.product_id)
      return product?.prescription_type === 'retenida' || product?.prescription_type === 'magistral'
    })

    if (prescriptionItems.length > 0 && !prescriptionModal) {
      const pharmacistName = typeof window !== 'undefined' ? localStorage.getItem('pharmacist_name') || '' : ''
      void pharmacistName
      setPrescriptionModal({
        items: prescriptionItems.map(item => {
          const product = products.find(p => p.id === item.product_id)
          return {
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            active_ingredient: product?.active_ingredient,
            is_controlled: isControlledSubstance(product?.active_ingredient),
          }
        }),
        forms: prescriptionItems.map(item => {
          const product = products.find(p => p.id === item.product_id)
          return {
            patient_name: '', patient_rut: '', doctor_name: '',
            medical_center: '', prescription_number: '', prescription_date: '',
            is_controlled: isControlledSubstance(product?.active_ingredient),
          }
        }),
        currentIdx: 0,
      })
      setIsProcessing(false)
      return
    }

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
          cash_amount: paymentMethod === 'pos_mixed' ? parseFloat(mixedCash) || 0 : undefined,
          card_amount: paymentMethod === 'pos_mixed' ? parseFloat(mixedCard) || 0 : undefined,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          customer_user_id: customerHistory?.user_id || undefined,
          discount_amount: discountAmount > 0 ? discountAmount : undefined,
          notes: discountAmount > 0
            ? `Descuento ${discountType === '%' ? discountNum + '%' : formatCLP(discountAmount)} aplicado`
            : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        alert(err || 'Error al procesar venta')
        return
      }
      const data = await res.json()
      const saleDate = new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
      setSuccessOrder({
        id: data.id, total,
        items: [...cart],
        method: paymentMethod,
        customer: customerName,
        change: paymentMethod === 'pos_cash' && cashReceived ? Math.max(0, parseFloat(cashReceived) - total) : 0,
        date: saleDate,
        discountAmount,
      })
      setCart([])
      setSearch('')
      setProducts([])
      setCustomerName('')
      setCustomerPhone('')
      setCustomerHistory(null)
      setCashReceived('')
      setDiscountValue('')
      setShowPayModal(false)
      loadTodayStats()
      setHistoryLoaded(false) // invalidate cache so history refreshes
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al procesar venta')
    } finally {
      setIsProcessing(false)
    }
  }

  async function confirmWithPrescriptions() {
    if (!prescriptionModal) return
    const incomplete = prescriptionModal.forms.some(f => !f.patient_name.trim())
    if (incomplete) return

    const prescriptionData = prescriptionModal.items.map((item, i) => ({
      ...item,
      ...prescriptionModal.forms[i],
    }))
    setPrescriptionModal(null)
    await handleSaleWithPrescriptions(prescriptionData)
  }

  async function handleSaleWithPrescriptions(prescriptionData: Array<{
    product_id: string; product_name: string; quantity: number;
    patient_name: string; patient_rut: string; doctor_name: string;
    medical_center: string; prescription_number: string; prescription_date: string;
    is_controlled: boolean;
  }>) {
    setIsProcessing(true)
    try {
      const discountNum = parseFloat(discountValue) || 0
      const subtotalAmt = cart.reduce((s, i) => s + i.price * i.quantity, 0)
      const discountAmountCalc = discountType === '%'
        ? Math.round(subtotalAmt * Math.min(discountNum, 100) / 100)
        : Math.min(Math.round(discountNum), subtotalAmt)
      const totalAmt = Math.max(0, subtotalAmt - discountAmountCalc)
      const pharmacistName = typeof window !== 'undefined' ? localStorage.getItem('pharmacist_name') || '' : ''

      const res = await fetch('/api/admin/pos/sale', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: i.price })),
          payment_method: paymentMethod,
          cash_amount: paymentMethod === 'pos_cash' || paymentMethod === 'pos_mixed' ? parseFloat(cashReceived) || totalAmt : undefined,
          card_amount: paymentMethod === 'pos_mixed' ? parseFloat(mixedCard) || 0 : undefined,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          discount_amount: discountAmountCalc || undefined,
          prescription_records: prescriptionData.map(p => ({
            product_id: p.product_id,
            product_name: p.product_name,
            quantity: p.quantity,
            patient_name: p.patient_name,
            patient_rut: p.patient_rut || undefined,
            doctor_name: p.doctor_name || undefined,
            medical_center: p.medical_center || undefined,
            prescription_number: p.prescription_number || undefined,
            prescription_date: p.prescription_date || undefined,
            is_controlled: p.is_controlled,
            dispensed_by: pharmacistName || undefined,
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al procesar venta')
      }
      const data = await res.json()
      const saleDate = new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
      setSuccessOrder({
        id: data.id, total: totalAmt, items: [...cart], method: paymentMethod,
        customer: customerName || 'Cliente',
        change: paymentMethod === 'pos_cash' ? Math.max(0, parseFloat(cashReceived) - totalAmt) : 0,
        date: saleDate,
        discountAmount: discountAmountCalc,
        loyaltyPointsEarned: data.loyalty_points_earned,
      })
      setCart([])
      setSearch('')
      setProducts([])
      setCustomerName('')
      setCustomerPhone('')
      setDiscountValue('')
      setCashReceived('')
      setShowPayModal(false)
      loadTodayStats()
      setHistoryLoaded(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al procesar')
    } finally { setIsProcessing(false) }
  }

  const lookupPickup = async () => {
    const code = pickupCode.trim()
    if (!/^\d{6}$/.test(code)) { setPickupError('Ingresa el código de 6 dígitos'); return }
    setPickupLoading(true)
    setPickupError(null)
    setPickupOrder(null)
    setPickupApproved(false)
    try {
      const r = await fetch(`/api/admin/pos/pickup?code=${code}`, { credentials: 'include' })
      const data = await r.json()
      if (!r.ok) { setPickupError(data.error || 'Reserva no encontrada'); return }
      setPickupOrder(data)
    } catch { setPickupError('Error al buscar la reserva') }
    finally { setPickupLoading(false) }
  }

  const approvePickup = async () => {
    if (!pickupOrder) return
    setPickupApproving(true)
    try {
      const r = await fetch(`/api/admin/orders/${pickupOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_reservation' }),
        credentials: 'include',
      })
      const data = await r.json()
      if (!r.ok) { setPickupError(data.error || 'Error al aprobar'); return }
      setPickupApproved(true)
      setPickupOrder({ ...pickupOrder, status: 'processing' })
      loadTodayStats()
    } catch { setPickupError('Error al aprobar la reserva') }
    finally { setPickupApproving(false) }
  }

  const printReceipt = () => {
    if (!successOrder) return
    const methodLabel = PAYMENT_METHODS.find(m => m.value === successOrder.method)?.label || successOrder.method
    const itemsHtml = successOrder.items.map(item =>
      `<tr>
        <td style="padding:2px 0;font-size:12px;">${item.quantity}&times; ${item.product_name}</td>
        <td style="padding:2px 0;font-size:12px;text-align:right;">${formatCLP(item.price * item.quantity)}</td>
      </tr>`
    ).join('')
    const discountRow = successOrder.discountAmount > 0
      ? `<tr><td style="font-size:12px;color:#059669;">Descuento</td><td style="font-size:12px;text-align:right;color:#059669;">-${formatCLP(successOrder.discountAmount)}</td></tr>`
      : ''
    const changeRow = successOrder.change > 0
      ? `<tr><td style="font-size:12px;">Vuelto</td><td style="font-size:12px;text-align:right;">${formatCLP(successOrder.change)}</td></tr>`
      : ''
    const customerRow = successOrder.customer
      ? `<p style="font-size:12px;margin:2px 0;">Cliente: ${successOrder.customer}</p>`
      : ''
    const phoneRow = pharmacyInfo.phone
      ? `<p style="font-size:11px;color:#64748b;margin:2px 0;">${pharmacyInfo.phone}</p>`
      : ''
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Recibo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', Courier, monospace; width: 80mm; max-width: 80mm; padding: 8px; font-size: 12px; color: #000; }
    h1 { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 2px; }
    .center { text-align: center; }
    .small { font-size: 11px; color: #444; }
    .divider { border: none; border-top: 1px dashed #888; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    .total-row td { font-weight: bold; font-size: 14px; padding-top: 4px; }
    .footer { text-align: center; font-size: 11px; color: #555; margin-top: 10px; }
    @media print {
      body { margin: 0; padding: 4px; }
      @page { margin: 4mm; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <h1>${pharmacyInfo.name}</h1>
  <p class="center small">${pharmacyInfo.address}</p>
  ${phoneRow}
  <hr class="divider" />
  <p class="small center">${successOrder.date}</p>
  ${customerRow}
  <hr class="divider" />
  <table>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>
  <hr class="divider" />
  <table>
    <tbody>
      ${discountRow}
      <tr class="total-row">
        <td>TOTAL</td>
        <td style="text-align:right;">${formatCLP(successOrder.total)}</td>
      </tr>
      <tr>
        <td style="font-size:12px;">Pago</td>
        <td style="font-size:12px;text-align:right;">${methodLabel}</td>
      </tr>
      ${changeRow}
    </tbody>
  </table>
  <hr class="divider" />
  <p class="center small" style="font-size:11px;color:#666;">#${successOrder.id.slice(0, 8).toUpperCase()}</p>
  <p class="footer">¡Gracias por su compra!</p>
</body>
</html>`
    const win = window.open('', '_blank', 'width=320,height=600,scrollbars=yes')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
    win.onafterprint = () => win.close()
  }

  if (successOrder) {
    const methodLabel = PAYMENT_METHODS.find(m => m.value === successOrder.method)?.label || successOrder.method
    return (
      <div className="max-w-sm mx-auto mt-8 space-y-4 px-4">
        {/* Screen: success header */}
        <div className="text-center space-y-2 print:hidden">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Venta completada</h2>
          <p className="text-slate-500 dark:text-slate-400">Total: {formatCLP(successOrder.total)}</p>
        </div>

        {/* Receipt — visible on screen + print */}
        <div id="pos-receipt" className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 font-mono text-sm print:border-0 print:p-0 print:rounded-none">
          <div className="text-center mb-3 space-y-0.5">
            <p className="font-bold text-base">{pharmacyInfo.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{pharmacyInfo.address}</p>
            {pharmacyInfo.phone && <p className="text-xs text-slate-500 dark:text-slate-400">{pharmacyInfo.phone}</p>}
            <p className="text-xs text-slate-500 dark:text-slate-400">{successOrder.date}</p>
            {successOrder.customer && <p className="text-xs font-medium">Cliente: {successOrder.customer}</p>}
          </div>
          <div className="border-t border-dashed border-slate-300 dark:border-slate-600 my-2" />
          <div className="space-y-1">
            {successOrder.items.map(item => (
              <div key={item.product_id} className="flex justify-between gap-2">
                <span className="truncate text-xs">{item.quantity}× {item.product_name}</span>
                <span className="shrink-0 text-xs">{formatCLP(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-slate-300 dark:border-slate-600 my-2" />
          {successOrder.discountAmount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
              <span>Descuento</span>
              <span>-{formatCLP(successOrder.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{formatCLP(successOrder.total)}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
            <div className="flex justify-between">
              <span>Pago</span><span>{methodLabel}</span>
            </div>
            {successOrder.change > 0 && (
              <div className="flex justify-between">
                <span>Vuelto</span><span>{formatCLP(successOrder.change)}</span>
              </div>
            )}
            <p className="text-center mt-2 text-[11px]">#{successOrder.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <p className="text-center text-xs mt-3 text-slate-400">¡Gracias por su compra!</p>
        </div>

        {/* Action buttons (hidden on print) */}
        <div className="space-y-2 print:hidden">
          <button
            onClick={printReceipt}
            className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
            style={{ minHeight: '48px' }}
          >
            <Receipt className="w-5 h-5" />
            Imprimir Recibo
          </button>
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
      </div>
    )
  }

  return (
    <>
    {/* Shift awareness banner */}
    {shiftFondo === 0 && (
      <div className="bg-amber-500 text-white text-sm font-semibold px-4 py-2 flex items-center justify-between">
        <span>⚠️ Fondo de caja: $0 — Configura el fondo antes de iniciar ventas</span>
        <a href="/admin/arqueo" className="underline ml-4 hover:text-amber-100">Ir a Arqueo →</a>
      </div>
    )}

    {/* Prescription data-capture modal */}
    {prescriptionModal && (() => {
      const item = prescriptionModal.items[prescriptionModal.currentIdx]
      const form = prescriptionModal.forms[prescriptionModal.currentIdx]
      const setForm = (patch: Partial<typeof form>) => {
        const newForms = [...prescriptionModal.forms]
        newForms[prescriptionModal.currentIdx] = { ...form, ...patch }
        setPrescriptionModal({ ...prescriptionModal, forms: newForms })
      }
      const isLast = prescriptionModal.currentIdx === prescriptionModal.items.length - 1
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">Receta retenida</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{item.product_name} × {item.quantity}</p>
                {prescriptionModal.items.length > 1 && (
                  <p className="text-xs text-slate-400">{prescriptionModal.currentIdx + 1} / {prescriptionModal.items.length}</p>
                )}
              </div>
            </div>
            {item.is_controlled && (
              <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-3 py-2">
                <span className="font-semibold">&#x26A0; Psicotrópico / Estupefaciente</span>
              </div>
            )}
            <div className="space-y-3">
              <input required placeholder="Nombre paciente *" value={form.patient_name}
                onChange={e => setForm({ patient_name: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
              <input placeholder="RUT paciente" value={form.patient_rut}
                onChange={e => setForm({ patient_rut: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
              <input placeholder="Médico" value={form.doctor_name}
                onChange={e => setForm({ doctor_name: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
              <input placeholder="Centro / Clínica" value={form.medical_center}
                onChange={e => setForm({ medical_center: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
              <input placeholder="Nro. Receta" value={form.prescription_number}
                onChange={e => setForm({ prescription_number: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
              <input type="date" placeholder="Fecha receta" value={form.prescription_date}
                onChange={e => setForm({ prescription_date: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setPrescriptionModal(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Cancelar
              </button>
              {!isLast ? (
                <button
                  onClick={() => setPrescriptionModal({ ...prescriptionModal, currentIdx: prescriptionModal.currentIdx + 1 })}
                  disabled={!form.patient_name.trim()}
                  className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50">
                  Siguiente
                </button>
              ) : (
                <button onClick={confirmWithPrescriptions} disabled={!form.patient_name.trim()}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  Confirmar venta
                </button>
              )}
            </div>
          </div>
        </div>
      )
    })()}

    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      {/* Left: Product search */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex items-center gap-3 flex-wrap">
          <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Punto de Venta</h1>
          {user?.name && (
            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <User className="w-4 h-4" />
              {user.name}
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => { setShowPickupModal(true); setPickupCode(''); setPickupOrder(null); setPickupError(null); setPickupApproved(false); setTimeout(() => pickupDigitRefs.current[0]?.focus(), 50) }}
              className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              Retiro
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
              <ScanLine className="w-3.5 h-3.5" />
              <span>Lector de barras activo</span>
            </div>
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

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setSelectedCategory(''); setSearch('') }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                !selectedCategory ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.slug); setSearch('') }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  selectedCategory === cat.slug ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto">
          {products.length === 0 && !search.trim() && !selectedCategory && (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Busca un producto o selecciona una categoría</p>
            </div>
          )}
          {products.length === 0 && (search.trim() || selectedCategory) && !isSearching && !searchError && (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <p>Sin resultados{search ? ` para "${search}"` : ''}{selectedCategory ? ` en esta categoría` : ''}</p>
            </div>
          )}
          {searchError && (
            <div className="text-center py-16 text-red-500 dark:text-red-400">
              <p className="font-semibold">Error al buscar</p>
              <p className="text-sm mt-1">{searchError}</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((p) => {
              const inCart = cart.find((i) => i.product_id === p.id)
              const outOfStock = p.stock <= 0
              return (
                <div key={p.id} className="relative">
                  <button
                    onClick={() => addToCart(p)}
                    disabled={outOfStock || (!!inCart && inCart.quantity >= p.stock)}
                    className={`w-full group text-left p-3 rounded-xl border-2 transition-all ${
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
                      <span className={`text-xs ${outOfStock ? 'text-red-500' : 'text-slate-400'}`}>Stock: {p.stock}</span>
                    </div>
                    {inCart && (
                      <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        En carrito: {inCart.quantity}
                      </div>
                    )}
                  </button>
                  {/* Buttons for out-of-stock products */}
                  {outOfStock && (
                    <div className="flex gap-1 mt-1">
                      {(p as Product & { active_ingredient?: string }).active_ingredient && (
                        <button
                          onClick={() => {
                            const ai = (p as Product & { active_ingredient?: string }).active_ingredient!
                            setBioModal({ name: p.name, active_ingredient: ai })
                            loadBioEquivalents(ai)
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        >
                          <Shuffle className="w-3 h-3" /> Alternativas
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const name = encodeURIComponent(p.name)
                          window.open(`/admin/faltas?product_name=${name}&product_id=${p.id}`, '_blank')
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30"
                      >
                        <BookX className="w-3 h-3" /> Falta
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right: Cart / History */}
      <div className="lg:w-96 flex flex-col gap-3 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-4 lg:h-full overflow-hidden">
        {/* Tab header */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
          <button
            onClick={() => setRightTab('cart')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-all ${rightTab === 'cart' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <ShoppingCart className="w-4 h-4" />
            Carrito
            {cart.length > 0 && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 rounded-full">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
          </button>
          <button
            onClick={() => setRightTab('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-all ${rightTab === 'history' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <History className="w-4 h-4" />
            Historial
            {todayStats !== null && todayStats.count > 0 && <span className="text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-1.5 rounded-full">{todayStats.count}</span>}
          </button>
        </div>

        {/* History panel */}
        {rightTab === 'history' && (
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-400 uppercase font-semibold">Ventas POS hoy</p>
              <button onClick={() => { setHistoryLoaded(false); loadTodaySales(); }} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                <Receipt className="w-3 h-3" />
                Actualizar
              </button>
            </div>
            {!historyLoaded ? (
              <div className="text-center py-12 text-slate-400 animate-pulse text-sm">Cargando...</div>
            ) : todaySales.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin ventas hoy</p>
              </div>
            ) : todaySales.map((sale) => {
              const pmLabel: Record<string, string> = { pos_cash: 'Efectivo', pos_debit: 'Débito', pos_credit: 'Crédito' }
              const pmColor: Record<string, string> = { pos_cash: 'text-amber-600 dark:text-amber-400', pos_debit: 'text-blue-600 dark:text-blue-400', pos_credit: 'text-purple-600 dark:text-purple-400' }
              const pm = sale.payment_provider || ''
              const time = new Date(sale.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' })
              return (
                <div key={sale.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">{time}</span>
                      <span className={`text-xs font-semibold ${pmColor[pm] || 'text-slate-500'}`}>{pmLabel[pm] || pm}</span>
                    </div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCLP(parseFloat(sale.total))}</span>
                  </div>
                  {sale.guest_name && <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{sale.guest_name}</p>}
                  <div className="space-y-0.5">
                    {sale.order_items.map((item, i) => (
                      <p key={i} className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {item.product_name} <span className="text-slate-400">×{item.quantity}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Cart items + cart footer */}
        {rightTab === 'cart' && <><div className="flex-1 overflow-y-auto space-y-2 min-h-0">
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

        {/* Total + Payment method — cart tab only */}
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

            {/* Discount */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Descuento</span>
              <div className="flex flex-1 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => setDiscountType(discountType === '%' ? '$' : '%')}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shrink-0"
                >
                  {discountType}
                </button>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="0"
                  className="flex-1 min-w-0 px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none"
                />
                {discountAmount > 0 && (
                  <span className="px-2 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold shrink-0 self-center">
                    -{formatCLP(discountAmount)}
                  </span>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between">
              {discountAmount > 0 && (
                <span className="text-xs text-slate-400 line-through">{formatCLP(subtotal)}</span>
              )}
              <span className="text-sm text-slate-600 dark:text-slate-400 ml-auto mr-2">Total</span>
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
        )}</>}

        {/* Today's summary */}
        {todayStats !== null && (
          <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Ventas hoy</p>
              <button
                onClick={() => setShowShiftSummary(true)}
                className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <BarChart3 className="w-3 h-3" />
                Resumen
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2 text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-white">{todayStats.count}</p>
                <p className="text-[10px] text-slate-400">ventas</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2 text-center">
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 leading-tight">{formatCLP(todayStats.revenue)}</p>
                <p className="text-[10px] text-slate-400">recaudado</p>
              </div>
            </div>
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
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                  <span>Descuento ({discountType === '%' ? `${discountValue}%` : formatCLP(discountAmount)})</span>
                  <span>-{formatCLP(discountAmount)}</span>
                </div>
              )}
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

            {/* Mixed payment fields */}
            {paymentMethod === 'pos_mixed' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pago mixto</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Efectivo</p>
                    <input type="number" value={mixedCash} onChange={(e) => {
                      setMixedCash(e.target.value)
                      const cash = parseFloat(e.target.value) || 0
                      setMixedCard(String(Math.max(0, total - cash)))
                    }}
                      className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Tarjeta</p>
                    <input type="number" value={mixedCard} onChange={(e) => {
                      setMixedCard(e.target.value)
                      const card = parseFloat(e.target.value) || 0
                      setMixedCash(String(Math.max(0, total - card)))
                    }}
                      className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                  </div>
                </div>
                <p className={`text-xs ${Math.abs((parseFloat(mixedCash)||0) + (parseFloat(mixedCard)||0) - total) < 1 ? 'text-green-600' : 'text-red-500'}`}>
                  Suma: {formatCLP((parseFloat(mixedCash)||0) + (parseFloat(mixedCard)||0))} / Total: {formatCLP(total)}
                </p>
              </div>
            )}

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
              <div className="relative">
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value)
                    // Auto-fill name when history found and name field is empty
                    if (!customerName && customerHistory?.found && customerHistory.name) {
                      setCustomerName(customerHistory.name)
                    }
                  }}
                  placeholder="Teléfono (opcional)"
                  className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none pr-7"
                />
                {historyLoading && (
                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />
                )}
                {!historyLoading && customerHistory?.found && (
                  <User className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Customer history card */}
            {customerHistory?.found && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    {customerHistory.name || 'Cliente conocido'}
                  </span>
                  <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                    {customerHistory.visit_count} visita{customerHistory.visit_count !== 1 ? 's' : ''}
                  </span>
                </div>
                {customerHistory.top_products && customerHistory.top_products.length > 0 && (
                  <div className="flex items-start gap-1.5">
                    <History className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed line-clamp-2">
                      {customerHistory.top_products.join(' · ')}
                    </p>
                  </div>
                )}
                {customerHistory.loyalty_points !== null && customerHistory.loyalty_points !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">⭐</span>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                      {customerHistory.loyalty_points} puntos acumulados
                      {customerHistory.loyalty_points > 0 ? ` (= $${(customerHistory.loyalty_points * 100).toLocaleString('es-CL')})` : ''}
                    </p>
                  </div>
                )}
                {!customerName && customerHistory.name && (
                  <button
                    type="button"
                    onClick={() => setCustomerName(customerHistory.name!)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Usar nombre: {customerHistory.name}
                  </button>
                )}
              </div>
            )}

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

      {/* Pickup code lookup modal */}
      {showPickupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h2 className="font-bold text-slate-900 dark:text-white">Buscar reserva</h2>
              </div>
              <button onClick={() => setShowPickupModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Code input — OTP digit boxes */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center block">Ingresa el código de retiro</label>
                <div className="flex justify-center gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      ref={el => { pickupDigitRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={pickupCode[i] ?? ''}
                      onChange={(e) => {
                        const digit = e.target.value.replace(/\D/g, '').slice(-1)
                        const arr = pickupCode.padEnd(6, '').split('')
                        arr[i] = digit
                        const next = arr.join('').replace(/\s/g, '')
                        setPickupCode(next.slice(0, 6))
                        setPickupError(null)
                        if (digit && i < 5) pickupDigitRefs.current[i + 1]?.focus()
                        if (next.replace(/\s/g,'').length === 6 && digit) setTimeout(lookupPickup, 80)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          if (pickupCode[i]) {
                            const arr = pickupCode.padEnd(6, '').split('')
                            arr[i] = ''
                            setPickupCode(arr.join('').slice(0, 6).replace(/\s/g,''))
                          } else if (i > 0) {
                            pickupDigitRefs.current[i - 1]?.focus()
                          }
                        } else if (e.key === 'Enter' && pickupCode.length === 6) {
                          lookupPickup()
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault()
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                        setPickupCode(pasted)
                        setPickupError(null)
                        const focusIdx = Math.min(pasted.length, 5)
                        pickupDigitRefs.current[focusIdx]?.focus()
                        if (pasted.length === 6) setTimeout(lookupPickup, 80)
                      }}
                      className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none transition-all ${
                        pickupCode[i]
                          ? 'border-amber-500 dark:border-amber-400 shadow-sm shadow-amber-200 dark:shadow-amber-900'
                          : 'border-slate-200 dark:border-slate-700 focus:border-amber-400'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={lookupPickup}
                  disabled={pickupLoading || pickupCode.replace(/\s/g,'').length !== 6}
                  className="w-full py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {pickupLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Buscando...</> : <><Search className="w-4 h-4" /> Buscar reserva</>}
                </button>
              </div>

              {/* Error */}
              {pickupError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {pickupError}
                </div>
              )}

              {/* Order card */}
              {pickupOrder && (
                <div className="space-y-3">
                  <div className={`rounded-xl p-4 space-y-2 border-2 ${pickupApproved ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' : pickupOrder.status === 'reserved' ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-400">#{pickupOrder.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pickupApproved || pickupOrder.status === 'processing' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : pickupOrder.status === 'reserved' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-slate-100 text-slate-600'}`}>
                        {pickupApproved ? 'Aprobada' : pickupOrder.status === 'reserved' ? 'Pendiente aprobación' : pickupOrder.status === 'processing' ? 'Aprobada' : pickupOrder.status}
                      </span>
                    </div>
                    {(pickupOrder.guest_name || pickupOrder.guest_surname) && (
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {[pickupOrder.guest_name, pickupOrder.guest_surname].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {pickupOrder.guest_email && <p className="text-xs text-slate-500">{pickupOrder.guest_email}</p>}
                    {pickupOrder.customer_phone && <p className="text-xs text-slate-500">{pickupOrder.customer_phone}</p>}
                    <div className="border-t border-slate-200 dark:border-slate-600 pt-2 space-y-1">
                      {pickupOrder.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400 flex-1 truncate pr-2">{item.quantity}× {item.product_name}</span>
                          <span className="font-medium text-slate-900 dark:text-white shrink-0">{formatCLP(Number(item.price_at_purchase) * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200 dark:border-slate-600">
                        <span className="text-slate-900 dark:text-white">Total</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{formatCLP(Number(pickupOrder.total))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Approve / already approved */}
                  {pickupApproved ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      Reserva aprobada — stock descontado
                    </div>
                  ) : pickupOrder.status === 'reserved' ? (
                    <button
                      onClick={approvePickup}
                      disabled={pickupApproving}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {pickupApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Aprobar retiro
                    </button>
                  ) : (
                    <p className="text-center text-sm text-slate-400">Esta reserva ya fue procesada</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shift summary modal */}
      {showShiftSummary && todayStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-bold text-slate-900 dark:text-white">Resumen del turno</h2>
              </div>
              <button onClick={() => setShowShiftSummary(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Total */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide">Total recaudado</p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{formatCLP(todayStats.revenue)}</p>
                <p className="text-xs text-slate-400 mt-1">{todayStats.count} venta{todayStats.count !== 1 ? 's' : ''} · ticket promedio {todayStats.count > 0 ? formatCLP(todayStats.revenue / todayStats.count) : '—'}</p>
              </div>

              {/* Payment method breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Por método de pago</p>
                {[
                  { label: 'Efectivo', icon: <Banknote className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', data: todayStats.cash },
                  { label: 'Débito', icon: <SmartphoneNfc className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', data: todayStats.debit },
                  { label: 'Crédito', icon: <CreditCard className="w-4 h-4" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', data: todayStats.credit },
                ].map(({ label, icon, color, bg, data }) => (
                  <div key={label} className={`flex items-center justify-between rounded-xl px-4 py-3 ${bg}`}>
                    <div className={`flex items-center gap-2 ${color}`}>
                      {icon}
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{data.count > 0 ? formatCLP(data.amount) : '—'}</p>
                      {data.count > 0 && <p className="text-[10px] text-slate-400">{data.count} venta{data.count !== 1 ? 's' : ''}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setShowShiftSummary(false); window.print() }}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Receipt className="w-4 h-4" />
                Imprimir resumen
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bioequivalents modal */}
      {bioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setBioModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Alternativas bioequivalentes</h3>
                <p className="text-xs text-slate-500 mt-0.5">{bioModal.name}</p>
              </div>
              <button onClick={() => setBioModal(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              {bioLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>}
              {!bioLoading && bioResults.length === 0 && (
                <p className="text-center text-slate-500 py-8">Sin alternativas en stock</p>
              )}
              {bioResults.map((p) => (
                <button key={p.id} onClick={() => { addToCart(p); setBioModal(null) }}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</p>
                    {p.laboratory && <p className="text-xs text-slate-400">{p.laboratory}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">{formatCLP(p.price)}</p>
                    <p className="text-xs text-slate-400">Stock: {p.stock}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
