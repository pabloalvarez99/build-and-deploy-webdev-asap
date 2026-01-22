#!/usr/bin/env node
/**
 * Script para importar productos desde Excel a PostgreSQL
 * Versión Node.js del script Python
 */

const xlsx = require('xlsx');
const { Client } = require('pg');
const path = require('path');

// Database connection
const DB_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway';

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function cleanText(text) {
  if (!text) return '';
  return text.toString().trim().replace(/°|º/g, '');
}

function buildDescription(row) {
  const parts = [];

  if (row.accion_terapeutica) {
    parts.push(`Acción terapéutica: ${cleanText(row.accion_terapeutica)}`);
  }
  if (row.principio_activo) {
    parts.push(`Principio activo: ${cleanText(row.principio_activo)}`);
  }
  if (row.presentacion) {
    parts.push(`Presentación: ${cleanText(row.presentacion)}`);
  }
  if (row.receta) {
    parts.push(`Requiere: ${cleanText(row.receta)}`);
  }

  return parts.length > 0 ? parts.join('. ') : `Producto farmacéutico: ${cleanText(row.producto)}`;
}

async function main() {
  const excelPath = path.join(__dirname, '..', '2026-01-19_LISTA_DE_PRECIOS.xlsx');

  console.log(`Leyendo Excel desde: ${excelPath}`);

  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  // Skip header row
  const headers = ['id', 'producto', 'laboratorio', 'departamento', 'accion_terapeutica',
    'principio_activo', 'unidades_presentacion', 'presentacion', 'receta',
    'control_legal', 'es_bioequivalente', 'registro_sanitario',
    'titular_registro', 'stock', 'precio', 'precio_por_unidad'];

  const data = rawData.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // Filter valid products
  const products = data.filter(p => {
    const producto = cleanText(p.producto);
    const precio = parseFloat(p.precio) || 0;
    return producto && precio > 0;
  });

  const withStock = products.filter(p => (parseInt(p.stock) || 0) > 0).length;
  const outOfStock = products.filter(p => (parseInt(p.stock) || 0) === 0).length;

  console.log(`Productos válidos para importar: ${products.length}`);
  console.log(`  - Con stock > 0: ${withStock}`);
  console.log(`  - Con stock = 0 (Agotados): ${outOfStock}`);

  // Connect to database
  console.log('\nConectando a la base de datos...');
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  // Process categories (departamentos)
  console.log('Procesando categorías (departamentos)...');
  const departamentos = [...new Set(products.map(p => cleanText(p.departamento)).filter(Boolean))];
  const categoryMap = {};

  for (const catName of departamentos) {
    const slug = slugify(catName);
    if (!slug) continue;

    const result = await client.query('SELECT id FROM categories WHERE slug = $1', [slug]);

    if (result.rows.length > 0) {
      categoryMap[catName] = result.rows[0].id;
    } else {
      const insert = await client.query(
        'INSERT INTO categories (name, slug, description, active) VALUES ($1, $2, $3, $4) RETURNING id',
        [catName, slug, `Productos de ${catName}`, true]
      );
      categoryMap[catName] = insert.rows[0].id;
    }
  }
  console.log(`Categorías procesadas: ${Object.keys(categoryMap).length}`);

  // Delete existing products
  console.log('\nLimpiando productos anteriores...');
  await client.query('DELETE FROM order_items');
  await client.query('DELETE FROM products');
  console.log('Productos eliminados.');

  // Insert products
  console.log('\nInsertando productos...');
  let productsInserted = 0;
  let productsWithStock = 0;
  let productsOutOfStock = 0;
  const usedSlugs = new Set();

  for (const row of products) {
    try {
      const name = cleanText(row.producto);
      if (!name) continue;

      let slug = slugify(name);
      if (!slug) continue;

      // Make slug unique
      let baseSlug = slug;
      let counter = 1;
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      usedSlugs.add(slug);

      const stock = parseInt(row.stock) || 0;
      const price = parseFloat(row.precio) || 0;
      const externalId = row.id ? row.id.toString().trim() : null;
      const laboratory = cleanText(row.laboratorio) || null;
      const catName = cleanText(row.departamento);
      const categoryId = categoryMap[catName] || null;
      const description = buildDescription(row);

      await client.query(`
        INSERT INTO products (name, slug, description, price, stock, category_id, external_id, laboratory, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [name, slug, description, price, stock, categoryId, externalId, laboratory, true]);

      productsInserted++;
      if (stock > 0) productsWithStock++;
      else productsOutOfStock++;

      if (productsInserted % 100 === 0) {
        console.log(`  Insertados: ${productsInserted}`);
      }
    } catch (error) {
      console.error(`Error en producto ${row.producto}: ${error.message}`);
    }
  }

  // Summary
  const totalRes = await client.query('SELECT COUNT(*) FROM products');
  const availableRes = await client.query('SELECT COUNT(*) FROM products WHERE stock > 0');
  const outOfStockRes = await client.query('SELECT COUNT(*) FROM products WHERE stock = 0');
  const categoriesRes = await client.query('SELECT COUNT(*) FROM categories');
  const valueRes = await client.query('SELECT SUM(stock * price) FROM products');

  console.log('\n' + '='.repeat(50));
  console.log('=== IMPORTACIÓN COMPLETADA ===');
  console.log('='.repeat(50));
  console.log(`Productos importados: ${productsInserted}`);
  console.log(`  - Con stock disponible: ${productsWithStock}`);
  console.log(`  - Agotados (stock = 0): ${productsOutOfStock}`);
  console.log(`Total productos en DB: ${totalRes.rows[0].count}`);
  console.log(`Total categorías: ${categoriesRes.rows[0].count}`);
  console.log(`Valor total inventario: $${Math.round(valueRes.rows[0].sum || 0).toLocaleString()} CLP`);
  console.log('='.repeat(50));

  await client.end();
}

main().catch(console.error);
