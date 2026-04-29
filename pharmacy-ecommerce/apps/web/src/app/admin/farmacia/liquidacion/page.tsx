'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle, CalendarClock, Tag, ArrowLeft, CheckCircle2, Loader2,
  Package, TrendingDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { isAdminRole, isOwnerRole } from '@/lib/roles';
import { formatPrice } from '@/lib/format';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { StatCard } from '@/components/admin/ui/StatCard';

type Tier = 'expired' | 'critical' | 'urgent' | 'warning';

interface BatchInfo {
  id: string;
  batch_code: string | null;
  expiry_date: string;
  quantity: number;
}
interface Item {
  product_id: string;
  product_name: string;
  product_slug: string;
  price: number;
  stock: number;
  current_discount: number;
  image_url: string | null;
  category: string | null;
  total_at_risk: number;
  min_expiry: string;
  days_to_expiry: number;
  suggested_discount: number;
  tier: Tier;
  batches: BatchInfo[];
}
interface Summary {
  total_products: number;
  total_units: number;
  potential_loss: number;
  expired: number;
  critical: number;
  urgent: number;
  warning: number;
}

const TIER_LABEL: Record<Tier, string> = {
  expired: 'Vencido',
  critical: '≤15 días',
  urgent: '≤30 días',
  warning: '≤60 días',
};
const TIER_COLOR: Record<Tier, string> = {
  expired: 'border-red-500/40 text-red-700 dark:text-red-400 bg-red-500/[0.10]',
  critical: 'border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/[0.10]',
  urgent: 'border-yellow-500/40 text-yellow-700 dark:text-yellow-400 bg-yellow-500/[0.10]',
  warning: 'border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-500/[0.10]',
};

export default function LiquidacionPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Tier>('all');
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState<{ count: number } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/farmacia/liquidacion', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        setSummary(data.summary ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || !isAdminRole(user.role)) { router.push('/'); return; }
    load();
  }, [user, router, load]);

  if (!user || !isAdminRole(user.role)) return null;

  const filtered = filter === 'all' ? items : items.filter((i) => i.tier === filter);
  const allSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.product_id));

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }
  function toggleAllVisible() {
    const next = new Set(selected);
    if (allSelected) {
      filtered.forEach((i) => next.delete(i.product_id));
    } else {
      filtered.forEach((i) => next.add(i.product_id));
    }
    setSelected(next);
  }
  function applySuggestionToVisible() {
    const next = { ...edits };
    filtered.forEach((i) => { next[i.product_id] = i.suggested_discount; });
    setEdits(next);
    const sel = new Set(selected);
    filtered.forEach((i) => sel.add(i.product_id));
    setSelected(sel);
  }

  async function applyAll() {
    if (selected.size === 0) return;
    setApplying(true);
    setDone(null);
    try {
      const payload = Array.from(selected).map((id) => {
        const item = items.find((i) => i.product_id === id);
        const discount = edits[id] ?? item?.suggested_discount ?? 0;
        return { product_id: id, discount_percent: discount };
      });
      const res = await fetch('/api/admin/farmacia/liquidacion', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      });
      if (!res.ok) throw new Error('No se pudo aplicar');
      const data = await res.json();
      setDone({ count: data.updated?.length ?? 0 });
      setSelected(new Set());
      setEdits({});
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/farmacia" className="inline-flex items-center gap-1.5 text-[12.5px] admin-text-muted hover:text-[color:var(--admin-accent)]">
        <ArrowLeft className="w-3.5 h-3.5" /> Panel farmacéutico
      </Link>

      <PageHeader
        title="Liquidación por vencimiento"
        description="Aplicar descuentos masivos a productos próximos a vencer"
        icon={<TrendingDown className="w-5 h-5" />}
        badge={
          <span className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider rounded-md border border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/[0.08]">
            FEFO + descuento
          </span>
        }
      />

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          <StatCard
            label="Productos en riesgo"
            value={summary.total_products}
            icon={<Package className="w-4 h-4" />}
            accent="amber"
            hint={`${summary.total_units} unidades`}
          />
          <StatCard
            label="Pérdida potencial"
            value={formatPrice(summary.potential_loss)}
            icon={<AlertTriangle className="w-4 h-4" />}
            accent="red"
            hint="A precio actual"
            alert={summary.potential_loss > 0}
          />
          <StatCard
            label="Vencidos"
            value={summary.expired}
            icon={<CalendarClock className="w-4 h-4" />}
            accent="red"
            alert={summary.expired > 0}
          />
          <StatCard
            label="≤15 días"
            value={summary.critical}
            icon={<CalendarClock className="w-4 h-4" />}
            accent="amber"
            alert={summary.critical > 0}
          />
        </div>
      )}

      <div className="admin-surface p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'expired', 'critical', 'urgent', 'warning'] as const).map((t) => {
            const count = t === 'all' ? items.length : items.filter((i) => i.tier === t).length;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                  filter === t
                    ? 'bg-[color:var(--admin-accent)] text-white'
                    : 'admin-text-muted hover:text-[color:var(--admin-text)] border admin-hairline'
                }`}
              >
                {t === 'all' ? `Todos (${count})` : `${TIER_LABEL[t as Tier]} (${count})`}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={applySuggestionToVisible}
            disabled={filtered.length === 0}
            className="px-3 py-1.5 rounded-md text-[12px] font-semibold border admin-hairline admin-text-muted hover:text-[color:var(--admin-text)] disabled:opacity-50"
          >
            Aplicar sugerencia
          </button>
          <button
            onClick={applyAll}
            disabled={selected.size === 0 || applying || !isOwnerRole(user.role) && false}
            className="px-3 py-1.5 rounded-md text-[12px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
            Aplicar a {selected.size} producto{selected.size === 1 ? '' : 's'}
          </button>
        </div>
      </div>

      {done && (
        <div className="admin-surface p-3 flex items-center gap-2 border-l-2 border-emerald-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <p className="text-[12.5px]" style={{ color: 'var(--admin-text)' }}>
            Descuentos aplicados a {done.count} producto{done.count === 1 ? '' : 's'}.
          </p>
        </div>
      )}

      <div className="admin-surface overflow-hidden">
        {loading ? (
          <div className="p-12 text-center admin-text-muted text-sm">Cargando lotes…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-[13px] font-semibold" style={{ color: 'var(--admin-text)' }}>Sin lotes en riesgo</p>
            <p className="text-[11.5px] admin-text-subtle">No hay productos con vencimiento próximo en este filtro.</p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="border-b admin-hairline">
              <tr style={{ color: 'var(--admin-text-muted)' }}>
                <th className="text-left px-3 py-2.5 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAllVisible} />
                </th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10.5px]">Producto</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10.5px]">Vence</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-[10.5px]">Stock en riesgo</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-[10.5px]">Precio</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-[10.5px]">Pérdida</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-wider text-[10.5px]">Descuento</th>
              </tr>
            </thead>
            <tbody className="divide-y admin-hairline">
              {filtered.map((it) => {
                const isSel = selected.has(it.product_id);
                const editVal = edits[it.product_id] ?? it.suggested_discount;
                const loss = it.price * it.total_at_risk;
                return (
                  <tr key={it.product_id} className={isSel ? 'bg-[color:var(--admin-accent-soft)]' : ''}>
                    <td className="px-3 py-2.5">
                      <input type="checkbox" checked={isSel} onChange={() => toggle(it.product_id)} />
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/producto/${it.product_slug}`} target="_blank" className="font-medium hover:text-[color:var(--admin-accent)]" style={{ color: 'var(--admin-text)' }}>
                        {it.product_name}
                      </Link>
                      <p className="text-[11px] admin-text-subtle">
                        {it.category ?? 'Sin categoría'} · stock total {it.stock}
                        {it.current_discount > 0 && <span className="ml-1.5 text-orange-500">· -{it.current_discount}% ahora</span>}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10.5px] font-semibold uppercase border ${TIER_COLOR[it.tier]}`}>
                        {TIER_LABEL[it.tier]}
                      </span>
                      <p className="text-[11px] admin-text-subtle mt-1 tabular-nums">
                        {it.days_to_expiry <= 0 ? `Hace ${Math.abs(it.days_to_expiry)}d` : `En ${it.days_to_expiry}d`}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <span style={{ color: 'var(--admin-text)' }}>{it.total_at_risk}</span>
                      <p className="text-[10.5px] admin-text-subtle">{it.batches.length} lote{it.batches.length === 1 ? '' : 's'}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: 'var(--admin-text)' }}>{formatPrice(it.price)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-red-500 font-semibold">{formatPrice(loss)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={editVal}
                          onChange={(e) => setEdits({ ...edits, [it.product_id]: Math.max(0, Math.min(99, parseInt(e.target.value || '0', 10))) })}
                          className="w-14 px-2 py-1 rounded-md border admin-hairline bg-transparent text-center tabular-nums"
                          style={{ color: 'var(--admin-text)' }}
                        />
                        <span className="admin-text-subtle text-[11.5px]">%</span>
                      </div>
                      {editVal !== it.suggested_discount && (
                        <p className="text-[10.5px] admin-text-subtle text-center mt-0.5">
                          Sug: {it.suggested_discount}%
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[11.5px] admin-text-subtle text-center">
        Sugerencias por antigüedad: ≤60d → 10% · ≤30d → 25% · ≤15d → 40% · vencidos → 50%
      </p>
    </div>
  );
}
