'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { productApi, Category } from '@/lib/api';
import { Plus, Edit, Trash2, X, AlertTriangle, Package } from 'lucide-react';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

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
    if (!token || (user && user.role !== 'admin')) {
      router.push('/');
      return;
    }
    loadCategories();
  }, [token, user, router]);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await productApi.listCategories();
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
    if (!token) return;

    try {
      if (editingCategory) {
        await productApi.updateCategory(token, editingCategory.id, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          active: formData.active,
        });
      } else {
        await productApi.createCategory(token, {
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
      alert('Error al guardar la categoria');
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
    if (!token || !deleteConfirm) return;

    const count = productCounts[deleteConfirm.id] || 0;
    if (count > 0) {
      alert(`No se puede eliminar la categoria porque tiene ${count} productos asociados.`);
      setDeleteConfirm(null);
      return;
    }

    try {
      await productApi.deleteCategory(token, deleteConfirm.id);
      setDeleteConfirm(null);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error al eliminar la categoria');
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categorias</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestiona las categorias de productos
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCategory(null);
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Categoria
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingCategory ? 'Editar Categoria' : 'Nueva Categoria'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="input"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">URL amigable: /categoria/{formData.slug}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripcion
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
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Categoria activa (visible en tienda)
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingCategory ? 'Guardar Cambios' : 'Crear Categoria'}
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
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Eliminar Categoria</h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-2">
              ¿Estas seguro de eliminar la categoria <strong>{deleteConfirm.name}</strong>?
            </p>

            {(productCounts[deleteConfirm.id] || 0) > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Esta categoria tiene {productCounts[deleteConfirm.id]} productos asociados. No se puede eliminar.
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
              <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="grid gap-4">
          {categories.map((category) => (
            <div key={category.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        category.active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {category.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">/{category.slug}</p>
                  {category.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{category.description}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {productCounts[category.id] || 0} productos
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(category)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
          <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">No hay categorias registradas</p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear primera categoria
          </button>
        </div>
      )}
    </div>
  );
}
