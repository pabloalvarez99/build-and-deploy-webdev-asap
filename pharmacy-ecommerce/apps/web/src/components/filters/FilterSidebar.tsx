'use client';

import { Filter } from 'lucide-react';
import FilterContent from './FilterContent';
import { Category } from '@/lib/api';

interface FilterSidebarProps {
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
}

export default function FilterSidebar(props: FilterSidebarProps) {
  return (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-24 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-700">Filtros</span>
          </div>
          {props.activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
              {props.activeFilterCount}
            </span>
          )}
        </div>
        <div className="p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <FilterContent {...props} />
        </div>
      </div>
    </aside>
  );
}
