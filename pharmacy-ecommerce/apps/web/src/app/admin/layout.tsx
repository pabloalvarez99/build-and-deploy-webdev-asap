'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { productApi, orderApi } from '@/lib/api';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';
import { Sidebar } from '@/components/admin/Sidebar';
import { CommandPalette } from '@/components/admin/CommandPalette';
import { NotificationBell } from '@/components/admin/NotificationBell';
import { Breadcrumbs } from '@/components/admin/Breadcrumbs';
import { ShortcutsHelp } from '@/components/admin/ShortcutsHelp';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingReservations, setPendingReservations] = useState(0);
  const [criticalStock, setCriticalStock] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Keyboard shortcuts
  useAdminShortcuts({
    onCommandPalette: () => setIsCommandPaletteOpen(true),
    onNewProduct: () => router.push('/admin/productos?action=new'),
    onShowHelp: () => setIsShortcutsHelpOpen(true),
  });

  // Load sidebar state
  useEffect(() => {
    const stored = localStorage.getItem('admin-sidebar-collapsed');
    if (stored) {
      setSidebarCollapsed(stored === 'true');
    }
  }, []);

  // Listen for sidebar collapse changes
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('admin-sidebar-collapsed');
      setSidebarCollapsed(stored === 'true');
    };
    window.addEventListener('storage', handleStorageChange);

    // Also check periodically for same-tab changes
    const interval = setInterval(handleStorageChange, 500);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Auth check
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  // Load stats for badges
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const loadStats = async () => {
      try {
        // Pending orders count
        const orders = await orderApi.list({ status: 'pending', limit: 1 });
        setPendingOrders(orders.total);

        // Pending reservations count
        const reservations = await orderApi.listAll({ status: 'reserved', limit: 1 });
        setPendingReservations(reservations.total);

        // Critical stock count
        const products = await productApi.list({ limit: 1000, active_only: true });
        const critical = products.products.filter((p) => p.stock <= 10).length;
        setCriticalStock(critical);
      } catch (error) {
        console.error('Error loading admin stats:', error);
      }
    };

    loadStats();
    // Refresh every minute
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Don't render until auth is confirmed
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar
        pendingOrders={pendingOrders}
        pendingReservations={pendingReservations}
        criticalStock={criticalStock}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main content */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Left side - breadcrumbs on larger screens */}
            <div className="flex-1 pl-12 lg:pl-0">
              <Breadcrumbs />
            </div>

            {/* Right side - notifications */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <span>Buscar...</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
                  ⌘K
                </kbd>
              </button>
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
