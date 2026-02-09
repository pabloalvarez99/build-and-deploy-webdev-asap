'use client';

import { X } from 'lucide-react';

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export default function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200"
        >
          <span className="text-emerald-500">{filter.label}:</span>
          <span>{filter.value}</span>
          <button
            onClick={() => onRemove(filter.key)}
            className="ml-0.5 p-0.5 rounded-full hover:bg-emerald-200/50 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1"
        >
          Limpiar todos
        </button>
      )}
    </div>
  );
}
