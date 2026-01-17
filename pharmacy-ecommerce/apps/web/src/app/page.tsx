'use client';

import { useEffect, useState, useCallback } from 'react';
import { productApi, PaginatedProducts, Category, Product } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, ShoppingCart, Filter, Sparkles, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
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
  const [addingId, setAddingId] = useState<string | null>(null);

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
    <div className="min-h-screen bg-background text-slate-200 selection:bg-primary-500/20">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-20" />
      
      {/* Background Gradient similar to reference */}
      <div className="fixed inset-0 bg-gradient-to-tr from-primary-900/10 via-background to-background pointer-events-none z-[-1]" />
      
      {/* Hero Section */}
      <div className="relative pt-12 pb-8 sm:pt-16 sm:pb-12 border-b border-white/5 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-medium mb-6">
            <Sparkles className="w-3 h-3" />
            <span>La revolución en salud</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            Tu Farmacia <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Digital</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Encuentra todos tus medicamentos y productos de bienestar con la rapidez y confianza que mereces.
          </p>
          
          {/* Main Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar medicamentos, productos, laboratorios..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 bg-surface/50 border border-white/10 rounded-2xl text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-surface transition-all duration-200 shadow-xl shadow-black/20"
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <div className="relative min-w-[200px]">
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="appearance-none w-full pl-4 pr-10 py-2.5 bg-surface border border-white/10 rounded-xl text-sm font-medium text-slate-300 hover:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all cursor-pointer"
              >
                <option value="">Todos los laboratorios</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            <div className="relative min-w-[160px]">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="appearance-none w-full pl-4 pr-10 py-2.5 bg-surface border border-white/10 rounded-xl text-sm font-medium text-slate-300 hover:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all cursor-pointer"
              >
                <option value="name">Nombre A-Z</option>
                <option value="name_desc">Nombre Z-A</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="stock_desc">Mayor stock</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
            
            <div className="relative min-w-[120px]">
               <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="appearance-none w-full pl-4 pr-8 py-2.5 bg-surface border border-white/10 rounded-xl text-sm font-medium text-slate-300 hover:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all cursor-pointer"
              >
                <option value={25}>25 items</option>
                <option value={50}>50 items</option>
                <option value={100}>100 items</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {products && (
             <div className="text-xs font-medium text-slate-400 bg-surface/50 px-3 py-1.5 rounded-full border border-white/5 whitespace-nowrap">
               {products.total.toLocaleString()} productos encontrados
             </div>
          )}
        </div>

        {/* Minimalist Data Table */}
        <div className="bg-surface/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-2xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left py-4 pl-6 pr-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                  <th className="text-left py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Laboratorio</th>
                  <th className="text-right py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Precio</th>
                  <th className="text-center py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Estado</th>
                  <th className="text-right py-4 pl-4 pr-6 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 pl-6"><div className="h-4 bg-white/5 rounded w-48" /></td>
                      <td className="hidden md:table-cell px-4"><div className="h-4 bg-white/5 rounded w-24" /></td>
                      <td className="px-4"><div className="h-4 bg-white/5 rounded w-16 ml-auto" /></td>
                      <td className="hidden sm:table-cell px-4"><div className="h-4 bg-white/5 rounded w-12 mx-auto" /></td>
                      <td className="pr-6"><div className="h-8 bg-white/5 rounded-lg w-full" /></td>
                    </tr>
                  ))
                ) : products && products.products.length > 0 ? (
                  products.products.map((product) => (
                    <tr key={product.id} className="group hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="py-3.5 pl-6 pr-4">
                        <Link href={`/producto/${product.slug}`} className="block">
                          <span className="text-sm font-semibold text-slate-200 group-hover:text-primary-400 transition-colors">
                            {product.name}
                          </span>
                          <span className="md:hidden block text-xs text-slate-500 mt-0.5">
                            {product.laboratory || product.category_name}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-slate-400 border border-white/5">
                          {product.laboratory || product.category_name || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-bold text-white tracking-tight">
                          {formatPrice(product.price)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                           <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 5 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                           <span className={`text-xs font-medium ${product.stock > 0 ? 'text-slate-400' : 'text-red-400'}`}>
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
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20 scale-95' 
                                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20'
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
                      <div className="flex flex-col items-center justify-center text-slate-500">
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
            <div className="border-t border-white/5 bg-white/[0.01] px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-slate-500 hidden sm:inline-block">
                 Pagina {currentPage} de {products.total_pages}
              </span>
              <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
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
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                            : 'text-slate-500 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={idx} className="text-slate-600 text-xs">...</span>
                    )
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(products.total_pages, p + 1))}
                  disabled={currentPage === products.total_pages}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
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
