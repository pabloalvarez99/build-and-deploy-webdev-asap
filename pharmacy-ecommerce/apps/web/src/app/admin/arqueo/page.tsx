'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Banknote, CreditCard, SmartphoneNfc, Calculator, CheckCircle2,
  AlertCircle, Loader2, Clock, TrendingUp, Lock, RefreshCw,
  ChevronDown, ChevronUp, Receipt, History, X, DollarSign, Info, Shuffle, Printer,
} from 'lucide-react';

interface ShiftData {
  turno_inicio: string;
  fondo_inicial: number;
  ventas: {
    efectivo: number;
    debito: number;
    credito: number;
    mixto: number;
    total: number;
    num_transacciones: number;
  };
  efectivo_esperado: number;
  recent_orders: {
    id: string;
    total: number;
    payment_provider: string;
    created_at: string;
    customer: string;
  }[];
  closes: {
    id: string;
    turno_inicio: string;
    turno_fin: string;
    ventas_total: number;
    ventas_efectivo: number;
    ventas_debito: number;
    ventas_credito: number;
    num_transacciones: number;
    efectivo_esperado: number;
    efectivo_contado: number;
    diferencia: number;
    fondo_inicial: number;
    notas: string | null;
    cerrado_por: string | null;
    created_at: string;
  }[];
}

function formatPrice(n: number) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

function formatDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const PAYMENT_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pos_cash: { label: 'Efectivo', color: 'text-emerald-600 dark:text-emerald-400', icon: <Banknote className="w-4 h-4" /> },
  pos_debit: { label: 'Débito', color: 'text-blue-600 dark:text-blue-400', icon: <CreditCard className="w-4 h-4" /> },
  pos_credit: { label: 'Crédito', color: 'text-violet-600 dark:text-violet-400', icon: <SmartphoneNfc className="w-4 h-4" /> },
  pos_mixed: { label: 'Mixto', color: 'text-amber-600 dark:text-amber-400', icon: <Shuffle className="w-4 h-4" /> },
};

export default function ArqueoPage() {
  const [data, setData] = useState<ShiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Close modal state
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [efectivoContado, setEfectivoContado] = useState('');
  const [fondoNuevo, setFondoNuevo] = useState('');
  const [notas, setNotas] = useState('');
  const [closing, setClosing] = useState(false);
  const [closeResult, setCloseResult] = useState<{ diferencia: number } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedClose, setExpandedClose] = useState<string | null>(null);

  // Pharmacist shift
  const [showPharmacistModal, setShowPharmacistModal] = useState(false);
  const [pharmacistName, setPharmacistName] = useState('');
  const [pharmacistRut, setPharmacistRut] = useState('');
  const [savingPharmacist, setSavingPharmacist] = useState(false);
  const [activePharmacist, setActivePharmacist] = useState<string | null>(null);

  // Fondo inicial edit
  const [editingFondo, setEditingFondo] = useState(false);
  const [fondoInput, setFondoInput] = useState('');
  const [savingFondo, setSavingFondo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/arqueo', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar datos');
      const json = await res.json();
      setData(json);
      setFondoInput(String(json.fondo_inicial));
      setActivePharmacist(json.pharmacist_name || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSaveFondo = async () => {
    const fondo = parseFloat(fondoInput);
    if (isNaN(fondo) || fondo < 0) return;
    setSavingFondo(true);
    try {
      await fetch('/api/admin/arqueo', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_fondo', fondo }),
      });
      setEditingFondo(false);
      await load();
    } finally { setSavingFondo(false); }
  };

  const handleCerrar = async () => {
    const ec = parseFloat(efectivoContado);
    if (isNaN(ec)) return;
    setClosing(true);
    try {
      const res = await fetch('/api/admin/arqueo', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cerrar',
          efectivo_contado: ec,
          notas: notas.trim() || undefined,
          fondo_nuevo: parseFloat(fondoNuevo) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al cerrar caja');
      setCloseResult({ diferencia: json.diferencia });
      setEfectivoContado('');
      setNotas('');
      setFondoNuevo('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setClosing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="p-6 text-center text-slate-500">{error || 'Error al cargar'}</div>
  );

  const diferencia = parseFloat(efectivoContado || '0') - data.efectivo_esperado;
  const diferenciaColor = Math.abs(diferencia) < 1 ? 'text-emerald-600 dark:text-emerald-400' : diferencia > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400';

  return (
    <>
    <style>{`
      @media print {
        body > * { display: none !important; }
        #zreport-print { display: block !important; position: fixed; inset: 0; background: white; padding: 24px; font-family: monospace; }
      }
      #zreport-print { display: none; }
    `}</style>
    <div id="zreport-print">
      <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>Z-REPORT — Cierre de Turno</h2>
      <p style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Turno desde: {formatTime(data.turno_inicio)}</p>
      <p style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Impreso: {new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</p>
      <hr style={{ margin: '8px 0', borderColor: '#ccc' }} />
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <tbody>
          <tr><td>Fondo inicial</td><td style={{ textAlign: 'right' }}>{formatPrice(data.fondo_inicial)}</td></tr>
          <tr><td>Ventas efectivo</td><td style={{ textAlign: 'right' }}>{formatPrice(data.ventas.efectivo)}</td></tr>
          <tr><td>Ventas débito</td><td style={{ textAlign: 'right' }}>{formatPrice(data.ventas.debito)}</td></tr>
          <tr><td>Ventas crédito</td><td style={{ textAlign: 'right' }}>{formatPrice(data.ventas.credito)}</td></tr>
          {data.ventas.mixto > 0 && (
            <tr><td>Ventas mixto</td><td style={{ textAlign: 'right' }}>{formatPrice(data.ventas.mixto)}</td></tr>
          )}
          <tr style={{ fontWeight: 'bold', borderTop: '1px solid #ccc' }}>
            <td>TOTAL VENTAS</td><td style={{ textAlign: 'right' }}>{formatPrice(data.ventas.total)}</td>
          </tr>
          <tr><td>N° transacciones</td><td style={{ textAlign: 'right' }}>{data.ventas.num_transacciones}</td></tr>
          <tr style={{ borderTop: '1px solid #ccc' }}><td>Efectivo esperado en caja</td><td style={{ textAlign: 'right' }}>{formatPrice(data.efectivo_esperado)}</td></tr>
        </tbody>
      </table>
    </div>
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            Arqueo de Caja
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Turno desde <strong>{formatTime(data.turno_inicio)}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Imprimir Z-report">
            <Printer className="w-5 h-5 text-slate-400" />
          </button>
          <button onClick={load} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Actualizar">
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Ventas totales
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatPrice(data.ventas.total)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{data.ventas.num_transacciones} transacciones</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 p-4">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs mb-1">
            <Banknote className="w-3.5 h-3.5" /> Efectivo
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatPrice(data.ventas.efectivo)}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 p-4">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs mb-1">
            <CreditCard className="w-3.5 h-3.5" /> Débito
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatPrice(data.ventas.debito)}</p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-800/30 p-4">
          <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 text-xs mb-1">
            <SmartphoneNfc className="w-3.5 h-3.5" /> Crédito
          </div>
          <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{formatPrice(data.ventas.credito)}</p>
        </div>
        {data.ventas.mixto > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30 p-4">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs mb-1">
              <Shuffle className="w-3.5 h-3.5" /> Mixto
            </div>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatPrice(data.ventas.mixto)}</p>
          </div>
        )}
      </div>

      {/* Cash accounting */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" /> Conteo de caja
        </h2>

        <div className="grid sm:grid-cols-3 gap-3">
          {/* Fondo inicial */}
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Fondo inicial</p>
            {editingFondo ? (
              <div className="flex gap-2 items-center">
                <span className="text-slate-500 text-sm">$</span>
                <input
                  type="number" min="0" step="1000" value={fondoInput}
                  onChange={e => setFondoInput(e.target.value)}
                  className="flex-1 w-20 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-400"
                  autoFocus
                />
                <button onClick={handleSaveFondo} disabled={savingFondo}
                  className="px-2 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50">
                  {savingFondo ? '...' : 'OK'}
                </button>
                <button onClick={() => setEditingFondo(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatPrice(data.fondo_inicial)}</p>
                <button onClick={() => setEditingFondo(true)} className="text-xs text-slate-400 hover:text-emerald-600 underline">editar</button>
              </div>
            )}
          </div>

          {/* Ventas efectivo */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">+ Ventas efectivo</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatPrice(data.ventas.efectivo)}</p>
          </div>

          {/* Efectivo esperado */}
          <div className="bg-slate-800 dark:bg-slate-900 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">= Efectivo esperado en caja</p>
            <p className="text-2xl font-bold text-white">{formatPrice(data.efectivo_esperado)}</p>
          </div>
        </div>

        {/* Counter input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Efectivo contado físicamente
          </label>
          <div className="flex gap-3 items-center">
            <span className="text-slate-500 font-semibold">$</span>
            <input
              type="number" min="0" step="1000"
              value={efectivoContado}
              onChange={e => { setEfectivoContado(e.target.value); setCloseResult(null); }}
              placeholder="0"
              className="flex-1 max-w-xs px-4 py-3 text-lg font-bold rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-emerald-400 focus:outline-none"
            />
            {efectivoContado && (
              <div className={`text-sm font-semibold ${diferenciaColor} bg-white dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700`}>
                {diferencia >= 0 ? '+' : ''}{formatPrice(diferencia)}
                <span className="block text-xs font-normal text-slate-400">
                  {Math.abs(diferencia) < 1 ? 'Cuadra perfectamente' : diferencia > 0 ? 'Sobrante' : 'Faltante'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cerrar caja button */}
        <button
          onClick={() => setShowCloseModal(true)}
          disabled={!efectivoContado}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-40 text-white dark:text-slate-900 rounded-xl font-semibold text-sm transition-all"
        >
          <Lock className="w-4 h-4" />
          Cerrar turno y guardar arqueo
        </button>

        {closeResult && (
          <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${
            Math.abs(closeResult.diferencia) < 1
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Caja cerrada correctamente · Diferencia: {formatPrice(closeResult.diferencia)}
          </div>
        )}
      </div>

      {/* Farmacéutico en turno */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Farmacéutico en turno</p>
        {activePharmacist ? (
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{activePharmacist}</p>
            <button onClick={() => setShowPharmacistModal(true)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline">
              Cambiar
            </button>
          </div>
        ) : (
          <button onClick={() => setShowPharmacistModal(true)}
            className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
            + Registrar farmacéutico
          </button>
        )}
      </div>

      {/* Recent orders */}
      {data.recent_orders.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-500" />
              Ventas del turno ({data.recent_orders.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-72 overflow-y-auto">
            {data.recent_orders.map(order => {
              const pm = PAYMENT_LABELS[order.payment_provider] ?? { label: order.payment_provider, color: 'text-slate-500', icon: null };
              return (
                <div key={order.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`shrink-0 ${pm.color}`}>{pm.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{order.customer}</p>
                    <p className="text-xs text-slate-400">{formatTime(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatPrice(order.total)}</p>
                    <p className={`text-xs ${pm.color}`}>{pm.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      {data.closes.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Historial de cierres ({data.closes.length})
            </h3>
            {showHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showHistory && (
            <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
              {data.closes.map(c => (
                <div key={c.id} className="px-4 py-3">
                  <button
                    onClick={() => setExpandedClose(expandedClose === c.id ? null : c.id)}
                    className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {formatTime(c.turno_fin)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Turno {formatDuration(c.turno_inicio, c.turno_fin)} · {c.num_transacciones} ventas · {c.cerrado_por}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(c.ventas_total)}</p>
                      <p className={`text-xs font-semibold ${
                        Math.abs(c.diferencia) < 1 ? 'text-emerald-500'
                        : c.diferencia > 0 ? 'text-blue-500'
                        : 'text-red-500'
                      }`}>
                        {c.diferencia >= 0 ? '+' : ''}{formatPrice(c.diferencia)}
                      </p>
                    </div>
                  </button>
                  {expandedClose === c.id && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { label: 'Fondo inicial', val: formatPrice(c.fondo_inicial) },
                        { label: 'Efectivo ventas', val: formatPrice(c.ventas_efectivo) },
                        { label: 'Débito', val: formatPrice(c.ventas_debito) },
                        { label: 'Crédito', val: formatPrice(c.ventas_credito) },
                        { label: 'Esperado en caja', val: formatPrice(c.efectivo_esperado) },
                        { label: 'Contado', val: formatPrice(c.efectivo_contado) },
                        { label: 'Diferencia', val: (c.diferencia >= 0 ? '+' : '') + formatPrice(c.diferencia) },
                        { label: 'Transacciones', val: String(c.num_transacciones) },
                      ].map(item => (
                        <div key={item.label} className="bg-slate-50 dark:bg-slate-700/40 rounded-lg p-2">
                          <p className="text-slate-500 dark:text-slate-400">{item.label}</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{item.val}</p>
                        </div>
                      ))}
                      {c.notas && (
                        <div className="col-span-2 sm:col-span-4 bg-slate-50 dark:bg-slate-700/40 rounded-lg p-2">
                          <p className="text-slate-500">Notas</p>
                          <p className="text-slate-700 dark:text-slate-300">{c.notas}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info card */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>El <strong className="text-slate-700 dark:text-slate-300">arqueo de caja</strong> se realiza al final de cada turno. Se compara el efectivo físico con lo esperado según las ventas registradas en el POS.</p>
            <p>Solo se cuentan las ventas en <strong>efectivo</strong> para el conteo físico. Débito y crédito van directo al banco.</p>
          </div>
        </div>
      </div>

      {/* Close modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-600" /> Cerrar turno
              </h2>
              <button onClick={() => setShowCloseModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ventas totales</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{formatPrice(data.ventas.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Efectivo en caja esperado</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{formatPrice(data.efectivo_esperado)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Efectivo contado</span>
                  <span className={`font-bold ${diferenciaColor}`}>{formatPrice(parseFloat(efectivoContado || '0'))}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-2">
                  <span className="text-slate-500">Diferencia</span>
                  <span className={`font-bold text-base ${diferenciaColor}`}>
                    {diferencia >= 0 ? '+' : ''}{formatPrice(diferencia)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Fondo para el siguiente turno
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">$</span>
                  <input type="number" min="0" step="1000" value={fondoNuevo}
                    onChange={e => setFondoNuevo(e.target.value)}
                    placeholder="0"
                    className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notas (opcional)</label>
                <textarea
                  rows={2} value={notas} onChange={e => setNotas(e.target.value)}
                  placeholder="Observaciones del turno..."
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-slate-400 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button onClick={async () => { await handleCerrar(); setShowCloseModal(false); }}
                  disabled={closing}
                  className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {closing ? 'Cerrando...' : 'Cerrar turno'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Pharmacist shift modal */}
      {showPharmacistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm space-y-4 p-6">
            <h2 className="font-bold text-slate-900 dark:text-white">Farmacéutico en turno</h2>
            <input placeholder="Nombre completo *" value={pharmacistName}
              onChange={e => setPharmacistName(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
            <input placeholder="RUT (ej: 12.345.678-9) *" value={pharmacistRut}
              onChange={e => setPharmacistRut(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
            <div className="flex gap-3">
              <button onClick={() => setShowPharmacistModal(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Cancelar
              </button>
              <button
                disabled={!pharmacistName.trim() || !pharmacistRut.trim() || savingPharmacist}
                onClick={async () => {
                  setSavingPharmacist(true);
                  try {
                    const res = await fetch('/api/admin/arqueo', {
                      method: 'POST', credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'set_pharmacist_shift', pharmacist_name: pharmacistName.trim(), pharmacist_rut: pharmacistRut.trim() }),
                    });
                    if (res.ok) {
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('pharmacist_name', pharmacistName.trim());
                      }
                      setActivePharmacist(pharmacistName.trim());
                      setShowPharmacistModal(false);
                      setPharmacistName('');
                      setPharmacistRut('');
                    }
                  } finally { setSavingPharmacist(false); }
                }}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {savingPharmacist ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
