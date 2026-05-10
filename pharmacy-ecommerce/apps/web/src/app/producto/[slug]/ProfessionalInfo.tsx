'use client';

/**
 * ProfessionalInfo — Sección tipo prospecto profesional con información
 * clínica completa por principio activo. Pensada para adultos mayores:
 * tipografía grande, contraste alto, secciones claras, acordeón mobile.
 *
 * Lookup automático desde `active_ingredient` con `lib/drug-info.ts`.
 */

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Beaker,
  Stethoscope,
  Clock,
  AlertCircle,
  Ban,
  Heart,
  Shuffle,
  Thermometer,
  ChevronDown,
} from 'lucide-react';
import { lookupDrugInfo, prettifyDrugName, type DrugInfo } from '@/lib/drug-info';

interface Section {
  key: keyof DrugInfo;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Color de fondo del icono (tailwind classes) */
  tone: string;
}

const SECTIONS: Section[] = [
  { key: 'categoria', label: 'Composición y categoría', icon: Beaker, tone: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  { key: 'indicaciones', label: 'Indicaciones (para qué sirve)', icon: Stethoscope, tone: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
  { key: 'posologia', label: 'Posología (cómo tomarlo)', icon: Clock, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { key: 'efectos_adversos', label: 'Efectos adversos', icon: AlertCircle, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { key: 'contraindicaciones', label: 'Contraindicaciones', icon: Ban, tone: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { key: 'precauciones_adulto_mayor', label: 'Precauciones para adulto mayor', icon: Heart, tone: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  { key: 'interacciones', label: 'Interacciones medicamentosas', icon: Shuffle, tone: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { key: 'conservacion', label: 'Conservación', icon: Thermometer, tone: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
];

function DrugBlock({ name, info, defaultOpen }: { name: string; info: DrugInfo; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const pretty = prettifyDrugName(name);

  return (
    <div className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 bg-gradient-to-r from-cyan-50 to-emerald-50 dark:from-cyan-900/20 dark:to-emerald-900/20 hover:from-cyan-100 hover:to-emerald-100 dark:hover:from-cyan-900/30 dark:hover:to-emerald-900/30 transition-colors"
        aria-expanded={open}
        aria-controls={`drug-${name}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">Principio activo</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{pretty}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-6 h-6 text-slate-500 dark:text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div id={`drug-${name}`} className="divide-y divide-slate-100 dark:divide-slate-700">
          {SECTIONS.map(({ key, label, icon: Icon, tone }) => {
            const value = info[key];
            if (!value) return null;
            return (
              <div key={key} className="px-4 sm:px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${tone}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                      {label}
                    </h4>
                    <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                      {value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProfessionalInfo({
  activeIngredient,
}: {
  activeIngredient: string | null | undefined;
}) {
  const results = useMemo(() => lookupDrugInfo(activeIngredient), [activeIngredient]);

  if (results.length === 0) return null;

  return (
    <section
      aria-labelledby="info-prof-title"
      className="mt-8 sm:mt-10 rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-6"
    >
      <header className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-2xl bg-cyan-600 text-white">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 id="info-prof-title" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              Información profesional
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Datos clínicos del principio activo
            </p>
          </div>
        </div>

        {/* Disclaimer legal prominente */}
        <div
          role="note"
          className="flex items-start gap-3 p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30"
        >
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-base sm:text-lg text-amber-900 dark:text-amber-100 leading-snug">
            <p className="font-bold mb-1">Información referencial</p>
            <p>
              Esta información no reemplaza la consulta con su médico o farmacéutico.
              Antes de iniciar, modificar o suspender un tratamiento, consulte siempre con un profesional de la salud.
              En caso de duda, llame a nuestra farmacia o use el chat de WhatsApp.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        {results.map((r, i) => (
          <DrugBlock key={r.name} name={r.name} info={r.info} defaultOpen={i === 0} />
        ))}
      </div>

      <footer className="mt-5 text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
        <p>
          Fuente: Formulario Nacional de Medicamentos (ISP Chile), Vademécum Chileno y criterios Beers
          de prescripción en adulto mayor. Última revisión por nuestro equipo farmacéutico.
        </p>
      </footer>
    </section>
  );
}
