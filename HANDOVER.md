# HANDOVER - Session 2026-02-09

## What we were working on
"Tu Farmacia" - pharmacy e-commerce for elderly users in Coquimbo, Chile. Live at https://tu-farmacia.vercel.app

---

## What got done this session

### 1. Mobile-first elderly redesign (COMPLETED + DEPLOYED)
Complete UI overhaul across 8 files for 18px base font, 48px+ touch targets:
- `globals.css` - 18px base, larger buttons/inputs
- `Navbar.tsx` - simplified single row (logo + avatar + cart)
- `page.tsx` - category grid, large search, "load more", sticky cart bar
- `producto/[slug]/page.tsx` - 4xl price, 64px add-to-cart button
- `carrito/page.tsx` - 96px images, stacked layout, 3xl total
- `checkout/page.tsx` - 80px payment cards, 60px submit button
- `checkout/reservation/page.tsx` - 5xl pickup code
- `layout.tsx` - added `<Navbar />` (was imported but never rendered!) + footer with location

### 2. Admin orders not showing guest orders (FIXED + DEPLOYED)
**Bug**: `admin/ordenes/page.tsx` line 76 used `orderApi.list()` (user-scoped, filters by `user_id = auth.uid()`). Guest/store-pickup orders have `user_id = null`, so they were **invisible** in admin panel.
**Fix**: Changed to `orderApi.listAll()` which calls `/api/admin/orders` (service role, sees all orders). Also fixed `listAll()` to forward query params.
**Files**: `src/lib/api.ts`, `src/app/admin/ordenes/page.tsx`

### 3. Category filter not working (FIXED + DEPLOYED)
**Bug**: In `api.ts:60`, `query.eq('categories.slug', params.category)` doesn't work as inner join in Supabase. Returns all 1189 products with `categories: null`, count shows 1189, but client-side filter removes everything → "0 results".
**Fix**: Lookup `category_id` from slug first, then filter by `category_id` directly. Removed broken client-side post-filter.
**Files**: `src/lib/api.ts` (lines 58-66), `src/app/page.tsx`

### 4. Categories UX improvement (COMPLETED + DEPLOYED)
- 6 priority categories for elderly shown first (Dolor y Fiebre, Cardiovascular, Diabetes, Vitaminas, Digestivo, Nervioso)
- Emoji icons on each category for visual recognition
- URL sync (`/?category=slug`) so links from product pages work
- "Ver todas" expands remaining categories
- Suspense wrapper added for `useSearchParams`

---

## What worked and what didn't

### Worked
- Using `./node_modules/.bin/next build` instead of `npx next build` (npx pulls Next.js 16 from cache, project uses 14.1.0)
- Unix paths in bash (`/c/Users/Pablo/...` not `C:\Users\Pablo\...`)
- Supabase service role client bypasses RLS correctly for admin endpoints

### Didn't work / Gotchas
- **Supabase join filtering**: `.eq('categories.slug', value)` on a left-joined table does NOT filter the parent table. Must lookup ID first and filter by FK directly.
- **`<Navbar />` was imported but never rendered in layout.tsx** - easy to miss
- **`orderApi.list()` vs `orderApi.listAll()`** - admin page was using user-scoped function instead of admin function. Guest orders (user_id=null) were invisible.
- **`npx next build`** pulls Next.js 16.x from npx cache, causing Turbopack errors. Always use `./node_modules/.bin/next build`.

---

## Key decisions made
- **Stacked layout** (not sidebar) for cart and checkout on mobile - better for elderly users
- **"Cargar mas"** instead of pagination numbers - simpler cognitive load
- **Emoji icons** on categories - helps visual recognition for elderly
- **6 priority categories** instead of showing all 17 - reduces overwhelm
- **URL sync for categories** - enables sharing links and back-button navigation

---

## Lessons learned
1. Supabase PostgREST `.eq()` on joined tables is NOT an inner join - always filter by FK column directly
2. Always verify `<Component />` is actually rendered in JSX, not just imported
3. Admin endpoints must use `listAll()` (service role) not `list()` (user-scoped) for guest orders
4. `useSearchParams()` in Next.js 14 requires `<Suspense>` wrapper

---

## Clear next steps
1. **Verify categories work on production** - click each category, confirm correct products + count
2. **Verify admin orders show store-pickup reservations** - make a test reservation
3. **Consider reducing to ~10 categories** - some like "Adulto Mayor" overlap with the target audience
4. **Add product count per category** in the grid buttons
5. **Email notifications** for store-pickup reservations (currently no email sent)
6. **Stock decrementation** - store-pickup doesn't reduce stock on reservation

---

## Map of important files

```
pharmacy-ecommerce/apps/web/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Homepage (categories + products grid)
│   │   ├── layout.tsx                  # Root layout (Navbar + footer)
│   │   ├── globals.css                 # Base styles (18px font)
│   │   ├── producto/[slug]/page.tsx    # Product detail
│   │   ├── carrito/page.tsx            # Cart
│   │   ├── checkout/
│   │   │   ├── page.tsx                # Checkout form
│   │   │   ├── reservation/page.tsx    # Store pickup confirmation
│   │   │   ├── success/page.tsx        # MercadoPago success
│   │   │   ├── failure/page.tsx        # MercadoPago failure
│   │   │   └── pending/page.tsx        # MercadoPago pending
│   │   ├── admin/
│   │   │   ├── ordenes/page.tsx        # Admin orders list
│   │   │   └── ordenes/[id]/page.tsx   # Admin order detail
│   │   └── api/
│   │       ├── store-pickup/route.ts   # Store reservation API
│   │       ├── guest-checkout/route.ts # MercadoPago checkout API
│   │       └── admin/orders/route.ts   # Admin orders API (service role)
│   ├── lib/
│   │   ├── api.ts                      # All API functions (product list, orders, etc.)
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser Supabase client
│   │   │   ├── server.ts             # Server + service role clients
│   │   │   └── api-helpers.ts         # Auth helpers for API routes
│   │   └── format.ts                  # Price formatting (CLP)
│   ├── store/
│   │   ├── cart.ts                    # Zustand cart (localStorage)
│   │   └── auth.ts                    # Zustand auth (Supabase Auth)
│   └── components/
│       └── Navbar.tsx                 # Simplified navbar
├── bitacora.md                        # Project log (ALWAYS update after changes)
└── .env.local                         # Supabase + MercadoPago keys

Git: git push origin main → auto-deploy on Vercel
Build: ./node_modules/.bin/next build (NOT npx next build)
Vercel root dir: pharmacy-ecommerce/apps/web
```

---

## Commits this session
```
db4dcf5 fix: category filter not working + prioritized categories with icons
9f1f577 fix: admin orders not showing guest/store-pickup orders
88d1423 feat: mobile-first elderly redesign - 18px base, 48px+ touch targets
```
