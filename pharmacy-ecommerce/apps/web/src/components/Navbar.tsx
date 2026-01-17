'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { ShoppingCart, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { cart, fetchCartLocal } = useCartStore();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetchCartLocal();
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchCartLocal]);

  const itemCount = cart?.item_count || 0;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-200 ${
      scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50' : 'bg-white border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-emerald-600 text-white p-1.5 rounded-lg group-hover:bg-emerald-700 transition-colors">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-emerald-600 transition-colors">
              Tu Farmacia
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/carrito"
              className={`relative p-2 rounded-full transition-all duration-200 ${
                pathname === '/carrito' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-gray-500 hover:text-emerald-600 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm border-2 border-white">
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
