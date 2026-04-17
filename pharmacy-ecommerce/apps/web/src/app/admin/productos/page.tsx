'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth';
import { productApi, PaginatedProducts, Category } from '@/lib/api';
import { Plus, Edit, Trash2, Search, Download, Upload, ChevronLeft, ChevronRight, CheckSquare, Square, Power, PowerOff, AlertTriangle, Copy, Filter, X, Package, FileSpreadsheet, CheckCircle, XCircle, RefreshCw, ArrowRight, History, ArrowUp, ArrowDown, ArrowUpDown, Camera } from 'lucide-react';
import { parseExcelFile, diffProducts, loadAllProductsForDiff, parsePrice, type ExcelRow, type DiffResult } from '@/lib/excel-import';
import { StockModal } from '@/components/admin/StockModal';
import { ScanInvoiceModal } from '@/components/admin/ScanInvoiceModal';
import type { ScannedProductData } from '@/lib/invoice-parser/types';
import { formatPrice } from '@/lib/format';

export default function AdminProductsPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const { user } = useAuthStore();

 const [products, setProducts] = useState<PaginatedProducts | null>(null);
 const [categories, setCategories] = useState<Category[]>([]);
 const [laboratories, setLaboratories] = useState<string[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [currentPage, setCurrentPage] = useState(1);
 // ?action=new opens the create form immediately (keyboard shortcut ⌘N)
 const [showForm, setShowForm] = useState(() => searchParams.get('action') === 'new');
 const [editingProduct, setEditingProduct] = useState<string | null>(null);
 const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

 // Selection for bulk actions
 const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
 const [bulkActionLoading, setBulkActionLoading] = useState(false);

 // Filters — initialize from URL params so external links (dashboard, NotificationBell) land with filters pre-applied
 const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
 const [selectedCategory, setSelectedCategory] = useState('');
 const [selectedLaboratory, setSelectedLaboratory] = useState('');
 const [selectedPrescription, setSelectedPrescription] = useState('');
 const [sortBy, setSortBy] = useState('');
 // ?stock=out|low|in pre-selects the stock filter (linked from NotificationBell)
 const [stockFilter, setStockFilter] = useState(() => {
  const s = searchParams.get('stock');
  return s === 'low' || s === 'out' || s === 'in' ? s : '';
 });
 const [minPrice, setMinPrice] = useState('');
 const [maxPrice, setMaxPrice] = useState('');
 const [noImage, setNoImage] = useState(false);
 const [hasDiscount, setHasDiscount] = useState(false);
 const [noExternalId, setNoExternalId] = useState(false);
 const [noBarcode, setNoBarcode] = useState(false);

 // Data completeness stats (loaded once on mount)
 const [productStats, setProductStats] = useState<{
  total: number; noImage: number; noExternalId: number; noBarcode: number; outOfStock: number; lowStock: number;
 } | null>(null);

 const handleColumnSort = (field: string) => {
  const isActive = sortBy === `${field}_asc` || sortBy === `${field}_desc` || (field === 'name' && (sortBy === 'name' || sortBy === 'name_asc'));
  const isAsc = sortBy === `${field}_asc` || sortBy === 'name';
  setSortBy(isActive && isAsc ? `${field}_desc` : `${field}_asc`);
  setCurrentPage(1);
 };

 const getSortIcon = (field: string) => {
  const isActive = sortBy === `${field}_asc` || sortBy === `${field}_desc` || (field === 'name' && (sortBy === 'name' || sortBy === 'name_asc'));
  if (!isActive) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-60" />;
  const isAsc = sortBy === `${field}_asc` || sortBy === 'name';
  return isAsc ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />;
 };
 const [labSearchTerm, setLabSearchTerm] = useState('');

 // Scan invoice state
 const [showScanModal, setShowScanModal] = useState(false);

 // Import state
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [showImportModal, setShowImportModal] = useState(false);
 const [importStep, setImportStep] = useState<'upload' | 'preview' | 'importing' | 'results'>('upload');
 const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [diffResults, setDiffResults] = useState<DiffResult | null>(null);
 const [importResults, setImportResults] = useState<{ success: boolean; inserted: number; updated: number; errors?: string[] } | null>(null);
 const [importLoading, setImportLoading] = useState(false);
 const [parseErrors, setParseErrors] = useState<string[]>([]);

 // Stock inline editing
 const [editingStockId, setEditingStockId] = useState<string | null>(null);
 const [editingStockValue, setEditingStockValue] = useState<string>('');
 const [stockModalProduct, setStockModalProduct] = useState<{ id: string; name: string; stock: number } | null>(null);

 // Identificadores POS — external_id y barcodes son editables en create y edit
 const [editingProductExternalId, setEditingProductExternalId] = useState<string>('');
 const [editingProductBarcodes, setEditingProductBarcodes] = useState<string[]>([]);
 const [newBarcodeInput, setNewBarcodeInput] = useState<string>('');

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
 discount_percent: '',
 cost_price: '',
 active: true,
 });

 useEffect(() => {
 if (!user || user.role !== 'admin') {
 router.push('/');
 return;
 }
 loadCategories();
 loadLaboratories();
 fetch('/api/admin/products/stats', { credentials: 'include' })
  .then(r => r.ok ? r.json() : null)
  .then(data => { if (data) setProductStats(data); })
  .catch(() => {});
 }, [user, router]);

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
 if (user) {
 loadProducts();
 }
 }, [user, currentPage, searchTerm, selectedCategory, selectedLaboratory, selectedPrescription, sortBy, stockFilter, minPrice, maxPrice, noImage, hasDiscount, noExternalId, noBarcode]);

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
 if (!user) return;

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
 min_price: minPrice ? parseInt(minPrice) : undefined,
 max_price: maxPrice ? parseInt(maxPrice) : undefined,
 no_image: noImage || undefined,
 has_discount: hasDiscount || undefined,
 no_external_id: noExternalId || undefined,
 no_barcode: noBarcode || undefined,
 in_stock: stockFilter === 'in' ? true : undefined,
 stock_filter: (stockFilter === 'low' || stockFilter === 'out') ? (stockFilter as 'low' | 'out') : undefined,
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
 discount_percent: parseInt(formData.discount_percent) || 0,
 cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
 active: formData.active,
 external_id: editingProductExternalId.trim() || null,
 barcodes: editingProductBarcodes,
 };

 if (editingProduct) {
 await productApi.update(editingProduct, data);
 } else {
 await productApi.create(data);
 }

 setShowForm(false);
 setEditingProduct(null);
 setEditingProductExternalId('');
 setEditingProductBarcodes([]);
 setNewBarcodeInput('');
 resetForm();
 loadProducts();
 loadLaboratories(); // Refresh labs list if a new one was added
 } catch (error) {
 console.error('Error saving product:', error);
 alert('Error al guardar el producto');
 }
 };

 const handleEdit = async (product: any) => {
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
 discount_percent: product.discount_percent ? String(product.discount_percent) : '',
 cost_price: (product as any).cost_price ? String((product as any).cost_price) : '',
 active: product.active ?? true,
 });
 setEditingProductExternalId(product.external_id || '');
 setEditingProductBarcodes([]);
 setNewBarcodeInput('');
 setEditingProduct(product.id);
 setShowForm(true);
 // Cargar barcodes en segundo plano
 fetch(`/api/admin/products/${product.id}`)
   .then(r => r.ok ? r.json() : null)
   .then(data => { if (data?.barcodes) setEditingProductBarcodes(data.barcodes); })
   .catch(() => {});
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
 discount_percent: '',
 cost_price: '',
 active: false, // Start as inactive
 });
 setEditingProduct(null); // This is a new product
 setShowForm(true);
 };

 const handleDelete = async (id: string) => {
 if (!confirm('Estas seguro de eliminar este producto?')) return;

 try {
 await productApi.delete(id);
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
 discount_percent: '',
 cost_price: '',
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

 const handleScanExtracted = (data: ScannedProductData) => {
 resetForm();
 setEditingProduct(null);
 setFormData(prev => ({
  ...prev,
  name: data.name || '',
  slug: data.name ? generateSlug(data.name) : '',
  laboratory: data.laboratory || '',
  price: data.price || '',
  stock: data.stock || '',
  therapeutic_action: data.therapeutic_action || '',
  active_ingredient: data.active_ingredient || '',
  prescription_type: data.prescription_type || 'direct',
  presentation: data.presentation || '',
  discount_percent: data.discount_percent || '',
 }));
 setShowScanModal(false);
 setShowForm(true);
 };

 const exportToCSV = () => {
 if (!products) return;

 const headers = ['Nombre', 'Slug', 'Precio', 'Stock', 'Categoría', 'Laboratorio', 'Acción Terapéutica', 'Principio Activo', 'Tipo de Venta', 'Presentación', 'Estado'];
 const prescriptionLabels: Record<string, string> = {
 direct: 'Venta Directa',
 prescription: 'Receta Médica',
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

 const handleStockClick = (productId: string, currentStock: number) => {
  setEditingStockId(productId);
  setEditingStockValue(String(currentStock));
 };

 const handleStockSave = async (productId: string) => {
  const newQty = parseInt(editingStockValue);
  const currentProducts = products?.products || [];
  const product = currentProducts.find(p => p.id === productId);
  if (!product || isNaN(newQty) || newQty < 0) { setEditingStockId(null); return; }
  const delta = newQty - product.stock;
  if (delta === 0) { setEditingStockId(null); return; }
  try {
   await fetch(`/api/admin/products/${productId}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta, reason: 'correccion' }),
   });
   setProducts(prev => prev ? { ...prev, products: prev.products.map(p => p.id === productId ? { ...p, stock: newQty } : p) } : prev);
  } catch { /* silently fail */ }
  setEditingStockId(null);
 };

 const handleStockModalUpdate = (productId: string, newStock: number) => {
  setProducts(prev => prev ? { ...prev, products: prev.products.map(p => p.id === productId ? { ...p, stock: newStock } : p) } : prev);
 };

 const clearFilters = () => {
 setSearchTerm('');
 setSelectedCategory('');
 setSelectedLaboratory('');
 setSelectedPrescription('');
 setSortBy('');
 setStockFilter('');
 setLabSearchTerm('');
 setMinPrice('');
 setMaxPrice('');
 setNoImage(false);
 setHasDiscount(false);
 setNoExternalId(false);
 setNoBarcode(false);
 setCurrentPage(1);
 window.history.replaceState({}, '', '/admin/productos');
 };

 // Count active filters (excludes search and sort — those are in the main bar)
 const activeFilterCount = [selectedCategory, selectedLaboratory, selectedPrescription, stockFilter, minPrice || maxPrice ? 'price' : '', noImage ? 'noimg' : '', hasDiscount ? 'disc' : '', noExternalId ? 'noid' : '', noBarcode ? 'nobc' : ''].filter(Boolean).length;

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
 if (selectedProducts.size === 0) return;

 const action = activate ? 'activar' : 'desactivar';
 if (!confirm(`¿Deseas ${action} ${selectedProducts.size} productos?`)) return;

 setBulkActionLoading(true);
 try {
 const promises = Array.from(selectedProducts).map(id =>
 productApi.update(id, { active: activate })
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
 if (selectedProducts.size === 0) return;

 if (!confirm(`¿Deseas ELIMINAR ${selectedProducts.size} productos? Esta acción no se puede deshacer.`)) return;

 setBulkActionLoading(true);
 try {
 const promises = Array.from(selectedProducts).map(id =>
 productApi.delete(id)
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

 // ─── Import handlers ───
 const resetImportState = () => {
 setSelectedFile(null);
 setDiffResults(null);
 setImportResults(null);
 setImportStep('upload');
 setImportLoading(false);
 setParseErrors([]);
 if (fileInputRef.current) fileInputRef.current.value = '';
 };

 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 setSelectedFile(file);
 setParseErrors([]);
 }
 };

 const handleParseFile = async () => {
 if (!selectedFile) return;
 setImportLoading(true);
 setParseErrors([]);

 try {
 const { rows, errors } = await parseExcelFile(selectedFile);
 if (errors.length > 0) {
 setParseErrors(errors);
 setImportLoading(false);
 return;
 }

 // Load ALL products for diffing (bypasses the 100-item cap in productApi.list)
 const allDbProducts = await loadAllProductsForDiff();
 const diff = diffProducts(rows, allDbProducts);
 setDiffResults(diff);
 setImportStep('preview');
 } catch (error) {
 setParseErrors(['Error al procesar el archivo: ' + (error instanceof Error ? error.message : 'Error desconocido')]);
 } finally {
 setImportLoading(false);
 }
 };

 const handleImport = async () => {
 if (!diffResults) return;
 setImportStep('importing');
 setImportLoading(true);

 try {
 const results = await productApi.bulkImport({
 newProducts: diffResults.newProducts,
 updateProducts: diffResults.updatedProducts.map(u => u.excelRow),
 });
 setImportResults(results);
 setImportStep('results');
 } catch (error) {
 setImportResults({
 success: false,
 inserted: 0,
 updated: 0,
 errors: [error instanceof Error ? error.message : 'Error desconocido'],
 });
 setImportStep('results');
 } finally {
 setImportLoading(false);
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
 <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Productos</h1>
 <p className="text-slate-500 dark:text-slate-400 mt-1">
 Gestiona el catálogo de productos
 </p>
 </div>
 <div className="flex flex-wrap gap-2">
 <button
 onClick={() => setShowScanModal(true)}
 className="btn btn-secondary flex items-center gap-2"
 >
 <Camera className="w-5 h-5" />
 Escanear Factura
 </button>
 <button
 onClick={() => { resetImportState(); setShowImportModal(true); }}
 className="btn btn-secondary flex items-center gap-2"
 >
 <Upload className="w-5 h-5" />
 Importar Excel
 </button>
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
 setEditingProductExternalId('');
 setEditingProductBarcodes([]);
 setNewBarcodeInput('');
 setShowForm(true);
 }}
 className="btn btn-primary flex items-center gap-2"
 >
 <Plus className="w-5 h-5" />
 Nuevo Producto
 </button>
 </div>
 </div>

 {/* Data Completeness Panel */}
 {productStats && (
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
  {[
  { label: 'Sin imagen', value: productStats.noImage, color: 'amber', onClick: () => { setNoImage(true); setCurrentPage(1); } },
  { label: 'Sin cód. externo', value: productStats.noExternalId, color: 'violet', onClick: () => { setNoExternalId(true); setCurrentPage(1); } },
  { label: 'Sin barcode', value: productStats.noBarcode, color: 'cyan', onClick: () => { setNoBarcode(true); setCurrentPage(1); } },
  { label: 'Agotados', value: productStats.outOfStock, color: 'red', onClick: () => { setStockFilter('out'); setCurrentPage(1); } },
  { label: 'Stock bajo', value: productStats.lowStock, color: 'orange', onClick: () => { setStockFilter('low'); setCurrentPage(1); } },
  { label: 'Total activos', value: productStats.total, color: 'emerald', onClick: undefined },
  ].map(({ label, value, color, onClick }) => (
  <button
   key={label}
   onClick={onClick}
   disabled={!onClick}
   className={`flex flex-col items-center py-2.5 px-3 rounded-xl border-2 transition-all text-center ${
   onClick
    ? `cursor-pointer hover:shadow-sm active:scale-95 ${
     color === 'amber' ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 hover:border-amber-400' :
     color === 'violet' ? 'border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 hover:border-violet-400' :
     color === 'cyan' ? 'border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 hover:border-cyan-400' :
     color === 'red' ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:border-red-400' :
     'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 hover:border-orange-400'
    }`
    : 'cursor-default border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
   }`}
  >
   <span className={`text-xl font-bold leading-none ${
   color === 'amber' ? 'text-amber-700 dark:text-amber-300' :
   color === 'violet' ? 'text-violet-700 dark:text-violet-300' :
   color === 'cyan' ? 'text-cyan-700 dark:text-cyan-300' :
   color === 'red' ? 'text-red-700 dark:text-red-300' :
   color === 'orange' ? 'text-orange-700 dark:text-orange-300' :
   'text-emerald-700 dark:text-emerald-300'
   }`}>{value.toLocaleString('es-CL')}</span>
   <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{label}</span>
  </button>
  ))}
 </div>
 )}

 {/* Search and Filters */}
 <div className="card p-4 mb-6">
 {/* Main filter bar */}
 <div className="flex flex-wrap items-center gap-2 sm:gap-3">
 <form onSubmit={handleSearch} className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[220px]">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
 <input
 type="text"
 placeholder="Buscar por nombre, lab, descripción..."
 value={searchTerm}
 onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
 className="w-full pl-9 pr-3 py-2 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
 />
 </div>
 </form>

 <select
 value={selectedCategory}
 onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
 className="py-2 px-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 min-w-[160px]"
 >
 <option value="">Todas las categorías</option>
 {categories.map((cat) => (
 <option key={cat.id} value={cat.slug}>{cat.name}</option>
 ))}
 </select>

 <select
 value={stockFilter}
 onChange={(e) => { setStockFilter(e.target.value); setCurrentPage(1); }}
 className={`py-2 px-3 border-2 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-800 min-w-[130px] ${
 stockFilter === 'low' ? 'border-orange-400 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-600 dark:text-orange-400' :
 stockFilter === 'out' ? 'border-red-400 text-red-700 bg-red-50 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400' : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
 }`}
 >
 <option value="">Todo el stock</option>
 <option value="low">⚠ Stock bajo (≤10)</option>
 <option value="out">✕ Agotados</option>
 <option value="in">✓ Con stock</option>
 </select>

 <select
 value={sortBy}
 onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
 className="py-2 px-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 min-w-[150px]"
 >
 <option value="">Más recientes</option>
 <option value="name_asc">Nombre A→Z</option>
 <option value="name_desc">Nombre Z→A</option>
 <option value="laboratory_asc">Lab. A→Z</option>
 <option value="laboratory_desc">Lab. Z→A</option>
 <option value="price_asc">Precio ↑</option>
 <option value="price_desc">Precio ↓</option>
 <option value="stock_asc">Stock ↑</option>
 <option value="stock_desc">Stock ↓</option>
 <option value="discount_desc">Mayor descuento</option>
 </select>

 <button
 onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
 showAdvancedFilters || activeFilterCount > 0
 ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
 : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-emerald-400 hover:text-emerald-700 dark:hover:border-emerald-500 dark:hover:text-emerald-400'
 }`}
 >
 <Filter className="w-4 h-4" />
 Filtros
 {activeFilterCount > 0 && (
 <span className={`rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold ${showAdvancedFilters || activeFilterCount > 0 ? 'bg-white text-emerald-600' : 'bg-emerald-100 text-emerald-700'}`}>
 {activeFilterCount}
 </span>
 )}
 </button>

 {/* Stats pill */}
 <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:block">
 <span className="font-semibold text-slate-700 dark:text-slate-200">{(products?.total || 0).toLocaleString('es-CL')}</span> productos
 </span>
 </div>

 {/* Active filter chips */}
 {(selectedCategory || selectedLaboratory || selectedPrescription || stockFilter || minPrice || maxPrice || noImage || hasDiscount || noExternalId || noBarcode) && (
 <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
 <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Filtros activos:</span>
 {selectedCategory && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 rounded-full text-xs font-medium">
 {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
 <button onClick={() => { setSelectedCategory(''); setCurrentPage(1); }} className="hover:text-emerald-600"><X className="w-3 h-3" /></button>
 </span>
 )}
 {selectedLaboratory && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full text-xs font-medium">
 {selectedLaboratory}
 <button onClick={() => { setSelectedLaboratory(''); setCurrentPage(1); }} className="hover:text-blue-600"><X className="w-3 h-3" /></button>
 </span>
 )}
 {selectedPrescription && (
 <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
 selectedPrescription === 'direct' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700' :
 selectedPrescription === 'prescription' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700' :
 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700'}`}>
 {selectedPrescription === 'direct' ? 'Venta Directa' : selectedPrescription === 'prescription' ? 'Receta Médica' : 'Receta Retenida'}
 <button onClick={() => { setSelectedPrescription(''); setCurrentPage(1); }} className="hover:opacity-70"><X className="w-3 h-3" /></button>
 </span>
 )}
 {stockFilter && (
 <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${stockFilter === 'out' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700'}`}>
 {stockFilter === 'out' ? 'Agotados' : stockFilter === 'low' ? 'Stock bajo' : 'Con stock'}
 <button onClick={() => { setStockFilter(''); setCurrentPage(1); }} className="hover:opacity-70"><X className="w-3 h-3" /></button>
 </span>
 )}
 {(minPrice || maxPrice) && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-full text-xs font-medium">
 Precio: {minPrice ? `$${parseInt(minPrice).toLocaleString('es-CL')}` : '$0'} — {maxPrice ? `$${parseInt(maxPrice).toLocaleString('es-CL')}` : '∞'}
 <button onClick={() => { setMinPrice(''); setMaxPrice(''); setCurrentPage(1); }} className="hover:text-purple-600"><X className="w-3 h-3" /></button>
 </span>
 )}
 {noImage && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded-full text-xs font-medium">
 Sin imagen
 <button onClick={() => { setNoImage(false); setCurrentPage(1); }} className="hover:text-amber-600"><X className="w-3 h-3" /></button>
 </span>
 )}
 {hasDiscount && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 dark:bg-pink-900/20 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-700 rounded-full text-xs font-medium">
 Con descuento
 <button onClick={() => { setHasDiscount(false); setCurrentPage(1); }} className="hover:text-pink-600"><X className="w-3 h-3" /></button>
 </span>
 )}
 {noExternalId && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-700 rounded-full text-xs font-medium">
 Sin código externo
 <button onClick={() => { setNoExternalId(false); setCurrentPage(1); }} className="hover:text-violet-600"><X className="w-3 h-3" /></button>
 </span>
 )}
 {noBarcode && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700 rounded-full text-xs font-medium">
 Sin código de barra
 <button onClick={() => { setNoBarcode(false); setCurrentPage(1); }} className="hover:text-cyan-600"><X className="w-3 h-3" /></button>
 </span>
 )}
 <button onClick={clearFilters} className="ml-auto text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline">Limpiar todo</button>
 </div>
 )}

 {/* Advanced Filters Panel */}
 {showAdvancedFilters && (
 <div className="mt-3 pt-4 border-t border-slate-200 dark:border-slate-700">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

 {/* Laboratory */}
 <div>
 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Laboratorio</label>
 <div className="relative mb-2">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
 <input
 type="text"
 placeholder="Buscar laboratorio..."
 value={labSearchTerm}
 onChange={(e) => setLabSearchTerm(e.target.value)}
 className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-emerald-400 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
 />
 </div>
 <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
 <div className="max-h-44 overflow-y-auto">
 {[{ value: '', label: 'Todos los laboratorios' }, ...filteredLaboratories.map(l => ({ value: l, label: l }))].map(({ value, label }) => (
 <button
 key={value}
 onClick={() => { setSelectedLaboratory(value); setCurrentPage(1); }}
 className={`w-full text-left px-3 py-2 text-sm transition-colors ${
 selectedLaboratory === value
 ? 'bg-emerald-600 text-white font-medium'
 : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
 } ${value === '' ? 'border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400' : ''}`}
 >
 {label}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Prescription type + Price */}
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Tipo de Receta</label>
 <div className="space-y-1.5">
 {[
 { value: '', label: 'Todos', color: 'slate' },
 { value: 'direct', label: 'Venta Directa', color: 'green' },
 { value: 'prescription', label: 'Receta Médica', color: 'yellow' },
 { value: 'retained', label: 'Receta Retenida', color: 'red' },
 ].map(({ value, label, color }) => (
 <button
 key={value}
 onClick={() => { setSelectedPrescription(value); setCurrentPage(1); }}
 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left ${
 selectedPrescription === value
 ? color === 'green' ? 'bg-green-600 border-green-600 text-white'
 : color === 'yellow' ? 'bg-yellow-500 border-yellow-500 text-white'
 : color === 'red' ? 'bg-red-600 border-red-600 text-white'
 : 'bg-emerald-600 border-emerald-600 text-white'
 : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
 }`}
 >
 <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
 selectedPrescription === value ? 'bg-white' :
 color === 'green' ? 'bg-green-500' : color === 'yellow' ? 'bg-yellow-500' : color === 'red' ? 'bg-red-500' : 'bg-slate-400'
 }`} />
 {label}
 </button>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Precio (CLP)</label>
 <div className="flex items-center gap-2">
 <input
 type="number"
 placeholder="Mín"
 value={minPrice}
 onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
 className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-emerald-400 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
 min="0"
 step="100"
 />
 <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
 <input
 type="number"
 placeholder="Máx"
 value={maxPrice}
 onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
 className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-emerald-400 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
 min="0"
 step="100"
 />
 </div>
 </div>
 </div>

 {/* Quick filters + Stats */}
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Filtros Rápidos</label>
 <div className="space-y-2">
 <button
 onClick={() => { setNoImage(!noImage); setCurrentPage(1); }}
 className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
 noImage ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-300' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
 }`}
 >
 <span className="flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-amber-500" />
 Sin imagen
 </span>
 {noImage && <span className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>}
 </button>
 <button
 onClick={() => { setHasDiscount(!hasDiscount); setCurrentPage(1); }}
 className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
 hasDiscount ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-400 dark:border-pink-600 text-pink-800 dark:text-pink-300' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
 }`}
 >
 <span className="flex items-center gap-2">
 <span className="text-pink-500 font-bold text-base leading-none">%</span>
 Con descuento
 </span>
 {hasDiscount && <span className="w-4 h-4 bg-pink-400 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>}
 </button>
 <button
 onClick={() => { setNoExternalId(!noExternalId); setCurrentPage(1); }}
 className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
 noExternalId ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-400 dark:border-violet-600 text-violet-800 dark:text-violet-300' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
 }`}
 >
 <span className="flex items-center gap-2">
 <span className="text-violet-500 font-bold text-sm leading-none">#</span>
 Sin código externo
 </span>
 {noExternalId && <span className="w-4 h-4 bg-violet-400 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>}
 </button>
 <button
 onClick={() => { setNoBarcode(!noBarcode); setCurrentPage(1); }}
 className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
 noBarcode ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-400 dark:border-cyan-600 text-cyan-800 dark:text-cyan-300' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
 }`}
 >
 <span className="flex items-center gap-2">
 <span className="text-cyan-500 font-bold text-sm leading-none">▌</span>
 Sin código de barra
 </span>
 {noBarcode && <span className="w-4 h-4 bg-cyan-400 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>}
 </button>
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Resumen</label>
 <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="text-slate-500 dark:text-slate-400">Resultados</span>
 <span className="font-semibold text-slate-800 dark:text-slate-200">{(products?.total || 0).toLocaleString('es-CL')}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-slate-500 dark:text-slate-400">Laboratorios</span>
 <span className="font-semibold text-slate-800 dark:text-slate-200">{laboratories.length}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-slate-500 dark:text-slate-400">Categorías</span>
 <span className="font-semibold text-slate-800 dark:text-slate-200">{categories.length}</span>
 </div>
 </div>
 </div>

 {activeFilterCount > 0 && (
 <button
 onClick={clearFilters}
 className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
 >
 <X className="w-4 h-4" />
 Limpiar {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
 </button>
 )}
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Bulk Actions Bar */}
 {selectedProducts.size > 0 && (
  <div className="card p-4 mb-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 flex flex-wrap items-center justify-between gap-4">
  <div className="flex items-center gap-3">
  <span className="font-medium text-emerald-800 dark:text-emerald-300">
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
 <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
 Mostrando {showingStart}-{showingEnd} de {products.total.toLocaleString('es-CL')} productos
 </div>
 )}

 {/* Form Modal */}
 {showForm && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
 <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
 {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
 </h2>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
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
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
 <input
 type="text"
 value={formData.slug}
 onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
 className="input"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
 <textarea
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 className="input min-h-[80px]"
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio (CLP)</label>
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
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock</label>
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
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
 <select
 value={formData.category_id}
 onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
 className="input"
 >
 <option value="">Sin categoría</option>
 {categories.map((cat) => (
 <option key={cat.id} value={cat.id}>
 {cat.name}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL de imagen</label>
 <input
 type="url"
 value={formData.image_url}
 onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
 className="input"
 placeholder="https://..."
 />
 {formData.image_url && (
 <div className="mt-2 relative h-20 w-20">
 <Image
 src={formData.image_url}
 alt="Preview"
 fill
 sizes="80px"
 className="object-cover rounded border"
 onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
 />
 </div>
 )}
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Laboratorio</label>
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

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Acción Terapéutica</label>
 <input
 type="text"
 value={formData.therapeutic_action}
 onChange={(e) => setFormData({ ...formData, therapeutic_action: e.target.value })}
 className="input"
 placeholder="Ej: ANALGESICO, HIPOTENSOR..."
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Principio Activo</label>
 <input
 type="text"
 value={formData.active_ingredient}
 onChange={(e) => setFormData({ ...formData, active_ingredient: e.target.value })}
 className="input"
 placeholder="Ej: PARACETAMOL, IBUPROFENO..."
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Venta</label>
 <select
 value={formData.prescription_type}
 onChange={(e) => setFormData({ ...formData, prescription_type: e.target.value as 'direct' | 'prescription' | 'retained' })}
 className="input"
 >
 <option value="direct">Venta Directa</option>
 <option value="prescription">Receta Médica</option>
 <option value="retained">Receta Retenida</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Presentación</label>
 <input
 type="text"
 value={formData.presentation}
 onChange={(e) => setFormData({ ...formData, presentation: e.target.value })}
 className="input"
 placeholder="Ej: COMPRIMIDO, JARABE..."
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descuento (%)</label>
 <div className="flex items-center gap-3">
 <input
 type="number"
 min="0"
 max="99"
 value={formData.discount_percent}
 onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
 className="input w-32"
 placeholder="0 = sin descuento"
 />
 {formData.discount_percent && parseInt(formData.discount_percent) > 0 && (
  <span className="text-sm text-slate-600 dark:text-slate-400">
  Precio final: <span className="font-bold text-emerald-700 dark:text-emerald-400">
 {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(
 Math.ceil(parseFloat(formData.price || '0') * (1 - parseInt(formData.discount_percent) / 100))
 )}
 </span>
 </span>
 )}
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
  Precio de costo (CLP) <span className="text-xs text-slate-400 font-normal">— para cálculo de márgenes</span>
 </label>
 <div className="flex items-center gap-3">
  <input
  type="number"
  min="0"
  value={formData.cost_price}
  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
  className="input w-40"
  placeholder="Ej: 4500"
  />
  {formData.cost_price && formData.price && parseFloat(formData.cost_price) > 0 && (
  <span className="text-sm text-slate-600 dark:text-slate-400">
   Margen: <span className="font-bold text-emerald-700 dark:text-emerald-400">
   {(((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price)) * 100).toFixed(1)}%
   </span>
  </span>
  )}
 </div>
 </div>

 <div className="flex items-center gap-3">
 <input
 type="checkbox"
 id="active"
 checked={formData.active}
 onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
 className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
 />
  <label htmlFor="active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
 Producto activo (visible en tienda)
 </label>
 </div>

 {/* ID externo y códigos de barra — editables en crear y editar */}
 <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-4">
   <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Identificadores POS</p>

   {/* ID externo */}
   <div>
     <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">ID Lista de Precios (external_id)</label>
     <input
       type="text"
       value={editingProductExternalId}
       onChange={(e) => setEditingProductExternalId(e.target.value)}
       className="input font-mono text-sm"
       placeholder="Ej: 12345"
     />
   </div>

   {/* Códigos de barra */}
   <div>
     <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">Códigos de barra (EAN)</label>
     {editingProductBarcodes.length > 0 && (
       <div className="flex flex-wrap gap-2 mb-2">
         {editingProductBarcodes.map((bc) => (
           <span
             key={bc}
             className="inline-flex items-center gap-1.5 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1"
           >
             {bc}
             <button
               type="button"
               onClick={() => setEditingProductBarcodes(prev => prev.filter(b => b !== bc))}
               className="text-slate-400 hover:text-red-500 transition-colors ml-1"
               title="Eliminar"
             >
               ×
             </button>
           </span>
         ))}
       </div>
     )}
     <div className="flex gap-2">
       <input
         type="text"
         value={newBarcodeInput}
         onChange={(e) => setNewBarcodeInput(e.target.value)}
         onKeyDown={(e) => {
           if (e.key === 'Enter') {
             e.preventDefault();
             const val = newBarcodeInput.trim();
             if (val && !editingProductBarcodes.includes(val)) {
               setEditingProductBarcodes(prev => [...prev, val]);
             }
             setNewBarcodeInput('');
           }
         }}
         className="input font-mono text-sm flex-1"
         placeholder="Escanear o escribir código..."
       />
       <button
         type="button"
         onClick={() => {
           const val = newBarcodeInput.trim();
           if (val && !editingProductBarcodes.includes(val)) {
             setEditingProductBarcodes(prev => [...prev, val]);
           }
           setNewBarcodeInput('');
         }}
         className="btn btn-secondary text-sm px-3"
       >
         Agregar
       </button>
     </div>
     <p className="text-xs text-slate-400 mt-1">Presiona Enter o haz clic en Agregar. Un producto puede tener múltiples códigos.</p>
   </div>
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
 setEditingProductExternalId('');
 setEditingProductBarcodes([]);
 setNewBarcodeInput('');
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

 {/* Import Excel Modal */}
 {showImportModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
 <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto my-auto">

 {/* Step 1: Upload */}
 {importStep === 'upload' && (
 <>
  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-3">
  <FileSpreadsheet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
 Importar Productos desde Excel
 </h2>

 <label
 htmlFor="excel-upload"
 className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center mb-4 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors cursor-pointer block"
 >
 <input
 ref={fileInputRef}
 type="file"
 accept=".xlsx,.xls"
 onChange={handleFileSelect}
 className="hidden"
 id="excel-upload"
 />
 <Upload className="w-14 h-14 mx-auto mb-3 text-emerald-600" />
 <p className="text-lg font-medium mb-1">Selecciona un archivo Excel</p>
 <p className="text-slate-500 dark:text-slate-400">.xlsx o .xls</p>
 </label>

  {selectedFile && (
  <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-2xl p-4 mb-4 flex items-center gap-3">
  <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
  <div>
  <p className="font-medium text-slate-900 dark:text-slate-100">{selectedFile.name}</p>
  <p className="text-sm text-slate-600 dark:text-slate-300">{(selectedFile.size / 1024).toFixed(1)} KB</p>
  </div>
  </div>
  )}

  {parseErrors.length > 0 && (
  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-2xl p-4 mb-4">
  {parseErrors.map((err, i) => (
  <p key={i} className="text-red-700 dark:text-red-300 font-medium">{err}</p>
  ))}
  </div>
  )}

  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-4 mb-6">
  <p className="font-medium text-blue-900 dark:text-blue-200 mb-2">Formato esperado del Excel:</p>
  <p className="text-sm text-blue-800 dark:text-blue-300">Columnas: id, producto, laboratorio, departamento, precio, stock, accion_terapeutica, principio_activo, presentacion, receta...</p>
  <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">La columna &quot;id&quot; se usa para detectar productos existentes. Los productos nuevos se insertan y los existentes se actualizan (stock, precio).</p>
  </div>

 <div className="flex gap-3">
 <button
 onClick={handleParseFile}
 disabled={!selectedFile || importLoading}
 className="btn btn-primary flex-1 flex items-center justify-center gap-2"
 >
 {importLoading ? (
 <>
 <RefreshCw className="w-5 h-5 animate-spin" />
 Analizando...
 </>
 ) : (
 <>
 Analizar Archivo
 <ArrowRight className="w-5 h-5" />
 </>
 )}
 </button>
 <button
 onClick={() => { setShowImportModal(false); resetImportState(); }}
 className="btn btn-secondary"
 disabled={importLoading}
 >
 Cancelar
 </button>
 </div>
 </>
 )}

 {/* Step 2: Preview */}
 {importStep === 'preview' && diffResults && (
 <>
  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Vista Previa de Importación</h2>

  {/* Summary cards */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
  <div className="rounded-2xl border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-4">
  <p className="text-sm text-slate-600 dark:text-slate-300">Productos nuevos</p>
  <p className="text-3xl font-bold text-green-700 dark:text-green-400">{diffResults.newProducts.length}</p>
  </div>
  <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-4">
  <p className="text-sm text-slate-600 dark:text-slate-300">Con cambios</p>
  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{diffResults.updatedProducts.length}</p>
  </div>
  <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-4">
  <p className="text-sm text-slate-600 dark:text-slate-300">Sin cambios</p>
  <p className="text-3xl font-bold text-slate-700 dark:text-slate-200">{diffResults.unchangedCount}</p>
  </div>
  </div>

 {/* New products */}
 {diffResults.newProducts.length > 0 && (
 <div className="mb-6">
  <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
 <Plus className="w-5 h-5" />
 Productos Nuevos ({diffResults.newProducts.length})
 </h3>
 <div className="max-h-48 overflow-y-auto border-2 rounded-2xl">
 <table className="w-full text-sm">
  <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
  <tr>
  <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-200">Nombre</th>
  <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-200">Laboratorio</th>
  <th className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-200">Precio</th>
  <th className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-200">Stock</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
  {diffResults.newProducts.slice(0, 100).map((row, i) => (
  <tr key={i} className="hover:bg-green-50/50 dark:hover:bg-green-900/10">
  <td className="px-3 py-2 truncate max-w-[200px] text-slate-900 dark:text-slate-100">{row.producto}</td>
  <td className="px-3 py-2 text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{row.laboratorio || '-'}</td>
 <td className="px-3 py-2 text-right font-medium">{formatPrice(String(parsePrice(row.precio)))}</td>
 <td className="px-3 py-2 text-right">{parseInt(row.stock) || 0}</td>
 </tr>
 ))}
 </tbody>
 </table>
 {diffResults.newProducts.length > 100 && (
 <p className="p-3 text-sm text-slate-500 text-center border-t">
 ... y {diffResults.newProducts.length - 100} más
 </p>
 )}
 </div>
 </div>
 )}

 {/* Updated products */}
 {diffResults.updatedProducts.length > 0 && (
 <div className="mb-6">
  <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-400">
 <RefreshCw className="w-5 h-5" />
 Productos con Cambios ({diffResults.updatedProducts.length})
 </h3>
 <div className="max-h-48 overflow-y-auto border-2 rounded-2xl">
 <table className="w-full text-sm">
  <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
  <tr>
  <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-200">Nombre</th>
  <th className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-200">Stock</th>
  <th className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-200">Precio</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
  {diffResults.updatedProducts.slice(0, 100).map((update, i) => (
  <tr key={i} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
  <td className="px-3 py-2 truncate max-w-[200px] text-slate-900 dark:text-slate-100">{update.excelRow.producto}</td>
 <td className="px-3 py-2 text-right">
 {update.stockChange ? (
 <span className="font-medium">
 <span className="text-slate-400">{update.stockChange.old}</span>
 <span className="text-slate-400 mx-1">→</span>
 <span className={update.stockChange.new > update.stockChange.old ? 'text-green-600' : 'text-orange-600'}>
 {update.stockChange.new}
 </span>
 </span>
 ) : (
 <span className="text-slate-400">-</span>
 )}
 </td>
 <td className="px-3 py-2 text-right">
 {update.priceChange ? (
 <span className="font-medium">
 <span className="text-slate-400">{formatPrice(String(update.priceChange.old))}</span>
 <span className="text-slate-400 mx-1">→</span>
 <span className="text-blue-600">{formatPrice(String(update.priceChange.new))}</span>
 </span>
 ) : (
 <span className="text-slate-400">-</span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 {diffResults.updatedProducts.length > 100 && (
 <p className="p-3 text-sm text-slate-500 text-center border-t">
 ... y {diffResults.updatedProducts.length - 100} más
 </p>
 )}
 </div>
 </div>
 )}

 {/* No changes warning */}
 {diffResults.newProducts.length === 0 && diffResults.updatedProducts.length === 0 && (
  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-2xl p-4 mb-6">
  <p className="text-yellow-800 dark:text-yellow-300 font-medium">
 No hay cambios para aplicar. Todos los productos del Excel ya están actualizados en la base de datos.
 </p>
 </div>
 )}

 {/* Actions */}
 <div className="flex flex-wrap gap-3 pt-4 border-t-2">
 <button
 onClick={handleImport}
 disabled={diffResults.newProducts.length === 0 && diffResults.updatedProducts.length === 0}
 className="btn btn-primary flex-1 flex items-center justify-center gap-2"
 >
 <CheckCircle className="w-5 h-5" />
 Importar {diffResults.newProducts.length + diffResults.updatedProducts.length} Productos
 </button>
 <button onClick={() => setImportStep('upload')} className="btn btn-secondary">
 Volver
 </button>
 <button onClick={() => { setShowImportModal(false); resetImportState(); }} className="btn btn-secondary">
 Cancelar
 </button>
 </div>
 </>
 )}

 {/* Step 2.5: Importing */}
 {importStep === 'importing' && (
 <div className="text-center py-12">
 <RefreshCw className="w-16 h-16 mx-auto mb-4 text-emerald-600 animate-spin" />
 <h2 className="text-2xl font-bold text-slate-900 mb-2">Importando productos...</h2>
 <p className="text-slate-500">Esto puede tomar unos segundos</p>
 </div>
 )}

 {/* Step 3: Results */}
 {importStep === 'results' && importResults && (
 <>
  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-3">
 {importResults.success ? (
 <CheckCircle className="w-8 h-8 text-green-600" />
 ) : (
 <XCircle className="w-8 h-8 text-red-600" />
 )}
 {importResults.success ? 'Importación Completada' : 'Error en Importación'}
 </h2>

 {importResults.success ? (
 <>
  <div className="grid grid-cols-2 gap-4 mb-6">
  <div className="rounded-2xl border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-4">
  <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Productos insertados</p>
  <p className="text-3xl font-bold text-green-700 dark:text-green-400">{importResults.inserted}</p>
  </div>
  <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-4">
  <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Productos actualizados</p>
  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{importResults.updated}</p>
  </div>
  </div>
  {importResults.errors && importResults.errors.length > 0 && (
  <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-2xl p-4 mb-6">
  <p className="font-medium text-orange-800 dark:text-orange-300 mb-2">Advertencias ({importResults.errors.length}):</p>
  <div className="max-h-32 overflow-y-auto text-sm text-orange-700 dark:text-orange-400 space-y-1">
 {importResults.errors.map((err, i) => (
 <p key={i}>{err}</p>
 ))}
 </div>
 </div>
 )}
  <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-2xl p-4 mb-6">
  <p className="text-emerald-800 dark:text-emerald-300">La importación se completó exitosamente.</p>
  </div>
  </>
  ) : (
  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-2xl p-4 mb-6">
  <p className="text-red-800 dark:text-red-300 font-medium mb-2">Error:</p>
  {importResults.errors?.map((err, i) => (
  <p key={i} className="text-sm text-red-700 dark:text-red-400">{err}</p>
  ))}
  </div>
 )}

 <button
 onClick={() => {
 setShowImportModal(false);
 resetImportState();
 loadProducts();
 }}
 className="btn btn-primary w-full"
 >
 Cerrar
 </button>
 </>
 )}
 </div>
 </div>
 )}

 {/* Products Table */}
 {isLoading ? (
 <div className="card p-6 animate-pulse">
 <div className="space-y-4">
 {[...Array(10)].map((_, i) => (
 <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
 ))}
 </div>
 </div>
 ) : products && products.products.length > 0 ? (
 <>
 {/* Mobile Card Layout */}
 <div className="md:hidden space-y-3">
 {products.products
 .filter(p => {
 if (stockFilter === 'low') return p.stock > 0 && p.stock <= 10;
 if (stockFilter === 'out') return p.stock === 0;
 return true;
 })
 .map((product) => (
 <div
 key={product.id}
  className={`card p-4 ${product.stock === 0 ? 'border-red-200 dark:border-red-700 bg-red-50/30 dark:bg-red-900/10' : product.stock <= 10 ? 'border-orange-200 dark:border-orange-700 bg-orange-50/30 dark:bg-orange-900/10' : ''}`}
 >
 <div className="flex items-start gap-3">
 {product.image_url ? (
 <div className="w-14 h-14 relative rounded-lg bg-white border border-slate-100 shrink-0 overflow-hidden">
 <Image
 src={product.image_url}
 alt=""
 fill
 sizes="56px"
 className="object-contain"
 />
 </div>
 ) : (
 <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
 <Package className="w-5 h-5 text-slate-300" />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0">
 <Link href={`/producto/${product.slug}`} target="_blank" className="font-medium text-slate-900 dark:text-slate-100 truncate block hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline">{product.name}</Link>
 <p className="text-xs text-slate-500 truncate">{product.laboratory || 'Sin laboratorio'}</p>
 </div>
  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
  product.active ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
  }`}>
  {product.active ? 'Activo' : 'Inactivo'}
  </span>
 </div>
 <div className="flex items-center gap-3 mt-2">
  <span className="font-bold text-slate-900 dark:text-slate-100">{formatPrice(product.price)}</span>
  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
  product.stock === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
  product.stock <= 10 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
  }`}>
 Stock: {product.stock}
 </span>
 {product.category_name && (
 <span className="text-xs text-slate-500 truncate">{product.category_name}</span>
 )}
 </div>
 <div className="flex items-center gap-1 mt-3">
 {(product as any).prescription_type === 'prescription' && (
 <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">RX</span>
 )}
 {(product as any).prescription_type === 'retained' && (
 <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-medium rounded">RR</span>
 )}
 <div className="flex-1" />
 <button
 onClick={() => handleDuplicate(product)}
 className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
 title="Duplicar"
 >
 <Copy className="w-4 h-4" />
 </button>
 <button
 onClick={() => handleEdit(product)}
 className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
 title="Editar"
 >
 <Edit className="w-4 h-4" />
 </button>
 <button
 onClick={() => handleDelete(product.id)}
 className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
 title="Eliminar"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Desktop Table Layout */}
 <div className="hidden md:block card overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
 <tr>
 <th className="px-3 py-3 text-center w-10">
 <button
 onClick={selectAllOnPage}
 className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
 title="Seleccionar todos"
 >
  {products?.products.every(p => selectedProducts.has(p.id)) ? (
  <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
  ) : (
  <Square className="w-5 h-5 text-slate-400 dark:text-slate-500" />
  )}
 </button>
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
   <button onClick={() => handleColumnSort('name')} className="group flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
   Producto {getSortIcon('name')}
  </button>
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
   <button onClick={() => handleColumnSort('laboratory')} className="group flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
   Laboratorio {getSortIcon('laboratory')}
  </button>
 </th>
 <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
   <button onClick={() => handleColumnSort('price')} className="group flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors ml-auto">
   Precio {getSortIcon('price')}
  </button>
 </th>
 <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
   <button onClick={() => handleColumnSort('discount')} className="group flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mx-auto">
   Descuento {getSortIcon('discount')}
  </button>
 </th>
 <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
   <button onClick={() => handleColumnSort('stock')} className="group flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors ml-auto">
   Stock {getSortIcon('stock')}
  </button>
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Categoría</th>
 <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
   <button onClick={() => handleColumnSort('active')} className="group flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mx-auto">
   Estado {getSortIcon('active')}
  </button>
 </th>
 <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
 {products.products
 .filter(p => {
 if (stockFilter === 'low') return p.stock > 0 && p.stock <= 10;
 if (stockFilter === 'out') return p.stock === 0;
 return true;
 })
 .map((product) => (
 <tr 
 key={product.id} 
 className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 ${selectedProducts.has(product.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''} ${product.stock === 0 ? 'bg-red-50/50 dark:bg-red-900/10' : product.stock <= 10 ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}
 >
 <td className="px-3 py-3 text-center">
 <button
 onClick={() => toggleSelectProduct(product.id)}
 className="p-1 hover:bg-slate-200 rounded"
 >
  {selectedProducts.has(product.id) ? (
  <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
  ) : (
  <Square className="w-5 h-5 text-slate-400 dark:text-slate-500" />
  )}
 </button>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 {product.image_url ? (
 <div className="w-10 h-10 relative rounded bg-white border border-slate-100 shrink-0 overflow-hidden">
 <Image
 src={product.image_url}
 alt=""
 fill
 sizes="40px"
 className="object-contain"
 />
 </div>
 ) : (
 <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center shrink-0">
 <span className="text-[10px] text-slate-400">Sin img</span>
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
 <Link href={`/producto/${product.slug}`} target="_blank" className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px] hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline">{product.name}</Link>
 {(product as any).prescription_type === 'prescription' && (
 <span className="flex-shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded" title="Receta Médica">
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
 <span className="text-xs text-slate-500 truncate max-w-[150px]">{product.slug}</span>
 {(product as any).therapeutic_action && (
 <span className="text-xs text-emerald-600 truncate max-w-[100px]" title={(product as any).therapeutic_action}>
 {(product as any).therapeutic_action}
 </span>
 )}
 </div>
 </div>
 </div>
 </td>
 <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
 {product.laboratory || '-'}
 </td>
 <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100 font-medium">
 {formatPrice(product.price)}
 </td>
 <td className="px-4 py-3 text-center">
 {(product as any).discount_percent ? (
 <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
 -{(product as any).discount_percent}% OFF
 </span>
 ) : (
 <span className="text-slate-300">—</span>
 )}
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center justify-end gap-1">
  {editingStockId === product.id ? (
  <input
   type="number"
   min="0"
   autoFocus
   value={editingStockValue}
   onChange={(e) => setEditingStockValue(e.target.value)}
   onBlur={() => handleStockSave(product.id)}
   onKeyDown={(e) => {
   if (e.key === 'Enter') handleStockSave(product.id);
   if (e.key === 'Escape') setEditingStockId(null);
   }}
   className="w-20 px-2 py-1 text-sm border-2 border-emerald-400 rounded-lg font-mono text-center focus:outline-none"
  />
  ) : (
  <button
   onClick={() => handleStockClick(product.id, product.stock)}
   title="Click para editar"
   className={`px-2.5 py-0.5 rounded-full text-sm font-bold cursor-text hover:ring-2 hover:ring-emerald-400 transition-all ${
   product.stock === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
   product.stock <= 10 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'text-slate-900 dark:text-slate-100'
   }`}
  >
   {product.stock}
  </button>
  )}
  <button
  onClick={() => setStockModalProduct({ id: product.id, name: product.name, stock: product.stock })}
  className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-colors"
  title="Ver historial de stock"
  >
  <History className="w-3.5 h-3.5" />
  </button>
 </div>
 </td>
 <td className="px-4 py-3 text-sm text-slate-500 truncate max-w-[120px]">
 {product.category_name || '-'}
 </td>
 <td className="px-4 py-3 text-center">
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
  product.active ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
  }`}>
 {product.active ? 'Activo' : 'Inactivo'}
 </span>
 </td>
 <td className="px-4 py-3 text-right whitespace-nowrap">
 <button
 onClick={() => handleDuplicate(product)}
 className="p-2 text-slate-600 hover:text-blue-600"
 title="Duplicar"
 >
 <Copy className="w-4 h-4" />
 </button>
  <button
  onClick={() => handleEdit(product)}
  className="p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
  title="Editar"
  >
  <Edit className="w-4 h-4" />
  </button>
  <button
  onClick={() => handleDelete(product.id)}
  className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
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
  className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
  >
  <ChevronLeft className="w-5 h-5" />
  </button>
  <span className="px-4 py-2 text-slate-600 dark:text-slate-300">
  Página {currentPage} de {products.total_pages}
  </span>
  <button
  onClick={() => setCurrentPage((p) => Math.min(products.total_pages, p + 1))}
  disabled={currentPage === products.total_pages}
  className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
 >
 <ChevronRight className="w-5 h-5" />
 </button>
 </div>
 )}
 </>
 ) : (
  <div className="card p-12 text-center">
  <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
  <p className="text-slate-500 dark:text-slate-400 mb-4">No se encontraron productos</p>
 {(searchTerm || selectedCategory) && (
 <button onClick={clearFilters} className="btn btn-secondary">
 Limpiar filtros
 </button>
 )}
 </div>
 )}
 {stockModalProduct && (
  <StockModal
  productId={stockModalProduct.id}
  productName={stockModalProduct.name}
  currentStock={stockModalProduct.stock}
  onClose={() => setStockModalProduct(null)}
  onStockUpdated={handleStockModalUpdate}
  />
 )}
 {showScanModal && (
  <ScanInvoiceModal
  isOpen={showScanModal}
  onClose={() => setShowScanModal(false)}
  onExtracted={handleScanExtracted}
  categories={categories}
  />
 )}
 </div>
 );
}
