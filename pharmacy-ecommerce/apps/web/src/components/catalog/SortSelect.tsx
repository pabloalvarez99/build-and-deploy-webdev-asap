'use client';

import { ArrowUpDown } from 'lucide-react';

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'name_asc';

const LABELS: Record<SortOption, string> = {
  relevance: 'Relevancia',
  newest: 'Más recientes',
  price_asc: 'Precio: menor a mayor',
  price_desc: 'Precio: mayor a menor',
  name_asc: 'Nombre A-Z',
};

interface Props {
  value: SortOption;
  onChange: (v: SortOption) => void;
}

export function SortSelect({ value, onChange }: Props) {
  return (
    <div className="relative inline-flex items-center">
      <ArrowUpDown className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="appearance-none pl-9 pr-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 cursor-pointer min-h-[42px]"
        aria-label="Ordenar productos"
      >
        {(Object.keys(LABELS) as SortOption[]).map((k) => (
          <option key={k} value={k}>{LABELS[k]}</option>
        ))}
      </select>
      <svg className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  );
}
