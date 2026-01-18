'use client';

import { useEffect, useState, useCallback } from 'react';
import { productApi, PaginatedProducts, Category, Product } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, ShoppingCart, Filter, Sparkles, ChevronDown, LogIn, MapPin, Package } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/format';

export default function Home() {
  const [products, setProducts] = useState<PaginatedProducts | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const { addToCartLocal, cart } = useCartStore();
  const { user } = useAuthStore();
  const [addingId, setAddingId] = useState<string | null>(null);
  
  const mapsUrl = "https://www.google.com/maps/place/Tu+Farmacia/@-29.9574998,-71.3444193,17z";

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, currentPage, sortBy, searchTerm, itemsPerPage]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchTerm(searchInput);
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadCategories = async () => {
    try {
      const data = await productApi.listCategories();
      data.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await productApi.list({
        category: selectedCategory || undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage,
        sort_by: sortBy || undefined,
      });
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    setAddingId(product.id);
    await addToCartLocal(product.id);
    setTimeout(() => setAddingId(null), 500);
  };

  const getPageNumbers = useCallback(() => {
    if (!products) return [];
    const totalPages = products.total_pages;
    const current = currentPage;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (current >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
      }
    }
    return pages;
  }, [products, currentPage]);

  const showingStart = products ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const showingEnd = products ? Math.min(currentPage * itemsPerPage, products.total) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Modern Glass Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo Area + Dirección */}
            <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer group" onClick={() => {setSelectedCategory(''); setSearchInput('');}}>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-900 leading-tight">
                  Tu Farmacia
                </span>
                <a 
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-600 transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Jose Santiago Aldunate 1535, Coquimbo</span>
                </a>
              </div>
            </div>
            
            {/* Search Bar - Capsule Style */}
            <div className="flex-1 max-w-xl mx-auto hidden md:block">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar medicamentos, productos..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="block w-full pl-11 pr-4 py-2.5 bg-slate-100/50 border border-slate-200 rounded-full text-sm text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-300 transition-all duration-200"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Login Button */}
              {!user && (
                <Link 
                  href="/auth/login" 
                  className="flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold py-2.5 px-5 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                  <span className="sm:hidden">Entrar</span>
                </Link>
              )}
              
              {user && (
                <Link 
                  href="/admin/productos" 
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </span>
                  <span className="hidden sm:inline">{user.name?.split(' ')[0]}</span>
                </Link>
              )}

              {/* Cart Button */}
              <Link href="/carrito" className="relative p-3 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-colors group border border-slate-200 hover:border-emerald-300">
                <ShoppingCart className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                {cart && cart.item_count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-md border-2 border-white">
                    {cart.item_count}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Search (visible only on mobile) */}
      <div className="sm:hidden px-4 py-3 bg-white border-b border-slate-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <div className="relative min-w-[200px]">
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="appearance-none w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
              >
                <option value="">Todos los laboratorios</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative min-w-[160px]">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="appearance-none w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
              >
                <option value="name">Nombre A-Z</option>
                <option value="name_desc">Nombre Z-A</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="stock_desc">Mayor stock</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            
            <div className="relative min-w-[120px]">
               <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="appearance-none w-full pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
              >
                <option value={25}>25 items</option>
                <option value={50}>50 items</option>
                <option value={100}>100 items</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {products && (
             <div className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm whitespace-nowrap">
               {products.total.toLocaleString()} productos encontrados
             </div>
          )}
        </div>

        {/* Minimalist Data Table */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-4 pl-6 pr-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Producto</th>
                  <th className="text-left py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Laboratorio</th>
                  <th className="text-right py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Precio</th>
                  <th className="text-center py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Estado</th>
                  <th className="text-right py-4 pl-4 pr-6 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 pl-6"><div className="h-4 bg-slate-100 rounded w-48" /></td>
                      <td className="hidden md:table-cell px-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                      <td className="px-4"><div className="h-4 bg-slate-100 rounded w-16 ml-auto" /></td>
                      <td className="hidden sm:table-cell px-4"><div className="h-4 bg-slate-100 rounded w-12 mx-auto" /></td>
                      <td className="pr-6"><div className="h-8 bg-slate-100 rounded-lg w-full" /></td>
                    </tr>
                  ))
                ) : products && products.products.length > 0 ? (
                  products.products.map((product) => (
                    <tr key={product.id} className="group hover:bg-slate-50/80 transition-colors duration-150">
                      <td className="py-3.5 pl-6 pr-4">
                        <Link href={`/producto/${product.slug}`} className="flex items-center gap-3">
                          <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center text-slate-400 ${product.image_url ? 'hidden' : ''}`}>
                              <Package className="w-5 h-5" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-600 transition-colors line-clamp-2">
                              {product.name}
                            </span>
                            <span className="md:hidden block text-xs text-slate-400 mt-0.5">
                              {product.laboratory || product.category_name}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                          {product.laboratory || product.category_name || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-bold text-slate-800 tracking-tight">
                          {formatPrice(product.price)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                           <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 5 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                           <span className={`text-xs font-medium ${product.stock > 0 ? 'text-slate-600' : 'text-red-500'}`}>
                             {product.stock > 0 ? `${product.stock} un.` : 'Agotado'}
                           </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 pr-6 text-right">
                        {product.stock > 0 && (
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={addingId === product.id}
                            className={`
                              inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200
                              ${addingId === product.id 
                                ? 'bg-emerald-600 text-white shadow-inner scale-95' 
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 hover:shadow-sm'
                              }
                            `}
                          >
                            {addingId === product.id ? 'Agregado' : 'Agregar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Search className="w-8 h-8 mb-3 opacity-50" />
                        <p className="text-sm">No se encontraron productos que coincidan.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          {products && products.total_pages > 1 && (
            <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-slate-400 hidden sm:inline-block">
                 Pagina {currentPage} de {products.total_pages}
              </span>
              <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1 px-2">
                   {getPageNumbers().map((page, idx) => (
                    typeof page === 'number' ? (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                          currentPage === page
                            ? 'bg-white text-emerald-600 shadow-sm border border-slate-200'
                            : 'text-slate-500 hover:bg-white/50'
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={idx} className="text-slate-300 text-xs">...</span>
                    )
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(products.total_pages, p + 1))}
                  disabled={currentPage === products.total_pages}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
