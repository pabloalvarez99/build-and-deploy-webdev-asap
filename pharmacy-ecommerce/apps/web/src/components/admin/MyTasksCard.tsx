'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckSquare, ArrowRight, Circle, AlertTriangle, Calendar } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  due_date: string | null;
  status: string;
  assigned_role: string | null;
  created_by_name: string | null;
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  normal: 'bg-indigo-500',
  low: 'bg-slate-400',
};

function dueLabel(due: string | null): { text: string; tone: 'red' | 'amber' | 'muted' } | null {
  if (!due) return null;
  const d = new Date(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dStart = new Date(d);
  dStart.setHours(0, 0, 0, 0);
  const days = Math.round((dStart.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { text: `Atrasada ${Math.abs(days)}d`, tone: 'red' };
  if (days === 0) return { text: 'Hoy', tone: 'red' };
  if (days === 1) return { text: 'Mañana', tone: 'amber' };
  if (days <= 7) return { text: `${days}d`, tone: 'amber' };
  return { text: d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }), tone: 'muted' };
}

export function MyTasksCard({ initial }: { initial?: Task[] }) {
  const [tasks, setTasks] = useState<Task[] | null>(initial ?? null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initial !== undefined) { setTasks(initial); return; }
    fetch('/api/admin/tareas?scope=mine&status=open', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { tasks: [] }))
      .then((d) => setTasks(d.tasks ?? []))
      .catch(() => setTasks([]));
  }, [initial]);

  const complete = async (id: string) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      const res = await fetch(`/api/admin/tareas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'complete' }),
      });
      if (res.ok) setTasks((prev) => prev?.filter((t) => t.id !== id) ?? null);
    } finally {
      setBusy((b) => { const n = { ...b }; delete n[id]; return n; });
    }
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--admin-elevated)', border: '1px solid var(--admin-border-strong)' }}>
      <div className="px-5 py-3 border-b admin-hairline flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 admin-text-muted" />
          <p className="font-semibold text-[13.5px]" style={{ color: 'var(--admin-text)' }}>Mis tareas</p>
          {tasks && tasks.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10.5px] font-semibold rounded-md border border-indigo-500/30 text-indigo-700 dark:text-indigo-400 bg-indigo-500/[0.08] tabular-nums">
              {tasks.length}
            </span>
          )}
        </div>
        <Link href="/admin/tareas" className="text-[11.5px] admin-text-muted hover:text-[color:var(--admin-accent)] flex items-center gap-1">
          Todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-[color:var(--admin-border)]">
        {tasks === null ? (
          <div className="px-5 py-6 text-center admin-text-subtle text-[12.5px]">Cargando…</div>
        ) : tasks.length === 0 ? (
          <div className="px-5 py-8 text-center admin-text-subtle text-[13px]">Sin tareas pendientes ✨</div>
        ) : (
          tasks.map((t) => {
            const due = dueLabel(t.due_date);
            return (
              <div key={t.id} className="px-5 py-3 hover:bg-[color:var(--admin-surface-2)] transition-colors flex items-start gap-3">
                <button
                  onClick={() => complete(t.id)}
                  disabled={busy[t.id]}
                  className="mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 border-[color:var(--admin-border-strong)] hover:border-emerald-500 transition-colors flex items-center justify-center disabled:opacity-50"
                  aria-label="Marcar como completada"
                >
                  {busy[t.id] ? (
                    <Circle className="w-2 h-2 animate-spin" />
                  ) : null}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[t.priority] ?? PRIORITY_DOT.normal}`} />
                    <p className="text-[13px] font-medium truncate" style={{ color: 'var(--admin-text)' }}>{t.title}</p>
                    {t.priority === 'high' && (
                      <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                    )}
                  </div>
                  {t.description && (
                    <p className="text-[11.5px] admin-text-muted mt-0.5 line-clamp-2">{t.description}</p>
                  )}
                  {(due || t.created_by_name) && (
                    <div className="flex items-center gap-2 mt-1 text-[10.5px] admin-text-subtle">
                      {due && (
                        <span className={`inline-flex items-center gap-1 ${
                          due.tone === 'red' ? 'text-red-600 dark:text-red-400 font-semibold' :
                          due.tone === 'amber' ? 'text-amber-600 dark:text-amber-400 font-semibold' :
                          ''
                        }`}>
                          <Calendar className="w-2.5 h-2.5" /> {due.text}
                        </span>
                      )}
                      {t.created_by_name && <span>· por {t.created_by_name}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
