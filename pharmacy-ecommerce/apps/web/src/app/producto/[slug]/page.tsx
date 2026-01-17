'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { productApi, ProductWithCategory } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { ShoppingCart, Minus, Plus, Home, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { ProductCard } from '@/components/ProductCard';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { addToCartLocal } = useCartStore();

  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductWithCategory[]>([]);
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

      // Load related products from same category
      if (data.category_slug) {
        const related = await productApi.list({
          category: data.category_slug,
          limit: 5,
        });
        // Filter out current product
        setRelatedProducts(related.products.filter(p => p.id !== data.id).slice(0, 4));
      }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Producto no encontrado</h1>
        <Link href="/" className="btn btn-primary">
          Volver al catalogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-primary-600 flex items-center gap-1">
          <Home className="w-4 h-4" />
          Inicio
        </Link>
        <ChevronRight className="w-4 h-4" />
        {product.category_name && (
          <>
            <Link
              href={`/?category=${product.category_slug}`}
              className="hover:text-primary-600"
            >
              {product.category_name}
            </Link>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
        <span className="text-gray-900 font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square relative bg-gray-100 rounded-xl overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 p-8 text-center">
              {product.name}
            </div>
          )}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-2xl font-semibold">Agotado</span>
            </div>
          )}
        </div>

        <div>
          {product.category_name && (
            <Link
              href={`/?category=${product.category_slug}`}
              className="text-sm text-primary-600 font-medium uppercase tracking-wide hover:underline"
            >
              {product.category_name}
            </Link>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>

          {product.laboratory && (
            <p className="text-gray-500 mt-1">
              Laboratorio: <span className="font-medium">{product.laboratory}</span>
            </p>
          )}

          <p className="text-4xl font-bold text-primary-600 mt-4">
            {formatPrice(product.price)}
          </p>

          {product.description && (
            <p className="text-gray-600 mt-6 leading-relaxed">{product.description}</p>
          )}

          <div className="mt-8 space-y-4">
            {product.stock > 0 ? (
              <>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 font-medium">Cantidad:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="btn btn-primary w-full flex items-center justify-center space-x-2 py-3 text-lg disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isAdding ? 'Agregando...' : 'Agregar al carrito'}</span>
                </button>

                <p className="text-sm text-gray-500 text-center">
                  {product.stock} unidades disponibles
                </p>

                {product.stock <= 10 && (
                  <p className="text-sm text-orange-600 text-center font-medium">
                    ¡Ultimas unidades!
                  </p>
                )}
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600 font-medium">Producto agotado</p>
                <p className="text-red-500 text-sm mt-1">
                  Este producto no esta disponible actualmente
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
