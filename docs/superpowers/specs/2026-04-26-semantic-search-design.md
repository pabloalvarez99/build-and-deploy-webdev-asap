# Diseño: Búsqueda Semántica por Principio Activo / Acción Terapéutica

**Fecha:** 2026-04-26  
**Estado:** Aprobado

## Problema

La búsqueda actual filtra solo por `name`. Los adultos mayores buscan por síntoma o uso ("para la presión", "ibuprofeno") sin saber el nombre comercial. `active_ingredient` y `therapeutic_action` ya existen en el schema pero no se usan en búsqueda.

## Solución

Búsqueda unificada: una sola barra, multi-campo, con badge visible en cada card indicando por qué coincidió.

## Arquitectura

### Backend — `/api/products` (GET)

Extender el `where` de Prisma cuando hay `?q=`:

```typescript
where: {
  active: true,
  OR: [
    { name: { contains: q, mode: 'insensitive' } },
    { active_ingredient: { contains: q, mode: 'insensitive' } },
    { therapeutic_action: { contains: q, mode: 'insensitive' } },
    { laboratory: { contains: q, mode: 'insensitive' } },
  ]
}
```

Anotación `match_field` post-fetch (O(n) en JS, sin SQL extra):

```typescript
function getMatchField(product: Product, q: string): MatchField {
  const lq = q.toLowerCase()
  if (product.name?.toLowerCase().includes(lq)) return null // match normal
  if (product.active_ingredient?.toLowerCase().includes(lq)) return 'active_ingredient'
  if (product.therapeutic_action?.toLowerCase().includes(lq)) return 'therapeutic_action'
  if (product.laboratory?.toLowerCase().includes(lq)) return 'laboratory'
  return null
}
```

Prioridad: `name` (sin badge) > `active_ingredient` > `therapeutic_action` > `laboratory`.

`match_value` = el valor real del campo (para mostrar en badge, ej: "Ibuprofeno 400mg").

Sin cambio de schema. Sin migración de DB.

### Tipos — `src/lib/api.ts`

```typescript
type MatchField = 'active_ingredient' | 'therapeutic_action' | 'laboratory' | null

interface ProductWithMatch extends Product {
  match_field?: MatchField
  match_value?: string
}
```

### Frontend — `ProductCard`

Badge debajo del nombre, encima del precio, solo cuando `match_field` presente:

```tsx
{product.match_field && (
  <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300
                   px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">
    {product.match_field === 'active_ingredient' && `Principio: ${product.match_value}`}
    {product.match_field === 'therapeutic_action' && `Acción: ${product.match_value}`}
    {product.match_field === 'laboratory'         && `Lab: ${product.match_value}`}
  </span>
)}
```

Badge visible solo en resultados de búsqueda (no en grid normal ni carrusel).

### UX — Banner de contexto

Cuando ≥1 resultado tiene `match_field !== null`:

```tsx
<p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
  Mostrando productos con "<strong>{q}</strong>" en nombre, principio activo o acción terapéutica
</p>
```

Resultados en lista plana — matches por nombre primero (sin `match_field`), semánticos después. Sin agrupación separada.

## Flujo de datos

```
Usuario escribe "ibuprofeno"
  → GET /api/products?q=ibuprofeno&limit=20
  → Prisma: WHERE name ILIKE OR active_ingredient ILIKE OR therapeutic_action ILIKE OR laboratory ILIKE
  → JS: anota match_field + match_value por producto
  → Response: [...products, { match_field: 'active_ingredient', match_value: 'Ibuprofeno 400mg' }]
  → Frontend: muestra badge azul en cards semánticas + banner de contexto
```

## Archivos a modificar

1. `src/app/api/products/route.ts` — extender WHERE + anotar match_field
2. `src/lib/api.ts` — tipos ProductWithMatch, MatchField
3. `src/components/ProductCard.tsx` (o equivalente) — badge
4. `src/app/page.tsx` — banner de contexto en resultados de búsqueda

## Decisiones

- **Sin migración**: ILIKE en 34K filas con LIMIT 20 es ~20ms. GIN index se agrega si hay problemas de performance.
- **Anotación en JS**: evita SQL complejo, fácil de mantener.
- **Lista plana**: sin agrupación por tipo de match — menos fricción para adultos mayores.
- **Badge solo en búsqueda**: no contamina el grid normal de productos.

## Descartado

- **PostgreSQL full-text search**: overkill para 34K productos, requiere migración.
- **Búsqueda en dos fases**: complejidad innecesaria.
- **Modo separado "buscar por síntoma"**: más fricción para el target.
