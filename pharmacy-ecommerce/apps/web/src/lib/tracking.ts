import { randomBytes } from 'crypto';

/** Generate a 48-char hex (24 bytes) tracking token, URL-safe + unguessable. */
export function generateTrackingToken(): string {
  return randomBytes(24).toString('hex');
}

/** Public tracking URL for a given token. */
export function trackingUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://tu-farmacia.cl').trim().replace(/\/$/, '');
  return `${base}/seguimiento/${token}`;
}

export type TrackingStatus = 'pending' | 'reserved' | 'paid' | 'approved' | 'ready' | 'completed' | 'delivered' | 'cancelled';

export interface TimelineStep {
  key: 'placed' | 'paid' | 'preparing' | 'ready' | 'delivered';
  label: string;
  state: 'done' | 'active' | 'pending' | 'cancelled';
}

/**
 * Map order status (+ payment_provider) to a 4-step user-facing timeline.
 * Steps: Pedido → Pagado → Preparando → Listo retiro → Entregado
 */
export function statusToTimeline(status: string, paymentProvider: string | null): TimelineStep[] {
  const isCancelled = status === 'cancelled' || status === 'rejected';
  const isStore = paymentProvider === 'store';

  const steps: TimelineStep[] = [
    { key: 'placed', label: 'Pedido recibido', state: 'done' },
    { key: 'paid', label: isStore ? 'Reserva confirmada' : 'Pago confirmado', state: 'pending' },
    { key: 'preparing', label: 'Preparando', state: 'pending' },
    { key: 'ready', label: 'Listo para retiro', state: 'pending' },
    { key: 'delivered', label: 'Entregado', state: 'pending' },
  ];

  if (isCancelled) {
    return steps.map((s, i) => ({ ...s, state: i === 0 ? 'done' : 'cancelled' }));
  }

  // Normalize states
  const advancePast = (key: TimelineStep['key']) => {
    let activated = false;
    for (const s of steps) {
      if (activated) {
        s.state = 'pending';
        continue;
      }
      if (s.key === key) {
        s.state = 'active';
        activated = true;
      } else {
        s.state = 'done';
      }
    }
  };

  if (status === 'pending') {
    // Webpay pre-commit: only "placed" done
    advancePast('paid');
  } else if (status === 'reserved' || status === 'paid') {
    advancePast('preparing');
  } else if (status === 'approved') {
    advancePast('ready');
  } else if (status === 'ready') {
    advancePast('ready');
    steps.find((s) => s.key === 'ready')!.state = 'done';
    steps.find((s) => s.key === 'delivered')!.state = 'active';
  } else if (status === 'completed' || status === 'delivered') {
    steps.forEach((s) => (s.state = 'done'));
  }

  return steps;
}
