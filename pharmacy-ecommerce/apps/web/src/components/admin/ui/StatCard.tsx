import Link from 'next/link';
import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  delta?: { value: number; label?: string } | null;
  hint?: string;
  href?: string;
  alert?: boolean;
  accent?: 'indigo' | 'emerald' | 'amber' | 'red' | 'blue' | 'violet';
}

const ACCENT_BG: Record<NonNullable<StatCardProps['accent']>, string> = {
  indigo: 'rgba(99, 102, 241, 0.10)',
  emerald: 'rgba(16, 185, 129, 0.10)',
  amber: 'rgba(245, 158, 11, 0.12)',
  red: 'rgba(239, 68, 68, 0.10)',
  blue: 'rgba(59, 130, 246, 0.10)',
  violet: 'rgba(139, 92, 246, 0.10)',
};
const ACCENT_FG: Record<NonNullable<StatCardProps['accent']>, string> = {
  indigo: '#6366f1',
  emerald: '#059669',
  amber: '#d97706',
  red: '#dc2626',
  blue: '#2563eb',
  violet: '#7c3aed',
};

export function StatCard({ label, value, icon, delta, hint, href, alert, accent = 'indigo' }: StatCardProps) {
  const inner = (
    <div className="admin-surface relative p-5 transition-all duration-200 hover:-translate-y-px hover:border-[color:var(--admin-border-strong)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle">
            {label}
          </p>
          <p
            className="mt-2 text-2xl lg:text-[28px] font-semibold tabular-nums tracking-tight"
            style={{ color: 'var(--admin-text)' }}
          >
            {value}
          </p>
          {(hint || delta) && (
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              {delta && (
                <span
                  className={`inline-flex items-center gap-0.5 font-medium ${
                    delta.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {delta.value >= 0 ? '▲' : '▼'} {Math.abs(delta.value).toFixed(0)}%
                  {delta.label && <span className="admin-text-subtle font-normal ml-1">{delta.label}</span>}
                </span>
              )}
              {hint && <span className="admin-text-subtle">{hint}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: ACCENT_BG[accent], color: ACCENT_FG[accent] }}
          >
            {icon}
          </div>
        )}
      </div>
      {alert && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}
