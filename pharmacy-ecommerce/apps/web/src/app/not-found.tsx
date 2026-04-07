import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">Página no encontrada</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">
          La página que buscas no existe o fue movida. Te invitamos a volver al catálogo.
        </p>
        <Link
          href="/"
          className="btn btn-primary text-lg inline-flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
