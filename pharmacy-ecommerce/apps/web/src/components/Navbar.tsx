'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { ShoppingCart, Package, LogIn, LogOut, User as UserIcon, Loader2, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function Navbar() {
  const router = useRouter();
  const { cart, fetchCart } = useCartStore();
  const { user, logout, checkAuth, isLoading } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchCart();
    checkAuth();
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchCart, checkAuth]);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMenuOpen(false);
  };

  const itemCount = cart?.item_count || 0;

  const mapsUrl = "https://www.google.com/maps/place/Tu+Farmacia/@-29.9574998,-71.3444193,17z/data=!3m1!4b1!4m6!3m5!1s0x9691c97785be7a51:0x782772c0d879d678!8m2!3d-29.9575045!4d-71.3395484!16s%2Fg%2F11vb39mtcl";

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-100' 
        : 'bg-white border-b border-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo + Dirección */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-600/25 group-hover:shadow-emerald-600/40 transition-all duration-300 group-hover:scale-105">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
                Tu Farmacia
              </span>
              <a 
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-600 transition-colors mt-0.5"
              >
                <MapPin className="w-3 h-3" />
                <span>Jose Santiago Aldunate 1535, Coquimbo</span>
              </a>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Auth Section */}
            {isLoading ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              </div>
            ) : user ? (
              <div className="relative group">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-md">
                    <span className="font-bold text-sm">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-semibold text-slate-800 leading-tight">
                      {user.name?.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight">Mi cuenta</span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  
                  {user.role === 'admin' && (
                    <Link 
                      href="/admin/productos" 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      Panel Admin
                    </Link>
                  )}
                  
                  <Link 
                    href="/mis-pedidos" 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    Mis Pedidos
                  </Link>
                  
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 text-sm font-semibold bg-emerald-600 text-white py-2.5 px-5 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
                <span className="sm:hidden">Entrar</span>
              </Link>
            )}

            {/* Divider */}
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            {/* Cart Button */}
            <Link
              href="/carrito"
              className={`relative p-3 rounded-xl transition-all duration-300 group ${
                pathname === '/carrito' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg border-2 border-white transform group-hover:scale-110 transition-transform animate-pulse">
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
