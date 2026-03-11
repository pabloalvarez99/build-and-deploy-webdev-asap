# Diseño: Sistema de Descuentos — Tu Farmacia
**Fecha:** 2026-03-04
**Estado:** APROBADO — listo para implementar

---

## Resumen
Agregar descuentos por porcentaje a productos, con vitrina llamativa en homepage.

---

## 1. Base de Datos

### Migración SQL (correr en Supabase SQL Editor)
```sql
ALTER TABLE products
ADD COLUMN discount_percent INTEGER DEFAULT NULL
CHECK (discount_percent > 0 AND discount_percent <= 99);
```
- `NULL` = sin descuento
- Rango válido: 1–99%
- Un solo campo, sin tabla extra

---

## 2. Precio con Descuento

```ts
// Mismo criterio que MercadoPago (CLP sin decimales)
const discountedPrice = (price: number, pct: number) =>
  Math.ceil(price * (1 - pct / 100));
```

Agregar a `src/lib/format.ts` (o `api.ts`).

---

## 3. Interfaz Product (src/lib/api.ts)

Agregar campo al interface `Product`:
```ts
discount_percent: number | null;
```

---

## 4. Admin — Página Productos (/admin/productos)

### Tabla
- Nueva columna **"Descuento"**: muestra badge verde `20% OFF` si tiene descuento, o `—` si no.

### Modal / Edición inline
- Campo numérico `discount_percent` (0 = sin descuento, 1–99 = con descuento).
- Preview en tiempo real: "Precio final: $4.000" mientras escribe.
- Al guardar 0 → enviar `null` a la DB.

### API
- El endpoint `PATCH /api/admin/products/[id]` ya existe — solo agregar `discount_percent` al body y al UPDATE de Supabase.

---

## 5. Homepage — Sección "Ofertas"

**Ubicación:** Entre la barra de búsqueda y las categorías.
**Condición:** Solo renderizar si hay ≥ 1 producto activo con `discount_percent NOT NULL`.

### Estructura visual
```
┌─────────────────────────────────────────┐
│  🔥 Ofertas                    Ver todas │
│  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │-20%  │ │-15%  │ │-30%  │  → scroll  │
│  │[img] │ │[img] │ │[img] │            │
│  │Parac.│ │Ibup. │ │Omep. │            │
│  │~~5k~~│ │~~3k~~│ │~~8k~~│            │
│  │$4.000│ │$2.550│ │$5.600│            │
│  └──────┘ └──────┘ └──────┘            │
└─────────────────────────────────────────┘
```

### Detalles de diseño
- Header: `🔥 Ofertas` en bold + link "Ver todas →" que filtra por `?discount=true`
- Scroll horizontal, sin paginación
- Cards: `w-36 sm:w-44`, `rounded-2xl`, `border-2 border-red-200`, `shadow-md`
- Badge de descuento: esquina superior izquierda, `bg-red-500 text-white`, `-Xpct% OFF`
- Precio original: tachado (`line-through`), gris, tamaño `text-sm`
- Precio final: `text-emerald-700 font-black text-lg`
- Botón Agregar: igual que el resto de la homepage

### Datos
- Carga directa desde Supabase en `page.tsx` (llamada separada al mount):
```ts
supabase.from('products')
  .select('*, categories(name, slug)')
  .not('discount_percent', 'is', null)
  .eq('active', true)
  .gt('stock', 0)
  .order('discount_percent', { ascending: false })
  .limit(20)
```

---

## 6. Homepage — Badge en Cards del Grid

Cuando un producto del grid tiene `discount_percent != null`:
- Badge rojo `-Xpct% OFF` sobre la imagen (esquina superior izquierda)
- Precio original tachado encima del precio final

```tsx
{product.discount_percent && (
  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-lg">
    -{product.discount_percent}% OFF
  </div>
)}
// Precio:
{product.discount_percent ? (
  <>
    <span className="text-sm text-slate-400 line-through">{formatPrice(product.price)}</span>
    <span className="text-xl font-black text-emerald-700">
      {formatPrice(discountedPrice(Number(product.price), product.discount_percent))}
    </span>
  </>
) : (
  <span className="text-xl font-black text-emerald-700">{formatPrice(product.price)}</span>
)}
```

---

## 7. Checkout — Precio correcto

En `src/app/checkout/page.tsx` y `src/app/api/guest-checkout/route.ts`:
- Al calcular el total del carrito, usar `discountedPrice(price, discount_percent)` si aplica.
- **IMPORTANTE:** El precio final debe guardarse en `order_items.unit_price` para que los reportes sean correctos.

---

## 8. Archivos a modificar

| Archivo | Cambio |
|---|---|
| Supabase SQL | ADD COLUMN discount_percent |
| `src/lib/api.ts` | Agregar `discount_percent` al interface Product |
| `src/app/admin/productos/page.tsx` | Columna + campo en modal |
| `src/app/api/admin/products/[id]/route.ts` | Incluir discount_percent en PATCH |
| `src/app/page.tsx` | Sección Ofertas + badge en cards |
| `src/app/checkout/page.tsx` | Usar precio con descuento |
| `src/app/api/guest-checkout/route.ts` | Precio final en order_items |
| `src/lib/format.ts` (o api.ts) | Helper discountedPrice() |

---

## 9. Orden de implementación

1. **SQL migration** — ADD COLUMN discount_percent
2. **Helper + interface** — discountedPrice(), Product.discount_percent
3. **Admin productos** — columna + campo en modal + API PATCH
4. **Homepage sección Ofertas** — carrusel horizontal
5. **Homepage badges en grid** — badge + precio tachado
6. **Checkout** — precio con descuento en total y order_items
7. **Build + deploy** — verificar que compila

---

## Notas
- Repo: `C:\Users\Pablo\Documents\GitHub\build-and-deploy-webdev-asap`
- Web app: `pharmacy-ecommerce/apps/web`
- Build: `./node_modules/.bin/next build` desde `apps/web/` (NO npx)
- Deploy: `git push origin main`
- Supabase project: `jvagvjwrjiekaafpjbit`
