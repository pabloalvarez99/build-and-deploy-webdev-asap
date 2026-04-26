'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import {
  purchaseOrderApi, supplierApi, productApi,
  type Supplier, type ScannedLine, type ProductWithCategory,
} from '@/lib/api'
import {
  Truck, Camera, Scan, CheckCircle2, AlertCircle, Search,
  ChevronRight, ChevronLeft, Loader2, X, Link2, FileText, Upload,
} from 'lucide-react'
import { uploadInvoiceImage } from '@/lib/firebase/storage'

type Step = 'proveedor' | 'foto' | 'ocr' | 'confirmar'

interface LineState extends ScannedLine {
  _mapped: boolean // true si product_id fue asignado (auto o manual)
}

export default function NuevaCompraPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()

  const [step, setStep] = useState<Step>('proveedor')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  // Foto / PDF
  const fileRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [ocrRaw, setOcrRaw] = useState('')

  // Líneas OCR
  const [lines, setLines] = useState<LineState[]>([])
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [notes, setNotes] = useState('')

  // Mapeo manual
  const [searchQuery, setSearchQuery] = useState<Record<number, string>>({})
  const [searchResults, setSearchResults] = useState<Record<number, ProductWithCategory[]>>({})
  const [searchingIdx, setSearchingIdx] = useState<number | null>(null)

  // Firebase Storage upload
  const [invoiceImageUrl, setInvoiceImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Confirmar
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    const presetId = searchParams.get('supplier_id')
    supplierApi.list().then((d) => {
      setSuppliers(d.suppliers)
      if (presetId) {
        const found = d.suppliers.find((s) => s.id === presetId)
        if (found) { setSelectedSupplier(found); setStep('foto') }
      }
    }).catch(console.error)
  }, [user, router, searchParams])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfFile(null)
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
  }

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(null)
    setImagePreview(null)
    setPdfFile(file)
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleScan() {
    if (!imageFile && !pdfFile) return
    setIsScanning(true)
    try {
      const file = (pdfFile || imageFile)!
      const base64 = await fileToBase64(file)
      const isPdf = file.type === 'application/pdf'

      // Run OCR scan and Firebase Storage upload in parallel
      const tempId = crypto.randomUUID()
      const [ocrRes] = await Promise.all([
        fetch('/api/admin/purchase-orders/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(isPdf ? { pdf_base64: base64 } : { image_base64: base64 }),
            supplier_id: selectedSupplier?.id,
          }),
        }),
        // Only upload images (not PDFs) to Storage; PDFs upload too
        (async () => {
          try {
            setIsUploading(true)
            const url = await uploadInvoiceImage(file, tempId)
            setInvoiceImageUrl(url)
          } catch (uploadErr) {
            // Non-fatal: log but don't block the OCR flow
            console.error('Error al subir imagen a Firebase Storage:', uploadErr)
          } finally {
            setIsUploading(false)
          }
        })(),
      ])

      if (!ocrRes.ok) {
        const err = await ocrRes.json().catch(() => ({ error: 'Error al escanear' }))
        throw new Error(err.error || `Error ${ocrRes.status}`)
      }
      const data = await ocrRes.json()
      setOcrRaw(data.ocr_raw)
      setLines(
        data.lines.map((l: ScannedLine) => ({
          ...l,
          _mapped: l.product_id !== null,
        }))
      )
      setStep('ocr')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al escanear')
    } finally {
      setIsScanning(false)
    }
  }

  async function searchProducts(idx: number, query: string) {
    setSearchQuery((prev) => ({ ...prev, [idx]: query }))
    if (query.length < 2) { setSearchResults((prev) => ({ ...prev, [idx]: [] })); return }
    setSearchingIdx(idx)
    try {
      const data = await productApi.list({ search: query, limit: 8, active_only: false })
      setSearchResults((prev) => ({ ...prev, [idx]: data.products }))
    } catch {
      // ignore
    } finally {
      setSearchingIdx(null)
    }
  }

  function mapLine(idx: number, product: ProductWithCategory) {
    setLines((prev) => prev.map((l, i) =>
      i === idx ? { ...l, product_id: product.id, product_name_matched: product.name, _mapped: true } : l
    ))
    setSearchQuery((prev) => ({ ...prev, [idx]: '' }))
    setSearchResults((prev) => ({ ...prev, [idx]: [] }))
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateLine(idx: number, field: 'quantity' | 'unit_cost', value: number) {
    setLines((prev) => prev.map((l, i) => {
      if (i !== idx) return l
      const updated = { ...l, [field]: value }
      updated.subtotal = updated.quantity * updated.unit_cost
      return updated
    }))
  }

  async function handleConfirm() {
    if (!selectedSupplier) return
    const mappedLines = lines.filter((l) => l.product_id)
    if (mappedLines.length === 0) {
      alert('Debes mapear al menos un producto antes de confirmar')
      return
    }

    setIsSubmitting(true)
    try {
      // Crear OC en draft
      const order = await purchaseOrderApi.create({
        supplier_id: selectedSupplier.id,
        invoice_number: invoiceNumber || undefined,
        invoice_date: invoiceDate || undefined,
        notes: notes || undefined,
        ocr_raw: ocrRaw || undefined,
        image_url: invoiceImageUrl || undefined,
        items: lines.map((l) => ({
          product_id: l.product_id || undefined,
          supplier_product_code: l.supplier_product_code || undefined,
          product_name_invoice: l.product_name_invoice,
          quantity: l.quantity,
          unit_cost: l.unit_cost,
          subtotal: l.subtotal,
        })),
      })

      // Confirmar recepción inmediatamente
      await purchaseOrderApi.receive(order.id)

      router.push(`/admin/compras/${order.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al confirmar')
      setIsSubmitting(false)
    }
  }

  const totalCost = lines.reduce((s, l) => s + l.subtotal, 0)
  const mappedCount = lines.filter((l) => l._mapped).length
  const unmappedCount = lines.length - mappedCount

  // ─── Renderizado por step ───────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb / steps */}
      <div className="flex items-center gap-2 text-sm">
        {(['proveedor', 'foto', 'ocr', 'confirmar'] as Step[]).map((s, i, arr) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`font-medium capitalize ${step === s ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {i + 1}. {s === 'proveedor' ? 'Proveedor' : s === 'foto' ? 'Factura' : s === 'ocr' ? 'Revisar' : 'Confirmar'}
            </span>
            {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Proveedor ── */}
      {step === 'proveedor' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Seleccionar proveedor</h2>
          </div>

          <div className="space-y-3">
            {suppliers.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No hay proveedores registrados.{' '}
                <button onClick={() => router.push('/admin/proveedores')} className="text-emerald-600 hover:underline">
                  Crear proveedor
                </button>
              </p>
            ) : (
              suppliers.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSupplier(s)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedSupplier?.id === s.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-700'
                  }`}
                >
                  <div className="font-medium text-slate-900 dark:text-white">{s.name}</div>
                  {s.rut && <div className="text-xs text-slate-500 dark:text-slate-400">RUT {s.rut}</div>}
                </button>
              ))
            )}
          </div>

          <button
            disabled={!selectedSupplier}
            onClick={() => setStep('foto')}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-3 rounded-xl font-medium transition-colors"
          >
            Continuar <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 2: Foto / PDF ── */}
      {step === 'foto' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Factura</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Proveedor: <strong>{selectedSupplier?.name}</strong></p>
            </div>
          </div>

          {/* Preview — Image */}
          {imagePreview && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Factura" className="w-full rounded-xl object-contain max-h-64 bg-slate-50 dark:bg-slate-900" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="absolute top-2 right-2 bg-white dark:bg-slate-700 rounded-full p-1 shadow"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}

          {/* Preview — PDF */}
          {pdfFile && !imagePreview && (
            <div className="relative flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <FileText className="w-10 h-10 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">{pdfFile.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{(pdfFile.size / 1024).toFixed(0)} KB — PDF</p>
              </div>
              <button
                onClick={() => setPdfFile(null)}
                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-full"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}

          {/* Upload zone — show when no file selected */}
          {!imagePreview && !pdfFile && (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-10 text-center">
              <Camera className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">Sube una foto o PDF de la factura</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">JPG, PNG o PDF</p>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
          <input ref={pdfRef} type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" />

          {/* Action buttons */}
          {!imagePreview && !pdfFile && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                <Camera className="w-5 h-5" /> Foto / Imagen
              </button>
              <button
                onClick={() => pdfRef.current?.click()}
                className="flex items-center justify-center gap-2 border-2 border-blue-500 text-blue-600 dark:text-blue-400 px-4 py-3 rounded-xl font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <FileText className="w-5 h-5" /> Importar PDF
              </button>
            </div>
          )}

          {invoiceImageUrl && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
              <Upload className="w-3.5 h-3.5 shrink-0" />
              Imagen subida a Firebase Storage
            </div>
          )}
          {isUploading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Subiendo imagen...
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('proveedor')}
              className="flex items-center gap-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
            <button
              disabled={(!imageFile && !pdfFile) || isScanning}
              onClick={handleScan}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-3 rounded-xl font-medium transition-colors"
            >
              {isScanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Escaneando...</> : <><Scan className="w-4 h-4" /> Escanear factura</>}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: OCR / Revisión de líneas ── */}
      {step === 'ocr' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Scan className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Revisar líneas</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{mappedCount} reconocidas</span>
                  {unmappedCount > 0 && <span className="text-amber-600 dark:text-amber-400 font-medium"> · {unmappedCount} sin mapear</span>}
                </p>
              </div>
            </div>

            {/* Datos opcionales */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">N° Factura</label>
                <input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Fecha</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Líneas */}
            {lines.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                <p>No se detectaron líneas de productos en la imagen.</p>
                <p className="text-sm mt-1">Intenta con una foto más clara o ingresa los productos manualmente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${
                      line._mapped
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                        : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {line._mapped
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        }
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {line.product_name_matched ?? line.product_name_invoice}
                          </p>
                          {line.supplier_product_code && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">Código: {line.supplier_product_code}</p>
                          )}
                          {!line._mapped && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 italic">{line.product_name_invoice}</p>
                          )}
                        </div>
                      </div>
                      <button onClick={() => removeLine(idx)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>

                    {/* Cantidad / precio */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Cantidad</label>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Costo unit.</label>
                        <input
                          type="number"
                          min={0}
                          value={line.unit_cost}
                          onChange={(e) => updateLine(idx, 'unit_cost', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Subtotal</label>
                        <div className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-medium">
                          ${line.subtotal.toLocaleString('es-CL')}
                        </div>
                      </div>
                    </div>

                    {/* Mapeo manual */}
                    {!line._mapped && (
                      <div className="mt-3">
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> Buscar producto en catálogo
                        </label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            value={searchQuery[idx] || ''}
                            onChange={(e) => searchProducts(idx, e.target.value)}
                            placeholder="Nombre o ingrediente activo..."
                            className="w-full pl-8 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          {searchingIdx === idx && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />}
                        </div>
                        {(searchResults[idx] || []).length > 0 && (
                          <div className="mt-1 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-700 shadow-sm">
                            {searchResults[idx].map((p) => (
                              <button
                                key={p.id}
                                onClick={() => mapLine(idx, p)}
                                className="w-full text-left px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm border-b border-slate-100 dark:border-slate-600 last:border-0"
                              >
                                <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                                {p.laboratory && <p className="text-xs text-slate-500 dark:text-slate-400">{p.laboratory}</p>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-5 py-4 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Total factura:</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">${totalCost.toLocaleString('es-CL')}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('foto')}
              className="flex items-center gap-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
            <button
              disabled={mappedCount === 0}
              onClick={() => setStep('confirmar')}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-3 rounded-xl font-medium transition-colors"
            >
              Revisar y confirmar <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Confirmar ── */}
      {step === 'confirmar' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Confirmar recepción</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Proveedor</span>
              <span className="font-medium text-slate-900 dark:text-white">{selectedSupplier?.name}</span>
            </div>
            {invoiceNumber && (
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">N° Factura</span>
                <span className="font-medium text-slate-900 dark:text-white">{invoiceNumber}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Productos mapeados</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{mappedCount} de {lines.length}</span>
            </div>
            {unmappedCount > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Sin mapear (no actualizarán stock)</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">{unmappedCount}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Total</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">${totalCost.toLocaleString('es-CL')}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
              placeholder="Observaciones sobre esta entrega..."
            />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm text-emerald-800 dark:text-emerald-300">
            Al confirmar, el stock de los {mappedCount} producto(s) mapeados aumentará automáticamente y se registrará el precio de costo.
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('ocr')}
              className="flex items-center gap-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
            <button
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-3 rounded-xl font-medium transition-colors"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                : <><CheckCircle2 className="w-4 h-4" /> Confirmar recepción</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
