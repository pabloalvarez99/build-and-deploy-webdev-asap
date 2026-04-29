'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { productApi, orderApi, purchaseOrderApi } from '@/lib/api';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Menu, Search, Rows3, Rows4 } from 'lucide-react';
import { isAdminRole, roleLabel } from '@/lib/roles';
import { Sidebar } from '@/components/admin/Sidebar';
import { CommandPalette } from '@/components/admin/CommandPalette';
import { NotificationBell } from '@/components/admin/NotificationBell';
import { Breadcrumbs } from '@/components/admin/Breadcrumbs';
import { ShortcutsHelp } from '@/components/admin/ShortcutsHelp';
import './admin.css';

const PROD_HOSTS = ['tu-farmacia.cl', 'tu-farmacia.vercel.app'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingReservations, setPendingReservations] = useState(0);
  const [criticalStock, setCriticalStock] = useState(0);
  const [draftPurchaseOrders, setDraftPurchaseOrders] = useState(0);
  const [pendingFaltas, setPendingFaltas] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isProd, setIsProd] = useState(false);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const { theme, toggleTheme, mounted } = useTheme();

  useAdminShortcuts({
    onCommandPalette: () => setIsCommandPaletteOpen(true),
    onNewProduct: () => router.push('/admin/productos?action=new'),
    onShowHelp: () => setIsShortcutsHelpOpen(true),
  });

  useEffect(() => {
    const stored = localStorage.getItem('admin-sidebar-collapsed');
    if (stored) setSidebarCollapsed(stored === 'true');
    const storedDensity = localStorage.getItem('admin-density');
    if (storedDensity === 'compact' || storedDensity === 'comfortable') {
      setDensity(storedDensity);
    }
    if (typeof window !== 'undefined') {
      setIsProd(PROD_HOSTS.includes(window.location.hostname));
    }
  }, []);

  const toggleDensity = () => {
    const next = density === 'compact' ? 'comfortable' : 'compact';
    setDensity(next);
    localStorage.setItem('admin-density', next);
  };

  const handleSidebarToggle = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('admin-sidebar-collapsed', String(next));
  };

  useEffect(() => {
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isAdminRole(user.role)) {
      router.push('/');
    }
  }, [user, router, pathname]);

  useEffect(() => {
    if (!user || !isAdminRole(user.role)) return;
    const loadStats = async () => {
      try {
        const [orders, reservations, lowStock, outStock, draftPOs, faltasRes] = await Promise.all([
          orderApi.listAll({ status: 'pending', limit: 1 }),
          orderApi.listAll({ status: 'reserved', limit: 1 }),
          productApi.list({ limit: 1, active_only: true, stock_filter: 'low' }),
          productApi.list({ limit: 1, active_only: true, stock_filter: 'out' }),
          purchaseOrderApi.list({ status: 'draft', limit: 1 }),
          fetch('/api/admin/faltas?status=pending').then((r) => r.json()).catch(() => ({ pendingCount: 0 })),
        ]);
        setPendingOrders(orders.total);
        setPendingReservations(reservations.total);
        setCriticalStock(lowStock.total + outStock.total);
        setDraftPurchaseOrders(draftPOs.total);
        setPendingFaltas(faltasRes.pendingCount ?? 0);
      } catch (error) {
        console.error('Error loading admin stats:', error);
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user || !isAdminRole(user.role)) {
    return (
      <div data-admin="1" className="min-h-screen flex items-center justify-center admin-canvas">
        <div className="admin-spinner" />
      </div>
    );
  }

  const initials = (user.name || user.email || '?').slice(0, 2).toUpperCase();

  return (
    <div data-admin="1" data-density={density} className="min-h-screen admin-canvas">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
        pendingOrders={pendingOrders}
        pendingReservations={pendingReservations}
        criticalStock={criticalStock}
        draftPurchaseOrders={draftPurchaseOrders}
        pendingFaltas={pendingFaltas}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        role={user.role}
      />

      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        {/* Topbar */}
        <header
          className="sticky top-0 z-20 backdrop-blur-xl"
          style={{
            background: 'color-mix(in srgb, var(--admin-canvas) 78%, transparent)',
            borderBottom: '1px solid var(--admin-border)',
          }}
        >
          <div className="flex items-center gap-3 h-14 px-4 sm:px-6 lg:px-8">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg admin-text-muted hover:bg-[color:var(--admin-accent-soft)] transition-colors shrink-0"
              aria-label="Abrir menú"
            >
              <Menu className="w-[18px] h-[18px]" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex-1 min-w-0">
              <Breadcrumbs />
            </div>

            {/* Center search */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 h-9 w-[320px] xl:w-[420px] rounded-lg admin-text-muted text-[13px] transition-all"
              style={{
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border-strong)',
              }}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">Buscar productos, órdenes, clientes…</span>
              <kbd className="admin-kbd">⌘K</kbd>
            </button>

            {/* Right cluster */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isProd && (
                <span className="hidden sm:inline-flex admin-env-badge" title="Estás en producción">
                  Producción
                </span>
              )}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                  className="w-9 h-9 rounded-lg flex items-center justify-center admin-text-muted hover:bg-[color:var(--admin-accent-soft)] transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={toggleDensity}
                aria-label={density === 'compact' ? 'Densidad cómoda' : 'Densidad compacta'}
                title={density === 'compact' ? 'Densidad cómoda' : 'Densidad compacta'}
                className="hidden md:flex w-9 h-9 rounded-lg items-center justify-center admin-text-muted hover:bg-[color:var(--admin-accent-soft)] transition-colors"
              >
                {density === 'compact' ? <Rows3 className="w-4 h-4" /> : <Rows4 className="w-4 h-4" />}
              </button>
              <NotificationBell />
              <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l admin-hairline">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10.5px] font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-2))' }}
                  title={user.email}
                >
                  {initials}
                </div>
                <span className="text-[12px] admin-text-muted hidden lg:inline">
                  {roleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-10 admin-fade-in" key={pathname}>
          {children}
        </div>
      </main>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewProduct={() => router.push('/admin/productos?action=new')}
      />
      <ShortcutsHelp
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </div>
  );
}
