'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Tag, Search, Plus, Minus, X, Printer, Trash2, Loader2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { isAdminRole } from '@/lib/roles';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: number;
  discount_percent: number | null;
  external_id: string | null;
  presentation: string | null;
  laboratory: string | null;
  barcode: string | null;
}

interface LabelItem {
  product: Product;
  qty: number;
}

type LabelSize = '50x30' | '40x25' | '70x40';

const SIZES: Record<LabelSize, { w: string; h: string; cols: number; nameLines: number; barcodeH: number; fontPrice: string; fontName: string }> = {
  '50x30': { w: '50mm', h: '30mm', cols: 4, nameLines: 2, barcodeH: 28, fontPrice: '14px', fontName: '8px' },
  '40x25': { w: '40mm', h: '25mm', cols: 5, nameLines: 2, barcodeH: 22, fontPrice: '12px', fontName: '7px' },
  '70x40': { w: '70mm', h: '40mm', cols: 3, nameLines: 3, barcodeH: 36, fontPrice: '18px', fontName: '10px' },
};

function formatPrice(n: number) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

function finalPrice(p: Product) {
  if (p.discount_percent && p.discount_percent > 0) {
    return p.price * (1 - p.discount_percent / 100);
  }
  return p.price;
}

export default function EtiquetasPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState<LabelItem[]>([]);
  const [size, setSize] = useState<LabelSize>('50x30');
  const [showPrice, setShowPrice] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (!isAdminRole(user.role)) {
      router.replace('/');
      return;
    }
    setAuthChecked(true);
  }, [user, router]);

  const doSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const res = await fetch('/api/admin/etiquetas/search?q=' + encodeURIComponent(q));
      const json = await res.json();
      setResults(json.products || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim().length >= 2) doSearch(search.trim());
      else setResults([]);
    }, 250);
    return () => clearTimeout(t);
  }, [search, doSearch]);

  const addItem = (p: Product) => {
    setItems(prev => {
      const ex = prev.find(i => i.product.id === p.id);
      if (ex) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product: p, qty: 1 }];
    });
  };

  const setQty = (id: string, qty: number) => {
    if (qty <= 0) return removeItem(id);
    setItems(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i));
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.product.id !== id));
  const clearAll = () => setItems([]);

  const totalLabels = items.reduce((s, i) => s + i.qty, 0);
  const expanded: Product[] = items.flatMap(i => Array(i.qty).fill(i.product));

  if (!authChecked) {
    return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-3 print-hide">
          <Tag className="w-7 h-7 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Etiquetas de precio</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Genera e imprime etiquetas con código de barras y precio.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 print-hide">
          {/* Search */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Search className="w-5 h-5" /> Buscar productos
            </h2>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nombre, principio activo, código barra..."
              className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <div className="mt-3 max-h-80 overflow-y-auto">
              {searching && <p className="text-sm text-slate-500 py-2">Buscando...</p>}
              {!searching && search.length >= 2 && results.length === 0 && (
                <p className="text-sm text-slate-500 py-2">Sin resultados.</p>
              )}
              {results.map(p => (
                <button
                  key={p.id}
                  onClick={() => addItem(p)}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">{formatPrice(finalPrice(p))} · {p.barcode || 'sin código'}</p>
                  </div>
                  <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Selection */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900 dark:text-white">Seleccionados ({items.length})</h2>
              {items.length > 0 && (
                <button onClick={clearAll} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Vaciar
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 && <p className="text-sm text-slate-500 py-4 text-center">Aún no agregas productos.</p>}
              {items.map(i => (
                <div key={i.product.id} className="flex items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{i.product.name}</p>
                    <p className="text-xs text-slate-500">{formatPrice(finalPrice(i.product))}</p>
                  </div>
                  <button onClick={() => setQty(i.product.id, i.qty - 1)} className="p-1 rounded bg-slate-100 dark:bg-slate-800">
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={i.qty}
                    onChange={e => setQty(i.product.id, parseInt(e.target.value) || 1)}
                    className="w-12 text-center px-1 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                  <button onClick={() => setQty(i.product.id, i.qty + 1)} className="p-1 rounded bg-slate-100 dark:bg-slate-800">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeItem(i.product.id)} className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings + print */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4 mb-6 print-hide">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Tamaño</label>
              <select
                value={size}
                onChange={e => setSize(e.target.value as LabelSize)}
                className="px-3 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="50x30">50 × 30 mm (4 col)</option>
                <option value="40x25">40 × 25 mm (5 col)</option>
                <option value="70x40">70 × 40 mm (3 col)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} /> Mostrar precio
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={showBarcode} onChange={e => setShowBarcode(e.target.checked)} /> Mostrar código barra
            </label>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total: <strong>{totalLabels}</strong> etiquetas</span>
              <button
                onClick={() => window.print()}
                disabled={totalLabels === 0}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Imprimir
              </button>
            </div>
          </div>
        </div>

        {/* Preview / printable */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4 print-clean">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 print-hide">Vista previa</h3>
          {expanded.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center print-hide">Agrega productos para previsualizar.</p>
          ) : (
            <div
              className="label-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${SIZES[size].cols}, ${SIZES[size].w})`,
                gap: '2mm',
                justifyContent: 'start',
              }}
            >
              {expanded.map((p, idx) => (
                <Label key={idx} product={p} size={size} showPrice={showPrice} showBarcode={showBarcode} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .print-hide { display: none !important; }
          body, html { background: white !important; }
          .print-clean { padding: 0 !important; border: 0 !important; box-shadow: none !important; background: white !important; }
          [data-admin="1"] aside, [data-admin="1"] header, [data-admin="1"] nav { display: none !important; }
          .label-grid { gap: 0 !important; }
          @page { size: auto; margin: 5mm; }
        }
      `}</style>
    </div>
  );
}

function Label({ product, size, showPrice, showBarcode }: { product: Product; size: LabelSize; showPrice: boolean; showBarcode: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const cfg = SIZES[size];
  const price = finalPrice(product);
  const code = product.barcode || product.external_id || '';

  useEffect(() => {
    if (!svgRef.current || !showBarcode || !code) return;
    try {
      JsBarcode(svgRef.current, code, {
        format: code.length === 13 && /^\d+$/.test(code) ? 'EAN13' : 'CODE128',
        height: cfg.barcodeH,
        width: 1.4,
        fontSize: 9,
        margin: 0,
        displayValue: true,
      });
    } catch {
      try {
        JsBarcode(svgRef.current, code, { format: 'CODE128', height: cfg.barcodeH, width: 1.4, fontSize: 9, margin: 0, displayValue: true });
      } catch { /* ignore */ }
    }
  }, [code, showBarcode, cfg.barcodeH]);

  return (
    <div
      style={{
        width: cfg.w,
        height: cfg.h,
        border: '1px dashed #cbd5e1',
        padding: '1mm',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: 'white',
        color: '#0f172a',
      }}
      className="label-cell"
    >
      <div
        style={{
          fontSize: cfg.fontName,
          lineHeight: 1.1,
          fontWeight: 600,
          display: '-webkit-box',
          WebkitLineClamp: cfg.nameLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {product.name}
      </div>
      {showPrice && (
        <div style={{ fontSize: cfg.fontPrice, fontWeight: 700, textAlign: 'center' }}>
          {formatPrice(price)}
        </div>
      )}
      {showBarcode && code && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg ref={svgRef} />
        </div>
      )}
      {(!showBarcode || !code) && (
        <div style={{ fontSize: '7px', textAlign: 'center', color: '#64748b' }}>
          {product.external_id || ''}
        </div>
      )}
    </div>
  );
}
