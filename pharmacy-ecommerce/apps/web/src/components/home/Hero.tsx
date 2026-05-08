'use client';

import { Search, BadgePercent, FileText, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, RefObject } from 'react';

type Props = {
  searchInput: string;
  onSearchChange: (v: string) => void;
  onSearchClear: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  inputRef?: RefObject<HTMLInputElement>;
  containerRef?: RefObject<HTMLDivElement>;
  acOpen?: boolean;
  acControlsId?: string;
  autocomplete?: ReactNode;
};

export default function Hero({
  searchInput,
  onSearchChange,
  onSearchClear,
  onKeyDown,
  onFocus,
  inputRef,
  containerRef,
  acOpen,
  acControlsId,
  autocomplete,
}: Props) {
  return (
    <section
      aria-label="Buscador y accesos rápidos"
      className="relative overflow-hidden rounded-3xl border-2 border-cyan-200 dark:border-cyan-900/60 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 dark:from-cyan-950/40 dark:via-slate-900 dark:to-emerald-950/40 px-5 py-7 sm:px-8 sm:py-9 shadow-sm"
    >
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-cyan-200/40 dark:bg-cyan-700/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-emerald-200/40 dark:bg-emerald-700/20 blur-3xl pointer-events-none" aria-hidden />

      <div className="relative">
        <p className="text-base sm:text-lg font-semibold text-cyan-700 dark:text-cyan-300 mb-1">
          Tu Farmacia · Coquimbo
        </p>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 leading-tight tracking-tight mb-2">
          ¿Qué medicamento necesita hoy?
        </h2>
        <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 mb-5 max-w-2xl">
          Busque su producto, cotice su receta o aproveche nuestras ofertas. Atención cercana para usted.
        </p>

        <div className="flex flex-col gap-3">
          <div className="relative" role="search" ref={containerRef}>
            <label htmlFor="hero-search" className="sr-only">Buscar medicamentos</label>
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-cyan-700 dark:text-cyan-300" aria-hidden />
            </div>
            <input
              ref={inputRef}
              id="hero-search"
              type="search"
              placeholder="Ej. paracetamol, vitamina D, pañales..."
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              className="block w-full pl-14 pr-14 py-4 sm:py-5 bg-white dark:bg-slate-900 border-2 border-cyan-300 dark:border-cyan-800 rounded-2xl text-lg sm:text-xl font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-4 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all min-h-[60px]"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={acOpen}
              aria-controls={acControlsId}
            />
            {searchInput && (
              <button
                type="button"
                onClick={onSearchClear}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {autocomplete}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/?discount=true"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-lg shadow-md shadow-red-600/20 transition-all min-h-[56px]"
            >
              <BadgePercent className="w-5 h-5" />
              Ver ofertas
            </Link>
            <Link
              href="/cotizacion"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-cyan-500 dark:hover:border-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 active:scale-[0.98] font-bold text-lg transition-all min-h-[56px]"
            >
              <FileText className="w-5 h-5" />
              Cotizar receta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HeroAutocompleteShell({ children }: { children: ReactNode }) {
  return (
    <div
      id="ac-listbox"
      role="listbox"
      className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden"
    >
      {children}
    </div>
  );
}

export function HeroAcLoading() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-5 text-slate-500 dark:text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-base">Buscando...</span>
    </div>
  );
}
