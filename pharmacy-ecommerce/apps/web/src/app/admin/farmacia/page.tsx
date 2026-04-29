'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { isOwnerRole } from '@/lib/roles';
import {
  Stethoscope, BookOpen, ShieldAlert, CalendarClock, FileWarning,
  ArrowRight, Activity, Package, ClipboardCheck, UserCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { StatCard } from '@/components/admin/ui/StatCard';
import { DailyChecklist } from '@/components/admin/DailyChecklist';

interface FarmaciaData {
  kpis: {
    recetas_hoy: number;
    recetas_mes: number;
    controladas_hoy: number;
    sin_registro_receta: number;
    controlados_sin_stock: number;
  };
  lotes_por_vencer: Array<{
    id: string;
    producto: string;
    slug: string;
    batch_code: string | null;
    expiry_date: string;
    quantity: number;
    dias_restantes: number;
  }>;
  ultimas_recetas: Array<{
    id: string;
    patient_name: string;
    patient_rut: string | null;
    doctor_name: string | null;
    product_name: string;
    quantity: number;
    is_controlled: boolean;
    dispensed_at: string;
    dispensed_by: string | null;
  }>;
  turno_activo: { id: string; pharmacist_name: string; shift_start: string } | null;
}

function canAccess(role?: string) {
  return isOwnerRole(role) || role === 'pharmacist';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function FarmaciaPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<FarmaciaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (!canAccess(user.role)) { router.push('/'); return; }
  }, [user, router]);

  useEffect(() => {
    if (!user || !canAccess(user.role)) return;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/farmacia', { credentials: 'include' });
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 90000);
    return () => clearInterval(iv);
  }, [user]);

  if (!user || !canAccess(user.role)) return null;

  const todayLabel = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <DailyChecklist />

      <PageHeader
        title="Panel farmacéutico"
        description={`${todayLabel} · Vista del químico-farmacéutico de turno`}
        icon={<Stethoscope className="w-5 h-5" />}
        badge={
          data?.turno_activo ? (
            <span className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider rounded-md border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/[0.08]">
              Turno activo · {data.turno_activo.pharmacist_name}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider rounded-md border border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/[0.08]">
              Sin turno abierto
            </span>
          )
        }
      />

      {loading || !data ? (
        <div className="flex justify-center py-16"><div className="admin-spinner" /></div>
      ) : (
        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <StatCard
              label="Recetas hoy"
              value={data.kpis.recetas_hoy.toLocaleString('es-CL')}
              icon={<BookOpen className="w-4 h-4" />}
              accent="indigo"
              href="/admin/libro-recetas"
              hint={`${data.kpis.recetas_mes} en el mes`}
            />
            <StatCard
              label="Controladas hoy"
              value={data.kpis.controladas_hoy.toLocaleString('es-CL')}
              icon={<ShieldAlert className="w-4 h-4" />}
              accent="violet"
              href="/admin/libro-recetas?type=controlled"
            />
            <StatCard
              label="Sin registrar"
              value={data.kpis.sin_registro_receta.toLocaleString('es-CL')}
              icon={<FileWarning className="w-4 h-4" />}
              accent="amber"
              alert={data.kpis.sin_registro_receta > 0}
              hint="Ventas POS hoy con receta"
              href="/admin/libro-recetas"
            />
            <StatCard
              label="Lotes <30d"
              value={data.lotes_por_vencer.length.toLocaleString('es-CL')}
              icon={<CalendarClock className="w-4 h-4" />}
              accent="amber"
              alert={data.lotes_por_vencer.length > 0}
              href="/admin/vencimientos"
            />
            <StatCard
              label="Sin stock crítico"
              value={data.kpis.controlados_sin_stock.toLocaleString('es-CL')}
              icon={<Package className="w-4 h-4" />}
              accent="red"
              alert={data.kpis.controlados_sin_stock > 0}
              hint="Receta requerida agotados"
              href="/admin/inventario"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Link
              href="/admin/pos"
              className="rounded-xl p-5 hover:scale-[1.01] transition-transform"
              style={{ background: 'var(--admin-elevated)', border: '1px solid var(--admin-border-strong)' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <p className="font-semibold text-[14px]" style={{ color: 'var(--admin-text)' }}>Dispensar receta</p>
              </div>
              <p className="text-[12.5px] admin-text-muted">Abre POS · valida y registra al confirmar</p>
            </Link>

            <Link
              href="/admin/turnos-farmaceutico"
              className="rounded-xl p-5 hover:scale-[1.01] transition-transform"
              style={{ background: 'var(--admin-elevated)', border: '1px solid var(--admin-border-strong)' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <p className="font-semibold text-[14px]" style={{ color: 'var(--admin-text)' }}>
                  {data.turno_activo ? 'Cerrar turno' : 'Abrir turno'}
                </p>
              </div>
              <p className="text-[12.5px] admin-text-muted">
                {data.turno_activo
                  ? `Inicio ${fmtTime(data.turno_activo.shift_start)}`
                  : 'Registra tu RUT para iniciar'}
              </p>
            </Link>

            <Link
              href="/admin/catalogo-calidad"
              className="rounded-xl p-5 hover:scale-[1.01] transition-transform"
              style={{ background: 'var(--admin-elevated)', border: '1px solid var(--admin-border-strong)' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <p className="font-semibold text-[14px]" style={{ color: 'var(--admin-text)' }}>Calidad catálogo</p>
              </div>
              <p className="text-[12.5px] admin-text-muted">Revisa fichas con datos faltantes</p>
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--admin-elevated)', border: '1px solid var(--admin-border-strong)' }}>
              <div className="px-5 py-3 border-b admin-hairline flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 admin-text-muted" />
                  <p className="font-semibold text-[13.5px]" style={{ color: 'var(--admin-text)' }}>Últimas recetas</p>
                </div>
                <Link href="/admin/libro-recetas" className="text-[11.5px] admin-text-muted hover:text-[color:var(--admin-accent)] flex items-center gap-1">
                  Libro completo <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-[color:var(--admin-border)]">
                {data.ultimas_recetas.length === 0 ? (
                  <div className="px-5 py-8 text-center admin-text-subtle text-[13px]">Sin recetas registradas todavía</div>
                ) : (
                  data.ultimas_recetas.map((r) => (
                    <div key={r.id} className="px-5 py-3 hover:bg-[color:var(--admin-surface-2)] transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-medium truncate" style={{ color: 'var(--admin-text)' }}>
                              {r.patient_name}
                            </p>
                            {r.is_controlled && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md border border-violet-500/30 text-violet-700 dark:text-violet-400 bg-violet-500/[0.08]">
                                Controlado
                              </span>
                            )}
                          </div>
                          <p className="text-[11.5px] admin-text-muted truncate">
                            {r.product_name} × {r.quantity}
                            {r.doctor_name ? ` · Dr. ${r.doctor_name}` : ''}
                          </p>
                        </div>
                        <p className="text-[11px] admin-text-subtle shrink-0">{fmtTime(r.dispensed_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--admin-elevated)', border: '1px solid var(--admin-border-strong)' }}>
              <div className="px-5 py-3 border-b admin-hairline flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 admin-text-muted" />
                  <p className="font-semibold text-[13.5px]" style={{ color: 'var(--admin-text)' }}>Lotes próximos a vencer</p>
                </div>
                <Link href="/admin/vencimientos" className="text-[11.5px] admin-text-muted hover:text-[color:var(--admin-accent)] flex items-center gap-1">
                  Ver todos <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-[color:var(--admin-border)]">
                {data.lotes_por_vencer.length === 0 ? (
                  <div className="px-5 py-8 text-center admin-text-subtle text-[13px]">Sin lotes próximos en 30 días</div>
                ) : (
                  data.lotes_por_vencer.map((b) => {
                    const tone = b.dias_restantes <= 7
                      ? 'text-red-600 dark:text-red-400'
                      : b.dias_restantes <= 15
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'admin-text-muted';
                    return (
                      <div key={b.id} className="px-5 py-3 hover:bg-[color:var(--admin-surface-2)] transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium truncate" style={{ color: 'var(--admin-text)' }}>
                              {b.producto}
                            </p>
                            <p className="text-[11.5px] admin-text-muted truncate">
                              Lote {b.batch_code || '—'} · {b.quantity} uds
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-[12px] font-semibold ${tone}`}>{b.dias_restantes}d</p>
                            <p className="text-[10.5px] admin-text-subtle">{fmtDate(b.expiry_date)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
