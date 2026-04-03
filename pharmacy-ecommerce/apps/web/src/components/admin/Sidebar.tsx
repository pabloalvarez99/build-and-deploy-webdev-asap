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
} from 'lucide-react';

interface SidebarProps {
  pendingOrders?: number;
  pendingReservations?: number;
  criticalStock?: number;
  onOpenCommandPalette?: () => void;
}

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/productos', icon: Package, label: 'Productos' },
  { href: '/admin/ordenes', icon: ShoppingBag, label: 'Órdenes' },
  { href: '/admin/clientes', icon: Users, label: 'Clientes' },
  { href: '/admin/categorias', icon: Tags, label: 'Categorías' },
  { href: '/admin/reportes', icon: BarChart2, label: 'Reportes' },
  { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
];

export function Sidebar({ pendingOrders = 0, pendingReservations = 0, criticalStock = 0, onOpenCommandPalette }: SidebarProps) {
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
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
        {!isCollapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">Admin</span>
          </Link>
        )}
        <button
          onClick={handleCollapse}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hidden lg:flex"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Command Palette shortcut */}
      {!isCollapsed && onOpenCommandPalette && (
        <div className="px-3 py-3">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <span className="flex-1 text-left">Buscar...</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-white rounded border border-slate-300">
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

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-emerald-600' : ''}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {showReservationBadge && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                      {pendingReservations}
                    </span>
                  )}
                  {showBadge && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-800 rounded-full">
                      {pendingOrders}
                    </span>
                  )}
                  {showStockBadge && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {criticalStock}
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
      <div className="border-t border-slate-200 p-3 space-y-2">
        {/* User info */}
        {user && !isCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user.name || 'Admin'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors ${
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-slate-200 flex items-stretch h-16">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const hasBadge =
            (item.href === '/admin/ordenes' && (pendingOrders > 0 || pendingReservations > 0)) ||
            (item.href === '/admin/productos' && criticalStock > 0);
          const badgeCount =
            item.href === '/admin/ordenes'
              ? pendingOrders + pendingReservations
              : item.href === '/admin/productos'
              ? criticalStock
              : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 relative transition-colors ${
                active ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
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
              <span className={`text-[10px] font-medium leading-tight ${active ? 'text-emerald-600' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-slate-200 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
