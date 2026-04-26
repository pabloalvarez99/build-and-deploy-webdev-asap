'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tags,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  BarChart2,
  Settings,
  Users,
  Truck,
  ClipboardList,
  Receipt,
  ArrowUpDown,
  Warehouse,
  Tag,
  Calculator,
  PackageSearch,
  TrendingUp,
  BookX,
  Database,
  CalendarClock,
  Scale,
  Star,
  RotateCcw,
  ClipboardCheck,
  X,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  pendingOrders?: number;
  pendingReservations?: number;
  criticalStock?: number;
  draftPurchaseOrders?: number;
  pendingFaltas?: number;
  onOpenCommandPalette?: () => void;
}

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/operaciones', icon: Activity, label: 'Operaciones' },
  { href: '/admin/pos', icon: Receipt, label: 'POS' },
  { href: '/admin/arqueo', icon: Calculator, label: 'Arqueo de Caja' },
  { href: '/admin/productos', icon: Package, label: 'Productos' },
  { href: '/admin/catalogo', icon: Database, label: 'Catálogo ERP' },
  { href: '/admin/ordenes', icon: ShoppingBag, label: 'Órdenes' },
  { href: '/admin/clientes', icon: Users, label: 'Clientes' },
  { href: '/admin/fidelidad', icon: Star, label: 'Fidelización' },
  { href: '/admin/categorias', icon: Tags, label: 'Categorías' },
  { href: '/admin/proveedores', icon: Truck, label: 'Proveedores' },
  { href: '/admin/compras', icon: ClipboardList, label: 'Compras' },
  { href: '/admin/compras/comparador', icon: Scale, label: 'Comparador' },
  { href: '/admin/descuentos', icon: Tag, label: 'Descuentos' },
  { href: '/admin/stock', icon: ArrowUpDown, label: 'Stock' },
  { href: '/admin/inventario', icon: Warehouse, label: 'Inventario' },
  { href: '/admin/catalogo-calidad', icon: ClipboardCheck, label: 'Calidad Catálogo' },
  { href: '/admin/reposicion', icon: PackageSearch, label: 'Reposición' },
  { href: '/admin/costos', icon: TrendingUp, label: 'Costos' },
  { href: '/admin/faltas', icon: BookX, label: 'Faltas' },
  { href: '/admin/devoluciones', icon: RotateCcw, label: 'Devoluciones' },
  { href: '/admin/vencimientos', icon: CalendarClock, label: 'Vencimientos' },
  { href: '/admin/reportes', icon: BarChart2, label: 'Reportes' },
  { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
];

export function Sidebar({
  isCollapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  pendingOrders = 0,
  pendingReservations = 0,
  criticalStock = 0,
  draftPurchaseOrders = 0,
  pendingFaltas = 0,
  onOpenCommandPalette,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // Close drawer on ESC
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onMobileClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileOpen, onMobileClose]);

  // Close drawer on route change
  useEffect(() => {
    onMobileClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const getBadge = (href: string) => {
    if (href === '/admin/ordenes') return { orders: pendingOrders, reservations: pendingReservations };
    if (href === '/admin/productos') return { stock: criticalStock };
    if (href === '/admin/compras') return { drafts: draftPurchaseOrders };
    if (href === '/admin/faltas') return { faltas: pendingFaltas };
    return null;
  };

  const NavItem = ({ item, collapsed }: { item: typeof navItems[0]; collapsed: boolean }) => {
    const active = isActive(item.href, item.exact);
    const badge = getBadge(item.href);
    const totalBadge = badge
      ? (badge.orders ?? 0) + (badge.reservations ?? 0) + (badge.stock ?? 0) + (badge.drafts ?? 0) + (badge.faltas ?? 0)
      : 0;

    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
          active
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
        } ${collapsed ? 'justify-center' : ''}`}
        title={collapsed ? item.label : undefined}
      >
        <div className="relative shrink-0">
          <item.icon className={`w-5 h-5 ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
          {collapsed && totalBadge > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
          )}
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 text-sm">{item.label}</span>
            {badge?.reservations != null && badge.reservations > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full">
                {badge.reservations}
              </span>
            )}
            {badge?.orders != null && badge.orders > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                {badge.orders}
              </span>
            )}
            {badge?.stock != null && badge.stock > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {badge.stock}
              </span>
            )}
            {badge?.drafts != null && badge.drafts > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                {badge.drafts}
              </span>
            )}
            {badge?.faltas != null && badge.faltas > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
                {badge.faltas}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  const sidebarContent = (collapsed: boolean, showClose = false) => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">Admin</span>
          </Link>
        )}
        {collapsed && <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto">
          <Package className="w-5 h-5 text-white" />
        </div>}
        {showClose && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {!showClose && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Command palette shortcut */}
      {!collapsed && onOpenCommandPalette && (
        <div className="px-3 py-3 shrink-0">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <span className="flex-1 text-left">Buscar...</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-600">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-2 shrink-0">
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {user.name || 'Admin'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Cerrar sesión</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent(false, true)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent(isCollapsed, false)}
      </aside>
    </>
  );
}
