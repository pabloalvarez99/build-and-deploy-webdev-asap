'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tags,
  Plus,
  AlertTriangle,
  FileText,
  X,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { productApi, orderApi, ProductWithCategory } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/format';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProduct?: () => void;
}

interface SearchResult {
  type: 'action' | 'product' | 'order' | 'navigation';
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

const quickActions: SearchResult[] = [
  {
    type: 'navigation',
    id: 'nav-dashboard',
    title: 'Ir a Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    action: () => {},
  },
  {
    type: 'navigation',
    id: 'nav-products',
    title: 'Ir a Productos',
    icon: <Package className="w-5 h-5" />,
    action: () => {},
  },
  {
    type: 'navigation',
    id: 'nav-orders',
    title: 'Ir a Ordenes',
    icon: <ShoppingBag className="w-5 h-5" />,
    action: () => {},
  },
  {
    type: 'navigation',
    id: 'nav-categories',
    title: 'Ir a Categorias',
    icon: <Tags className="w-5 h-5" />,
    action: () => {},
  },
  {
    type: 'action',
    id: 'action-new-product',
    title: 'Nuevo Producto',
    subtitle: 'Crear un producto nuevo',
    icon: <Plus className="w-5 h-5" />,
    action: () => {},
  },
  {
    type: 'action',
    id: 'action-low-stock',
    title: 'Ver Stock Critico',
    subtitle: 'Productos con stock bajo o agotados',
    icon: <AlertTriangle className="w-5 h-5" />,
    action: () => {},
  },
  {
    type: 'action',
    id: 'action-pending-orders',
    title: 'Ordenes Pendientes',
    subtitle: 'Ver ordenes sin procesar',
    icon: <Clock className="w-5 h-5" />,
    action: () => {},
  },
];

export function CommandPalette({ isOpen, onClose, onNewProduct }: CommandPaletteProps) {
  const router = useRouter();
  const { token } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>(quickActions);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches
  useEffect(() => {
    const stored = localStorage.getItem('admin-recent-searches');
    if (stored) {
      setRecentSearches(JSON.parse(stored).slice(0, 5));
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults(quickActions);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search products and orders
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !token) {
      setResults(quickActions);
      return;
    }

    setIsSearching(true);
    const searchResults: SearchResult[] = [];

    try {
      // Filter quick actions
      const filteredActions = quickActions.filter(
        (a) => a.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      searchResults.push(...filteredActions);

      // Search products
      const productResults = await productApi.list({
        search: searchQuery,
        limit: 5,
        active_only: false,
      });

      productResults.products.forEach((product) => {
        searchResults.push({
          type: 'product',
          id: `product-${product.id}`,
          title: product.name,
          subtitle: `${formatPrice(product.price)} - Stock: ${product.stock}`,
          icon: <Package className="w-5 h-5" />,
          action: () => {
            router.push(`/admin/productos?search=${encodeURIComponent(product.name)}`);
            onClose();
          },
        });
      });

      // Search orders by ID
      if (searchQuery.length >= 4) {
        try {
          const orderResults = await orderApi.list(token, { limit: 5 });
          orderResults.orders
            .filter((o) => o.id.toLowerCase().includes(searchQuery.toLowerCase()))
            .forEach((order) => {
              searchResults.push({
                type: 'order',
                id: `order-${order.id}`,
                title: `Orden #${order.id.slice(0, 8)}`,
                subtitle: `${formatPrice(order.total)} - ${order.status}`,
                icon: <FileText className="w-5 h-5" />,
                action: () => {
                  router.push(`/admin/ordenes/${order.id}`);
                  onClose();
                },
              });
            });
        } catch (e) {
          console.error('Error searching orders:', e);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
      setResults(searchResults);
      setSelectedIndex(0);
    }
  }, [token, router, onClose]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          executeAction(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const executeAction = (result: SearchResult) => {
    // Save to recent searches
    if (query.trim()) {
      const newRecent = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('admin-recent-searches', JSON.stringify(newRecent));
    }

    // Execute based on result type
    switch (result.id) {
      case 'nav-dashboard':
        router.push('/admin');
        onClose();
        break;
      case 'nav-products':
        router.push('/admin/productos');
        onClose();
        break;
      case 'nav-orders':
        router.push('/admin/ordenes');
        onClose();
        break;
      case 'nav-categories':
        router.push('/admin/categorias');
        onClose();
        break;
      case 'action-new-product':
        onNewProduct?.();
        onClose();
        break;
      case 'action-low-stock':
        router.push('/admin/productos?stock=low');
        onClose();
        break;
      case 'action-pending-orders':
        router.push('/admin/ordenes?status=pending');
        onClose();
        break;
      default:
        result.action();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative min-h-full flex items-start justify-center pt-[15vh] pb-20 px-4">
        <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-700">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar productos, ordenes, acciones..."
              className="flex-1 py-4 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto py-2">
            {isSearching ? (
              <div className="px-4 py-8 text-center text-slate-500">
                <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
                Buscando...
              </div>
            ) : results.length > 0 ? (
              <>
                {/* Group results by type */}
                {['navigation', 'action', 'product', 'order'].map((type) => {
                  const typeResults = results.filter((r) => r.type === type);
                  if (typeResults.length === 0) return null;

                  const typeLabels: Record<string, string> = {
                    navigation: 'Navegacion',
                    action: 'Acciones',
                    product: 'Productos',
                    order: 'Ordenes',
                  };

                  return (
                    <div key={type}>
                      <div className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                        {typeLabels[type]}
                      </div>
                      {typeResults.map((result) => {
                        const globalIndex = results.indexOf(result);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <button
                            key={result.id}
                            onClick={() => executeAction(result)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className={`${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                              {result.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
                                {result.title}
                              </div>
                              {result.subtitle && (
                                <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                  {result.subtitle}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <ArrowRight className="w-4 h-4 text-emerald-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="px-4 py-8 text-center text-slate-500">
                No se encontraron resultados para "{query}"
              </div>
            )}

            {/* Recent searches */}
            {!query && recentSearches.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
                <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase">
                  Busquedas recientes
                </div>
                {recentSearches.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(search)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Clock className="w-4 h-4" />
                    {search}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">↵</kbd>
                seleccionar
              </span>
            </div>
            <span className="hidden sm:inline">Paleta de Comandos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
