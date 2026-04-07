'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { productApi, Category } from '@/lib/api';
import { Plus, Edit, Trash2, X, AlertTriangle, Package } from 'lucide-react';

export default function AdminCategoriesPage() {
 const router = useRouter();
 const { user } = useAuthStore();

 const [categories, setCategories] = useState<Category[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [showForm, setShowForm] = useState(false);
 const [editingCategory, setEditingCategory] = useState<Category | null>(null);
 const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
 const [productCounts, setProductCounts] = useState<Record<string, number>>({});

 const [formData, setFormData] = useState({
 name: '',
 slug: '',
 description: '',
 active: true,
 });

 useEffect(() => {
 if (!user || user.role !== 'admin') {
 router.push('/');
 return;
 }
 loadCategories();
 }, [user, router]);

 const loadCategories = async () => {
 setIsLoading(true);
 try {
 const data = await productApi.listCategories(false);
 setCategories(data);

 // Load product counts for each category
 const products = await productApi.list({ limit: 1000, active_only: false });
 const counts: Record<string, number> = {};
 products.products.forEach((p) => {
 if (p.category_id) {
 counts[p.category_id] = (counts[p.category_id] || 0) + 1;
 }
 });
 setProductCounts(counts);
 } catch (error) {
 console.error('Error loading categories:', error);
 } finally {
 setIsLoading(false);
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 if (editingCategory) {
 await productApi.updateCategory(editingCategory.id, {
 name: formData.name,
 slug: formData.slug,
 description: formData.description || undefined,
 active: formData.active,
 });
 } else {
 await productApi.createCategory({
 name: formData.name,
 slug: formData.slug,
 description: formData.description || undefined,
 });
 }

 setShowForm(false);
 setEditingCategory(null);
 resetForm();
 loadCategories();
 } catch (error) {
 console.error('Error saving category:', error);
 alert('Error al guardar la categoría');
 }
 };

 const handleEdit = (category: Category) => {
 setFormData({
 name: category.name,
 slug: category.slug,
 description: category.description || '',
 active: category.active,
 });
 setEditingCategory(category);
 setShowForm(true);
 };

 const handleDelete = async () => {
 if (!deleteConfirm) return;

 const count = productCounts[deleteConfirm.id] || 0;
 if (count > 0) {
 alert(`No se puede eliminar la categoría porque tiene ${count} productos asociados.`);
 setDeleteConfirm(null);
 return;
 }

 try {
 await productApi.deleteCategory(deleteConfirm.id);
 setDeleteConfirm(null);
 loadCategories();
 } catch (error) {
 console.error('Error deleting category:', error);
 alert('Error al eliminar la categoría');
 }
 };

 const resetForm = () => {
 setFormData({ name: '', slug: '', description: '', active: true });
 };

 const generateSlug = (name: string) => {
 return name
 .toLowerCase()
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
 .replace(/[^a-z0-9]+/g, '-')
 .replace(/(^-|-$)/g, '');
 };

 if (!user || user.role !== 'admin') {
 return null;
 }

 return (
 <div className="max-w-4xl mx-auto">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Categorías</h1>
 <p className="text-slate-500 dark:text-slate-400 mt-1">
 Gestiona las categorías de productos
 </p>
 </div>
 <button
 onClick={() => {
 resetForm();
 setEditingCategory(null);
 setShowForm(true);
 }}
 className="btn btn-primary flex items-center gap-2 w-full sm:w-auto justify-center min-h-[44px]"
 >
 <Plus className="w-5 h-5" />
 Nueva Categoría
 </button>
 </div>

 {/* Form Modal */}
 {showForm && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
 {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
 </h2>
 <button
 onClick={() => {
 setShowForm(false);
 setEditingCategory(null);
 resetForm();
 }}
 className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
 >
 <X className="w-5 h-5 text-slate-500" />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
 Nombre
 </label>
 <input
 type="text"
 value={formData.name}
 onChange={(e) =>
 setFormData({
 ...formData,
 name: e.target.value,
 slug: editingCategory ? formData.slug : generateSlug(e.target.value),
 })
 }
 className="input"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
 Slug
 </label>
 <input
 type="text"
 value={formData.slug}
 onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
 className="input"
 required
 />
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">URL amigable: /categoria/{formData.slug}</p>
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
 Descripción
 </label>
 <textarea
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 className="input min-h-[80px]"
 />
 </div>

 {editingCategory && (
 <div className="flex items-center gap-3">
 <input
 type="checkbox"
 id="active"
 checked={formData.active}
 onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
 className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
 />
 <label htmlFor="active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
 Categoría activa (visible en tienda)
 </label>
 </div>
 )}

 <div className="flex gap-3 pt-4">
 <button type="submit" className="btn btn-primary flex-1">
 {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
 </button>
 <button
 type="button"
 onClick={() => {
 setShowForm(false);
 setEditingCategory(null);
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

 {/* Delete Confirmation Modal */}
 {deleteConfirm && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 w-full max-w-sm shadow-xl">
 <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
 <AlertTriangle className="w-6 h-6" />
 <h3 className="text-lg font-semibold">Eliminar Categoría</h3>
 </div>

 <p className="text-slate-600 dark:text-slate-300 mb-2">
 ¿Estás seguro de eliminar la categoría <strong>{deleteConfirm.name}</strong>?
 </p>

 {(productCounts[deleteConfirm.id] || 0) > 0 && (
 <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4">
 <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
 <Package className="w-4 h-4" />
 Esta categoría tiene {productCounts[deleteConfirm.id]} productos asociados. No se puede eliminar.
 </p>
 </div>
 )}

 <div className="flex gap-3 mt-6">
 <button
 onClick={handleDelete}
 disabled={(productCounts[deleteConfirm.id] || 0) > 0}
 className="btn bg-red-600 text-white hover:bg-red-700 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Eliminar
 </button>
 <button
 onClick={() => setDeleteConfirm(null)}
 className="btn btn-secondary flex-1"
 >
 Cancelar
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Categories List */}
 {isLoading ? (
 <div className="grid gap-4">
 {[...Array(4)].map((_, i) => (
 <div key={i} className="card p-4 animate-pulse">
 <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
 </div>
 ))}
 </div>
 ) : categories.length > 0 ? (
 <div className="grid gap-4">
 {categories.map((category) => (
 <div key={category.id} className="card p-4 hover:shadow-md transition-shadow">
 <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
 <div className="flex-1">
 <div className="flex items-center gap-3">
 <h3 className="font-semibold text-slate-900 dark:text-slate-100">{category.name}</h3>
  <span
  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
  category.active
  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
  : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
  }`}
  >
 {category.active ? 'Activo' : 'Inactivo'}
 </span>
 </div>
 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">/{category.slug}</p>
 {category.description && (
 <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{category.description}</p>
 )}
 <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
 <Package className="w-3 h-3" />
 {productCounts[category.id] || 0} productos
 </p>
 </div>

 <div className="flex items-center gap-1 shrink-0">
 <button
 onClick={() => handleEdit(category)}
 className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
 title="Editar"
 >
 <Edit className="w-4 h-4" />
 </button>
 <button
 onClick={() => setDeleteConfirm(category)}
 className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
 title="Eliminar"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="card p-12 text-center">
 <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
 <p className="text-slate-500 dark:text-slate-400 mb-4">No hay categorías registradas</p>
 <button
 onClick={() => {
 resetForm();
 setShowForm(true);
 }}
 className="btn btn-primary"
 >
 <Plus className="w-4 h-4 mr-2" />
 Crear primera categoría
 </button>
 </div>
 )}
 </div>
 );
}
