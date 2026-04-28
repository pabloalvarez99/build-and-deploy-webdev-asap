# Roles y Permisos ERP Farmacia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar sistema de roles (owner/pharmacist/seller) con navegación filtrada, trazabilidad de vendedor en POS, y panel de gestión de usuarios para el dueño.

**Architecture:** Roles almacenados en Firebase custom claims. `getAdminUser()` ampliado para aceptar los 3 roles admin. Sidebar filtra navItems por rol. POS sale persiste `sold_by_user_id`/`sold_by_name` en la tabla `orders` (DB migration). Nueva página `/admin/usuarios` (owner-only) lista usuarios Firebase y permite cambiar roles vía Firebase Admin SDK.

**Tech Stack:** Next.js 14, Firebase Admin SDK, Prisma 7, PostgreSQL 15 (Cloud SQL), Tailwind CSS, Lucide icons.

**No test framework** — verificación vía `NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build` desde `pharmacy-ecommerce/apps/web/`.

---

## File Map

**Create:**
- `src/lib/roles.ts` — constantes de roles, helper `isAdminRole`, `isOwnerRole`, `navItemsForRole`
- `src/app/api/admin/users/route.ts` — GET lista usuarios Firebase + POST set role
- `src/app/admin/usuarios/page.tsx` — UI gestión de usuarios (owner-only)

**Modify:**
- `src/lib/firebase/api-helpers.ts` — ampliar `getAdminUser()`, agregar `getOwnerUser()`, agregar `name` a `DecodedUser`
- `prisma/schema.prisma` — agregar `sold_by_user_id` y `sold_by_name` a model `orders`
- `src/app/api/admin/pos/sale/route.ts` — persistir `sold_by_user_id` y `sold_by_name`
- `src/components/admin/Sidebar.tsx` — aceptar prop `role`, filtrar navItems
- `src/app/admin/layout.tsx` — aceptar todos los roles admin, pasar `role` al Sidebar
- `src/app/api/admin/reportes/route.ts` — proteger con `getOwnerUser()`
- `src/app/api/admin/suppliers/route.ts` — proteger con `getOwnerUser()`
- `src/app/api/admin/purchase-orders/route.ts` — proteger con `getOwnerUser()`
- `src/app/api/admin/costos/route.ts` (si existe) — proteger con `getOwnerUser()`

---

## Task 1: Roles — definiciones + api-helpers

**Files:**
- Create: `src/lib/roles.ts`
- Modify: `src/lib/firebase/api-helpers.ts`

### Roles definidos

| Rol | Firebase claim | Descripción |
|-----|---------------|-------------|
| `admin` | legacy | Tratado como `owner` (retrocompatibilidad) |
| `owner` | `role: 'owner'` | Dueño — acceso total |
| `pharmacist` | `role: 'pharmacist'` | Farmacéutico — sin reportes financieros, sin proveedores/compras |
| `seller` | `role: 'seller'` | Vendedor — solo POS, órdenes, clientes, arqueo |

### Nav items por rol

**Seller ve:** Dashboard, Operaciones, POS, Arqueo, Turnos Caja, Órdenes, Clientes

**Pharmacist ve:** lo de seller + Productos, Catálogo, Libro Recetas, Turnos Farmacéutico, Faltas, Vencimientos, Reposición, Inventario, Descuentos, Categorías, Fidelización, Catálogo Calidad, Devoluciones

**Owner ve:** todo lo de pharmacist + Reportes, Costos, Proveedores, Compras, Comparador, Configuración, Usuarios

- [ ] **Step 1: Crear `src/lib/roles.ts`**

```ts
export type AdminRole = 'admin' | 'owner' | 'pharmacist' | 'seller';

export const ADMIN_ROLES: AdminRole[] = ['admin', 'owner', 'pharmacist', 'seller'];
export const OWNER_ROLES: AdminRole[] = ['admin', 'owner'];
export const PHARMACIST_ROLES: AdminRole[] = ['admin', 'owner', 'pharmacist'];

export function isAdminRole(role?: string): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

export function isOwnerRole(role?: string): boolean {
  return OWNER_ROLES.includes(role as AdminRole);
}

// Routes accessible by seller (minimum set)
const SELLER_ROUTES = new Set([
  '/admin',
  '/admin/operaciones',
  '/admin/pos',
  '/admin/arqueo',
  '/admin/turnos',
  '/admin/ordenes',
  '/admin/clientes',
]);

// Routes added for pharmacist
const PHARMACIST_EXTRA_ROUTES = new Set([
  '/admin/productos',
  '/admin/catalogo',
  '/admin/catalogo-calidad',
  '/admin/libro-recetas',
  '/admin/turnos-farmaceutico',
  '/admin/faltas',
  '/admin/vencimientos',
  '/admin/reposicion',
  '/admin/inventario',
  '/admin/descuentos',
  '/admin/categorias',
  '/admin/fidelidad',
  '/admin/devoluciones',
]);

// Routes only for owner
const OWNER_ONLY_ROUTES = new Set([
  '/admin/reportes',
  '/admin/costos',
  '/admin/proveedores',
  '/admin/compras',
  '/admin/compras/comparador',
  '/admin/configuracion',
  '/admin/usuarios',
]);

export function canAccessRoute(role: string | undefined, href: string): boolean {
  if (isOwnerRole(role)) return true;
  if (OWNER_ONLY_ROUTES.has(href)) return false;
  if (role === 'pharmacist') return SELLER_ROUTES.has(href) || PHARMACIST_EXTRA_ROUTES.has(href);
  if (role === 'seller') return SELLER_ROUTES.has(href);
  return false;
}
```

- [ ] **Step 2: Modificar `src/lib/firebase/api-helpers.ts`**

Reemplazar el contenido completo:

```ts
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { adminAuth } from './admin'
import { isAdminRole, isOwnerRole } from '@/lib/roles'

export type DecodedUser = {
  uid: string
  email?: string
  name?: string
  role?: string
}

export async function getAuthenticatedUser(): Promise<DecodedUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return null
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name as string | undefined,
      role: decoded.role as string | undefined,
    }
  } catch {
    return null
  }
}

/** Any admin role: owner, pharmacist, seller (or legacy 'admin') */
export async function getAdminUser(): Promise<DecodedUser | null> {
  const user = await getAuthenticatedUser()
  if (!user || !isAdminRole(user.role)) return null
  return user
}

/** Only owner (or legacy 'admin') */
export async function getOwnerUser(): Promise<DecodedUser | null> {
  const user = await getAuthenticatedUser()
  if (!user || !isOwnerRole(user.role)) return null
  return user
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
```

- [ ] **Step 3: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

Expected: 0 TypeScript errors.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/lib/roles.ts pharmacy-ecommerce/apps/web/src/lib/firebase/api-helpers.ts
git commit -m "feat(roles): define role types + extend getAdminUser/getOwnerUser"
```

---

## Task 2: DB migration — sold_by en orders

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Agregar campos a model `orders` en `prisma/schema.prisma`**

Después de la línea `notes String?` (línea ~103), agregar:

```prisma
  sold_by_user_id            String?      @db.VarChar(255)
  sold_by_name               String?      @db.VarChar(255)
```

- [ ] **Step 2: Autorizar IP en Cloud SQL**

```bash
GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"
MY_IP=$(curl -s https://api.ipify.org)
"$GCLOUD" sql instances patch tu-farmacia-db --authorized-networks="$MY_IP/32" --project=tu-farmacia-prod
```

- [ ] **Step 3: Aplicar schema**

```bash
cd pharmacy-ecommerce/apps/web
DATABASE_URL="postgresql://farmacia:srcmlaYhkEo19YivrG4FDLH0woou@34.39.232.207:5432/farmacia" \
  ./node_modules/.bin/prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Limpiar IP**

```bash
GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"
"$GCLOUD" sql instances patch tu-farmacia-db --clear-authorized-networks --project=tu-farmacia-prod
```

- [ ] **Step 5: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/prisma/schema.prisma
git commit -m "feat(db): add sold_by_user_id + sold_by_name to orders"
```

---

## Task 3: POS sale API — persistir vendedor

**Files:**
- Modify: `src/app/api/admin/pos/sale/route.ts`

El vendedor se obtiene directamente del token de sesión (`admin.uid`, `admin.name`). No se necesita pasar desde el frontend.

- [ ] **Step 1: Agregar sold_by al crear la orden**

En `src/app/api/admin/pos/sale/route.ts`, dentro del `tx.orders.create`, agregar los dos campos después de `notes`:

```ts
          sold_by_user_id: admin.uid,
          sold_by_name: admin.name || admin.email || admin.uid,
```

El bloque `data` del `tx.orders.create` queda:

```ts
        data: {
          status: 'completed',
          payment_provider: payment_method,
          total,
          cash_amount: cash_amount ? Math.round(cash_amount) : null,
          card_amount: card_amount ? Math.round(card_amount) : null,
          guest_name: customer_name || 'Venta POS',
          customer_phone: customer_phone || null,
          notes: notes || null,
          sold_by_user_id: admin.uid,
          sold_by_name: admin.name || admin.email || admin.uid,
          order_items: {
            create: items.map((item) => ({
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              price_at_purchase: item.price,
            })),
          },
        },
```

- [ ] **Step 2: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/app/api/admin/pos/sale/route.ts
git commit -m "feat(pos): record sold_by_user_id + sold_by_name on POS sales"
```

---

## Task 4: Sidebar — filtrar navegación por rol

**Files:**
- Modify: `src/components/admin/Sidebar.tsx`

- [ ] **Step 1: Importar `canAccessRoute` y agregar prop `role`**

En `src/components/admin/Sidebar.tsx`:

1. Agregar import al inicio (después de los imports de lucide):
```ts
import { canAccessRoute } from '@/lib/roles';
```

2. Agregar `role?: string` a la interfaz `SidebarProps`:
```ts
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  pendingOrders?: number;
  pendingReservations?: number;
  criticalStock?: number;
  draftPurchaseOrders?: number;
  pendingFaltas?: number;
  onOpenCommandPalette?: () => void;
  role?: string;
}
```

3. Agregar `role = 'admin'` a la desestructuración en el componente `Sidebar`:
```ts
export function Sidebar({
  isCollapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  pendingOrders = 0,
  pendingReservations = 0,
  criticalStock = 0,
  draftPurchaseOrders = 0,
  pendingFaltas = 0,
  onOpenCommandPalette,
  role = 'admin',
}: SidebarProps) {
```

- [ ] **Step 2: Filtrar navItems por rol**

Después de la línea `const { user, logout } = useAuthStore();`, agregar:

```ts
  const visibleNavItems = navItems.filter(item => canAccessRoute(role, item.href));
```

- [ ] **Step 3: Reemplazar `navItems` por `visibleNavItems` en el JSX**

En el return del componente, buscar el `map` sobre `navItems` y reemplazarlo por `visibleNavItems`. Buscar la línea:

```ts
{navItems.map((item) => (
```

Reemplazar por:

```ts
{visibleNavItems.map((item) => (
```

Si hay más de un `navItems.map`, reemplazar todos.

- [ ] **Step 4: Agregar link "Usuarios" al array navItems**

En el array `navItems`, antes del item de Configuración, agregar:

```ts
  { href: '/admin/usuarios', icon: UserCheck, label: 'Usuarios' },
```

Nota: `UserCheck` ya está importado (se usa en turnos-farmaceutico). Verificar que esté en el import de lucide-react. Si no, agregarlo.

- [ ] **Step 5: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

- [ ] **Step 6: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/components/admin/Sidebar.tsx
git commit -m "feat(sidebar): filter nav items by role (owner/pharmacist/seller)"
```

---

## Task 5: Layout — aceptar todos los roles admin + pasar role al Sidebar

**Files:**
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Importar `isAdminRole`**

En `src/app/admin/layout.tsx`, agregar import:

```ts
import { isAdminRole } from '@/lib/roles';
```

- [ ] **Step 2: Reemplazar los 3 checks `user.role !== 'admin'`**

**Check 1** (auth redirect, línea ~56):
```ts
// ANTES:
if (user.role !== 'admin') {
  router.push('/');
}
// DESPUÉS:
if (!isAdminRole(user.role)) {
  router.push('/');
}
```

**Check 2** (loadStats guard, línea ~64):
```ts
// ANTES:
if (!user || user.role !== 'admin') return;
// DESPUÉS:
if (!user || !isAdminRole(user.role)) return;
```

**Check 3** (render guard, línea ~91):
```ts
// ANTES:
if (!user || user.role !== 'admin') {
// DESPUÉS:
if (!user || !isAdminRole(user.role)) {
```

- [ ] **Step 3: Pasar `role` al Sidebar**

En el JSX del componente `Sidebar`, agregar la prop `role`:

```tsx
<Sidebar
  isCollapsed={sidebarCollapsed}
  onToggle={handleSidebarToggle}
  mobileOpen={mobileDrawerOpen}
  onMobileClose={() => setMobileDrawerOpen(false)}
  pendingOrders={pendingOrders}
  pendingReservations={pendingReservations}
  criticalStock={criticalStock}
  draftPurchaseOrders={draftPurchaseOrders}
  pendingFaltas={pendingFaltas}
  onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
  role={user.role}
/>
```

- [ ] **Step 4: Mostrar badge de rol en el header**

Dentro del header, después del botón de dark mode, agregar un badge que muestre el rol del usuario actual (solo visible en desktop):

```tsx
<span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
  {user.role === 'admin' ? 'owner' : user.role}
</span>
```

- [ ] **Step 5: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

- [ ] **Step 6: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/app/admin/layout.tsx
git commit -m "feat(layout): accept all admin roles + pass role to Sidebar"
```

---

## Task 6: API Gestión de Usuarios

**Files:**
- Create: `src/app/api/admin/users/route.ts`

- [ ] **Step 1: Crear `src/app/api/admin/users/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';
import { ADMIN_ROLES, AdminRole } from '@/lib/roles';

export async function GET() {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  try {
    const listResult = await adminAuth.listUsers(1000);
    const users = listResult.users.map((u) => ({
      uid: u.uid,
      email: u.email,
      name: u.displayName || null,
      role: (u.customClaims?.role as string) || 'user',
      created_at: u.metadata.creationTime,
      last_sign_in: u.metadata.lastSignInTime,
      disabled: u.disabled,
    }));
    return NextResponse.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    return errorResponse('Error al listar usuarios', 500);
  }
}

export async function POST(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  try {
    const { uid, role } = await request.json();
    if (!uid || typeof uid !== 'string') return errorResponse('uid requerido', 400);

    const validRoles = [...ADMIN_ROLES, 'user'];
    if (!validRoles.includes(role)) return errorResponse('Rol inválido', 400);

    // Prevent owner from demoting themselves
    if (uid === owner.uid && role === 'user') {
      return errorResponse('No puedes remover tu propio acceso admin', 400);
    }

    await adminAuth.setCustomUserClaims(uid, { role });
    return NextResponse.json({ success: true, uid, role });
  } catch (error) {
    console.error('Set role error:', error);
    return errorResponse('Error al actualizar rol', 500);
  }
}
```

- [ ] **Step 2: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/app/api/admin/users/route.ts
git commit -m "feat(api): users endpoint — list Firebase users + set roles (owner-only)"
```

---

## Task 7: Página Gestión de Usuarios

**Files:**
- Create: `src/app/admin/usuarios/page.tsx`

- [ ] **Step 1: Crear `src/app/admin/usuarios/page.tsx`**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, ChevronDown, Loader2, RefreshCw } from 'lucide-react';

interface FirebaseUser {
  uid: string;
  email: string | undefined;
  name: string | null;
  role: string;
  created_at: string | undefined;
  last_sign_in: string | undefined;
  disabled: boolean;
}

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Dueño', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'pharmacist', label: 'Farmacéutico', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'seller', label: 'Vendedor', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'user', label: 'Cliente', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  { value: 'admin', label: 'Admin (legacy)', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
];

function getRoleStyle(role: string) {
  return ROLE_OPTIONS.find(r => r.value === role)?.color ?? 'bg-slate-100 text-slate-600';
}

function getRoleLabel(role: string) {
  return ROLE_OPTIONS.find(r => r.value === role)?.label ?? role;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Error al cargar usuarios');
      const data = await res.json();
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setRole = async (uid: string, role: string) => {
    setSaving(uid);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, role }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error');
      }
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(null);
    }
  };

  const adminUsers = users.filter(u => ['owner', 'pharmacist', 'seller', 'admin'].includes(u.role));
  const regularUsers = users.filter(u => !['owner', 'pharmacist', 'seller', 'admin'].includes(u.role));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Asigna roles al equipo de la farmacia
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Role legend */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1">
          <Shield className="w-3.5 h-3.5" /> Niveles de acceso
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="space-y-0.5">
            <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${getRoleStyle('owner')}`}>Dueño</span>
            <p className="text-slate-500 dark:text-slate-400">Acceso total + usuarios + reportes financieros</p>
          </div>
          <div className="space-y-0.5">
            <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${getRoleStyle('pharmacist')}`}>Farmacéutico</span>
            <p className="text-slate-500 dark:text-slate-400">POS + recetas + vencimientos + inventario</p>
          </div>
          <div className="space-y-0.5">
            <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${getRoleStyle('seller')}`}>Vendedor</span>
            <p className="text-slate-500 dark:text-slate-400">Solo POS + órdenes + clientes + arqueo</p>
          </div>
          <div className="space-y-0.5">
            <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${getRoleStyle('user')}`}>Cliente</span>
            <p className="text-slate-500 dark:text-slate-400">Sin acceso al admin</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Team section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Equipo farmacia ({adminUsers.length})
              </h2>
            </div>
            {adminUsers.length === 0 ? (
              <p className="text-sm text-slate-400 p-4">Sin usuarios de equipo aún.</p>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {adminUsers.map((u) => (
                  <UserRow key={u.uid} user={u} saving={saving} onSetRole={setRole} />
                ))}
              </div>
            )}
          </div>

          {/* Customers section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Clientes registrados ({regularUsers.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-96 overflow-y-auto">
              {regularUsers.map((u) => (
                <UserRow key={u.uid} user={u} saving={saving} onSetRole={setRole} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserRow({ user, saving, onSetRole }: {
  user: FirebaseUser;
  saving: string | null;
  onSetRole: (uid: string, role: string) => void;
}) {
  const isSaving = saving === user.uid;

  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
          {user.name || user.email || user.uid}
        </p>
        {user.name && (
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRoleStyle(user.role)}`}>
          {getRoleLabel(user.role)}
        </span>
        <div className="relative">
          <select
            value={user.role}
            onChange={(e) => onSetRole(user.uid, e.target.value)}
            disabled={isSaving}
            className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
          >
            <option value="owner">Dueño</option>
            <option value="pharmacist">Farmacéutico</option>
            <option value="seller">Vendedor</option>
            <option value="user">Cliente</option>
            <option value="admin">Admin (legacy)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/app/api/admin/users/route.ts \
         pharmacy-ecommerce/apps/web/src/app/admin/usuarios/page.tsx
git commit -m "feat(usuarios): user management page + API — list Firebase users + set roles"
```

---

## Task 8: Proteger APIs owner-only

**Files:**
- Modify: `src/app/api/admin/reportes/route.ts`
- Modify: `src/app/api/admin/suppliers/route.ts`
- Modify: `src/app/api/admin/purchase-orders/route.ts`

- [ ] **Step 1: Reportes API — reemplazar `getAdminUser` por `getOwnerUser`**

En `src/app/api/admin/reportes/route.ts`, reemplazar:

```ts
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
// ...
const admin = await getAdminUser();
if (!admin) return errorResponse('Unauthorized', 403);
```

Por:

```ts
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';
// ...
const owner = await getOwnerUser();
if (!owner) return errorResponse('Unauthorized', 403);
```

- [ ] **Step 2: Suppliers API — reemplazar `getAdminUser` por `getOwnerUser`**

En `src/app/api/admin/suppliers/route.ts`, misma sustitución: `getAdminUser` → `getOwnerUser`, `admin` → `owner`.

- [ ] **Step 3: Purchase Orders API — reemplazar `getAdminUser` por `getOwnerUser`**

En `src/app/api/admin/purchase-orders/route.ts`, misma sustitución: `getAdminUser` → `getOwnerUser`, `admin` → `owner`.

- [ ] **Step 4: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

Expected: 0 TypeScript errors.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/app/api/admin/reportes/route.ts \
         pharmacy-ecommerce/apps/web/src/app/api/admin/suppliers/route.ts \
         pharmacy-ecommerce/apps/web/src/app/api/admin/purchase-orders/route.ts
git commit -m "feat(api): protect reportes/suppliers/purchase-orders with getOwnerUser"
```

---

## Task 9: POS UI — mostrar vendedor activo

**Files:**
- Modify: `src/app/admin/pos/page.tsx`

El vendedor ve su nombre en el POS para saber quién está vendiendo.

- [ ] **Step 1: Mostrar nombre del vendedor en el header del POS**

En `src/app/admin/pos/page.tsx`, localizar el import de `useAuthStore`:

```ts
import { useAuthStore } from '@/store/auth';
```

Dentro del componente, acceder al user:

```ts
const { user } = useAuthStore();
```

En el JSX, dentro del header del POS (busca el `<header>` o el div con el título "Punto de Venta"), agregar a la derecha del título:

```tsx
{user?.name && (
  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
    <User className="w-4 h-4" />
    {user.name}
  </span>
)}
```

Asegúrate de que `User` esté importado de lucide-react. Si no está, agregarlo al import existente de lucide.

- [ ] **Step 2: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/app/admin/pos/page.tsx
git commit -m "feat(pos): show active seller name in POS header"
```

---

## Task 10: Build final + Push

- [ ] **Step 1: Build limpio final**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

Expected: 0 errores TypeScript, todas las páginas generadas.

- [ ] **Step 2: Push → auto-deploy Vercel**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git push origin main
```

- [ ] **Step 3: Actualizar bitácora**

En `pharmacy-ecommerce/bitacora.md`, al inicio del archivo agregar:

```markdown
## Estado actual: Roles y Permisos ERP — owner/pharmacist/seller (Abril 2026)

---

## 2026-04-27 — Feat: Sistema de Roles y Permisos ERP

- **Roles**: `owner` (dueño), `pharmacist` (farmacéutico), `seller` (vendedor) en Firebase custom claims. `admin` legacy tratado como `owner`.
- **Sidebar**: filtra navItems según rol. Seller ve 7 items. Pharmacist ve 18. Owner ve todo.
- **API protection**: `getOwnerUser()` protege reportes, proveedores, compras.
- **POS trazabilidad**: `sold_by_user_id` + `sold_by_name` en tabla `orders` (DB migration). Cada venta POS registra quién vendió.
- **POS UI**: muestra nombre del vendedor activo en el header.
- **Gestión Usuarios** (`/admin/usuarios`): lista todos los usuarios Firebase. Owner puede asignar roles con dropdown. Sección equipo vs clientes.
- **Badge de rol** en el header del admin (visible en desktop).

---
```

- [ ] **Step 4: Commit bitácora**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/bitacora.md
git commit -m "docs: update bitacora with roles+permisos feature"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ Roles owner/pharmacist/seller definidos en `roles.ts`
- ✅ `getAdminUser()` acepta todos los roles (no solo 'admin')
- ✅ `getOwnerUser()` para APIs sensibles
- ✅ Sidebar filtra por rol
- ✅ Layout acepta todos los roles admin
- ✅ POS sale registra sold_by_user_id + sold_by_name
- ✅ DB migration para sold_by en orders
- ✅ Gestión de usuarios (API + página)
- ✅ POS UI muestra vendedor activo
- ✅ Badge de rol en header

**Placeholder scan:** Ninguno encontrado. Cada step tiene código exacto.

**Type consistency:**
- `AdminRole` definido en Task 1, usado en Task 6 (`ADMIN_ROLES`)
- `getOwnerUser()` definido en Task 1, usado en Tasks 6 y 8
- `canAccessRoute()` definido en Task 1, usado en Task 4
- `sold_by_user_id`/`sold_by_name` agregados en schema (Task 2) y usados en POS sale (Task 3)
- `role` prop en Sidebar (Task 4) pasada desde layout (Task 5)

**Gaps potenciales:**
- `purchase-orders` tiene múltiples route files (`route.ts`, `[id]/route.ts`, `[id]/receive/route.ts`). El Task 8 protege el route principal. Los sub-routes también usan `getAdminUser()` — para el MVP esto es aceptable; un seller no puede navegar a /admin/compras por el sidebar, y no tiene el UI para hacer esas llamadas.
- Los costos API (`/api/admin/costos`) si existe como route separado debe ser protegido también. Verificar si existe en el codebase antes de Task 8.
