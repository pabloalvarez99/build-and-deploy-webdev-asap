'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = 'tf-pwa-install-dismissed';
const DISMISS_DAYS = 7;

export function InstallPWAButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (standalone) return;

    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const ts = Number(raw);
        if (Number.isFinite(ts) && Date.now() - ts < DISMISS_DAYS * 86400_000) return;
      }
    } catch {}

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const onInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'dismissed') {
        try {
          localStorage.setItem(DISMISS_KEY, String(Date.now()));
        } catch {}
      }
    } catch {
    } finally {
      setVisible(false);
      setDeferred(null);
    }
  };

  const onDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar Tu Farmacia"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-40 rounded-2xl border border-teal-200 bg-white shadow-2xl p-4 flex items-center gap-3"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-2xl" aria-hidden>
        📱
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-gray-900 leading-tight">Instalar Tu Farmacia</p>
        <p className="text-sm text-gray-600 leading-snug">Acceso rápido desde tu pantalla de inicio.</p>
      </div>
      <div className="flex-shrink-0 flex flex-col gap-1">
        <button
          type="button"
          onClick={onInstall}
          className="px-4 py-2 min-h-[44px] rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="px-4 py-2 min-h-[44px] rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
