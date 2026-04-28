import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { getDb } from '@/lib/db';

function slugify(text: string): string {
  if (!text) return '';
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function cleanText(val: unknown): string {
  if (val === undefined || val === null || val === '') return '';
  return String(val).trim().replace(/°|º/g, '');
}

function parsePrice(val: unknown): number {
  if (!val) return 0;
  let s = String(val).trim();
  s = s.replace(/\$/g, '').replace(/\s/g, '');
  s = s.replace(/\./g, '').replace(/,/g, '');
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}

function mapPrescriptionType(val: string): 'direct' | 'prescription' | 'retained' {
  const v = cleanText(val).toUpperCase();
  if (v.includes('RETENIDA')) return 'retained';
  if (v.includes('RECETA')) return 'prescription';
  return 'direct';
}

function buildDescription(row: Record<string, string>): string {
  const parts: string[] = [];
  if (row.accion_terapeutica) parts.push(`Acción terapéutica: ${row.accion_terapeutica}`);
  if (row.principio_activo) parts.push(`Principio activo: ${row.principio_activo}`);
  if (row.presentacion) {
    const units = row.unidades_presentacion ? `${row.unidades_presentacion} ` : '';
    parts.push(`Presentación: ${units}${row.presentacion}`);
  }
  if (row.receta) {
    const recetaMap: Record<string, string> = {
      'DIRECTA': 'Venta directa', 'RECETA MEDICA': 'Receta médica', 'RECETA RETENIDA': 'Receta retenida',
    };
    parts.push(`Requiere: ${recetaMap[row.receta.toUpperCase()] || row.receta}`);
  }
  if (row.laboratorio) parts.push(`Laboratorio: ${row.laboratorio}`);
  if (row.registro_sanitario) parts.push(`Registro sanitario: ${row.registro_sanitario}`);
  if (row.es_bioequivalente && row.es_bioequivalente.toUpperCase() === 'SI') parts.push('Bioequivalente: Sí');
  if (row.control_legal) parts.push(`Control legal: ${row.control_legal}`);
  if (row.precio_por_unidad) parts.push(`Precio unitario: ${row.precio_por_unidad}`);
  return parts.length > 0 ? parts.join('. ') + '.' : `Producto farmacéutico: ${row.producto}`;
}

const DEPT_TO_CATEGORY: Record<string, string> = {
  'PERFUMERIA': 'higiene-cuidado-personal',
  'HOMEOPATIA - H.MEDICINALES': 'productos-naturales',
  'ASEO PERSONAL': 'higiene-cuidado-personal',
  'ALIMENTOS': 'vitaminas-suplementos',
  'RECETARIO MAGISTRAL': 'otros',
  'ACCESORIOS': 'insumos-medicos',
};

const EXTRA_MAPPINGS: Record<string, string> = {
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

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { newProducts, updateProducts } = await request.json();
    const db = await getDb();

    // Load categories
    const categories = await db.categories.findMany({ select: { id: true, slug: true } });
    const catBySlug: Record<string, string> = {};
    categories.forEach((c) => { catBySlug[c.slug] = c.id; });

    // Load therapeutic mappings
    const mappings = await db.therapeutic_category_mapping.findMany({
      select: { therapeutic_action: true, category_slug: true },
      take: 500,
    });
    const actionToSlug: Record<string, string> = {};
    mappings.forEach((m) => { actionToSlug[m.therapeutic_action.toUpperCase()] = m.category_slug; });
    Object.entries(EXTRA_MAPPINGS).forEach(([action, slug]) => {
      if (!actionToSlug[action.toUpperCase()]) actionToSlug[action.toUpperCase()] = slug;
    });

    const resolveCategory = (row: Record<string, string>): string | null => {
      const action = (row.accion_terapeutica || '').toUpperCase();
      const dept = (row.departamento || '').toUpperCase();
      if (action && actionToSlug[action]) {
        const slug = actionToSlug[action];
        if (catBySlug[slug]) return catBySlug[slug];
      }
      if (DEPT_TO_CATEGORY[dept]) {
        const slug = DEPT_TO_CATEGORY[dept];
        if (catBySlug[slug]) return catBySlug[slug];
      }
      const deptSlug = slugify(dept);
      if (catBySlug[deptSlug]) return catBySlug[deptSlug];
      return catBySlug['otros'] || null;
    };

    // Load existing slugs to avoid collisions
    const existingSlugRows = await db.products.findMany({ select: { slug: true } });
    const usedSlugs = new Set(existingSlugRows.map((p) => p.slug));

    const getUniqueSlug = (name: string): string => {
      let slug = slugify(name) || 'producto';
      let baseSlug = slug;
      let counter = 1;
      while (usedSlugs.has(slug)) { slug = `${baseSlug}-${counter}`; counter++; }
      usedSlugs.add(slug);
      return slug;
    };

    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    // Filter out products that already exist by external_id
    let trulyNewProducts = (newProducts || []) as Record<string, string>[];
    if (trulyNewProducts.length > 0) {
      const extIds = trulyNewProducts.map((r) => r.id).filter(Boolean);
      if (extIds.length > 0) {
        const existing = await db.products.findMany({
          where: { external_id: { in: extIds } },
          select: { external_id: true },
        });
        const existingExtIds = new Set(existing.map((p) => String(p.external_id)));
        trulyNewProducts = trulyNewProducts.filter((r) => !existingExtIds.has(String(r.id)));
      }
    }

    // Insert new products in batches + registrar stock_movement inicial
    if (trulyNewProducts.length > 0) {
      const records = trulyNewProducts.map((row: Record<string, string>) => ({
        name: row.producto,
        slug: getUniqueSlug(row.producto),
        description: buildDescription(row),
        price: parsePrice(row.precio),
        stock: parseInt(row.stock) || 0,
        category_id: resolveCategory(row),
        image_url: null as string | null,
        active: true,
        external_id: row.id || null,
        laboratory: row.laboratorio || null,
        therapeutic_action: row.accion_terapeutica || null,
        active_ingredient: row.principio_activo || null,
        prescription_type: mapPrescriptionType(row.receta || ''),
        presentation: row.presentacion || null,
      }));

      const BATCH_SIZE = 100;
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        try {
          await db.products.createMany({ data: batch });
          inserted += batch.length;

          // Registrar stock_movement para los productos recién insertados con stock > 0
          const extIds = batch.map((r) => r.external_id).filter((id): id is string => !!id);
          if (extIds.length > 0) {
            const created = await db.products.findMany({
              where: { external_id: { in: extIds } },
              select: { id: true, stock: true },
            });
            const movements = created
              .filter((p) => p.stock > 0)
              .map((p) => ({
                product_id: p.id,
                delta: p.stock,
                reason: 'import_excel',
                admin_id: admin.uid,
              }));
            if (movements.length > 0) {
              await db.stock_movements.createMany({ data: movements });
            }
          }
        } catch (err) {
          errors.push(`Error inserting batch ${i}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    // Update existing products + registrar delta de stock como stock_movement
    if (updateProducts && updateProducts.length > 0) {
      const rows = updateProducts as Record<string, string>[];

      // 1 query para obtener todos los productos existentes a actualizar
      const updateExtIds = rows.map((r) => String(r.id)).filter(Boolean);
      const existingForUpdate = await db.products.findMany({
        where: { external_id: { in: updateExtIds } },
        select: { id: true, stock: true, external_id: true },
      });
      const existingMap = new Map(existingForUpdate.map((p) => [String(p.external_id), p]));

      const stockMovements: { product_id: string; delta: number; reason: string; admin_id: string }[] = [];

      // Actualizar en batches paralelos en lugar de loop secuencial
      const UPDATE_BATCH = 20;
      for (let i = 0; i < rows.length; i += UPDATE_BATCH) {
        const batch = rows.slice(i, i + UPDATE_BATCH);
        const results = await Promise.allSettled(batch.map(async (row) => {
          const externalId = String(row.id);
          const newStock = parseInt(row.stock) || 0;
          await db.products.updateMany({
            where: { external_id: externalId },
            data: {
              stock: newStock,
              price: parsePrice(row.precio),
              laboratory: row.laboratorio || null,
              therapeutic_action: row.accion_terapeutica || null,
              active_ingredient: row.principio_activo || null,
              prescription_type: mapPrescriptionType(row.receta || ''),
              presentation: row.presentacion || null,
              description: buildDescription(row),
            },
          });
          return { row, externalId, newStock };
        }));

        for (const result of results) {
          if (result.status === 'fulfilled') {
            const { row, externalId, newStock } = result.value;
            updated++;
            const existing = existingMap.get(externalId);
            if (existing && newStock !== existing.stock) {
              const wentOutOfStock = existing.stock > 0 && newStock <= 0;
              stockMovements.push({
                product_id: existing.id,
                delta: newStock - existing.stock,
                reason: wentOutOfStock ? 'agotado_excel' : 'import_excel',
                admin_id: admin.uid,
              });
            }
          } else {
            const row = batch[results.indexOf(result)] as Record<string, string>;
            errors.push(`Error updating ${row?.producto}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
          }
        }
      }

      // 1 sola query para todos los stock_movements
      if (stockMovements.length > 0) {
        await db.stock_movements.createMany({ data: stockMovements });
      }
    }

    // Sync automático de barcodes: asociar productos recién importados con barcode_catalog
    let barcodesLinked = 0;
    try {
      const syncResult = await db.$executeRaw`
        INSERT INTO product_barcodes (product_id, barcode)
        SELECT p.id, bc.barcode
        FROM barcode_catalog bc
        JOIN products p ON p.external_id = bc.external_id
        ON CONFLICT (barcode) DO NOTHING
      `;
      barcodesLinked = syncResult;
    } catch {
      // No bloquear el import si falla el sync de barcodes
    }

    revalidateTag('products');
    return NextResponse.json({
      success: true,
      inserted,
      updated,
      barcodes_linked: barcodesLinked,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
