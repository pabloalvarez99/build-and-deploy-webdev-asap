'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { productApi, PaginatedProducts, Category } from '@/lib/api';
import { Plus, Edit, Trash2, ArrowLeft, Search, Download, ChevronLeft, ChevronRight, CheckSquare, Square, Power, PowerOff, AlertTriangle } from 'lucide-react';
import { formatPrice } from '@/lib/format';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [products, setProducts] = useState<PaginatedProducts | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  
  // Selection for bulk actions
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    image_url: '',
    laboratory: '',
    active: true,
  });

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) {
      router.push('/');
      return;
    }
    loadCategories();
  }, [token, user, router]);

  useEffect(() => {
    // Check URL params for filters
    const urlParams = new URLSearchParams(window.location.search);
    const urlStock = urlParams.get('stock');
    const urlSearch = urlParams.get('search');
    if (urlStock === 'low') setStockFilter('low');
    if (urlSearch) setSearchTerm(urlSearch);
  }, []);

  useEffect(() => {
    if (token) {
      loadProducts();
    }
  }, [token, currentPage, searchTerm, selectedCategory, sortBy, stockFilter]);

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
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await productApi.list({
        page: currentPage,
        limit: 20,
        active_only: false,
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
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
    setCurrentPage(1);
    loadProducts();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const data = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        price: formData.price,
        stock: parseInt(formData.stock),
        category_id: formData.category_id || undefined,
        image_url: formData.image_url || undefined,
        laboratory: formData.laboratory || undefined,
        active: formData.active,
      };

      if (editingProduct) {
        await productApi.update(token, editingProduct, data);
      } else {
        await productApi.create(token, data);
      }

      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto');
    }
  };

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price,
      stock: String(product.stock),
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      laboratory: product.laboratory || '',
      active: product.active ?? true,
    });
    setEditingProduct(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Estas seguro de eliminar este producto?')) return;

    try {
      await productApi.delete(token, id);
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      stock: '',
      category_id: '',
      image_url: '',
      laboratory: '',
      active: true,
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const exportToCSV = () => {
    if (!products) return;

    const headers = ['Nombre', 'Slug', 'Precio', 'Stock', 'Categoria', 'Laboratorio', 'Estado'];
    const rows = products.products.map(p => [
      p.name,
      p.slug,
      p.price,
      p.stock,
      p.category_name || '',
      p.laboratory || '',
      p.active ? 'Activo' : 'Inactivo'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `productos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortBy('');
    setStockFilter('');
    setCurrentPage(1);
    // Clear URL params
    window.history.replaceState({}, '', '/admin/productos');
  };

  // Selection helpers
  const toggleSelectProduct = (id: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedProducts(newSelection);
  };

  const selectAllOnPage = () => {
    if (!products) return;
    const allIds = products.products.map(p => p.id);
    const allSelected = allIds.every(id => selectedProducts.has(id));
    
    if (allSelected) {
      // Deselect all
      const newSelection = new Set(selectedProducts);
      allIds.forEach(id => newSelection.delete(id));
      setSelectedProducts(newSelection);
    } else {
      // Select all
      const newSelection = new Set(selectedProducts);
      allIds.forEach(id => newSelection.add(id));
      setSelectedProducts(newSelection);
    }
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
  };

  // Bulk actions
  const handleBulkActivate = async (activate: boolean) => {
    if (!token || selectedProducts.size === 0) return;
    
    const action = activate ? 'activar' : 'desactivar';
    if (!confirm(`¿Deseas ${action} ${selectedProducts.size} productos?`)) return;

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedProducts).map(id =>
        productApi.update(token, id, { active: activate })
      );
      await Promise.all(promises);
      clearSelection();
      loadProducts();
    } catch (error) {
      console.error('Error en acción masiva:', error);
      alert('Error al realizar la acción');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!token || selectedProducts.size === 0) return;
    
    if (!confirm(`¿Deseas ELIMINAR ${selectedProducts.size} productos? Esta acción no se puede deshacer.`)) return;

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedProducts).map(id =>
        productApi.delete(token, id)
      );
      await Promise.all(promises);
      clearSelection();
      loadProducts();
    } catch (error) {
      console.error('Error eliminando productos:', error);
      alert('Error al eliminar productos');
    } finally {
      setBulkActionLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  const showingStart = products ? (currentPage - 1) * 20 + 1 : 0;
  const showingEnd = products ? Math.min(currentPage * 20, products.total) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Volver al panel
      </Link>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exportar CSV
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingProduct(null);
              setShowForm(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </form>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="input py-2 px-3 min-w-[180px]"
          >
            <option value="">Todas las categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setSortBy(e.target.value === 'low' ? 'stock_asc' : sortBy);
              setCurrentPage(1);
            }}
            className={`input py-2 px-3 min-w-[140px] ${stockFilter === 'low' ? 'border-orange-400 bg-orange-50' : ''}`}
          >
            <option value="">Todo el stock</option>
            <option value="low">⚠️ Stock bajo</option>
            <option value="out">🔴 Agotados</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="input py-2 px-3 min-w-[160px]"
          >
            <option value="">Mas recientes</option>
            <option value="name">Nombre A-Z</option>
            <option value="price_asc">Precio menor</option>
            <option value="price_desc">Precio mayor</option>
            <option value="stock_asc">Menor stock</option>
            <option value="stock_desc">Mayor stock</option>
          </select>

          {(searchTerm || selectedCategory || sortBy || stockFilter) && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.size > 0 && (
        <div className="card p-4 mb-4 bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-medium text-emerald-800">
              {selectedProducts.size} producto{selectedProducts.size > 1 ? 's' : ''} seleccionado{selectedProducts.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={clearSelection}
              className="text-sm text-emerald-600 hover:text-emerald-800 underline"
            >
              Limpiar selección
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkActivate(true)}
              disabled={bulkActionLoading}
              className="btn btn-secondary flex items-center gap-2 text-sm py-2"
            >
              <Power className="w-4 h-4" />
              Activar
            </button>
            <button
              onClick={() => handleBulkActivate(false)}
              disabled={bulkActionLoading}
              className="btn btn-secondary flex items-center gap-2 text-sm py-2"
            >
              <PowerOff className="w-4 h-4" />
              Desactivar
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
              className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 text-sm py-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      {products && (
        <div className="text-sm text-gray-500 mb-4">
          Mostrando {showingStart}-{showingEnd} de {products.total.toLocaleString('es-CL')} productos
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: editingProduct ? formData.slug : generateSlug(e.target.value),
                    });
                  }}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio (CLP)</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="input"
                >
                  <option value="">Sin categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="h-20 w-20 object-cover rounded border"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
                <input
                  type="text"
                  value={formData.laboratory}
                  onChange={(e) => setFormData({ ...formData, laboratory: e.target.value })}
                  className="input"
                  placeholder="Ej: SAVAL, RECALCINE..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Producto activo (visible en tienda)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      {isLoading ? (
        <div className="card p-6 animate-pulse">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      ) : products && products.products.length > 0 ? (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-center w-10">
                      <button
                        onClick={selectAllOnPage}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Seleccionar todos"
                      >
                        {products?.products.every(p => selectedProducts.has(p.id)) ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Laboratorio</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.products
                    .filter(p => {
                      if (stockFilter === 'low') return p.stock > 0 && p.stock <= 10;
                      if (stockFilter === 'out') return p.stock === 0;
                      return true;
                    })
                    .map((product) => (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-gray-50 ${selectedProducts.has(product.id) ? 'bg-emerald-50' : ''} ${product.stock === 0 ? 'bg-red-50/50' : product.stock <= 10 ? 'bg-orange-50/50' : ''}`}
                    >
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleSelectProduct(product.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {selectedProducts.has(product.id) ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {product.stock === 0 && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500" title="Agotado" />
                          )}
                          {product.stock > 0 && product.stock <= 10 && (
                            <AlertTriangle className="flex-shrink-0 w-4 h-4 text-orange-500" title="Stock bajo" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{product.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[150px]">
                        {product.laboratory || '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-0.5 rounded-full text-sm font-bold ${
                          product.stock === 0 ? 'bg-red-100 text-red-700' :
                          product.stock <= 10 ? 'bg-orange-100 text-orange-700' : 'text-gray-900'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[120px]">
                        {product.category_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-gray-600 hover:text-primary-600"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-600 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {products.total_pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 text-gray-600">
                Pagina {currentPage} de {products.total_pages}
              </span>
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
        <div className="card p-12 text-center">
          <p className="text-gray-500 mb-4">No se encontraron productos</p>
          {(searchTerm || selectedCategory) && (
            <button onClick={clearFilters} className="btn btn-secondary">
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
