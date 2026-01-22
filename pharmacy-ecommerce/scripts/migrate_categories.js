#!/usr/bin/env node
/**
 * Script para migrar productos a las nuevas categorías profesionales
 * Extrae datos estructurados de las descripciones y reasigna categorías
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway';

async function runMigration(client) {
  console.log('📦 Ejecutando migración SQL...');
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '005_professional_categories.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Split by semicolons but handle the INSERT with multiple VALUES
  const statements = sql
    .split(/;(?=\s*(?:--|ALTER|CREATE|UPDATE|DELETE|INSERT|DROP))/gi)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        await client.query(stmt);
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message.includes('already exists') && !err.message.includes('duplicate key')) {
          console.error('Error en statement:', stmt.substring(0, 100), '...');
          console.error(err.message);
        }
      }
    }
  }
  console.log('✅ Migración SQL completada');
}

async function extractStructuredData(client) {
  console.log('\n📝 Extrayendo datos estructurados de las descripciones...');

  const products = await client.query('SELECT id, description FROM products WHERE description IS NOT NULL');
  let updated = 0;

  for (const product of products.rows) {
    const desc = product.description || '';

    // Extract therapeutic action
    const actionMatch = desc.match(/Acción terapéutica:\s*([^.]+)/i);
    const therapeuticAction = actionMatch ? actionMatch[1].trim() : null;

    // Extract active ingredient
    const ingredientMatch = desc.match(/Principio activo:\s*([^.]+)/i);
    const activeIngredient = ingredientMatch ? ingredientMatch[1].trim() : null;

    // Extract prescription type
    const prescriptionMatch = desc.match(/Requiere:\s*([^.]+)/i);
    let prescriptionType = 'direct'; // default
    if (prescriptionMatch) {
      const req = prescriptionMatch[1].toLowerCase();
      if (req.includes('retenida') || req.includes('receta cheque')) {
        prescriptionType = 'retained';
      } else if (req.includes('receta') && !req.includes('directa')) {
        prescriptionType = 'prescription';
      }
    }

    // Extract presentation
    const presentationMatch = desc.match(/Presentación:\s*([^.]+)/i);
    const presentation = presentationMatch ? presentationMatch[1].trim() : null;

    // Update product
    await client.query(`
      UPDATE products
      SET therapeutic_action = $1,
          active_ingredient = $2,
          prescription_type = $3,
          presentation = $4
      WHERE id = $5
    `, [therapeuticAction, activeIngredient, prescriptionType, presentation, product.id]);

    updated++;
    if (updated % 100 === 0) {
      console.log(`  Procesados: ${updated}/${products.rows.length}`);
    }
  }

  console.log(`✅ Datos extraídos de ${updated} productos`);
}

async function assignCategories(client) {
  console.log('\n🏷️ Asignando productos a categorías profesionales...');

  // Get all categories
  const categories = await client.query('SELECT id, slug FROM categories');
  const categoryMap = {};
  categories.rows.forEach(c => categoryMap[c.slug] = c.id);

  // Get therapeutic action mappings
  const mappings = await client.query('SELECT therapeutic_action, category_slug FROM therapeutic_category_mapping');
  const actionToCategory = {};
  mappings.rows.forEach(m => actionToCategory[m.therapeutic_action.toUpperCase()] = m.category_slug);

  // Get all products with therapeutic action
  const products = await client.query('SELECT id, therapeutic_action, laboratory FROM products');

  let assigned = 0;
  let unassigned = 0;
  const unmappedActions = new Set();

  for (const product of products.rows) {
    let categorySlug = null;

    if (product.therapeutic_action) {
      const action = product.therapeutic_action.toUpperCase();
      categorySlug = actionToCategory[action];

      if (!categorySlug) {
        unmappedActions.add(product.therapeutic_action);
      }
    }

    // Default to 'otros' if no mapping found
    if (!categorySlug) {
      categorySlug = 'otros';
      unassigned++;
    } else {
      assigned++;
    }

    const categoryId = categoryMap[categorySlug];
    if (categoryId) {
      await client.query('UPDATE products SET category_id = $1 WHERE id = $2', [categoryId, product.id]);
    }
  }

  console.log(`✅ Categorías asignadas:`);
  console.log(`   - Mapeados correctamente: ${assigned}`);
  console.log(`   - Asignados a 'Otros': ${unassigned}`);

  if (unmappedActions.size > 0) {
    console.log(`\n⚠️ Acciones terapéuticas sin mapeo (${unmappedActions.size}):`);
    [...unmappedActions].slice(0, 10).forEach(a => console.log(`   - ${a}`));
    if (unmappedActions.size > 10) {
      console.log(`   ... y ${unmappedActions.size - 10} más`);
    }
  }
}

async function printSummary(client) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('='.repeat(60));

  // Categories summary
  const catSummary = await client.query(`
    SELECT c.name, c.slug, COUNT(p.id) as count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name, c.slug
    ORDER BY count DESC
  `);

  console.log('\nProductos por categoría:');
  catSummary.rows.forEach(c => {
    const bar = '█'.repeat(Math.min(Math.floor(c.count / 20), 30));
    console.log(`  ${c.count.toString().padStart(4)} │ ${bar} ${c.name}`);
  });

  // Prescription type summary
  const prescSummary = await client.query(`
    SELECT prescription_type, COUNT(*) as count
    FROM products
    GROUP BY prescription_type
    ORDER BY count DESC
  `);

  console.log('\nPor tipo de venta:');
  prescSummary.rows.forEach(p => {
    const type = p.prescription_type === 'direct' ? 'Venta Directa' :
                 p.prescription_type === 'prescription' ? 'Receta Médica' :
                 p.prescription_type === 'retained' ? 'Receta Retenida' : p.prescription_type;
    console.log(`  ${p.count.toString().padStart(4)} │ ${type}`);
  });

  // Labs summary
  const labsCount = await client.query('SELECT COUNT(DISTINCT laboratory) as count FROM products WHERE laboratory IS NOT NULL');
  console.log(`\nLaboratorios únicos: ${labsCount.rows[0].count}`);

  // Active ingredients summary
  const ingredientsCount = await client.query('SELECT COUNT(DISTINCT active_ingredient) as count FROM products WHERE active_ingredient IS NOT NULL');
  console.log(`Principios activos únicos: ${ingredientsCount.rows[0].count}`);

  console.log('\n' + '='.repeat(60));
}

async function main() {
  console.log('🚀 Iniciando migración a categorías profesionales...\n');

  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    await runMigration(client);
    await extractStructuredData(client);
    await assignCategories(client);
    await printSummary(client);

    console.log('\n✅ ¡Migración completada exitosamente!');
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(console.error);
