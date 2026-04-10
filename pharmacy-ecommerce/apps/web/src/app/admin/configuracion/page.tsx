'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Save, Mail, AlertTriangle, CheckCircle, Monitor, Download } from 'lucide-react';

export default function AdminConfigPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [alertEmail, setAlertEmail] = useState('');
  const [threshold, setThreshold] = useState('10');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setAlertEmail(data.alert_email || '');
        setThreshold(data.low_stock_threshold || '10');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_email: alertEmail, low_stock_threshold: threshold }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Configuración</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Ajustes del panel de administración</p>
      </div>

      {/* App de escritorio */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
          <Monitor className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">App de Escritorio (Windows)</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Aplicación nativa para el mostrador de farmacia. Accede al panel y al Punto de Venta directamente desde el escritorio, sin necesidad de abrir el navegador.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/pabloalvarez99/build-and-deploy-webdev-asap/releases/latest/download/Tu-Farmacia-Setup.exe"
            className="btn btn-primary flex items-center gap-2"
            download
          >
            <Download className="w-4 h-4" />
            Descargar instalador (.exe)
          </a>
          <a
            href="https://github.com/pabloalvarez99/build-and-deploy-webdev-asap/releases/latest/download/Tu-Farmacia-Portable.exe"
            className="btn btn-secondary flex items-center gap-2"
            download
          >
            <Download className="w-4 h-4" />
            Versión portable
          </a>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p><span className="font-medium text-slate-700 dark:text-slate-300">POS directo:</span> Al abrir la app, usa el menú <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">Navegación → Punto de Venta</span> o presiona <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">Ctrl+P</span>.</p>
          <p><span className="font-medium text-slate-700 dark:text-slate-300">Pantalla completa:</span> <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">F11</span> — ideal para un monitor dedicado al POS.</p>
          <p><span className="font-medium text-slate-700 dark:text-slate-300">Lector de barras:</span> Compatible con lectores USB — funciona automáticamente en el POS.</p>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="card p-6 space-y-6">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3">Alertas de Stock</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email para alertas de stock crítico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                value={alertEmail}
                onChange={e => setAlertEmail(e.target.value)}
                className="input pl-10 w-full"
                placeholder="admin@farmacia.com"
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Recibirás un email cuando el stock de un producto baje del umbral al aprobar una reserva.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Umbral de stock crítico (unidades)
            </label>
            <div className="relative">
              <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="number"
                min="1"
                max="100"
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                className="input pl-10 w-32"
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Productos con stock ≤ este número aparecen con alerta en el panel.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Guardado
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
