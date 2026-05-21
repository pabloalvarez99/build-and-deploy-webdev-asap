'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Barcode, Search, X, Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { isAdminRole } from '@/lib/roles';
import { useAuthStore } from '@/store/auth';

interface UnknownScan {
  id: string;
  barcode: string;
  scan_count: number;
  first_scanned_at: string;
  last_scanned_at: string;
  last_user_id: string | null;
}

interface Product {
  id: string;
  name: string;
  presentation: string | null;
  laboratory: string | null;
  external_id: string | null;
}

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'ahora';
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
}

function Row({ scan, onResolved }: { scan: UnknownScan; onResolved: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/admin/etiquetas/search?q=${encodeURIComponent(query.trim())}`);
        const j = await r.json();
        setResults(j.products?.slice(0, 8) || []);
      } finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const assign = async (productId: string) => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/admin/barcodes/unknown/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: scan.barcode, product_id: productId }),
      });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || 'Error'); return; }
      onResolved();
    } finally { setBusy(false); }
  };

  const ignore = async () => {
    if (!confirm(`Ignorar código ${scan.barcode}?`)) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/admin/barcodes/unknown', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: scan.barcode }),
      });
      if (!r.ok) { setErr('Error al ignorar'); return; }
      onResolved();
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-base font-mono font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 px-2 py-1 rounded">{scan.barcode}</code>
            <span className="text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
              {scan.scan_count} scan{scan.scan_count > 1 ? 's' : ''}
            </span>
            <span className="text-xs text-slate-500">último: {timeAgo(scan.last_scanned_at)}</span>
          </div>
        </div>
        <button
          onClick={ignore}
          disabled={busy}
          className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 disabled:opacity-50"
          title="Marcar como ignorado (no es un producto real)"
        >
          Ignorar
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto por nombre..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
          disabled={busy}
        />
        {searching && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
      </div>

      {results.length > 0 && (
        <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-lg max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => assign(p.id)}
              disabled={busy}
              className="w-full text-left px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center justify-between gap-2 disabled:opacity-50"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.name}</div>
                <div className="text-xs text-slate-500 truncate">
                  {[p.laboratory, p.presentation, p.external_id && `ext:${p.external_id}`].filter(Boolean).join(' · ')}
                </div>
              </div>
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {err && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" /> {err}
        </div>
      )}
    </div>
  );
}

export default function UnknownBarcodesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  const [items, setItems] = useState<UnknownScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (!isAdminRole(user.role)) { router.replace('/'); return; }
    setAuthChecked(true);
  }, [user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/barcodes/unknown');
      const j = await r.json();
      setItems(j.items || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authChecked) load(); }, [authChecked, load]);

  if (!authChecked) return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Barcode className="w-7 h-7 text-amber-600" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Códigos no encontrados</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Scans del POS que no resolvieron a ningún producto. Asigna a producto existente o ignora.
            </p>
          </div>
          <button onClick={load} className="btn btn-secondary text-sm flex items-center gap-1.5" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </div>

        {loading && items.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Cargando...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/30 p-8 text-center">
            <Check className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Sin pendientes</h2>
            <p className="text-sm text-slate-500">No hay códigos sin resolver. Todos los scans POS resuelven correctamente.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((s) => (
              <Row key={s.id} scan={s} onResolved={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
