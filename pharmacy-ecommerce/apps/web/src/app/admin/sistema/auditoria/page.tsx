'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { isOwnerRole } from '@/lib/roles';
import { Shield, Filter, ChevronDown, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { DataTable } from '@/components/admin/ui/DataTable';
import { EmptyState } from '@/components/admin/ui/EmptyState';

interface AuditRow {
  id: string;
  user_email: string;
  action: string;
  entity: string;
  entity_id: string | null;
  entity_name: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  ip_address: string | null;
  created_at: string;
}

interface AuditResponse {
  rows: AuditRow[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/[0.08]',
  update: 'border-blue-500/30 text-blue-700 dark:text-blue-400 bg-blue-500/[0.08]',
  delete: 'border-red-500/30 text-red-700 dark:text-red-400 bg-red-500/[0.08]',
};

const ENTITY_LABELS: Record<string, string> = {
  product: 'Producto',
  order: 'Orden',
  pos_sale: 'Venta POS',
  stock_movement: 'Movimiento stock',
  user: 'Usuario',
  purchase_order: 'Orden de compra',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AuditoriaPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entity) params.set('entity', entity);
      if (action) params.set('action', action);
      if (userFilter) params.set('user', userFilter);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      params.set('page', String(page));
      const res = await fetch(`/api/admin/audit?${params}`, { credentials: 'include' });
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [entity, action, userFilter, from, to, page]);

  useEffect(() => {
    if (!user || !isOwnerRole(user.role)) { router.push('/'); return; }
    load();
  }, [user, router, load]);

  const reset = () => {
    setEntity(''); setAction(''); setUserFilter(''); setFrom(''); setTo(''); setPage(1);
  };

  if (!user || !isOwnerRole(user.role)) return null;

  return (
    <div>
      <PageHeader
        title="Auditoría"
        description="Rastro de cambios en datos sensibles. Solo dueño."
        icon={<Shield className="w-5 h-5" />}
        actions={
          <button onClick={reset} className="admin-btn-ghost flex items-center gap-1.5 text-[13px]">
            <RotateCcw className="w-3.5 h-3.5" /> Limpiar
          </button>
        }
      />

      <div className="admin-surface p-3 mb-4 grid grid-cols-2 md:grid-cols-5 gap-2">
        <select className="admin-input text-[13px]" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }}>
          <option value="">Toda entidad</option>
          {Object.entries(ENTITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="admin-input text-[13px]" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          <option value="">Toda acción</option>
          <option value="create">Crear</option>
          <option value="update">Actualizar</option>
          <option value="delete">Eliminar</option>
        </select>
        <input
          type="text" placeholder="Email usuario…" className="admin-input text-[13px]"
          value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
        />
        <input type="date" className="admin-input text-[13px]" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <input type="date" className="admin-input text-[13px]" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
      </div>

      {loading ? (
        <div className="admin-surface p-12 text-center admin-text-muted text-sm">Cargando…</div>
      ) : !data || data.rows.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-5 h-5" />}
          title="Sin registros"
          description="No hay eventos para los filtros aplicados."
        />
      ) : (
        <>
          <DataTable>
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Nombre / Ref</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const isOpen = expanded === r.id;
                const hasChanges = r.changes && Object.keys(r.changes).length > 0;
                return (
                  <Fragment key={r.id}>
                    <tr className={hasChanges ? 'cursor-pointer' : ''} onClick={() => hasChanges && setExpanded(isOpen ? null : r.id)}>
                      <td>{hasChanges ? (isOpen ? <ChevronDown className="w-3.5 h-3.5 admin-text-muted" /> : <ChevronRight className="w-3.5 h-3.5 admin-text-muted" />) : null}</td>
                      <td className="tabular-nums text-[12.5px] admin-text-muted">{fmt(r.created_at)}</td>
                      <td className="text-[12.5px]">{r.user_email}</td>
                      <td>
                        <span className={`px-1.5 py-0.5 text-[10.5px] font-semibold rounded-md border ${ACTION_COLORS[r.action] || ''}`}>
                          {r.action}
                        </span>
                      </td>
                      <td className="text-[12.5px] admin-text-muted">{ENTITY_LABELS[r.entity] || r.entity}</td>
                      <td className="text-[13px]">{r.entity_name || <span className="admin-text-subtle">—</span>}</td>
                      <td className="font-mono text-[11px] admin-text-subtle">{r.entity_id?.slice(0, 8) || ''}</td>
                    </tr>
                    {isOpen && hasChanges && (
                      <tr>
                        <td colSpan={7} style={{ background: 'var(--admin-surface-2)' }}>
                          <div className="px-4 py-3">
                            <div className="grid gap-1.5">
                              {Object.entries(r.changes!).map(([field, { old, new: nv }]) => (
                                <div key={field} className="grid grid-cols-12 gap-2 text-[12px]">
                                  <div className="col-span-3 font-medium" style={{ color: 'var(--admin-text)' }}>{field}</div>
                                  <div className="col-span-4 admin-text-muted line-through">{String(old ?? '∅')}</div>
                                  <div className="col-span-1 admin-text-subtle text-center">→</div>
                                  <div className="col-span-4" style={{ color: 'var(--admin-accent)' }}>{String(nv ?? '∅')}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </DataTable>

          <div className="flex items-center justify-between mt-4 px-1 text-[12.5px] admin-text-muted">
            <div>Mostrando {data.rows.length} de {data.total} eventos</div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="admin-btn-ghost flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <span>Pág. {data.page} / {data.pages || 1}</span>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
                className="admin-btn-ghost flex items-center gap-1 disabled:opacity-40"
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
