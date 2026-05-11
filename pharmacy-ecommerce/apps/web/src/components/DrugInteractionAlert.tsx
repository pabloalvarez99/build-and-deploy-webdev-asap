'use client';

/**
 * DrugInteractionAlert — Banner accesible que lista interacciones
 * detectadas entre principios activos del carrito. Pensado para adulto
 * mayor: tipografía grande, semáforo de severidad (crítica/mayor/moderada),
 * efecto + recomendación por par, colapsable.
 */

import { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { prettifyDrugName } from '@/lib/drug-info';
import type { InteractionDetail, Severity } from '@/lib/drug-interactions';

const SEVERITY_CONF: Record<
  Severity,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    border: string;
    text: string;
    accentBg: string;
    accentText: string;
  }
> = {
  critica: {
    label: 'Crítica',
    icon: ShieldAlert,
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-900 dark:text-red-100',
    accentBg: 'bg-red-100 dark:bg-red-900/50',
    accentText: 'text-red-700 dark:text-red-300',
  },
  mayor: {
    label: 'Mayor',
    icon: AlertTriangle,
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    border: 'border-orange-300 dark:border-orange-700',
    text: 'text-orange-900 dark:text-orange-100',
    accentBg: 'bg-orange-100 dark:bg-orange-900/50',
    accentText: 'text-orange-700 dark:text-orange-300',
  },
  moderada: {
    label: 'Moderada',
    icon: AlertCircle,
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-900 dark:text-amber-100',
    accentBg: 'bg-amber-100 dark:bg-amber-900/50',
    accentText: 'text-amber-700 dark:text-amber-300',
  },
};

export default function DrugInteractionAlert({
  interactions,
}: {
  interactions: InteractionDetail[];
}) {
  const [open, setOpen] = useState(true);

  if (interactions.length === 0) return null;

  const top = interactions[0].severity;
  const conf = SEVERITY_CONF[top];
  const TopIcon = conf.icon;
  const count = interactions.length;

  const counts: Record<Severity, number> = { critica: 0, mayor: 0, moderada: 0 };
  for (const it of interactions) counts[it.severity]++;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`mb-4 rounded-2xl border-2 ${conf.border} ${conf.bg} overflow-hidden`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="drug-interactions-list"
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <TopIcon className={`w-6 h-6 ${conf.text} flex-shrink-0 mt-0.5`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className={`font-bold text-lg leading-tight ${conf.text}`}>
            {count === 1
              ? '1 interacción medicamentosa detectada'
              : `${count} interacciones medicamentosas detectadas`}
          </h3>
          <p className={`text-sm mt-0.5 ${conf.text} opacity-90`}>
            Revise antes de continuar. Esta verificación es referencial — consulte siempre con su médico o farmacéutico.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(['critica', 'mayor', 'moderada'] as const).map((sev) =>
              counts[sev] > 0 ? (
                <span
                  key={sev}
                  className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${SEVERITY_CONF[sev].accentBg} ${SEVERITY_CONF[sev].accentText}`}
                >
                  {counts[sev]} {SEVERITY_CONF[sev].label}
                </span>
              ) : null,
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-6 h-6 ${conf.text} flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul id="drug-interactions-list" className="divide-y divide-slate-200 dark:divide-slate-700">
          {interactions.map((it, i) => {
            const c = SEVERITY_CONF[it.severity];
            const Icon = c.icon;
            return (
              <li key={`${it.drugs[0]}|${it.drugs[1]}|${i}`} className="px-4 py-4 bg-white dark:bg-slate-800">
                <div className="flex items-start gap-3">
                  <Icon
                    className={`w-5 h-5 ${c.accentText} flex-shrink-0 mt-0.5`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-2">
                      <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                        {prettifyDrugName(it.drugs[0])} + {prettifyDrugName(it.drugs[1])}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${c.accentBg} ${c.accentText}`}
                      >
                        {c.label}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-1.5">
                      <strong className="font-semibold text-slate-900 dark:text-slate-100">Efecto:</strong>{' '}
                      {it.effect}
                    </p>
                    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong className="font-semibold text-slate-900 dark:text-slate-100">Recomendación:</strong>{' '}
                      {it.recommendation}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
