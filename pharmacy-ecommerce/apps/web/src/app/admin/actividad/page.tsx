'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { isOwnerRole } from '@/lib/roles';
import {
  ShoppingBag, Calculator, ArrowUpDown, CheckSquare, Truck,
  Plus, Edit, Trash, Activity, RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
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

const TYPE_OPTS: Array<{ key: string; label: string }> = [
  { key: '', label: 'Todos' },
  { key: 'sale', label: 'Ventas' },
  { key: 'caja_close', label: 'Cierres caja' },
  { key: 'task_done', label: 'Tareas' },
  { key: 'audit', label: 'Auditoría' },
  { key: 'stock', label: 'Stock' },
  { key: 'purchase', label: 'Compras' },
];

const SINCE_OPTS: Array<{ key: string; label: string; days: number }> = [
  { key: '1', label: '24h', days: 1 },
  { key: '7', label: '7 días', days: 7 },
  { key: '30', label: '30 días', days: 30 },
];

function relTime(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`;
  return d.toLocaleDateString('es-CL');
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

export default function ActividadPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [type, setType] = useState('');
  const [sinceDays, setSinceDays] = useState(7);
  const [userFilter, setUserFilter] = useState('');

  const load = async () => {
    setRefreshing(true);
    try {
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
      const params = new URLSearchParams({ since, limit: '200' });
      if (type) params.set('type', type);
      const r = await fetch(`/api/admin/actividad?${params}`, { credentials: 'include', cache: 'no-store' });
      const j = await r.json();
      setEvents(j.events ?? []);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isOwnerRole(user.role)) { router.push('/'); return; }
    load();
  }, [user, router, type, sinceDays]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user || !isOwnerRole(user.role)) return null;

  const filtered = userFilter
    ? events.filter((e) => (e.user ?? '').toLowerCase().includes(userFilter.toLowerCase()))
    : events;

  // Group by day
  const grouped: Record<string, FeedEvent[]> = {};
  for (const e of filtered) {
    const day = e.at.slice(0, 10);
    (grouped[day] ??= []).push(e);
  }
  const days = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  return (
    <div>
      <PageHeader
        title="Actividad"
        description="Pulso completo del negocio en tiempo real"
        icon={<Activity className="w-5 h-5" />}
        badge={
          <span className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider rounded-md border border-violet-500/30 text-violet-700 dark:text-violet-400 bg-violet-500/[0.08]">
            Solo dueño
          </span>
        }
        actions={
          <button
            onClick={load}
            disabled={refreshing}
            className="admin-input flex items-center gap-2 px-3 h-9 text-[12.5px] hover:border-[color:var(--admin-accent)] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        }
      />

      {/* Filtros */}
      <div className="admin-surface p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {TYPE_OPTS.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`px-2.5 h-7 rounded-md text-[12px] transition-colors ${
                type === t.key
                  ? 'admin-nav-active font-medium'
                  : 'admin-text-muted hover:text-[color:var(--admin-text)] hover:bg-[color:var(--admin-accent-soft)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="Filtrar por usuario…"
            className="admin-input h-7 px-2.5 text-[12px] w-44"
          />
          <div className="flex items-center gap-1">
            {SINCE_OPTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSinceDays(s.days)}
                className={`px-2.5 h-7 rounded-md text-[12px] transition-colors ${
                  sinceDays === s.days
                    ? 'admin-nav-active font-medium'
                    : 'admin-text-muted hover:text-[color:var(--admin-text)] hover:bg-[color:var(--admin-accent-soft)]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-surface p-12 text-center admin-text-muted text-sm">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-surface p-12 text-center admin-text-subtle text-sm">Sin eventos en este rango</div>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <div key={day}>
              <p className="text-[11px] font-semibold uppercase tracking-wider admin-text-subtle mb-2 px-1">
                {formatDay(day)}
              </p>
              <div className="admin-surface divide-y" style={{ borderColor: 'var(--admin-border)' }}>
                {grouped[day].map((e) => {
                  const Icon = ICON_MAP[e.icon] ?? Activity;
                  const color = SEV_COLOR[e.severity];
                  const inner = (
                    <div className="flex items-start gap-3 p-3 hover:bg-[color:var(--admin-accent-soft)] transition-colors">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${color}14`, color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px]" style={{ color: 'var(--admin-text)' }}>
                          {e.title}
                          {e.amount !== undefined && (
                            <span className="ml-1.5 tabular-nums font-medium" style={{ color }}>
                              {formatPrice(e.amount)}
                            </span>
                          )}
                        </p>
                        <p className="text-[11.5px] admin-text-subtle mt-0.5">
                          {relTime(e.at)}
                          {e.user && ` · ${e.user}`}
                          {e.detail && ` · ${e.detail}`}
                        </p>
                      </div>
                    </div>
                  );
                  return e.href
                    ? <Link key={e.id} href={e.href} className="block">{inner}</Link>
                    : <div key={e.id}>{inner}</div>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
