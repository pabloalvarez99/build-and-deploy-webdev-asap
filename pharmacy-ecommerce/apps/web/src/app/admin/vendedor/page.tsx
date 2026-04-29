'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { isAdminRole } from '@/lib/roles';
import { formatPrice } from '@/lib/format';
import {
  Receipt, ShoppingBag, Wallet, ArrowRight, Package,
  Phone, Clock, AlertTriangle, BadgeCheck, ScanBarcode,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { StatCard } from '@/components/admin/ui/StatCard';
import { AnnouncementsBanner } from '@/components/admin/AnnouncementsBanner';
import { MyTasksCard } from '@/components/admin/MyTasksCard';
import { DailyGoalGauge } from '@/components/admin/DailyGoalGauge';

interface VendedorData {
  turno: { inicio: string; fondo_inicial: number; configurado: boolean };
  mis_ventas: { revenue: number; count: number; avg_ticket: number };
  meta: { daily_goal: number; revenue_today: number; progress_pct: number };
  bandeja_retiros: Array<{
    id: string;
    pickup_code: string | null;
    total: number;
    customer: string;
    phone: string | null;
    expires_at: string | null;
    created_at: string;
  }>;
  mis_tareas: Array<{
    id: string; title: string; description: string | null;
    priority: string; due_date: string | null; status: string;
    assigned_role: string | null; created_by_name: string | null;
  }>;
  avisos: Array<{
    id: string; title: string; body: string;
    severity: string; pinned: boolean;
    created_by_name: string | null; created_at: string;
  }>;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function hoursSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = ms / 3600000;
  if (hours < 1) return `${Math.floor(ms / 60000)}m`;
  return `${hours.toFixed(1)}h`;
}

export default function VendedorPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<VendedorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (!isAdminRole(user.role)) { router.push('/'); return; }
  }, [user, router]);

  useEffect(() => {
    if (!user || !isAdminRole(user.role)) return;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/vendedor', { credentials: 'include' });
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, [user]);

  if (!user || !isAdminRole(user.role)) return null;

  const todayLabel = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  return (
    <div>
      <PageHeader
        title={`${greeting}${user.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description={todayLabel + ' · Tu panel de vendedor'}
        icon={<BadgeCheck className="w-5 h-5" />}
        badge={
          data?.turno.configurado ? (
            <span className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider rounded-md border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/[0.08]">
              Caja activa
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider rounded-md border border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/[0.08]">
              Caja sin abrir
            </span>
          )
        }
        actions={
          <Link
            href="/admin/pos"
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg text-[13px] font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
            style={{ background: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-2))' }}
          >
            <Receipt className="w-4 h-4" />
            Abrir POS
          </Link>
        }
      />

      <AnnouncementsBanner items={data?.avisos} />

      {loading || !data ? (
        <div className="flex justify-center py-16"><div className="admin-spinner" /></div>
      ) : (
        <div className="space-y-6">
          {!data.turno.configurado && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/[0.06] px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="text-[13.5px] font-semibold text-amber-700 dark:text-amber-400">Configura el fondo de caja</p>
                <p className="text-[12.5px] admin-text-muted mt-0.5">Antes de empezar a vender, abre el turno desde Arqueo.</p>
              </div>
              <Link
                href="/admin/arqueo"
                className="text-[12px] font-semibold px-3 h-8 inline-flex items-center rounded-md border border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/[0.08] transition-colors"
              >
                Ir a Arqueo
              </Link>
            </div>
          )}

          {/* KPIs personales + meta */}
          <div className="grid lg:grid-cols-3 gap-4">
            <StatCard
              label="Mis ventas hoy"
              value={formatPrice(data.mis_ventas.revenue)}
              icon={<ShoppingBag className="w-4 h-4" />}
              accent="indigo"
              hint={`${data.mis_ventas.count} transacción${data.mis_ventas.count !== 1 ? 'es' : ''}`}
            />
            <StatCard
              label="Ticket promedio"
              value={formatPrice(data.mis_ventas.avg_ticket)}
              icon={<Receipt className="w-4 h-4" />}
              accent="violet"
              hint={data.mis_ventas.count > 0 ? 'mis ventas' : 'sin ventas todavía'}
            />
            <DailyGoalGauge
              goal={data.meta.daily_goal}
              current={data.meta.revenue_today}
              label="Meta del local hoy"
              hint="Suma de todas las ventas POS"
            />
          </div>

          {/* Bandeja retiros + Mis tareas */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--admin-elevated)', border: '1px solid var(--admin-border-strong)' }}>
              <div className="px-5 py-3 border-b admin-hairline flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 admin-text-muted" />
                  <p className="font-semibold text-[13.5px]" style={{ color: 'var(--admin-text)' }}>Retiros del día</p>
                  {data.bandeja_retiros.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[10.5px] font-semibold rounded-md border border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/[0.08] tabular-nums">
                      {data.bandeja_retiros.length}
                    </span>
                  )}
                </div>
                <Link href="/admin/ordenes?status=reserved" className="text-[11.5px] admin-text-muted hover:text-[color:var(--admin-accent)] flex items-center gap-1">
                  Ver órdenes <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-[color:var(--admin-border)] max-h-[400px] overflow-y-auto">
                {data.bandeja_retiros.length === 0 ? (
                  <div className="px-5 py-8 text-center admin-text-subtle text-[13px]">Sin reservas pendientes hoy</div>
                ) : (
                  data.bandeja_retiros.map((r) => {
                    const expires = r.expires_at ? new Date(r.expires_at) : null;
                    const expired = expires ? expires.getTime() < Date.now() : false;
                    return (
                      <Link
                        href={`/admin/ordenes/${r.id}`}
                        key={r.id}
                        className="block px-5 py-3 hover:bg-[color:var(--admin-surface-2)] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {r.pickup_code && (
                                <span className="font-mono text-[12.5px] font-bold tabular-nums px-2 py-0.5 rounded-md border border-indigo-500/30 text-indigo-700 dark:text-indigo-400 bg-indigo-500/[0.08]">
                                  {r.pickup_code}
                                </span>
                              )}
                              <p className="text-[13px] font-medium truncate" style={{ color: 'var(--admin-text)' }}>
                                {r.customer}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-[11.5px] admin-text-muted">
                              {r.phone && (
                                <a
                                  href={`tel:${r.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 hover:text-[color:var(--admin-accent)]"
                                >
                                  <Phone className="w-2.5 h-2.5" /> {r.phone}
                                </a>
                              )}
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> hace {hoursSince(r.created_at)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--admin-text)' }}>
                              {formatPrice(r.total)}
                            </p>
                            {expires && (
                              <p className={`text-[10.5px] font-semibold ${expired ? 'text-red-600 dark:text-red-400' : 'admin-text-subtle'}`}>
                                {expired ? 'Vencida' : `Expira ${fmtTime(r.expires_at!)}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            <MyTasksCard initial={data.mis_tareas} />
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/admin/pos" className="admin-surface p-4 hover:border-[color:var(--admin-accent)] transition-colors flex items-center gap-3">
              <ScanBarcode className="w-4 h-4" style={{ color: 'var(--admin-accent)' }} />
              <span className="text-[13px]" style={{ color: 'var(--admin-text)' }}>POS · vender</span>
            </Link>
            <Link href="/admin/arqueo" className="admin-surface p-4 hover:border-[color:var(--admin-accent)] transition-colors flex items-center gap-3">
              <Wallet className="w-4 h-4" style={{ color: 'var(--admin-accent)' }} />
              <span className="text-[13px]" style={{ color: 'var(--admin-text)' }}>Arqueo · cierre</span>
            </Link>
            <Link href="/admin/ordenes" className="admin-surface p-4 hover:border-[color:var(--admin-accent)] transition-colors flex items-center gap-3">
              <ShoppingBag className="w-4 h-4" style={{ color: 'var(--admin-accent)' }} />
              <span className="text-[13px]" style={{ color: 'var(--admin-text)' }}>Órdenes</span>
            </Link>
            <Link href="/admin/clientes" className="admin-surface p-4 hover:border-[color:var(--admin-accent)] transition-colors flex items-center gap-3">
              <BadgeCheck className="w-4 h-4" style={{ color: 'var(--admin-accent)' }} />
              <span className="text-[13px]" style={{ color: 'var(--admin-text)' }}>Clientes</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
