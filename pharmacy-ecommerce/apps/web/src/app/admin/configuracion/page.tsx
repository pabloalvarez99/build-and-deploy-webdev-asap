'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Save, Mail, AlertTriangle, CheckCircle, Monitor, Download, Store, Phone, MapPin, Globe } from 'lucide-react';

export default function AdminConfigPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [alertEmail, setAlertEmail] = useState('');
  const [threshold, setThreshold] = useState('10');
  // Pharmacy info
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyAddress, setPharmacyAddress] = useState('');
  const [pharmacyPhone, setPharmacyPhone] = useState('');
  const [pharmacyWebsite, setPharmacyWebsite] = useState('');
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
        setPharmacyName(data.pharmacy_name || '');
        setPharmacyAddress(data.pharmacy_address || '');
        setPharmacyPhone(data.pharmacy_phone || '');
        setPharmacyWebsite(data.pharmacy_website || '');
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
        body: JSON.stringify({
          alert_email: alertEmail,
          low_stock_threshold: threshold,
          pharmacy_name: pharmacyName,
          pharmacy_address: pharmacyAddress,
          pharmacy_phone: pharmacyPhone,
          pharmacy_website: pharmacyWebsite,
        }),
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
          {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />)}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Pharmacy info */}
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Información de la Farmacia</h2>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">Estos datos aparecen en las cotizaciones generadas para clientes.</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre comercial</label>
                <input
                  type="text"
                  value={pharmacyName}
                  onChange={e => setPharmacyName(e.target.value)}
                  className="input w-full"
                  placeholder="Tu Farmacia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={pharmacyPhone}
                    onChange={e => setPharmacyPhone(e.target.value)}
                    className="input pl-10 w-full"
                    placeholder="+56 9 9364 9604"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={pharmacyAddress}
                    onChange={e => setPharmacyAddress(e.target.value)}
                    className="input pl-10 w-full"
                    placeholder="Coquimbo, Chile"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sitio web</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={pharmacyWebsite}
                    onChange={e => setPharmacyWebsite(e.target.value)}
                    className="input pl-10 w-full"
                    placeholder="tu-farmacia.cl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stock alerts */}
          <div className="card p-6 space-y-5">
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
          </div>

          <div className="flex items-center gap-3">
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
