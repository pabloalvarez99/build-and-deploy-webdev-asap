'use client';

import { useState } from 'react';
import { Bell, Send, Check, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/admin/ui/PageHeader';

export default function AdminPushPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number; cleaned: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Título y cuerpo requeridos');
      return;
    }
    if (!confirm(`Enviar notificación a TODOS los suscriptores?\n\nTítulo: ${title}\nCuerpo: ${body}`)) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url, tag: `broadcast-${Date.now()}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed');
      setResult(data);
      setTitle('');
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Notificaciones Push" description="Enviar avisos a usuarios suscritos" icon={<Bell className="w-5 h-5" />} />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            placeholder="Ej: Ofertas en vitaminas"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
          />
          <p className="text-xs text-slate-400 mt-1">{title.length}/50</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Cuerpo</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={120}
            rows={3}
            placeholder="Ej: 20% OFF en toda la línea de vitaminas hasta el viernes"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">{body.length}/120</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">URL al hacer click</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 font-mono text-sm"
          />
        </div>

        <button
          onClick={send}
          disabled={busy || !title.trim() || !body.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {busy ? 'Enviando...' : 'Enviar a todos los suscriptores'}
        </button>

        {result && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-900 dark:text-emerald-300">Enviado</p>
              <p className="text-emerald-700 dark:text-emerald-400">
                {result.sent}/{result.total} entregadas · {result.failed} fallidas · {result.cleaned} expiradas eliminadas
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
