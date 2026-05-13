'use client';

import { useEffect, useRef, useState, useCallback, useDeferredValue, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, X, Loader2, Clock, Tag, ArrowRight } from 'lucide-react';
import { formatPrice, discountedPrice } from '@/lib/format';

type Suggestion = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  price: string;
  discount_percent: number | null;
  stock: number;
  laboratory: string | null;
  category_name: string | null;
  category_slug: string | null;
  match_field: 'name' | 'active_ingredient' | 'laboratory' | 'therapeutic_action' | null;
  match_value: string | null;
};

type CategorySuggestion = { name: string; slug: string };

const RECENT_KEY = 'tf:recent-searches';
const RECENT_MAX = 6;

function loadRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string').slice(0, RECENT_MAX) : [];
  } catch { return []; }
}

function saveRecent(term: string) {
  if (typeof window === 'undefined') return;
  const t = term.trim();
  if (!t) return;
  try {
    const cur = loadRecent().filter((x) => x.toLowerCase() !== t.toLowerCase());
    const next = [t, ...cur].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

function clearRecent() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(RECENT_KEY); } catch {}
}

function highlight(text: string | null | undefined, q: string) {
  if (!text) return null;
  if (!q) return text;
  const lq = q.toLowerCase();
  const lt = text.toLowerCase();
  const idx = lt.indexOf(lq);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-900 dark:text-cyan-200 px-0.5 rounded">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

interface Props {
  variant?: 'desktop' | 'overlay';
  onClose?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({ variant = 'desktop', onClose, autoFocus = false }: Props) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const deferredQ = useDeferredValue(q);
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Suggestion[]>([]);
  const [categories, setCategories] = useState<CategorySuggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setRecent(loadRecent()); }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Debounced fetch — uses deferredQ so typing stays responsive.
  useEffect(() => {
    const term = deferredQ.trim();
    if (term.length < 2) {
      abortRef.current?.abort();
      setProducts((p) => (p.length ? [] : p));
      setCategories((c) => (c.length ? [] : c));
      setError((e) => (e ? null : e));
      setLoading((l) => (l ? false : l));
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setActiveIdx(-1);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setError('Error al buscar');
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [deferredQ]);

  // Click-outside (desktop only)
  useEffect(() => {
    if (variant !== 'desktop') return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [variant]);

  const go = useCallback((path: string, term: string) => {
    saveRecent(term);
    setRecent(loadRecent());
    setOpen(false);
    onClose?.();
    router.push(path);
  }, [router, onClose]);

  const term = deferredQ.trim();
  const { items, indexByKey } = useMemo(() => {
    const arr: Array<{ kind: 'product' | 'category' | 'recent'; key: string; navigate: () => void }> = [];
    if (term.length >= 2) {
      categories.forEach((c) => arr.push({
        kind: 'category', key: `c-${c.slug}`,
        navigate: () => go(`/?category=${c.slug}`, c.name),
      }));
      products.forEach((p) => arr.push({
        kind: 'product', key: `p-${p.id}`,
        navigate: () => go(`/producto/${p.slug}`, p.name),
      }));
    } else {
      recent.forEach((r) => arr.push({
        kind: 'recent', key: `r-${r}`,
        navigate: () => { setQ(r); inputRef.current?.focus(); },
      }));
    }
    const map = new Map<string, number>();
    arr.forEach((it, i) => map.set(it.key, i));
    return { items: arr, indexByKey: map };
  }, [term, categories, products, recent, go]);

  const submitSearch = useCallback(() => {
    const t = q.trim();
    if (!t) return;
    go(`/?search=${encodeURIComponent(t)}`, t);
  }, [q, go]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length > 0) setActiveIdx((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length > 0) setActiveIdx((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && items[activeIdx]) items[activeIdx].navigate();
      else submitSearch();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (q) { setQ(''); }
      else if (variant === 'overlay') onClose?.();
      else setOpen(false);
    }
  };

  const showDropdown = open && (variant === 'overlay' || term.length >= 2 || recent.length > 0);

  return (
    <div ref={containerRef} className={variant === 'overlay' ? 'flex flex-col h-full' : 'relative w-full'}>
      <div className={variant === 'overlay'
        ? 'flex items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        : 'relative'}>
        <div className={variant === 'overlay' ? 'flex-1 relative' : 'relative'}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="global-search-listbox"
            aria-autocomplete="list"
            placeholder="Buscar medicamentos, principio activo..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            className="block w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-colors"
          />
          {q && (
            <button
              onClick={() => { setQ(''); inputRef.current?.focus(); }}
              aria-label="Limpiar"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {variant === 'overlay' && (
          <button
            onClick={onClose}
            className="text-sm font-medium text-slate-600 dark:text-slate-400 px-2 py-1.5"
          >
            Cancelar
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          id="global-search-listbox"
          role="listbox"
          className={
            variant === 'overlay'
              ? 'flex-1 overflow-y-auto bg-white dark:bg-slate-900'
              : 'absolute top-full left-0 right-0 mt-1.5 z-50 max-h-[28rem] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900'
          }
        >
          {loading && term.length >= 2 && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Buscando...
            </div>
          )}

          {!loading && error && (
            <div className="px-4 py-3 text-sm text-red-500">{error}</div>
          )}

          {!loading && !error && term.length < 2 && recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Búsquedas recientes</span>
                <button
                  onClick={() => { clearRecent(); setRecent([]); }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >Limpiar</button>
              </div>
              {recent.map((r, i) => {
                const itemIdx = indexByKey.get(`r-${r}`) ?? -1;
                const active = itemIdx === activeIdx;
                return (
                  <button
                    key={r}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIdx(itemIdx)}
                    onMouseDown={(e) => { e.preventDefault(); setQ(r); inputRef.current?.focus(); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${active ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 truncate">{r}</span>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !error && term.length >= 2 && categories.length === 0 && products.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              Sin resultados para &ldquo;{term}&rdquo;
            </div>
          )}

          {!loading && !error && term.length >= 2 && categories.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Categorías</div>
              {categories.map((c) => {
                const itemIdx = indexByKey.get(`c-${c.slug}`) ?? -1;
                const active = itemIdx === activeIdx;
                return (
                  <button
                    key={c.slug}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIdx(itemIdx)}
                    onMouseDown={(e) => { e.preventDefault(); go(`/?category=${c.slug}`, c.name); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${active ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <Tag className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    <span className="text-slate-800 dark:text-slate-200 truncate">{highlight(c.name, term)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !error && term.length >= 2 && products.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Productos</div>
              {products.map((p) => {
                const itemIdx = indexByKey.get(`p-${p.id}`) ?? -1;
                const active = itemIdx === activeIdx;
                const dp = p.discount_percent
                  ? discountedPrice(Number(p.price), p.discount_percent)
                  : Number(p.price);
                return (
                  <button
                    key={p.id}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIdx(itemIdx)}
                    onMouseDown={(e) => { e.preventDefault(); go(`/producto/${p.slug}`, p.name); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${active ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.image_url ? (
                        <Image src={p.image_url} alt="" width={40} height={40} className="object-contain w-full h-full" />
                      ) : (
                        <Search className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {highlight(p.name, term)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {p.match_field && p.match_field !== 'name' && p.match_value ? (
                          <span>{p.match_field === 'active_ingredient' ? 'Principio: ' : p.match_field === 'laboratory' ? 'Lab: ' : 'Acción: '}{highlight(p.match_value, term)}</span>
                        ) : (
                          <span>{p.laboratory || p.category_name || ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatPrice(dp)}</span>
                      {p.stock <= 0 && <span className="text-[10px] text-red-500 font-semibold">Sin stock</span>}
                    </div>
                  </button>
                );
              })}
              <button
                onMouseDown={(e) => { e.preventDefault(); submitSearch(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 border-t border-slate-100 dark:border-slate-800"
              >
                Ver todos los resultados <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
