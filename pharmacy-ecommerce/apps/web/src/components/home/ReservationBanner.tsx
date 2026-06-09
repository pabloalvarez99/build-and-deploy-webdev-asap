'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, X, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const STORAGE_KEY = 'tf:last-reservation';
const DISMISS_KEY = 'tf:resv-dismissed';

type Reservation = {
  code: string;
  orderId?: string | null;
  expires?: string | null;
  total?: string | null;
};

/**
 * Recuerda al usuario su reserva pendiente de retiro (código guardado por
 * /checkout/reservation). El código vive solo en la URL de esa página, así que
 * sin esto un invitado que navega fuera lo pierde. Se limpia al expirar;
 * descartar oculta solo durante la sesión (el código se conserva).
 */
export default function ReservationBanner() {
  const [resv, setResv] = useState<Reservation | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === 'true') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Reservation;
      if (!data?.code) return;
      if (data.expires && new Date(data.expires).getTime() < Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      setResv(data);
    } catch {}
  }, []);

  if (!resv) return null;

  const trackHref = resv.orderId ? `/rastrear-pedido?id=${resv.orderId.substring(0, 8)}` : '/rastrear-pedido';

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
        <Store className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-emerald-900 dark:text-emerald-300 text-base leading-tight">
          Tiene una reserva pendiente de retiro
        </p>
        <p className="text-emerald-700 dark:text-emerald-400 text-sm">
          Código: <strong className="font-mono tracking-wider">{resv.code}</strong>
          {resv.total ? <> · Total {formatPrice(resv.total)}</> : null}
        </p>
      </div>
      <Link
        href={trackHref}
        className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm min-h-[44px] transition-colors"
      >
        Ver estado
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={() => {
          try { sessionStorage.setItem(DISMISS_KEY, 'true'); } catch {}
          setResv(null);
        }}
        aria-label="Ocultar aviso de reserva"
        className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}
