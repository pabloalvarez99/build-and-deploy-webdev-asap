'use client';

/**
 * ProfessionalInfo — Prospecto profesional por principio activo.
 *
 * Pensado para adultos mayores en móvil:
 *  - Tipografía escalable (3 niveles, persiste en localStorage)
 *  - Lectura en voz alta (Web Speech API, es-CL) por sección
 *  - Expandir/Colapsar todo, Imprimir A4, Compartir (Web Share → WhatsApp)
 *  - Auto-detección Beers → banner de alerta destacado
 *  - Print CSS scoped: oculta nav/toolbar, expande todo, A4 portrait
 *
 * Lookup automático desde `active_ingredient` con `lib/drug-info.ts`.
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
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
  Volume2,
  Square,
  Printer,
  Share2,
  ZoomIn,
  ZoomOut,
  ChevronsUpDown,
  ChevronsDownUp,
  ShieldAlert,
} from 'lucide-react';
import { lookupDrugInfo, prettifyDrugName, type DrugInfo } from '@/lib/drug-info';
import { useSpeech } from '@/hooks/useSpeech';

interface Section {
  key: keyof DrugInfo;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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

type FontScale = 'lg' | 'xl' | 'xxl';
const SCALE_FONT: Record<FontScale, string> = { lg: '1rem', xl: '1.2rem', xxl: '1.4rem' };
const SCALE_LABEL: Record<FontScale, string> = { lg: 'A', xl: 'A+', xxl: 'A++' };
const FONT_KEY = 'tf:prof-info:font';

function useFontScale() {
  const [scale, setScale] = useState<FontScale>('lg');

  useEffect(() => {
    try {
      const v = localStorage.getItem(FONT_KEY) as FontScale | null;
      if (v && v in SCALE_FONT) setScale(v);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const update = useCallback((next: FontScale) => {
    setScale(next);
    try { localStorage.setItem(FONT_KEY, next); } catch { /* ignore */ }
  }, []);

  const inc = useCallback(() => {
    setScale((cur) => {
      const next: FontScale = cur === 'lg' ? 'xl' : 'xxl';
      try { localStorage.setItem(FONT_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const dec = useCallback(() => {
    setScale((cur) => {
      const next: FontScale = cur === 'xxl' ? 'xl' : 'lg';
      try { localStorage.setItem(FONT_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { scale, inc, dec, set: update, canInc: scale !== 'xxl', canDec: scale !== 'lg' };
}

function isBeersWarning(text: string | undefined): boolean {
  if (!text) return false;
  return /\bEVITAR\b|\bBeers\b|alto riesgo|riesgo alto|inapropiado/i.test(text);
}

function DrugBlock({
  name,
  info,
  open,
  onToggle,
  speakingId,
  onSpeak,
  onStop,
  ttsSupported,
}: {
  name: string;
  info: DrugInfo;
  open: boolean;
  onToggle: () => void;
  speakingId: string | null;
  onSpeak: (id: string, text: string) => void;
  onStop: () => void;
  ttsSupported: boolean;
}) {
  const pretty = prettifyDrugName(name);
  const beers = isBeersWarning(info.precauciones_adulto_mayor);

  return (
    <div className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 bg-gradient-to-r from-cyan-50 to-emerald-50 dark:from-cyan-900/20 dark:to-emerald-900/20 hover:from-cyan-100 hover:to-emerald-100 dark:hover:from-cyan-900/30 dark:hover:to-emerald-900/30 transition-colors"
        aria-expanded={open}
        aria-controls={`drug-${name}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 flex-shrink-0">
            <BookOpen className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[0.75em] uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">Principio activo</p>
            <p className="text-[1.15em] sm:text-[1.25em] font-bold text-slate-900 dark:text-slate-100 truncate">{pretty}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {beers && (
            <span
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[0.7em] font-bold uppercase tracking-wide"
              aria-label="Atención adulto mayor"
            >
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
              Beers
            </span>
          )}
          <ChevronDown
            className={`w-6 h-6 text-slate-500 dark:text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </div>
      </button>

      {open && (
        <div id={`drug-${name}`}>
          {beers && (
            <div className="mx-4 sm:mx-5 mt-4 flex items-start gap-3 p-3 rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30">
              <ShieldAlert className="w-6 h-6 text-red-700 dark:text-red-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-[0.95em] text-red-900 dark:text-red-100 leading-snug">
                <strong>Atención adulto mayor:</strong> este principio activo tiene precauciones especiales según criterios Beers.
                Consulte siempre con su médico antes de usarlo.
              </p>
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {SECTIONS.map(({ key, label, icon: Icon, tone }) => {
              const value = info[key];
              if (!value) return null;
              const sid = `${name}:${key}`;
              const isSpeaking = speakingId === sid;
              return (
                <div key={key} className="px-4 sm:px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${tone}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-[1em] sm:text-[1.1em] font-bold text-slate-900 dark:text-slate-100">
                          {label}
                        </h4>
                        {ttsSupported && (
                          <button
                            type="button"
                            onClick={() => (isSpeaking ? onStop() : onSpeak(sid, `${label}. ${value}`))}
                            aria-label={isSpeaking ? `Detener lectura de ${label}` : `Escuchar ${label} en voz alta`}
                            aria-pressed={isSpeaking}
                            className="no-print min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-900/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 transition-colors flex-shrink-0"
                          >
                            {isSpeaking ? (
                              <Square className="w-5 h-5 fill-current" aria-hidden="true" />
                            ) : (
                              <Volume2 className="w-5 h-5" aria-hidden="true" />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-[1em] sm:text-[1.1em] text-slate-700 dark:text-slate-300 leading-relaxed">
                        {value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
  const { scale, inc, dec, canInc, canDec } = useFontScale();
  const { supported: ttsSupported, speakingId, speak, stop } = useSpeech();

  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(results.slice(0, 1).map((r) => r.name)));

  useEffect(() => {
    setOpenIds(new Set(results.slice(0, 1).map((r) => r.name)));
  }, [activeIngredient]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback((name: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setOpenIds(new Set(results.map((r) => r.name)));
  }, [results]);

  const collapseAll = useCallback(() => {
    setOpenIds(new Set());
  }, []);

  const handlePrint = useCallback(() => {
    stop();
    setOpenIds(new Set(results.map((r) => r.name)));
    if (typeof document === 'undefined') return;
    document.body.classList.add('printing-prof-info');
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove('printing-prof-info'), 400);
    }, 80);
  }, [results, stop]);

  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const first = results[0]?.name ? prettifyDrugName(results[0].name) : '';
    const text = `Información profesional de ${first} — Tu Farmacia: ${url}`;
    const nav = window.navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title: `Tu Farmacia — ${first}`, text, url });
        return;
      } catch {
        // user cancelled or failed → fallback
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }, [results]);

  if (results.length === 0) return null;

  const allOpen = openIds.size === results.length;

  return (
    <section
      id="prof-info-print"
      aria-labelledby="info-prof-title"
      className="mt-8 sm:mt-10 rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-6"
      style={{ fontSize: SCALE_FONT[scale] }}
    >
      <header className="mb-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 rounded-2xl bg-cyan-600 text-white flex-shrink-0">
            <Stethoscope className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="info-prof-title" className="text-[1.5em] sm:text-[1.75em] font-black text-slate-900 dark:text-slate-100 leading-tight">
              Información profesional
            </h2>
            <p className="text-[0.875em] text-slate-500 dark:text-slate-400">
              Datos clínicos del principio activo
            </p>
          </div>
        </div>

        <div
          role="note"
          className="flex items-start gap-3 p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30"
        >
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-[1em] sm:text-[1.05em] text-amber-900 dark:text-amber-100 leading-snug">
            <p className="font-bold mb-1">Información referencial</p>
            <p>
              Esta información no reemplaza la consulta con su médico o farmacéutico.
              Antes de iniciar, modificar o suspender un tratamiento, consulte siempre con un profesional de la salud.
              En caso de duda, llame a nuestra farmacia o use el chat de WhatsApp.
            </p>
          </div>
        </div>

        <div
          role="toolbar"
          aria-label="Herramientas de información profesional"
          className="no-print mt-4 flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={dec}
              disabled={!canDec}
              aria-label="Reducir tamaño de letra"
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomOut className="w-5 h-5" aria-hidden="true" />
            </button>
            <span
              aria-live="polite"
              aria-label={`Tamaño de letra ${SCALE_LABEL[scale]}`}
              className="px-2 text-[0.95em] font-bold text-slate-700 dark:text-slate-200 tabular-nums select-none min-w-[2.5em] text-center"
            >
              {SCALE_LABEL[scale]}
            </span>
            <button
              type="button"
              onClick={inc}
              disabled={!canInc}
              aria-label="Aumentar tamaño de letra"
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomIn className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={allOpen ? collapseAll : expandAll}
            aria-label={allOpen ? 'Colapsar todas las secciones' : 'Expandir todas las secciones'}
            className="min-h-[44px] inline-flex items-center gap-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[0.9em] font-semibold transition-colors"
          >
            {allOpen ? (
              <ChevronsDownUp className="w-5 h-5" aria-hidden="true" />
            ) : (
              <ChevronsUpDown className="w-5 h-5" aria-hidden="true" />
            )}
            <span>{allOpen ? 'Colapsar' : 'Expandir'} todo</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            aria-label="Imprimir información profesional"
            className="min-h-[44px] inline-flex items-center gap-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[0.9em] font-semibold transition-colors"
          >
            <Printer className="w-5 h-5" aria-hidden="true" />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Compartir esta información"
            className="min-h-[44px] inline-flex items-center gap-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[0.9em] font-semibold transition-colors"
          >
            <Share2 className="w-5 h-5" aria-hidden="true" />
            <span>Compartir</span>
          </button>

          {ttsSupported && speakingId && (
            <button
              type="button"
              onClick={stop}
              aria-label="Detener lectura en voz alta"
              className="min-h-[44px] inline-flex items-center gap-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[0.9em] font-semibold transition-colors ml-auto"
            >
              <Square className="w-5 h-5 fill-current" aria-hidden="true" />
              <span>Detener lectura</span>
            </button>
          )}
        </div>
      </header>

      <div className="space-y-3">
        {results.map((r) => (
          <DrugBlock
            key={r.name}
            name={r.name}
            info={r.info}
            open={openIds.has(r.name)}
            onToggle={() => toggle(r.name)}
            speakingId={speakingId}
            onSpeak={speak}
            onStop={stop}
            ttsSupported={ttsSupported}
          />
        ))}
      </div>

      <footer className="mt-5 text-[0.875em] text-slate-500 dark:text-slate-400 leading-relaxed">
        <p>
          Fuente: Formulario Nacional de Medicamentos (ISP Chile), Vademécum Chileno y criterios Beers
          de prescripción en adulto mayor. Última revisión por nuestro equipo farmacéutico.
        </p>
      </footer>
    </section>
  );
}
