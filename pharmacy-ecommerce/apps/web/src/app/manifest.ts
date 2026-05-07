import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tu Farmacia - Farmacia online en Coquimbo',
    short_name: 'Tu Farmacia',
    description: 'Farmacia online en Coquimbo, Chile. Medicamentos, vitaminas y productos de salud con retiro o despacho.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#059669',
    lang: 'es-CL',
    dir: 'ltr',
    categories: ['shopping', 'medical', 'health'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Catálogo', url: '/', description: 'Ver productos' },
      { name: 'Cotización', url: '/cotizacion', description: 'Solicitar presupuesto' },
      { name: 'Rastrear pedido', url: '/rastrear-pedido', description: 'Estado de mi pedido' },
    ],
  };
}
