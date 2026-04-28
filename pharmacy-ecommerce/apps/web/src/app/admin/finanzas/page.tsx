'use client';

import { useState, useEffect } from 'react';
import { Wallet, CreditCard, Receipt, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';

interface DashboardData {
  pending_ap_count: number;
  pending_ap_amount: number;
  gastos_mes: number;
  ingresos_mes: number;
  overdue_ap_count: number;
}

function formatCLP(n: number) {
  return `$${Math.round(n).toLocaleString('es-CL')}`;
}

export default function FinanzasDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/finanzas/dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const kpis = [
    {
      label: 'OC Pendientes de Pago',
      value: data ? `${data.pending_ap_count} OC` : '-',
      sub: data ? formatCLP(data.pending_ap_amount) : '-',
      icon: CreditCard,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      alert: data && data.overdue_ap_count > 0,
      alertMsg: data ? `${data.overdue_ap_count} vencidas` : '',
    },
    {
      label: 'Gastos del Mes',
      value: data ? formatCLP(data.gastos_mes) : '-',
      sub: 'mes en curso',
      icon: Receipt,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      alert: false,
      alertMsg: '',
    },
    {
      label: 'Ingresos del Mes',
      value: data ? formatCLP(data.ingresos_mes) : '-',
      sub: 'órdenes paid + completed',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      alert: false,
      alertMsg: '',
    },
    {
      label: 'Margen Bruto Estimado',
      value: data ? formatCLP(data.ingresos_mes - data.gastos_mes) : '-',
      sub: 'ingresos − gastos',
      icon: Wallet,
      color: data && data.ingresos_mes - data.gastos_mes >= 0 ? 'text-emerald-600' : 'text-red-600',
      bg: 'bg-slate-50 dark:bg-slate-700/50',
      alert: false,
      alertMsg: '',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-emerald-600" />
          Gestión Financiera
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Resumen financiero del mes en curso
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-2">
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-slate-400">{kpi.sub}</p>
              {kpi.alert && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> {kpi.alertMsg}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
