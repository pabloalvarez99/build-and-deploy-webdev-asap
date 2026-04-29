'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { isOwnerRole } from '@/lib/roles';
import {
  Sparkles, AlertTriangle, TrendingUp, TrendingDown, Snowflake, UserX,
  CalendarX, Zap, ArrowRight, RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { EmptyState } from '@/components/admin/ui/EmptyState';

interface Insight {
  type: string;
  severity: 'critical' | 'warning' | 'info' | 'positive';
  title: string;
  detail: string;
  value?: string | number;
  href?: string;
  meta?: Record<string, unknown>;
}

interface InsightsData {
  generated_at: string;
  count: number;
  insights: Insight[];
}

const SEVERITY_STYLE: Record<Insight['severity'], { bg: string; fg: string; border: string; label: string }> = {
  critical: { bg: 'rgba(239, 68, 68, 0.10)', fg: '#dc2626', border: 'rgba(239, 68, 68, 0.35)', label: 'Crítico' },
  warning:  { bg: 'rgba(245, 158, 11, 0.12)', fg: '#d97706', border: 'rgba(245, 158, 11, 0.35)', label: 'Atención' },
  positive: { bg: 'rgba(16, 185, 129, 0.10)', fg: '#059669', border: 'rgba(16, 185, 129, 0.35)', label: 'Oportunidad' },
  info:     { bg: 'rgba(99, 102, 241, 0.10)', fg: '#6366f1', border: 'rgba(99, 102, 241, 0.35)', label: 'Info' },
};

function iconForType(type: string) {
  switch (type) {
    case 'anomaly_drop': return TrendingDown;
    case 'anomaly_rise':
    case 'trending': return TrendingUp;
    case 'frozen_capital': return Snowflake;
    case 'customer_at_risk': return UserX;
    case 'expiry_no_discount': return CalendarX;
    case 'no_sales': return AlertTriangle;
    default: return Zap;
  }
}

export default function InsightsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const r = await fetch('/api/admin/insights', { credentials: 'include', cache: 'no-store' });
      const j = await r.json();
      setData(j);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isOwnerRole(user.role)) { router.push('/'); return; }
    load();
  }, [user, router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user || !isOwnerRole(user.role)) return null;

  const generated = data?.generated_at ? new Date(data.generated_at).toLocaleString('es-CL') : '';

  const counts = data?.insights.reduce(
    (acc, i) => { acc[i.severity]++; return acc; },
    { critical: 0, warning: 0, positive: 0, info: 0 } as Record<Insight['severity'], number>
  );

  return (
    <div>
      <PageHeader
        title="Insights del negocio"
        description="Análisis automático de anomalías, oportunidades y riesgos"
        icon={<Sparkles className="w-5 h-5" />}
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
            <span>Recalcular</span>
          </button>
        }
      />

      {loading ? (
        <div className="admin-surface p-12 text-center admin-text-muted text-sm">Analizando datos…</div>
      ) : !data || data.count === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-6 h-6" />}
          title="Sin insights nuevos"
          description="No detectamos anomalías ni oportunidades destacables. Revisa de nuevo más tarde."
        />
      ) : (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['critical', 'warning', 'positive', 'info'] as const).map((sev) => {
              const s = SEVERITY_STYLE[sev];
              return (
                <div key={sev} className="admin-surface p-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider admin-text-subtle">{s.label}</p>
                  <p className="mt-1.5 text-2xl font-semibold tabular-nums" style={{ color: s.fg }}>
                    {counts?.[sev] ?? 0}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-[11.5px] admin-text-subtle">Generado: {generated}</p>

          {/* Lista insights */}
          <div className="space-y-2.5">
            {data.insights.map((ins, i) => {
              const s = SEVERITY_STYLE[ins.severity];
              const Icon = iconForType(ins.type);
              const inner = (
                <div
                  className="admin-surface p-4 transition-colors hover:border-[color:var(--admin-border-strong)]"
                  style={{ borderLeft: `3px solid ${s.fg}` }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: s.bg, color: s.fg }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border"
                          style={{ borderColor: s.border, color: s.fg, background: s.bg }}
                        >
                          {s.label}
                        </span>
                        <h3 className="text-[14px] font-semibold" style={{ color: 'var(--admin-text)' }}>
                          {ins.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-[13px] admin-text-muted">{ins.detail}</p>
                    </div>
                    {ins.href && <ArrowRight className="w-4 h-4 admin-text-subtle shrink-0 mt-2" />}
                  </div>
                </div>
              );
              return ins.href
                ? <Link key={i} href={ins.href} className="block">{inner}</Link>
                : <div key={i}>{inner}</div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
