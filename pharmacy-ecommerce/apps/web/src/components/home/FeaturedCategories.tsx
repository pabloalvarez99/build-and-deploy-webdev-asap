'use client';

import Link from 'next/link';
import { Pill, Droplet, Baby, Users } from 'lucide-react';
import { ReactNode } from 'react';

type Tile = {
  label: string;
  slug: string;
  icon: ReactNode;
  bg: string;
  ring: string;
  iconBg: string;
};

const tiles: Tile[] = [
  {
    label: 'Medicamentos',
    slug: 'dolor-fiebre',
    icon: <Pill className="w-7 h-7" />,
    bg: 'bg-red-50 dark:bg-red-900/20',
    ring: 'border-red-200 dark:border-red-800 hover:border-red-400',
    iconBg: 'bg-red-500 text-white',
  },
  {
    label: 'Cuidado personal',
    slug: 'higiene-cuidado-personal',
    icon: <Droplet className="w-7 h-7" />,
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    ring: 'border-teal-200 dark:border-teal-800 hover:border-teal-400',
    iconBg: 'bg-teal-500 text-white',
  },
  {
    label: 'Bebés',
    slug: 'bebes-ninos',
    icon: <Baby className="w-7 h-7" />,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    ring: 'border-amber-200 dark:border-amber-800 hover:border-amber-400',
    iconBg: 'bg-amber-500 text-white',
  },
  {
    label: 'Adulto mayor',
    slug: 'adulto-mayor',
    icon: <Users className="w-7 h-7" />,
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    ring: 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-400',
    iconBg: 'bg-indigo-500 text-white',
  },
];

export default function FeaturedCategories({ onSelect }: { onSelect?: (slug: string) => void }) {
  return (
    <section aria-labelledby="featured-cats-heading" className="-mx-1">
      <h2 id="featured-cats-heading" className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 px-1">
        Categorías destacadas
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1 snap-x snap-mandatory sm:grid sm:grid-cols-4 sm:overflow-visible">
        {tiles.map((t) => {
          const className = `snap-start flex-shrink-0 w-44 sm:w-auto flex flex-col items-center justify-center gap-3 px-4 py-6 rounded-2xl border-2 ${t.bg} ${t.ring} transition-all min-h-[140px] active:scale-95 focus:outline-none focus:ring-4 focus:ring-cyan-500/30`;
          const inner = (
            <>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${t.iconBg} shadow-sm`}>
                {t.icon}
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg text-center leading-tight">
                {t.label}
              </span>
            </>
          );
          if (onSelect) {
            return (
              <button
                key={t.slug}
                onClick={() => onSelect(t.slug)}
                aria-label={`Ver categoría ${t.label}`}
                className={className}
              >
                {inner}
              </button>
            );
          }
          return (
            <Link
              key={t.slug}
              href={`/?category=${t.slug}`}
              aria-label={`Ver categoría ${t.label}`}
              className={className}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
