// Sinónimos comunes y nombres comerciales chilenos.
const RAW_SYNONYMS: Record<string, string[]> = {
  paracetamol: ['acetaminofén', 'tapsin', 'kitadol', 'panadol'],
  acetaminofen: ['paracetamol', 'tapsin', 'kitadol', 'panadol'],
  tapsin: ['paracetamol', 'acetaminofén'],
  kitadol: ['paracetamol', 'acetaminofén'],
  panadol: ['paracetamol', 'acetaminofén'],
  ibuprofeno: ['advil', 'motrin'],
  advil: ['ibuprofeno'],
  motrin: ['ibuprofeno'],
  ketoprofeno: ['profenid'],
  diclofenaco: ['cataflam', 'voltarén'],
  aspirina: ['ácido acetilsalicílico', 'aas'],
  aas: ['aspirina', 'ácido acetilsalicílico'],

  omeprazol: ['prilosec'],
  ranitidina: ['zantac'],
  domperidona: ['motilium'],

  loratadina: ['claritin'],
  cetirizina: ['zyrtec', 'alercet'],
  desloratadina: ['aerius'],
  clorfenamina: ['clorfenil'],

  'vitamina c': ['ácido ascórbico', 'redoxon'],
  'vitamina d': ['colecalciferol'],
  'vitamina b12': ['cianocobalamina'],
  'ácido ascórbico': ['vitamina c'],
  colecalciferol: ['vitamina d'],

  anticonceptivo: ['anticonceptiva', 'pastilla del día después'],
  'pastilla del día después': ['levonorgestrel', 'postinor'],

  ambroxol: ['mucosolvan'],
  bromhexina: ['bisolvon'],

  amoxicilina: ['amoxidal'],
  azitromicina: ['zitromax'],

  metformina: ['glucophage'],

  losartán: ['losartan'],
  losartan: ['losartán'],
  enalapril: ['renitec'],
  atorvastatina: ['lipitor'],
};

const COMBINING = /[̀-ͯ]/g;

function foldAccents(s: string): string {
  return s.normalize('NFD').replace(COMBINING, '');
}

// Devuelve variantes (lowercased) a buscar para un término dado.
// Máximo 6 para no abusar de la DB.
export function expandQuery(q: string): string[] {
  const lq = q.toLowerCase().trim();
  if (!lq) return [];
  const variants = new Set<string>([lq]);

  const folded = foldAccents(lq);
  if (folded !== lq) variants.add(folded);

  for (const k of [lq, folded]) {
    const syns = RAW_SYNONYMS[k];
    if (syns) for (const s of syns) variants.add(s.toLowerCase());
  }

  if (lq.length > 3 && lq.endsWith('s')) variants.add(lq.slice(0, -1));

  return Array.from(variants).slice(0, 6);
}
