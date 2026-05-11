import type { Metadata } from 'next';
import { cache } from 'react';
import { getDb } from '@/lib/db';
import type { ProductWithCategory } from '@/lib/api';
import ProductPageClient from './ProductPageClient';
import { lookupDrugInfo, prettifyDrugName } from '@/lib/drug-info';

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tu-farmacia.cl';

function sanitizeImageUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith('http://') ? 'https://' + url.slice(7) : url;
}

function serializeProduct(p: any): ProductWithCategory {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price.toString(),
    stock: p.stock,
    category_id: p.category_id,
    image_url: sanitizeImageUrl(p.image_url),
    active: p.active,
    external_id: p.external_id,
    laboratory: p.laboratory,
    therapeutic_action: p.therapeutic_action,
    active_ingredient: p.active_ingredient,
    prescription_type: p.prescription_type,
    presentation: p.presentation,
    discount_percent: p.discount_percent,
    created_at: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at,
    category_name: p.categories?.name ?? null,
    category_slug: p.categories?.slug ?? null,
  };
}

// React.cache dedupe: generateMetadata + page comparten 1 sola query Prisma por request.
const getProductBySlug = cache(async (slug: string) => {
  try {
    const db = await getDb();
    const product = await db.products.findFirst({
      where: { slug, active: true },
      include: { categories: { select: { name: true, slug: true } } },
    });
    return product;
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return { title: 'Producto no encontrado | Tu Farmacia' };
  }

  const description = [product.therapeutic_action, product.presentation, product.laboratory]
    .filter(Boolean)
    .join(' · ')
    .slice(0, 155);

  const imageUrl = sanitizeImageUrl(product.image_url);
  const canonicalUrl = `${siteUrl}/producto/${product.slug}`;

  return {
    title: `${product.name} | Tu Farmacia`,
    description: description || undefined,
    openGraph: {
      title: product.name,
      description: description || undefined,
      images: imageUrl
        ? [{ url: imageUrl, width: 800, height: 800 }]
        : [],
      url: canonicalUrl,
      type: 'website',
      siteName: 'Tu Farmacia',
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);

  const finalPrice = product?.discount_percent
    ? Math.round(Number(product.price) * (1 - product.discount_percent / 100))
    : product
    ? Number(product.price)
    : 0;
  const priceValidUntil = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const drugLookup = product ? lookupDrugInfo(product.active_ingredient) : [];
  const primaryDrug = drugLookup[0];

  const additionalProps: Array<{ '@type': string; name: string; value: string }> = [];
  if (product?.active_ingredient) {
    additionalProps.push({ '@type': 'PropertyValue', name: 'Principio activo', value: product.active_ingredient });
  }
  if (product?.presentation) {
    additionalProps.push({ '@type': 'PropertyValue', name: 'Presentación', value: product.presentation });
  }
  if (product?.prescription_type) {
    additionalProps.push({ '@type': 'PropertyValue', name: 'Condición de venta', value: product.prescription_type });
  }
  if (primaryDrug?.info.via) {
    additionalProps.push({ '@type': 'PropertyValue', name: 'Vía de administración', value: primaryDrug.info.via });
  }

  const faqJsonLd = primaryDrug ? (() => {
    const info = primaryDrug.info;
    const pretty = prettifyDrugName(primaryDrug.name);
    const faqs: Array<{ q: string; a: string }> = [];
    if (info.consejos_uso) faqs.push({ q: `¿Cómo debo tomar ${pretty}?`, a: info.consejos_uso });
    if (info.posologia) faqs.push({ q: '¿Cuál es la dosis habitual?', a: `${info.posologia} Siempre seguir indicación de su médico.` });
    if (info.signos_alarma) faqs.push({ q: '¿Cuándo debo consultar de urgencia?', a: info.signos_alarma });
    if (info.interacciones) faqs.push({ q: '¿Con qué medicamentos no se puede combinar?', a: info.interacciones });
    if (info.embarazo) faqs.push({ q: '¿Es seguro durante el embarazo?', a: info.embarazo });
    if (info.precauciones_adulto_mayor) faqs.push({ q: '¿Es seguro en adultos mayores de 65 años?', a: info.precauciones_adulto_mayor });
    if (faqs.length === 0) return null;
    return {
      '@type': 'FAQPage',
      '@id': `${siteUrl}/producto/${product!.slug}#faq`,
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
  })() : null;

  const drugJsonLd = primaryDrug ? {
    '@type': 'Drug',
    '@id': `${siteUrl}/producto/${product!.slug}#drug`,
    name: prettifyDrugName(primaryDrug.name),
    activeIngredient: primaryDrug.name,
    description: primaryDrug.info.categoria,
    ...(primaryDrug.info.indicaciones && { indication: primaryDrug.info.indicaciones }),
    ...(primaryDrug.info.efectos_adversos && { adverseOutcome: primaryDrug.info.efectos_adversos }),
    ...(primaryDrug.info.contraindicaciones && { contraindication: primaryDrug.info.contraindicaciones }),
    ...(primaryDrug.info.interacciones && { interactingDrug: primaryDrug.info.interacciones }),
    ...(primaryDrug.info.posologia && { dosageForm: primaryDrug.info.posologia }),
    ...(primaryDrug.info.via && { administrationRoute: primaryDrug.info.via }),
    ...(primaryDrug.info.embarazo && { pregnancyCategory: primaryDrug.info.embarazo }),
  } : null;

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Product',
            '@id': `${siteUrl}/producto/${product.slug}#product`,
            name: product.name,
            description:
              [product.therapeutic_action, product.presentation, product.laboratory]
                .filter(Boolean)
                .join(' · ') || product.name,
            image: sanitizeImageUrl(product.image_url) ?? `${siteUrl}/opengraph-image`,
            sku: product.external_id || product.id,
            mpn: product.external_id || undefined,
            category: product.categories?.name || undefined,
            brand: { '@type': 'Brand', name: product.laboratory || 'Genérico' },
            ...(additionalProps.length > 0 && { additionalProperty: additionalProps }),
            offers: {
              '@type': 'Offer',
              url: `${siteUrl}/producto/${product.slug}`,
              price: finalPrice,
              priceCurrency: 'CLP',
              priceValidUntil,
              itemCondition: 'https://schema.org/NewCondition',
              availability:
                product.stock > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              seller: { '@id': `${siteUrl}/#pharmacy` },
              hasMerchantReturnPolicy: {
                '@type': 'MerchantReturnPolicy',
                applicableCountry: 'CL',
                returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
                merchantReturnDays: 10,
                returnMethod: 'https://schema.org/ReturnByMail',
                returnFees: 'https://schema.org/FreeReturn',
              },
              shippingDetails: {
                '@type': 'OfferShippingDetails',
                shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'CL' },
                deliveryTime: {
                  '@type': 'ShippingDeliveryTime',
                  handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
                  transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 5, unitCode: 'DAY' },
                },
              },
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
              ...(product.categories
                ? [{
                    '@type': 'ListItem',
                    position: 2,
                    name: product.categories.name,
                    item: `${siteUrl}/?category=${product.categories.slug}`,
                  }]
                : []),
              {
                '@type': 'ListItem',
                position: product.categories ? 3 : 2,
                name: product.name,
                item: `${siteUrl}/producto/${product.slug}`,
              },
            ],
          },
          ...(drugJsonLd ? [drugJsonLd] : []),
          ...(faqJsonLd ? [faqJsonLd] : []),
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductPageClient initialProduct={product ? serializeProduct(product) : null} />
    </>
  );
}
