'use client';

/**
 * DrugDuplicateAlert — Banner que advierte cuando hay ≥2 productos con
 * el mismo principio activo (riesgo de sobredosis). Caso típico:
 * paracetamol puro + antigripal que ya contiene paracetamol.
 */

import { useState } from 'react';
import { AlertOctagon, ChevronDown, Pill } from 'lucide-react';
import type { DuplicateGroup } from '@/lib/drug-duplicates';

export default function DrugDuplicateAlert({
  duplicates,
}: {
  duplicates: DuplicateGroup[];
}) {
  const [open, setOpen] = useState(true);

  if (duplicates.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="mb-4 rounded-2xl border-2 border-fuchsia-300 dark:border-fuchsia-700 bg-fuchsia-50 dark:bg-fuchsia-900/30 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="drug-duplicates-list"
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <AlertOctagon
          className="w-6 h-6 text-fuchsia-700 dark:text-fuchsia-300 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-lg leading-tight text-fuchsia-900 dark:text-fuchsia-100">
            {duplicates.length === 1
              ? 'Principio activo duplicado en su carrito'
              : `${duplicates.length} principios activos duplicados`}
          </h3>
          <p className="text-sm mt-0.5 text-fuchsia-900 dark:text-fuchsia-100 opacity-90">
            Riesgo de doble dosis. Algunos productos comparten el mismo principio activo (por ejemplo, paracetamol presente en antigripales).
            Verifique con su médico o farmacéutico antes de combinarlos.
          </p>
        </div>
        <ChevronDown
          className={`w-6 h-6 text-fuchsia-700 dark:text-fuchsia-300 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul id="drug-duplicates-list" className="divide-y divide-slate-200 dark:divide-slate-700">
          {duplicates.map((group) => (
            <li key={group.drug} className="px-4 py-4 bg-white dark:bg-slate-800">
              <div className="flex items-start gap-3">
                <Pill
                  className="w-5 h-5 text-fuchsia-700 dark:text-fuchsia-300 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 mb-2">
                    {group.prettyDrug}{' '}
                    <span className="text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-300 ml-1">
                      ({group.items.length} productos)
                    </span>
                  </p>
                  <ul className="space-y-1">
                    {group.items.map((it) => (
                      <li
                        key={it.product_id}
                        className="text-sm sm:text-base text-slate-700 dark:text-slate-300 flex items-start gap-2"
                      >
                        <span className="text-fuchsia-500 dark:text-fuchsia-400 flex-shrink-0">•</span>
                        <span className="min-w-0 flex-1">
                          <strong className="font-semibold text-slate-900 dark:text-slate-100">
                            {it.product_name}
                          </strong>
                          {it.quantity > 1 && (
                            <span className="text-slate-500 dark:text-slate-400 ml-1">× {it.quantity}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
