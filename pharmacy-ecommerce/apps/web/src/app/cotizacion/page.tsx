'use client';

import { useEffect, useState, useRef } from 'react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/format';
import { Printer, Plus, Minus, Trash2, Search, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { productApi, ProductWithCategory } from '@/lib/api';

// Defaults — overridden by admin settings loaded at runtime
const DEFAULT_PHARMACY = {
  name: 'Tu Farmacia',
  address: 'Coquimbo, Chile',
  phone: '+56 9 9364 9604',
  website: 'tu-farmacia.cl',
};

export default function CotizacionPage() {
  const { cart, fetchCart, addToCart, updateQuantity, removeFromCart } = useCartStore();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ProductWithCategory[]>([]);
  const [searching, setSearching] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [pharmacy, setPharmacy] = useState(DEFAULT_PHARMACY);
  const searchRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setPharmacy({
          name: data.pharmacy_name || DEFAULT_PHARMACY.name,
          address: data.pharmacy_address || DEFAULT_PHARMACY.address,
          phone: data.pharmacy_phone || DEFAULT_PHARMACY.phone,
          website: data.pharmacy_website || DEFAULT_PHARMACY.website,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await productApi.list({ search: search.trim(), limit: 8, active_only: true });
        setResults(data.products);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const addToQuote = (product: ProductWithCategory) => {
    addToCart(product.id, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const handlePrint = () => window.print();

  const today = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  const items = cart?.items ?? [];
  const total = items.reduce((s, i) => s + Number(i.subtotal), 0);
  const quoteNumber = `COT-${Date.now().toString().slice(-8)}`;

  return (
    <>
      {/* Print styles injected inline */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #quote-printable, #quote-printable * { visibility: visible; }
          #quote-printable { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="no-print flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                Cotización de precios
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Agrega productos y genera tu cotización</p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            disabled={items.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Printer className="w-5 h-5" />
            Imprimir / PDF
          </button>
        </div>

        {/* Search bar — add products */}
        <div className="no-print mb-6 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar medicamento o producto para agregar..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base focus:border-emerald-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* Search dropdown */}
          {(searching || results.length > 0) && (
            <div className="absolute z-10 mt-2 w-full bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
              {searching ? (
                <div className="px-4 py-3 text-slate-400 text-sm">Buscando...</div>
              ) : results.map((p) => {
                const inQuote = cart?.items.find((i) => i.product_id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => { addToQuote(p); setSearch(''); setResults([]); }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-left border-b last:border-0 border-slate-100 dark:border-slate-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{p.category_name ?? ''} · Stock: {p.stock}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">{formatPrice(Number(p.price))}</p>
                      {inQuote && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">× {inQuote.quantity} en cotización</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quote document */}
        <div id="quote-printable" ref={printRef} className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Quote header */}
          <div className="bg-emerald-600 text-white px-6 py-5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black tracking-tight">{pharmacy.name}</h2>
                <p className="text-emerald-100 text-sm">{pharmacy.address}</p>
                <p className="text-emerald-100 text-sm">{pharmacy.phone}</p>
                {pharmacy.website && <p className="text-emerald-100 text-sm">{pharmacy.website}</p>}
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Cotización</p>
                <p className="text-xl font-black">{quoteNumber}</p>
                <p className="text-emerald-200 text-sm">{today}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          {items.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 no-print">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Usa el buscador para agregar productos</p>
              <p className="text-sm mt-1">O agrega productos al carrito y vuelve aquí</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Cant.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">P. Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Subtotal</th>
                    <th className="px-4 py-3 no-print" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {items.map((item) => (
                    <tr key={item.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{item.product_name}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 no-print">
                          <button
                            onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-bold text-slate-900 dark:text-slate-100">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="hidden print:inline font-medium">{item.quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatPrice(Number(item.subtotal) / item.quantity)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">{formatPrice(item.subtotal)}</td>
                      <td className="px-4 py-3 text-right no-print">
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30">
                    <td colSpan={3} className="px-5 py-4 text-right font-bold text-slate-700 dark:text-slate-300 text-base">
                      Total estimado
                    </td>
                    <td className="px-4 py-4 text-right text-2xl font-black text-emerald-700 dark:text-emerald-400">
                      {formatPrice(total)}
                    </td>
                    <td className="no-print" />
                  </tr>
                </tfoot>
              </table>

              {/* Footer note */}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
                * Precios válidos al {today}. Sujeto a disponibilidad de stock. Esta cotización no constituye una factura ni boleta.
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        {items.length > 0 && (
          <div className="no-print mt-4 flex flex-wrap gap-3 justify-end">
            <Link
              href="/checkout"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl transition-colors"
            >
              Continuar al checkout →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
