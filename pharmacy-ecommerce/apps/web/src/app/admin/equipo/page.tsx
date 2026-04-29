'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { isOwnerRole } from '@/lib/roles';
import { formatPrice } from '@/lib/format';
import { Trophy, Users, Receipt, ShoppingBag, Crown, Medal, Award, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { StatCard } from '@/components/admin/ui/StatCard';

type Period = 'today' | 'week' | 'month';

interface Seller {
  uid: string;
  name: string;
  revenue: number;
  count: number;
  avg_ticket: number;
  share_pct: number;
  first_sale: string | null;
  last_sale: string | null;
  top_product: { name: string; units: number } | null;
  sparkline: number[];
}

interface EquipoData {
  period: Period;
  totals: { revenue: number; count: number; avg_ticket: number; sellers_active: number };
  sellers: Seller[];
  spark_days: string[];
}

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: '7 días' },
  { id: 'month', label: 'Mes' },
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const W = 80;
  const H = 24;
  const step = data.length > 1 ? W / (data.length - 1) : W;
  const points = data
    .map((v, i) => `${i * step},${H - ((v - min) / range) * H}`)
    .join(' ');
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth={1.5} points={points} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) * step} cy={H - ((data[data.length - 1] - min) / range) * H} r={2} fill={color} />
    </svg>
  );
}

function PodiumIcon({ rank }: { rank: number }) {
  if (rank === 0) return <Crown className="w-4 h-4 text-amber-500" />;
  if (rank === 1) return <Medal className="w-4 h-4 text-zinc-400" />;
  if (rank === 2) return <Award className="w-4 h-4 text-orange-500" />;
  return null;
}

export default function EquipoPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<EquipoData | null>(null);
  const [period, setPeriod] = useState<Period>('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (!isOwnerRole(user.role)) { router.push('/'); return; }
  }, [user, router]);

  useEffect(() => {
    if (!user || !isOwnerRole(user.role)) return;
    setLoading(true);
    fetch(`/api/admin/equipo?period=${period}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [user, period]);

  if (!user || !isOwnerRole(user.role)) return null;

  const periodLabel = useMemo(() => {
    if (period === 'today') return 'hoy';
    if (period === 'week') return 'últimos 7 días';
    return 'mes en curso';
  }, [period]);

  const podium = data?.sellers.slice(0, 3) ?? [];
  const rest = data?.sellers.slice(3) ?? [];

  return (
    <div>
      <PageHeader
        title="Equipo · rendimiento"
        description={`Comparativa de vendedores · ${periodLabel}`}
        icon={<Trophy className="w-5 h-5" />}
        badge={
          <span className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider rounded-md border border-violet-500/30 text-violet-700 dark:text-violet-400 bg-violet-500/[0.08]">
            Solo dueño
          </span>
        }
        actions={
          <div className="inline-flex rounded-lg border admin-hairline overflow-hidden" style={{ background: 'var(--admin-elevated)' }}>
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 h-9 text-[12.5px] font-medium transition-colors ${
                  period === p.id
                    ? 'text-white'
                    : 'admin-text-muted hover:text-[color:var(--admin-text)]'
                }`}
                style={period === p.id ? { background: 'var(--admin-accent)' } : undefined}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {loading || !data ? (
        <div className="flex justify-center py-16"><div className="admin-spinner" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Ventas equipo"
              value={formatPrice(data.totals.revenue)}
              icon={<Receipt className="w-4 h-4" />}
              accent="emerald"
              hint={`${data.totals.count} transacción${data.totals.count !== 1 ? 'es' : ''}`}
            />
            <StatCard
              label="Ticket promedio"
              value={formatPrice(data.totals.avg_ticket)}
              icon={<ShoppingBag className="w-4 h-4" />}
              accent="indigo"
              hint="todo el equipo"
            />
            <StatCard
              label="Vendedores activos"
              value={data.totals.sellers_active.toString()}
              icon={<Users className="w-4 h-4" />}
              accent="violet"
              hint={periodLabel}
            />
            <StatCard
              label="Top vendedor"
              value={podium[0] ? formatPrice(podium[0].revenue) : '—'}
              icon={<Crown className="w-4 h-4" />}
              accent="amber"
              hint={podium[0]?.name ?? 'sin ventas'}
            />
          </div>

          {data.sellers.length === 0 ? (
            <div className="admin-surface p-12 text-center">
              <Sparkles className="w-8 h-8 mx-auto admin-text-subtle mb-3" />
              <p className="text-[14px]" style={{ color: 'var(--admin-text)' }}>Sin ventas POS en este período</p>
              <p className="text-[12.5px] admin-text-muted mt-1">
                Las ventas se atribuyen al usuario con sesión activa al confirmar la venta en POS.
              </p>
            </div>
          ) : (
            <>
              {podium.length > 0 && (
                <div className="grid md:grid-cols-3 gap-4">
                  {podium.map((s, i) => {
                    const colors = [
                      { bg: 'rgba(245, 158, 11, 0.10)', fg: '#d97706', border: 'rgba(245, 158, 11, 0.30)' },
                      { bg: 'rgba(161, 161, 170, 0.12)', fg: '#71717a', border: 'rgba(161, 161, 170, 0.35)' },
                      { bg: 'rgba(249, 115, 22, 0.10)', fg: '#ea580c', border: 'rgba(249, 115, 22, 0.30)' },
                    ];
                    const c = colors[i];
                    return (
                      <div
                        key={s.uid}
                        className="rounded-xl p-5 relative overflow-hidden"
                        style={{ background: 'var(--admin-elevated)', border: `1px solid ${c.border}` }}
                      >
                        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: c.fg }} />
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <PodiumIcon rank={i} />
                            <span className="text-[11px] font-semibold uppercase tracking-wider admin-text-subtle">
                              {i === 0 ? '1er lugar' : i === 1 ? '2do lugar' : '3er lugar'}
                            </span>
                          </div>
                          <span className="text-[10.5px] tabular-nums admin-text-subtle">
                            {s.share_pct.toFixed(0)}% del total
                          </span>
                        </div>
                        <p className="text-[15px] font-semibold truncate" style={{ color: 'var(--admin-text)' }}>
                          {s.name}
                        </p>
                        <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1" style={{ color: c.fg }}>
                          {formatPrice(s.revenue)}
                        </p>
                        <div className="flex items-center justify-between mt-3 text-[12px] admin-text-muted">
                          <span>{s.count} tx · ticket {formatPrice(s.avg_ticket)}</span>
                          <Sparkline data={s.sparkline} color={c.fg} />
                        </div>
                        {s.top_product && (
                          <p className="text-[11.5px] admin-text-subtle mt-2 truncate">
                            ★ {s.top_product.name} · {s.top_product.units}u
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {rest.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--admin-elevated)', border: '1px solid var(--admin-border-strong)' }}>
                  <div className="px-5 py-3 border-b admin-hairline">
                    <p className="font-semibold text-[13.5px]" style={{ color: 'var(--admin-text)' }}>Resto del equipo</p>
                  </div>
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b admin-hairline">
                        <th className="px-5 py-2 text-left text-[11px] uppercase tracking-wider admin-text-subtle font-semibold">#</th>
                        <th className="px-5 py-2 text-left text-[11px] uppercase tracking-wider admin-text-subtle font-semibold">Vendedor</th>
                        <th className="px-5 py-2 text-right text-[11px] uppercase tracking-wider admin-text-subtle font-semibold">Ventas</th>
                        <th className="px-5 py-2 text-right text-[11px] uppercase tracking-wider admin-text-subtle font-semibold">Tx</th>
                        <th className="px-5 py-2 text-right text-[11px] uppercase tracking-wider admin-text-subtle font-semibold">Ticket</th>
                        <th className="px-5 py-2 text-right text-[11px] uppercase tracking-wider admin-text-subtle font-semibold">% total</th>
                        <th className="px-5 py-2 text-left text-[11px] uppercase tracking-wider admin-text-subtle font-semibold hidden md:table-cell">Top producto</th>
                        <th className="px-5 py-2 text-right text-[11px] uppercase tracking-wider admin-text-subtle font-semibold hidden lg:table-cell">7d</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rest.map((s, i) => (
                        <tr key={s.uid} className="border-b admin-hairline hover:bg-[color:var(--admin-surface-2)] transition-colors">
                          <td className="px-5 py-2.5 admin-text-subtle tabular-nums">{i + 4}</td>
                          <td className="px-5 py-2.5" style={{ color: 'var(--admin-text)' }}>{s.name}</td>
                          <td className="px-5 py-2.5 text-right tabular-nums font-medium" style={{ color: 'var(--admin-text)' }}>{formatPrice(s.revenue)}</td>
                          <td className="px-5 py-2.5 text-right tabular-nums admin-text-muted">{s.count}</td>
                          <td className="px-5 py-2.5 text-right tabular-nums admin-text-muted">{formatPrice(s.avg_ticket)}</td>
                          <td className="px-5 py-2.5 text-right tabular-nums admin-text-muted">{s.share_pct.toFixed(0)}%</td>
                          <td className="px-5 py-2.5 admin-text-muted truncate max-w-[180px] hidden md:table-cell">
                            {s.top_product ? `${s.top_product.name} (${s.top_product.units}u)` : '—'}
                          </td>
                          <td className="px-5 py-2.5 text-right hidden lg:table-cell">
                            <Sparkline data={s.sparkline} color="var(--admin-accent)" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between admin-text-subtle text-[11.5px] px-1">
            <span>Sparkline = ventas POS últimos 7 días por vendedor</span>
            <Link href="/admin/cierre-dia" className="hover:text-[color:var(--admin-accent)]">Cierre del día →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
