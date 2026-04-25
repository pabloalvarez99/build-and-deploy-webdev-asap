'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { productApi, PaginatedProducts, Category, Product } from '@/lib/api';
import {
  Search, ShoppingCart, Check, X, ChevronUp, Package, ChevronDown,
  Pill, Heart, Droplets, Apple, Stethoscope, Brain, Wind, Sparkles,
  Eye, Flower2, Shield, Droplet, Baby, Users, Activity, Leaf,
  TrendingUp, MessageCircle, FileText, RefreshCw, LayoutGrid, List,
  Tag, Boxes, BadgePercent, AlertCircle, Star,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { formatPrice, discountedPrice } from '@/lib/format';
import { ReactNode } from 'react';

const categoryIcons: Record<string, ReactNode> = {
  'dolor-fiebre': <Pill className="w-4 h-4" />,
  'sistema-digestivo': <Stethoscope className="w-4 h-4" />,
  'sistema-cardiovascular': <Heart className="w-4 h-4" />,
  'sistema-nervioso': <Brain className="w-4 h-4" />,
  'sistema-respiratorio': <Wind className="w-4 h-4" />,
  'dermatologia': <Sparkles className="w-4 h-4" />,
  'oftalmologia': <Eye className="w-4 h-4" />,
  'salud-femenina': <Flower2 className="w-4 h-4" />,
  'diabetes-metabolismo': <Droplets className="w-4 h-4" />,
  'antibioticos-infecciones': <Shield className="w-4 h-4" />,
  'vitaminas-suplementos': <Apple className="w-4 h-4" />,
  'higiene-cuidado-personal': <Droplet className="w-4 h-4" />,
  'bebes-ninos': <Baby className="w-4 h-4" />,
  'adulto-mayor': <Users className="w-4 h-4" />,
  'insumos-medicos': <Activity className="w-4 h-4" />,
  'productos-naturales': <Leaf className="w-4 h-4" />,
  'otros': <Package className="w-4 h-4" />,
};

const categoryDot: Record<string, string> = {
  'dolor-fiebre': 'bg-red-400',
  'sistema-digestivo': 'bg-orange-400',
  'sistema-cardiovascular': 'bg-rose-400',
  'sistema-nervioso': 'bg-violet-400',
  'sistema-respiratorio': 'bg-sky-400',
  'dermatologia': 'bg-pink-400',
  'oftalmologia': 'bg-cyan-400',
  'salud-femenina': 'bg-fuchsia-400',
  'diabetes-metabolismo': 'bg-blue-400',
  'antibioticos-infecciones': 'bg-amber-400',
  'vitaminas-suplementos': 'bg-lime-400',
  'higiene-cuidado-personal': 'bg-teal-400',
  'bebes-ninos': 'bg-yellow-400',
  'adulto-mayor': 'bg-indigo-400',
  'insumos-medicos': 'bg-slate-400',
  'productos-naturales': 'bg-green-400',
  'otros': 'bg-slate-300',
};

const prioritySlugs = [
  'dolor-fiebre', 'sistema-cardiovascular', 'diabetes-metabolismo',
  'vitaminas-suplementos', 'sistema-digestivo', 'sistema-nervioso',
];

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-auto z-50">
      <div className="flex items-center gap-3 bg-slate-900 dark:bg-slate-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/10">
        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Check className="w-3.5 h-3.5" />
        </div>
        <span className="font-medium text-base">{message}</span>
      </div>
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      Agotado
    </span>
  );
  if (stock <= 5) return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
      Stock bajo
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
      Disponible
    </span>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<PaginatedProducts | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { addToCart, cart } = useCartStore();
  const { user } = useAuthStore();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [topSellers, setTopSellers] = useState<Product[]>([]);
  const [frequentProducts, setFrequentProducts] = useState<Product[]>([]);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [showDiscountOnly, setShowDiscountOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    const discount = searchParams.get('discount');
    if (discount === 'true') setShowDiscountOnly(true);
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadCategories();
    loadDiscountedProducts();
    loadTopSellers();
  }, []);

  useEffect(() => {
    if (!user || user.role === 'admin') { setFrequentProducts([]); return; }
    fetch('/api/products/frequent?limit=6')
      .then(r => r.ok ? r.json() : [])
      .then(data => setFrequentProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchTerm(searchInput);
        setCurrentPage(1);
        setAllProducts([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadProducts(1, true);
  }, [selectedCategory, searchTerm, showDiscountOnly]);

  const loadCategories = async () => {
    try {
      const data = await productApi.listCategories();
      data.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(data);
    } catch {}
  };

  const loadTopSellers = async () => {
    try {
      const res = await fetch('/api/products/top-sellers?limit=10');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) { setTopSellers(data); return; }
      }
      const fallback = await fetch('/api/products?in_stock=true&active_only=true&limit=30&sort_by=name');
      if (fallback.ok) {
        const { products } = await fallback.json();
        const withImage = (products as Product[]).filter(p => p.image_url).slice(0, 10);
        if (withImage.length > 0) setTopSellers(withImage);
      }
    } catch {}
  };

  const loadDiscountedProducts = async () => {
    try {
      const res = await fetch('/api/products?has_discount=true&in_stock=true&sort_by=discount_desc&limit=20&active_only=true');
      if (res.ok) {
        const data = await res.json();
        setDiscountedProducts(data.products || []);
      }
    } catch {}
  };

  const loadProducts = async (page: number, reset: boolean) => {
    if (reset) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const data = await productApi.list({
        category: selectedCategory || undefined,
        search: searchTerm || undefined,
        page,
        limit: ITEMS_PER_PAGE,
        sort_by: 'name',
        in_stock: true,
        has_discount: showDiscountOnly || undefined,
      });
      if (reset) setAllProducts(data.products);
      else setAllProducts(prev => [...prev, ...data.products]);
      setProducts(data);
      setCurrentPage(page);
      setHasMore(page < data.total_pages);
    } catch {}
    finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    setAddingId(product.id);
    await addToCart(product.id);
    const shortName = product.name.length > 25 ? product.name.substring(0, 25) + '...' : product.name;
    setToast(`${shortName} agregado`);
    setTimeout(() => setAddingId(null), 600);
  };

  const handleCategoryChange = useCallback((slug: string) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
    setAllProducts([]);
    window.history.replaceState({}, '', slug ? `/?category=${slug}` : '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectedCategoryName = categories.find(c => c.slug === selectedCategory)?.name;

  const sortedCategories = [...categories].sort((a, b) => {
    const aIdx = prioritySlugs.indexOf(a.slug);
    const bIdx = prioritySlugs.indexOf(b.slug);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  const inStockCount = products?.total ?? 0;
  const discountCount = discountedProducts.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed right-4 z-40 w-12 h-12 bg-slate-800 dark:bg-slate-700 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 transition-all ${cart && cart.item_count > 0 ? 'bottom-52' : 'bottom-20'}`}
          aria-label="Volver arriba"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 py-4 sm:py-6">

          {/* ── Sidebar (desktop only) ─────────────────────────── */}
          <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 gap-4">

            {/* Stats cards */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Inventario</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Boxes className="w-3.5 h-3.5 text-emerald-500" />
                    <span>En stock</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">{inStockCount > 0 ? inStockCount.toLocaleString('es-CL') : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Tag className="w-3.5 h-3.5 text-blue-500" />
                    <span>Categorías</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">{categories.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <BadgePercent className="w-3.5 h-3.5 text-red-500" />
                    <span>En oferta</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">{discountCount}</span>
                </div>
              </div>
            </div>

            {/* Category nav */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex-1">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-1 mb-2">Categorías</p>
              <nav className="space-y-0.5">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-sm font-medium transition-all text-left ${
                    !selectedCategory
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${!selectedCategory ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  Todos
                  {!selectedCategory && products && (
                    <span className="ml-auto font-mono text-xs text-emerald-600 dark:text-emerald-500">{products.total.toLocaleString('es-CL')}</span>
                  )}
                </button>
                {sortedCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-sm font-medium transition-all text-left ${
                      selectedCategory === cat.slug
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedCategory === cat.slug ? 'bg-emerald-500' : (categoryDot[cat.slug] || 'bg-slate-300 dark:bg-slate-600')}`} />
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── Main content ───────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Search bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3">
              <div className="flex gap-2 items-center">
                <div className="flex-1 relative" role="search">
                  <label htmlFor="search-products" className="sr-only">Buscar medicamentos</label>
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 h-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                  </div>
                  <input
                    ref={searchInputRef}
                    id="search-products"
                    type="search"
                    placeholder="Buscar medicamentos, principio activo, laboratorio..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                    autoComplete="off"
                  />
                  {searchInput && (
                    <button
                      onClick={() => { setSearchInput(''); setSearchTerm(''); searchInputRef.current?.focus(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Link
                  href="/cotizacion"
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Cotizar</span>
                </Link>
              </div>
            </div>

            {/* Loyalty teaser */}
            {!user && !selectedCategory && !searchTerm && !showDiscountOnly && (
              <Link
                href="/auth/register"
                className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-4 hover:border-amber-300 dark:hover:border-amber-700 transition-colors group"
              >
                <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Star className="w-5 h-5 text-white fill-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-900 dark:text-amber-300 text-base leading-tight">Gana puntos en cada compra</p>
                  <p className="text-amber-700 dark:text-amber-400 text-sm">Crea tu cuenta gratis y acumula descuentos</p>
                </div>
                <span className="text-amber-500 font-bold group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            )}

            {/* Compra Rápida */}
            {user && frequentProducts.length > 0 && !selectedCategory && !searchTerm && !showDiscountOnly && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Compra Rápida</h2>
                  <span className="text-sm text-slate-400 font-normal">Tus productos habituales</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                  {frequentProducts.map((product) => {
                    const finalPrice = product.discount_percent
                      ? discountedPrice(Number(product.price), product.discount_percent)
                      : Number(product.price);
                    return (
                      <div key={product.id} className="flex-shrink-0 w-36 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 overflow-hidden flex flex-col shadow-sm">
                        <Link href={`/producto/${product.slug}`} className="block">
                          <div className="aspect-square bg-slate-50 dark:bg-slate-800 relative overflow-hidden">
                            {product.image_url && !brokenImages.has(product.id) ? (
                              <Image src={product.image_url} alt={product.name} fill sizes="144px" className="object-contain p-2" onError={() => setBrokenImages(prev => new Set(prev).add(product.id))} />
                            ) : <div className="absolute inset-0 flex items-center justify-center text-slate-300"><Package className="w-8 h-8" /></div>}
                          </div>
                        </Link>
                        <div className="p-2.5 flex flex-col flex-1">
                          <Link href={`/producto/${product.slug}`}>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 mb-1 min-h-[2.5rem]">{product.name}</h3>
                          </Link>
                          <div className="mt-auto">
                            {product.discount_percent && <span className="text-xs text-slate-400 line-through block">{formatPrice(product.price)}</span>}
                            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-base block mb-2">{formatPrice(finalPrice)}</span>
                            <button onClick={() => handleAddToCart(product)} disabled={addingId === product.id}
                              className={`w-full flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-sm transition-all ${addingId === product.id ? 'bg-emerald-600 text-white scale-95' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'}`}>
                              {addingId === product.id ? <Check className="w-4 h-4" /> : <><ShoppingCart className="w-3.5 h-3.5" /><span>Agregar</span></>}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Más Vendidos */}
            {topSellers.length > 0 && !selectedCategory && !searchTerm && !showDiscountOnly && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Más vendidos</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                  {topSellers.map((product) => {
                    const finalPrice = product.discount_percent ? discountedPrice(Number(product.price), product.discount_percent) : Number(product.price);
                    return (
                      <div key={product.id} className="flex-shrink-0 w-36 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                        <Link href={`/producto/${product.slug}`} className="block">
                          <div className="aspect-square bg-slate-50 dark:bg-slate-800 relative overflow-hidden">
                            {product.image_url && !brokenImages.has(product.id) ? (
                              <Image src={product.image_url} alt={product.name} fill sizes="144px" className="object-contain p-2" onError={() => setBrokenImages(prev => new Set(prev).add(product.id))} />
                            ) : <div className="absolute inset-0 flex items-center justify-center text-slate-300"><Package className="w-8 h-8" /></div>}
                          </div>
                        </Link>
                        <div className="p-2.5 flex flex-col flex-1">
                          <Link href={`/producto/${product.slug}`}>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 mb-1 min-h-[2.5rem]">{product.name}</h3>
                          </Link>
                          <div className="mt-auto">
                            {product.discount_percent && <span className="text-xs text-slate-400 line-through block">{formatPrice(product.price)}</span>}
                            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-base block mb-2">{formatPrice(finalPrice)}</span>
                            <button onClick={() => handleAddToCart(product)} disabled={addingId === product.id}
                              className={`w-full flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-sm transition-all ${addingId === product.id ? 'bg-emerald-600 text-white scale-95' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'}`}>
                              {addingId === product.id ? <Check className="w-4 h-4" /> : <><ShoppingCart className="w-3.5 h-3.5" /><span>Agregar</span></>}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ofertas */}
            {discountedProducts.length > 0 && !selectedCategory && !searchTerm && !showDiscountOnly && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BadgePercent className="w-4 h-4 text-red-500" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Ofertas</h2>
                  </div>
                  <Link href="/?discount=true" className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Ver todas →</Link>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                  {discountedProducts.map((product) => {
                    const finalPrice = discountedPrice(Number(product.price), product.discount_percent!);
                    return (
                      <div key={product.id} className="flex-shrink-0 w-36 bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900/50 shadow-sm overflow-hidden flex flex-col">
                        <Link href={`/producto/${product.slug}`} className="block relative">
                          <div className="aspect-square bg-slate-50 dark:bg-slate-800 relative overflow-hidden">
                            {product.image_url && !brokenImages.has(product.id) ? (
                              <Image src={product.image_url} alt={product.name} fill sizes="144px" className="object-contain p-2" onError={() => setBrokenImages(prev => new Set(prev).add(product.id))} />
                            ) : <div className="absolute inset-0 flex items-center justify-center text-slate-300"><Package className="w-8 h-8" /></div>}
                            <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">-{product.discount_percent}%</div>
                          </div>
                        </Link>
                        <div className="p-2.5 flex flex-col flex-1">
                          <Link href={`/producto/${product.slug}`}>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 mb-1 min-h-[2.5rem]">{product.name}</h3>
                          </Link>
                          <div className="mt-auto">
                            <span className="text-xs text-slate-400 line-through block">{formatPrice(product.price)}</span>
                            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-base block mb-2">{formatPrice(finalPrice)}</span>
                            <button onClick={() => handleAddToCart(product)} disabled={addingId === product.id}
                              className={`w-full flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-sm transition-all ${addingId === product.id ? 'bg-emerald-600 text-white scale-95' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'}`}>
                              {addingId === product.id ? <Check className="w-4 h-4" /> : <><ShoppingCart className="w-3.5 h-3.5" /><span>Agregar</span></>}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mobile category grid (hidden on lg where sidebar is visible) */}
            {!selectedCategory && !searchTerm && (
              <MobileCategoryGrid categories={sortedCategories} onSelect={handleCategoryChange} />
            )}

            {/* Toolbar: active filters + count + view toggle */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedCategory && selectedCategoryName && (
                  <button
                    onClick={() => handleCategoryChange('')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium border border-emerald-200 dark:border-emerald-800 text-sm"
                  >
                    {selectedCategoryName}
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {showDiscountOnly && (
                  <button
                    onClick={() => { setShowDiscountOnly(false); setAllProducts([]); window.history.replaceState({}, '', '/'); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg font-medium border border-red-200 dark:border-red-800 text-sm"
                  >
                    Ofertas <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {products && (
                  <span className="text-sm text-slate-400 dark:text-slate-500 font-mono">
                    {products.total.toLocaleString('es-CL')} productos
                  </span>
                )}
              </div>
              {/* View toggle */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
                <button onClick={() => setViewMode('grid')} aria-label="Vista cuadrícula"
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} aria-label="Vista lista"
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Products */}
            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-2'}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse">
                    <div className={viewMode === 'grid' ? '' : 'flex gap-4 items-center'}>
                      <div className={`bg-slate-100 dark:bg-slate-800 rounded-xl ${viewMode === 'grid' ? 'aspect-square mb-4' : 'w-16 h-16 flex-shrink-0'}`} />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                        {viewMode === 'grid' && <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-2/5 mt-2" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : allProducts.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {allProducts.map((product) => {
                      const finalPrice = product.discount_percent
                        ? discountedPrice(Number(product.price), product.discount_percent)
                        : Number(product.price);
                      return (
                        <div key={product.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md transition-all group">
                          <Link href={`/producto/${product.slug}`} className="block">
                            <div className="aspect-square bg-slate-50 dark:bg-slate-800 relative overflow-hidden">
                              {product.image_url && !brokenImages.has(product.id) ? (
                                <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-contain p-3 group-hover:scale-105 transition-transform duration-300" onError={() => setBrokenImages(prev => new Set(prev).add(product.id))} />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Package className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                                </div>
                              )}
                              {product.discount_percent && (
                                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md">-{product.discount_percent}% OFF</div>
                              )}
                              {product.stock <= 0 && (
                                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                                  <span className="text-red-600 dark:text-red-400 font-bold text-base border-2 border-red-500 dark:border-red-700 px-3 py-1 rounded-xl -rotate-6 bg-white dark:bg-slate-900">AGOTADO</span>
                                </div>
                              )}
                            </div>
                          </Link>

                          <div className="p-4 flex flex-col flex-1">
                            {/* SKU + stock badge */}
                            <div className="flex items-center justify-between mb-2">
                              {product.external_id ? (
                                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-600 tracking-wide">{product.external_id.slice(0, 12)}</span>
                              ) : <span />}
                              <StockBadge stock={product.stock} />
                            </div>

                            <Link href={`/producto/${product.slug}`}>
                              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-snug line-clamp-2 mb-1 min-h-[3.5rem] hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                                {product.name}
                              </h3>
                            </Link>
                            {product.laboratory && (
                              <span className="text-sm text-slate-400 dark:text-slate-500 mb-3 truncate">{product.laboratory}</span>
                            )}

                            <div className="mt-auto">
                              {product.discount_percent && (
                                <span className="font-mono text-sm text-slate-400 line-through block">{formatPrice(product.price)}</span>
                              )}
                              <span className="font-mono text-2xl font-black text-emerald-700 dark:text-emerald-400 block mb-3">
                                {formatPrice(finalPrice)}
                              </span>

                              {product.stock > 0 ? (
                                <button
                                  onClick={() => handleAddToCart(product)}
                                  disabled={addingId === product.id}
                                  aria-label={`Agregar ${product.name} al carrito`}
                                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-lg transition-all min-h-[52px] ${
                                    addingId === product.id
                                      ? 'bg-emerald-600 text-white scale-95'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-emerald-600/20 active:scale-95'
                                  }`}
                                >
                                  {addingId === product.id ? <Check className="w-5 h-5" /> : <><ShoppingCart className="w-4 h-4" /><span>Agregar</span></>}
                                </button>
                              ) : (
                                <div className="w-full py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-center font-semibold text-base min-h-[52px] flex items-center justify-center">
                                  Sin stock
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* List view */
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {allProducts.map((product) => {
                      const finalPrice = product.discount_percent
                        ? discountedPrice(Number(product.price), product.discount_percent)
                        : Number(product.price);
                      return (
                        <div key={product.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-xl relative flex-shrink-0 overflow-hidden">
                            {product.image_url && !brokenImages.has(product.id) ? (
                              <Image src={product.image_url} alt={product.name} fill sizes="56px" className="object-contain p-1.5" onError={() => setBrokenImages(prev => new Set(prev).add(product.id))} />
                            ) : <div className="absolute inset-0 flex items-center justify-center"><Package className="w-5 h-5 text-slate-300 dark:text-slate-600" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {product.external_id && <span className="font-mono text-[10px] text-slate-400 dark:text-slate-600">{product.external_id.slice(0, 10)}</span>}
                              <StockBadge stock={product.stock} />
                            </div>
                            <Link href={`/producto/${product.slug}`}>
                              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base leading-tight hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors truncate">{product.name}</h3>
                            </Link>
                            {product.laboratory && <p className="text-sm text-slate-400 truncate">{product.laboratory}</p>}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              {product.discount_percent && <span className="font-mono text-xs text-slate-400 line-through block">{formatPrice(product.price)}</span>}
                              <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-lg">{formatPrice(finalPrice)}</span>
                            </div>
                            {product.stock > 0 ? (
                              <button
                                onClick={() => handleAddToCart(product)}
                                disabled={addingId === product.id}
                                className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold transition-all ${addingId === product.id ? 'bg-emerald-600 text-white scale-95' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'}`}
                                aria-label={`Agregar ${product.name}`}
                              >
                                {addingId === product.id ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {hasMore && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => loadProducts(currentPage + 1, false)}
                      disabled={isLoadingMore}
                      className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-base hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-300 transition-all disabled:opacity-50 min-h-[48px]"
                    >
                      {isLoadingMore ? 'Cargando...' : 'Cargar más'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 py-12 text-center px-6">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-xl text-slate-500 dark:text-slate-400 font-medium mb-2">No se encontraron productos</p>
                {searchTerm && (
                  <p className="text-slate-400 dark:text-slate-500 mb-5">
                    ¿No encontraste <strong className="text-slate-600 dark:text-slate-300">&ldquo;{searchTerm}&rdquo;</strong>? Solicita un presupuesto.
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {(selectedCategory || searchTerm) && (
                    <button onClick={() => { handleCategoryChange(''); setSearchInput(''); setSearchTerm(''); }} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline text-lg">
                      Ver todos los productos
                    </button>
                  )}
                  <a
                    href={`https://wa.me/56993649604?text=${encodeURIComponent(`Hola! Busqué "${searchTerm || 'un producto'}" en su tienda y no lo encontré. ¿Pueden conseguirlo?`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold text-base hover:bg-[#1ebe5d] transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Solicitar presupuesto
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile cart bar */}
      {cart && cart.item_count > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-3 pb-safe z-40 shadow-lg">
          <div className="flex gap-2 max-w-7xl mx-auto">
            <Link href="/cotizacion" className="flex items-center gap-2 px-4 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0">
              <FileText className="w-4 h-4" />
              Cotizar
            </Link>
            <Link href="/carrito" className="flex flex-1 items-center justify-between bg-emerald-600 text-white rounded-xl px-5 py-3.5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-emerald-600 text-[10px] font-bold flex items-center justify-center rounded-full">{cart.item_count}</span>
                </div>
                <span className="font-bold text-lg">Ver carrito</span>
              </div>
              <span className="font-mono font-black text-xl">{formatPrice(cart.total)}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-4 right-4 z-40">
          <Link href="/cotizacion" className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
            <FileText className="w-4 h-4 text-emerald-600" />
            Cotizar
          </Link>
        </div>
      )}
    </div>
  );
}

function MobileCategoryGrid({ categories, onSelect }: { categories: Category[]; onSelect: (slug: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? categories : categories.slice(0, 6);

  if (categories.length === 0) return null;
  return (
    <div className="lg:hidden">
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Categorías</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {visible.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.slug)}
            className="flex items-center gap-2.5 px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all min-h-[52px] text-left"
          >
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${categoryDot[cat.slug] || 'bg-slate-300'}`} />
            <span className="truncate">{cat.name}</span>
          </button>
        ))}
      </div>
      {categories.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-sm px-2 min-h-[44px]"
        >
          {showAll ? 'Ver menos' : `Ver todas (${categories.length})`}
          <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}
