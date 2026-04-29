'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { isAdminRole, isOwnerRole } from '@/lib/roles';
import {
  CheckSquare, Plus, AlertTriangle, Calendar, X, RotateCcw, Trash2, User,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { EmptyState } from '@/components/admin/ui/EmptyState';

interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to_uid: string | null;
  assigned_to_name: string | null;
  assigned_role: string | null;
  priority: string;
  due_date: string | null;
  status: string;
  created_by_name: string | null;
  completed_by_name: string | null;
  completed_at: string | null;
  created_at: string;
}

interface TeamUser {
  uid: string;
  email: string | null;
  name: string | null;
  role: string;
}

const PRIORITY_TONES: Record<string, { dot: string; label: string }> = {
  high: { dot: 'bg-red-500', label: 'Alta' },
  normal: { dot: 'bg-indigo-500', label: 'Normal' },
  low: { dot: 'bg-slate-400', label: 'Baja' },
};

const STATUS_TONES: Record<string, string> = {
  open: 'border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/[0.08]',
  done: 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/[0.08]',
  cancelled: 'border-slate-500/30 admin-text-subtle bg-slate-500/[0.08]',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Abierta',
  done: 'Completada',
  cancelled: 'Cancelada',
};

export default function TareasPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isOwner = isOwnerRole(user?.role);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const params = new URLSearchParams({ scope });
    if (statusFilter) params.set('status', statusFilter);
    try {
      const res = await fetch(`/api/admin/tareas?${params}`, { credentials: 'include' });
      if (res.ok) setTasks((await res.json()).tasks ?? []);
    } finally {
      setLoading(false);
    }
  }, [user, scope, statusFilter]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (!isAdminRole(user.role)) { router.push('/'); return; }
  }, [user, router]);

  useEffect(() => {
    if (!user || !isAdminRole(user.role)) return;
    load();
  }, [user, load]);

  useEffect(() => {
    if (!isOwner) return;
    fetch('/api/admin/users', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d) => setUsers((d.users ?? []).filter((u: TeamUser) => u.role !== 'user')))
      .catch(() => {});
  }, [isOwner]);

  const updateTask = async (id: string, action: 'complete' | 'reopen' | 'cancel') => {
    const res = await fetch(`/api/admin/tareas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
    });
    if (res.ok) load();
  };

  const removeTask = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    const res = await fetch(`/api/admin/tareas/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) load();
  };

  if (!user || !isAdminRole(user.role)) return null;

  return (
    <div>
      <PageHeader
        title="Tareas"
        description="Asignaciones operativas del equipo"
        icon={<CheckSquare className="w-5 h-5" />}
        actions={
          isOwner ? (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-3 h-9 rounded-lg text-[12.5px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-2))' }}
            >
              <Plus className="w-4 h-4" />
              Nueva tarea
            </button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {isOwner && (
          <div className="inline-flex rounded-lg border admin-hairline overflow-hidden">
            <button
              onClick={() => setScope('mine')}
              className={`px-3 h-8 text-[12px] font-medium ${scope === 'mine' ? 'bg-[color:var(--admin-accent-soft)] text-[color:var(--admin-accent)]' : 'admin-text-muted'}`}
            >
              Mías
            </button>
            <button
              onClick={() => setScope('all')}
              className={`px-3 h-8 text-[12px] font-medium ${scope === 'all' ? 'bg-[color:var(--admin-accent-soft)] text-[color:var(--admin-accent)]' : 'admin-text-muted'}`}
            >
              Todas
            </button>
          </div>
        )}
        <div className="inline-flex rounded-lg border admin-hairline overflow-hidden">
          {['open', 'done', 'cancelled', ''].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`px-3 h-8 text-[12px] font-medium ${statusFilter === s ? 'bg-[color:var(--admin-accent-soft)] text-[color:var(--admin-accent)]' : 'admin-text-muted'}`}
            >
              {s ? STATUS_LABEL[s] : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="admin-spinner" /></div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8" />}
          title="Sin tareas"
          description="No hay tareas con los filtros actuales."
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const prio = PRIORITY_TONES[t.priority] ?? PRIORITY_TONES.normal;
            const due = t.due_date ? new Date(t.due_date) : null;
            return (
              <div key={t.id} className="admin-surface p-4 flex items-start gap-3">
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${prio.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-[14px] font-semibold ${t.status === 'done' ? 'line-through admin-text-subtle' : ''}`} style={{ color: t.status === 'done' ? undefined : 'var(--admin-text)' }}>
                      {t.title}
                    </p>
                    <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md border tabular-nums ${STATUS_TONES[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                    {t.priority === 'high' && t.status === 'open' && (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                  {t.description && (
                    <p className="text-[12.5px] admin-text-muted mt-1 whitespace-pre-wrap">{t.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px] admin-text-subtle flex-wrap">
                    {(t.assigned_to_name || t.assigned_role) && (
                      <span className="inline-flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        {t.assigned_to_name || (t.assigned_role ? `Rol: ${t.assigned_role}` : '')}
                      </span>
                    )}
                    {due && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {due.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                    {t.created_by_name && <span>Creada por {t.created_by_name}</span>}
                    {t.completed_by_name && t.status === 'done' && (
                      <span>· hecho por {t.completed_by_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {t.status === 'open' && (
                    <button
                      onClick={() => updateTask(t.id, 'complete')}
                      className="p-1.5 rounded-lg admin-text-muted hover:text-emerald-600 hover:bg-emerald-500/[0.08] transition-colors"
                      title="Marcar completada"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                  )}
                  {t.status === 'done' && (
                    <button
                      onClick={() => updateTask(t.id, 'reopen')}
                      className="p-1.5 rounded-lg admin-text-muted hover:text-indigo-600 hover:bg-indigo-500/[0.08] transition-colors"
                      title="Reabrir"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  {isOwner && t.status === 'open' && (
                    <button
                      onClick={() => updateTask(t.id, 'cancel')}
                      className="p-1.5 rounded-lg admin-text-muted hover:text-amber-600 hover:bg-amber-500/[0.08] transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => removeTask(t.id)}
                      className="p-1.5 rounded-lg admin-text-muted hover:text-red-600 hover:bg-red-500/[0.08] transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && isOwner && (
        <CreateTaskModal users={users} onClose={() => setShowModal(false)} onCreated={load} />
      )}
    </div>
  );
}

function CreateTaskModal({ users, onClose, onCreated }: { users: TeamUser[]; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignType, setAssignType] = useState<'user' | 'role'>('user');
  const [assignedUid, setAssignedUid] = useState('');
  const [assignedRole, setAssignedRole] = useState<'seller' | 'pharmacist' | 'owner'>('seller');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const u = users.find((x) => x.uid === assignedUid);
      const body = {
        title,
        description: description || null,
        priority,
        due_date: dueDate || null,
        ...(assignType === 'user' && assignedUid
          ? { assigned_to_uid: assignedUid, assigned_to_name: u?.name || u?.email || null }
          : { assigned_role: assignedRole }),
      };
      const res = await fetch('/api/admin/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (res.ok) { onCreated(); onClose(); }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl p-6"
        style={{ background: 'var(--admin-elevated)', border: '1px solid var(--admin-border-strong)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[18px] font-semibold mb-4" style={{ color: 'var(--admin-text)' }}>Nueva tarea</h2>

        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold admin-text-muted">Título</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="admin-input w-full mt-1"
              placeholder="Ej: Revisar góndola de antigripales"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold admin-text-muted">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="admin-input w-full mt-1 resize-none"
              placeholder="Detalle, instrucciones, contexto…"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold admin-text-muted">Asignar a</label>
            <div className="flex items-center gap-2 mt-1 mb-2">
              <button
                onClick={() => setAssignType('user')}
                className={`px-3 h-8 text-[12px] rounded-lg border ${assignType === 'user' ? 'border-[color:var(--admin-accent)] text-[color:var(--admin-accent)] bg-[color:var(--admin-accent-soft)]' : 'admin-hairline admin-text-muted'}`}
              >
                Persona
              </button>
              <button
                onClick={() => setAssignType('role')}
                className={`px-3 h-8 text-[12px] rounded-lg border ${assignType === 'role' ? 'border-[color:var(--admin-accent)] text-[color:var(--admin-accent)] bg-[color:var(--admin-accent-soft)]' : 'admin-hairline admin-text-muted'}`}
              >
                Rol completo
              </button>
            </div>
            {assignType === 'user' ? (
              <select value={assignedUid} onChange={(e) => setAssignedUid(e.target.value)} className="admin-input w-full">
                <option value="">— Sin asignar —</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>{u.name || u.email} · {u.role}</option>
                ))}
              </select>
            ) : (
              <select value={assignedRole} onChange={(e) => setAssignedRole(e.target.value as 'seller' | 'pharmacist' | 'owner')} className="admin-input w-full">
                <option value="seller">Vendedores</option>
                <option value="pharmacist">Farmacéuticos</option>
                <option value="owner">Dueño</option>
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold admin-text-muted">Prioridad</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')} className="admin-input w-full mt-1">
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold admin-text-muted">Fecha límite</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="admin-input w-full mt-1" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 h-9 rounded-lg text-[12.5px] admin-text-muted hover:bg-[color:var(--admin-surface-2)]">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!title.trim() || submitting}
            className="px-4 h-9 rounded-lg text-[12.5px] font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-2))' }}
          >
            {submitting ? 'Creando…' : 'Crear tarea'}
          </button>
        </div>
      </div>
    </div>
  );
}
