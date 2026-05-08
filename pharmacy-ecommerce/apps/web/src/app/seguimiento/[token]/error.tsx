'use client';

import Link from 'next/link';
import { AlertCircle, MessageCircle } from 'lucide-react';

export default function SeguimientoError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="card p-6 sm:p-10 max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">No pudimos cargar tu pedido</h1>
        <p className="text-base text-slate-600 dark:text-slate-300 mb-6">
          Ocurrió un problema al consultar el seguimiento. Vuelve a intentarlo o contáctanos por WhatsApp y te ayudamos al toque.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn btn-primary">Reintentar</button>
          <a
            href="https://wa.me/56993649604?text=Hola%2C%20no%20pude%20ver%20mi%20pedido"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
          </a>
        </div>
        <Link href="/" className="text-cyan-700 dark:text-cyan-400 hover:underline text-sm mt-6 inline-block">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
