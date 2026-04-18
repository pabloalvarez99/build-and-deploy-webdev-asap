'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { productApi, PaginatedProducts, Category, Product } from '@/lib/api';
import { Search, ShoppingCart, Check, X, ChevronUp, Package, ChevronDown, Pill, Heart, Droplets, Apple, Stethoscope, Brain, Wind, Sparkles, Eye, Flower2, Shield, Droplet, Baby, Users, Activity, Leaf, TrendingUp, MessageCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { formatPrice, discountedPrice } from '@/lib/format';
import { ReactNode } from 'react';
// Lucide icons per category slug for professional visual recognition
const categoryIcons: Record<string, ReactNode> = {
  'dolor-fiebre': <Pill className="w-5 h-5" />,
  'sistema-digestivo': <Stethoscope className="w-5 h-5" />,
  'sistema-cardiovascular': <Heart className="w-5 h-5" />,
  'sistema-nervioso': <Brain className="w-5 h-5" />,
  'sistema-respiratorio': <Wind className="w-5 h-5" />,
  'dermatologia': <Sparkles className="w-5 h-5" />,
  'oftalmologia': <Eye className="w-5 h-5" />,
  'salud-femenina': <Flower2 className="w-5 h-5" />,
  'diabetes-metabolismo': <Droplets className="w-5 h-5" />,
  'antibioticos-infecciones': <Shield className="w-5 h-5" />,
  'vitaminas-suplementos': <Apple className="w-5 h-5" />,
  'higiene-cuidado-personal': <Droplet className="w-5 h-5" />,
  'bebes-ninos': <Baby className="w-5 h-5" />,
  'adulto-mayor': <Users className="w-5 h-5" />,
  'insumos-medicos': <Activity className="w-5 h-5" />,
  'productos-naturales': <Leaf className="w-5 h-5" />,
  'otros': <Package className="w-5 h-5" />,
};

// Priority order: most relevant for elderly users first
const prioritySlugs = [
  'dolor-fiebre',
  'sistema-cardiovascular',
  'diabetes-metabolismo',
  'vitaminas-suplementos',
  'sistema-digestivo',
  'sistema-nervioso',
];

// Toast notification - grande para adultos mayores
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-auto z-50">
      <div className="flex items-center gap-3 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl">
        <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4" />
        </div>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-800" />}>
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
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [topSellers, setTopSellers] = useState<Product[]>([]);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [showDiscountOnly, setShowDiscountOnly] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const ITEMS_PER_PAGE = 20;

  // Read category and discount from URL on mount
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    const discount = searchParams.get('discount');
    if (discount === 'true') setShowDiscountOnly(true);
  }, [searchParams]);

  // Scroll listener
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

  // Debounced search
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

  // Load products when filters change
  useEffect(() => {
    loadProducts(1, true);
  }, [selectedCategory, searchTerm, showDiscountOnly]);

  const loadCategories = async () => {
    try {
      const data = await productApi.listCategories();
      data.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTopSellers = async () => {
    try {
      const res = await fetch('/api/products/top-sellers?limit=10');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setTopSellers(data);
          return;
        }
      }
      // Fallback: productos reales con imagen del inventario
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
    } catch (error) {
      console.error('Error loading discounted products:', error);
    }
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

      if (reset) {
        setAllProducts(data.products);
      } else {
        setAllProducts(prev => [...prev, ...data.products]);
      }
      setProducts(data);
      setCurrentPage(page);
      setHasMore(page < data.total_pages);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    loadProducts(currentPage + 1, false);
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
    // Sync URL
    if (slug) {
      window.history.replaceState({}, '', `/?category=${slug}`);
    } else {
      window.history.replaceState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectedCategoryName = categories.find(c => c.slug === selectedCategory)?.name;

  // Sort categories: priority ones first, then the rest alphabetically
  const sortedCategories = [...categories].sort((a, b) => {
    const aIdx = prioritySlugs.indexOf(a.slug);
    const bIdx = prioritySlugs.indexOf(b.slug);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
  const visibleCategories = showAllCategories ? sortedCategories : sortedCategories.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800">
      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Scroll to Top — positioned above WhatsApp button (bottom-6) + 4rem gap, or above cart bar */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed right-4 z-40 w-14 h-14 bg-slate-700 dark:bg-slate-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-500 transition-all ${cart && cart.item_count > 0 ? 'bottom-52' : 'bottom-24'}`}
          aria-label="Volver arriba"
          title="Volver arriba"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}

      {/* Search Bar - Siempre visible, grande */}
      <div className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto flex gap-2 items-center">
          <div className="flex-1 relative" role="search">
            <label htmlFor="search-products" className="sr-only">Buscar medicamentos</label>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            </div>
            <input
              ref={searchInputRef}
              id="search-products"
              type="search"
              placeholder="Buscar medicamentos..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all"
              autoComplete="off"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setSearchTerm(''); searchInputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <Link
            href="/cotizacion"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold text-sm hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Cotizar</span>
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* Más Vendidos Section */}
        {topSellers.length > 0 && !selectedCategory && !searchTerm && !showDiscountOnly && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Más vendidos</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {topSellers.map((product) => {
                const finalPrice = product.discount_percent
                  ? discountedPrice(Number(product.price), product.discount_percent)
                  : Number(product.price);
                return (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-36 sm:w-44 bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900 shadow-sm overflow-hidden flex flex-col"
                  >
                    <Link href={`/producto/${product.slug}`} className="block relative">
                      <div className="aspect-square bg-slate-50 dark:bg-slate-800 relative overflow-hidden">
                        {product.image_url && !brokenImages.has(product.id) ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 144px, 176px"
                            className="object-contain p-2"
                            onError={() => setBrokenImages(prev => new Set(prev).add(product.id))}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                            <Package className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-2.5 flex flex-col flex-1">
                      <Link href={`/producto/${product.slug}`}>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 mb-1 min-h-[2.5rem]">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="mt-auto">
                        {product.discount_percent && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 line-through block">{formatPrice(product.price)}</span>
                        )}
                        <span className="text-base font-black text-emerald-700 dark:text-emerald-400 block mb-2">{formatPrice(finalPrice)}</span>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={addingId === product.id}
                          className={`w-full flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-sm transition-all border-2 border-emerald-600 ${
                            addingId === product.id
                              ? 'bg-emerald-600 text-white scale-95'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                          }`}
                        >
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

        {/* Ofertas Section */}
        {discountedProducts.length > 0 && !selectedCategory && !searchTerm && !showDiscountOnly && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">🔥 Ofertas</h2>
              <Link href="/?discount=true" className="text-emerald-600 dark:text-emerald-400 font-semibold text-base hover:underline">
                Ver todas →
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {discountedProducts.map((product) => {
                const finalPrice = discountedPrice(Number(product.price), product.discount_percent!);
                return (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-36 sm:w-44 bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-200 dark:border-red-800 shadow-md overflow-hidden flex flex-col"
                  >
                    <Link href={`/producto/${product.slug}`} className="block relative">
                      <div className="aspect-square bg-slate-50 dark:bg-slate-800 relative overflow-hidden">
                        {product.image_url && !brokenImages.has(product.id) ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 144px, 176px"
                            className="object-contain p-2"
                            onError={() => setBrokenImages(prev => new Set(prev).add(product.id))}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                            <Package className="w-10 h-10" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-lg">
                          -{product.discount_percent}% OFF
                        </div>
                      </div>
                    </Link>
                    <div className="p-2.5 flex flex-col flex-1">
                      <Link href={`/producto/${product.slug}`}>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 mb-1 min-h-[2.5rem]">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="mt-auto">
                        <span className="text-xs text-slate-400 dark:text-slate-500 line-through block">{formatPrice(product.price)}</span>
                        <span className="text-base font-black text-emerald-700 dark:text-emerald-400 block mb-2">{formatPrice(finalPrice)}</span>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={addingId === product.id}
                          className={`w-full flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-sm transition-all border-2 border-emerald-600 ${
                            addingId === product.id
                              ? 'bg-emerald-600 text-white scale-95'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                          }`}
                        >
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

        {/* Active Filter Chips */}
        {(selectedCategory || showDiscountOnly) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedCategory && selectedCategoryName && (
              <button
                onClick={() => handleCategoryChange('')}
                className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-xl font-semibold border-2 border-emerald-300 dark:border-emerald-700 text-base"
              >
                {selectedCategoryName}
                <X className="w-5 h-5" />
              </button>
            )}
            {showDiscountOnly && (
              <button
                onClick={() => { setShowDiscountOnly(false); setAllProducts([]); window.history.replaceState({}, '', '/'); }}
                className="inline-flex items-center gap-2 px-5 py-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded-xl font-semibold border-2 border-red-300 dark:border-red-800 text-base"
              >
                Ofertas
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Categories Grid - Solo cuando NO hay categoría seleccionada y NO hay búsqueda */}
        {!selectedCategory && !searchTerm && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Categorías</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className="flex items-center gap-2 sm:gap-2.5 justify-center text-center px-2 sm:px-3 py-3 sm:py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all min-h-[52px] sm:min-h-[56px] leading-tight"
                >
                  <span className="text-emerald-600 flex-shrink-0">{categoryIcons[cat.slug] || <Package className="w-5 h-5" />}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
            {sortedCategories.length > 6 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="mt-3 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-base mx-auto min-h-[48px] px-3"
              >
                {showAllCategories ? 'Ver menos' : `Ver todas (${sortedCategories.length})`}
                <ChevronDown className={`w-5 h-5 transition-transform ${showAllCategories ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        )}

        {/* Product Count */}
        {products && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-base text-slate-500 dark:text-slate-400 font-medium">
              {searchTerm ? `Resultados para "${searchTerm}"` : showDiscountOnly ? 'Ofertas' : selectedCategoryName || 'Todos los productos'}
            </p>
            <span className="text-base text-slate-400 dark:text-slate-500">{products.total} productos</span>
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700 p-3 animate-pulse">
                <div className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-xl mb-3" />
                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded w-1/2 mb-3" />
                <div className="h-11 bg-slate-100 dark:bg-slate-700 rounded-xl" />
              </div>
            ))}
          </div>
        ) : allProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {allProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md transition-all"
                >
                  {/* Image */}
                  <Link href={`/producto/${product.slug}`} className="block">
                    <div className="aspect-square bg-slate-50 dark:bg-slate-800 relative overflow-hidden">
                      {product.image_url && !brokenImages.has(product.id) ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-contain p-2"
                          onError={() => setBrokenImages(prev => new Set(prev).add(product.id))}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                          <Package className="w-12 h-12" />
                        </div>
                      )}
                      {product.discount_percent && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-lg">
                          -{product.discount_percent}% OFF
                        </div>
                      )}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                          <span className="text-red-600 dark:text-red-400 font-bold text-base border-2 border-red-500 dark:border-red-700 px-3 py-1.5 rounded-2xl -rotate-6 bg-white dark:bg-slate-900">
                            AGOTADO
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-3 flex flex-col flex-1">
                    <Link href={`/producto/${product.slug}`}>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug line-clamp-2 mb-1 min-h-[2.5rem]">
                        {product.name}
                      </h3>
                    </Link>
                    {product.laboratory && (
                      <span className="text-sm text-slate-500 dark:text-slate-400 mb-2 truncate">{product.laboratory}</span>
                    )}

                    {/* Price */}
                    <div className="mt-auto">
                      {product.discount_percent ? (
                        <>
                          <span className="text-sm text-slate-400 dark:text-slate-500 line-through block">{formatPrice(product.price)}</span>
                          <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 block mb-2">
                            {formatPrice(discountedPrice(Number(product.price), product.discount_percent))}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 block mb-2">
                          {formatPrice(product.price)}
                        </span>
                      )}

                      {/* Add to Cart Button - Full width, grande */}
                      {product.stock > 0 ? (
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={addingId === product.id}
                          aria-label={`Agregar ${product.name} al carrito`}
                          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-base transition-all min-h-[56px] border-2 border-emerald-600 ${
                            addingId === product.id
                              ? 'bg-emerald-600 text-white scale-95'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95'
                          }`}
                        >
                          {addingId === product.id ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              <span>Agregar</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-center font-semibold text-base min-h-[56px] flex items-center justify-center">
                          Sin stock
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 rounded-2xl font-bold text-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all min-h-[56px] disabled:opacity-50"
                >
                  {isLoadingMore ? 'Cargando...' : 'Cargar más productos'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700 py-12 text-center px-6">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium mb-2">No se encontraron productos</p>
            {searchTerm && (
              <p className="text-slate-400 dark:text-slate-500 mb-5">
                ¿No encontraste <strong className="text-slate-600 dark:text-slate-300">&ldquo;{searchTerm}&rdquo;</strong>? Solicita un presupuesto y lo conseguimos para ti.
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {(selectedCategory || searchTerm) && (
                <button
                  onClick={() => { handleCategoryChange(''); setSearchInput(''); setSearchTerm(''); }}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline text-lg"
                >
                  Ver todos los productos
                </button>
              )}
              <a
                href={`https://wa.me/56993649604?text=${encodeURIComponent(`Hola! Busqué "${searchTerm || 'un producto'}" en su tienda y no lo encontré. ¿Pueden conseguirlo o darme un presupuesto? Gracias!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#25D366] text-white font-bold text-base hover:bg-[#1ebe5d] transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Solicitar presupuesto
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Cart Bar - Grande y siempre visible */}
      {cart && cart.item_count > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 p-3 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="flex gap-2">
            <Link
              href="/cotizacion"
              className="flex items-center gap-2 px-4 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold text-sm border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
            >
              <FileText className="w-5 h-5" />
              Cotizar
            </Link>
            <Link
              href="/carrito"
              className="flex flex-1 items-center justify-between bg-emerald-600 text-white rounded-2xl px-5 py-4 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-emerald-600 text-xs font-bold flex items-center justify-center rounded-full">
                    {cart.item_count}
                  </span>
                </div>
                <span className="font-bold text-lg">Ver carrito</span>
              </div>
              <span className="font-black text-xl">{formatPrice(cart.total)}</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Cotizar floating button when cart is empty */
        <div className="fixed bottom-4 right-4 z-40">
          <Link
            href="/cotizacion"
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold text-sm border-2 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <FileText className="w-5 h-5 text-emerald-600" />
            Cotizar
          </Link>
        </div>
      )}
    </div>
  );
}
