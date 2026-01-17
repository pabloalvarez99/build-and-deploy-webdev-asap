'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { ShoppingCart, Package, LogIn, LogOut, User as UserIcon, Loader2, MapPin, ExternalLink } from 'lucide-react';
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
    <div className="sticky top-0 z-50">
      {/* Top Bar - Dirección */}
      <div className="bg-primary-900/30 border-b border-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-transparent to-primary-600/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center sm:justify-between items-center h-8 text-xs font-medium">
            <a 
              href="https://www.google.com/maps/place/Tu+Farmacia/@-29.9574998,-71.3444193,17z/data=!3m1!4b1!4m6!3m5!1s0x9691c97785be7a51:0x782772c0d879d678!8m2!3d-29.9575045!4d-71.3395484!16s%2Fg%2F11vb39mtcl?entry=ttu&g_ep=EgoyMDI2MDExMy4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary-300 hover:text-white transition-colors group"
            >
              <MapPin className="w-3 h-3 group-hover:animate-bounce" />
              <span>Jose Santiago Aldunate 1535</span>
              <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
            </a>
            <span className="hidden sm:block text-slate-500">
              Envíos a todo Chile 🇨🇱
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={`transition-all duration-300 border-b border-white/5 ${
        scrolled ? 'bg-background/80 backdrop-blur-xl shadow-lg shadow-black/20' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group relative">
              <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gradient-to-br from-primary-500 to-primary-700 text-white p-2 rounded-xl shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300 border border-white/10">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex flex-col relative">
                <span className="text-lg font-bold text-white tracking-tight leading-none group-hover:text-primary-400 transition-colors">
                  Tu Farmacia
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none mt-0.5">
                  Salud & Bienestar
                </span>
              </div>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-3 sm:gap-6">
              
              {/* Auth Button */}
              {isLoading ? (
                <div className="w-8 h-8 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                </div>
              ) : user ? (
                <div className="relative group">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 py-2 px-3 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-300 flex items-center justify-center border border-primary-500/30">
                      <span className="font-bold text-sm">
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-300 hidden sm:block group-hover:text-white transition-colors">
                      {user.name?.split(' ')[0]}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50 backdrop-blur-3xl">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    
                    {user.role === 'admin' && (
                      <Link 
                        href="/admin/productos" 
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-primary-400 transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        Panel Admin
                      </Link>
                    )}
                    
                    <Link 
                      href="/mis-pedidos" 
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-primary-400 transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      Mis Pedidos
                    </Link>
                    
                    <div className="border-t border-border my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors py-2 px-4 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                </Link>
              )}

              <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

              {/* Cart Button */}
              <Link
                href="/carrito"
                className={`relative p-2.5 rounded-full transition-all duration-300 group border ${
                  pathname === '/carrito' 
                    ? 'bg-primary-500/20 text-primary-400 border-primary-500/50' 
                    : 'bg-transparent text-slate-400 border-transparent hover:border-white/10 hover:bg-white/5 hover:text-white'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-primary-500/30 border-2 border-background transform group-hover:scale-110 transition-transform">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
