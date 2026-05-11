/**
 * drug-interactions.ts — Verificador de interacciones medicamentosas
 * críticas entre principios activos presentes en el carrito.
 *
 * Reglas curadas para uso ambulatorio chileno, con foco en adulto mayor
 * (criterios Beers). Fuente: Vademécum Chileno, FNM ISP, Beers Criteria
 * 2023. Las reglas son referenciales; NO sustituyen criterio médico.
 *
 * Estrategia:
 *   - GRUPOS (AINE, ANTICOAGULANTE, IBP, IECA, ARA2, ISRS, NITRATO,
 *     BENZODIAZEPINA, ESTATINA_3A4, MACROLIDO_3A4) se expanden a sus
 *     miembros en module-load.
 *   - RULES define pares (grupo|fármaco) × (grupo|fármaco) con severidad.
 *   - PAIR_MAP cachea todas las combinaciones expandidas, con dedup por
 *     severidad mayor.
 *   - `checkInteractions(activeIngredients[])` tokeniza vía drug-info y
 *     devuelve pares matched ordenados por severidad (crítica primero).
 */

import { tokenizeIngredients } from './drug-info';

export type Severity = 'critica' | 'mayor' | 'moderada';

export interface InteractionDetail {
  severity: Severity;
  /** Par canónico ordenado alfabéticamente */
  drugs: [string, string];
  effect: string;
  recommendation: string;
}

const GROUPS: Record<string, string[]> = {
  AINE: [
    'IBUPROFENO', 'KETOPROFENO', 'NAPROXENO', 'DICLOFENACO', 'PIROXICAM',
    'MELOXICAM', 'ACIDO MEFENAMICO', 'CELECOXIB', 'ETORICOXIB', 'NIMESULIDA',
    'KETOROLACO', 'TENOXICAM', 'INDOMETACINA',
  ],
  ANTICOAGULANTE: [
    'WARFARINA', 'ACENOCUMAROL', 'RIVAROXABAN', 'DABIGATRAN', 'APIXABAN', 'EDOXABAN',
  ],
  IBP: ['OMEPRAZOL', 'ESOMEPRAZOL', 'LANSOPRAZOL', 'PANTOPRAZOL', 'RABEPRAZOL'],
  BENZODIAZEPINA: ['ALPRAZOLAM', 'CLONAZEPAM', 'DIAZEPAM', 'LORAZEPAM', 'BROMAZEPAM', 'MIDAZOLAM'],
  IECA: ['ENALAPRIL', 'CAPTOPRIL', 'LISINOPRIL', 'RAMIPRIL'],
  ARA2: ['LOSARTAN', 'VALSARTAN', 'IRBESARTAN', 'CANDESARTAN', 'TELMISARTAN'],
  ISRS: ['SERTRALINA', 'FLUOXETINA', 'PAROXETINA', 'CITALOPRAM', 'ESCITALOPRAM'],
  NITRATO: ['ISOSORBIDA', 'DINITRATO DE ISOSORBIDA', 'MONONITRATO DE ISOSORBIDA', 'NITROGLICERINA'],
  ESTATINA_3A4: ['ATORVASTATINA', 'SIMVASTATINA', 'LOVASTATINA'],
  MACROLIDO_3A4: ['CLARITROMICINA', 'ERITROMICINA'],
  PDE5: ['SILDENAFIL', 'TADALAFIL', 'VARDENAFIL'],
  HIPOGLICEMIANTE: ['GLIBENCLAMIDA', 'GLICLAZIDA', 'GLIMEPIRIDA', 'METFORMINA', 'INSULINA'],
};

interface Rule {
  /** Grupo o fármaco canónico (en MAYÚSCULAS, sin tildes ni dosis) */
  a: string;
  b: string;
  severity: Severity;
  effect: string;
  recommendation: string;
  /** Pares específicos a excluir de la expansión (ej. clopidogrel+pantoprazol OK) */
  exclude?: Array<[string, string]>;
}

const RULES: Rule[] = [
  // Anticoagulantes
  {
    a: 'ANTICOAGULANTE', b: 'AINE', severity: 'critica',
    effect:
      'Riesgo alto de sangrado mayor (gastrointestinal, intracraneal). El AINE inhibe la agregación plaquetaria, irrita la mucosa gástrica y desplaza al anticoagulante de sus proteínas plasmáticas.',
    recommendation:
      'Evite la combinación. Use paracetamol como analgésico de primera línea (máximo 3 g/día en adulto mayor).',
  },
  {
    a: 'WARFARINA', b: 'PARACETAMOL', severity: 'moderada',
    effect: 'Dosis altas o uso prolongado (>2 g/día por varios días) pueden aumentar el INR.',
    recommendation: 'Limite a dosis ocasionales (≤2 g/día). Controle INR si necesita uso regular.',
  },
  {
    a: 'WARFARINA', b: 'AMIODARONA', severity: 'mayor',
    effect: 'Aumento marcado del INR y riesgo de sangrado.',
    recommendation: 'Reduzca la dosis de warfarina en 30-50%. Control de INR semanal hasta estabilizar.',
  },
  {
    a: 'WARFARINA', b: 'CIPROFLOXACINO', severity: 'mayor',
    effect: 'Aumento del INR por inhibición del metabolismo hepático.',
    recommendation: 'Control de INR a los 3-5 días de iniciar el antibiótico.',
  },
  {
    a: 'WARFARINA', b: 'METRONIDAZOL', severity: 'mayor',
    effect: 'Aumento marcado del INR.',
    recommendation: 'Control estrecho de INR durante y hasta 1 semana después del tratamiento.',
  },

  // Antiplaquetarios + IBP
  {
    a: 'CLOPIDOGREL', b: 'IBP', severity: 'mayor',
    effect:
      'Reducción del efecto antiplaquetario del clopidogrel por inhibición de CYP2C19, aumentando el riesgo de eventos cardiovasculares.',
    recommendation: 'Prefiera pantoprazol o famotidina si necesita protección gástrica.',
    exclude: [['CLOPIDOGREL', 'PANTOPRAZOL']],
  },

  // Levotiroxina
  {
    a: 'LEVOTIROXINA', b: 'IBP', severity: 'moderada',
    effect: 'Menor absorción de levotiroxina por aumento del pH gástrico.',
    recommendation: 'Tome la levotiroxina en ayunas y separe al menos 4 horas del IBP.',
  },
  {
    a: 'LEVOTIROXINA', b: 'CARBONATO DE CALCIO', severity: 'moderada',
    effect: 'El calcio reduce significativamente la absorción de levotiroxina.',
    recommendation: 'Separe las tomas al menos 4 horas.',
  },
  {
    a: 'LEVOTIROXINA', b: 'SULFATO FERROSO', severity: 'moderada',
    effect: 'El hierro reduce la absorción de levotiroxina.',
    recommendation: 'Separe las tomas al menos 4 horas.',
  },

  // Estatinas + macrólidos 3A4
  {
    a: 'ESTATINA_3A4', b: 'MACROLIDO_3A4', severity: 'mayor',
    effect: 'Riesgo aumentado de miopatía y rabdomiolisis (CYP3A4 ↑ niveles de estatina).',
    recommendation: 'Suspenda la estatina durante el tratamiento antibiótico, o use azitromicina.',
  },
  {
    a: 'SIMVASTATINA', b: 'CLARITROMICINA', severity: 'critica',
    effect: 'Riesgo grave de rabdomiolisis (combinación contraindicada).',
    recommendation: 'No combinar. Reemplace claritromicina por azitromicina o suspenda simvastatina temporalmente.',
  },

  // IECA / ARA2 + espironolactona, AINE, litio
  {
    a: 'IECA', b: 'ESPIRONOLACTONA', severity: 'mayor',
    effect: 'Riesgo de hiperpotasemia (K sanguíneo elevado, arritmias).',
    recommendation: 'Control de potasio cada 1-3 meses. Evite suplementos de potasio y sustitutos de sal con K.',
  },
  {
    a: 'ARA2', b: 'ESPIRONOLACTONA', severity: 'mayor',
    effect: 'Hiperpotasemia.',
    recommendation: 'Control de potasio. Evite suplementos de potasio.',
  },
  {
    a: 'IECA', b: 'AINE', severity: 'mayor',
    effect: 'Reducción del efecto antihipertensivo y riesgo de daño renal agudo, sobre todo en adulto mayor.',
    recommendation: 'Evite AINEs de uso crónico. Use paracetamol.',
  },
  {
    a: 'ARA2', b: 'AINE', severity: 'mayor',
    effect: 'Reducción del efecto antihipertensivo + nefrotoxicidad.',
    recommendation: 'Evite AINEs de uso crónico.',
  },
  {
    a: 'LITIO', b: 'AINE', severity: 'mayor',
    effect: 'Aumento de niveles séricos de litio (toxicidad: temblor, confusión, ataxia).',
    recommendation: 'Evite AINEs crónicos. Si imprescindible, control de litemia frecuente.',
  },
  {
    a: 'LITIO', b: 'IECA', severity: 'mayor',
    effect: 'Aumento de niveles séricos de litio.',
    recommendation: 'Control de litemia al inicio y tras cambios de dosis.',
  },

  // ISRS / antidepresivos
  {
    a: 'ISRS', b: 'TRAMADOL', severity: 'mayor',
    effect: 'Riesgo de síndrome serotoninérgico (agitación, sudoración, hipertermia, hiperreflexia).',
    recommendation: 'Evitar la combinación. Si imprescindible, vigilancia estrecha y dosis baja de tramadol.',
  },
  {
    a: 'ISRS', b: 'AINE', severity: 'moderada',
    effect: 'Aumento del riesgo de sangrado gastrointestinal, especialmente en adulto mayor.',
    recommendation: 'Considere protección gástrica (pantoprazol/famotidina) o prefiera paracetamol.',
  },

  // Digoxina
  {
    a: 'DIGOXINA', b: 'AMIODARONA', severity: 'mayor',
    effect: 'Aumento de niveles de digoxina con toxicidad (náuseas, arritmias, alteraciones visuales).',
    recommendation: 'Reduzca la dosis de digoxina ~50%. Control de digoxinemia y ECG.',
  },
  {
    a: 'DIGOXINA', b: 'FUROSEMIDA', severity: 'moderada',
    effect: 'La hipopotasemia inducida por furosemida potencia la toxicidad digital.',
    recommendation: 'Controle potasio y magnesio. Suplemente si es necesario.',
  },
  {
    a: 'DIGOXINA', b: 'CLARITROMICINA', severity: 'mayor',
    effect: 'Aumento significativo de niveles de digoxina.',
    recommendation: 'Control de digoxinemia. Reducir dosis si es necesario.',
  },

  // Metotrexato
  {
    a: 'METOTREXATO', b: 'AINE', severity: 'critica',
    effect: 'Toxicidad grave del metotrexato (mielosupresión, hepatotoxicidad, mucositis).',
    recommendation: 'Evite la combinación. Use paracetamol como analgésico.',
  },
  {
    a: 'METOTREXATO', b: 'COTRIMOXAZOL', severity: 'critica',
    effect: 'Aumento de toxicidad hematológica (efecto antifolato sumado).',
    recommendation: 'Evite. Use otro antibiótico.',
  },

  // PDE5 + nitratos
  {
    a: 'PDE5', b: 'NITRATO', severity: 'critica',
    effect: 'Hipotensión severa potencialmente mortal.',
    recommendation: 'COMBINACIÓN CONTRAINDICADA. No use sildenafil/tadalafil/vardenafil con ningún nitrato.',
  },

  // Metformina
  {
    a: 'METFORMINA', b: 'CONTRASTE YODADO', severity: 'mayor',
    effect: 'Riesgo de acidosis láctica si hay insuficiencia renal.',
    recommendation: 'Suspenda metformina 48 horas antes y después del contraste. Reanude tras función renal normal.',
  },

  // Benzodiazepinas (Beers — adulto mayor)
  {
    a: 'BENZODIAZEPINA', b: 'BENZODIAZEPINA', severity: 'mayor',
    effect: 'Sedación excesiva, depresión respiratoria, deterioro cognitivo y riesgo alto de caídas (criterios Beers).',
    recommendation: 'No combine dos benzodiazepinas en adulto mayor. Considere alternativas no benzodiazepínicas.',
  },
  {
    a: 'BENZODIAZEPINA', b: 'TRAMADOL', severity: 'mayor',
    effect: 'Depresión del sistema nervioso central y respiratoria.',
    recommendation: 'Evite en adulto mayor. Si imprescindible, dosis bajas y vigilancia.',
  },
  {
    a: 'BENZODIAZEPINA', b: 'CODEINA', severity: 'mayor',
    effect: 'Depresión respiratoria, especialmente en adulto mayor o EPOC.',
    recommendation: 'Evite la combinación.',
  },
  {
    a: 'BENZODIAZEPINA', b: 'ZOPICLONA', severity: 'mayor',
    effect: 'Sedación profunda + caídas.',
    recommendation: 'No usar juntos.',
  },

  // Hipoglicemiantes + alcohol/AINE (riesgo hipoglicemia)
  {
    a: 'HIPOGLICEMIANTE', b: 'PROPRANOLOL', severity: 'moderada',
    effect: 'El betabloqueador puede enmascarar síntomas de hipoglicemia (taquicardia, temblor).',
    recommendation: 'Vigile glicemia. Prefiera bisoprolol/atenolol si requiere betabloqueador.',
  },

  // Anticolinérgicos (Beers)
  {
    a: 'AMITRIPTILINA', b: 'OXIBUTININA', severity: 'mayor',
    effect: 'Carga anticolinérgica sumada: confusión, retención urinaria, constipación, caídas (Beers).',
    recommendation: 'Evite combinación en adulto mayor.',
  },
];

function severityRank(s: Severity): number {
  return s === 'critica' ? 3 : s === 'mayor' ? 2 : 1;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function expand(name: string): string[] {
  return GROUPS[name] ?? [name];
}

const PAIR_MAP: Map<string, InteractionDetail> = (() => {
  const map = new Map<string, InteractionDetail>();
  for (const rule of RULES) {
    const as = expand(rule.a);
    const bs = expand(rule.b);
    for (const a of as) {
      for (const b of bs) {
        if (a === b) continue;
        const k = pairKey(a, b);
        if (rule.exclude?.some(([x, y]) => pairKey(x, y) === k)) continue;
        const existing = map.get(k);
        if (existing && severityRank(existing.severity) >= severityRank(rule.severity)) continue;
        const sorted: [string, string] = a < b ? [a, b] : [b, a];
        map.set(k, {
          severity: rule.severity,
          drugs: sorted,
          effect: rule.effect,
          recommendation: rule.recommendation,
        });
      }
    }
  }
  return map;
})();

/**
 * Verifica interacciones entre los principios activos provistos.
 * Tokeniza cada string usando `tokenizeIngredients` (drug-info), genera
 * todos los pares únicos y consulta PAIR_MAP. Devuelve ordenado por
 * severidad descendente (críticas primero).
 */
export function checkInteractions(
  activeIngredients: Array<string | null | undefined>,
): InteractionDetail[] {
  const drugs = new Set<string>();
  for (const ing of activeIngredients) {
    for (const t of tokenizeIngredients(ing)) drugs.add(t);
  }
  const arr = Array.from(drugs);
  const out: InteractionDetail[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const k = pairKey(arr[i], arr[j]);
      if (seen.has(k)) continue;
      const hit = PAIR_MAP.get(k);
      if (hit) {
        out.push(hit);
        seen.add(k);
      }
    }
  }
  out.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  return out;
}
