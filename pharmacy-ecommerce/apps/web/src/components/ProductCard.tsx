'use client';

import Link from 'next/link';
import { ProductWithCategory } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '@/lib/format';

interface ProductCardProps {
  product: ProductWithCategory;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCartLocal } = useCartStore();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await addToCartLocal(product.id);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Link href={`/producto/${product.slug}`} className="group">
      <div className="card overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="aspect-square relative bg-white p-4">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm p-4 text-center">
              <span className="opacity-50">Sin imagen</span>
            </div>
          )}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
              <span className="text-red-600 font-bold border-2 border-red-600 px-4 py-2 rounded-lg -rotate-12">
                AGOTADO
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          {product.category_name && (
            <span className="text-xs text-primary-600 font-medium uppercase tracking-wide">
              {product.category_name}
            </span>
          )}
          {product.laboratory && (
            <span className="text-xs text-gray-500 block mt-0.5">
              {product.laboratory}
            </span>
          )}
          <h3 className="font-semibold text-gray-900 mt-1 group-hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xl font-bold text-primary-600">
              {formatPrice(product.price)}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || isAdding}
              className="btn btn-primary flex items-center space-x-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isAdding ? '...' : 'Agregar'}</span>
            </button>
          </div>

          {product.stock > 0 && product.stock <= 10 && (
            <p className="text-xs text-orange-600 mt-2">
              Solo quedan {product.stock} unidades
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
