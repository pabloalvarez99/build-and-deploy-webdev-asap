import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sin conexión',
  description: 'No hay conexión a internet. Reintenta cuando estés en línea.',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-emerald-600 dark:text-emerald-400">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          Sin conexión a internet
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
          No pudimos cargar la página. Revisa tu conexión y vuelve a intentar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg transition-colors"
          >
            Ir al inicio
          </Link>
          <a
            href="https://wa.me/56993649604"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold text-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
