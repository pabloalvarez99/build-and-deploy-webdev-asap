'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { ShoppingCart, Package, LogIn, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function Navbar() {
  const router = useRouter();
  const { cart, fetchCartLocal } = useCartStore();
  const { user, logout, checkAuth, isLoading } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchCartLocal();
    checkAuth();
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchCartLocal, checkAuth]);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMenuOpen(false);
  };

  const itemCount = cart?.item_count || 0;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass-nav' : 'bg-white/50 backdrop-blur-sm border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-2 rounded-xl shadow-lg shadow-emerald-600/20 group-hover:shadow-emerald-600/30 transition-all duration-300 group-hover:scale-105">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
                Tu Farmacia
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider leading-none mt-0.5">
                Salud & Bienestar
              </span>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-6">
            
            {/* Auth Button */}
            {isLoading ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              </div>
            ) : user ? (
              <div className="relative group">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 py-2 px-3 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <span className="font-bold text-sm">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-700 hidden sm:block">
                    {user.name?.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                  <div className="px-4 py-3 border-b border-slate-50">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  
                  {user.role === 'admin' && (
                    <Link 
                      href="/admin/productos" 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <Package className="w-4 h-4" />
                      Panel Admin
                    </Link>
                  )}
                  
                  <Link 
                    href="/mis-pedidos" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <UserIcon className="w-4 h-4" />
                    Mis Pedidos
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors py-2 px-4 rounded-full hover:bg-emerald-50"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
              </Link>
            )}

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Cart Button */}
            <Link
              href="/carrito"
              className={`relative p-2.5 rounded-full transition-all duration-300 group ${
                pathname === '/carrito' 
                  ? 'bg-emerald-100 text-emerald-700 shadow-inner' 
                  : 'bg-white text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 hover:shadow-lg hover:shadow-emerald-500/20 border border-slate-200 hover:border-emerald-200'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md border-2 border-white transform group-hover:scale-110 transition-transform">
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
