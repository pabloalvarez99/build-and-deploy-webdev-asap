'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { productApi, PaginatedProducts, Category } from '@/lib/api';
import { Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState<PaginatedProducts | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, currentPage, sortBy, searchTerm]);

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
      // Sort categories by name
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
        limit: 12,
        sort_by: sortBy || undefined,
      });
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchInput('');
    setSearchTerm('');
    setSortBy('');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedCategory || searchTerm || sortBy;

  // Generate page numbers for pagination
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

  // Calculate showing range
  const showingStart = products ? (currentPage - 1) * 12 + 1 : 0;
  const showingEnd = products ? Math.min(currentPage * 12, products.total) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Bienvenido a Tu Farmacia
        </h1>
        <p className="text-primary-100 text-lg mb-6">
          Medicamentos, salud y belleza con despacho a todo Chile.
        </p>
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input pl-10 text-gray-900"
            />
          </div>
          <button type="submit" className="btn bg-white text-primary-600 hover:bg-primary-50">
            Buscar
          </button>
        </form>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filtros:</span>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="input py-2 px-3 min-w-[200px]"
          >
            <option value="">Todas las categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="input py-2 px-3 min-w-[180px]"
          >
            <option value="">Mas recientes</option>
            <option value="name">Nombre A-Z</option>
            <option value="name_desc">Nombre Z-A</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="stock_desc">Mayor stock</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Filtros activos:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                Busqueda: "{searchTerm}"
                <button onClick={() => { setSearchInput(''); setSearchTerm(''); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                {categories.find(c => c.slug === selectedCategory)?.name}
                <button onClick={() => setSelectedCategory('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {sortBy && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                Ordenado por: {
                  sortBy === 'name' ? 'Nombre A-Z' :
                  sortBy === 'name_desc' ? 'Nombre Z-A' :
                  sortBy === 'price_asc' ? 'Precio menor' :
                  sortBy === 'price_desc' ? 'Precio mayor' :
                  sortBy === 'stock_desc' ? 'Mayor stock' : sortBy
                }
                <button onClick={() => setSortBy('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      {products && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            Mostrando <span className="font-medium">{showingStart}-{showingEnd}</span> de{' '}
            <span className="font-medium">{products.total.toLocaleString('es-CL')}</span> productos
          </p>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-20" />
                  <div className="h-10 bg-gray-200 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : products && products.products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Improved Pagination */}
          {products.total_pages > 1 && (
            <div className="flex justify-center items-center gap-1 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {getPageNumbers().map((page, idx) => (
                typeof page === 'number' ? (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[40px] h-10 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
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
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No se encontraron productos</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn btn-secondary">
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
