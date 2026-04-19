'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface SidebarProps {
  pendingOrders?: number;
  pendingReservations?: number;
  criticalStock?: number;
  draftPurchaseOrders?: number;
  onOpenCommandPalette?: () => void;
}

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/pos', icon: Receipt, label: 'POS' },
  { href: '/admin/arqueo', icon: Calculator, label: 'Arqueo de Caja' },
  { href: '/admin/productos', icon: Package, label: 'Productos' },
  { href: '/admin/ordenes', icon: ShoppingBag, label: 'Órdenes' },
  { href: '/admin/clientes', icon: Users, label: 'Clientes' },
  { href: '/admin/categorias', icon: Tags, label: 'Categorías' },
  { href: '/admin/proveedores', icon: Truck, label: 'Proveedores' },
  { href: '/admin/compras', icon: ClipboardList, label: 'Compras' },
  { href: '/admin/descuentos', icon: Tag, label: 'Descuentos' },
  { href: '/admin/stock', icon: ArrowUpDown, label: 'Stock' },
  { href: '/admin/inventario', icon: Warehouse, label: 'Inventario' },
  { href: '/admin/reposicion', icon: PackageSearch, label: 'Reposición' },
  { href: '/admin/reportes', icon: BarChart2, label: 'Reportes' },
  { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
];

export function Sidebar({ pendingOrders = 0, pendingReservations = 0, criticalStock = 0, draftPurchaseOrders = 0, onOpenCommandPalette }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('admin-sidebar-collapsed');
    if (stored) {
      setIsCollapsed(stored === 'true');
    }
  }, []);

  const handleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('admin-sidebar-collapsed', String(newState));
    window.dispatchEvent(new CustomEvent('sidebar-collapse', { detail: newState }));
  };

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo / Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700">
        {!isCollapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">Admin</span>
          </Link>
        )}
        <button
          onClick={handleCollapse}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hidden lg:flex"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Command Palette shortcut */}
      {!isCollapsed && onOpenCommandPalette && (
        <div className="px-3 py-3">
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
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const showBadge = item.href === '/admin/ordenes' && pendingOrders > 0;
          const showReservationBadge = item.href === '/admin/ordenes' && pendingReservations > 0;
          const showStockBadge = item.href === '/admin/productos' && criticalStock > 0;
          const showDraftPOBadge = item.href === '/admin/compras' && draftPurchaseOrders > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {showReservationBadge && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full">
                      {pendingReservations}
                    </span>
                  )}
                  {showBadge && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                      {pendingOrders}
                    </span>
                  )}
                  {showStockBadge && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {criticalStock}
                    </span>
                  )}
                  {showDraftPOBadge && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                      {draftPurchaseOrders}
                    </span>
                  )}
                </>
              )}
              {isCollapsed && (showBadge || showReservationBadge) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-2">
        {/* User info */}
        {user && !isCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
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

        {/* Logout */}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile bottom navigation bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700 flex items-stretch h-16">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const hasBadge =
            (item.href === '/admin/ordenes' && (pendingOrders > 0 || pendingReservations > 0)) ||
            (item.href === '/admin/productos' && criticalStock > 0) ||
            (item.href === '/admin/compras' && draftPurchaseOrders > 0);
          const badgeCount =
            item.href === '/admin/ordenes'
              ? pendingOrders + pendingReservations
              : item.href === '/admin/productos'
              ? criticalStock
              : item.href === '/admin/compras'
              ? draftPurchaseOrders
              : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 relative transition-colors ${
                active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-b-full" />
              )}
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {hasBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-tight ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
