'use client';

import { Target } from 'lucide-react';
import { formatPrice } from '@/lib/format';

interface DailyGoalGaugeProps {
  goal: number;
  current: number;
  label?: string;
  hint?: string;
}

export function DailyGoalGauge({ goal, current, label = 'Meta de hoy', hint }: DailyGoalGaugeProps) {
  if (goal <= 0) {
    return (
      <div className="admin-surface p-5">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 admin-text-muted" />
          <p className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle">{label}</p>
        </div>
        <p className="text-[12.5px] admin-text-muted">
          Configura una meta diaria en <a href="/admin/configuracion" className="text-[color:var(--admin-accent)] hover:underline">Configuración</a>.
        </p>
      </div>
    );
  }

  const pct = Math.min(100, (current / goal) * 100);
  const remaining = Math.max(0, goal - current);
  const reached = current >= goal;

  // Half-donut SVG gauge
  const radius = 70;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  const tone = reached
    ? '#059669'
    : pct >= 75
      ? '#6366f1'
      : pct >= 40
        ? '#d97706'
        : '#dc2626';

  return (
    <div className="admin-surface p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: tone }} />
          <p className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle">{label}</p>
        </div>
        {reached && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/[0.08]">
            ¡META!
          </span>
        )}
      </div>

      <div className="flex items-end gap-4">
        <div className="relative shrink-0" style={{ width: 160, height: 90 }}>
          <svg viewBox="0 0 160 90" className="w-full h-full overflow-visible">
            <path
              d="M 10 80 A 70 70 0 0 1 150 80"
              fill="none"
              stroke="var(--admin-border)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 10 80 A 70 70 0 0 1 150 80"
              fill="none"
              stroke={tone}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <p className="text-2xl font-semibold tabular-nums" style={{ color: tone }}>
              {pct.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold tabular-nums" style={{ color: 'var(--admin-text)' }}>
            {formatPrice(current)}
          </p>
          <p className="text-[11.5px] admin-text-subtle">
            de {formatPrice(goal)}
          </p>
          {!reached && (
            <p className="text-[11.5px] admin-text-muted mt-1">
              Faltan <span className="font-semibold" style={{ color: 'var(--admin-text)' }}>{formatPrice(remaining)}</span>
            </p>
          )}
          {hint && <p className="text-[10.5px] admin-text-subtle mt-1">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
