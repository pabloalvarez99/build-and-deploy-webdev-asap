'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

/** Toast de confirmación de carrito, con acción opcional (ej. "Ver carrito"). */
export default function CartToast({
  message,
  onClose,
  actionHref,
  actionLabel,
}: {
  message: string;
  onClose: () => void;
  actionHref?: string;
  actionLabel?: string;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, actionHref ? 4000 : 2500);
    return () => clearTimeout(timer);
  }, [onClose, actionHref]);

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-auto z-50" role="status" aria-live="polite" aria-atomic="true">
      <div className="flex items-center gap-3 bg-slate-900 dark:bg-slate-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/10">
        <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Check className="w-3.5 h-3.5" />
        </div>
        <span className="font-medium text-base flex-1">{message}</span>
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            onClick={onClose}
            className="flex-shrink-0 inline-flex items-center px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 font-bold text-sm min-h-[40px] transition-colors"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
