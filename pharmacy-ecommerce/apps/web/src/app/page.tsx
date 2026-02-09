'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { productApi, PaginatedProducts, Category, Product } from '@/lib/api';
import { Search, ShoppingCart, Check, X, ChevronUp, Package, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/format';

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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const ITEMS_PER_PAGE = 20;

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadCategories();
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
  }, [selectedCategory, searchTerm]);

  const loadCategories = async () => {
    try {
      const data = await productApi.listCategories();
      data.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectedCategoryName = categories.find(c => c.slug === selectedCategory)?.name;
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-all"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}

      {/* Search Bar - Siempre visible, grande */}
      <div className="bg-white px-4 py-3 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar medicamentos..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* Selected Category Chip */}
        {selectedCategory && selectedCategoryName && (
          <div className="mb-4">
            <button
              onClick={() => handleCategoryChange('')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-100 text-emerald-800 rounded-xl font-semibold border-2 border-emerald-300 text-base"
            >
              {selectedCategoryName}
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Categories Grid - Solo cuando NO hay categoría seleccionada y NO hay búsqueda */}
        {!selectedCategory && !searchTerm && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Categorias</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className="flex items-center justify-center text-center px-3 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 transition-all min-h-[48px] leading-tight"
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {categories.length > 8 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="mt-3 flex items-center gap-1 text-emerald-600 font-semibold text-sm mx-auto"
              >
                {showAllCategories ? 'Ver menos' : `Ver todas (${categories.length})`}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAllCategories ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        )}

        {/* Product Count */}
        {products && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              {searchTerm ? `Resultados para "${searchTerm}"` : selectedCategoryName || 'Todos los productos'}
            </p>
            <span className="text-sm text-slate-400">{products.total} productos</span>
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border-2 border-slate-100 p-3 animate-pulse">
                <div className="aspect-square bg-slate-100 rounded-xl mb-3" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-6 bg-slate-100 rounded w-1/2 mb-3" />
                <div className="h-11 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : allProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {allProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden flex flex-col hover:border-emerald-200 hover:shadow-md transition-all"
                >
                  {/* Image */}
                  <Link href={`/producto/${product.slug}`} className="block">
                    <div className="aspect-square bg-slate-50 relative overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center text-slate-300 ${product.image_url ? 'hidden' : ''}`}>
                        <Package className="w-12 h-12" />
                      </div>
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <span className="text-red-600 font-bold text-sm border-2 border-red-500 px-3 py-1.5 rounded-lg -rotate-6 bg-white">
                            AGOTADO
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-3 flex flex-col flex-1">
                    <Link href={`/producto/${product.slug}`}>
                      <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-1 min-h-[2.5rem]">
                        {product.name}
                      </h3>
                    </Link>
                    {product.laboratory && (
                      <span className="text-xs text-slate-400 mb-2 truncate">{product.laboratory}</span>
                    )}

                    {/* Price */}
                    <div className="mt-auto">
                      <span className="text-xl font-black text-emerald-700 block mb-2">
                        {formatPrice(product.price)}
                      </span>

                      {/* Add to Cart Button - Full width, grande */}
                      {product.stock > 0 ? (
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={addingId === product.id}
                          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all min-h-[44px] ${
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
                        <div className="w-full py-3 rounded-xl bg-slate-100 text-slate-400 text-center font-semibold text-sm">
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
                  className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-emerald-300 text-emerald-700 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all min-h-[56px] disabled:opacity-50"
                >
                  {isLoadingMore ? 'Cargando...' : 'Cargar mas productos'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-slate-100 py-16 text-center">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-500 font-medium">No se encontraron productos</p>
            {(selectedCategory || searchTerm) && (
              <button
                onClick={() => { setSelectedCategory(''); setSearchInput(''); setSearchTerm(''); }}
                className="mt-4 text-emerald-600 font-bold hover:underline text-lg"
              >
                Ver todos los productos
              </button>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Cart Bar - Grande y siempre visible */}
      {cart && cart.item_count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 p-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <Link
            href="/carrito"
            className="flex items-center justify-between bg-emerald-600 text-white rounded-2xl px-5 py-4 shadow-lg"
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
      )}
    </div>
  );
}
