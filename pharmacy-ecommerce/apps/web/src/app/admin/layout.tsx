'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { productApi, orderApi, purchaseOrderApi } from '@/lib/api';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Menu } from 'lucide-react';
import { Sidebar } from '@/components/admin/Sidebar';
import { CommandPalette } from '@/components/admin/CommandPalette';
import { NotificationBell } from '@/components/admin/NotificationBell';
import { Breadcrumbs } from '@/components/admin/Breadcrumbs';
import { ShortcutsHelp } from '@/components/admin/ShortcutsHelp';

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
  const { theme, toggleTheme, mounted } = useTheme();

  // Keyboard shortcuts
  useAdminShortcuts({
    onCommandPalette: () => setIsCommandPaletteOpen(true),
    onNewProduct: () => router.push('/admin/productos?action=new'),
    onShowHelp: () => setIsShortcutsHelpOpen(true),
  });

  // Load sidebar state from localStorage (desktop only)
  useEffect(() => {
    const stored = localStorage.getItem('admin-sidebar-collapsed');
    if (stored) setSidebarCollapsed(stored === 'true');
  }, []);

  const handleSidebarToggle = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('admin-sidebar-collapsed', String(next));
  };

  // Auth check
  useEffect(() => {
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router, pathname]);

  // Load stats for badges
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

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

  // Don't render until auth is confirmed
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
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
      />

      {/* Main content */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Left side - hamburger (mobile) + breadcrumbs */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors shrink-0"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Breadcrumbs />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <span>Buscar...</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-600">
                  ⌘K
                </kbd>
              </button>
              {mounted && (
                <button
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewProduct={() => router.push('/admin/productos?action=new')}
      />

      {/* Shortcuts Help */}
      <ShortcutsHelp
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </div>
  );
}
