'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { productApi, ProductWithCategory } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { ShoppingCart, Minus, Plus, Home, ChevronRight, Package, Truck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { addToCartLocal } = useCartStore();

  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  const loadProduct = async () => {
    try {
      const data = await productApi.get(slug);
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAdding(true);
    try {
      await addToCartLocal(product.id, quantity);
      router.push('/carrito');
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-64 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-10 bg-gray-200 rounded w-1/3" />
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Producto no encontrado</h1>
        <p className="text-gray-500 mb-8">El producto que buscas no existe o ha sido eliminado.</p>
        <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 overflow-hidden">
          <Link href="/" className="hover:text-emerald-600 flex items-center gap-1 transition-colors">
            <Home className="w-4 h-4" />
            Inicio
          </Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          {product.category_name && (
            <>
              <span className="hover:text-emerald-600 transition-colors cursor-pointer">
                {product.category_name}
              </span>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </>
          )}
          <span className="text-gray-900 font-medium truncate">
            {product.name}
          </span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Product Image */}
          <div className="aspect-square relative bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden flex items-center justify-center">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-contain p-8"
                priority
              />
            ) : (
              <Package className="w-32 h-32 text-gray-200" />
            )}
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <span className="text-red-600 font-bold border-4 border-red-600 px-8 py-4 rounded-xl text-2xl -rotate-12 uppercase tracking-widest shadow-lg bg-white/90">
                  Agotado
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              {product.laboratory && (
                <span className="text-emerald-600 font-semibold tracking-wide text-sm uppercase mb-2 block">
                  {product.laboratory}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(parseFloat(product.price))}
                </span>
              </div>
            </div>

            <div className="prose prose-sm text-gray-600 mb-8">
              <p>{product.description || "Sin descripción disponible."}</p>
            </div>

            <div className="border-t border-b border-gray-100 py-6 mb-8 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="p-2 bg-emerald-50 rounded-full text-emerald-600">
                  <Truck className="w-5 h-5" />
                </div>
                <span>Envío disponible a todo Chile</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span>Compra segura y garantía de calidad</span>
              </div>
            </div>

            {product.stock > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium">Cantidad:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-3 hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-12 text-center font-medium text-gray-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="p-3 hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <span className={`text-sm font-medium ${product.stock <= 10 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {product.stock <= 10 ? `¡Solo quedan ${product.stock}!` : `${product.stock} disponibles`}
                  </span>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full bg-emerald-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {isAdding ? 'Agregando...' : 'Agregar al carrito'}
                </button>
              </div>
            ) : (
              <button disabled className="w-full bg-gray-100 text-gray-400 py-4 px-8 rounded-xl font-semibold text-lg cursor-not-allowed">
                No disponible
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
