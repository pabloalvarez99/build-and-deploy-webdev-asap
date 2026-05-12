// Utilidades comunes para parsers de factura/pedido.

/** Parsea CLP en formato chileno ("$ 1.234.567" o "1.234.567") → entero. */
export function parseCLP(raw: string): number {
  return parseInt(raw.replace(/[^\d-]/g, ''), 10);
}

/** Normaliza RUT chileno: quita puntos, conserva guión y DV. Devuelve null si no parece RUT. */
export function normalizeRut(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\dkK\-]/g, '').toUpperCase();
  // RUT válido: 7-9 dígitos + guion + DV (0-9 o K)
  if (!/^\d{7,9}-?[\dK]$/.test(cleaned)) return null;
  // Asegurar guión
  if (!cleaned.includes('-')) {
    return cleaned.slice(0, -1) + '-' + cleaned.slice(-1);
  }
  return cleaned;
}

/** Convierte "MM-YYYY" en último día ISO de ese mes ("12-2027" → "2027-12-31"). */
export function monthYearToIsoEndOfMonth(mmYYYY: string): string | null {
  const m = mmYYYY.match(/^(\d{1,2})-(\d{4})$/);
  if (!m) return null;
  const month = parseInt(m[1], 10);
  const year = parseInt(m[2], 10);
  if (month < 1 || month > 12 || year < 2000 || year > 2100) return null;
  // Último día del mes
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

/** Convierte "DD-MM-YYYY" o "DD/MM/YYYY" → "YYYY-MM-DD". */
export function ddmmyyyyToIso(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})/);
  if (!m) return null;
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return null;
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

/** Convierte "YYYY-MM-DD HH:mm:ss" (Global) → "YYYY-MM-DD". */
export function timestampToIsoDate(raw: string): string | null {
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
