'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { SearchBar } from './SearchBar';

export function NavbarSearch() {
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    if (!overlayOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOverlayOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [overlayOpen]);

  return (
    <>
      {/* Desktop inline search */}
      <div className="hidden md:block flex-1 max-w-xl mx-2">
        <SearchBar variant="desktop" />
      </div>

      {/* Mobile trigger */}
      <button
        onClick={() => setOverlayOpen(true)}
        aria-label="Buscar"
        className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Mobile full-screen overlay */}
      {overlayOpen && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 md:hidden" role="dialog" aria-modal="true" aria-label="Búsqueda">
          <SearchBar variant="overlay" autoFocus onClose={() => setOverlayOpen(false)} />
        </div>
      )}
    </>
  );
}
