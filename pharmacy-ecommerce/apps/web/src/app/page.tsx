'use client';

import { useEffect, useState, useCallback } from 'react';
import { productApi, PaginatedProducts, Category, Product } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, ShoppingCart, Package } from 'lucide-react';
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
  const { addToCartLocal } = useCartStore();

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
    await addToCartLocal(product.id);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Package className="w-8 h-8 text-emerald-600" />
              <span className="text-xl font-semibold text-gray-900">Tu Farmacia</span>
            </Link>
            
            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <Link href="/carrito" className="p-2 hover:bg-gray-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-gray-600" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todos los laboratorios</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="name">Nombre A-Z</option>
            <option value="name_desc">Nombre Z-A</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="stock_desc">Mayor stock</option>
          </select>

          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>

          {products && (
            <span className="text-sm text-gray-500 ml-auto">
              {showingStart.toLocaleString()}-{showingEnd.toLocaleString()} de {products.total.toLocaleString()} productos
            </span>
          )}
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Producto</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Laboratorio</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Precio</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Stock</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-4 py-3 text-right"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div></td>
                    <td className="px-4 py-3"><div className="h-8 bg-gray-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : products && products.products.length > 0 ? (
                products.products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/producto/${product.slug}`} className="group">
                        <span className="text-sm font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
                          {product.name}
                        </span>
                        <span className="block text-xs text-gray-400 md:hidden mt-0.5">
                          {product.laboratory || product.category_name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-500">
                        {product.laboratory || product.category_name || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {product.stock > 0 ? (
                        <span className={`text-sm ${product.stock < 5 ? 'text-amber-600' : 'text-gray-600'}`}>
                          {product.stock}
                        </span>
                      ) : (
                        <span className="text-xs text-red-500 font-medium">Agotado</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {product.stock > 0 ? (
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Agregar</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {products && products.total_pages > 1 && (
          <div className="flex justify-center items-center gap-1 mt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((page, idx) => (
              typeof page === 'number' ? (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[36px] h-9 text-sm rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-emerald-600 text-white'
                      : 'border border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={idx} className="px-2 text-gray-400">...</span>
              )
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(products.total_pages, p + 1))}
              disabled={currentPage === products.total_pages}
              className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
