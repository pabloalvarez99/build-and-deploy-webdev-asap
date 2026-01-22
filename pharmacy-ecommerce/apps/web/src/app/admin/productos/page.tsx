'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { productApi, PaginatedProducts, Category } from '@/lib/api';
import { Plus, Edit, Trash2, Search, Download, ChevronLeft, ChevronRight, CheckSquare, Square, Power, PowerOff, AlertTriangle, Copy, Filter, X } from 'lucide-react';
import { formatPrice } from '@/lib/format';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [products, setProducts] = useState<PaginatedProducts | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [laboratories, setLaboratories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Selection for bulk actions
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLaboratory, setSelectedLaboratory] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [labSearchTerm, setLabSearchTerm] = useState('');

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
    therapeutic_action: '',
    active_ingredient: '',
    prescription_type: 'direct' as 'direct' | 'prescription' | 'retained',
    presentation: '',
    active: true,
  });

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) {
      router.push('/');
      return;
    }
    loadCategories();
    loadLaboratories();
  }, [token, user, router]);

  useEffect(() => {
    // Check URL params for filters and actions
    const urlParams = new URLSearchParams(window.location.search);
    const urlStock = urlParams.get('stock');
    const urlSearch = urlParams.get('search');
    const urlAction = urlParams.get('action');
    if (urlStock === 'low') setStockFilter('low');
    if (urlStock === 'out') setStockFilter('out');
    if (urlSearch) setSearchTerm(urlSearch);
    if (urlAction === 'new') {
      resetForm();
      setEditingProduct(null);
      setShowForm(true);
      // Clear action param from URL
      window.history.replaceState({}, '', '/admin/productos');
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadProducts();
    }
  }, [token, currentPage, searchTerm, selectedCategory, selectedLaboratory, selectedPrescription, sortBy, stockFilter]);

  const loadCategories = async () => {
    try {
      const data = await productApi.listCategories();
      data.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadLaboratories = async () => {
    try {
      const data = await productApi.getLaboratories();
      setLaboratories(data.laboratories || []);
    } catch (error) {
      console.error('Error loading laboratories:', error);
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
        laboratory: selectedLaboratory || undefined,
        prescription_type: selectedPrescription || undefined,
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
        therapeutic_action: formData.therapeutic_action || undefined,
        active_ingredient: formData.active_ingredient || undefined,
        prescription_type: formData.prescription_type,
        presentation: formData.presentation || undefined,
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
      loadLaboratories(); // Refresh labs list if a new one was added
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
      therapeutic_action: product.therapeutic_action || '',
      active_ingredient: product.active_ingredient || '',
      prescription_type: product.prescription_type || 'direct',
      presentation: product.presentation || '',
      active: product.active ?? true,
    });
    setEditingProduct(product.id);
    setShowForm(true);
  };

  const handleDuplicate = (product: any) => {
    const newSlug = generateSlug(product.name + ' copia');
    setFormData({
      name: product.name + ' (copia)',
      slug: newSlug,
      description: product.description || '',
      price: product.price,
      stock: String(product.stock),
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      laboratory: product.laboratory || '',
      therapeutic_action: product.therapeutic_action || '',
      active_ingredient: product.active_ingredient || '',
      prescription_type: product.prescription_type || 'direct',
      presentation: product.presentation || '',
      active: false, // Start as inactive
    });
    setEditingProduct(null); // This is a new product
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
      therapeutic_action: '',
      active_ingredient: '',
      prescription_type: 'direct',
      presentation: '',
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

    const headers = ['Nombre', 'Slug', 'Precio', 'Stock', 'Categoria', 'Laboratorio', 'Accion Terapeutica', 'Principio Activo', 'Tipo Venta', 'Presentacion', 'Estado'];
    const prescriptionLabels: Record<string, string> = {
      direct: 'Venta Directa',
      prescription: 'Receta Medica',
      retained: 'Receta Retenida'
    };
    const rows = products.products.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.slug,
      p.price,
      p.stock,
      p.category_name || '',
      p.laboratory || '',
      (p as any).therapeutic_action || '',
      (p as any).active_ingredient || '',
      prescriptionLabels[(p as any).prescription_type] || 'Venta Directa',
      (p as any).presentation || '',
      p.active ? 'Activo' : 'Inactivo'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `productos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLaboratory('');
    setSelectedPrescription('');
    setSortBy('');
    setStockFilter('');
    setLabSearchTerm('');
    setCurrentPage(1);
    // Clear URL params
    window.history.replaceState({}, '', '/admin/productos');
  };

  // Count active filters
  const activeFilterCount = [selectedCategory, selectedLaboratory, selectedPrescription, stockFilter].filter(Boolean).length;

  // Filter laboratories by search term
  const filteredLaboratories = laboratories.filter(lab =>
    lab.toLowerCase().includes(labSearchTerm.toLowerCase())
  );

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
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Productos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestiona el catalogo de productos
          </p>
        </div>
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
            <option value="low">Stock bajo</option>
            <option value="out">Agotados</option>
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

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`btn ${showAdvancedFilters ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-white text-emerald-600 rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {(searchTerm || selectedCategory || selectedLaboratory || selectedPrescription || sortBy || stockFilter) && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar todo
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Laboratory Filter with Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar laboratorio..."
                    value={labSearchTerm}
                    onChange={(e) => setLabSearchTerm(e.target.value)}
                    className="input py-2 px-3 w-full text-sm mb-2"
                  />
                  <select
                    value={selectedLaboratory}
                    onChange={(e) => {
                      setSelectedLaboratory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="input py-2 px-3 w-full"
                    size={5}
                  >
                    <option value="">Todos los laboratorios</option>
                    {filteredLaboratories.map((lab) => (
                      <option key={lab} value={lab}>
                        {lab}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedLaboratory && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded flex items-center gap-1">
                      {selectedLaboratory}
                      <button onClick={() => setSelectedLaboratory('')} className="hover:text-emerald-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                )}
              </div>

              {/* Prescription Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Venta</label>
                <select
                  value={selectedPrescription}
                  onChange={(e) => {
                    setSelectedPrescription(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input py-2 px-3 w-full"
                >
                  <option value="">Todos los tipos</option>
                  <option value="direct">Venta Directa</option>
                  <option value="prescription">Receta Medica</option>
                  <option value="retained">Receta Retenida</option>
                </select>
                <div className="mt-2 text-xs text-gray-500">
                  <p><span className="font-medium">Directa:</span> Sin receta</p>
                  <p><span className="font-medium">Medica:</span> Requiere receta</p>
                  <p><span className="font-medium">Retenida:</span> Controlados</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resumen</label>
                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                  <p><span className="font-medium">{products?.total.toLocaleString('es-CL') || 0}</span> productos encontrados</p>
                  <p><span className="font-medium">{laboratories.length}</span> laboratorios</p>
                  <p><span className="font-medium">{categories.length}</span> categorias</p>
                </div>
              </div>
            </div>
          </div>
        )}
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
                  list="laboratories-list"
                />
                <datalist id="laboratories-list">
                  {laboratories.map((lab) => (
                    <option key={lab} value={lab} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Accion Terapeutica</label>
                  <input
                    type="text"
                    value={formData.therapeutic_action}
                    onChange={(e) => setFormData({ ...formData, therapeutic_action: e.target.value })}
                    className="input"
                    placeholder="Ej: ANALGESICO, HIPOTENSOR..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Principio Activo</label>
                  <input
                    type="text"
                    value={formData.active_ingredient}
                    onChange={(e) => setFormData({ ...formData, active_ingredient: e.target.value })}
                    className="input"
                    placeholder="Ej: PARACETAMOL, IBUPROFENO..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Venta</label>
                  <select
                    value={formData.prescription_type}
                    onChange={(e) => setFormData({ ...formData, prescription_type: e.target.value as 'direct' | 'prescription' | 'retained' })}
                    className="input"
                  >
                    <option value="direct">Venta Directa</option>
                    <option value="prescription">Receta Medica</option>
                    <option value="retained">Receta Retenida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Presentacion</label>
                  <input
                    type="text"
                    value={formData.presentation}
                    onChange={(e) => setFormData({ ...formData, presentation: e.target.value })}
                    className="input"
                    placeholder="Ej: COMPRIMIDO, JARABE..."
                  />
                </div>
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
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt=""
                              className="w-10 h-10 object-contain rounded bg-white border border-gray-100"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shrink-0">
                              <span className="text-[10px] text-gray-400">Sin img</span>
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              {product.stock === 0 && (
                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500" title="Agotado" />
                              )}
                              {product.stock > 0 && product.stock <= 10 && (
                                <span title="Stock bajo">
                                  <AlertTriangle className="flex-shrink-0 w-4 h-4 text-orange-500" />
                                </span>
                              )}
                              <span className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</span>
                              {(product as any).prescription_type === 'prescription' && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded" title="Receta Medica">
                                  RX
                                </span>
                              )}
                              {(product as any).prescription_type === 'retained' && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-medium rounded" title="Receta Retenida">
                                  RR
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 truncate max-w-[150px]">{product.slug}</span>
                              {(product as any).therapeutic_action && (
                                <span className="text-xs text-emerald-600 truncate max-w-[100px]" title={(product as any).therapeutic_action}>
                                  {(product as any).therapeutic_action}
                                </span>
                              )}
                            </div>
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
                          onClick={() => handleDuplicate(product)}
                          className="p-2 text-gray-600 hover:text-blue-600"
                          title="Duplicar"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
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
