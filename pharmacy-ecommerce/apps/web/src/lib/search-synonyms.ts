// Sinónimos comunes y nombres comerciales chilenos.
const RAW_SYNONYMS: Record<string, string[]> = {
  // Analgésicos / antipiréticos
  paracetamol: ['acetaminofén', 'tapsin', 'kitadol', 'panadol', 'tylenol'],
  acetaminofen: ['paracetamol', 'tapsin', 'kitadol', 'panadol', 'tylenol'],
  tapsin: ['paracetamol', 'acetaminofén'],
  kitadol: ['paracetamol', 'acetaminofén'],
  panadol: ['paracetamol', 'acetaminofén'],
  tylenol: ['paracetamol', 'acetaminofén'],
  metamizol: ['dipirona', 'novalgina'],
  dipirona: ['metamizol', 'novalgina'],
  novalgina: ['metamizol', 'dipirona'],

  // AINEs
  ibuprofeno: ['advil', 'motrin'],
  advil: ['ibuprofeno'],
  motrin: ['ibuprofeno'],
  ketoprofeno: ['profenid'],
  diclofenaco: ['cataflam', 'voltarén'],
  voltaren: ['diclofenaco'],
  naproxeno: ['flanax', 'naprosyn'],
  flanax: ['naproxeno'],
  aspirina: ['ácido acetilsalicílico', 'aas'],
  aas: ['aspirina', 'ácido acetilsalicílico'],
  'ácido acetilsalicílico': ['aspirina', 'aas'],

  // Gástricos
  omeprazol: ['prilosec', 'losec'],
  losec: ['omeprazol'],
  esomeprazol: ['nexium'],
  lansoprazol: ['prevacid'],
  ranitidina: ['zantac'],
  domperidona: ['motilium'],
  motilium: ['domperidona'],
  metoclopramida: ['reglan', 'primperan'],
  primperan: ['metoclopramida'],

  // Antialérgicos / antihistamínicos
  loratadina: ['claritin'],
  claritin: ['loratadina'],
  cetirizina: ['zyrtec', 'alercet'],
  desloratadina: ['aerius'],
  clorfenamina: ['clorfenil'],

  // Vitaminas
  'vitamina c': ['ácido ascórbico', 'redoxon'],
  'vitamina d': ['colecalciferol'],
  'vitamina b12': ['cianocobalamina'],
  'ácido ascórbico': ['vitamina c', 'redoxon'],
  redoxon: ['vitamina c', 'ácido ascórbico'],
  colecalciferol: ['vitamina d'],

  // Anticonceptivos
  anticonceptivo: ['anticonceptiva', 'pastilla del día después'],
  'pastilla del día después': ['levonorgestrel', 'postinor'],

  // Respiratorios / tos
  ambroxol: ['mucosolvan'],
  mucosolvan: ['ambroxol'],
  bromhexina: ['bisolvon'],
  salbutamol: ['ventolin', 'aerolin'],
  ventolin: ['salbutamol'],
  'vick vaporub': ['mentol', 'alcanfor'],

  // Antibióticos
  amoxicilina: ['amoxidal'],
  azitromicina: ['zitromax'],
  ciprofloxacino: ['cipro'],
  cipro: ['ciprofloxacino'],

  // Endocrino / diabetes
  metformina: ['glucophage'],
  glibenclamida: ['daonil'],
  levotiroxina: ['eutirox', 'synthroid'],
  eutirox: ['levotiroxina'],

  // Cardiovasculares
  losartán: ['losartan', 'cozaar'],
  losartan: ['losartán', 'cozaar'],
  enalapril: ['renitec'],
  atenolol: ['tenormin'],
  propranolol: ['inderal'],
  amlodipino: ['norvasc'],
  atorvastatina: ['lipitor'],
  simvastatina: ['zocor'],
  furosemida: ['lasix'],
  hidroclorotiazida: ['diural'],

  // Corticoides
  prednisona: ['meticorten'],

  // Ansiolíticos / benzodiazepinas
  lorazepam: ['ativan'],
  ativan: ['lorazepam'],
  clonazepam: ['ravotril', 'klonopin'],
  ravotril: ['clonazepam'],
  bromazepam: ['transilium', 'lexotanil'],
  transilium: ['bromazepam'],
  alprazolam: ['xanax'],
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
