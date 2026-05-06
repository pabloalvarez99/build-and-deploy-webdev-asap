import { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';

// Force dynamic generation so it runs at request time, not build time
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tu-farmacia.cl';

  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/cotizacion`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/rastrear-pedido`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/auth/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/auth/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const fallbackCategorySlugs = [
    'dolor-fiebre','sistema-cardiovascular','diabetes-metabolismo','vitaminas-suplementos',
    'sistema-digestivo','sistema-nervioso','sistema-respiratorio','dermatologia',
    'oftalmologia','salud-femenina','antibioticos-infecciones','higiene-cuidado-personal',
    'bebes-ninos','adulto-mayor','insumos-medicos','productos-naturales',
  ];

  try {
    const db = await getDb();

    const [products, categories] = await Promise.all([
      db.products.findMany({
        where: { active: true },
        select: { slug: true, updated_at: true },
        orderBy: { updated_at: 'desc' },
        take: 50000,
      }),
      db.categories.findMany({ select: { slug: true } }),
    ]);

    const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${siteUrl}/producto/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${siteUrl}/?category=${c.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...categoryUrls, ...productUrls];
  } catch {
    const fallbackCategories: MetadataRoute.Sitemap = fallbackCategorySlugs.map((slug) => ({
      url: `${siteUrl}/?category=${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
    return [...staticPages, ...fallbackCategories];
  }
}
