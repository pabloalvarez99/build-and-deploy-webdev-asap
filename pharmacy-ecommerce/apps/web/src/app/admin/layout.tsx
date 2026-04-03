'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
 const pathname = usePathname();
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
 const handleSidebarEvent = (e: Event) => {
 setSidebarCollapsed((e as CustomEvent).detail);
 };
 window.addEventListener('storage', handleStorageChange);
 window.addEventListener('sidebar-collapse', handleSidebarEvent);
 return () => {
 window.removeEventListener('storage', handleStorageChange);
 window.removeEventListener('sidebar-collapse', handleSidebarEvent);
 };
 }, []);

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
 const [orders, reservations, lowStock, outStock] = await Promise.all([
 orderApi.listAll({ status: 'pending', limit: 1 }),
 orderApi.listAll({ status: 'reserved', limit: 1 }),
 productApi.list({ limit: 1, active_only: true, stock_filter: 'low' }),
 productApi.list({ limit: 1, active_only: true, stock_filter: 'out' }),
 ]);
 setPendingOrders(orders.total);
 setPendingReservations(reservations.total);
 setCriticalStock(lowStock.total + outStock.total);
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
 <div className="min-h-screen flex items-center justify-center bg-slate-50">
 <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-slate-50">
 {/* Sidebar */}
 <Sidebar
 pendingOrders={pendingOrders}
 pendingReservations={pendingReservations}
 criticalStock={criticalStock}
 onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
 />

 {/* Main content */}
 <main
 className={`min-h-screen transition-all duration-300 pb-16 lg:pb-0 ${
 sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
 }`}
 >
 {/* Top bar */}
 <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200">
 <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
 {/* Left side - breadcrumbs */}
 <div className="flex-1">
 <Breadcrumbs />
 </div>

 {/* Right side - notifications */}
 <div className="flex items-center gap-2">
 <button
 onClick={() => setIsCommandPaletteOpen(true)}
 className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
 >
 <span>Buscar...</span>
 <kbd className="px-1.5 py-0.5 text-xs bg-white rounded border border-slate-300">
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
