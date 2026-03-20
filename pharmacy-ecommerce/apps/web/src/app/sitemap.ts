import { MetadataRoute } from 'next';

// Force dynamic generation so it runs at request time, not build time
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tu-farmacia.cl';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/carrito`,
      changeFrequency: 'always',
      priority: 0.3,
    },
  ];

  // Try to fetch product and category slugs for dynamic pages
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return staticPages;
    }

    // Use fetch directly to avoid Supabase client initialization issues at build
    const productsRes = await fetch(
      `${supabaseUrl}/rest/v1/products?select=slug,updated_at&active=eq.true&order=updated_at.desc&limit=500`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 3600 },
      }
    );

    const categoriesRes = await fetch(
      `${supabaseUrl}/rest/v1/categories?select=slug`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 3600 },
      }
    );

    const products = productsRes.ok ? await productsRes.json() : [];
    const categories = categoriesRes.ok ? await categoriesRes.json() : [];

    const productUrls: MetadataRoute.Sitemap = products.map((p: { slug: string; updated_at?: string }) => ({
      url: `${siteUrl}/producto/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    const categoryUrls: MetadataRoute.Sitemap = categories.map((c: { slug: string }) => ({
      url: `${siteUrl}/?category=${c.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...categoryUrls, ...productUrls];
  } catch {
    return staticPages;
  }
}
