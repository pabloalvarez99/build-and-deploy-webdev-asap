'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productApi, ProductWithCategory } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { ShoppingCart, Minus, Plus, Package, Truck, ShieldCheck, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { addToCart } = useCartStore();

  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

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
      await addToCart(product.id, quantity);
      setAdded(true);
      setTimeout(() => router.push('/carrito'), 800);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-100 rounded-xl w-32 mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="aspect-square bg-slate-100 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-5 bg-slate-100 rounded w-32" />
              <div className="h-8 bg-slate-100 rounded w-3/4" />
              <div className="h-10 bg-slate-100 rounded w-1/3" />
              <div className="h-24 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Producto no encontrado</h1>
        <p className="text-slate-500 mb-6 text-lg">El producto que buscas no existe o fue eliminado.</p>
        <Link href="/" className="btn btn-primary text-lg">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold mb-4 min-h-[56px] px-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Product Image */}
          <div className="aspect-square relative bg-slate-50 rounded-2xl border-2 border-slate-100 overflow-hidden flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain p-6"
              />
            ) : (
              <Package className="w-24 h-24 text-slate-200" />
            )}
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <span className="text-red-600 font-bold border-3 border-red-500 px-6 py-3 rounded-xl text-xl -rotate-6 bg-white">
                  AGOTADO
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-4">
              {product.laboratory && (
                <span className="text-emerald-600 font-semibold tracking-wide text-base mb-2 block">
                  {product.laboratory}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-3">
                {product.name}
              </h1>

              {/* Badges - Larger for elderly */}
              <div className="flex flex-wrap gap-2 mb-4">
                {product.prescription_type === 'direct' && (
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl text-base font-semibold bg-green-100 text-green-800">
                    Venta Directa
                  </span>
                )}
                {product.prescription_type === 'prescription' && (
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl text-base font-semibold bg-yellow-100 text-yellow-800">
                    Receta Medica
                  </span>
                )}
                {product.prescription_type === 'retained' && (
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl text-base font-semibold bg-red-100 text-red-800">
                    Receta Retenida
                  </span>
                )}
                {product.description && /Bioequivalente:\s*S[ií]/i.test(product.description) && (
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl text-base font-semibold bg-blue-100 text-blue-800">
                    Bioequivalente
                  </span>
                )}
                {product.category_name && product.category_slug && (
                  <Link
                    href={`/?category=${product.category_slug}`}
                    className="inline-flex items-center px-4 py-2 rounded-2xl text-base font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    {product.category_name}
                  </Link>
                )}
              </div>

              {/* Price - Extra large */}
              <span className="text-4xl font-black text-emerald-700 block">
                {formatPrice(parseFloat(product.price))}
              </span>
            </div>

            {/* Product info table - Larger text */}
            {(product.active_ingredient || product.presentation || product.therapeutic_action) && (
              <div className="mb-5 rounded-2xl border-2 border-slate-200 overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-slate-100">
                    {product.active_ingredient && (
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-500 bg-slate-50 w-40">Principio Activo</td>
                        <td className="px-4 py-3 text-slate-900">{product.active_ingredient}</td>
                      </tr>
                    )}
                    {product.presentation && (
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-500 bg-slate-50 w-40">Presentación</td>
                        <td className="px-4 py-3 text-slate-900">{product.presentation}</td>
                      </tr>
                    )}
                    {product.therapeutic_action && (
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-500 bg-slate-50 w-40">Acción Terapéutica</td>
                        <td className="px-4 py-3 text-slate-900">{product.therapeutic_action}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Shipping & security info - Larger text */}
            <div className="border-t-2 border-b-2 border-slate-100 py-5 mb-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-slate-700 font-medium">Envío disponible a todo Chile</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-slate-700 font-medium">Compra segura y garantia de calidad</span>
              </div>
            </div>

            {product.stock > 0 ? (
              <div className="space-y-5">
                {/* Quantity selector - Large buttons */}
                <div className="flex items-center gap-4">
                  <span className="text-slate-700 font-semibold text-lg">Cantidad:</span>
                  <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-14 h-14 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <Minus className="w-5 h-5 text-slate-600" />
                    </button>
                    <span className="w-16 text-center font-bold text-xl text-slate-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="w-14 h-14 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                  <span className={`text-base font-semibold ${product.stock <= 10 ? 'text-orange-600' : 'text-slate-400'}`}>
                    {product.stock <= 10 ? `Quedan ${product.stock}` : `${product.stock} disponibles`}
                  </span>
                </div>

                {/* Add to cart - Extra large button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || added}
                  className={`w-full py-5 px-8 rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-3 min-h-[64px] ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 active:scale-[0.98]'
                  } disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {added ? (
                    <>
                      <Check className="w-7 h-7" />
                      Agregado
                    </>
                  ) : isAdding ? (
                    'Agregando...'
                  ) : (
                    <>
                      <ShoppingCart className="w-6 h-6" />
                      Agregar al carrito
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="w-full py-5 px-8 rounded-2xl bg-slate-100 text-slate-400 text-center font-bold text-xl min-h-[64px] flex items-center justify-center">
                No disponible
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
