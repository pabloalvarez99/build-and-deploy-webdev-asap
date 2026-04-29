'use client';

import { useEffect, useState } from 'react';
import { Megaphone, AlertTriangle, Info, X, Pin } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: string;
  pinned: boolean;
  created_by_name: string | null;
  created_at: string;
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string; text: string; Icon: typeof Megaphone }> = {
  critical: {
    border: 'border-red-500/40',
    bg: 'bg-red-500/[0.06]',
    text: 'text-red-700 dark:text-red-400',
    Icon: AlertTriangle,
  },
  warning: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/[0.06]',
    text: 'text-amber-700 dark:text-amber-400',
    Icon: AlertTriangle,
  },
  info: {
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/[0.05]',
    text: 'text-indigo-700 dark:text-indigo-400',
    Icon: Info,
  },
};

export function AnnouncementsBanner({ items }: { items?: Announcement[] }) {
  const [data, setData] = useState<Announcement[] | null>(items ?? null);
  const [dismissed, setDismissed] = useState<Record<string, true>>({});

  useEffect(() => {
    if (items !== undefined) { setData(items); return; }
    fetch('/api/admin/avisos', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { announcements: [] }))
      .then((d) => setData(d.announcements ?? []))
      .catch(() => setData([]));
  }, [items]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('announcements-dismissed');
      if (stored) setDismissed(JSON.parse(stored));
    } catch { /* noop */ }
  }, []);

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = { ...prev, [id]: true as const };
      try { localStorage.setItem('announcements-dismissed', JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };

  if (!data || data.length === 0) return null;

  const visible = data.filter((a) => a.pinned || !dismissed[a.id]);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map((a) => {
        const style = SEVERITY_STYLES[a.severity] ?? SEVERITY_STYLES.info;
        const Icon = style.Icon;
        return (
          <div
            key={a.id}
            className={`relative rounded-xl border ${style.border} ${style.bg} px-4 py-3 flex items-start gap-3`}
          >
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.text}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-[13.5px] font-semibold ${style.text}`}>{a.title}</p>
                {a.pinned && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-md border border-violet-500/30 text-violet-700 dark:text-violet-400 bg-violet-500/[0.08]">
                    <Pin className="w-2.5 h-2.5" /> Fijado
                  </span>
                )}
              </div>
              <p className="text-[12.5px] mt-0.5 admin-text-muted whitespace-pre-wrap">{a.body}</p>
              {a.created_by_name && (
                <p className="text-[10.5px] admin-text-subtle mt-1">— {a.created_by_name}</p>
              )}
            </div>
            {!a.pinned && (
              <button
                onClick={() => dismiss(a.id)}
                className="p-1 rounded admin-text-subtle hover:text-[color:var(--admin-text)] transition-colors"
                aria-label="Ocultar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
