'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { ShoppingCart, Package, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
// Package kept for admin menu item below
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/format';

export function Navbar() {
  const router = useRouter();
  const { cart, fetchCart } = useCartStore();
  const { user, logout, checkAuth, isLoading } = useAuthStore();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchCart();
    checkAuth();
  }, [fetchCart, checkAuth]);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMenuOpen(false);
  };

  const itemCount = cart?.item_count || 0;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-2 border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Fila 1: Logo + Usuario + Carrito */}
        <div className="flex justify-between items-center h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <svg
              viewBox="0 0 252 52"
              height="44"
              width="213"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Tu Farmacia"
            >
              {/* Background */}
              <rect width="252" height="52" rx="9" fill="#0a8c8c" />
              {/* Circle */}
              <circle cx="31" cy="26" r="17" fill="none" stroke="white" strokeWidth="2.5" />
              {/* Cross: vertical bar — center (31,26), 18×7 */}
              <rect x="27.5" y="17" width="7" height="18" rx="1.5" fill="white" />
              {/* Cross: horizontal bar — same 18 length, 7 thick */}
              <rect x="22" y="22.5" width="18" height="7" rx="1.5" fill="white" />
              {/* TU FARMACIA text */}
              <text
                x="57"
                y="34"
                fontFamily="'Arial Black', Arial, sans-serif"
                fontWeight="900"
                fontSize="21"
                fill="white"
                letterSpacing="1"
              >TU FARMACIA</text>
            </svg>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Auth */}
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 transition-colors min-h-[56px] min-w-[56px] justify-center"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                </button>

                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-slate-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-base text-slate-500">{user.email}</p>
                      </div>

                      {user.role === 'admin' && (
                        <Link
                          href="/admin/productos"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors min-h-[56px]"
                        >
                          <Package className="w-5 h-5" />
                          Panel Admin
                        </Link>
                      )}

                      <Link
                        href="/mis-pedidos"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors min-h-[56px]"
                      >
                        <UserIcon className="w-5 h-5" />
                        Mis Pedidos
                      </Link>

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-red-600 hover:bg-red-50 text-left transition-colors min-h-[56px]"
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
                className="flex items-center gap-2 p-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors min-h-[56px] min-w-[56px] justify-center"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
              </Link>
            )}

            {/* Cart Button - Grande y claro */}
            <Link
              href="/carrito"
              className={`relative flex items-center gap-2 px-4 py-3 rounded-2xl transition-all font-bold min-h-[56px] ${
                pathname === '/carrito'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 ? (
                <span className="text-base">{itemCount}</span>
              ) : (
                <span className="text-base hidden sm:inline">Carrito</span>
              )}
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
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
