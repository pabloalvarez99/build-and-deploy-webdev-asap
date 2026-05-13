'use client';

import { useEffect, useRef, useState } from 'react';
import { Accessibility, Check, Contrast, Type } from 'lucide-react';

type FontSize = 'normal' | 'large' | 'xl';

const STORAGE_FS = 'tf:a11y-fontsize';
const STORAGE_HC = 'tf:a11y-highcontrast';

function applyPrefs(fontSize: FontSize, highContrast: boolean) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.classList.remove('a11y-large', 'a11y-xl');
  if (fontSize === 'large') html.classList.add('a11y-large');
  if (fontSize === 'xl') html.classList.add('a11y-xl');
  html.classList.toggle('a11y-contrast', highContrast);
}

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const fs = (localStorage.getItem(STORAGE_FS) as FontSize) || 'normal';
      const hc = localStorage.getItem(STORAGE_HC) === 'true';
      setFontSize(fs);
      setHighContrast(hc);
      applyPrefs(fs, hc);
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const changeFontSize = (v: FontSize) => {
    setFontSize(v);
    try { localStorage.setItem(STORAGE_FS, v); } catch {}
    applyPrefs(v, highContrast);
  };

  const toggleHC = () => {
    const next = !highContrast;
    setHighContrast(next);
    try { localStorage.setItem(STORAGE_HC, String(next)); } catch {}
    applyPrefs(fontSize, next);
  };

  if (!mounted) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Opciones de accesibilidad"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Tamaño de texto y contraste"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        <Accessibility className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Opciones de accesibilidad"
          className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1rem)] rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 z-50"
        >
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Accessibility className="w-5 h-5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
            Accesibilidad
          </h3>

          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Type className="w-4 h-4" aria-hidden="true" /> Tamaño de texto
            </p>
            <div role="radiogroup" aria-label="Tamaño de texto" className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'xl'] as FontSize[]).map((v) => {
                const active = fontSize === v;
                return (
                  <button
                    key={v}
                    role="radio"
                    aria-checked={active}
                    onClick={() => changeFontSize(v)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all min-h-[60px] ${
                      active
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className={v === 'normal' ? 'text-base font-bold' : v === 'large' ? 'text-lg font-bold' : 'text-xl font-bold'}>A</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      {v === 'normal' ? 'Normal' : v === 'large' ? 'Grande' : 'Extra'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={toggleHC}
            aria-pressed={highContrast}
            className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl border-2 transition-all min-h-[52px] ${
              highContrast
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Contrast className="w-4 h-4" aria-hidden="true" /> Alto contraste
            </span>
            <span
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                highContrast ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300 dark:border-slate-600'
              }`}
              aria-hidden="true"
            >
              {highContrast && <Check className="w-3.5 h-3.5 text-white" />}
            </span>
          </button>

          <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 text-center">
            Preferencias guardadas en este dispositivo.
          </p>
        </div>
      )}
    </div>
  );
}
