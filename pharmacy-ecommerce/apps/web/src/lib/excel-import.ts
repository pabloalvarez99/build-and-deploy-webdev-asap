import type { ProductWithCategory } from './api';

// ─── Excel Column Structure ───
const COL_NAMES = [
  'id', 'producto', 'laboratorio', 'departamento', 'accion_terapeutica',
  'principio_activo', 'unidades_presentacion', 'presentacion', 'receta',
  'control_legal', 'es_bioequivalente', 'registro_sanitario',
  'titular_registro', 'stock', 'precio', 'precio_por_unidad'
] as const;

export interface ExcelRow {
  id: string;
  producto: string;
  laboratorio: string;
  departamento: string;
  accion_terapeutica: string;
  principio_activo: string;
  unidades_presentacion: string;
  presentacion: string;
  receta: string;
  control_legal: string;
  es_bioequivalente: string;
  registro_sanitario: string;
  titular_registro: string;
  stock: string;
  precio: string;
  precio_por_unidad: string;
}

export interface ProductChange {
  excelRow: ExcelRow;
  dbProduct: ProductWithCategory;
  changes: string[];
  stockChange?: { old: number; new: number };
  priceChange?: { old: number; new: number };
}

export interface DiffResult {
  newProducts: ExcelRow[];
  updatedProducts: ProductChange[];
  unchangedCount: number;
}

// ─── Helpers (from import_to_supabase.js) ───

function cleanText(val: unknown): string {
  if (val === undefined || val === null || val === '') return '';
  return String(val).trim().replace(/°|º/g, '');
}

export function parsePrice(val: unknown): number {
  if (!val) return 0;
  let s = String(val).trim();
  s = s.replace(/\$/g, '').replace(/\s/g, '');
  s = s.replace(/\./g, '');
  s = s.replace(/,/g, '');
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}

export function slugify(text: string): string {
  if (!text) return '';
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export function mapPrescriptionType(val: string): 'direct' | 'prescription' | 'retained' {
  const v = cleanText(val).toUpperCase();
  if (v.includes('RETENIDA')) return 'retained';
  if (v.includes('RECETA')) return 'prescription';
  return 'direct';
}

export function buildDescription(row: ExcelRow): string {
  const parts: string[] = [];
  if (row.accion_terapeutica) parts.push(`Acción terapéutica: ${row.accion_terapeutica}`);
  if (row.principio_activo) parts.push(`Principio activo: ${row.principio_activo}`);
  if (row.presentacion) {
    const units = row.unidades_presentacion ? `${row.unidades_presentacion} ` : '';
    parts.push(`Presentación: ${units}${row.presentacion}`);
  }
  if (row.receta) {
    const recetaMap: Record<string, string> = {
      'DIRECTA': 'Venta directa',
      'RECETA MEDICA': 'Receta médica',
      'RECETA RETENIDA': 'Receta retenida',
    };
    parts.push(`Requiere: ${recetaMap[row.receta.toUpperCase()] || row.receta}`);
  }
  if (row.laboratorio) parts.push(`Laboratorio: ${row.laboratorio}`);
  if (row.registro_sanitario) parts.push(`Registro sanitario: ${row.registro_sanitario}`);
  if (row.es_bioequivalente && row.es_bioequivalente.toUpperCase() === 'SI') {
    parts.push('Bioequivalente: Sí');
  }
  if (row.control_legal) parts.push(`Control legal: ${row.control_legal}`);
  if (row.precio_por_unidad) parts.push(`Precio unitario: ${row.precio_por_unidad}`);
  return parts.length > 0 ? parts.join('. ') + '.' : `Producto farmacéutico: ${row.producto}`;
}

// Category resolution constants
export const DEPT_TO_CATEGORY: Record<string, string> = {
  'PERFUMERIA': 'higiene-cuidado-personal',
  'HOMEOPATIA - H.MEDICINALES': 'productos-naturales',
  'ASEO PERSONAL': 'higiene-cuidado-personal',
  'ALIMENTOS': 'vitaminas-suplementos',
  'RECETARIO MAGISTRAL': 'otros',
  'ACCESORIOS': 'insumos-medicos',
};

export const EXTRA_MAPPINGS: Record<string, string> = {
  'ACCESORIOS MEDICOS': 'insumos-medicos',
  'PRODUCTOS NATURALES': 'productos-naturales',
  'EST.FUNCION SEXUAL MASCULINA': 'higiene-cuidado-personal',
  'LUBRIC.ESTIMULANTE VAGINAL': 'higiene-cuidado-personal',
  'CORTICOTER.ASOCIADA OFTALMICA': 'oftalmologia',
  'CORTICOTER.ASOCIADA OTICA': 'oftalmologia',
  'FARMACIA': 'otros',
  'SIN ASIGNACION': 'otros',
  'ACCESORIOS MAQUILLAJE': 'higiene-cuidado-personal',
  'ARTICULOS ASEO INFANTIL': 'bebes-ninos',
  'LECHES Y ALIMENTOS INFANTILES': 'bebes-ninos',
  'PANALES Y TOALLITAS HUMEDAS': 'bebes-ninos',
  'MAMADERAS Y CHUPETES': 'bebes-ninos',
  'COLONIAS INFANTILES': 'bebes-ninos',
  'VITAMINAS INFANTILES': 'bebes-ninos',
  'PROTECTOR SOLAR FACIAL': 'higiene-cuidado-personal',
  'DESMAQUILLANTE': 'higiene-cuidado-personal',
};

// ─── Load ALL products for diffing (paginates through /api/products) ───

export async function loadAllProductsForDiff(): Promise<ProductWithCategory[]> {
  const all: ProductWithCategory[] = [];
  const PAGE_SIZE = 100;
  let page = 1;

  while (true) {
    const res = await fetch(`/api/products?limit=${PAGE_SIZE}&page=${page}&active_only=false`);
    if (!res.ok) throw new Error('Error al cargar productos');
    const data = await res.json();
    all.push(...data.products);
    if (page >= data.total_pages || data.products.length === 0) break;
    page++;
  }

  return all;
}

// ─── Parse Excel File ───

export async function parseExcelFile(file: File): Promise<{ rows: ExcelRow[]; errors: string[] }> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (rawData.length < 2) {
    return { rows: [], errors: ['El archivo está vacío o no tiene datos'] };
  }

  const errors: string[] = [];
  const rows: ExcelRow[] = [];

  for (let i = 1; i < rawData.length; i++) {
    const raw = rawData[i];
    const obj: Record<string, string> = {};
    COL_NAMES.forEach((c, idx) => {
      obj[c] = cleanText(raw[idx]);
    });

    const row = obj as unknown as ExcelRow;

    if (!row.producto) continue;
    if (parsePrice(row.precio) <= 0) continue;

    rows.push(row);
  }

  if (rows.length === 0) {
    errors.push('No se encontraron productos válidos (necesitan nombre y precio > 0)');
  }

  return { rows, errors };
}

// ─── Diff Products ───

export function diffProducts(
  excelRows: ExcelRow[],
  dbProducts: ProductWithCategory[]
): DiffResult {
  // Index DB products by external_id
  const dbByExternalId = new Map<string, ProductWithCategory>();
  for (const p of dbProducts) {
    if (p.external_id) {
      dbByExternalId.set(String(p.external_id), p);
    }
  }

  const newProducts: ExcelRow[] = [];
  const updatedProducts: ProductChange[] = [];
  let unchangedCount = 0;

  for (const row of excelRows) {
    const externalId = String(row.id);
    const dbProduct = dbByExternalId.get(externalId);

    if (!dbProduct) {
      newProducts.push(row);
      continue;
    }

    // Compare stock and price
    const newStock = parseInt(row.stock) || 0;
    const newPrice = parsePrice(row.precio);
    const oldStock = dbProduct.stock;
    const oldPrice = parseInt(dbProduct.price) || parsePrice(dbProduct.price);

    const changes: string[] = [];
    let stockChange: ProductChange['stockChange'];
    let priceChange: ProductChange['priceChange'];

    if (newStock !== oldStock) {
      stockChange = { old: oldStock, new: newStock };
      changes.push(`Stock: ${oldStock} → ${newStock}`);
    }

    if (newPrice !== oldPrice) {
      priceChange = { old: oldPrice, new: newPrice };
      changes.push(`Precio: $${oldPrice.toLocaleString('es-CL')} → $${newPrice.toLocaleString('es-CL')}`);
    }

    if (changes.length > 0) {
      updatedProducts.push({ excelRow: row, dbProduct, changes, stockChange, priceChange });
    } else {
      unchangedCount++;
    }
  }

  return { newProducts, updatedProducts, unchangedCount };
}
