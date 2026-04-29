'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { isOwnerRole } from '@/lib/roles';
import { Megaphone, Plus, Pin, AlertTriangle, Info, Trash2, X, Edit3 } from 'lucide-react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { EmptyState } from '@/components/admin/ui/EmptyState';

interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: string;
  visible_to: string;
  pinned: boolean;
  expires_at: string | null;
  created_by_name: string | null;
  created_at: string;
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string; text: string; Icon: typeof Megaphone; label: string }> = {
  critical: { border: 'border-red-500/40', bg: 'bg-red-500/[0.06]', text: 'text-red-700 dark:text-red-400', Icon: AlertTriangle, label: 'Crítica' },
  warning: { border: 'border-amber-500/40', bg: 'bg-amber-500/[0.06]', text: 'text-amber-700 dark:text-amber-400', Icon: AlertTriangle, label: 'Aviso' },
  info: { border: 'border-indigo-500/30', bg: 'bg-indigo-500/[0.05]', text: 'text-indigo-700 dark:text-indigo-400', Icon: Info, label: 'Info' },
};

const VISIBLE_LABEL: Record<string, string> = {
  all: 'Todo el equipo',
  owner: 'Solo dueños',
  pharmacist: 'Farmacéuticos',
  seller: 'Vendedores',
};

export default function AvisosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isOwner = isOwnerRole(user?.role);

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (!isOwner) { router.push('/admin'); return; }
  }, [user, isOwner, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/avisos?scope=all', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setItems(d.announcements ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este aviso?')) return;
    const res = await fetch(`/api/admin/avisos/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) load();
  };

  const togglePin = async (a: Announcement) => {
    const res = await fetch(`/api/admin/avisos/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ pinned: !a.pinned }),
    });
    if (res.ok) load();
  };

  if (!user || !isOwner) return null;

  return (
    <div>
      <PageHeader
        title="Avisos del equipo"
        description="Comunicados internos · visibles según rol"
        icon={<Megaphone className="w-5 h-5" />}
        actions={
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg text-[13px] font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
            style={{ background: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-2))' }}
          >
            <Plus className="w-4 h-4" /> Nuevo aviso
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16"><div className="admin-spinner" /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-6 h-6" />}
          title="Sin avisos"
          description="Publica el primer comunicado para tu equipo."
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const style = SEVERITY_STYLES[a.severity] ?? SEVERITY_STYLES.info;
            const Icon = style.Icon;
            const expired = a.expires_at ? new Date(a.expires_at).getTime() < Date.now() : false;
            return (
              <div
                key={a.id}
                className={`relative rounded-xl border ${style.border} ${style.bg} px-4 py-3 ${expired ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.text}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-[13.5px] font-semibold ${style.text}`}>{a.title}</p>
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md border admin-hairline admin-text-muted">
                        {style.label}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md border admin-hairline admin-text-muted">
                        {VISIBLE_LABEL[a.visible_to] ?? a.visible_to}
                      </span>
                      {a.pinned && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-md border border-violet-500/30 text-violet-700 dark:text-violet-400 bg-violet-500/[0.08]">
                          <Pin className="w-2.5 h-2.5" /> Fijado
                        </span>
                      )}
                      {expired && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md border border-slate-500/30 admin-text-subtle bg-slate-500/[0.08]">
                          Expirado
                        </span>
                      )}
                    </div>
                    <p className="text-[12.5px] mt-1 admin-text-muted whitespace-pre-wrap">{a.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10.5px] admin-text-subtle">
                      {a.created_by_name && <span>por {a.created_by_name}</span>}
                      <span>· {new Date(a.created_at).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      {a.expires_at && (
                        <span>· expira {new Date(a.expires_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => togglePin(a)}
                      title={a.pinned ? 'Desfijar' : 'Fijar'}
                      className="p-1.5 rounded admin-text-muted hover:text-violet-500 hover:bg-violet-500/[0.08] transition-colors"
                    >
                      <Pin className={`w-3.5 h-3.5 ${a.pinned ? 'text-violet-500 fill-violet-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => { setEditing(a); setShowModal(true); }}
                      title="Editar"
                      className="p-1.5 rounded admin-text-muted hover:text-[color:var(--admin-accent)] hover:bg-[color:var(--admin-accent-soft)] transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => remove(a.id)}
                      title="Eliminar"
                      className="p-1.5 rounded admin-text-muted hover:text-red-500 hover:bg-red-500/[0.08] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <AnnouncementModal
          initial={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function AnnouncementModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Announcement | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [severity, setSeverity] = useState(initial?.severity ?? 'info');
  const [visibleTo, setVisibleTo] = useState(initial?.visible_to ?? 'all');
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [expiresAt, setExpiresAt] = useState(
    initial?.expires_at ? new Date(initial.expires_at).toISOString().slice(0, 10) : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { setError('Título y cuerpo son obligatorios'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        severity,
        visible_to: visibleTo,
        pinned,
        expires_at: expiresAt || null,
      };
      const url = initial ? `/api/admin/avisos/${initial.id}` : '/api/admin/avisos';
      const method = initial ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Error al guardar');
      } else {
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg rounded-xl overflow-hidden" style={{ background: 'var(--admin-elevated)', border: '1px solid var(--admin-border-strong)' }}>
        <div className="px-5 py-3 border-b admin-hairline flex items-center justify-between">
          <p className="font-semibold text-[14px]" style={{ color: 'var(--admin-text)' }}>
            {initial ? 'Editar aviso' : 'Nuevo aviso'}
          </p>
          <button onClick={onClose} className="p-1 rounded admin-text-subtle hover:text-[color:var(--admin-text)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle mb-1 block">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              className="admin-input w-full"
              required
            />
          </div>
          <div>
            <label className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle mb-1 block">Cuerpo</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="admin-input w-full"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle mb-1 block">Severidad</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="admin-input w-full">
                <option value="info">Info</option>
                <option value="warning">Aviso</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div>
              <label className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle mb-1 block">Visible para</label>
              <select value={visibleTo} onChange={(e) => setVisibleTo(e.target.value)} className="admin-input w-full">
                <option value="all">Todo el equipo</option>
                <option value="owner">Solo dueños</option>
                <option value="pharmacist">Farmacéuticos</option>
                <option value="seller">Vendedores</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11.5px] font-semibold uppercase tracking-wider admin-text-subtle mb-1 block">Expira (opcional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="admin-input w-full"
              />
            </div>
            <label className="flex items-center gap-2 mt-6 cursor-pointer">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="w-4 h-4" />
              <span className="text-[13px] admin-text-muted">Fijar arriba</span>
            </label>
          </div>
          {error && (
            <div className="text-[12.5px] text-red-600 dark:text-red-400 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/[0.06]">
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 h-9 rounded-lg text-[13px] admin-text-muted hover:text-[color:var(--admin-text)] transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 h-9 rounded-lg text-[13px] font-semibold text-white shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-2))' }}
            >
              {saving ? 'Guardando…' : initial ? 'Guardar' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
