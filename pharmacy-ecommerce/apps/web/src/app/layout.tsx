import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { WhatsAppButton } from '@/components/WhatsAppButton';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tu-farmacia.cl';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Tu Farmacia - Farmacia online en Coquimbo, Chile',
    template: '%s | Tu Farmacia',
  },
  description: 'Farmacia online en Coquimbo, Chile. Medicamentos, vitaminas, productos de salud y belleza con retiro en tienda o despacho a todo Chile. Precios accesibles para adultos mayores.',
  keywords: ['farmacia', 'medicamentos', 'Coquimbo', 'Chile', 'farmacia online', 'remedios', 'salud', 'vitaminas', 'adulto mayor'],
  authors: [{ name: 'Tu Farmacia' }],
  creator: 'Tu Farmacia',
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: siteUrl,
    siteName: 'Tu Farmacia',
    title: 'Tu Farmacia - Farmacia online en Coquimbo, Chile',
    description: 'Medicamentos, vitaminas, productos de salud y belleza con retiro en tienda o despacho a todo Chile.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tu Farmacia - Farmacia online en Coquimbo, Chile',
    description: 'Medicamentos, vitaminas, productos de salud y belleza con retiro en tienda o despacho a todo Chile.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Pharmacy',
    name: 'Tu Farmacia',
    description: 'Farmacia online en Coquimbo, Chile. Medicamentos, vitaminas y productos de salud.',
    url: siteUrl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Coquimbo',
      addressCountry: 'CL',
    },
    priceRange: '$',
    currenciesAccepted: 'CLP',
  };

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-emerald-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-lg">
          Ir al contenido principal
        </a>
        <Navbar />
        <main id="main-content" className="min-h-screen">{children}</main>
        <WhatsAppButton />
        <footer className="bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-100 dark:border-slate-700 py-10 mt-8" role="contentinfo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center sm:text-left">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2">Tu Farmacia</p>
                <p className="text-slate-500 dark:text-slate-400">Coquimbo, Chile</p>
                <a
                  href="https://wa.me/56993649604"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline mt-1 inline-block"
                >
                  +56 9 9364 9604
                </a>
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Navegación</p>
                <nav aria-label="Footer" className="flex flex-col gap-1.5">
                  <a href="/" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Catálogo</a>
                  <a href="/carrito" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Carrito</a>
                  <a href="/mis-pedidos" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Mis Pedidos</a>
                </nav>
              </div>
              <div className="text-center sm:text-right">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Horario de atención</p>
                <p className="text-slate-500 dark:text-slate-400">Lunes a Viernes: 9:00 - 19:00</p>
                <p className="text-slate-500 dark:text-slate-400">Sábado: 10:00 - 14:00</p>
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 mt-8 pt-6 text-center">
              <p className="text-slate-400 dark:text-slate-500 text-base">
                &copy; {new Date().getFullYear()} Tu Farmacia. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
