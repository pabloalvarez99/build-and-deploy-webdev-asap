# Búsqueda Semántica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `match_field` + `match_value` annotation to product search results so the frontend can show a badge explaining why each result appeared (principio activo, acción terapéutica, laboratorio).

**Architecture:** The API already searches across all 4 fields (`name`, `active_ingredient`, `therapeutic_action`, `laboratory`) via the `?search=` param. The only missing piece is annotating each result with which field matched, and surfacing that in the UI as a badge per card + a context banner above results.

**Tech Stack:** Next.js 14, TypeScript, Prisma (Postgres), Tailwind CSS

---

## File Map

| File | Change |
|------|--------|
| `src/app/api/products/route.ts` | Add `getMatchField()` helper + annotate response with `match_field` + `match_value` |
| `src/lib/api.ts` | Add `match_field` + `match_value` to `ProductWithCategory` interface |
| `src/app/page.tsx` | Add `hasSemanticMatches` derived state, banner above results, badge in grid + list views |

---

## Task 1: API — annotate results with match_field + match_value

**Files:**
- Modify: `src/app/api/products/route.ts`

- [ ] **Step 1: Add `getMatchField` helper before the GET handler**

In `src/app/api/products/route.ts`, add this function after the `sanitizeImageUrl` function (after line 7):

```typescript
type MatchField = 'active_ingredient' | 'therapeutic_action' | 'laboratory' | null

function getMatchField(
  p: { name: string | null; active_ingredient: string | null; therapeutic_action: string | null; laboratory: string | null },
  q: string
): { match_field: MatchField; match_value: string | null } {
  const lq = q.toLowerCase()
  if (p.name?.toLowerCase().includes(lq)) return { match_field: null, match_value: null }
  if (p.active_ingredient?.toLowerCase().includes(lq))
    return { match_field: 'active_ingredient', match_value: p.active_ingredient }
  if (p.therapeutic_action?.toLowerCase().includes(lq))
    return { match_field: 'therapeutic_action', match_value: p.therapeutic_action }
  if (p.laboratory?.toLowerCase().includes(lq))
    return { match_field: 'laboratory', match_value: p.laboratory }
  return { match_field: null, match_value: null }
}
```

- [ ] **Step 2: Update the response mapping to include match_field + match_value**

Find the `const data = products.map((p) => ({` block (around line 114). Replace it with:

```typescript
  const searchQ = searchParams.get('search') ?? ''

  const data = products.map((p) => {
    const { match_field, match_value } = searchQ ? getMatchField(p, searchQ) : { match_field: null, match_value: null }
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price.toString(),
      stock: p.stock,
      category_id: p.category_id,
      image_url: sanitizeImageUrl(p.image_url),
      active: p.active,
      external_id: p.external_id,
      laboratory: p.laboratory,
      therapeutic_action: p.therapeutic_action,
      active_ingredient: p.active_ingredient,
      prescription_type: p.prescription_type,
      presentation: p.presentation,
      discount_percent: p.discount_percent,
      cost_price: p.cost_price != null ? p.cost_price.toString() : null,
      created_at: p.created_at.toISOString(),
      category_name: p.categories?.name ?? null,
      category_slug: p.categories?.slug ?? null,
      match_field,
      match_value,
    }
  })
```

- [ ] **Step 3: Verify build passes**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` or `Route (app)` table with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add pharmacy-ecommerce/apps/web/src/app/api/products/route.ts
git commit -m "feat(search): annotate product results with match_field + match_value"
```

---

## Task 2: Types — extend ProductWithCategory

**Files:**
- Modify: `src/lib/api.ts` (line ~215)

- [ ] **Step 1: Add match fields to ProductWithCategory**

Find `export interface ProductWithCategory extends Product {` (around line 215). Replace the entire interface with:

```typescript
export type MatchField = 'active_ingredient' | 'therapeutic_action' | 'laboratory' | null

export interface ProductWithCategory extends Product {
  category_name: string | null
  category_slug: string | null
  match_field?: MatchField
  match_value?: string | null
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd pharmacy-ecommerce/apps/web
./node_modules/.bin/tsc --noEmit 2>&1 | head -30
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add pharmacy-ecommerce/apps/web/src/lib/api.ts
git commit -m "feat(search): add match_field + match_value types to ProductWithCategory"
```

---

## Task 3: Frontend — banner + badge in grid and list views

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add hasSemanticMatches derived computation**

Find `const selectedCategoryName = categories.find(...)` (around line 306). Add right after it:

```typescript
  const hasSemanticMatches = searchTerm.length > 0 && allProducts.some(p => (p as ProductWithCategory).match_field != null)
```

Also ensure `ProductWithCategory` is imported — update the import at line ~5 from:
```typescript
import { productApi, PaginatedProducts, Category, Product } from '@/lib/api';
```
to:
```typescript
import { productApi, PaginatedProducts, Category, Product, ProductWithCategory } from '@/lib/api';
```

- [ ] **Step 2: Add banner above the products grid**

Find the `{/* Toolbar: active filters + count + view toggle */}` comment (around line 622). Add the banner BETWEEN the toolbar and the products section — right before `{/* Products */}`:

```tsx
            {/* Semantic search banner */}
            {hasSemanticMatches && (
              <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">
                Mostrando resultados con <strong>&ldquo;{searchTerm}&rdquo;</strong> en nombre, principio activo o acción terapéutica
              </p>
            )}
```

- [ ] **Step 3: Add badge in grid view**

In the grid view section, find the block that renders the product name `<h3>` (around line 717):
```tsx
                            <Link href={`/producto/${product.slug}`}>
                              <h3 className="font-bold ...">
                                {product.name}
                              </h3>
                            </Link>
                            {product.laboratory && (
                              <span className="text-sm text-slate-400 ...
```

Add the semantic badge right after the `</Link>` closing tag and before the `{product.laboratory &&` span:

```tsx
                            {(product as ProductWithCategory).match_field && (
                              <span className="inline-flex items-center text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700 mb-1 max-w-full truncate">
                                {(product as ProductWithCategory).match_field === 'active_ingredient' && `Principio: ${(product as ProductWithCategory).match_value}`}
                                {(product as ProductWithCategory).match_field === 'therapeutic_action' && `Acción: ${(product as ProductWithCategory).match_value}`}
                                {(product as ProductWithCategory).match_field === 'laboratory' && `Lab: ${(product as ProductWithCategory).match_value}`}
                              </span>
                            )}
```

- [ ] **Step 4: Add badge in list view**

In the list view section, find the block after the `<h3>` for product name (around line 777):
```tsx
                            {product.laboratory && <p className="text-sm text-slate-400 truncate">{product.laboratory}</p>}
```

Add the badge right after that line:

```tsx
                            {(product as ProductWithCategory).match_field && (
                              <span className="inline-flex items-center text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700 mt-0.5 max-w-full truncate">
                                {(product as ProductWithCategory).match_field === 'active_ingredient' && `Principio: ${(product as ProductWithCategory).match_value}`}
                                {(product as ProductWithCategory).match_field === 'therapeutic_action' && `Acción: ${(product as ProductWithCategory).match_value}`}
                                {(product as ProductWithCategory).match_field === 'laboratory' && `Lab: ${(product as ProductWithCategory).match_value}`}
                              </span>
                            )}
```

- [ ] **Step 5: Build + verify zero TypeScript errors**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build 2>&1 | tail -30
```

Expected: `✓ Compiled successfully`, `57 pages` (or similar), zero TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add pharmacy-ecommerce/apps/web/src/app/page.tsx
git commit -m "feat(search): show semantic match badge + context banner in product results"
```

---

## Task 4: Deploy + update bitacora

- [ ] **Step 1: Push to trigger Vercel deploy**

```bash
git push origin main
```

- [ ] **Step 2: Update bitacora**

Add entry to `pharmacy-ecommerce/bitacora.md` at the top (after the `## Estado actual` line):

```markdown
## 2026-04-26 — Feat: Búsqueda semántica por principio activo / acción terapéutica

- `GET /api/products?search=X` ya buscaba en `name`, `active_ingredient`, `therapeutic_action`, `laboratory`
- Nuevo: cada producto en el response incluye `match_field` ('active_ingredient' | 'therapeutic_action' | 'laboratory' | null) y `match_value` (el valor del campo)
- Homepage: badge azul en cada card indicando por qué coincidió (solo cuando match_field ≠ null, es decir, no es match por nombre)
- Homepage: banner de contexto encima de resultados cuando hay matches semánticos
- Badge visible en vista grid y vista lista
- Sin cambio de schema DB — ILIKE en 4 campos, anotación en JS post-fetch
```

```bash
git add pharmacy-ecommerce/bitacora.md
git commit -m "chore: update bitacora — semantic search feature"
git push origin main
```
