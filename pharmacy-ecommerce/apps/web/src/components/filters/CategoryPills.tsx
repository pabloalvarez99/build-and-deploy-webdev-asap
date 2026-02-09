'use client';

import { Category } from '@/lib/api';

interface CategoryPillsProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
}

export default function CategoryPills({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryPillsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
      <button
        onClick={() => onCategoryChange('')}
        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
          selectedCategory === ''
            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
            : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'
        }`}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() =>
            onCategoryChange(selectedCategory === cat.slug ? '' : cat.slug)
          }
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedCategory === cat.slug
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
