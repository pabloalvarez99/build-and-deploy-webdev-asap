# Fix: Imágenes perdidas al importar Excel

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Recuperar imágenes perdidas en DB, prevenir que futuras importaciones destruyan imágenes, y mejorar el script de búsqueda de imágenes.

**Architecture:** Tres frentes: (1) fix no-destructivo del CLI de importación, (2) fix admin API que no duplique products, (3) mejorar y re-ejecutar el script Python para recuperar imágenes faltantes.

**Tech Stack:** Node.js (CLI import), Next.js API Route (admin import), Python + duckduckgo-search (image search), Supabase REST API.

---

## Diagnóstico de causas raíz

### Causa #1 (CRÍTICA): `scripts/import_to_supabase.js` borra TODO antes de reimportar
Líneas 272-275:
```javascript
await supabaseDelete('order_items', 'id=not.is.null'); // borra TODAS las órdenes
await supabaseDelete('products', 'id=not.is.null');    // borra TODOS los productos
// luego re-inserta con image_url: null
```
Si alguien corrió este script después de que las imágenes fueron cargadas → 1189 productos sin imagen.

### Causa #2 (MODERADA): Admin import crea productos "nuevos" con `image_url: null`
En `src/app/api/admin/products/import/route.ts` línea 160: `image_url: null`.
Si un producto existente no se puede matchear por `external_id` → se inserta como nuevo con imagen null, creando un duplicado (el original con imagen queda en DB).

### Causa #3 (MENOR): ~9.5% de productos nunca tuvieron imagen
El script Python encontró 1075/1188 (90.5%). Los restantes ~113 no tuvieron resultados en DuckDuckGo.

---

## Task 1: Diagnóstico con SQL (correr en Supabase Dashboard > SQL Editor)

**Goal:** Entender el estado actual de la DB antes de hacer cambios.

**Step 1: Contar productos sin imagen**
```sql
SELECT count(*) FROM products WHERE image_url IS NULL OR image_url = '';
```
Si el resultado es > 200, probablemente se corrió el CLI script.

**Step 2: Detectar duplicados por external_id**
```sql
SELECT external_id, count(*) as cnt
FROM products
WHERE external_id IS NOT NULL
GROUP BY external_id
HAVING count(*) > 1
ORDER BY cnt DESC
LIMIT 20;
```
Si hay resultados → hay duplicados (Bug #2 ocurrió).

**Step 3: Productos con imagen vs sin imagen**
```sql
SELECT
  COUNT(*) FILTER (WHERE image_url IS NOT NULL AND image_url != '') as con_imagen,
  COUNT(*) FILTER (WHERE image_url IS NULL OR image_url = '') as sin_imagen,
  COUNT(*) as total
FROM products;
```

**Step 4: Si hay duplicados, limpiarlos (eliminar los sin imagen, mantener los con imagen)**
```sql
-- Ver duplicados con detalle
SELECT external_id, array_agg(id) as ids, array_agg(image_url) as images
FROM products
WHERE external_id IS NOT NULL
GROUP BY external_id
HAVING count(*) > 1;
```
Luego para cada duplicado, borrar el que tiene `image_url IS NULL` manteniendo el que tiene imagen.

**Step 5: Limpiar duplicados automáticamente (borrar el sin imagen de cada par)**
```sql
-- Borra el duplicado sin imagen cuando existe uno con imagen
DELETE FROM products p1
USING products p2
WHERE p1.external_id = p2.external_id
  AND p1.image_url IS NULL
  AND p2.image_url IS NOT NULL;
```

---

## Task 2: Fix `scripts/import_to_supabase.js` — Eliminar el DELETE destructivo

**File:** `pharmacy-ecommerce/scripts/import_to_supabase.js`

**Problem:** Lines 272-275 hacen DELETE de TODOS los productos y órdenes antes de reimportar.

**Fix:** Reemplazar la lógica destructiva por UPSERT inteligente que:
- Para productos existentes (por `external_id`): UPDATE solo campos de negocio, NO tocar `image_url`
- Para productos nuevos: INSERT con `image_url: null`

**Step 1: Reemplazar la sección "Delete existing products" + "Insert in batches"**

Buscar y eliminar:
```javascript
// 6. Delete existing products
console.log('🗑️  Eliminando productos existentes...');
await supabaseDelete('order_items', 'id=not.is.null');
await supabaseDelete('products', 'id=not.is.null');
console.log('   ✅ Productos eliminados\n');
```

Reemplazarlo con la siguiente lógica completa (reemplaza también los pasos 7 y 8):

```javascript
  // 6. Load existing products by external_id to preserve images
  console.log('🔍 Cargando productos existentes...');
  const existingRaw = await supabaseGet('products', 'select=id,external_id,image_url&limit=2000');
  const existingByExtId = {};
  existingRaw.forEach(p => {
    if (p.external_id) existingByExtId[String(p.external_id)] = p;
  });
  console.log(`   ${existingRaw.length} productos en DB\n`);

  // 7. Build product records and split new vs existing
  console.log('🔨 Construyendo registros...');
  const usedSlugs = new Set();
  // Seed usedSlugs with existing slugs to avoid collisions
  const existingSlugsData = await supabaseGet('products', 'select=slug&limit=2000');
  existingSlugsData.forEach(p => usedSlugs.add(p.slug));

  const toInsert = [];   // truly new products
  const toUpdate = [];   // existing products (update stock/price/etc, preserve image_url)

  for (const row of rows) {
    let slug = slugify(row.producto);
    if (!slug) continue;

    const extId = String(row.id || '');
    const existing = existingByExtId[extId];

    if (existing) {
      // UPDATE: only update business fields, never touch image_url
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
      });
    } else {
      // INSERT: new product, no image yet
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

  console.log(`   Nuevos: ${toInsert.length}, A actualizar: ${toUpdate.length}\n`);

  // 8a. Insert new products in batches
  let inserted = 0, updated = 0, errors = 0;
  if (toInsert.length > 0) {
    console.log('📤 Insertando productos nuevos...');
    const BATCH_SIZE = 100;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      try {
        await supabasePost('products', batch);
        inserted += batch.length;
        console.log(`   Insertados: ${inserted}/${toInsert.length}`);
      } catch (e) {
        for (const p of batch) {
          try { await supabasePost('products', [p]); inserted++; }
          catch (e2) { errors++; console.error(`   ❌ ${p.name}: ${e2.message}`); }
        }
      }
    }
  }

  // 8b. Update existing products (preserve image_url)
  if (toUpdate.length > 0) {
    console.log('\n📝 Actualizando productos existentes...');
    for (const p of toUpdate) {
      const { id, ...data } = p;
      try {
        await supabasePatch('products', `id=eq.${id}`, data);
        updated++;
        if (updated % 100 === 0) console.log(`   Actualizados: ${updated}/${toUpdate.length}`);
      } catch (e) {
        errors++;
        console.error(`   ❌ Error actualizando ${id}: ${e.message}`);
      }
    }
    console.log(`   Actualizados: ${updated}/${toUpdate.length}`);
  }
```

**Step 2: Agregar función `supabasePatch` que falta en el script**

Agregar después de `supabaseUpsert`:
```javascript
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
```

**Step 3: Actualizar el resumen final del script**

El bloque de `console.log` al final del main, actualizar las variables:
```javascript
console.log(`  Insertados OK:        ${inserted}`);
console.log(`  Actualizados OK:      ${updated}`);
console.log(`  Errores:              ${errors}`);
```

---

## Task 3: Fix `src/app/api/admin/products/import/route.ts` — Prevenir duplicados

**File:** `pharmacy-ecommerce/apps/web/src/app/api/admin/products/import/route.ts`

**Problem:** El admin import puede insertar productos "nuevos" que en realidad ya existen, creando duplicados con `image_url: null`.

**Fix:** Antes de insertar un producto "nuevo", verificar que no exista ya en DB por `external_id`. Si existe pero no fue enviado en `updateProducts`, hacer UPDATE (no INSERT).

**Step 1: En el handler POST, antes del bloque de INSERT, agregar una verificación**

Buscar:
```typescript
// Insert new products in batches
if (newProducts && newProducts.length > 0) {
  const records = newProducts.map((row: Record<string, string>) => ({
```

Reemplazar con:
```typescript
// Safety check: verify "new" products don't already exist in DB by external_id
// (handles edge case where diffProducts() missed a match)
const existingExtIds = new Set<string>();
if (newProducts && newProducts.length > 0) {
  const extIds = newProducts.map((r: Record<string, string>) => r.id).filter(Boolean);
  if (extIds.length > 0) {
    const { data: existing } = await supabase
      .from('products')
      .select('external_id')
      .in('external_id', extIds);
    (existing || []).forEach((p: { external_id: string }) => existingExtIds.add(String(p.external_id)));
  }
}

// Insert new products in batches (only truly new ones)
const trulyNewProducts = (newProducts || []).filter(
  (r: Record<string, string>) => !existingExtIds.has(String(r.id))
);
if (trulyNewProducts.length > 0) {
  const records = trulyNewProducts.map((row: Record<string, string>) => ({
```

Y cerrar el bloque con `trulyNewProducts` en lugar de `newProducts`:
```typescript
  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('products').insert(batch);
    if (error) {
      errors.push(`Error inserting batch ${i}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }
}
```

---

## Task 4: Mejorar `scripts/update_images_supabase.py` — Mejor cobertura y resiliencia

**File:** `pharmacy-ecommerce/scripts/update_images_supabase.py`

**Problems:**
1. Si se interrumpe, no hay forma de retomar desde donde quedó (ya tiene paginación, pero no guarda progreso)
2. La búsqueda solo hace 1 intento con 1 query → ~9.5% sin resultado
3. No tiene manejo de rate limiting de DuckDuckGo

**Fix:** Múltiples queries de búsqueda fallback + manejo de rate limit + archivo de progreso.

**Step 1: Reemplazar la función `search_image` con versión mejorada**

```python
def search_image(name, lab='', retry_count=0):
    """Search for an image with multiple fallback queries."""
    queries = [
        f"{name.split('(')[0].strip()} {lab} farmacia".strip(),
        f"{name.split('(')[0].strip()} medicamento",
        f"{name.split('(')[0].strip()} comprimido pastilla",
        name.split('(')[0].strip()[:40],
    ]
    # Remove duplicate queries
    queries = list(dict.fromkeys(q for q in queries if q.strip()))

    for query in queries:
        try:
            with DDGS() as ddgs:
                results = list(ddgs.images(
                    query,
                    region="cl-es",
                    safesearch="off",
                    max_results=5
                ))
                for r in results:
                    img = r.get('image', '')
                    # Filter out bad URLs
                    if (img.startswith('http') and
                        'x-raw-image' not in img and
                        len(img) < 500 and
                        not img.endswith('.gif')):
                        return img
        except Exception as e:
            err_str = str(e).lower()
            if 'ratelimit' in err_str or '202' in err_str or 'too many' in err_str:
                # Rate limited: wait longer and retry once
                if retry_count < 2:
                    print(f'[rate limit, esperando 30s]', end='', flush=True)
                    time.sleep(30)
                    return search_image(name, lab, retry_count + 1)
            # Other error: try next query
            time.sleep(2)
    return None
```

**Step 2: Agregar archivo de progreso para poder retomar**

Al inicio de `main()`, después de cargar los productos:
```python
    PROGRESS_FILE = 'image_search_progress.json'
    # Load already-processed IDs from progress file
    processed_ids = set()
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE) as f:
                processed_ids = set(json.load(f))
            print(f'Retomando: {len(processed_ids)} productos ya procesados.\n')
        except:
            pass

    # Filter out already-processed products
    products = [p for p in products if p['id'] not in processed_ids]
    print(f'Pendientes: {len(products)} productos.\n')
```

Y al guardar cada imagen exitosamente:
```python
        if image_url:
            if image_url.startswith('http://'):
                image_url = 'https://' + image_url[7:]
            try:
                supabase_patch('products', f'id=eq.{pid}', {'image_url': image_url})
                updated += 1
                print('OK')
                # Save progress
                processed_ids.add(pid)
                with open(PROGRESS_FILE, 'w') as f:
                    json.dump(list(processed_ids), f)
            except Exception as e:
                errors += 1
                print('DB ERROR')
```

**Step 3: Agregar `import os` al inicio del script**

Agregar `import os` en los imports del principio.

**Step 4: Al final de `main()`, eliminar el archivo de progreso si se completó**
```python
    # Clean up progress file on successful completion
    if os.path.exists(PROGRESS_FILE):
        os.remove(PROGRESS_FILE)
        print('Archivo de progreso eliminado.')
```

---

## Task 5: Ejecutar el script mejorado

**No requiere "compilación"** — Python es interpretado. Solo ejecutar:

**Step 1: Ir al directorio de scripts**
```bash
cd pharmacy-ecommerce/scripts
```

**Step 2: Verificar que las dependencias están instaladas**
```bash
pip install duckduckgo-search
```

**Step 3: Ejecutar el script** (puede tardar 30-90 minutos según cuántos productos falten)
```bash
python update_images_supabase.py
```

El script:
- Carga solo productos con `image_url IS NULL`
- Para cada uno: busca en DuckDuckGo con hasta 4 queries distintas
- Guarda progreso en `image_search_progress.json` para poder pausar/retomar
- Muestra progreso cada 50 productos

**Si se interrumpe**, simplemente correr de nuevo:
```bash
python update_images_supabase.py
```
Retomará desde donde quedó.

---

## Task 6: Commit y deploy

**Step 1: Build para verificar sin errores TypeScript**
```bash
cd pharmacy-ecommerce/apps/web
./node_modules/.bin/next build
```

**Step 2: Commit**
```bash
cd ../../../..  # root del repo
git add pharmacy-ecommerce/scripts/import_to_supabase.js
git add pharmacy-ecommerce/scripts/update_images_supabase.py
git add pharmacy-ecommerce/apps/web/src/app/api/admin/products/import/route.ts
git add docs/plans/2026-03-06-fix-imagenes-import.md
git commit -m "fix: preserve images on Excel import, improve Python image search

- import_to_supabase.js: replace DELETE+INSERT with non-destructive UPSERT
  (UPDATE existing by external_id, INSERT truly new, never touch image_url)
- admin import route: safety check to prevent duplicate inserts
- update_images_supabase.py: multiple fallback search queries, rate limit
  handling, progress file for resumable execution

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

**Step 3: Push**
```bash
git push origin main
```

---

## Resumen de archivos

| Archivo | Cambio |
|---------|--------|
| `scripts/import_to_supabase.js` | Eliminar DELETE destructivo → UPSERT no-destructivo |
| `scripts/update_images_supabase.py` | Múltiples queries, rate limit handling, progress file |
| `src/app/api/admin/products/import/route.ts` | Safety check contra duplicados |

## Orden de ejecución

1. Correr SQL de diagnóstico en Supabase Dashboard
2. Si hay duplicados: correr el SQL de limpieza
3. Implementar fixes del código (Tasks 2, 3, 4)
4. Build → commit → push (Task 6)
5. Correr script Python para recuperar imágenes (Task 5) — **puede tardar**

> **Nota:** El script Python no necesita "compilación". Es un script interpretado. Basta con `python update_images_supabase.py`.
