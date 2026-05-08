'use client';

import { Category } from '@/lib/api';
import { Tag, Filter, X } from 'lucide-react';

export interface CatalogFilters {
  category: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  hasDiscount: boolean;
}

interface Props {
  filters: CatalogFilters;
  categories: Category[];
  onChange: (next: Partial<CatalogFilters>) => void;
  onClear: () => void;
  totalResults?: number;
  variant?: 'sidebar' | 'drawer';
  onClose?: () => void;
}

export function Filters({ filters, categories, onChange, onClear, totalResults, variant = 'sidebar', onClose }: Props) {
  const activeCount =
    (filters.category ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.hasDiscount ? 1 : 0);

  const sortedCats = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col h-full">
      {variant === 'drawer' && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Filtros</h2>
            {activeCount > 0 && (
              <span className="bg-cyan-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{activeCount}</span>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800" aria-label="Cerrar filtros">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${variant === 'drawer' ? 'px-4 py-4 space-y-5' : 'space-y-5'}`}>
        {variant === 'sidebar' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Filtros</h2>
            </div>
            {activeCount > 0 && (
              <button onClick={onClear} className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                Limpiar ({activeCount})
              </button>
            )}
          </div>
        )}

        {/* Categoría */}
        <fieldset>
          <legend className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> Categoría
          </legend>
          <div className="space-y-1">
            <label className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]">
              <input
                type="radio"
                name="category"
                value=""
                checked={!filters.category}
                onChange={() => onChange({ category: '' })}
                className="w-4 h-4 accent-cyan-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Todas</span>
            </label>
            {sortedCats.map((c) => (
              <label key={c.id} className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]">
                <input
                  type="radio"
                  name="category"
                  value={c.slug}
                  checked={filters.category === c.slug}
                  onChange={() => onChange({ category: c.slug })}
                  className="w-4 h-4 accent-cyan-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{c.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Precio */}
        <fieldset>
          <legend className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Precio (CLP)</legend>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value })}
              className="w-full min-w-0 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
              min="0"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
              className="w-full min-w-0 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
              min="0"
            />
          </div>
        </fieldset>

        {/* Toggles */}
        <fieldset className="space-y-1">
          <legend className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Disponibilidad</legend>
          <label className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => onChange({ inStock: e.target.checked })}
              className="w-4 h-4 accent-cyan-600"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">En stock</span>
          </label>
          <label className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]">
            <input
              type="checkbox"
              checked={filters.hasDiscount}
              onChange={(e) => onChange({ hasDiscount: e.target.checked })}
              className="w-4 h-4 accent-cyan-600"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Con descuento</span>
          </label>
        </fieldset>
      </div>

      {variant === 'drawer' && (
        <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 bg-white dark:bg-slate-900 sticky bottom-0 flex gap-2">
          {activeCount > 0 && (
            <button onClick={onClear} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 text-sm">
              Limpiar
            </button>
          )}
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-cyan-600 text-white font-bold text-sm">
            {typeof totalResults === 'number' ? `Ver ${totalResults.toLocaleString('es-CL')} productos` : 'Aplicar'}
          </button>
        </div>
      )}
    </div>
  );
}
