'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productApi, ProductWithCategory, Product } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { ShoppingCart, Minus, Plus, Package, Truck, ShieldCheck, ArrowLeft, Check, MessageCircle, X, ZoomIn, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, discountedPrice } from '@/lib/format';
import ProfessionalInfo from './ProfessionalInfo';
import ProductFAQ from './ProductFAQ';
import DrugInteractionAlert from '@/components/DrugInteractionAlert';
import { checkInteractions } from '@/lib/drug-interactions';
import DrugDuplicateAlert from '@/components/DrugDuplicateAlert';
import { checkDuplicates } from '@/lib/drug-duplicates';

export default function ProductPage({ initialProduct }: { initialProduct: ProductWithCategory | null }) {
  const router = useRouter();

  const { addToCart, cart, fetchCart } = useCartStore();

  useEffect(() => {
    if (!cart) fetchCart();
  }, [cart, fetchCart]);

  const newDuplicates = useMemo(() => {
    if (!cart || cart.items.length === 0 || !initialProduct?.active_ingredient) return [];
    const otherItems = cart.items.filter((it) => it.product_id !== initialProduct.id);
    if (otherItems.length === 0) return [];
    const hypotheticalItem = {
      product_id: initialProduct.id,
      product_name: initialProduct.name,
      product_slug: initialProduct.slug,
      product_image: initialProduct.image_url,
      price: initialProduct.price,
      quantity: 1,
      subtotal: initialProduct.price,
      stock: initialProduct.stock,
      active_ingredient: initialProduct.active_ingredient,
    };
    const baseline = checkDuplicates(otherItems);
    const hypothetical = checkDuplicates([...otherItems, hypotheticalItem]);
    const baseSet = new Set(baseline.map((b) => b.drug));
    return hypothetical.filter((h) => !baseSet.has(h.drug));
  }, [cart, initialProduct?.id, initialProduct?.active_ingredient, initialProduct?.name, initialProduct?.slug, initialProduct?.image_url, initialProduct?.price, initialProduct?.stock]);

  const newInteractions = useMemo(() => {
    if (!cart || cart.items.length === 0 || !initialProduct?.active_ingredient) return [];
    const inCart = cart.items
      .filter((it) => it.product_id !== initialProduct.id)
      .map((it) => it.active_ingredient);
    if (inCart.length === 0) return [];
    const baseline = checkInteractions(inCart);
    const hypothetical = checkInteractions([...inCart, initialProduct.active_ingredient]);
    const baseSet = new Set(baseline.map((b) => `${b.drugs[0]}|${b.drugs[1]}`));
    return hypothetical.filter((h) => !baseSet.has(`${h.drugs[0]}|${h.drugs[1]}`));
  }, [cart, initialProduct?.id, initialProduct?.active_ingredient]);

  const [product] = useState<ProductWithCategory | null>(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [addError, setAddError] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [equivalents, setEquivalents] = useState<Product[]>([]);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [zoomOpen]);

  useEffect(() => {
    if (!product?.category_slug) return;
    let cancelled = false;
    productApi.list({ category: product.category_slug, limit: 5, in_stock: true })
      .then(res => {
        if (cancelled) return;
        setRelatedProducts(res.products.filter(p => p.slug !== product.slug).slice(0, 4));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [product?.category_slug, product?.slug]);

  useEffect(() => {
    if (!product?.active_ingredient) return;
    let cancelled = false;
    productApi.list({ active_ingredient: product.active_ingredient, limit: 12, in_stock: true })
      .then(res => {
        if (cancelled) return;
        setEquivalents(res.products.filter(p => p.slug !== product.slug).slice(0, 6));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [product?.active_ingredient, product?.slug]);

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAdding(true);
    setAddError(false);
    try {
      await addToCart(product.id, quantity);
      setAdded(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setAddError(true);
    } finally {
      setIsAdding(false);
    }
  };

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-6 sm:p-8 text-center">
          <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Producto no encontrado</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-base sm:text-lg">El producto que buscas no existe o fue eliminado.</p>
          <div className="space-y-3">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold min-h-[48px] bg-cyan-600 hover:bg-cyan-700 text-white transition-colors text-lg"
            >
              Volver al catálogo
            </Link>
            <a
              href="https://wa.me/56993649604?text=Hola%2C%20busco%20un%20producto%20que%20no%20encuentro%20en%20Tu%20Farmacia"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold min-h-[48px] border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Buscar por WhatsApp
            </a>
            <a
              href="tel:+56993649604"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold min-h-[48px] border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Llamar +56 9 9364 9604
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen pb-28 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-semibold mb-4 min-h-[56px] px-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>

        <div className="grid sm:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Product Image */}
          <div className="aspect-square relative bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden flex items-center justify-center">
            {product.image_url ? (
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                className="absolute inset-0 cursor-zoom-in group focus:outline-none focus:ring-4 focus:ring-cyan-500/40 rounded-2xl"
                aria-label="Ampliar imagen"
              >
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-3 sm:p-6 transition-transform duration-200 group-hover:scale-105"
                  priority
                  fetchPriority="high"
                />
                <span className="absolute bottom-3 right-3 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl shadow-md inline-flex items-center gap-1.5 text-sm font-semibold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-none">
                  <ZoomIn className="w-4 h-4" />
                  <span className="sm:hidden">Toca para ampliar</span>
                  <span className="hidden sm:inline">Ampliar</span>
                </span>
              </button>
            ) : (
              <Package className="w-24 h-24 text-slate-300 dark:text-slate-600" />
            )}
            {product.discount_percent && product.stock > 0 && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-sm font-black px-3 py-1.5 rounded-xl shadow-lg pointer-events-none">
                -{product.discount_percent}% OFF
              </div>
            )}
            {product.stock > 0 && product.stock < 10 && (
              <div className="absolute top-3 right-3 bg-orange-500 text-white text-sm font-black px-3 py-1.5 rounded-xl shadow-lg pointer-events-none">
                Solo {product.stock} {product.stock === 1 ? 'disponible' : 'disponibles'}
              </div>
            )}
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center pointer-events-none">
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
              <h1 id="product-title" tabIndex={-1} className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-3 focus:outline-none">
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
                {newDuplicates.length > 0 && !added && (
                  <DrugDuplicateAlert duplicates={newDuplicates} />
                )}
                {newInteractions.length > 0 && !added && (
                  <DrugInteractionAlert
                    interactions={newInteractions}
                    headerTitle={
                      newInteractions.length === 1
                        ? 'Posible interacción con un producto de su carrito'
                        : `Posibles interacciones con productos de su carrito (${newInteractions.length})`
                    }
                    headerSubtitle="Si agrega este producto, podría tener estas interacciones medicamentosas. Consulte con su médico o farmacéutico antes de continuar."
                    defaultOpen={true}
                  />
                )}
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
                {added ? (
                  <div role="status" aria-live="polite" className="space-y-3">
                    <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-emerald-800 dark:text-emerald-300 text-lg">Agregado al carrito</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => router.push('/carrito')}
                        className="py-4 px-6 rounded-2xl font-bold text-lg min-h-[56px] bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Ver carrito
                      </button>
                      <button
                        onClick={() => { setAdded(false); setQuantity(1); }}
                        className="py-4 px-6 rounded-2xl font-bold text-lg min-h-[56px] border-2 border-cyan-600 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 active:scale-[0.98] transition-all"
                      >
                        Seguir comprando
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                  {addError && (
                    <div role="alert" className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                      <p className="font-bold text-red-700 dark:text-red-300 text-lg">No se pudo agregar al carrito</p>
                      <p className="text-red-600 dark:text-red-400 text-base mt-0.5">Revise su conexión a internet e intente nuevamente.</p>
                    </div>
                  )}
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="w-full py-5 px-8 rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-3 min-h-[64px] bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-600/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isAdding ? (
                      'Agregando...'
                    ) : (
                      <>
                        <ShoppingCart className="w-6 h-6" />
                        Agregar al carrito
                      </>
                    )}
                  </button>
                  </>
                )}
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

        {/* Información profesional por principio activo (medicamentos) */}
        <ProfessionalInfo activeIngredient={product.active_ingredient} />

        {/* Preguntas frecuentes */}
        <ProductFAQ activeIngredient={product.active_ingredient} />

        {/* Equivalentes con el mismo principio activo */}
        {equivalents.length > 0 && (
          <section
            aria-labelledby="equiv-title"
            className="mt-8 rounded-3xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20 p-4 sm:p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-emerald-600 text-white flex-shrink-0">
                <Check className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 id="equiv-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                  Otras opciones con el mismo principio activo
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
                  Mismo medicamento, distintas marcas o presentaciones. Compare precio.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {equivalents.map((eq) => {
                const eqFinal = eq.discount_percent ? discountedPrice(Number(eq.price), eq.discount_percent) : Number(eq.price);
                const curr = product.discount_percent ? discountedPrice(Number(product.price), product.discount_percent) : Number(product.price);
                const cheaper = eqFinal < curr;
                return (
                  <Link
                    key={eq.id}
                    href={`/producto/${eq.slug}`}
                    className="flex gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors min-h-[80px]"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 relative bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden flex-shrink-0">
                      {eq.image_url ? (
                        <Image src={eq.image_url} alt={eq.name} fill sizes="80px" className="object-contain p-1" />
                      ) : (
                        <Package className="w-full h-full p-3 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">{eq.name}</p>
                      {eq.laboratory && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{eq.laboratory}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 dark:text-slate-100">{formatPrice(eqFinal)}</span>
                        {cheaper && (
                          <span className="text-[0.7rem] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md">
                            Más económico
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
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

      {/* Sticky mobile add-to-cart bar */}
      {product.stock > 0 && product.prescription_type !== 'retained' && product.prescription_type !== 'prescription' && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t-2 border-slate-200 dark:border-slate-700 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col leading-tight min-w-0">
            {product.discount_percent ? (
              <>
                <span className="text-xs text-slate-400 line-through">{formatPrice(parseFloat(product.price))}</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {formatPrice(discountedPrice(parseFloat(product.price), product.discount_percent))}
                </span>
              </>
            ) : (
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                {formatPrice(parseFloat(product.price))}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={isAdding || added}
            className={`flex-1 min-h-[56px] py-3 px-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 ${
              added ? 'bg-cyan-600 text-white' : 'bg-cyan-600 text-white hover:bg-cyan-700 active:scale-[0.98]'
            } disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-600/25`}
            aria-label="Agregar al carrito"
          >
            {added ? (<><Check className="w-6 h-6" />Agregado</>) : isAdding ? 'Agregando...' : (<><ShoppingCart className="w-5 h-5" />Agregar</>)}
          </button>
        </div>
      )}

      {/* Image zoom modal */}
      {zoomOpen && product.image_url && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setZoomOpen(false); }}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative w-full h-full max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
