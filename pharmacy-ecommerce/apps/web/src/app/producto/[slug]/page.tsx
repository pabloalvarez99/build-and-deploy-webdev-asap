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

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.therapeutic_action || product.presentation || undefined,
        image: sanitizeImageUrl(product.image_url) ?? undefined,
        brand: { '@type': 'Brand', name: product.laboratory || 'Genérico' },
        offers: {
          '@type': 'Offer',
          price: Number(product.price),
          priceCurrency: 'CLP',
          availability:
            product.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Pharmacy',
            name: 'Tu Farmacia',
            url: siteUrl,
          },
        },
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
