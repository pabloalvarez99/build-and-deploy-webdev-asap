'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href?: string;
  hint?: string;
}

interface OperacionesShape {
  reservas_expiradas: unknown[];
  vencidos: unknown[];
}

interface ArqueoShape {
  fondo_inicial: number;
  closes: { turno_fin: string; created_at: string }[];
}

const STORAGE_KEY = 'admin-daily-checklist-dismissed';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function DailyChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === todayKey()) setDismissed(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (dismissed) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [opRes, arqRes] = await Promise.all([
          fetch('/api/admin/operaciones', { credentials: 'include' }).then((r) => r.json()).catch(() => null),
          fetch('/api/admin/arqueo', { credentials: 'include' }).then((r) => r.json()).catch(() => null),
        ]);
        if (cancelled) return;

        const op: OperacionesShape | null = opRes;
        const arq: ArqueoShape | null = arqRes;

        const todayStr = todayKey();
        const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const yesterdayClosed = arq?.closes?.some((c) => c.created_at?.slice(0, 10) === yesterdayStr) ?? false;

        const list: ChecklistItem[] = [
          {
            id: 'cierre-ayer',
            label: 'Cierre de caja del día anterior',
            done: yesterdayClosed,
            href: '/admin/turnos',
            hint: yesterdayClosed ? 'OK' : 'Cierra el turno de ayer en Turnos',
          },
          {
            id: 'fondo-hoy',
            label: 'Fondo de caja configurado',
            done: (arq?.fondo_inicial ?? 0) > 0,
            href: '/admin/arqueo',
            hint: (arq?.fondo_inicial ?? 0) > 0 ? 'OK' : 'Configura fondo inicial antes de iniciar ventas',
          },
          {
            id: 'reservas-expiradas',
            label: 'Reservas expiradas procesadas',
            done: (op?.reservas_expiradas?.length ?? 0) === 0,
            href: '/admin/ordenes?status=reserved',
            hint: (op?.reservas_expiradas?.length ?? 0) === 0 ? 'OK' : `${op?.reservas_expiradas.length} pendiente(s)`,
          },
          {
            id: 'vencidos',
            label: 'Productos vencidos retirados',
            done: (op?.vencidos?.length ?? 0) === 0,
            href: '/admin/vencimientos',
            hint: (op?.vencidos?.length ?? 0) === 0 ? 'OK' : `${op?.vencidos.length} lote(s) con stock vencido`,
          },
        ];

        setItems(list);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 120000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [dismissed]);

  const handleDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, todayKey()); } catch {}
    setDismissed(true);
  };

  if (dismissed) return null;
  if (loading) return null;

  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  return (
    <div
      className="rounded-xl mb-6 overflow-hidden"
      style={{
        background: 'var(--admin-elevated)',
        border: '1px solid var(--admin-border-strong)',
      }}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-[color:var(--admin-surface-2)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              allDone ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            {allDone ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </div>
          <div className="text-left">
            <p className="text-[13.5px] font-semibold" style={{ color: 'var(--admin-text)' }}>
              Checklist del día · {doneCount}/{items.length}
            </p>
            <p className="text-[11.5px] admin-text-subtle">
              {allDone ? 'Día listo para operar' : 'Acciones pendientes antes de abrir caja'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allDone && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
              className="text-[11px] admin-text-muted hover:text-[color:var(--admin-text)] px-2 py-1 rounded-md hover:bg-[color:var(--admin-accent-soft)]"
            >
              Ocultar hoy
            </button>
          )}
          {collapsed ? <ChevronDown className="w-4 h-4 admin-text-muted" /> : <ChevronUp className="w-4 h-4 admin-text-muted" />}
        </div>
      </button>

      {!collapsed && (
        <div className="border-t admin-hairline divide-y divide-[color:var(--admin-border)]">
          {items.map((it) => (
            <Link
              key={it.id}
              href={it.href || '#'}
              className="flex items-center gap-3 px-5 py-3 hover:bg-[color:var(--admin-surface-2)] transition-colors"
            >
              {it.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px]" style={{ color: 'var(--admin-text)' }}>{it.label}</p>
                {it.hint && (
                  <p className={`text-[11px] ${it.done ? 'admin-text-subtle' : 'text-amber-600 dark:text-amber-400'}`}>
                    {it.hint}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
