'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productApi, ProductWithCategory, Product } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { ShoppingCart, Minus, Plus, Package, Truck, ShieldCheck, ArrowLeft, Check, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, discountedPrice } from '@/lib/format';

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
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  // Dynamic page title
  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Tu Farmacia`;
    }
    return () => { document.title = 'Tu Farmacia - Farmacia online en Coquimbo, Chile'; };
  }, [product]);

  const loadProduct = async () => {
    try {
      const data = await productApi.get(slug);
      setProduct(data);
      // Load related products from same category
      if (data.category_slug) {
        productApi.list({ category: data.category_slug, limit: 5, in_stock: true }).then(res => {
          setRelatedProducts(res.products.filter(p => p.slug !== slug).slice(0, 4));
        }).catch(() => {});
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
          <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded-xl w-32 mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded w-32" />
              <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-24 bg-slate-100 dark:bg-slate-700 rounded-xl" />
              <div className="h-16 bg-slate-100 dark:bg-slate-700 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Producto no encontrado</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-lg">El producto que buscas no existe o fue eliminado.</p>
        <Link href="/" className="btn btn-primary text-lg">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-semibold mb-4 min-h-[56px] px-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Product Image */}
          <div className="aspect-square relative bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden flex items-center justify-center">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-3 sm:p-6"
                priority
              />
            ) : (
              <Package className="w-24 h-24 text-slate-300 dark:text-slate-600" />
            )}
            {product.discount_percent && product.stock > 0 && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-sm font-black px-3 py-1.5 rounded-xl shadow-lg">
                -{product.discount_percent}% OFF
              </div>
            )}
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 font-bold border-2 border-red-500 dark:border-red-400 px-6 py-3 rounded-xl text-xl -rotate-6 bg-white dark:bg-slate-900">
                  AGOTADO
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-4">
              {product.laboratory && (
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold tracking-wide text-base mb-2 block">
                  {product.laboratory}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-3">
                {product.name}
              </h1>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {product.prescription_type === 'direct' && (
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl text-base font-semibold bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                    Venta Directa
                  </span>
                )}
                {product.prescription_type === 'prescription' && (
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl text-base font-semibold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300">
                    Receta Médica
                  </span>
                )}
                {product.prescription_type === 'retained' && (
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl text-base font-semibold bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                    Receta Retenida
                  </span>
                )}
                {product.description && /Bioequivalente:\s*S[ií]/i.test(product.description) && (
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl text-base font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                    Bioequivalente
                  </span>
                )}
                {product.category_name && product.category_slug && (
                  <Link
                    href={`/?category=${product.category_slug}`}
                    className="inline-flex items-center px-4 py-2 rounded-2xl text-base font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {product.category_name}
                  </Link>
                )}
              </div>

              {/* Price */}
              {product.discount_percent ? (
                <div>
                  <span className="text-xl text-slate-400 dark:text-slate-500 line-through block mb-1">
                    {formatPrice(parseFloat(product.price))}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-emerald-700 dark:text-emerald-400">
                      {formatPrice(discountedPrice(parseFloat(product.price), product.discount_percent))}
                    </span>
                    <span className="bg-red-500 text-white text-sm font-black px-3 py-1.5 rounded-xl">
                      -{product.discount_percent}% OFF
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-4xl font-black text-emerald-700 dark:text-emerald-400 block">
                  {formatPrice(parseFloat(product.price))}
                </span>
              )}
            </div>

            {/* Product info table */}
            {(product.active_ingredient || product.presentation || product.therapeutic_action) && (
              <div className="mb-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {product.active_ingredient && (
                      <tr>
                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 w-28 sm:w-40 text-base align-top">Principio Activo</td>
                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800/50 text-base">{product.active_ingredient}</td>
                      </tr>
                    )}
                    {product.presentation && (
                      <tr>
                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 w-28 sm:w-40 text-base align-top">Presentación</td>
                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800/50 text-base">{product.presentation}</td>
                      </tr>
                    )}
                    {product.therapeutic_action && (
                      <tr>
                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 w-28 sm:w-40 text-base align-top">Acción Terapéutica</td>
                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800/50 text-base">{product.therapeutic_action}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Shipping & security info */}
            <div className="border-t-2 border-b-2 border-slate-100 dark:border-slate-700 py-5 mb-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl text-cyan-600 dark:text-cyan-400">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Envío disponible a todo Chile</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Compra segura y garantía de calidad</span>
              </div>
            </div>

            {(product.prescription_type === 'retained' || product.prescription_type === 'prescription') ? (
              /* Prescription products: contact via WhatsApp */
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
                  <p className="font-bold text-amber-800 dark:text-amber-300 text-lg mb-1">
                    {product.prescription_type === 'retained' ? 'Requiere receta retenida' : 'Requiere receta médica'}
                  </p>
                  <p className="text-amber-700 dark:text-amber-400 text-base">
                    Este producto solo puede adquirirse presentando receta al momento de retiro. Contáctenos por WhatsApp para coordinar la compra y confirmar disponibilidad.
                  </p>
                </div>
                <a
                  href={`https://wa.me/56993649604?text=${encodeURIComponent(`Hola! Me interesa el producto: ${product.name}${product.presentation ? ` (${product.presentation})` : ''}. Precio: ${formatPrice(parseFloat(product.price))}. ¿Está disponible y cómo procedo con la receta?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-5 px-8 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 min-h-[64px] bg-[#25D366] text-white hover:bg-[#1ebe5d] shadow-lg shadow-green-600/25 active:scale-[0.98] transition-all"
                >
                  <MessageCircle className="w-6 h-6" />
                  Consultar por WhatsApp
                </a>
              </div>
            ) : product.stock > 0 ? (
              <div className="space-y-5">
                {/* Quantity selector */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-700 dark:text-slate-300 font-semibold text-lg">Cantidad:</span>
                    <div className="flex items-center border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800" role="group" aria-label="Selector de cantidad">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-30"
                        disabled={quantity <= 1}
                        aria-label="Reducir cantidad"
                      >
                        <Minus className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                      </button>
                      <span className="w-12 sm:w-16 text-center font-bold text-xl text-slate-900 dark:text-slate-100" aria-live="polite">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-30"
                        disabled={quantity >= product.stock}
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                      </button>
                    </div>
                  </div>
                  <span className={`text-sm sm:text-base font-semibold ${product.stock <= 10 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {product.stock <= 10 ? `Quedan ${product.stock}` : `${product.stock} disponibles`}
                  </span>
                </div>

                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || added}
                  className={`w-full py-5 px-8 rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-3 min-h-[64px] ${
                    added
                      ? 'bg-cyan-600 text-white'
                      : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-600/25 active:scale-[0.98]'
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
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-1">Producto agotado</p>
                  <p className="text-slate-500 dark:text-slate-400 text-base">
                    Este producto no está disponible en este momento. Puedes solicitar un presupuesto y te avisamos cuando lo tengamos.
                  </p>
                </div>
                <a
                  href={`https://wa.me/56993649604?text=${encodeURIComponent(`Hola! Quisiera solicitar presupuesto para:\n\n*${product.name}*${product.presentation ? `\nPresentación: ${product.presentation}` : ''}${product.laboratory ? `\nLaboratorio: ${product.laboratory}` : ''}\n\n¿Pueden conseguirlo? Gracias!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-5 px-8 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 min-h-[64px] bg-[#25D366] text-white hover:bg-[#1ebe5d] shadow-lg shadow-green-600/25 active:scale-[0.98] transition-all"
                >
                  <MessageCircle className="w-6 h-6" />
                  Solicitar presupuesto
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="mt-8 sm:mt-10 card p-5 sm:p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">Descripción</h2>
            <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 sm:mt-12">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Productos relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/producto/${rp.slug}`}
                  className="bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden hover:border-cyan-200 dark:hover:border-cyan-600 hover:shadow-md transition-all flex flex-col"
                >
                  <div className="aspect-square relative bg-white dark:bg-slate-700 overflow-hidden">
                    {rp.image_url ? (
                      <Image
                        src={rp.image_url}
                        alt={rp.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                    {rp.discount_percent && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-sm font-black px-2 py-1 rounded-lg">
                        -{rp.discount_percent}%
                      </div>
                    )}
                  </div>
                  <div className="p-3.5">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base leading-snug line-clamp-2 min-h-[3rem]">{rp.name}</h3>
                    {rp.discount_percent ? (
                      <div className="mt-2">
                        <span className="text-sm text-slate-400 dark:text-slate-500 line-through">{formatPrice(rp.price)}</span>
                        <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 block">{formatPrice(discountedPrice(Number(rp.price), rp.discount_percent))}</span>
                      </div>
                    ) : (
                      <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 block mt-2">{formatPrice(rp.price)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
