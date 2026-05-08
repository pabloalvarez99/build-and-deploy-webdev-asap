'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package, ShoppingCart, Check } from 'lucide-react';
import { Product } from '@/lib/api';
import { formatPrice, discountedPrice } from '@/lib/format';

interface Props {
  product: Product;
  index?: number;
  adding: boolean;
  onAdd: (p: Product) => void;
  brokenImg: boolean;
  onImgError: (id: string) => void;
}

export function ProductCard({ product, index = 0, adding, onAdd, brokenImg, onImgError }: Props) {
  const finalPrice = product.discount_percent
    ? discountedPrice(Number(product.price), product.discount_percent)
    : Number(product.price);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col hover:border-cyan-200 dark:hover:border-cyan-800 hover:shadow-md transition-all group">
      <Link href={`/producto/${product.slug}`} className="block">
        <div className="aspect-square bg-slate-50 dark:bg-slate-800 relative overflow-hidden">
          {product.image_url && !brokenImg ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
              priority={index < 3}
              fetchPriority={index < 3 ? 'high' : 'auto'}
              onError={() => onImgError(product.id)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-10 h-10 text-slate-200 dark:text-slate-700" />
            </div>
          )}
          {product.discount_percent && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
              -{product.discount_percent}% OFF
            </div>
          )}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 font-bold text-base border-2 border-red-500 dark:border-red-700 px-3 py-1 rounded-xl -rotate-6 bg-white dark:bg-slate-900">
                AGOTADO
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link href={`/producto/${product.slug}`}>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug line-clamp-2 mb-1 min-h-[3rem] hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.laboratory && (
          <span className="text-xs text-slate-400 dark:text-slate-500 mb-3 truncate">{product.laboratory}</span>
        )}

        <div className="mt-auto">
          {product.discount_percent && (
            <span className="font-mono text-xs text-slate-400 line-through block">{formatPrice(product.price)}</span>
          )}
          <span className="font-mono text-xl font-black text-emerald-700 dark:text-emerald-400 block mb-2">
            {formatPrice(finalPrice)}
          </span>

          {product.stock > 0 ? (
            <button
              onClick={() => onAdd(product)}
              disabled={adding}
              aria-label={`Agregar ${product.name} al carrito`}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base transition-all min-h-[48px] ${
                adding ? 'bg-cyan-600 text-white scale-95' : 'bg-cyan-600 text-white hover:bg-cyan-700 active:scale-95'
              }`}
            >
              {adding ? <Check className="w-5 h-5" /> : (<><ShoppingCart className="w-4 h-4" /><span>Agregar</span></>)}
            </button>
          ) : (
            <div className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-center font-semibold text-sm min-h-[48px] flex items-center justify-center">
              Sin stock
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
