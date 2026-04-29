'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, AlertTriangle, FileText, X, ArrowRight, Clock,
  Package, ShoppingBag, Tags, Warehouse, Users, Receipt, Truck,
  ClipboardList, BookOpen, Calculator, BarChart2, Settings, Wallet,
  TrendingUp, Activity, Crown, Database, Shield, ShieldCheck, Tag,
  RotateCcw, Star, ArrowUpDown, PackageSearch, BookX, CalendarClock,
  Scale, History, UserCheck, ClipboardCheck, Stethoscope, Printer,
  type LucideIcon,
} from 'lucide-react';
import { productApi, orderApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { canAccessRoute } from '@/lib/roles';
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
  href?: string;
  perform?: () => void;
}

interface NavSpec {
  id: string;
  href: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
}

const NAV_SPECS: NavSpec[] = [
  { id: 'nav-dashboard', href: '/admin/dashboard', title: 'Dashboard', icon: Activity },
  { id: 'nav-ejecutivo', href: '/admin/ejecutivo', title: 'Vista ejecutiva', subtitle: 'KPIs financieros del dueño', icon: Crown },
  { id: 'nav-insights', href: '/admin/insights', title: 'Insights', subtitle: 'Anomalías y oportunidades', icon: Crown },
  { id: 'nav-actividad', href: '/admin/actividad', title: 'Actividad', subtitle: 'Pulso del negocio', icon: Activity },
  { id: 'nav-operaciones', href: '/admin/operaciones', title: 'Operaciones diarias', icon: Activity },
  { id: 'nav-pos', href: '/admin/pos', title: 'POS', subtitle: 'Punto de venta', icon: Receipt },
  { id: 'nav-arqueo', href: '/admin/arqueo', title: 'Arqueo de caja', icon: Calculator },
  { id: 'nav-turnos', href: '/admin/turnos', title: 'Turnos POS', icon: History },
  { id: 'nav-farmacia', href: '/admin/farmacia', title: 'Panel farmacéutico', icon: Stethoscope },
  { id: 'nav-products', href: '/admin/productos', title: 'Productos', icon: Package },
  { id: 'nav-catalogo', href: '/admin/catalogo', title: 'Catálogo ERP', icon: Database },
  { id: 'nav-categories', href: '/admin/categorias', title: 'Categorías', icon: Tags },
  { id: 'nav-calidad', href: '/admin/catalogo-calidad', title: 'Calidad catálogo', icon: ClipboardCheck },
  { id: 'nav-orders', href: '/admin/ordenes', title: 'Órdenes', icon: ShoppingBag },
  { id: 'nav-clientes', href: '/admin/clientes', title: 'Clientes', icon: Users },
  { id: 'nav-fidelidad', href: '/admin/fidelidad', title: 'Fidelización', icon: Star },
  { id: 'nav-descuentos', href: '/admin/descuentos', title: 'Descuentos', icon: Tag },
  { id: 'nav-devoluciones', href: '/admin/devoluciones', title: 'Devoluciones', icon: RotateCcw },
  { id: 'nav-proveedores', href: '/admin/proveedores', title: 'Proveedores', icon: Truck },
  { id: 'nav-compras', href: '/admin/compras', title: 'Órdenes de compra', icon: ClipboardList },
  { id: 'nav-comparador', href: '/admin/compras/comparador', title: 'Comparador proveedores', icon: Scale },
  { id: 'nav-stock', href: '/admin/stock', title: 'Movimientos de stock', icon: ArrowUpDown },
  { id: 'nav-inventory', href: '/admin/inventario', title: 'Inventario', subtitle: 'Valorización y stock', icon: Warehouse },
  { id: 'nav-reposicion', href: '/admin/reposicion', title: 'Reposición', icon: PackageSearch },
  { id: 'nav-vencimientos', href: '/admin/vencimientos', title: 'Vencimientos', icon: CalendarClock },
  { id: 'nav-faltas', href: '/admin/faltas', title: 'Faltas / cuaderno', icon: BookX },
  { id: 'nav-libro-recetas', href: '/admin/libro-recetas', title: 'Libro de recetas', icon: BookOpen },
  { id: 'nav-turnos-farmaceutico', href: '/admin/turnos-farmaceutico', title: 'Turnos farmacéutico', icon: UserCheck },
  { id: 'nav-costos', href: '/admin/costos', title: 'Costos / márgenes', icon: TrendingUp },
  { id: 'nav-reportes', href: '/admin/reportes', title: 'Reportes', icon: BarChart2 },
  { id: 'nav-finanzas', href: '/admin/finanzas', title: 'Finanzas', subtitle: 'P&L · cuentas por pagar · cash flow', icon: Wallet },
  { id: 'nav-usuarios', href: '/admin/usuarios', title: 'Usuarios y roles', icon: Shield },
  { id: 'nav-auditoria', href: '/admin/sistema/auditoria', title: 'Auditoría', icon: ShieldCheck },
  { id: 'nav-config', href: '/admin/configuracion', title: 'Configuración', icon: Settings },
];

interface ActionSpec {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href?: string;
  // Routes that gate this action via canAccessRoute (optional)
  gateRoute?: string;
}

const ACTION_SPECS: ActionSpec[] = [
  { id: 'action-new-product', title: 'Nuevo producto', subtitle: 'Crear producto en catálogo', icon: Plus, gateRoute: '/admin/productos' },
  { id: 'action-low-stock', title: 'Ver stock crítico', subtitle: 'Productos con stock bajo', icon: AlertTriangle, href: '/admin/productos?stock=low', gateRoute: '/admin/productos' },
  { id: 'action-out-stock', title: 'Productos agotados', subtitle: 'Stock = 0', icon: Package, href: '/admin/inventario', gateRoute: '/admin/inventario' },
  { id: 'action-pending-orders', title: 'Órdenes pendientes', subtitle: 'Webpay y reservas sin atender', icon: Clock, href: '/admin/ordenes?status=pending', gateRoute: '/admin/ordenes' },
  { id: 'action-reservations', title: 'Reservas pendientes', subtitle: 'Aprobar/rechazar retiros', icon: ShoppingBag, href: '/admin/ordenes?status=reserved', gateRoute: '/admin/ordenes' },
  { id: 'action-stock-adjust', title: 'Ajustar stock', subtitle: 'Movimiento manual auditado', icon: ArrowUpDown, href: '/admin/stock', gateRoute: '/admin/stock' },
  { id: 'action-new-oc', title: 'Crear orden de compra', subtitle: 'Cámara · OCR · recepción', icon: ClipboardList, href: '/admin/compras/nueva', gateRoute: '/admin/compras' },
  { id: 'action-zreport', title: 'Imprimir Z-report', subtitle: 'Cierre de caja del turno', icon: Printer, href: '/admin/arqueo', gateRoute: '/admin/arqueo' },
  { id: 'action-gasto', title: 'Registrar gasto', subtitle: 'Gasto operativo del mes', icon: Wallet, href: '/admin/finanzas/gastos', gateRoute: '/admin/finanzas' },
  { id: 'action-faltas', title: 'Cuaderno de faltas', subtitle: 'Productos pedidos sin stock', icon: BookX, href: '/admin/faltas', gateRoute: '/admin/faltas' },
  { id: 'action-vencimientos', title: 'Vencimientos próximos', subtitle: 'Lotes < 30 días', icon: CalendarClock, href: '/admin/vencimientos', gateRoute: '/admin/vencimientos' },
];

export function CommandPalette({ isOpen, onClose, onNewProduct }: CommandPaletteProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const buildBaseResults = useCallback((): SearchResult[] => {
    const role = user?.role;
    const navResults: SearchResult[] = NAV_SPECS
      .filter((n) => canAccessRoute(role, n.href))
      .map((n) => ({
        type: 'navigation',
        id: n.id,
        title: n.title,
        subtitle: n.subtitle,
        icon: <n.icon className="w-4 h-4" />,
        href: n.href,
      }));
    const actionResults: SearchResult[] = ACTION_SPECS
      .filter((a) => !a.gateRoute || canAccessRoute(role, a.gateRoute))
      .map((a) => ({
        type: 'action',
        id: a.id,
        title: a.title,
        subtitle: a.subtitle,
        icon: <a.icon className="w-4 h-4" />,
        href: a.href,
        perform: a.id === 'action-new-product' ? onNewProduct : undefined,
      }));
    return [...actionResults, ...navResults];
  }, [user, onNewProduct]);

  useEffect(() => {
    const stored = localStorage.getItem('admin-recent-searches');
    if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults(buildBaseResults());
      setSelectedIndex(0);
    }
  }, [isOpen, buildBaseResults]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!user) return;
    if (!searchQuery.trim()) {
      setResults(buildBaseResults());
      setSelectedIndex(0);
      return;
    }

    setIsSearching(true);
    const q = searchQuery.toLowerCase();
    const base = buildBaseResults();
    const filtered = base.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.subtitle && r.subtitle.toLowerCase().includes(q)),
    );

    const out: SearchResult[] = [...filtered];

    try {
      const productResults = await productApi.list({
        search: searchQuery,
        limit: 5,
        active_only: false,
      });
      productResults.products.forEach((p) => {
        out.push({
          type: 'product',
          id: `product-${p.id}`,
          title: p.name,
          subtitle: `${formatPrice(p.price)} · Stock ${p.stock}`,
          icon: <Package className="w-4 h-4" />,
          href: `/admin/productos?search=${encodeURIComponent(p.name)}`,
        });
      });

      if (searchQuery.length >= 4) {
        try {
          const orderResults = await orderApi.listAll({ limit: 20 });
          orderResults.orders
            .filter((o) => o.id.toLowerCase().includes(q))
            .slice(0, 5)
            .forEach((o) => {
              out.push({
                type: 'order',
                id: `order-${o.id}`,
                title: `Orden #${o.id.slice(0, 8)}`,
                subtitle: `${formatPrice(o.total)} · ${o.status}`,
                icon: <FileText className="w-4 h-4" />,
                href: `/admin/ordenes/${o.id}`,
              });
            });
        } catch {}
      }
    } catch (error) {
      console.error('Palette search:', error);
    } finally {
      setIsSearching(false);
      setResults(out);
      setSelectedIndex(0);
    }
  }, [user, buildBaseResults]);

  useEffect(() => {
    const t = setTimeout(() => performSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, performSearch]);

  const executeAction = useCallback((result: SearchResult) => {
    if (query.trim()) {
      const next = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
      setRecentSearches(next);
      localStorage.setItem('admin-recent-searches', JSON.stringify(next));
    }
    if (result.perform) {
      result.perform();
      onClose();
      return;
    }
    if (result.href) {
      router.push(result.href);
      onClose();
    }
  }, [query, recentSearches, onClose, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((p) => (p + 1) % Math.max(results.length, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((p) => (p - 1 + results.length) % Math.max(results.length, 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) executeAction(results[selectedIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  if (!isOpen) return null;

  const TYPE_LABEL: Record<string, string> = {
    action: 'Acciones rápidas',
    navigation: 'Navegación',
    product: 'Productos',
    order: 'Órdenes',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />

      <div className="relative min-h-full flex items-start justify-center pt-[12vh] pb-20 px-4">
        <div
          className="relative w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: 'var(--admin-elevated)', border: '1px solid var(--admin-border-strong)' }}
        >
          <div className="flex items-center gap-3 px-4 border-b admin-hairline">
            <Search className="w-4 h-4 admin-text-subtle" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar productos, órdenes, acciones, páginas…"
              className="flex-1 py-3.5 bg-transparent focus:outline-none text-[14px]"
              style={{ color: 'var(--admin-text)' }}
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 admin-text-subtle hover:admin-text-muted rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="admin-kbd">ESC</kbd>
          </div>

          <div className="max-h-[55vh] overflow-y-auto py-1">
            {isSearching ? (
              <div className="px-4 py-8 text-center admin-text-muted">
                <div className="admin-spinner mx-auto mb-2" />
                <p className="text-[12.5px]">Buscando…</p>
              </div>
            ) : results.length > 0 ? (
              ['action', 'navigation', 'product', 'order'].map((type) => {
                const typeResults = results.filter((r) => r.type === type);
                if (typeResults.length === 0) return null;
                return (
                  <div key={type}>
                    <div className="px-4 py-1.5 admin-group-label sticky top-0" style={{ background: 'var(--admin-surface-2)' }}>
                      {TYPE_LABEL[type]}
                    </div>
                    {typeResults.map((r) => {
                      const idx = results.indexOf(r);
                      const sel = idx === selectedIndex;
                      return (
                        <button
                          key={r.id}
                          onClick={() => executeAction(r)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            sel ? 'bg-[color:var(--admin-accent-soft)]' : 'hover:bg-[color:var(--admin-surface-2)]'
                          }`}
                        >
                          <div className={sel ? 'text-[color:var(--admin-accent)]' : 'admin-text-muted'}>{r.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13.5px] ${sel ? 'font-semibold' : 'font-medium'}`} style={{ color: 'var(--admin-text)' }}>
                              {r.title}
                            </p>
                            {r.subtitle && (
                              <p className="text-[11.5px] admin-text-subtle truncate">{r.subtitle}</p>
                            )}
                          </div>
                          {sel && <ArrowRight className="w-3.5 h-3.5 text-[color:var(--admin-accent)]" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-10 text-center admin-text-muted text-[13px]">
                Sin resultados para &quot;{query}&quot;
              </div>
            )}

            {!query && recentSearches.length > 0 && (
              <div className="border-t admin-hairline mt-1 pt-1">
                <div className="px-4 py-1.5 admin-group-label">Búsquedas recientes</div>
                {recentSearches.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(s)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left admin-text-muted hover:bg-[color:var(--admin-surface-2)] text-[13px]"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t admin-hairline flex items-center justify-between text-[11px] admin-text-subtle">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><kbd className="admin-kbd">↑↓</kbd>navegar</span>
              <span className="flex items-center gap-1"><kbd className="admin-kbd">↵</kbd>seleccionar</span>
            </div>
            <span>{results.length} resultado{results.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
