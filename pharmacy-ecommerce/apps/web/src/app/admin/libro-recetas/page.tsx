'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { isAdminRole } from '@/lib/roles';
import { Loader2, Printer, Filter, BookOpen, ShieldAlert, Download, Receipt } from 'lucide-react';

interface PrescriptionRecord {
  id: string;
  order_id: string | null;
  product_name: string;
  quantity: number;
  prescription_number: string | null;
  patient_name: string;
  patient_rut: string | null;
  doctor_name: string | null;
  medical_center: string | null;
  prescription_date: string | null;
  is_controlled: boolean;
  dispensed_by: string | null;
  dispensed_at: string;
}

interface PageData {
  records: PrescriptionRecord[];
  total: number;
  kpis: { hoy: number; mes: number };
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportCSV(records: PrescriptionRecord[]) {
  const headers = ['Fecha', 'Producto', 'Cantidad', 'Paciente', 'RUT', 'Médico', 'Centro médico', 'Nro receta', 'Fecha receta', 'Controlado', 'Origen', 'Farmacéutico'];
  const rows = records.map((r) => [
    new Date(r.dispensed_at).toLocaleString('es-CL'),
    r.product_name,
    r.quantity,
    r.patient_name,
    r.patient_rut ?? '',
    r.doctor_name ?? '',
    r.medical_center ?? '',
    r.prescription_number ?? '',
    r.prescription_date ?? '',
    r.is_controlled ? 'Sí' : 'No',
    r.order_id ? 'POS' : 'Manual',
    r.dispensed_by ?? '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `libro-recetas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LibroRecetasPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [controlled, setControlled] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (controlled) params.set('controlled', controlled);
      const res = await fetch(`/api/admin/prescriptions?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar');
      setData(await res.json());
    } finally { setLoading(false); }
  }, [from, to, controlled]);

  useEffect(() => {
    if (!user || !isAdminRole(user.role)) { router.push('/'); return; }
    load();
  }, [user, router, load]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5 print:p-0">
      {/* Header — hidden when printing */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-600" /> Libro de Recetas
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(data?.records || [])}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {/* KPIs */}
      {data && (
        <div className="grid grid-cols-2 gap-3 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Recetas hoy</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.kpis.hoy}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Recetas este mes</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.kpis.mes}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400">Filtros:</span>
        </div>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" />
        <select value={controlled} onChange={e => setControlled(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
          <option value="">Todos</option>
          <option value="true">Solo controlados</option>
          <option value="false">No controlados</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
      ) : data && data.records.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Fecha</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Producto</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Paciente</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">RUT</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Médico</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Nro Receta</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Q</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Origen</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Farmacéutico</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map(r => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{fmt(r.dispensed_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {r.is_controlled && <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      <span className="text-slate-800 dark:text-slate-100 font-medium">{r.product_name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{r.patient_name}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400 font-mono text-xs">{r.patient_rut || '—'}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{r.doctor_name || '—'}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400 font-mono text-xs">{r.prescription_number || '—'}</td>
                  <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-200">{r.quantity}</td>
                  <td className="px-3 py-2">
                    {r.order_id ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-semibold border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/[0.08]">
                        <Receipt className="w-2.5 h-2.5" /> POS
                      </span>
                    ) : (
                      <span className="text-[11px] admin-text-subtle">Manual</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{r.dispensed_by || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">Sin registros para el período seleccionado.</div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body { font-size: 11px; }
          .print\\:hidden { display: none !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 4px 8px; }
          th { background: #f0f0f0; }
        }
      `}</style>
    </div>
  );
}
