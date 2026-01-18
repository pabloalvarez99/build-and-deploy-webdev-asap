'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutConfig {
  onCommandPalette?: () => void;
  onNewProduct?: () => void;
  onShowHelp?: () => void;
}

export function useAdminShortcuts(config: ShortcutConfig = {}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if in input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    // Cmd+K / Ctrl+K - Command Palette
    if (cmdOrCtrl && e.key === 'k') {
      e.preventDefault();
      config.onCommandPalette?.();
      return;
    }

    // ? - Show help
    if (e.key === '?' && !e.shiftKey && !cmdOrCtrl) {
      e.preventDefault();
      config.onShowHelp?.();
      return;
    }

    // Two-key shortcuts (G + key for navigation, N + key for new)
    if (pendingKey === 'g') {
      setPendingKey(null);
      switch (e.key.toLowerCase()) {
        case 'd':
          e.preventDefault();
          router.push('/admin');
          break;
        case 'p':
          e.preventDefault();
          router.push('/admin/productos');
          break;
        case 'o':
          e.preventDefault();
          router.push('/admin/ordenes');
          break;
        case 'c':
          e.preventDefault();
          router.push('/admin/categorias');
          break;
      }
      return;
    }

    if (pendingKey === 'n') {
      setPendingKey(null);
      if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        config.onNewProduct?.();
      }
      return;
    }

    // Start two-key sequence
    if (e.key.toLowerCase() === 'g' || e.key.toLowerCase() === 'n') {
      setPendingKey(e.key.toLowerCase());
      // Clear pending after timeout
      setTimeout(() => setPendingKey(null), 1000);
      return;
    }
  }, [router, config, pendingKey]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { pendingKey };
}

export const SHORTCUTS_HELP = [
  { keys: ['Cmd/Ctrl', 'K'], description: 'Abrir paleta de comandos' },
  { keys: ['G', 'D'], description: 'Ir a Dashboard' },
  { keys: ['G', 'P'], description: 'Ir a Productos' },
  { keys: ['G', 'O'], description: 'Ir a Ordenes' },
  { keys: ['G', 'C'], description: 'Ir a Categorias' },
  { keys: ['N', 'P'], description: 'Nuevo Producto' },
  { keys: ['?'], description: 'Mostrar ayuda' },
];
