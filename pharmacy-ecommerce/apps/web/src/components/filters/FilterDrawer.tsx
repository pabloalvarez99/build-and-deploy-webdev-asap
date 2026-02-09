'use client';

import { useEffect } from 'react';
import { X, Filter } from 'lucide-react';
import FilterContent from './FilterContent';
import { Category } from '@/lib/api';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  selectedLaboratory: string;
  selectedPrescription: string;
  minPrice: string;
  maxPrice: string;
  onlyAvailable: boolean;
  categories: Category[];
  laboratories: string[];
  onCategoryChange: (slug: string) => void;
  onLaboratoryChange: (lab: string) => void;
  onPrescriptionChange: (type: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onAvailableChange: (value: boolean) => void;
  onClearAll: () => void;
  activeFilterCount: number;
  resultCount: number;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  resultCount,
  ...filterProps
}: FilterDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 200ms ease-out' }}
      />

      {/* Drawer */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
        style={{ animation: 'slideUp 300ms ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-base font-bold text-slate-800">Filtros</span>
            {filterProps.activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {filterProps.activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <FilterContent {...filterProps} />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white">
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
          >
            Ver {resultCount.toLocaleString()} productos
          </button>
        </div>
      </div>
    </div>
  );
}
