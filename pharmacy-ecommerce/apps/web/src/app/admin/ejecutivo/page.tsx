'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { isOwnerRole } from '@/lib/roles';
import { formatPrice } from '@/lib/format';
import {
  Crown, DollarSign, TrendingUp, TrendingDown, Wallet, AlertTriangle,
  ShoppingBag, Package, Activity, ArrowRight, Calculator, Receipt, Target,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { StatCard } from '@/components/admin/ui/StatCard';
import { DailyChecklist } from '@/components/admin/DailyChecklist';
import { HealthScoreCard, type HealthData } from '@/components/admin/HealthScoreCard';
import { ActivityFeedWidget } from '@/components/admin/ActivityFeedWidget';

interface ExecData {
  health?: HealthData;
  kpis: {
    ingresos: number; ingresos_prev: number; ingresos_yoy: number;
    cogs: number; gross_margin: number; gross_margin_pct: number;
    gastos: number; gastos_prev: number;
    ebitda: number;
    mom_pct: number; yoy_pct: number;
    order_count: number;
  };
  ap: {
    open_count: number; open_amount: number;
    overdue_count: number; overdue_amount: number;
    due_7d_count: number; due_7d_amount: number;
  };
  ops: {
    pending_faltas: number;
    critical_stock: number;
  };
  top_margin: Array<{ id: string; name: string; margin: number; marginPct: number }>;
  top_rotation: Array<{ product_id: string | null; product_name: string; units: number }>;
  forecast: {
    monthly_target: number;
    revenue_so_far: number;
    daily_avg: number;
    forecast_close: number;
    target_progress_pct: number;
    forecast_vs_target_pct: number;
    days_elapsed: number;
    days_in_month: number;
  };
}

export default function EjecutivoPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<ExecData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isOwnerRole(user.role)) { router.push('/'); return; }
    fetch('/api/admin/ejecutivo', { credentials: 'include' })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user || !isOwnerRole(user.role)) return null;

  const monthName = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  return (
    <div>
      <DailyChecklist />
      <PageHeader
        title="Vista ejecutiva"
        description={`Pulso financiero del negocio · ${monthName}`}
        icon={<Crown className="w-5 h-5" />}
        badge={
          <span className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider rounded-md border border-violet-500/30 text-violet-700 dark:text-violet-400 bg-violet-500/[0.08]">
            Solo dueño
          </span>
        }
      />

      {loading || !data ? (
        <div className="admin-surface p-12 text-center admin-text-muted text-sm">Cargando…</div>
      ) : (
        <div className="space-y-6">
          {/* Health Score */}
          {data.health && <HealthScoreCard data={data.health} />}

          {/* Alertas accionables */}
          {(data.ap.overdue_count > 0 || data.ops.pending_faltas > 0 || data.kpis.mom_pct < -10) && (
            <div className="admin-surface p-4 border-l-2" style={{ borderLeftColor: '#dc2626' }}>
              <p className="text-[12px] uppercase tracking-wider font-semibold admin-text-muted mb-3">
                Alertas accionables
              </p>
              <div className="space-y-2">
                {data.ap.overdue_count > 0 && (
                  <Link
                    href="/admin/finanzas/cuentas-pagar"
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-[color:var(--admin-accent-soft)] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <div>
                        <p className="text-[13.5px]" style={{ color: 'var(--admin-text)' }}>
                          AP vencido: {formatPrice(data.ap.overdue_amount)}
                        </p>
                        <p className="text-[11.5px] admin-text-subtle">
                          {data.ap.overdue_count} factura{data.ap.overdue_count !== 1 ? 's' : ''} sin pagar
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 admin-text-subtle" />
                  </Link>
                )}
                {data.kpis.mom_pct < -10 && (
                  <div className="flex items-center gap-2.5 p-2.5">
                    <TrendingDown className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-[13.5px]" style={{ color: 'var(--admin-text)' }}>
                      Ingresos cayeron {Math.abs(data.kpis.mom_pct).toFixed(0)}% vs mes anterior
                    </p>
                  </div>
                )}
                {data.ops.pending_faltas > 0 && (
                  <Link
                    href="/admin/faltas"
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-[color:var(--admin-accent-soft)] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-violet-500 shrink-0" />
                      <p className="text-[13.5px]" style={{ color: 'var(--admin-text)' }}>
                        {data.ops.pending_faltas} faltas pendientes — ventas perdidas
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 admin-text-subtle" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* KPIs financieros */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
            <StatCard
              label="Ingresos del mes"
              value={formatPrice(data.kpis.ingresos)}
              icon={<DollarSign className="w-4 h-4" />}
              accent="emerald"
              delta={{ value: data.kpis.mom_pct, label: 'vs mes anterior' }}
              hint={`${data.kpis.order_count} órdenes`}
            />
            <StatCard
              label="Margen bruto"
              value={formatPrice(data.kpis.gross_margin)}
              icon={<TrendingUp className="w-4 h-4" />}
              accent="indigo"
              hint={`${data.kpis.gross_margin_pct.toFixed(1)}% del ingreso`}
            />
            <StatCard
              label="EBITDA estimado"
              value={formatPrice(data.kpis.ebitda)}
              icon={<Calculator className="w-4 h-4" />}
              accent={data.kpis.ebitda >= 0 ? 'emerald' : 'red'}
              hint="Margen bruto − gastos"
            />
            <StatCard
              label="Gastos operativos"
              value={formatPrice(data.kpis.gastos)}
              icon={<Wallet className="w-4 h-4" />}
              accent="amber"
              hint={`vs ${formatPrice(data.kpis.gastos_prev)} mes anterior`}
            />
            <StatCard
              label="AP vencido"
              value={formatPrice(data.ap.overdue_amount)}
              icon={<AlertTriangle className="w-4 h-4" />}
              accent="red"
              hint={`${data.ap.overdue_count} facturas`}
              alert={data.ap.overdue_count > 0}
              href="/admin/finanzas/cuentas-pagar"
            />
            <StatCard
              label="AP por vencer 7d"
              value={formatPrice(data.ap.due_7d_amount)}
              icon={<Receipt className="w-4 h-4" />}
              accent="amber"
              hint={`${data.ap.due_7d_count} facturas`}
              href="/admin/finanzas/cuentas-pagar"
            />
          </div>

          {/* Forecast + meta mensual */}
          {data.forecast && (
            <div className="admin-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: 'var(--admin-accent)' }} />
                  <h3 className="text-[14px] font-semibold" style={{ color: 'var(--admin-text)' }}>
                    Meta del mes
                  </h3>
                </div>
                {data.forecast.monthly_target === 0 && (
                  <Link href="/admin/configuracion" className="text-[11.5px] admin-text-muted hover:text-[color:var(--admin-accent)]">
                    Configurar meta →
                  </Link>
                )}
              </div>

              {data.forecast.monthly_target > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12.5px]">
                    <div>
                      <p className="admin-text-subtle uppercase tracking-wider text-[10.5px] font-semibold">Meta</p>
                      <p className="text-base font-semibold tabular-nums mt-1" style={{ color: 'var(--admin-text)' }}>{formatPrice(data.forecast.monthly_target)}</p>
                    </div>
                    <div>
                      <p className="admin-text-subtle uppercase tracking-wider text-[10.5px] font-semibold">Avance</p>
                      <p className="text-base font-semibold tabular-nums mt-1" style={{ color: 'var(--admin-text)' }}>{formatPrice(data.forecast.revenue_so_far)}</p>
                      <p className="text-[11px] admin-text-muted">{data.forecast.target_progress_pct.toFixed(0)}% · día {data.forecast.days_elapsed}/{data.forecast.days_in_month}</p>
                    </div>
                    <div>
                      <p className="admin-text-subtle uppercase tracking-wider text-[10.5px] font-semibold">Promedio diario</p>
                      <p className="text-base font-semibold tabular-nums mt-1" style={{ color: 'var(--admin-text)' }}>{formatPrice(data.forecast.daily_avg)}</p>
                    </div>
                    <div>
                      <p className="admin-text-subtle uppercase tracking-wider text-[10.5px] font-semibold">Proyección cierre</p>
                      <p className={`text-base font-semibold tabular-nums mt-1 ${data.forecast.forecast_vs_target_pct >= 100 ? 'text-emerald-500' : data.forecast.forecast_vs_target_pct >= 85 ? 'text-amber-500' : 'text-red-500'}`}>{formatPrice(data.forecast.forecast_close)}</p>
                      <p className="text-[11px] admin-text-muted">{data.forecast.forecast_vs_target_pct.toFixed(0)}% de la meta</p>
                    </div>
                  </div>

                  <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--admin-surface-2)' }}>
                    <div
                      className="absolute inset-y-0 left-0 transition-all"
                      style={{
                        width: `${Math.min(100, data.forecast.target_progress_pct)}%`,
                        background: data.forecast.target_progress_pct >= 100 ? '#10b981' : 'var(--admin-accent)',
                      }}
                    />
                    <div
                      className="absolute inset-y-0 w-0.5 bg-zinc-400"
                      style={{ left: `${Math.min(100, (data.forecast.days_elapsed / data.forecast.days_in_month) * 100)}%` }}
                      title="Pace ideal"
                    />
                  </div>
                  <p className="text-[11px] admin-text-subtle">
                    {data.forecast.forecast_vs_target_pct >= 100
                      ? `Vas a superar la meta por ${formatPrice(data.forecast.forecast_close - data.forecast.monthly_target)}`
                      : `Faltan ${formatPrice(data.forecast.monthly_target - data.forecast.forecast_close)} para cumplir al ritmo actual`}
                  </p>
                </div>
              ) : (
                <p className="text-[12.5px] admin-text-subtle">
                  Sin meta configurada. Define la meta mensual en{' '}
                  <Link href="/admin/configuracion" className="text-[color:var(--admin-accent)] hover:underline">configuración</Link>.
                </p>
              )}
            </div>
          )}

          {/* YoY card */}
          <div className="admin-surface p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle">
                  Año vs año anterior
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums" style={{ color: 'var(--admin-text)' }}>
                  {data.kpis.yoy_pct >= 0 ? '+' : ''}{data.kpis.yoy_pct.toFixed(1)}%
                </p>
                <p className="text-[12.5px] admin-text-muted mt-1">
                  {formatPrice(data.kpis.ingresos)} vs {formatPrice(data.kpis.ingresos_yoy)}
                </p>
              </div>
              {data.kpis.yoy_pct >= 0 ? (
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
            </div>
          </div>

          {/* Top tables */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="admin-surface p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-semibold" style={{ color: 'var(--admin-text)' }}>
                  Top 5 productos por margen
                </h3>
                <Link href="/admin/costos" className="text-[11.5px] admin-text-muted hover:text-[color:var(--admin-accent)]">
                  Ver todos →
                </Link>
              </div>
              {data.top_margin.length === 0 ? (
                <p className="text-[12.5px] admin-text-subtle">Sin datos de costo configurados</p>
              ) : (
                <ul className="space-y-2">
                  {data.top_margin.map((p, i) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="admin-text-subtle tabular-nums w-4">{i + 1}</span>
                        <span className="truncate" style={{ color: 'var(--admin-text)' }}>{p.name}</span>
                      </span>
                      <span className="shrink-0 tabular-nums font-medium" style={{ color: 'var(--admin-accent)' }}>
                        {formatPrice(p.margin)}
                        <span className="admin-text-subtle font-normal ml-1.5">({p.marginPct.toFixed(0)}%)</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="admin-surface p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-semibold" style={{ color: 'var(--admin-text)' }}>
                  Top 5 por rotación (mes)
                </h3>
                <Link href="/admin/reportes" className="text-[11.5px] admin-text-muted hover:text-[color:var(--admin-accent)]">
                  Ver reporte →
                </Link>
              </div>
              {data.top_rotation.length === 0 ? (
                <p className="text-[12.5px] admin-text-subtle">Sin ventas este mes</p>
              ) : (
                <ul className="space-y-2">
                  {data.top_rotation.map((p, i) => (
                    <li key={p.product_id ?? i} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="admin-text-subtle tabular-nums w-4">{i + 1}</span>
                        <span className="truncate" style={{ color: 'var(--admin-text)' }}>{p.product_name}</span>
                      </span>
                      <span className="shrink-0 tabular-nums font-medium" style={{ color: 'var(--admin-accent)' }}>
                        {p.units} u
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Activity feed widget */}
          <ActivityFeedWidget />

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/admin/finanzas/cuentas-pagar" className="admin-surface p-4 hover:border-[color:var(--admin-accent)] transition-colors flex items-center gap-3">
              <Wallet className="w-4 h-4" style={{ color: 'var(--admin-accent)' }} />
              <span className="text-[13px]" style={{ color: 'var(--admin-text)' }}>Cuentas por pagar</span>
            </Link>
            <Link href="/admin/finanzas/pyl" className="admin-surface p-4 hover:border-[color:var(--admin-accent)] transition-colors flex items-center gap-3">
              <Activity className="w-4 h-4" style={{ color: 'var(--admin-accent)' }} />
              <span className="text-[13px]" style={{ color: 'var(--admin-text)' }}>P&L mensual</span>
            </Link>
            <Link href="/admin/costos" className="admin-surface p-4 hover:border-[color:var(--admin-accent)] transition-colors flex items-center gap-3">
              <Calculator className="w-4 h-4" style={{ color: 'var(--admin-accent)' }} />
              <span className="text-[13px]" style={{ color: 'var(--admin-text)' }}>Análisis costos</span>
            </Link>
            <Link href="/admin/reportes" className="admin-surface p-4 hover:border-[color:var(--admin-accent)] transition-colors flex items-center gap-3">
              <ShoppingBag className="w-4 h-4" style={{ color: 'var(--admin-accent)' }} />
              <span className="text-[13px]" style={{ color: 'var(--admin-text)' }}>Reportes</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
