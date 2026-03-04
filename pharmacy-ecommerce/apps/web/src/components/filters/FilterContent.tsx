'use client';

import { useState } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Category } from '@/lib/api';

interface FilterContentProps {
  // Current filter values
  selectedCategory: string;
  selectedLaboratory: string;
  selectedPrescription: string;
  minPrice: string;
  maxPrice: string;
  onlyAvailable: boolean;
  // Options
  categories: Category[];
  laboratories: string[];
  // Callbacks
  onCategoryChange: (slug: string) => void;
  onLaboratoryChange: (lab: string) => void;
  onPrescriptionChange: (type: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onAvailableChange: (value: boolean) => void;
  onClearAll: () => void;
  activeFilterCount: number;
}

const PRESCRIPTION_OPTIONS = [
  { value: 'direct', label: 'Venta Directa', color: 'bg-emerald-500' },
  { value: 'prescription', label: 'Receta Medica', color: 'bg-amber-500' },
  { value: 'retained', label: 'Receta Retenida', color: 'bg-red-500' },
];

export default function FilterContent({
  selectedCategory,
  selectedLaboratory,
  selectedPrescription,
  minPrice,
  maxPrice,
  onlyAvailable,
  categories,
  laboratories,
  onCategoryChange,
  onLaboratoryChange,
  onPrescriptionChange,
  onMinPriceChange,
  onMaxPriceChange,
  onAvailableChange,
  onClearAll,
  activeFilterCount,
}: FilterContentProps) {
  const [labSearch, setLabSearch] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllLabs, setShowAllLabs] = useState(false);

  const filteredLabs = laboratories.filter((lab) =>
    lab.toLowerCase().includes(labSearch.toLowerCase())
  );
  const visibleLabs = showAllLabs ? filteredLabs : filteredLabs.slice(0, 8);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Clear all */}
      {activeFilterCount > 0 && (
        <button
          onClick={onClearAll}
          className="w-full py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          Limpiar filtros ({activeFilterCount})
        </button>
      )}

      {/* Prescription Type */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Tipo de venta
        </h3>
        <div className="space-y-1.5">
          {PRESCRIPTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                onPrescriptionChange(selectedPrescription === opt.value ? '' : opt.value)
              }
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                selectedPrescription === opt.value
                  ? 'bg-slate-100 text-slate-900 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${opt.color} flex-shrink-0`} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Categorías
        </h3>
        <div className="space-y-1">
          {visibleCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                onCategoryChange(selectedCategory === cat.slug ? '' : cat.slug)
              }
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-emerald-50 text-emerald-700 font-medium border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
          {categories.length > 8 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {showAllCategories ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Ver todas ({categories.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Laboratory */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Laboratorio
        </h3>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar laboratorio..."
            value={labSearch}
            onChange={(e) => setLabSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
          />
          {labSearch && (
            <button
              onClick={() => setLabSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {visibleLabs.map((lab) => (
            <button
              key={lab}
              onClick={() =>
                onLaboratoryChange(selectedLaboratory === lab ? '' : lab)
              }
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
                selectedLaboratory === lab
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {lab}
            </button>
          ))}
          {!labSearch && filteredLabs.length > 8 && !showAllLabs && (
            <button
              onClick={() => setShowAllLabs(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <ChevronDown className="w-3.5 h-3.5" /> Ver todos ({filteredLabs.length})
            </button>
          )}
          {filteredLabs.length === 0 && (
            <p className="text-xs text-slate-400 px-3 py-2">Sin resultados</p>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Rango de precio
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              className="w-full pl-7 pr-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
            />
          </div>
          <span className="text-slate-300 text-sm">-</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              className="w-full pl-7 pr-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
            />
          </div>
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Disponibilidad
        </h3>
        <button
          onClick={() => onAvailableChange(!onlyAvailable)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
            onlyAvailable
              ? 'bg-emerald-50 text-emerald-700 font-medium border border-emerald-200'
              : 'text-slate-600 hover:bg-slate-50 border border-transparent'
          }`}
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            onlyAvailable ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
          }`}>
            {onlyAvailable && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span>Solo productos disponibles</span>
        </button>
      </div>
    </div>
  );
}
