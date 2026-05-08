'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'tf-push-dismissed';
const DISMISS_DAYS = 14;
const SUBSCRIBED_KEY = 'tf-push-subscribed';

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushOptInButton() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;
    try {
      if (localStorage.getItem(SUBSCRIBED_KEY) === '1') return;
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const ts = Number(raw);
        if (Number.isFinite(ts) && Date.now() - ts < DISMISS_DAYS * 86400_000) return;
      }
    } catch {}
    const t = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const onEnable = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
        setVisible(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) throw new Error('VAPID key missing');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error('subscribe failed');
      try { localStorage.setItem(SUBSCRIBED_KEY, '1'); } catch {}
      setVisible(false);
    } catch (e) {
      console.error('[push opt-in]', e);
    } finally {
      setBusy(false);
    }
  };

  const onDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Activar notificaciones"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-40 rounded-2xl border border-cyan-200 bg-white dark:bg-slate-900 dark:border-cyan-800 shadow-2xl p-4 flex items-center gap-3"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-2xl" aria-hidden>
        🔔
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-gray-900 dark:text-slate-100 leading-tight">Recibe ofertas y promociones</p>
        <p className="text-sm text-gray-600 dark:text-slate-400 leading-snug">Avisos de medicamentos en oferta y novedades.</p>
      </div>
      <div className="flex-shrink-0 flex flex-col gap-1">
        <button
          type="button"
          onClick={onEnable}
          disabled={busy}
          className="px-4 py-2 min-h-[44px] rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {busy ? 'Activando…' : 'Activar'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Descartar"
          className="px-4 py-1 min-h-[32px] rounded-lg text-xs text-gray-500 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
