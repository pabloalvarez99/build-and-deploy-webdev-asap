'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, ChevronDown, Loader2, RefreshCw } from 'lucide-react';

interface FirebaseUser {
  uid: string;
  email: string | undefined;
  name: string | null;
  role: string;
  created_at: string | undefined;
  last_sign_in: string | undefined;
  disabled: boolean;
}

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Dueño', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'pharmacist', label: 'Farmacéutico', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'seller', label: 'Vendedor', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'user', label: 'Cliente', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  { value: 'admin', label: 'Admin (legacy)', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
];

function getRoleStyle(role: string) {
  return ROLE_OPTIONS.find(r => r.value === role)?.color ?? 'bg-slate-100 text-slate-600';
}

function getRoleLabel(role: string) {
  return ROLE_OPTIONS.find(r => r.value === role)?.label ?? role;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const setRole = async (uid: string, role: string) => {
    setSaving(uid);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, role }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error');
      }
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(null);
    }
  };

  const adminUsers = users.filter(u => ['owner', 'pharmacist', 'seller', 'admin'].includes(u.role));
  const regularUsers = users.filter(u => !['owner', 'pharmacist', 'seller', 'admin'].includes(u.role));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Asigna roles al equipo de la farmacia
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Role legend */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1">
          <Shield className="w-3.5 h-3.5" /> Niveles de acceso
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="space-y-0.5">
            <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${getRoleStyle('owner')}`}>Dueño</span>
            <p className="text-slate-500 dark:text-slate-400">Acceso total + usuarios + reportes financieros</p>
          </div>
          <div className="space-y-0.5">
            <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${getRoleStyle('pharmacist')}`}>Farmacéutico</span>
            <p className="text-slate-500 dark:text-slate-400">POS + recetas + vencimientos + inventario</p>
          </div>
          <div className="space-y-0.5">
            <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${getRoleStyle('seller')}`}>Vendedor</span>
            <p className="text-slate-500 dark:text-slate-400">Solo POS + órdenes + clientes + arqueo</p>
          </div>
          <div className="space-y-0.5">
            <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${getRoleStyle('user')}`}>Cliente</span>
            <p className="text-slate-500 dark:text-slate-400">Sin acceso al admin</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Team section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Equipo farmacia ({adminUsers.length})
              </h2>
            </div>
            {adminUsers.length === 0 ? (
              <p className="text-sm text-slate-400 p-4">Sin usuarios de equipo aún.</p>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {adminUsers.map((u) => (
                  <UserRow key={u.uid} user={u} saving={saving} onSetRole={setRole} />
                ))}
              </div>
            )}
          </div>

          {/* Customers section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Clientes registrados ({regularUsers.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-96 overflow-y-auto">
              {regularUsers.map((u) => (
                <UserRow key={u.uid} user={u} saving={saving} onSetRole={setRole} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserRow({ user, saving, onSetRole }: {
  user: FirebaseUser;
  saving: string | null;
  onSetRole: (uid: string, role: string) => void;
}) {
  const isSaving = saving === user.uid;

  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
          {user.name || user.email || user.uid}
        </p>
        {user.name && (
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRoleStyle(user.role)}`}>
          {getRoleLabel(user.role)}
        </span>
        <div className="relative">
          <select
            value={user.role}
            onChange={(e) => onSetRole(user.uid, e.target.value)}
            disabled={isSaving}
            className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
          >
            <option value="owner">Dueño</option>
            <option value="pharmacist">Farmacéutico</option>
            <option value="seller">Vendedor</option>
            <option value="user">Cliente</option>
            <option value="admin">Admin (legacy)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
