/**
 * drug-duplicates.ts — Detector de duplicación de principios activos en
 * el carrito. Caso clásico de riesgo: paracetamol "oculto" en compuestos
 * antigripales (Tapsin, Frenadol, etc.) sumado a paracetamol puro →
 * sobredosis hepática.
 *
 * Estrategia: tokeniza `active_ingredient` de cada item vía drug-info,
 * agrupa por canonical name, devuelve los grupos con ≥2 items.
 */

import { tokenizeIngredients, prettifyDrugName } from './drug-info';
import type { CartItem } from './api';

export interface DuplicateGroup {
  /** Principio activo canónico (MAYÚSCULAS) */
  drug: string;
  /** Nombre pretty para mostrar */
  prettyDrug: string;
  /** Items del carrito que contienen este principio activo */
  items: CartItem[];
}

/**
 * Detecta principios activos que aparecen en >1 producto del carrito.
 * Útil para alertar al usuario sobre riesgo de doble dosis (frecuente
 * con paracetamol presente en antigripales).
 */
export function checkDuplicates(items: CartItem[]): DuplicateGroup[] {
  const map = new Map<string, CartItem[]>();
  for (const item of items) {
    const tokens = tokenizeIngredients(item.active_ingredient);
    const uniqueTokens = Array.from(new Set(tokens));
    for (const t of uniqueTokens) {
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(item);
    }
  }
  const groups: DuplicateGroup[] = [];
  map.forEach((itemList, drug) => {
    if (itemList.length > 1) {
      groups.push({
        drug,
        prettyDrug: prettifyDrugName(drug),
        items: itemList,
      });
    }
  });
  return groups;
}
