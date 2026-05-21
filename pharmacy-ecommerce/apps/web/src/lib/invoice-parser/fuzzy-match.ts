// Token-based fuzzy match para líneas de factura sin supplier_product_code
// (Mediven SII no entrega código interno → cada línea es nombre libre).
//
// Algoritmo: tokenizar nombre invoice + nombre producto, contar intersección
// y normalizar por max(len). `confident` = inter≥2 o score≥0.6.
//
// Misma lógica que /api/admin/purchase-orders/[id]/suggest-matches (extraída
// acá para reusar desde /scan).

const STOPWORDS = new Set([
  'MG', 'ML', 'GR', 'COMP', 'CAPS', 'CAP', 'TAB', 'BE', 'CNP', 'DM', 'RT',
  'COM', 'COMPR', 'COMPRIMIDOS', 'CAPSULAS', 'CAPSULA', 'X', 'POR', 'CON', 'SIN',
  'DE', 'LA', 'EL', 'Y', 'A', 'LP', 'REC', 'ENT', 'JBE', 'SOL', 'CR', 'UNG',
]);

export function tokens(s: string): string[] {
  return s
    .toUpperCase()
    .replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

export interface ProductForMatching {
  id: string;
  name: string;
  stock: number;
}

export interface FuzzyCandidate {
  product_id: string;
  product_name: string;
  product_stock: number;
  score: number;
  inter: number;
  confident: boolean;
}

export interface PreTokenized extends ProductForMatching {
  toks: string[];
}

export function preTokenize(products: ProductForMatching[]): PreTokenized[] {
  return products.map((p) => ({ ...p, toks: tokens(p.name) }));
}

/** Devuelve top N candidatos ordenados por score desc / inter desc. */
export function fuzzyMatch(
  invoiceName: string,
  productTokens: PreTokenized[],
  limit = 3,
): FuzzyCandidate[] {
  const invToks = tokens(invoiceName);
  if (invToks.length === 0) return [];

  const candidates: FuzzyCandidate[] = [];
  for (const p of productTokens) {
    const inter = invToks.filter((t) => p.toks.includes(t)).length;
    if (inter === 0) continue;
    const score = inter / Math.max(invToks.length, p.toks.length);
    candidates.push({
      product_id: p.id,
      product_name: p.name,
      product_stock: p.stock,
      score,
      inter,
      confident: inter >= 2 || score >= 0.6,
    });
  }
  candidates.sort((a, b) => b.score - a.score || b.inter - a.inter);
  return candidates.slice(0, limit);
}
