'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Database,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  DollarSign,
  Package,
  PackageCheck,
  PackageX,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import { formatPrice } from '@/lib/format';

interface CatalogProduct {
  id: string;
  external_id: string;
  name: string;
  price: number;
  active: boolean;
  stock: number;
  barcode_count: number;
  barcodes: string[];
}

interface CatalogStats {
  total: number;
  active: number;
  inactive: number;
  noprice: number;
}

interface CatalogResponse {
  products: CatalogProduct[];
  total: number;
  page: number;
  pages: number;
  stats: CatalogStats;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'noprice';

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters from URL
  const [q, setQ] = useState(() => searchParams.get('q') || '');
  const [status, setStatus] = useState<StatusFilter>(() => (searchParams.get('status') as StatusFilter) || 'all');
  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1'));

  // Price modal
  const [priceModal, setPriceModal] = useState<{ product: CatalogProduct; price: string } | null>(null);

  // Debounce search
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQ, setDebouncedQ] = useState(q);

  const handleSearchChange = (val: string) => {
    setQ(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedQ(val);
      setPage(1);
    }, 400);
  };

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQ) params.set('q', debouncedQ);
    if (status !== 'all') params.set('status', status);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(`/admin/catalogo${qs ? '?' + qs : ''}`, { scroll: false });
  }, [debouncedQ, status, page, router]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (debouncedQ) params.set('q', debouncedQ);
      if (status !== 'all') params.set('status', status);

      const res = await fetch(`/api/admin/catalogo?${params}`);
      if (!res.ok) throw new Error('Error cargando catálogo');
      const json = await res.json() as CatalogResponse;
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleActive = async (product: CatalogProduct) => {
    if (!product.active && product.price <= 0) {
      // Open price modal before activating
      setPriceModal({ product, price: '' });
      return;
    }
    await patchProduct(product.id, { active: !product.active });
  };

  const patchProduct = async (id: string, body: { active?: boolean; price?: number }) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/catalogo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        alert(err.error || 'Error al actualizar');
        return;
      }
      // Update local state optimistically
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          products: prev.products.map((p) =>
            p.id === id
              ? { ...p, ...(body.active !== undefined ? { active: body.active as boolean } : {}), ...(body.price !== undefined ? { price: body.price as number } : {}) }
              : p
          ),
          stats: {
            ...prev.stats,
            active: prev.stats.active + (body.active === true ? 1 : body.active === false ? -1 : 0),
            inactive: prev.stats.inactive + (body.active === false ? 1 : body.active === true ? -1 : 0),
          },
        };
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePriceModalConfirm = async () => {
    if (!priceModal) return;
    const price = parseFloat(priceModal.price.replace(/[,$]/g, ''));
    if (isNaN(price) || price <= 0) {
      alert('Ingrese un precio válido mayor a 0');
      return;
    }
    await patchProduct(priceModal.product.id, { price, active: true });
    // Update noprice stat
    setData((prev) => prev ? { ...prev, stats: { ...prev.stats, noprice: Math.max(0, prev.stats.noprice - 1) } } : prev);
    setPriceModal(null);
  };

  const filterTabs: { key: StatusFilter; label: string; color: string }[] = [
    { key: 'all', label: 'Todos', color: 'slate' },
    { key: 'active', label: 'En tienda', color: 'emerald' },
    { key: 'inactive', label: 'Inactivos', color: 'slate' },
    { key: 'noprice', label: 'Sin precio', color: 'amber' },
  ];

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Catálogo ERP</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Base de datos completa importada desde Golan/EcoSur</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Package className="w-5 h-5" />}
          label="Total ERP"
          value={stats?.total ?? 0}
          color="blue"
          active={status === 'all'}
          onClick={() => { setStatus('all'); setPage(1); }}
        />
        <StatCard
          icon={<PackageCheck className="w-5 h-5" />}
          label="En tienda"
          value={stats?.active ?? 0}
          color="emerald"
          active={status === 'active'}
          onClick={() => { setStatus('active'); setPage(1); }}
        />
        <StatCard
          icon={<PackageX className="w-5 h-5" />}
          label="Inactivos"
          value={stats?.inactive ?? 0}
          color="slate"
          active={status === 'inactive'}
          onClick={() => { setStatus('inactive'); setPage(1); }}
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5" />}
          label="Sin precio"
          value={stats?.noprice ?? 0}
          color="amber"
          active={status === 'noprice'}
          onClick={() => { setStatus('noprice'); setPage(1); }}
        />
      </div>

      {/* Search + Filter bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre, código ERP o EAN…"
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          {q && (
            <button
              onClick={() => { setQ(''); setDebouncedQ(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                status === tab.key
                  ? tab.color === 'emerald'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : tab.color === 'amber'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    : tab.color === 'blue'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {tab.label}
              {stats && (
                <span className="ml-1.5 text-xs opacity-70">
                  {tab.key === 'all' ? stats.total.toLocaleString()
                    : tab.key === 'active' ? stats.active.toLocaleString()
                    : tab.key === 'inactive' ? stats.inactive.toLocaleString()
                    : stats.noprice.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Table header info */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {loading ? 'Cargando…' : `${(data?.total ?? 0).toLocaleString()} productos${debouncedQ ? ` · "${debouncedQ}"` : ''}`}
          </p>
          {data && data.pages > 1 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Página {data.page} de {data.pages.toLocaleString()}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="text-left px-4 py-3 w-24">Cód. ERP</th>
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-right px-4 py-3 w-32">PVP</th>
                <th className="text-left px-4 py-3 w-48 hidden md:table-cell">EAN / Barcodes</th>
                <th className="text-center px-4 py-3 w-28">Estado</th>
                <th className="text-center px-4 py-3 w-32">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Cargando catálogo…
                  </td>
                </tr>
              ) : data?.products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                data?.products.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onToggle={() => handleToggleActive(product)}
                    isLoading={actionLoading === product.id}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            {/* Page numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {getPageNumbers(page, data.pages).map((p, i) =>
                p === '...' ? (
                  <span key={i} className="px-2 py-1 text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(Number(p))}
                    className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                      Number(p) === page
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page >= data.pages}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Price modal */}
      {priceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Establecer precio</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{priceModal.product.name}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Este producto no tiene precio. Ingresa el PVP en CLP para activarlo en la tienda.
            </p>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                type="number"
                value={priceModal.price}
                onChange={(e) => setPriceModal({ ...priceModal, price: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handlePriceModalConfirm()}
                placeholder="Ej: 5990"
                autoFocus
                className="w-full pl-7 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPriceModal(null)}
                className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePriceModalConfirm}
                disabled={!priceModal.price || actionLoading !== null}
                className="flex-1 px-4 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Activar en tienda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductRow({
  product,
  onToggle,
  isLoading,
}: {
  product: CatalogProduct;
  onToggle: () => void;
  isLoading: boolean;
}) {
  const displayBarcodes = product.barcodes.slice(0, 2);
  const extraCount = product.barcode_count - 2;

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
      {/* Código ERP */}
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
          {product.external_id}
        </span>
      </td>

      {/* Nombre */}
      <td className="px-4 py-3">
        <span className="text-slate-900 dark:text-slate-100 font-medium leading-tight line-clamp-2">
          {product.name}
        </span>
      </td>

      {/* PVP */}
      <td className="px-4 py-3 text-right">
        {product.price > 0 ? (
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {formatPrice(product.price)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Sin precio
          </span>
        )}
      </td>

      {/* EANs */}
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {displayBarcodes.map((bc) => (
            <span key={bc} className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
              {bc}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
              +{extraCount}
            </span>
          )}
          {product.barcode_count === 0 && (
            <span className="text-xs text-slate-300 dark:text-slate-600 italic">—</span>
          )}
        </div>
      </td>

      {/* Estado */}
      <td className="px-4 py-3 text-center">
        {product.active ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full">
            <Eye className="w-3 h-3" />
            En tienda
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full">
            <EyeOff className="w-3 h-3" />
            Inactivo
          </span>
        )}
      </td>

      {/* Acción */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={onToggle}
          disabled={isLoading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            product.active
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : product.active ? (
            <>
              <EyeOff className="w-3 h-3" />
              Desactivar
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" />
              Activar
            </>
          )}
        </button>
      </td>
    </tr>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'emerald' | 'slate' | 'amber';
  active: boolean;
  onClick: () => void;
}) {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    slate: 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  };

  const iconColorMap = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    slate: 'text-slate-500 dark:text-slate-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all hover:shadow-md ${
        active
          ? colorMap[color]
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <div className={`mb-2 ${active ? iconColorMap[color] : 'text-slate-400 dark:text-slate-500'}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value.toLocaleString()}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </button>
  );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

export default function CatalogPage() {
  return (
    <Suspense>
      <CatalogContent />
    </Suspense>
  );
}
