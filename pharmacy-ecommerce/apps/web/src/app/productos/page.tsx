'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Filter, Search, X, Loader2, Package } from 'lucide-react';
import { productApi, Category, PaginatedProducts, Product } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { Filters, CatalogFilters } from '@/components/catalog/Filters';
import { SortSelect, SortOption } from '@/components/catalog/SortSelect';
import { ProductCard } from '@/components/catalog/ProductCard';

const ITEMS_PER_PAGE = 24;

const SORT_TO_API: Record<SortOption, string | undefined> = {
  relevance: undefined,
  newest: undefined,
  price_asc: 'price_asc',
  price_desc: 'price_desc',
  name_asc: 'name_asc',
};

function readFiltersFromUrl(sp: URLSearchParams): { f: CatalogFilters; sort: SortOption; q: string } {
  return {
    f: {
      category: sp.get('category') || '',
      minPrice: sp.get('min_price') || '',
      maxPrice: sp.get('max_price') || '',
      inStock: sp.get('in_stock') === 'true',
      hasDiscount: sp.get('has_discount') === 'true',
    },
    sort: (sp.get('sort') as SortOption) || 'relevance',
    q: sp.get('q') || '',
  };
}

function buildQuery(f: CatalogFilters, sort: SortOption, q: string): string {
  const sp = new URLSearchParams();
  if (f.category) sp.set('category', f.category);
  if (f.minPrice) sp.set('min_price', f.minPrice);
  if (f.maxPrice) sp.set('max_price', f.maxPrice);
  if (f.inStock) sp.set('in_stock', 'true');
  if (f.hasDiscount) sp.set('has_discount', 'true');
  if (sort !== 'relevance') sp.set('sort', sort);
  if (q) sp.set('q', q);
  return sp.toString();
}

export default function ProductosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initial = useMemo(() => readFiltersFromUrl(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [filters, setFilters] = useState<CatalogFilters>(initial.f);
  const [sort, setSort] = useState<SortOption>(initial.sort);
  const [searchInput, setSearchInput] = useState(initial.q);
  const [searchTerm, setSearchTerm] = useState(initial.q);

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginatedProducts | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addToCart } = useCartStore();

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sync URL on filter/sort/search change
  useEffect(() => {
    const qs = buildQuery(filters, sort, searchTerm);
    const target = qs ? `/productos?${qs}` : '/productos';
    router.replace(target, { scroll: false });
  }, [filters, sort, searchTerm, router]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== searchTerm) setSearchTerm(searchInput);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, searchTerm]);

  // Load categories once
  useEffect(() => {
    productApi.listCategories().then((data) => {
      data.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(data);
    }).catch(() => {});
  }, []);

  // Load products when filters change (reset)
  const load = useCallback(async (p: number, reset: boolean) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const data = await productApi.list({
        page: p,
        limit: ITEMS_PER_PAGE,
        active_only: true,
        category: filters.category || undefined,
        min_price: filters.minPrice ? Number(filters.minPrice) : undefined,
        max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        in_stock: filters.inStock || undefined,
        has_discount: filters.hasDiscount || undefined,
        sort_by: SORT_TO_API[sort],
        search: searchTerm || undefined,
      });
      setMeta(data);
      setItems((prev) => (reset ? data.products : [...prev, ...data.products]));
      setPage(p);
      setHasMore(p < data.total_pages);
    } catch {
      if (reset) setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, sort, searchTerm]);

  useEffect(() => {
    load(1, true);
  }, [load]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) load(page + 1, false);
      },
      { rootMargin: '600px 0px' }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, page, load]);

  const handleFilterChange = (next: Partial<CatalogFilters>) => setFilters((prev) => ({ ...prev, ...next }));
  const clearAll = () => {
    setFilters({ category: '', minPrice: '', maxPrice: '', inStock: false, hasDiscount: false });
    setSearchInput('');
    setSearchTerm('');
    setSort('relevance');
  };

  const handleAdd = async (product: Product) => {
    setAddingId(product.id);
    await addToCart(product.id);
    setTimeout(() => setAddingId(null), 600);
  };

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.hasDiscount ? 1 : 0);

  const selectedCategoryName = categories.find((c) => c.slug === filters.category)?.name;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">Catálogo</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {meta ? `${meta.total.toLocaleString('es-CL')} productos` : 'Cargando...'}
            </p>
          </div>
          <Link href="/" className="text-sm text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">← Inicio</Link>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar medicamentos, principio activo, laboratorio..."
              className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters (desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sticky top-4">
              <Filters
                filters={filters}
                categories={categories}
                onChange={handleFilterChange}
                onClear={clearAll}
                totalResults={meta?.total}
                variant="sidebar"
              />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 min-h-[42px]"
              >
                <Filter className="w-4 h-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="bg-cyan-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                )}
              </button>
              <div className="ml-auto">
                <SortSelect value={sort} onChange={setSort} />
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {filters.category && selectedCategoryName && (
                  <Chip label={selectedCategoryName} onRemove={() => handleFilterChange({ category: '' })} />
                )}
                {filters.minPrice && <Chip label={`Min $${filters.minPrice}`} onRemove={() => handleFilterChange({ minPrice: '' })} />}
                {filters.maxPrice && <Chip label={`Max $${filters.maxPrice}`} onRemove={() => handleFilterChange({ maxPrice: '' })} />}
                {filters.inStock && <Chip label="En stock" onRemove={() => handleFilterChange({ inStock: false })} />}
                {filters.hasDiscount && <Chip label="Con descuento" onRemove={() => handleFilterChange({ hasDiscount: false })} />}
                <button onClick={clearAll} className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold hover:underline ml-1">
                  Limpiar todo
                </button>
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse">
                    <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl mb-3" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3 mb-3" />
                    <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 py-16 text-center px-6">
                <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-lg text-slate-600 dark:text-slate-300 font-semibold mb-2">No se encontraron productos</p>
                <p className="text-sm text-slate-400 mb-4">Prueba ajustar los filtros o limpiarlos.</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearAll} className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline">
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {items.map((product, idx) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={idx}
                      adding={addingId === product.id}
                      onAdd={handleAdd}
                      brokenImg={brokenImages.has(product.id)}
                      onImgError={(id) => setBrokenImages((prev) => new Set(prev).add(id))}
                    />
                  ))}
                </div>

                <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-4">
                  {loadingMore && (
                    <span className="inline-flex items-center gap-2 text-slate-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Cargando más...
                    </span>
                  )}
                  {!hasMore && items.length > 0 && (
                    <span className="text-xs text-slate-400">Fin del catálogo</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
            <Filters
              filters={filters}
              categories={categories}
              onChange={handleFilterChange}
              onClear={clearAll}
              totalResults={meta?.total}
              variant="drawer"
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-lg font-medium border border-cyan-200 dark:border-cyan-800 text-sm"
    >
      {label}
      <X className="w-3.5 h-3.5" />
    </button>
  );
}
