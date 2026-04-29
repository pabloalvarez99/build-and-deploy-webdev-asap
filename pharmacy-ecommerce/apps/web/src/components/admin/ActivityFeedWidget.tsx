'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, Calculator, ArrowUpDown, CheckSquare, Truck,
  Plus, Edit, Trash, Activity, ArrowRight,
} from 'lucide-react';
import { formatPrice } from '@/lib/format';

interface FeedEvent {
  id: string;
  type: string;
  severity: 'info' | 'positive' | 'warning';
  icon: string;
  user?: string | null;
  title: string;
  detail?: string;
  amount?: number;
  href?: string;
  at: string;
}

const ICON_MAP: Record<string, typeof ShoppingBag> = {
  'shopping-bag': ShoppingBag,
  calculator: Calculator,
  'arrow-up-down': ArrowUpDown,
  'check-square': CheckSquare,
  truck: Truck,
  plus: Plus,
  edit: Edit,
  trash: Trash,
};

const SEV_COLOR: Record<FeedEvent['severity'], string> = {
  positive: '#10b981',
  warning: '#f59e0b',
  info: '#6366f1',
};

function relTime(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`;
  return d.toLocaleDateString('es-CL');
}

export function ActivityFeedWidget({ limit = 8 }: { limit?: number }) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/actividad?limit=${limit}`, { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setEvents(j.events ?? []))
      .finally(() => setLoading(false));
  }, [limit]);

  return (
    <div className="admin-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: 'var(--admin-accent)' }} />
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--admin-text)' }}>
            Pulso del negocio
          </h3>
        </div>
        <Link href="/admin/actividad" className="text-[11.5px] admin-text-muted hover:text-[color:var(--admin-accent)] flex items-center gap-1">
          Ver todo <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <p className="text-[12.5px] admin-text-subtle">Cargando…</p>
      ) : events.length === 0 ? (
        <p className="text-[12.5px] admin-text-subtle">Sin actividad reciente</p>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => {
            const Icon = ICON_MAP[e.icon] ?? Activity;
            const color = SEV_COLOR[e.severity];
            const inner = (
              <li className="flex items-start gap-3 py-1.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${color}14`, color }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] truncate" style={{ color: 'var(--admin-text)' }}>
                    {e.title}
                    {e.amount !== undefined && (
                      <span className="ml-1.5 tabular-nums font-medium" style={{ color }}>
                        {formatPrice(e.amount)}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] admin-text-subtle">
                    {relTime(e.at)}
                    {e.user && ` · ${e.user}`}
                    {e.detail && ` · ${e.detail}`}
                  </p>
                </div>
              </li>
            );
            return e.href ? (
              <Link key={e.id} href={e.href} className="block hover:bg-[color:var(--admin-accent-soft)] rounded-lg px-2 -mx-2 transition-colors">
                {inner}
              </Link>
            ) : (
              <div key={e.id} className="px-2 -mx-2">{inner}</div>
            );
          })}
        </ul>
      )}
    </div>
  );
}
