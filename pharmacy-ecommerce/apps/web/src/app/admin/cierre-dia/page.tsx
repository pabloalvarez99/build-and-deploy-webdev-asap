'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { isAdminRole, isOwnerRole } from '@/lib/roles';
import { formatPrice } from '@/lib/format';
import {
  ClipboardCheck, Receipt, TrendingUp, Wallet, Stethoscope, CheckSquare,
  AlertTriangle, Package, Printer, Mail, ArrowRight, Sun,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { StatCard } from '@/components/admin/ui/StatCard';

interface CierreData {
  date: string;
  date_label: string;
  ventas: {
    total: number; count: number; delta_pct: number | null; prev_total: number; avg_ticket: number;
    pos: { revenue: number; count: number; efectivo: number; debito: number; credito: number; mixto_count: number };
    online: { revenue: number; count: number };
  };
  finanzas: { cogs: number; margen_bruto: number | null; margen_pct: number | null; gastos: number; gastos_count: number };
  caja: null | {
    turno_inicio: string; turno_fin: string; fondo_inicial: number;
    ventas_total: number; efectivo_esperado: number; efectivo_contado: number;
    diferencia: number; cerrado_por: string | null; notas: string | null;
  };
  farmacia: {
    recetas_total: number; recetas_controladas: number;
    turno: { pharmacist_name: string; shift_start: string; shift_end: string | null } | null;
  };
  tareas: { completadas_hoy: number; abiertas: number; atrasadas: number };
  avisos_activos: number;
  por_vendedor: { uid: string; name: string; revenue: number; count: number }[];
  top_productos: { name: string; units: number; revenue: number; cogs: number }[];
  manana: {
    retiros: { id: string; pickup_code: string | null; total: number; customer: string; phone: string | null; expires_at: string | null }[];
    alertas: { stock_cero: number; lotes_7d: number; faltas_con_stock: number };
  };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

export default function CierreDiaPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [date, setDate] = useState<string>(todayISO());
  const [data, setData] = useState<CierreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (!isAdminRole(user.role)) { router.push('/'); return; }
  }, [user, router]);

  useEffect(() => {
    if (!user || !isAdminRole(user.role)) return;
    setLoading(true);
    fetch(`/api/admin/cierre-dia?date=${date}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [user, date]);

  if (!user || !isAdminRole(user.role)) return null;

  const isOwner = isOwnerRole(user.role);

  async function sendEmail() {
    if (!isOwner || sending) return;
    setSending(true);
    setSentMsg(null);
    try {
      const res = await fetch('/api/admin/cierre-dia/email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      const json = await res.json();
      if (res.ok) setSentMsg(`Enviado a ${json.to}`);
      else setSentMsg(json.error || 'Error al enviar');
    } catch (e: any) {
      setSentMsg(e?.message || 'Error');
    } finally {
      setSending(false);
    }
  }

  const cajaTone = data?.caja
    ? data.caja.diferencia === 0
      ? 'emerald'
      : Math.abs(data.caja.diferencia) < 1000
        ? 'amber'
        : 'red'
    : 'amber';

  return (
    <div>
      <style>{`
        @media print {
          aside, header, .no-print, button { display: none !important; }
          body, [data-admin="1"] { background: white !important; }
          main { padding: 0 !important; }
          .admin-surface { border: 1px solid #e5e7eb !important; box-shadow: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      <PageHeader
        title="Cierre del día"
        description={data ? data.date_label : 'Resumen consolidado'}
        icon={<ClipboardCheck className="w-5 h-5" />}
        badge={
          data?.caja ? (
            <span className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider rounded-md border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/[0.08]">
              Caja cerrada
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider rounded-md border border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/[0.08]">
              Caja sin cerrar
            </span>
          )
        }
        actions={
          <div className="flex items-center gap-2 no-print">
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="admin-input h-9 px-3 text-[12.5px]"
            />
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-[12.5px] font-medium border admin-hairline hover:bg-[color:var(--admin-accent-soft)] transition-colors"
              style={{ color: 'var(--admin-text)' }}
              title="Imprimir resumen"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
            {isOwner && (
              <button
                onClick={sendEmail}
                disabled={sending}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-[12.5px] font-semibold text-white shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-2))' }}
              >
                <Mail className="w-3.5 h-3.5" /> {sending ? 'Enviando…' : 'Enviar al dueño'}
              </button>
            )}
          </div>
        }
      />

      {sentMsg && (
        <div className="admin-surface px-4 py-2 mb-4 text-[12.5px]" style={{ color: 'var(--admin-text)' }}>
          {sentMsg}
        </div>
      )}

      {loading || !data ? (
        <div className="flex justify-center py-16"><div className="admin-spinner" /></div>
      ) : (
        <div className="space-y-6">
          {/* Hero KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Ventas del día"
              value={formatPrice(data.ventas.total)}
              icon={<Receipt className="w-4 h-4" />}
              accent="emerald"
              delta={data.ventas.delta_pct !== null ? { value: data.ventas.delta_pct, label: 'vs ayer' } : undefined}
              hint={`${data.ventas.count} órdenes`}
            />
            <StatCard
              label="Ticket promedio"
              value={formatPrice(data.ventas.avg_ticket)}
              icon={<TrendingUp className="w-4 h-4" />}
              accent="indigo"
              hint="todas las ventas del día"
            />
            <StatCard
              label="Margen bruto"
              value={data.finanzas.margen_bruto !== null ? formatPrice(data.finanzas.margen_bruto) : '—'}
              icon={<TrendingUp className="w-4 h-4" />}
              accent="violet"
              hint={data.finanzas.margen_pct !== null ? `${data.finanzas.margen_pct.toFixed(1)}% del ingreso` : 'sin costo cargado'}
            />
            <StatCard
              label="Diferencia caja"
              value={data.caja ? formatPrice(data.caja.diferencia) : 'sin cerrar'}
              icon={<Wallet className="w-4 h-4" />}
              accent={cajaTone as any}
              alert={!!data.caja && Math.abs(data.caja.diferencia) >= 1000}
              hint={data.caja?.cerrado_por ? `por ${data.caja.cerrado_por}` : '—'}
            />
          </div>

          {/* Desglose ventas */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="admin-surface p-5">
              <p className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle mb-4">Desglose por método de pago</p>
              <div className="space-y-2.5 text-[13px]">
                <Row label="Efectivo" value={data.ventas.pos.efectivo} count={null} />
                <Row label="Débito" value={data.ventas.pos.debito} count={null} />
                <Row label="Crédito" value={data.ventas.pos.credito} count={null} />
                {data.ventas.pos.mixto_count > 0 && (
                  <Row label="Mixto (suma a efectivo + débito)" value={0} count={data.ventas.pos.mixto_count} muted />
                )}
                <div className="border-t admin-hairline pt-2.5 mt-2.5 flex items-center justify-between">
                  <span className="font-semibold" style={{ color: 'var(--admin-text)' }}>Total POS</span>
                  <span className="tabular-nums font-semibold" style={{ color: 'var(--admin-text)' }}>{formatPrice(data.ventas.pos.revenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="admin-text-muted">Online (Webpay)</span>
                  <span className="tabular-nums admin-text-muted">{formatPrice(data.ventas.online.revenue)} · {data.ventas.online.count}</span>
                </div>
              </div>
            </div>

            <div className="admin-surface p-5">
              <p className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle mb-4">Caja del día</p>
              {data.caja ? (
                <div className="space-y-2.5 text-[13px]">
                  <Row label="Turno" value={`${fmtTime(data.caja.turno_inicio)} → ${fmtTime(data.caja.turno_fin)}`} count={null} text />
                  <Row label="Fondo inicial" value={data.caja.fondo_inicial} count={null} />
                  <Row label="Efectivo esperado" value={data.caja.efectivo_esperado} count={null} />
                  <Row label="Efectivo contado" value={data.caja.efectivo_contado} count={null} />
                  <div className="border-t admin-hairline pt-2.5 mt-2.5 flex items-center justify-between">
                    <span className="font-semibold" style={{ color: 'var(--admin-text)' }}>Diferencia</span>
                    <span className={`tabular-nums font-semibold ${
                      data.caja.diferencia === 0 ? 'text-emerald-600 dark:text-emerald-400' :
                      Math.abs(data.caja.diferencia) < 1000 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {data.caja.diferencia >= 0 ? '+' : ''}{formatPrice(data.caja.diferencia)}
                    </span>
                  </div>
                  {data.caja.notas && (
                    <p className="text-[11.5px] admin-text-muted italic mt-2">"{data.caja.notas}"</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertTriangle className="w-6 h-6 mx-auto text-amber-500 mb-2" />
                  <p className="text-[13px]" style={{ color: 'var(--admin-text)' }}>Caja aún no cerrada</p>
                  <Link href="/admin/arqueo" className="text-[12px] admin-text-muted hover:text-[color:var(--admin-accent)] inline-flex items-center gap-1 mt-1">
                    Ir a Arqueo <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Vendedores + Farmacia */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="admin-surface p-5">
              <p className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle mb-4">Ventas por vendedor</p>
              {data.por_vendedor.length === 0 ? (
                <p className="text-[12.5px] admin-text-subtle">Sin ventas POS hoy</p>
              ) : (
                <ul className="space-y-2 text-[13px]">
                  {data.por_vendedor.map((s, i) => (
                    <li key={s.uid} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="admin-text-subtle tabular-nums w-4">{i + 1}</span>
                        <span className="truncate" style={{ color: 'var(--admin-text)' }}>{s.name}</span>
                      </span>
                      <span className="tabular-nums shrink-0 admin-text-muted">
                        <span className="font-medium" style={{ color: 'var(--admin-text)' }}>{formatPrice(s.revenue)}</span>
                        <span className="ml-2 text-[11.5px]">· {s.count} tx</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {isOwner && (
                <Link href="/admin/equipo" className="mt-3 inline-flex items-center gap-1 text-[11.5px] admin-text-muted hover:text-[color:var(--admin-accent)]">
                  Ver leaderboard del equipo <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="admin-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle">Farmacia · recetas</p>
                <Stethoscope className="w-3.5 h-3.5 admin-text-muted" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--admin-text)' }}>{data.farmacia.recetas_total}</p>
                  <p className="text-[11.5px] admin-text-muted">Recetas dispensadas</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-violet-600 dark:text-violet-400">{data.farmacia.recetas_controladas}</p>
                  <p className="text-[11.5px] admin-text-muted">Controladas</p>
                </div>
              </div>
              {data.farmacia.turno ? (
                <div className="mt-4 pt-3 border-t admin-hairline text-[12px]">
                  <p style={{ color: 'var(--admin-text)' }}>
                    Turno · {data.farmacia.turno.pharmacist_name}
                  </p>
                  <p className="admin-text-muted text-[11.5px]">
                    {fmtTime(data.farmacia.turno.shift_start)}
                    {data.farmacia.turno.shift_end ? ` → ${fmtTime(data.farmacia.turno.shift_end)}` : ' · abierto'}
                  </p>
                </div>
              ) : (
                <p className="mt-4 pt-3 border-t admin-hairline text-[11.5px] admin-text-subtle">Sin turno farmacéutico abierto hoy</p>
              )}
            </div>
          </div>

          {/* Top productos */}
          {data.top_productos.length > 0 && (
            <div className="admin-surface p-5">
              <p className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle mb-4">Top 10 productos del día</p>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b admin-hairline">
                    <th className="py-2 text-left text-[11px] uppercase tracking-wider admin-text-subtle font-semibold">#</th>
                    <th className="py-2 text-left text-[11px] uppercase tracking-wider admin-text-subtle font-semibold">Producto</th>
                    <th className="py-2 text-right text-[11px] uppercase tracking-wider admin-text-subtle font-semibold">Uds.</th>
                    <th className="py-2 text-right text-[11px] uppercase tracking-wider admin-text-subtle font-semibold">Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_productos.map((p, i) => (
                    <tr key={p.name + i} className="border-b admin-hairline">
                      <td className="py-2 admin-text-subtle tabular-nums">{i + 1}</td>
                      <td className="py-2 truncate" style={{ color: 'var(--admin-text)' }}>{p.name}</td>
                      <td className="py-2 text-right tabular-nums admin-text-muted">{p.units}</td>
                      <td className="py-2 text-right tabular-nums font-medium" style={{ color: 'var(--admin-text)' }}>{formatPrice(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tareas + avisos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat label="Tareas hechas" value={data.tareas.completadas_hoy} icon={<CheckSquare className="w-3.5 h-3.5" />} tone="emerald" />
            <MiniStat label="Tareas abiertas" value={data.tareas.abiertas} icon={<CheckSquare className="w-3.5 h-3.5" />} tone="indigo" />
            <MiniStat label="Tareas atrasadas" value={data.tareas.atrasadas} icon={<AlertTriangle className="w-3.5 h-3.5" />} tone={data.tareas.atrasadas > 0 ? 'red' : 'muted'} />
            <MiniStat label="Avisos críticos activos" value={data.avisos_activos} icon={<AlertTriangle className="w-3.5 h-3.5" />} tone={data.avisos_activos > 0 ? 'amber' : 'muted'} />
          </div>

          {/* Para mañana */}
          <div className="admin-surface p-5 border-l-2" style={{ borderLeftColor: 'var(--admin-accent)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-4 h-4" style={{ color: 'var(--admin-accent)' }} />
              <p className="text-[14px] font-semibold" style={{ color: 'var(--admin-text)' }}>Para mañana</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-[11.5px] uppercase tracking-wider font-semibold admin-text-subtle mb-2">Retiros agendados ({data.manana.retiros.length})</p>
                {data.manana.retiros.length === 0 ? (
                  <p className="text-[12.5px] admin-text-subtle">Sin retiros agendados</p>
                ) : (
                  <ul className="space-y-1.5 text-[12.5px]">
                    {data.manana.retiros.slice(0, 8).map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 min-w-0">
                          {r.pickup_code && (
                            <span className="font-mono text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded border border-indigo-500/30 text-indigo-700 dark:text-indigo-400 bg-indigo-500/[0.06]">
                              {r.pickup_code}
                            </span>
                          )}
                          <span className="truncate" style={{ color: 'var(--admin-text)' }}>{r.customer}</span>
                        </span>
                        <span className="tabular-nums admin-text-muted shrink-0">{formatPrice(r.total)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="text-[11.5px] uppercase tracking-wider font-semibold admin-text-subtle mb-2">Alertas operativas</p>
                <ul className="space-y-2 text-[12.5px]">
                  <AlertaLine icon={<Package className="w-3.5 h-3.5" />} count={data.manana.alertas.stock_cero} label="productos sin stock" href="/admin/inventario" />
                  <AlertaLine icon={<AlertTriangle className="w-3.5 h-3.5" />} count={data.manana.alertas.lotes_7d} label="lotes vencen en 7 días" href="/admin/vencimientos" />
                  <AlertaLine icon={<Package className="w-3.5 h-3.5" />} count={data.manana.alertas.faltas_con_stock} label="faltas con stock disponible" href="/admin/faltas" />
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, count, muted, text }: { label: string; value: number | string; count: number | null; muted?: boolean; text?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'admin-text-subtle' : 'admin-text-muted'}>{label}</span>
      <span className={`tabular-nums ${muted ? 'admin-text-subtle' : ''}`} style={!muted ? { color: 'var(--admin-text)' } : undefined}>
        {text ? value : typeof value === 'number' ? formatPrice(value) : value}
        {count !== null && <span className="ml-2 text-[11px] admin-text-subtle">· {count}x</span>}
      </span>
    </div>
  );
}

function MiniStat({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: 'emerald' | 'amber' | 'red' | 'indigo' | 'muted' }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    muted: 'admin-text-muted',
  };
  return (
    <div className="admin-surface p-4">
      <div className="flex items-center gap-2 admin-text-subtle text-[11px] uppercase tracking-wider font-semibold mb-1.5">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className={`text-2xl font-semibold tabular-nums ${colors[tone]}`}>{value}</p>
    </div>
  );
}

function AlertaLine({ icon, count, label, href }: { icon: React.ReactNode; count: number; label: string; href: string }) {
  if (count === 0) {
    return (
      <li className="flex items-center gap-2 admin-text-subtle">
        <span className="text-emerald-500">✓</span>
        <span>0 {label}</span>
      </li>
    );
  }
  return (
    <li>
      <Link href={href} className="flex items-center gap-2 hover:text-[color:var(--admin-accent)] transition-colors" style={{ color: 'var(--admin-text)' }}>
        <span className="text-amber-500">{icon}</span>
        <span><strong className="tabular-nums">{count}</strong> {label}</span>
        <ArrowRight className="w-3 h-3 admin-text-subtle ml-auto" />
      </Link>
    </li>
  );
}
