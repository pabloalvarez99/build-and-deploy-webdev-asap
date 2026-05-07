import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tu-farmacia.cl';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/producto/', '/cotizacion'],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/checkout/',
          '/carrito',
          '/mi-cuenta/',
          '/mis-pedidos/',
          '/rastrear-pedido/',
          '/*?*sort_by=',
          '/*?*page=',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
