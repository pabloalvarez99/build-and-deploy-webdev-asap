'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users, Shield, Loader2, RefreshCw, UserPlus, Search, X, AlertTriangle,
  Power, PowerOff, Mail, Clock, Check, ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Card } from '@/components/admin/ui/Card';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { RoleBadge } from '@/components/admin/ui/RoleBadge';
import { roleLabel, roleDescription, routesLostOnDemotion, ADMIN_ROLES } from '@/lib/roles';

interface FirebaseUser {
  uid: string;
  email: string | undefined;
  name: string | null;
  role: string;
  created_at: string | undefined;
  last_sign_in: string | undefined;
  disabled: boolean;
}

const ROLE_OPTIONS = ['owner', 'pharmacist', 'seller', 'user', 'admin'] as const;
type RoleFilter = 'all' | 'team' | 'owner' | 'pharmacist' | 'seller' | 'user';

const FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'team', label: 'Equipo' },
  { value: 'owner', label: 'Dueños' },
  { value: 'pharmacist', label: 'Farmacéuticos' },
  { value: 'seller', label: 'Vendedores' },
  { value: 'user', label: 'Clientes' },
];

function fmtDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtRelative(iso?: string) {
  if (!iso) return 'Nunca';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Nunca';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'hace segundos';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`;
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

export default function UsuariosPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmDemotion, setConfirmDemotion] = useState<{ user: FirebaseUser; nextRole: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Error al cargar usuarios');
      const data = await res.json();
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const applyRole = async (uid: string, role: string) => {
    setSaving(uid);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, role }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error');
      }
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(null);
    }
  };

  const requestRoleChange = (u: FirebaseUser, nextRole: string) => {
    if (u.role === nextRole) return;
    const lost = routesLostOnDemotion(u.role, nextRole);
    if (lost.length > 0) {
      setConfirmDemotion({ user: u, nextRole });
    } else {
      applyRole(u.uid, nextRole);
    }
  };

  const toggleDisabled = async (u: FirebaseUser) => {
    setSaving(u.uid);
    try {
      const res = await fetch(`/api/admin/users/${u.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: !u.disabled }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error');
      }
      const data = await res.json();
      setUsers((prev) => prev.map((x) => (x.uid === u.uid ? data.user : x)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al actualizar');
    } finally {
      setSaving(null);
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q) {
        const hay = `${u.name || ''} ${u.email || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter === 'all') return true;
      if (filter === 'team') return ADMIN_ROLES.includes(u.role as (typeof ADMIN_ROLES)[number]);
      if (filter === 'owner') return u.role === 'owner' || u.role === 'admin';
      return u.role === filter;
    });
  }, [users, search, filter]);

  const team = visible.filter((u) => ADMIN_ROLES.includes(u.role as (typeof ADMIN_ROLES)[number]));
  const customers = visible.filter((u) => !ADMIN_ROLES.includes(u.role as (typeof ADMIN_ROLES)[number]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestiona el equipo de la farmacia, invita nuevos miembros y controla el acceso por rol"
        icon={<Users className="w-4 h-4" strokeWidth={2} />}
        actions={
          <>
            <button onClick={load} disabled={loading} className="admin-btn admin-btn-secondary disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button onClick={() => setInviteOpen(true)} className="admin-btn admin-btn-primary">
              <UserPlus className="w-3.5 h-3.5" />
              Invitar
            </button>
          </>
        }
      />

      {/* Role legend */}
      <Card padded={false}>
        <div className="px-5 py-3 border-b admin-hairline flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" style={{ color: 'var(--admin-accent)' }} />
          <span className="admin-group-label">Niveles de acceso</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
          {(['owner', 'pharmacist', 'seller', 'user'] as const).map((r) => (
            <div key={r} className="space-y-1.5">
              <RoleBadge role={r} />
              <p className="text-[12.5px] admin-text-muted">{roleDescription(r)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 admin-text-subtle pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="admin-input pl-9 pr-8"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 admin-text-subtle hover:text-[color:var(--admin-text)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg admin-surface w-fit overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 h-7 rounded-md text-[12.5px] font-medium whitespace-nowrap transition-all ${
                filter === f.value
                  ? 'text-white'
                  : 'admin-text-muted hover:text-[color:var(--admin-text)]'
              }`}
              style={
                filter === f.value
                  ? { background: 'linear-gradient(180deg, var(--admin-accent), var(--admin-accent-2))' }
                  : undefined
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="admin-surface border-red-500/30 px-4 py-3 text-sm" style={{ borderColor: 'rgba(239,68,68,0.30)', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="admin-spinner" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Team */}
          <Card padded={false}
            header={
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--admin-text)' }}>Equipo</span>
                  <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-medium tabular-nums admin-text-muted"
                    style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)' }}>
                    {team.length}
                  </span>
                </div>
              </>
            }
          >
            {team.length === 0 ? (
              <EmptyState
                icon={<Users className="w-5 h-5" />}
                title="Sin miembros del equipo"
                description="Invita a un dueño, farmacéutico o vendedor para empezar."
                action={
                  <button onClick={() => setInviteOpen(true)} className="admin-btn admin-btn-primary">
                    <UserPlus className="w-3.5 h-3.5" /> Invitar al equipo
                  </button>
                }
              />
            ) : (
              <UserTable
                users={team}
                currentUid={currentUser?.id}
                saving={saving}
                onRoleChange={requestRoleChange}
                onToggleDisabled={toggleDisabled}
              />
            )}
          </Card>

          {/* Customers */}
          {(filter === 'all' || filter === 'user') && (
            <Card padded={false}
              header={
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--admin-text)' }}>Clientes</span>
                  <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-medium tabular-nums admin-text-muted"
                    style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)' }}>
                    {customers.length}
                  </span>
                </div>
              }
            >
              {customers.length === 0 ? (
                <EmptyState icon={<Users className="w-5 h-5" />} title="Sin clientes" />
              ) : (
                <div className="max-h-[480px] overflow-y-auto">
                  <UserTable
                    users={customers}
                    currentUid={currentUser?.id}
                    saving={saving}
                    onRoleChange={requestRoleChange}
                    onToggleDisabled={toggleDisabled}
                  />
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {inviteOpen && (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onCreated={(u) => {
            setUsers((prev) => [u, ...prev.filter((x) => x.uid !== u.uid)]);
            setInviteOpen(false);
          }}
        />
      )}

      {confirmDemotion && (
        <DemotionModal
          user={confirmDemotion.user}
          nextRole={confirmDemotion.nextRole}
          onCancel={() => setConfirmDemotion(null)}
          onConfirm={() => {
            const { user, nextRole } = confirmDemotion;
            setConfirmDemotion(null);
            applyRole(user.uid, nextRole);
          }}
        />
      )}
    </div>
  );
}

/* ─── User table ─── */

function UserTable({
  users, currentUid, saving, onRoleChange, onToggleDisabled,
}: {
  users: FirebaseUser[];
  currentUid?: string;
  saving: string | null;
  onRoleChange: (u: FirebaseUser, role: string) => void;
  onToggleDisabled: (u: FirebaseUser) => void;
}) {
  return (
    <table className="admin-table w-full">
      <thead>
        <tr>
          <th>Usuario</th>
          <th className="hidden md:table-cell">Rol</th>
          <th className="hidden lg:table-cell">Último ingreso</th>
          <th className="hidden xl:table-cell">Creado</th>
          <th className="text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => {
          const isSelf = u.uid === currentUid;
          const isSaving = saving === u.uid;
          const initials = (u.name || u.email || '?').slice(0, 2).toUpperCase();
          return (
            <tr key={u.uid} className={u.disabled ? 'opacity-60' : ''}>
              <td>
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10.5px] font-semibold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-2))' }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: 'var(--admin-text)' }}>
                      {u.name || u.email || u.uid}
                      {isSelf && <span className="ml-2 text-[10.5px] admin-text-subtle font-normal">(tú)</span>}
                    </p>
                    {u.name && <p className="text-[11.5px] admin-text-subtle truncate">{u.email}</p>}
                  </div>
                </div>
              </td>
              <td className="hidden md:table-cell">
                <RoleBadge role={u.role} />
              </td>
              <td className="hidden lg:table-cell">
                <span className="inline-flex items-center gap-1.5 text-[12px] admin-text-muted">
                  <Clock className="w-3 h-3 admin-text-subtle" />
                  {fmtRelative(u.last_sign_in)}
                </span>
              </td>
              <td className="hidden xl:table-cell text-[12px] admin-text-muted">
                {fmtDate(u.created_at)}
              </td>
              <td>
                <div className="flex items-center justify-end gap-2">
                  <RoleSelect
                    value={u.role}
                    disabled={isSaving || isSelf}
                    onChange={(role) => onRoleChange(u, role)}
                  />
                  <button
                    onClick={() => onToggleDisabled(u)}
                    disabled={isSaving || isSelf}
                    title={u.disabled ? 'Habilitar' : 'Deshabilitar'}
                    className="w-8 h-8 rounded-lg flex items-center justify-center admin-text-muted hover:text-[color:var(--admin-text)] hover:bg-[color:var(--admin-accent-soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {u.disabled
                      ? <PowerOff className="w-3.5 h-3.5 text-red-500" />
                      : <Power className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RoleSelect({
  value, disabled, onChange,
}: { value: string; disabled?: boolean; onChange: (role: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-2.5 pr-7 h-8 text-[12px] rounded-lg admin-input cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ height: '32px' }}
      >
        {ROLE_OPTIONS.map((r) => (
          <option key={r} value={r}>{roleLabel(r)}{r === 'admin' ? ' (legacy)' : ''}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 admin-text-subtle" />
    </div>
  );
}

/* ─── Invite Modal ─── */

function InviteModal({
  onClose, onCreated,
}: { onClose: () => void; onCreated: (u: FirebaseUser) => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('seller');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [created, setCreated] = useState<FirebaseUser | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setCreated(data.user);
      setResetLink(data.resetLink);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Invitar miembro" icon={<UserPlus className="w-4 h-4" />}>
      {!created ? (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.cl"
              className="admin-input"
            />
          </Field>
          <Field label="Nombre (opcional)">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              className="admin-input"
            />
          </Field>
          <Field label="Rol">
            <div className="grid grid-cols-3 gap-2">
              {(['owner', 'pharmacist', 'seller'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-3 py-2 rounded-lg text-[12.5px] font-medium border transition-all ${
                    role === r ? 'text-white' : 'admin-text-muted hover:text-[color:var(--admin-text)]'
                  }`}
                  style={
                    role === r
                      ? { background: 'linear-gradient(180deg, var(--admin-accent), var(--admin-accent-2))', borderColor: 'transparent' }
                      : { background: 'var(--admin-surface-2)', borderColor: 'var(--admin-border-strong)' }
                  }
                >
                  {roleLabel(r)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] admin-text-subtle">{roleDescription(role)}</p>
          </Field>
          {err && (
            <div className="text-[12.5px] text-red-500 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {err}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="admin-btn admin-btn-secondary">Cancelar</button>
            <button type="submit" disabled={busy} className="admin-btn admin-btn-primary disabled:opacity-50">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              {busy ? 'Invitando…' : 'Invitar'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--admin-accent-soft)' }}>
            <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--admin-accent)' }} />
            <div className="min-w-0">
              <p className="text-[13px] font-medium" style={{ color: 'var(--admin-text)' }}>
                Usuario creado: {created.email}
              </p>
              <p className="text-[12px] admin-text-muted mt-0.5">
                Rol: <RoleBadge role={created.role} size="xs" />
              </p>
            </div>
          </div>
          {resetLink && (
            <Field label="Enlace de configuración de contraseña">
              <textarea
                readOnly
                value={resetLink}
                rows={3}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                className="admin-input"
                style={{ height: 'auto', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
              />
              <p className="mt-1.5 text-[11.5px] admin-text-subtle">
                Comparte este enlace con el invitado para que defina su contraseña.
              </p>
            </Field>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { onCreated(created); }}
              className="admin-btn admin-btn-primary"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

/* ─── Demotion Modal ─── */

function DemotionModal({
  user, nextRole, onCancel, onConfirm,
}: {
  user: FirebaseUser;
  nextRole: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const lost = routesLostOnDemotion(user.role, nextRole);
  return (
    <ModalShell onClose={onCancel} title="Confirmar cambio de rol" icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}>
      <div className="space-y-4">
        <p className="text-[13px] admin-text-muted">
          Vas a cambiar el rol de <strong style={{ color: 'var(--admin-text)' }}>{user.name || user.email}</strong> de{' '}
          <RoleBadge role={user.role} size="xs" /> a <RoleBadge role={nextRole} size="xs" />.
        </p>
        {lost.length > 0 && (
          <div>
            <p className="text-[12px] font-semibold admin-text-muted mb-2">Perderá acceso a:</p>
            <div className="rounded-lg p-2 max-h-40 overflow-y-auto" style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)' }}>
              <ul className="space-y-0.5">
                {lost.map((r) => (
                  <li key={r} className="text-[11.5px] font-mono admin-text-muted px-2 py-1">{r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="admin-btn admin-btn-secondary">Cancelar</button>
          <button onClick={onConfirm} className="admin-btn admin-btn-primary">Confirmar</button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ─── Modal shell + Field ─── */

function ModalShell({
  children, onClose, title, icon,
}: { children: React.ReactNode; onClose: () => void; title: string; icon?: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
      <div className="admin-elevated w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b admin-hairline">
          <div className="flex items-center gap-2.5">
            {icon}
            <h2 className="text-[14px] font-semibold" style={{ color: 'var(--admin-text)' }}>{title}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg admin-text-muted hover:bg-[color:var(--admin-accent-soft)] flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11.5px] font-semibold admin-text-muted mb-1.5 uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
