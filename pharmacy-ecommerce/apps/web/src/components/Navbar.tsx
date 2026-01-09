'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { ShoppingCart } from 'lucide-react';
import { useEffect } from 'react';

export function Navbar() {
  const { cart, fetchCartLocal } = useCartStore();

  useEffect(() => {
    fetchCartLocal();
  }, [fetchCartLocal]);

  const itemCount = cart?.item_count || 0;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary-600">Tu Farmacia</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/carrito"
              className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
