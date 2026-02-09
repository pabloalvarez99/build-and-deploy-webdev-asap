#!/usr/bin/env node
/**
 * Buscar y asignar imágenes a productos sin image_url via DuckDuckGo
 * Usa Supabase REST API
 */

const SUPABASE_URL = 'https://jvagvjwrjiekaafpjbit.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YWd2andyamlla2FhZnBqYml0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU5MDI5NCwiZXhwIjoyMDg2MTY2Mjk0fQ.wx7EcK6R5AT_ATd3wuXMoKW2NQJKyUimJmGrUrLfsAo';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchImage(query) {
  try {
    // Use DuckDuckGo image search via their API
    const encodedQuery = encodeURIComponent(query);
    const url = `https://duckduckgo.com/?q=${encodedQuery}&iax=images&ia=images`;

    // Use the DDG vqd token approach
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodedQuery}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const tokenHtml = await tokenRes.text();
    const vqdMatch = tokenHtml.match(/vqd=['"]([^'"]+)['"]/);
    if (!vqdMatch) return null;

    const vqd = vqdMatch[1];
    const imgUrl = `https://duckduckgo.com/i.js?l=cl-es&o=json&q=${encodedQuery}&vqd=${vqd}&f=,,,,,&p=1`;

    const imgRes = await fetch(imgUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    if (!imgRes.ok) return null;
    const data = await imgRes.json();

    if (data.results && data.results.length > 0) {
      // Pick the first result with a reasonable image URL
      for (const result of data.results.slice(0, 3)) {
        const imgSrc = result.image;
        if (imgSrc && imgSrc.startsWith('http') && !imgSrc.includes('x-raw-image')) {
          return imgSrc;
        }
      }
    }
  } catch (e) {
    // silently fail
  }
  return null;
}

async function searchImageFallback(query) {
  // Fallback: try Google-style search for product images
  try {
    const encodedQuery = encodeURIComponent(query + ' producto farmacia chile');
    // Try a simpler image search approach
    const res = await fetch(`https://lite.duckduckgo.com/lite/?q=${encodedQuery}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    // This won't give images directly, so return null
    return null;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  BÚSQUEDA DE IMÁGENES PARA PRODUCTOS');
  console.log('═══════════════════════════════════════════════════\n');

  // Get all products without images
  console.log('Cargando productos sin imagen...');
  let allProducts = [];
  let offset = 0;
  const LIMIT = 500;

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,laboratory&or=(image_url.is.null,image_url.eq.)&order=name&limit=${LIMIT}&offset=${offset}`,
      { headers }
    );
    const batch = await res.json();
    if (batch.length === 0) break;
    allProducts = allProducts.concat(batch);
    offset += LIMIT;
    if (batch.length < LIMIT) break;
  }

  const total = allProducts.length;
  console.log(`Encontrados ${total} productos sin imagen.\n`);

  if (total === 0) {
    console.log('Todos los productos ya tienen imagen.');
    return;
  }

  let updated = 0;
  let failed = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < allProducts.length; i++) {
    const { id, name, laboratory } = allProducts[i];

    // Build search query - clean product name
    const cleanName = name.split('(')[0].trim();
    const searchQuery = `${cleanName} ${laboratory || ''} medicamento chile`.trim().replace(/\s+/g, ' ');

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const eta = i > 0 ? (((Date.now() - startTime) / i) * (total - i) / 1000 / 60).toFixed(1) : '?';
    process.stdout.write(`[${i + 1}/${total}] (${elapsed}m, ETA: ${eta}m) ${cleanName.substring(0, 40).padEnd(40)} `);

    let imageUrl = await searchImage(searchQuery);

    if (imageUrl) {
      // Update in Supabase
      try {
        const patchRes = await fetch(
          `${SUPABASE_URL}/rest/v1/products?id=eq.${id}`,
          {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ image_url: imageUrl }),
          }
        );
        if (patchRes.ok) {
          updated++;
          console.log('OK');
        } else {
          errors++;
          console.log('DB ERROR');
        }
      } catch (e) {
        errors++;
        console.log('DB ERROR');
      }
    } else {
      failed++;
      console.log('-');
    }

    // Random delay 1.5-3s to avoid rate limits
    await sleep(1500 + Math.random() * 1500);

    // Progress summary every 50 products
    if ((i + 1) % 50 === 0) {
      console.log(`\n--- Progreso: ${updated} OK, ${failed} sin imagen, ${errors} errores ---\n`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  BÚSQUEDA DE IMÁGENES COMPLETADA');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Tiempo total:        ${totalTime} minutos`);
  console.log(`  Imágenes asignadas:  ${updated}`);
  console.log(`  Sin resultado:       ${failed}`);
  console.log(`  Errores DB:          ${errors}`);
  console.log(`  Cobertura:           ${((updated / total) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
