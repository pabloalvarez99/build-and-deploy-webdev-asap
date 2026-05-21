'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Search, Loader2, Package, Image as ImageIcon, FlaskConical } from 'lucide-react';

interface RpItem {
  ecosur_id: string;
  description: string;
  suggested_price: number | null;
  status: string;
  barcodes: string[];
  image_url: string | null;
  laboratory: string | null;
  active_ingredient: string | null;
  therapeutic_action: string | null;
  product_type: string | null;
  presentation: string | null;
  dose: string | null;
  form: string | null;
  enrich_status: string | null;
}

interface RpStats {
  total: number;
  with_image: number;
  with_lab: number;
  scraped: number;
  heuristic: number;
  failed: number;
  pending: number;
}

export default function RpCatalogPage() {
  const [items, setItems] = useState<RpItem[]>([]);
  const [stats, setStats] = useState<RpStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [enrich, setEnrich] = useState('all');
  const [hasImage, setHasImage] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const url = new URL('/api/admin/rp-catalog', window.location.origin);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    if (q) url.searchParams.set('q', q);
    if (enrich !== 'all') url.searchParams.set('enrich', enrich);
    if (hasImage) url.searchParams.set('has_image', hasImage);
    const res = await fetch(url.pathname + url.search, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
      setStats(data.stats);
    }
    setLoading(false);
  }, [page, q, enrich, hasImage]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Package className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-semibold">Catálogo RP (Ecosur)</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
          <Stat label="Total" value={stats.total} />
          <Stat label="Con imagen" value={stats.with_image} hint={`${pct(stats.with_image, stats.total)}%`} />
          <Stat label="Con laboratorio" value={stats.with_lab} hint={`${pct(stats.with_lab, stats.total)}%`} />
          <Stat label="Scraped" value={stats.scraped} />
          <Stat label="Heuristic" value={stats.heuristic} />
          <Stat label="Failed" value={stats.failed} />
          <Stat label="Pending" value={stats.pending} />
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center bg-white p-3 rounded-lg border">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Buscar por descripción, ID Ecosur o código de barras…"
            className="w-full pl-9 pr-3 py-2 border rounded"
          />
        </div>
        <select value={enrich} onChange={(e) => { setEnrich(e.target.value); setPage(1); }} className="border rounded px-2 py-2">
          <option value="all">Todos enrich</option>
          <option value="scraped">Scraped</option>
          <option value="heuristic">Heuristic</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
        <select value={hasImage} onChange={(e) => { setHasImage(e.target.value); setPage(1); }} className="border rounded px-2 py-2">
          <option value="">Imagen: todos</option>
          <option value="1">Con imagen</option>
          <option value="0">Sin imagen</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2 w-16">Img</th>
              <th className="p-2 w-20">ID</th>
              <th className="p-2">Descripción</th>
              <th className="p-2">Lab</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Forma</th>
              <th className="p-2">Pres.</th>
              <th className="p-2">Dosis</th>
              <th className="p-2 text-right">PVP</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Enrich</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={11} className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline" /></td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={11} className="p-6 text-center text-gray-500">Sin resultados</td></tr>
            )}
            {!loading && items.map((it) => (
              <tr key={it.ecosur_id} className="border-t hover:bg-gray-50">
                <td className="p-2">
                  {it.image_url
                    ? <Image src={it.image_url} alt={it.description} width={48} height={48} className="object-contain rounded border" unoptimized />
                    : <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-400" /></div>}
                </td>
                <td className="p-2 font-mono text-xs">{it.ecosur_id}</td>
                <td className="p-2">{it.description}</td>
                <td className="p-2">{it.laboratory ?? '—'}</td>
                <td className="p-2">{it.product_type ?? '—'}</td>
                <td className="p-2">{it.form ?? '—'}</td>
                <td className="p-2">{it.presentation ?? '—'}</td>
                <td className="p-2">{it.dose ?? '—'}</td>
                <td className="p-2 text-right">{it.suggested_price ? `$${it.suggested_price.toLocaleString('es-CL')}` : '—'}</td>
                <td className="p-2">{it.status}</td>
                <td className="p-2"><EnrichPill v={it.enrich_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span>{total.toLocaleString('es-CL')} productos · página {page}/{pages}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">← Anterior</button>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Siguiente →</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="bg-white border rounded-lg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value.toLocaleString('es-CL')}</div>
      {hint && <div className="text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

function EnrichPill({ v }: { v: string | null }) {
  const map: Record<string, string> = {
    scraped: 'bg-green-100 text-green-700',
    heuristic: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
    pending: 'bg-gray-100 text-gray-600',
  };
  const cls = map[v ?? ''] ?? 'bg-gray-100 text-gray-600';
  return <span className={`px-2 py-0.5 rounded text-xs ${cls}`}>{v ?? '—'}</span>;
}

function pct(a: number, b: number) { return b ? Math.round((a / b) * 100) : 0; }
