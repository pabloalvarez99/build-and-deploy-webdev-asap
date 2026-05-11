'use client';

/**
 * ProductFAQ — Preguntas frecuentes generadas a partir de la info de KB.
 * Solo muestra preguntas con respuesta sustantiva (cuando hay datos en KB).
 */

import { useState, useMemo } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { lookupDrugInfo, prettifyDrugName, type DrugInfo } from '@/lib/drug-info';

interface FAQ {
  q: string;
  a: string;
}

function buildFAQs(name: string, info: DrugInfo): FAQ[] {
  const pretty = prettifyDrugName(name);
  const faqs: FAQ[] = [];

  if (info.consejos_uso) {
    faqs.push({ q: `¿Cómo debo tomar ${pretty}?`, a: info.consejos_uso });
  }
  if (info.posologia) {
    faqs.push({ q: '¿Cuál es la dosis habitual?', a: `${info.posologia} Siempre seguir indicación de su médico.` });
  }
  if (info.signos_alarma) {
    faqs.push({ q: '¿Cuándo debo consultar de urgencia?', a: info.signos_alarma });
  }
  if (info.interacciones) {
    faqs.push({ q: '¿Con qué medicamentos no se puede combinar?', a: info.interacciones });
  }
  if (info.embarazo) {
    faqs.push({ q: '¿Es seguro durante el embarazo?', a: info.embarazo });
  }
  if (info.lactancia) {
    faqs.push({ q: '¿Es seguro durante la lactancia?', a: info.lactancia });
  }
  if (info.precauciones_adulto_mayor) {
    faqs.push({ q: '¿Es seguro en adultos mayores de 65 años?', a: info.precauciones_adulto_mayor });
  }
  if (info.conservacion) {
    faqs.push({ q: '¿Cómo debo conservarlo?', a: info.conservacion });
  }

  faqs.push({
    q: '¿Qué hago si olvido una dosis?',
    a: 'Tómela apenas la recuerde. Si está cerca de la próxima toma, omita la dosis olvidada y siga con su horario normal. No tome dosis doble para compensar. En caso de duda consulte con su médico o farmacéutico.',
  });

  return faqs;
}

export default function ProductFAQ({
  activeIngredient,
}: {
  activeIngredient: string | null | undefined;
}) {
  const results = useMemo(() => lookupDrugInfo(activeIngredient), [activeIngredient]);
  const faqs = useMemo(() => {
    if (results.length === 0) return [] as FAQ[];
    const first = results[0];
    return buildFAQs(first.name, first.info);
  }, [results]);

  const [open, setOpen] = useState<Set<number>>(new Set([0]));

  if (faqs.length === 0) return null;

  const toggle = (i: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <section
      aria-labelledby="faq-title"
      className="mt-8 rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-2xl bg-emerald-600 text-white">
          <HelpCircle className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 id="faq-title" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
          Preguntas frecuentes
        </h2>
      </div>

      <div className="space-y-2">
        {faqs.map((f, i) => {
          const isOpen = open.has(i);
          return (
            <div
              key={i}
              className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden"
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors min-h-[56px]"
              >
                <span itemProp="name" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {f.q}
                </span>
                <ChevronDown
                  className={`w-6 h-6 text-slate-500 dark:text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div
                  id={`faq-${i}`}
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                  className="px-4 sm:px-5 py-4 bg-white dark:bg-slate-800"
                >
                  <p itemProp="text" className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                    {f.a}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
