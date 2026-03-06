#!/usr/bin/env node
/**
 * Importar ~1200 productos desde Excel a Supabase
 * Lee 2026-01-19_LISTA_DE_PRECIOS.xlsx y usa la Supabase REST API
 */

const xlsx = require('xlsx');
const path = require('path');

// Supabase config
const SUPABASE_URL = 'https://jvagvjwrjiekaafpjbit.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YWd2andyamlla2FhZnBqYml0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU5MDI5NCwiZXhwIjoyMDg2MTY2Mjk0fQ.wx7EcK6R5AT_ATd3wuXMoKW2NQJKyUimJmGrUrLfsAo';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

// ─── Helpers ───

function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function cleanText(val) {
  if (val === undefined || val === null || val === '') return '';
  return String(val).trim().replace(/°|º/g, '');
}

function parsePrice(val) {
  if (!val) return 0;
  // Format: "$3,990 " or "3990" or "$13,000 "
  let s = String(val).trim();
  s = s.replace(/\$/g, '').replace(/\s/g, '');
  // Chilean format: dot=thousands, comma=thousands (no decimals in CLP)
  // Could be "$3,990" (comma=thousands) or "$3.990" (dot=thousands)
  // The Excel shows commas as thousands separator: "$3,990 "
  s = s.replace(/\./g, ''); // remove dots (thousands in some formats)
  s = s.replace(/,/g, ''); // remove commas (thousands)
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}

function mapPrescriptionType(val) {
  const v = cleanText(val).toUpperCase();
  if (v.includes('RETENIDA')) return 'retained';
  if (v.includes('RECETA')) return 'prescription';
  if (v === 'DIRECTA' || v === '') return 'direct';
  return 'direct';
}

// Departamento → category slug fallback
const DEPT_TO_CATEGORY = {
  'PERFUMERIA': 'higiene-cuidado-personal',
  'HOMEOPATIA - H.MEDICINALES': 'productos-naturales',
  'ASEO PERSONAL': 'higiene-cuidado-personal',
  'ALIMENTOS': 'vitaminas-suplementos',
  'RECETARIO MAGISTRAL': 'otros',
  'ACCESORIOS': 'insumos-medicos',
};

// Extra therapeutic action mappings not in DB
const EXTRA_MAPPINGS = {
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

function buildDescription(row) {
  const parts = [];

  if (row.accion_terapeutica) {
    parts.push(`Acción terapéutica: ${row.accion_terapeutica}`);
  }
  if (row.principio_activo) {
    parts.push(`Principio activo: ${row.principio_activo}`);
  }
  if (row.presentacion) {
    const units = row.unidades_presentacion ? `${row.unidades_presentacion} ` : '';
    parts.push(`Presentación: ${units}${row.presentacion}`);
  }
  if (row.receta) {
    const recetaMap = {
      'DIRECTA': 'Venta directa',
      'RECETA MEDICA': 'Receta médica',
      'RECETA RETENIDA': 'Receta retenida',
    };
    parts.push(`Requiere: ${recetaMap[row.receta.toUpperCase()] || row.receta}`);
  }
  if (row.laboratorio) {
    parts.push(`Laboratorio: ${row.laboratorio}`);
  }
  if (row.registro_sanitario) {
    parts.push(`Registro sanitario: ${row.registro_sanitario}`);
  }
  if (row.es_bioequivalente && row.es_bioequivalente.toUpperCase() === 'SI') {
    parts.push('Bioequivalente: Sí');
  }
  if (row.control_legal) {
    parts.push(`Control legal: ${row.control_legal}`);
  }
  if (row.precio_por_unidad) {
    parts.push(`Precio unitario: ${row.precio_por_unidad}`);
  }

  return parts.length > 0 ? parts.join('. ') + '.' : `Producto farmacéutico: ${row.producto}`;
}

// ─── Supabase REST helpers ───

async function supabaseGet(table, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`GET ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePost(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers, body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${table}: ${res.status} ${text}`);
  }
  return res.json();
}

async function supabaseDelete(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'DELETE',
    headers: { ...headers, 'Prefer': 'return=minimal' },
  });
  if (!res.ok) throw new Error(`DELETE ${table}: ${res.status} ${await res.text()}`);
}

async function supabaseUpsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UPSERT ${table}: ${res.status} ${text}`);
  }
}

async function supabasePatch(table, query, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${table}: ${res.status} ${text}`);
  }
}

// ─── Main ───

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  IMPORTACIÓN DE PRODUCTOS A SUPABASE');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Read Excel
  const excelPath = path.join(__dirname, '..', '2026-01-19_LISTA_DE_PRECIOS.xlsx');
  console.log(`📄 Leyendo Excel: ${excelPath}`);
  const workbook = xlsx.readFile(excelPath);
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const colNames = ['id', 'producto', 'laboratorio', 'departamento', 'accion_terapeutica',
    'principio_activo', 'unidades_presentacion', 'presentacion', 'receta',
    'control_legal', 'es_bioequivalente', 'registro_sanitario',
    'titular_registro', 'stock', 'precio', 'precio_por_unidad'];

  const rows = rawData.slice(1).map(row => {
    const obj = {};
    colNames.forEach((c, i) => obj[c] = cleanText(row[i]));
    return obj;
  }).filter(r => r.producto && parsePrice(r.precio) > 0);

  console.log(`   Total productos válidos: ${rows.length}`);
  console.log(`   Con stock > 0: ${rows.filter(r => parseInt(r.stock) > 0).length}`);
  console.log(`   Agotados: ${rows.filter(r => parseInt(r.stock) <= 0).length}\n`);

  // 2. Load categories from Supabase
  console.log('📂 Cargando categorías existentes...');
  const categories = await supabaseGet('categories', 'select=id,name,slug');
  const catBySlug = {};
  categories.forEach(c => catBySlug[c.slug] = c.id);
  console.log(`   ${categories.length} categorías encontradas\n`);

  // 3. Load therapeutic_category_mapping
  console.log('🗂️  Cargando mapeos terapéuticos...');
  const mappings = await supabaseGet('therapeutic_category_mapping', 'select=therapeutic_action,category_slug&limit=500');
  const actionToSlug = {};
  mappings.forEach(m => actionToSlug[m.therapeutic_action.toUpperCase()] = m.category_slug);

  // Add extra mappings
  Object.entries(EXTRA_MAPPINGS).forEach(([action, slug]) => {
    if (!actionToSlug[action.toUpperCase()]) {
      actionToSlug[action.toUpperCase()] = slug;
    }
  });
  console.log(`   ${Object.keys(actionToSlug).length} mapeos totales\n`);

  // 4. Find unmapped therapeutic actions and add them
  const unmapped = new Set();
  rows.forEach(r => {
    const action = r.accion_terapeutica.toUpperCase();
    if (action && action !== '' && !actionToSlug[action]) {
      unmapped.add(action);
    }
  });
  if (unmapped.size > 0) {
    console.log(`⚠️  Acciones terapéuticas sin mapeo (se asignarán a "otros"):`);
    const newMappings = [];
    unmapped.forEach(action => {
      console.log(`   - ${action}`);
      actionToSlug[action] = 'otros';
      newMappings.push({ therapeutic_action: action, category_slug: 'otros' });
    });
    // Insert new mappings into DB
    if (newMappings.length > 0) {
      try {
        await supabasePost('therapeutic_category_mapping', newMappings);
        console.log(`   ✅ ${newMappings.length} nuevos mapeos insertados\n`);
      } catch (e) {
        console.log(`   ⚠️  No se pudieron insertar mapeos: ${e.message}\n`);
      }
    }
  }

  // 5. Resolve category for each product
  function resolveCategory(row) {
    const action = row.accion_terapeutica.toUpperCase();
    const dept = row.departamento.toUpperCase();

    // Priority 1: therapeutic action mapping
    if (action && actionToSlug[action]) {
      const slug = actionToSlug[action];
      if (catBySlug[slug]) return catBySlug[slug];
    }

    // Priority 2: department mapping
    if (DEPT_TO_CATEGORY[dept]) {
      const slug = DEPT_TO_CATEGORY[dept];
      if (catBySlug[slug]) return catBySlug[slug];
    }

    // Priority 3: department name as category slug
    const deptSlug = slugify(dept);
    if (catBySlug[deptSlug]) return catBySlug[deptSlug];

    // Fallback: "otros"
    return catBySlug['otros'] || null;
  }

  // 6. Load existing products by external_id (to preserve image_url)
  console.log('🔍 Cargando productos existentes...');
  const existingRaw = await supabaseGet('products', 'select=id,external_id,slug&limit=2000');
  const existingByExtId = {};
  const usedSlugs = new Set();
  existingRaw.forEach(p => {
    if (p.external_id) existingByExtId[String(p.external_id)] = p;
    if (p.slug) usedSlugs.add(p.slug);
  });
  console.log(`   ${existingRaw.length} productos en DB\n`);

  // 7. Build records: split into new products vs existing to update
  console.log('🔨 Construyendo registros...');
  const toInsert = [];
  const toUpdate = [];

  for (const row of rows) {
    let slug = slugify(row.producto);
    if (!slug) continue;

    const extId = String(row.id || '');
    const existing = extId ? existingByExtId[extId] : null;

    if (existing) {
      // Update existing product — NEVER touch image_url
      toUpdate.push({
        id: existing.id,
        stock: parseInt(row.stock) || 0,
        price: parsePrice(row.precio),
        description: buildDescription(row),
        laboratory: row.laboratorio || null,
        therapeutic_action: row.accion_terapeutica || null,
        active_ingredient: row.principio_activo || null,
        prescription_type: mapPrescriptionType(row.receta),
        presentation: row.presentacion || null,
        category_id: resolveCategory(row),
      });
    } else {
      // New product — generate unique slug
      let baseSlug = slug;
      let counter = 1;
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      usedSlugs.add(slug);

      toInsert.push({
        name: row.producto,
        slug,
        description: buildDescription(row),
        price: parsePrice(row.precio),
        stock: parseInt(row.stock) || 0,
        category_id: resolveCategory(row),
        image_url: null,
        active: true,
        external_id: row.id || null,
        laboratory: row.laboratorio || null,
        therapeutic_action: row.accion_terapeutica || null,
        active_ingredient: row.principio_activo || null,
        prescription_type: mapPrescriptionType(row.receta),
        presentation: row.presentacion || null,
      });
    }
  }

  console.log(`   ${toUpdate.length} existentes a actualizar, ${toInsert.length} nuevos a insertar\n`);

  // 8a. Update existing products (preserves image_url)
  let updated = 0;
  let updateErrors = 0;
  if (toUpdate.length > 0) {
    console.log('🔄 Actualizando productos existentes...');
    for (const p of toUpdate) {
      const { id, ...data } = p;
      try {
        await supabasePatch('products', `id=eq.${id}`, data);
        updated++;
        if (updated % 100 === 0) console.log(`   Actualizados: ${updated}/${toUpdate.length}`);
      } catch (e) {
        updateErrors++;
        console.error(`   ❌ Error actualizando id=${id}: ${e.message}`);
      }
    }
    console.log(`   ✅ Actualizados: ${updated}/${toUpdate.length} (${updateErrors} errores)\n`);
  }

  // 8b. Insert new products in batches
  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors = 0;
  if (toInsert.length > 0) {
    console.log('📤 Insertando productos nuevos...');
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      try {
        await supabasePost('products', batch);
        inserted += batch.length;
        console.log(`   Insertados: ${inserted}/${toInsert.length}`);
      } catch (e) {
        console.error(`   ❌ Error en batch ${i}-${i + batch.length}: ${e.message}`);
        for (const p of batch) {
          try {
            await supabasePost('products', [p]);
            inserted++;
          } catch (e2) {
            errors++;
            console.error(`   ❌ Error: ${p.name} - ${e2.message}`);
          }
        }
        console.log(`   Insertados: ${inserted}/${toInsert.length} (${errors} errores)`);
      }
    }
    console.log(`   ✅ Insertados: ${inserted}/${toInsert.length} (${errors} errores)\n`);
  }

  // 9. Verify
  console.log('\n📊 Verificando...');
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=count`, {
    headers: { ...headers, 'Prefer': 'count=exact' },
  });
  const totalCount = countRes.headers.get('content-range')?.split('/')[1] || '?';

  const stockRes = await fetch(`${SUPABASE_URL}/rest/v1/products?stock=gt.0&select=count`, {
    headers: { ...headers, 'Prefer': 'count=exact' },
  });
  const stockCount = stockRes.headers.get('content-range')?.split('/')[1] || '?';

  // Products by category
  const catCounts = await supabaseGet('products', 'select=category_id,categories(name)&limit=2000');
  const byCat = {};
  catCounts.forEach(p => {
    const catName = p.categories?.name || 'Sin categoría';
    byCat[catName] = (byCat[catName] || 0) + 1;
  });

  // Price stats
  const priceData = await supabaseGet('products', 'select=price&order=price.desc&limit=5');
  const priceDataAsc = await supabaseGet('products', 'select=price,name&order=price.asc&limit=5');

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  IMPORTACIÓN COMPLETADA');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Total productos en DB: ${totalCount}`);
  console.log(`  Con stock disponible:  ${stockCount}`);
  console.log(`  Actualizados OK:      ${updated}`);
  console.log(`  Insertados nuevos:    ${inserted}`);
  console.log(`  Errores:              ${errors + updateErrors}`);
  console.log('');
  console.log('  📂 Productos por categoría:');
  Object.entries(byCat).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`     ${cat}: ${count}`);
  });
  console.log('');
  console.log('  💰 Precio más alto:', priceData[0]?.price ? `$${priceData[0].price.toLocaleString()} CLP` : 'N/A');
  console.log('  💰 Precio más bajo:', priceDataAsc[0] ? `$${priceDataAsc[0].price.toLocaleString()} CLP (${priceDataAsc[0].name})` : 'N/A');
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
