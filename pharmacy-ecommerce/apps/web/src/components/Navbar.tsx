'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { ShoppingCart, Package, LogOut, User as UserIcon, Loader2, Sun, Moon, Star, ChevronDown, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { formatPrice } from '@/lib/format';

function PharmacyLogo({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Link href={isAdmin ? '/admin/productos' : '/'} className="flex items-center gap-2.5 group" aria-label="Tu Farmacia">
      {/* Logomark */}
      <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden transition-shadow ${isAdmin ? 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:shadow-slate-500/40' : 'bg-gradient-to-br from-cyan-600 to-cyan-500 group-hover:shadow-cyan-500/40'}`}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <rect x="9" y="2" width="4" height="18" rx="1.5" fill="white" />
          <rect x="2" y="9" width="18" height="4" rx="1.5" fill="white" />
        </svg>
        <span className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ring-1 ring-white/80 ${isAdmin ? 'bg-amber-400' : 'bg-lime-400'}`} />
      </div>
      {/* Wordmark */}
      <div className="leading-none">
        <div className="text-slate-900 dark:text-white font-black text-base tracking-tight">
          <span className="text-slate-400 dark:text-slate-500 font-semibold">tu</span
          ><span className={isAdmin ? 'text-slate-700 dark:text-slate-300' : 'text-cyan-600 dark:text-cyan-400'}>farmacia</span>
        </div>
        {isAdmin && (
          <div className="text-[9px] font-mono text-slate-400 dark:text-slate-600 tracking-widest uppercase mt-0.5">
            Sistema de Gestión
          </div>
        )}
      </div>
    </Link>
  );
}

export function Navbar() {
  const router = useRouter();
  const { cart, fetchCart } = useCartStore();
  const { user, logout, checkAuth, isLoading } = useAuthStore();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme, mounted } = useTheme();
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);

  useEffect(() => {
    fetchCart();
    checkAuth();
  }, [fetchCart, checkAuth]);

  useEffect(() => {
    if (!user || user.role === 'admin') { setLoyaltyPoints(null); return; }
    fetch('/api/loyalty')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setLoyaltyPoints(data.points ?? 0); })
      .catch(() => {});
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) setIsMenuOpen(false);
    };
    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMenuOpen]);

  const itemCount = cart?.item_count || 0;
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-xl border-b shadow-sm ${
        isAdmin
          ? 'bg-slate-900/98 dark:bg-slate-950/98 border-slate-700/60'
          : 'bg-white/95 dark:bg-slate-950/95 border-slate-200/80 dark:border-slate-800/80'
      }`}
      role="navigation"
      aria-label="Principal"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-3">
          <PharmacyLogo isAdmin={!!isAdmin} />

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Admin breadcrumb */}
            {isAdmin && (
              <span className="hidden sm:block text-xs font-mono text-slate-500 mr-2 select-none">
                {pathname?.replace('/admin/', '').replace('/admin', 'inicio')}
              </span>
            )}

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  isAdmin
                    ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Auth */}
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-500 mx-1" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors min-h-[36px] ${
                    isAdmin ? 'hover:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                  aria-label="Menú de usuario"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                    isAdmin
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-400'
                  }`}>
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  {isAdmin && <span className="hidden sm:block text-sm font-medium text-slate-300 max-w-[100px] truncate">{user.name}</span>}
                  <ChevronDown className={`w-3 h-3 transition-transform hidden sm:block ${isAdmin ? 'text-slate-500' : 'text-slate-400'} ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                    <div className={`absolute right-0 mt-2 w-64 max-w-[calc(100vw-1rem)] rounded-2xl shadow-2xl py-2 z-50 ${
                      isAdmin
                        ? 'bg-slate-800 border border-slate-700'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                    }`}>
                      <div className={`px-4 py-3 border-b ${isAdmin ? 'border-slate-700' : 'border-slate-100 dark:border-slate-800'}`}>
                        <p className={`font-bold text-base ${isAdmin ? 'text-slate-100' : 'text-slate-900 dark:text-slate-100'}`}>{user.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                        {loyaltyPoints !== null && (
                          <div className="flex items-center gap-1.5 mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-2.5 py-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 flex-shrink-0" />
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{loyaltyPoints} punto{loyaltyPoints !== 1 ? 's' : ''}</span>
                            {loyaltyPoints > 0 && (
                              <span className="text-xs text-amber-600 dark:text-amber-500 ml-0.5">= {formatPrice(loyaltyPoints * 100)} desc.</span>
                            )}
                          </div>
                        )}
                      </div>

                      {user.role === 'admin' && !isAdmin && (
                        <Link
                          href="/admin/productos"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors min-h-[48px] text-base"
                        >
                          <Package className="w-4 h-4" />
                          Panel Admin
                        </Link>
                      )}

                      {user.role === 'admin' && isAdmin && (
                        <Link
                          href="/"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors min-h-[48px] text-base"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Ver tienda
                        </Link>
                      )}

                      {!isAdmin && (
                        <>
                          <Link
                            href="/mi-cuenta"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors min-h-[48px] text-base"
                          >
                            <UserCircle className="w-4 h-4" />
                            Mi Cuenta
                          </Link>
                          <Link
                            href="/mis-pedidos"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors min-h-[48px] text-base"
                          >
                            <UserIcon className="w-4 h-4" />
                            Mis Pedidos
                          </Link>
                        </>
                      )}

                      <div className={`border-t mt-1 pt-1 ${isAdmin ? 'border-slate-700' : 'border-slate-100 dark:border-slate-800'}`}>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 text-left transition-colors min-h-[48px] text-base"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  href="/rastrear-pedido"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Rastrear pedido"
                >
                  <Package className="w-4 h-4" />
                  <span>Rastrear</span>
                </Link>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[36px]"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">Ingresar</span>
                </Link>
              </div>
            )}

            {/* Cart — hidden in admin */}
            {!isAdmin && (
              <Link
                href="/carrito"
                aria-label={`Carrito${itemCount > 0 ? `, ${itemCount} producto${itemCount > 1 ? 's' : ''}` : ''}`}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all font-semibold text-sm min-h-[36px] ${
                  pathname === '/carrito'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/50'
                }`}
              >
                <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                {itemCount > 0 ? (
                  <span className="font-mono text-sm">{itemCount}</span>
                ) : (
                  <span className="text-sm hidden sm:inline">Carrito</span>
                )}
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
