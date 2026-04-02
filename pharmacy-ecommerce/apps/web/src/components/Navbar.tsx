'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { ShoppingCart, Package, LogOut, User as UserIcon, Loader2, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { formatPrice } from '@/lib/format';

export function Navbar() {
  const router = useRouter();
  const { cart, fetchCart } = useCartStore();
  const { user, logout, checkAuth, isLoading } = useAuthStore();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme, mounted } = useTheme();

  useEffect(() => {
    fetchCart();
    checkAuth();
  }, [fetchCart, checkAuth]);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMenuOpen(false);
  };

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMenuOpen]);

  const itemCount = cart?.item_count || 0;

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b-2 border-slate-100 dark:border-slate-700 shadow-sm" role="navigation" aria-label="Principal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label="Tu Farmacia">
            {/* CSS div so the teal background auto-sizes to content (no empty space on any font/device) */}
            <div className="flex items-center gap-2 bg-[#0a8c8c] px-3 py-2 rounded-xl">
              {/* Circle + cross icon */}
              <svg width="34" height="34" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="18" cy="18" r="16" fill="none" stroke="white" strokeWidth="2.5" />
                {/* Vertical bar 19×5 centered at (18,18) */}
                <rect x="15.5" y="8.5" width="5" height="19" rx="1.5" fill="white" />
                {/* Horizontal bar 19×5 centered at (18,18) */}
                <rect x="8.5" y="15.5" width="19" height="5" rx="1.5" fill="white" />
              </svg>
              {/* Brand text — native CSS font, width adapts to actual rendered text */}
              <span
                className="text-white font-black text-lg tracking-wide leading-none whitespace-nowrap"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
              >
                TU FARMACIA
              </span>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark'
                  ? <Sun className="w-5 h-5" />
                  : <Moon className="w-5 h-5" />
                }
              </button>
            )}

            {/* Auth */}
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[56px] min-w-[56px] justify-center"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                  aria-label="Menú de usuario"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                </button>

                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-slate-100 dark:border-slate-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                        <p className="text-base text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>

                      {user.role === 'admin' && (
                        <Link
                          href="/admin/productos"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3.5 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors min-h-[56px]"
                        >
                          <Package className="w-5 h-5" />
                          Panel Admin
                        </Link>
                      )}

                      <Link
                        href="/mis-pedidos"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors min-h-[56px]"
                      >
                        <UserIcon className="w-5 h-5" />
                        Mis Pedidos
                      </Link>

                      <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors min-h-[56px]"
                        >
                          <LogOut className="w-5 h-5" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[56px] min-w-[56px] justify-center"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
              </Link>
            )}

            {/* Cart Button */}
            <Link
              href="/carrito"
              aria-label={`Carrito${itemCount > 0 ? `, ${itemCount} producto${itemCount > 1 ? 's' : ''}` : ''}`}
              className={`relative flex items-center gap-2 px-4 py-3 rounded-2xl transition-all font-bold min-h-[56px] ${
                pathname === '/carrito'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 ? (
                <span className="text-base">{itemCount}</span>
              ) : (
                <span className="text-base hidden sm:inline">Carrito</span>
              )}
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
