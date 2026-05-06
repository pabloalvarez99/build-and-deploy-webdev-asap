import type { Metadata } from 'next';
import { getDb } from '@/lib/db';
import ProductPageClient from './ProductPageClient';

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tu-farmacia.cl';

function sanitizeImageUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith('http://') ? 'https://' + url.slice(7) : url;
}

async function getProductBySlug(slug: string) {
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
}

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
            image: sanitizeImageUrl(product.image_url) ?? `${siteUrl}/og-image.png`,
            sku: product.external_id || product.id,
            mpn: product.external_id || undefined,
            category: product.categories?.name || undefined,
            brand: { '@type': 'Brand', name: product.laboratory || 'Genérico' },
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
      <ProductPageClient />
    </>
  );
}
