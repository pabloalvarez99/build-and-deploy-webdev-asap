'use client';

import { X, Keyboard } from 'lucide-react';
import { SHORTCUTS_HELP } from '@/hooks/useAdminShortcuts';

interface ShortcutsHelpProps {
 isOpen: boolean;
 onClose: () => void;
}

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 {/* Backdrop */}
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

 {/* Modal */}
 <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
 <div className="flex items-center gap-3">
 <Keyboard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
 <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
 Atajos de Teclado
 </h2>
 </div>
 <button
 onClick={onClose}
 className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
 >
 <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
 </button>
 </div>

 {/* Content */}
 <div className="p-6 space-y-3">
 {SHORTCUTS_HELP.map((shortcut, index) => (
 <div
 key={index}
 className="flex items-center justify-between py-2"
 >
 <span className="text-slate-600 dark:text-slate-300">
 {shortcut.description}
 </span>
 <div className="flex items-center gap-1">
 {shortcut.keys.map((key, i) => (
 <span key={i} className="flex items-center gap-1">
 <kbd className="px-2 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">
 {key}
 </kbd>
 {i < shortcut.keys.length - 1 && (
 <span className="text-slate-400 dark:text-slate-500">+</span>
 )}
 </span>
 ))}
 </div>
 </div>
 ))}
 </div>

 {/* Footer */}
 <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700">
 <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
 Presiona <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600">?</kbd> en cualquier momento para ver esta ayuda
 </p>
 </div>
 </div>
 </div>
 );
}
