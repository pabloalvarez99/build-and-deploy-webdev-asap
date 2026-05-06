import Link from 'next/link';
import type { Metadata } from 'next';
import { Home, Search, FileText, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: true },
};

const popularCategories = [
  { slug: 'dolor-fiebre', name: 'Dolor y fiebre' },
  { slug: 'sistema-cardiovascular', name: 'Cardiovascular' },
  { slug: 'diabetes-metabolismo', name: 'Diabetes' },
  { slug: 'vitaminas-suplementos', name: 'Vitaminas' },
  { slug: 'sistema-digestivo', name: 'Digestivo' },
  { slug: 'adulto-mayor', name: 'Adulto mayor' },
];

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="text-center max-w-2xl">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-slate-400 dark:text-slate-500" aria-hidden="true" />
        </div>
        <p className="font-mono text-sm text-slate-400 dark:text-slate-600 mb-2">404</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">Página no encontrada</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">
          La página que buscas no existe o fue movida. Prueba con una categoría popular o solicita un presupuesto.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link href="/" className="btn btn-primary text-lg inline-flex items-center gap-2">
            <Home className="w-5 h-5" aria-hidden="true" />
            Volver al inicio
          </Link>
          <Link href="/cotizacion" className="btn btn-outline text-lg inline-flex items-center gap-2">
            <FileText className="w-5 h-5" aria-hidden="true" />
            Cotizar producto
          </Link>
          <a
            href="https://wa.me/56993649604?text=Hola!%20busco%20un%20producto%20que%20no%20encuentro%20en%20el%20sitio"
            target="_blank"
            rel="noopener noreferrer"
            className="btn text-lg inline-flex items-center gap-2 bg-[#25D366] text-white hover:bg-[#1ebe5d]"
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
            WhatsApp
          </a>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">Categorías populares</p>
          <div className="flex flex-wrap justify-center gap-2">
            {popularCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/?category=${c.slug}`}
                className="px-4 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 text-sm font-medium transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
