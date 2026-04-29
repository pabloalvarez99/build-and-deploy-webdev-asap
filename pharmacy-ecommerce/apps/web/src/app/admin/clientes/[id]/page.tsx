'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, User, Phone, Mail, Calendar, Star, ShoppingBag,
  Package, FileText, TrendingUp, Clock, CreditCard, Hash,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { isAdminRole } from '@/lib/roles';
import { formatPrice } from '@/lib/format';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { StatCard } from '@/components/admin/ui/StatCard';

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price_at_purchase: string;
}
interface Order {
  id: string;
  status: string;
  total: string;
  created_at: string;
  payment_provider: string | null;
  pickup_code: string | null;
  items: OrderItem[];
}
interface Prescription {
  id: string;
  product_name: string;
  prescription_number: string | null;
  patient_name: string;
  doctor_name: string | null;
  is_controlled: boolean;
  dispensed_at: string;
}
interface LoyaltyTx {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}
interface Recurrent {
  product_id: string | null;
  product_name: string;
  orders: number;
  total_qty: number;
}
interface Customer {
  id: string | null;
  email: string;
  name: string;
  surname: string;
  phone: string | null;
  rut?: string | null;
  type: 'registered' | 'guest';
  created_at: string | null;
  loyalty_points?: number;
}
interface Detail {
  customer: Customer;
  kpis: {
    lifetime_spend: number;
    order_count: number;
    avg_ticket: number;
    first_order: string | null;
    last_order: string | null;
    frequency_days: number | null;
    next_predicted: string | null;
    top_recurrent: Recurrent[];
  };
  orders: Order[];
  prescriptions: Prescription[];
  loyalty_transactions: LoyaltyTx[];
}

type Tab = 'orders' | 'prescriptions' | 'recurrent' | 'loyalty';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagada', completed: 'Completada',
  cancelled: 'Cancelada', reserved: 'Reservada', failed: 'Fallida',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function relativeDays(d: string | null) {
  if (!d) return null;
  const days = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'hoy';
  if (days === 1) return 'hace 1 día';
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months === 1 ? '' : 'es'}`;
}

export default function ClientePerfilPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { user } = useAuthStore();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('orders');

  useEffect(() => {
    if (!user || !isAdminRole(user.role)) { router.push('/'); return; }
    const id = params.id;
    const email = search.get('email');
    const url = id === 'guest' && email
      ? `/api/admin/clientes/guest?email=${encodeURIComponent(email)}`
      : `/api/admin/clientes/${id}`;
    fetch(url, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('No se pudo cargar el cliente')))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user, router, params.id, search]);

  if (!user || !isAdminRole(user.role)) return null;

  if (loading) return <div className="admin-surface p-12 text-center admin-text-muted text-sm">Cargando perfil…</div>;
  if (!data) return (
    <div className="admin-surface p-12 text-center">
      <p className="admin-text-muted text-sm">Cliente no encontrado.</p>
      <Link href="/admin/clientes" className="mt-3 inline-block text-[12.5px] text-[color:var(--admin-accent)]">← Volver a clientes</Link>
    </div>
  );

  const c = data.customer;
  const fullName = [c.name, c.surname].filter(Boolean).join(' ').trim() || c.email || 'Cliente';

  return (
    <div className="space-y-6">
      <Link href="/admin/clientes" className="inline-flex items-center gap-1.5 text-[12.5px] admin-text-muted hover:text-[color:var(--admin-accent)]">
        <ArrowLeft className="w-3.5 h-3.5" /> Clientes
      </Link>

      <PageHeader
        title={fullName}
        description={c.email}
        icon={<User className="w-5 h-5" />}
        badge={
          <span className={`px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider rounded-md border ${c.type === 'registered' ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/[0.08]' : 'border-zinc-500/30 text-zinc-700 dark:text-zinc-400 bg-zinc-500/[0.08]'}`}>
            {c.type === 'registered' ? 'Registrado' : 'Invitado'}
          </span>
        }
      />

      {/* Identity card */}
      <div className="admin-surface p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
        {c.rut && (
          <div className="flex items-start gap-2.5">
            <Hash className="w-4 h-4 admin-text-subtle mt-0.5" />
            <div>
              <p className="admin-text-subtle text-[11px] uppercase tracking-wider font-semibold">RUT</p>
              <p style={{ color: 'var(--admin-text)' }} className="tabular-nums">{c.rut}</p>
            </div>
          </div>
        )}
        {c.phone && (
          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 admin-text-subtle mt-0.5" />
            <div>
              <p className="admin-text-subtle text-[11px] uppercase tracking-wider font-semibold">Teléfono</p>
              <a href={`tel:${c.phone}`} style={{ color: 'var(--admin-text)' }} className="tabular-nums hover:text-[color:var(--admin-accent)]">{c.phone}</a>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2.5">
          <Mail className="w-4 h-4 admin-text-subtle mt-0.5" />
          <div>
            <p className="admin-text-subtle text-[11px] uppercase tracking-wider font-semibold">Email</p>
            <a href={`mailto:${c.email}`} style={{ color: 'var(--admin-text)' }} className="hover:text-[color:var(--admin-accent)] truncate block">{c.email}</a>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Calendar className="w-4 h-4 admin-text-subtle mt-0.5" />
          <div>
            <p className="admin-text-subtle text-[11px] uppercase tracking-wider font-semibold">Cliente desde</p>
            <p style={{ color: 'var(--admin-text)' }}>{formatDate(c.created_at)}</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label="Gasto total"
          value={formatPrice(data.kpis.lifetime_spend)}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="emerald"
          hint={`${data.kpis.order_count} órden${data.kpis.order_count === 1 ? '' : 'es'}`}
        />
        <StatCard
          label="Ticket promedio"
          value={formatPrice(data.kpis.avg_ticket)}
          icon={<CreditCard className="w-4 h-4" />}
          accent="indigo"
        />
        <StatCard
          label="Última compra"
          value={relativeDays(data.kpis.last_order) ?? '—'}
          icon={<Clock className="w-4 h-4" />}
          accent="blue"
          hint={data.kpis.last_order ? formatDate(data.kpis.last_order) : 'Sin compras'}
        />
        <StatCard
          label="Frecuencia"
          value={data.kpis.frequency_days ? `${data.kpis.frequency_days}d` : '—'}
          icon={<Calendar className="w-4 h-4" />}
          accent="violet"
          hint={data.kpis.next_predicted ? `Próxima ~${formatDate(data.kpis.next_predicted)}` : 'Necesita 2+ compras'}
        />
      </div>

      {c.type === 'registered' && typeof c.loyalty_points === 'number' && (
        <div className="admin-surface p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Star className="w-5 h-5" style={{ color: '#d97706' }} />
            </div>
            <div>
              <p className="text-[11.5px] uppercase tracking-wider font-semibold admin-text-subtle">Puntos de fidelidad</p>
              <p className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--admin-text)' }}>{c.loyalty_points.toLocaleString('es-CL')}</p>
            </div>
          </div>
          <p className="text-[12px] admin-text-muted text-right">
            Equivalente a<br />
            <span className="font-semibold tabular-nums" style={{ color: 'var(--admin-text)' }}>{formatPrice(c.loyalty_points * 100)}</span> en descuento
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-surface overflow-hidden">
        <div className="flex border-b admin-hairline overflow-x-auto">
          {[
            { id: 'orders' as const, label: 'Órdenes', icon: <ShoppingBag className="w-3.5 h-3.5" />, count: data.orders.length },
            { id: 'recurrent' as const, label: 'Productos recurrentes', icon: <Package className="w-3.5 h-3.5" />, count: data.kpis.top_recurrent.length },
            { id: 'prescriptions' as const, label: 'Recetas', icon: <FileText className="w-3.5 h-3.5" />, count: data.prescriptions.length },
            { id: 'loyalty' as const, label: 'Puntos', icon: <Star className="w-3.5 h-3.5" />, count: data.loyalty_transactions.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-[12.5px] whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'border-b-2 font-semibold'
                  : 'admin-text-muted hover:text-[color:var(--admin-text)]'
              }`}
              style={tab === t.id ? { borderBottomColor: 'var(--admin-accent)', color: 'var(--admin-text)' } : undefined}
            >
              {t.icon}
              {t.label}
              <span className="text-[10.5px] tabular-nums admin-text-subtle">({t.count})</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'orders' && (
            data.orders.length === 0 ? (
              <p className="admin-text-subtle text-[12.5px] text-center py-6">Sin órdenes registradas</p>
            ) : (
              <ul className="space-y-2">
                {data.orders.slice(0, 50).map((o) => (
                  <li key={o.id} className="border admin-hairline rounded-lg p-3 hover:bg-[color:var(--admin-surface-2)] transition-colors">
                    <Link href={`/admin/ordenes/${o.id}`} className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[12.5px]">
                          <span className="font-semibold tabular-nums" style={{ color: 'var(--admin-text)' }}>#{o.id.slice(0, 8)}</span>
                          <span className="admin-text-subtle">{formatDate(o.created_at)}</span>
                          <span className="admin-text-subtle">·</span>
                          <span className="admin-text-muted">{STATUS_LABEL[o.status] ?? o.status}</span>
                          {o.payment_provider && <span className="admin-text-subtle">· {o.payment_provider}</span>}
                        </div>
                        <p className="text-[11.5px] admin-text-subtle mt-0.5 truncate">
                          {o.items.length} producto{o.items.length === 1 ? '' : 's'} ·{' '}
                          {o.items.slice(0, 2).map((i) => i.product_name).join(', ')}
                          {o.items.length > 2 ? '…' : ''}
                        </p>
                      </div>
                      <span className="tabular-nums font-semibold text-[13.5px]" style={{ color: 'var(--admin-text)' }}>
                        {formatPrice(Number(o.total))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === 'recurrent' && (
            data.kpis.top_recurrent.length === 0 ? (
              <p className="admin-text-subtle text-[12.5px] text-center py-6">No hay productos comprados ≥2 veces</p>
            ) : (
              <ul className="space-y-1.5">
                {data.kpis.top_recurrent.map((p, i) => (
                  <li key={(p.product_id ?? p.product_name) + i} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-[color:var(--admin-surface-2)] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="tabular-nums admin-text-subtle text-[11px] w-5">{i + 1}</span>
                      {p.product_id ? (
                        <Link href={`/admin/productos?id=${p.product_id}`} className="text-[13px] truncate hover:text-[color:var(--admin-accent)]" style={{ color: 'var(--admin-text)' }}>
                          {p.product_name}
                        </Link>
                      ) : (
                        <span className="text-[13px] truncate" style={{ color: 'var(--admin-text)' }}>{p.product_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11.5px] tabular-nums shrink-0">
                      <span className="admin-text-muted">{p.orders} órdenes</span>
                      <span className="font-semibold" style={{ color: 'var(--admin-accent)' }}>{p.total_qty} u</span>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === 'prescriptions' && (
            data.prescriptions.length === 0 ? (
              <p className="admin-text-subtle text-[12.5px] text-center py-6">Sin recetas registradas</p>
            ) : (
              <ul className="space-y-2">
                {data.prescriptions.map((p) => (
                  <li key={p.id} className="border admin-hairline rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold" style={{ color: 'var(--admin-text)' }}>{p.product_name}</span>
                          {p.is_controlled && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border border-red-500/30 text-red-700 dark:text-red-400 bg-red-500/[0.08]">
                              Controlado
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] admin-text-subtle mt-1">
                          {p.doctor_name ? `Dr(a). ${p.doctor_name}` : 'Sin médico registrado'}
                          {p.prescription_number ? ` · Nº ${p.prescription_number}` : ''}
                        </p>
                      </div>
                      <span className="text-[11.5px] admin-text-subtle whitespace-nowrap">{formatDate(p.dispensed_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === 'loyalty' && (
            data.loyalty_transactions.length === 0 ? (
              <p className="admin-text-subtle text-[12.5px] text-center py-6">Sin transacciones de puntos</p>
            ) : (
              <ul className="divide-y admin-hairline">
                {data.loyalty_transactions.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2.5 text-[13px]">
                    <div>
                      <p style={{ color: 'var(--admin-text)' }}>{t.reason}</p>
                      <p className="text-[11.5px] admin-text-subtle">{formatDate(t.created_at)}</p>
                    </div>
                    <span className={`tabular-nums font-semibold ${t.points >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {t.points >= 0 ? '+' : ''}{t.points} pts
                    </span>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>
    </div>
  );
}
