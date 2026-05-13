# Bitácora: Tu Farmacia - E-commerce de Farmacia

## Estado actual: ERP profesional — Fase 5 inteligencia operativa (Abril 2026)

---

## 2026-05-11 — Info producto pro v3: +47 extras, alto contraste, equivalentes

**drug-info-extras**: +47 fármacos top con signos_alarma + consejos_uso (zolpidem, diazepam, lorazepam, haloperidol, quetiapina, amitriptilina, fluoxetina, venlafaxina, carbamazepina, fenitoína, levetiracetam, levodopa, donepezilo, memantina, furosemida, espironolactona, digoxina, rivaroxabán, apixabán, dabigatrán, insulina, glibenclamida, glimepirida, empagliflozina, levofloxacino, cefalexina, claritromicina, nitrofurantoína, cotrimoxazol, aciclovir, fluconazol, prednisolona, budesonida, montelukast, bilastina, fexofenadina, domperidona, metoclopramida, ondansetrón, loperamida, lactulosa, macrogol, oxibutinina, escopolamina, alopurinol, colchicina).

**Alto contraste** toggle en ProfessionalInfo: clase `prof-info-hc` + CSS override blanco/negro con bordes negros y outline focus para visión reducida. Persiste en localStorage.

**Equivalentes**: nuevo bloque en PDP cuando hay otros productos con mismo `active_ingredient`. Llama `productApi.list({active_ingredient, limit:12, in_stock:true})`, muestra hasta 6 con imagen mini + lab + precio + chip "Más económico" cuando el comparativo es más barato.

Build OK.

---

## 2026-05-11 — Info producto pro: signos alarma, FAQ, JSON-LD Drug+FAQPage

**Schema DrugInfo** extendido con campos opcionales: `signos_alarma`, `consejos_uso`, `riesgo_beers` (`EVITAR|PRECAUCION|SEGURO`), `via`, `embarazo`, `lactancia`, `receta`. Inferencia automática `inferRiesgoBeers()` desde texto cuando falta declarado.

**Nueva fuente** `src/lib/drug-info-extras.ts` (no toca las 380+ entries base): 50 fármacos top (analgésicos, AINEs, antibióticos, antihipertensivos, estatinas, metformina, levotiroxina, IBP, salbutamol, antihistamínicos, ansiolíticos, ISRS, gabapentinoides, hierro, vitaminas, sildenafil/tadalafil, tamsulosina, finasterida) con signos de alarma concretos y consejos prácticos de uso (horario, alimentos, técnica inhalador, separación con antiácidos, etc.). Merge en `lookupDrugInfo()`.

**UI ProfessionalInfo**:
- Nuevas secciones acordeón: "Cómo tomarlo correctamente", "Embarazo", "Lactancia".
- Banner rojo prominente "Cuándo consultar de urgencia" sobre acordeón cuando hay `signos_alarma`, con TTS dedicado.
- Chips de cabecera: Beers (3 niveles, color-coded), vía de administración, condición de venta.
- `BeersBadge` reutilizable.

**ProductFAQ** nuevo componente: genera FAQ dinámico desde KB (cómo tomar, dosis, urgencia, interacciones, embarazo, lactancia, adulto mayor, conservación, dosis olvidada). Marcado microdata Question/Answer.

**JSON-LD enriquecido** en `producto/[slug]/page.tsx`:
- `Product.additionalProperty`: principio activo, presentación, condición de venta, vía.
- Nuevo nodo `Drug`: activeIngredient, indication, contraindication, interactingDrug, adverseOutcome, administrationRoute, pregnancyCategory.
- Nuevo nodo `FAQPage` con mainEntity Question/Answer (mejora rich results Google y AI summaries).

Build OK. PDP bundle 12.4 → 13.1 kB.

---

## 2026-05-10 — KB drug-info push V2: 99,5% cobertura catálogo

Segunda iteración tras `a176d76`. Cobertura **91,0% → 99,5%** (999/1004 productos).

**Fixes**:
- Rename KB key `GLUCOSAMINA + CONDROITINA` → `CONDROITINA + GLUCOSAMINA` (orden alfabético para que sorted-combo match funcione).
- Fix alias `ACE.DE RICINO` → `ACE DE RICINO` (tokenizer ya strippea el punto).

**~40 entradas nuevas**: alcanfor, mentol, eucalipto, salicilato de metilo, calamina, difenhidramina, cetilpiridinio, alantoína, bacitracina, neomicina, levodopa, carbidopa, benserazida, budesonida, formoterol, sulfametoxazol, trimetoprim, tinidazol, miconazol, paroxetina, piridoxina, doxilamina, hipromelosa, dextran, subsalicilato bismuto, atapulgita, nifuroxazida, atropina, papaverina, clordiazepóxido, clidinio, azufre, eugenol, ac. undecilénico, alquitrán, alumbre, aloína, linaza, fenol, vaselina, silicona, miristato isopropilo, pantenol, papaína, fluoruro de sodio, mometasona, penicilina, selenio, sodio, fosfato sodio, soja, palto, miel, consuelda, hamamelis, espino, propifenazona, benzocaína, xilometazolina, antazolina. + categorías genéricas para fórmulas multinutrientes/fito (POLIVITAMINICO, PROTECTOR SOLAR, EMOLIENTE, FITO VENOTONICO, FITO ANTIDIARREICO, FITO BUCAL, FITO ESPASMOLITICO, TOPICO RESPIRATORIO, LAXANTE ESTIMULANTE, LAXANTE NATURAL, HOMEOPATICO).

**~60 aliases nuevos** mapean variantes (CALCIFEDIOL→VITAMINA D3, HIDROXOCOBALAMINA→CIANOCOBALAMINA, DIMETICONA→SIMETICONA, POLIETILENGLICOL→MACROGOL, BIFOSFATO/FOSFATO/FOSFATO DISODICO→FOSFATO SODIO, MOMETASONA FUROATO→MOMETASONA, BURSA PASTORIS/CASTAÑO INDIAS→FITO VENOTONICO, etc.).

KB final: **376 keys, 154 aliases**. Beers EVITAR aplicado en: difenhidramina, doxilamina, paroxetina, atropina sistémica, clordiazepóxido, clidinio, fitoespasmolítico (belladona).

5 productos residuales sin cobertura (0,5%): edge cases con formato de dosis raro o ingredientes muy específicos (THUJA D4 homeopatía dosis variable, OX.ZINC con dosis pegada al punto, etc.).

Build OK. Push → Vercel.

---

Expansión masiva de `src/lib/drug-info.ts`: de 132 a 304 principios activos y de 40 a ~95 aliases de nomenclatura.

**Cobertura**: 59,9% → **91,0%** de productos con `active_ingredient` (914/1004).

Categorías nuevas:
- Anticonceptivos/hormonales (etinilestradiol, levonorgestrel, dienogest, drospirenona, gestodeno, desogestrel, medroxiprogesterona, estradiol, estriol, progesterona, didrogesterona, tibolona, testosterona).
- Antiácidos/GI (alginato, bicarbonato, carbonato calcio, hidróxido aluminio/magnesio, sucralfato, lansoprazol, loperamida, ondansetrón, metoclopramida, trimebutino, mebeverina, escopolamina, picosulfato, sen, difenidol, dimenhidrinato, racecadotrilo).
- Cardio/metabólico (ciprofibrato, fenofibrato, lovastatina, rosuvastatina, captopril, metildopa, hidralazina, nifedipino, espironolactona, furosemida, digoxina, nebivolol, betaxolol, doxazosina, isosorbide, clopidogrel, **rivaroxabán**, colchicina, trimetazidina).
- Diabetes (dapaglifozina, linagliptina, vildagliptina, glibenclamida).
- Psicofármacos/neuro (bupropión, mirtazapina, venlafaxina, desvenlafaxina, citalopram, imipramina, trazodona, olanzapina, haloperidol, eszopiclona, baclofeno, topiramato, levetiracetam, fenitoína, primidona, litio, memantina, eletriptán, naratriptán, hidroxicloroquina, tamoxifeno, anastrozol, metotrexato, ác. ibandrónico, tiocolchicósido).
- Antibióticos/antifúngicos/antivirales (cloxacilina, flucloxacilina, cefradina, levofloxacino, claritromicina, eritromicina, cloranfenicol, mebendazol, itraconazol, amorolfina, ciclopiroxolamina, tolnaftato, fenticonazol, valaciclovir).
- Respiratorios/antihistamínicos (ipratropio, montelukast, teofilina, N-acetilcisteína, desloratadina, rupatadina, hedera helix, pelargonium).
- Oftálmicos (latanoprost, dorzolamida, pilocarpina, olopatadina, nafazolina, oximetazolina).
- Urología (tolterodina, trospio, flavoxato).
- Dermo (tretinoína, urea, hidrocortisona, capsaicina, dexpantenol, povidona yodada, ác. hialurónico, triclosán, ác. salicílico/glicólico/láctico).
- OTC/químicos (alcohol denat./isopropílico, peróxido de hidrógeno, suero fisiológico, glicerina, DEET, aceite de ricino, manteca de cacao).
- Vitaminas/minerales (vit. E, A, B1, biotina, DHA, hierro, óx./sulfato zinc, potasio, magnesio, ac. hígado de bacalao).
- Fitoterapia (valeriana, pasiflora, melisa, manzanilla, árnica, aloe vera, centella, propóleo, cranberry, moringa, echinacea, cimicifuga, cardo mariano, resveratrol, colágeno, psyllium, levadura cerveza).
- Otros (orlistat, levosulpirida, otilonio, avanafilo, fentermina, piroxicam, indometacina, flurbiprofeno, lactobacillus/saccharomyces como probióticos por cepa).

**Reglas**: precauciones Beers donde aplica (marcado EVITAR), posología adulto, lenguaje claro adulto mayor, dosis "según indicación médica" cuando variable.

Sin cambios en UI ni schema. Build local OK.

---

## 2026-05-10 — Info profesional por producto (prospecto adulto mayor)

Nueva sección "Información profesional" en `/producto/[slug]` para cada medicamento.

**KB curada** `src/lib/drug-info.ts`: 80+ principios activos (los más vendidos en farmacia ambulatoria CL) con 8 secciones cada uno:
- Composición/categoría · Indicaciones · Posología · Efectos adversos · Contraindicaciones · **Precauciones adulto mayor** (criterios Beers) · Interacciones · Conservación

Fuente: Formulario Nacional ISP Chile + Vademécum + Beers Criteria.

**Lookup** `lookupDrugInfo(active_ingredient)`:
- Tokeniza el campo `active_ingredient` de DB (split por `,` `+` `Y`, strip dosis/unidades/tildes).
- Match combinación completa (ej "PARACETAMOL + TRAMADOL") o componente individual.
- Alias de nomenclatura local (AAS→ÁCIDO ACETILSALICÍLICO, etc.).
- Zero costo, zero migración: archivo TS server+client.

**UI** `ProfessionalInfo.tsx`:
- Tipografía grande (text-base/lg), iconos por sección, acordeón por principio activo (primero abierto).
- Banner ámbar prominente: "Información referencial. Consulte a su médico/farmacéutico" (cobertura legal).
- Solo aparece si el producto tiene `active_ingredient` con match en KB (medicamentos), invisible en pañales/dermo.
- Footer cita fuentes.

Wire en `ProductPageClient.tsx` debajo de Descripción.

Build local OK. `/producto/[slug]` pasó de 17→30 kB.

Próximo: ampliar KB cola larga (oftálmicos, dermo OTC) cuando admin reporte productos sin info.

---

## 2026-05-09 — V12 Sweep P2/P3 audit extendido (R2/R5/R17/R19)

Cierre 4 diferidos del audit V11:

- **R2** mis-pedidos `handleReorder`: `for await` secuencial → `Promise.allSettled` paralelo. N items = 1 round-trip concurrente vs N serial.
- **R5** mis-pedidos: toast inline `role="alert"`/`status` (3.5s auto-dismiss) — "X de Y agregados, Z sin stock — revisa carrito" o "No se pudo agregar ningún producto" (sin redirect cuando todos fallan).
- **R17** cotización dropdown click-outside: `searchWrapperRef` + `useEffect` `mousedown` listener cierra `dropdownOpen`. `onFocus` reabre si hay results.
- **R19** cotización search race: `cancelled` flag pattern (productApi.list no acepta `signal`, refactor evitado). Stale setState ignorado.

Audit canonical V11+V12: 11/19 cerrados, 7 diferidos P3 cosméticos (R1/R3/R4/R10/R11/R16/R18). Build OK.

---

## 2026-05-09 — V11 Audit extendido (rastrear / cotización / mis-pedidos)

Audit canonical extendido a 3 rutas no cubiertas. 19 hallazgos totales, **7 cerrados P1** (rutas críticas adulto mayor):

### /rastrear-pedido
- **R6** `<label>` sin `htmlFor` → 2 pares input (`track-order-id`, `track-contact`) ahora asociados. Click label foca input, SR anuncia.
- **R7** contact input `autoComplete="email"` confuso (acepta phone) → `autoComplete="off"` + `inputMode="email"` (mobile keyboard email default).
- **R8** error div → `role="alert" aria-live="assertive"`.
- **R9** result section → `role="region" aria-label aria-live="polite"`.
- **R12** submit btn → `aria-busy={isLoading}`.

### /cotizacion
- **R13** search input sin label → `<label htmlFor="quote-search">` + `autoComplete="off"`.
- **R14** quantity btns `w-6 h-6` (≈27px en html 18px) sub-44px → `w-11 h-11` + `aria-label` dinámico por producto.
- **R15** remove btn `p-1.5` (≈28px) sub-44px → `min-w-[44px] min-h-[44px]` + `aria-label`.

Diferidos (12, P2/P3): R1-R5 mis-pedidos (reorder Promise.all + toast fail), R10-R11 rastrear (copy code, Suspense skeleton), R16-R19 cotización (keyboard nav listbox, click-outside dropdown, print style global, AbortController search).

Build OK 160/160. Commits: `<TBD>`.

---

## 2026-05-09 — V10 Mobile sweep close (M2 / M10)

- **M2** Home no-cart: scrollTop estaba en `right-4 bottom-20` (80-128px) → overlap WhatsApp FAB `right-4 bottom-6rem` (96-152px). Fix: `left-4` incondicional + `bottom-[calc(1rem+env(safe-area-inset-bottom))]` cuando no carrito (mantiene `bottom-[calc(5.5rem+...)]` con carrito). `page.tsx:421-432`. No regresión: con carrito ya estaba en left-4.
- **M10** `globals.css:11` `html { font-size: 18px }` → decisión diseño aceptada (target adulto mayor Coquimbo). Tailwind `text-*`/`w-*` rem-based ↑12.5% sistémico, intencional. Externos (lucide vía className `w-N h-N` = rem) escalan parejo. No regresión visible. Sin fix, marcado accepted.

Build OK. Sweep cierra Mobile **10/10**. Audit residual: P1 (RSC home refactor, alto esfuerzo), U12 (receta migration, alto esfuerzo). Commit `1db05e9`.

---

## 2026-05-09 — V5 Globals + Navbar + a11y sistémico (A15 / M9)

- **A15** Navbar density mobile: theme toggle `hidden sm:flex` (oculto <640px). Movido a user dropdown como item adicional `sm:hidden` con label "Modo claro/oscuro". Reduce 3 botones contiguos (avatar+cart+theme) a 2 en mobile 320px. `Navbar.tsx:107-120` + bloque dropdown.
- **M9** WhatsAppButton: `bottom-[7.5rem|24|6]` clases Tailwind → `style.bottom = calc(<base> + env(safe-area-inset-bottom, 0px))`. iPhone X+ home indicator ya no pisa FAB. `WhatsAppButton.tsx:20-32`.
- **A1/P4** confirmado: `globals.css:79-99` ya restringe transition (color/bg/border 200ms) a lista explícita (`body, .card, .btn*, .input, .glass-nav, nav, header, footer, button, a`) — selector universal `*` ya removido en sesión previa. Cerrado.
- **A7** confirmado: WhatsAppButton ya sin `opacity-90` (solo hover scale). Cerrado.
- **skip-link** `layout.tsx:135` verificado: `sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100]` — visible al Tab desde URL bar. OK.

Build local OK (160/160). NO regresiones LH esperadas (sin tocar globals cascada). Sin tocar checkout/PDP/home (verticales V1-V4).

---

## 2026-05-09 — V2 PDP polish + perf (A8 / U2 / M6 / P5 / P6)

- **A8** `<h1>` ProductPageClient line 183 → `id="product-title" tabIndex={-1} focus:outline-none`. Permite focus programático al navegar.
- **U2** Reemplaza `setTimeout(router.push('/carrito'), 800)` con success card `role="status" aria-live="polite"` + 2 botones grandes (min-h 56px): "Ver carrito" / "Seguir comprando". Usuario decide flow.
- **M6** PDP grid `md:grid-cols-2` → `sm:grid-cols-2`. Tablet 640-768px deja 2 col en vez de stacking. `pb-28 md:pb-0` → `pb-28 sm:pb-0` (sticky bar escondido sm+).
- **P5** Confirmado: `getProductBySlug` ya envuelto en `React.cache` (page.tsx:14) → dedupe `generateMetadata` + page (1 sola query Prisma por request). Cerrado.
- **P6** `page.tsx` ahora serializa producto server-side y lo pasa como `initialProduct` prop a `ProductPageClient`. Cliente elimina `loadProduct` effect + estado `isLoading` + skeleton (no más flicker post-hidratación). Related products siguen cargando lazy.
- **DEFER U12**: reserva `prescription_pending` requiere migration Prisma `orders.prescription_pending Boolean` + cambios api orders. Fuera de scope V2.

Build local OK (160/160 static pages). Vercel deploy auto. Commit: `d0b2cc8`.

---

## 2026-05-09 — Audit batch P2 cont. (A10 cart qty 48px, M3 payment grid stack, M4 carrito img w-20)

- **A10** Carrito qty buttons mobile 44→48px (`w-11 h-11` → `w-12 h-12` mobile, sm+ unchanged 56px). `carrito/page.tsx:133,142`.
- **M3** Checkout payment method grid stack vertical en `<sm`: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`. Botones "Pagar en tienda"/"Pagar con Webpay" no aprietan en 320px. `checkout/page.tsx:367`.
- **M4** Carrito imagen mobile 96→80px: `w-24 h-24` → `w-20 h-20` mobile, sm+ 112px sin cambios. Más espacio para nombre + controls. `carrito/page.tsx:84`.
- **M8** confirmado ya cerrado en sesión previa (modal `max-w-[calc(100vw-2rem)]`).

Build local OK.

---

## 2026-05-09 — Audit batch P2 (A9 zoom hint, A16 placeholder responsive, M9 footer Cotizar)

Continuación tras cierre A11y/LCP. Batch 3 items P2 audit `ui-audit-2026-05-08.md`.

- **A9** PDP zoom hint mobile: badge `opacity-0 group-hover:opacity-100` invisible en touch. Cambio: `opacity-100 sm:opacity-0 sm:group-hover:opacity-100` + texto "Toca para ampliar" (mobile) / "Ampliar" (desktop). `ProductPageClient.tsx:147-151`.
- **A16** Hero placeholder responsive: `useEffect`+`matchMedia('(max-width: 480px)')` → "Buscar medicamento..." mobile vs "Ej. paracetamol, vitamina D, pañales..." desktop. `Hero.tsx:32-39,68`.
- **M9** Footer nav: agregar link "Cotizar receta" → `/cotizacion` (col 2 entre Carrito y Mis Pedidos). `layout.tsx:162`.
- **M11** descartado: PDP qty selector ya tiene +/- buttons (`ProductPageClient.tsx:311-318`). Audit outdated.

Build local OK (Next 14.2.35). Sin regresiones LH esperadas (cambios DOM mínimos, mismo bundle ~111kB PDP).

---

## 2026-05-09 — Cierre A11y ≥95 + LCP mobile <2.5s (Lighthouse final 100/100/96/100 D, 94/100/100/100 M)

Sesión enfocada en cerrar gaps Lighthouse pendientes del audit UI 2026-05-08. 6 commits (`654fe69..ae39a95`).

**Diagnóstico**:
- A11y D 81 / M 86 con 22/20 `color-contrast` fails (todos `bg-cyan-600` + white "Agregar" → 3.68:1, requiere 4.5).
- LCP M 3.8s (target <2.5s). Breakdown: TTFB 173ms ✓, `elementRenderDelay` 2376ms ❌. Elemento LCP = hero `<p>` "Busque su producto…".

**Fixes**:

1. **Contraste (`654fe69` + `4bcb474`)** — Override `globals.css` con `!important` (Tailwind utility cascade ganaba a override no-prioritario):
   - `.text-slate-400 → #475569` (7.46:1, era 2.85)
   - `.text-slate-300 → #475569` (era 1.61, fail crítico)
   - `.bg-cyan-600 → #0e7490` light AND `html.dark` (era #0891b2 dark, LH headless probablemente emula `prefers-color-scheme:dark` activando theme script)

2. **LCP refactor (`3ac5000` + `8e99503`)** — Root cause: `'use client'` + `useSearchParams()` → Suspense bailout durante SSR → fallback `<div blank>` enviado, hero text aparecía recién post-hydration.
   - Paso 1: fallback ahora SSR completo del hero (`HeroFallback` con `<p>` idéntico).
   - Paso 2 (definitivo): drop `useSearchParams()` hook, leer `new URLSearchParams(window.location.search)` dentro de `useEffect` post-mount → cero suspend → SSR ship hero real desde inicio.

3. **A11y SC fails (`97e197b` + `ae39a95`)**:
   - `aria-allowed-attr`: input `#hero-search` ahora `role="combobox"` (permite `aria-expanded`).
   - `button-name`: 2 chevron carousel topSellers → `aria-label="Anterior"/"Siguiente"`.
   - `link-name`: `<Link>` que envuelven `<Image>` producto → `aria-label={product.name}` en `ProductCard.tsx` + 4 instancias `page.tsx`.
   - `link-name` mobile: Navbar login `<Link href="/auth/login">` con `<span hidden sm:block>Ingresar</span>` → `aria-label="Ingresar"`.
   - `label-content-name-mismatch`: Navbar brand `<Link aria-label="Tu Farmacia">` con visible "tufarmacia" → drop `aria-label` (visible text suficiente).

**Lighthouse final** (`https://tu-farmacia.cl?v=cb&disable-cache`):

| | Perf | A11y | BP | SEO | LCP | FCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Desktop | **100** | **100** | 96 | 100 | 0.6s | 0.3s | 0ms | 0.011 |
| Mobile | **94** | **100** | 100 | 100 | **1.9s** | 1.2s | 270ms | 0.002 |

Baseline 2026-05-08: D 100/81/96/100 LCP 1.4s · M 85/86/100/100 LCP 3.8s.
**Deltas**: D A11y +19, M Perf +9 / A11y +14 / **LCP -50% (3.8s → 1.9s)**. 0 a11y fails. 0 color-contrast fails.

**Build/deploy**: `NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build` local OK 6 veces. Vercel Ready 6 deploys (`654fe69`, `3ac5000`, `4bcb474`, `8e99503`, `97e197b`, `ae39a95`). Smoke 200 en `/`, `/productos`, `/carrito`, `/checkout`, `/cotizacion`, `/seguimiento/test`.

**Diferidos** (P2/P3 audit): U14 clear-search btn size, A10 cart qty 48px, M5 carrusel snap, M8 modal Webpay maxw, U9 undo toast eliminar, breadcrumbs JSON-LD, empty state filtros `/productos`. Smoke real-token tracking sin `.env.prod-temp` también diferido.

**Lección**: Tailwind utility con misma especificidad que override custom necesita `!important` o `@layer utilities` para ganar cascade aunque venga después en archivo. `useSearchParams()` en client component fuerza Suspense bailout aunque solo se lea una vez en mount — usar `window.location.search` evita el bailout y permite SSR completo.

**P2/P3 batch (`3700fe9`)** — Sesión 2 mismo día:
- Cart undo toast: `removeFromCart` envuelto en `handleRemove(id, name, qty)`, muestra toast 5s con btn "Deshacer" (`RotateCcw`) que llama `addToCart(id, qty)`. Posicion `bottom-24` mobile / `bottom-6` desktop, `aria-live="polite"`.
- Carruseles home (frequent/topSellers/discount): `snap-x snap-mandatory` en scroll container + `snap-start` en cards `w-36` → swipe mobile alinea card al borde.
- `/productos` clear-search btn: `w-7 h-7` → `w-11 h-11` (44px tap target, color slate-500 → slate-700 contraste).
- `/productos` empty-state "Limpiar filtros" btn: text-link → primary cyan-600 `min-h-[48px]` con icono.
- Webpay confirm modal: `max-w-md` → `max-w-[calc(100vw-2rem)] sm:max-w-md` + `p-4 sm:p-6` (no overflow viewport <340px).
- `PushOptInButton` + `InstallPWAButton` "Ahora no" btn (`202815a`): drop `aria-label="Descartar"` mismatch + bump `text-gray-500` (3.75:1 fail) → `text-slate-700/200` 44px min. Cierra `color-contrast` + `label-content-name-mismatch` regresiones detectadas en post-batch LH.

**LH post-P2/P3 (`202815a`)**: D 100/100/96/100 LCP 0.6s · M 90/100/100/100 LCP 2.3s (cached). Mantiene 0 a11y fails.

---

## 2026-05-08 — Verificación sprint paralelo 6 sesiones + migration `tracking_token` aplicada Cloud SQL prod

Cierre sprint frontend cliente. 10 commits desde `dc64a82` (`a7e0d24`..`adf5e46`): home redesign adulto mayor, PDP zoom + low-stock + sticky CTA, search global autocomplete, checkout progress + sticky bar + inline validation, catálogo `/productos` filtros + sort + infinite scroll, P0 fixes (clearCart post-success Webpay, modal a11y, inputMode), perf `React.cache` PDP, audit UI 41 issues, tracking público.

**Migration aplicada `tu-farmacia-prod`**:

- `prisma/migrations/20260508_add_tracking_token.sql` ejecutada vía `scripts/run-migration.mjs` (BEGIN/COMMIT atómico, `@google-cloud/cloud-sql-connector`).
- Primer intento falló: `function gen_random_bytes(integer) does not exist` → añadido `CREATE EXTENSION IF NOT EXISTS pgcrypto` al SQL → OK.
- Verify: columna `tracking_token VARCHAR(64)` ✅, índice único `orders_tracking_token_key` ✅, **52/52 órdenes con backfill** (0 NULL) ✅.

**Build + deploy + smoke**:

- `NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build` local OK. `/seguimiento/[token]` + `/api/tracking/[token]` ƒ dynamic en route table.
- Vercel `Ready Production` (`adf5e46`).
- Smoke: `/`, `/productos`, `/carrito`, `/checkout`, `/rastrear-pedido` → 200.
- `/api/tracking/INVALID_TOKEN` → 400 `{"error":"Token inválido"}` (no 500 — fix migration confirmado). Token bien-formado inexistente → 404 `{"error":"Pedido no encontrado"}`.
- `/seguimiento/INVALID` → 200 + `<meta name="robots" content="noindex, nofollow">` (Next 14 force-dynamic `notFound()` retorna 200 status, meta robots bloquea SEO; aceptable).

**Lighthouse**: pendiente próxima sesión (sin headless Chrome runner). Targets vigentes: SEO 100, A11y ≥95, Perf ≥80, TBT <600ms, LCP <2.5s.

**P2/P3 audit pendientes** (`audits/ui-audit-2026-05-08.md`, 30 issues): focus-visible global, skip-link landmark, aria-live cart, contraste secundario, route-level dynamic import floating UI, image `sizes` grids, prefetch hover Navbar, empty states `/productos`, breadcrumbs PDP/categoría, error boundary `/seguimiento`, `pull-to-refresh` `/mis-pedidos`.

---

## 2026-05-08 — Feat: tracking público pedido `/seguimiento/[token]` (sin login)

Cliente recibe link único en email post-compra → ve estado pedido sin crear cuenta. Reduce fricción soporte (WhatsApp queries "¿cómo va mi pedido?").

- **Schema**: `orders.tracking_token VARCHAR(64) UNIQUE NULL` (Prisma `schema.prisma`).
- **Migration**: `prisma/migrations/20260508_add_tracking_token.sql` con `ALTER TABLE` + índice único + backfill (`encode(gen_random_bytes(24), 'hex')` para órdenes existentes).
- **Token**: `crypto.randomBytes(24).toString('hex')` = 48 chars hex, validado regex `/^[a-f0-9]{32,64}$/i`.
- **Helper** `src/lib/tracking.ts`:
  - `generateTrackingToken()` + `trackingUrl(token)` (respeta `NEXT_PUBLIC_BASE_URL` con `.trim().replace(/\/$/, '')`).
  - `statusToTimeline(status, payment_provider)` → 5 steps user-facing (`Pedido recibido → Pago/Reserva → Preparando → Listo retiro → Entregado`), maneja `cancelled/rejected`.
- **Generación en checkout**:
  - `/api/store-pickup` setea `tracking_token` + retorna en JSON + pasa a email reservation.
  - `/api/webpay/create` setea `tracking_token` al crear order pendiente. `/api/webpay/return` selecciona campo y lo pasa a `sendWebpayConfirmation`.
- **Email**: `sendWebpayConfirmation` y `sendPickupReservationEmail` aceptan `trackingToken?` y agregan CTA verde "Seguir mi pedido →" apuntando a `/seguimiento/{token}`.
- **API pública** `GET /api/tracking/[token]` (`runtime: 'nodejs'`, `force-dynamic`):
  - Valida regex token. 400 si inválido, 404 si no existe.
  - Retorna subset seguro: status, total, payment_provider, pickup_code, expires, items, customer name. NO email/phone/user_id.
- **Página** `/seguimiento/[token]/page.tsx` (Server Component):
  - `metadata.robots: { index: false, follow: false }` — no indexable.
  - Banner adaptativo: cancelado (rojo) / listo retiro (verde con código grande monoespaciado tracking-[0.3em]) / entregado / preparando (cyan).
  - Timeline 5-step con íconos lucide, dot states (done/active/pending/cancelled), ring-4 en active.
  - Lista items con totales por línea + total general.
  - CTA WhatsApp `wa.me/56993649604` con mensaje pre-rellenado `Hola! Consulta sobre mi pedido #{shortId}`.

**DB pendiente**: aplicar migration en Cloud SQL antes de deploy. Sin la columna, `prisma.orders.create` con `tracking_token` lanzará. Comando: `npx prisma db push` (con `DATABASE_URL` apuntando a Cloud SQL via proxy) o aplicar SQL directo en `migrations/20260508_add_tracking_token.sql`.

Build local OK (`/seguimiento/[token]` 187 B, dynamic). `tsc --noEmit` source clean.

---

## 2026-05-08 — Feat: `/productos` catálogo con filtros laterales + sort + infinite scroll

Nueva página dedicada al catálogo (separada del homepage `/` que mantiene scrollers/promos). URL state shareable.

- `src/app/productos/page.tsx` (Suspense + `useSearchParams`/`router.replace`):
  - Filtros: categoría (radios), rango precio min/max CLP, en stock, con descuento.
  - Sort dropdown: relevancia, más recientes, precio asc/desc, nombre A-Z (mapea a `sort_by` API existente).
  - Búsqueda con debounce 400ms (mismo patrón que homepage).
  - Infinite scroll vía `IntersectionObserver` (rootMargin 600px), `limit=24` por página.
  - Mobile: drawer con overlay tap-to-close, botón "Ver N productos" sticky bottom.
  - Chips de filtros activos con remove individual + "Limpiar todo".
  - Empty state con CTA limpiar filtros.
- `src/components/catalog/Filters.tsx` — sidebar reusable (variant `sidebar` | `drawer`).
- `src/components/catalog/SortSelect.tsx` — `<select>` nativo accesible (caret custom).
- `src/components/catalog/ProductCard.tsx` — card extraída (4-col xl, 2-col mobile), priority/fetchPriority en primeros 3, badge descuento, overlay AGOTADO.
- API existente `/api/products` ya soporta `category`, `min_price`, `max_price`, `in_stock`, `has_discount`, `sort_by`, `search` con `unstable_cache` (revalidate 300s) → cero cambios backend.
- A11y: targets ≥44px, labels asociadas, fieldsets/legends, `aria-label` en buttons icon-only.

Build local: ENOENT carrera fs Windows (sesión paralela editando checkout/* simultáneamente: 500.html rename + `_ssgManifest.js` write). Compile + lint + 160/160 page-gen pasaron. `tsc --noEmit` source clean (errores solo en `.next/types/` stale, no en `src/`). Vercel Linux no afectado.

---

## 2026-05-08 — Checkout UX: progress indicator, sticky mobile bar, validación inline

Optimización `/carrito` + `/checkout` (mantiene Webpay flow + retiro tienda intactos). Modelo es solo retiro en tienda — autocomplete dirección Coquimbo descartado por no encajar.

- **Nuevo componente** `src/components/CheckoutProgress.tsx`: 3 steps (Carrito → Datos → Pago), íconos lucide, estados done/active/pending, accesible (`<nav aria-label>`, `aria-current="step"`).
- **`/carrito`**: render `<CheckoutProgress current={1} />`. Sticky bottom bar mobile (`md:hidden`, `fixed bottom-0 z-40`) con Total + CTA "Continuar". Container con `pb-28 md:pb-6`.
- **`/checkout`**:
  - Render `<CheckoutProgress current={2} />` debajo del header.
  - **Validación inline por campo**: estado `fieldErrors` + `touched`. Validators puros (`validateName`/`validatePhone`/`validateEmail`). `useEffect` re-valida campos tocados en cada cambio. Error inline con `<AlertCircle>` + `aria-invalid` + `aria-describedby`. `inputMode="tel"`/`"email"`.
  - `canSubmit` deriva de validación real.
  - **Sticky mobile CTA**: botón principal `hidden md:flex`. Barra mobile fija con Total efectivo + botón compacto. Container `pb-28 md:pb-6`.
  - Email opcional para retiro tienda preservado; required solo para Webpay.
  - Guest checkout intacto (no fuerza login).

Archivos: `src/components/CheckoutProgress.tsx` (nuevo), `src/app/carrito/page.tsx`, `src/app/checkout/page.tsx`.

Build: 160/160 páginas OK. ENOENT en `.nft.json` = quirk Windows pre-existente, Vercel (Linux) OK.

---

## 2026-05-08 — PDP mejora: zoom, badge stock bajo, sticky mobile add-to-cart

Mejoras a `/producto/[slug]` (`ProductPageClient.tsx`) para UX adultos mayores y mobile.

- **Imagen con zoom**: click en imagen abre modal fullscreen (z-60, fondo black/90, X cerrar, Escape cierra, body overflow lock). Hint visual: ícono `ZoomIn` aparece on hover, `cursor-zoom-in`, scale-105 group-hover.
- **Badge stock bajo prominente**: cuando `stock > 0 && stock < 10`, badge naranja top-right en imagen ("Solo X disponible/s"). Suma al texto existente bajo selector de cantidad.
- **Sticky mobile add-to-cart bar**: barra fija bottom (md:hidden, z-40) con precio (tachado + final si discount) + botón "Agregar" (min-h 56px, cyan-600). Respeta `env(safe-area-inset-bottom)`. Solo activa si `stock > 0` y producto venta directa (no receta). Container con `pb-28 md:pb-0` para evitar overlap.
- Galería real no aplica: schema sólo tiene `image_url` único; zoom modal cubre necesidad de detalle.
- Productos relacionados ya existían (4 misma categoría, en stock).
- Tap targets ≥48px y fonts ≥16px ya cumplían; nada que tocar.

Archivos: `src/app/producto/[slug]/ProductPageClient.tsx`. Build local OK (`/producto/[slug]` 8.69 kB).

---

## 2026-05-08 — Home redesign: hero búsqueda + categorías destacadas (UX adultos mayores)

Rediseño `/` priorizando legibilidad y tap targets para clientes mayores.

- Nuevo `src/components/home/Hero.tsx` — bloque destacado con gradiente cyan→emerald, título grande ("¿Qué medicamento necesita hoy?"), input búsqueda 60px alto, texto 18-20px, CTAs primarios "Ver ofertas" (rojo) y "Cotizar receta" (outline).
- Nuevo `src/components/home/FeaturedCategories.tsx` — 4 tiles destacados (Medicamentos→dolor-fiebre, Cuidado personal→higiene-cuidado-personal, Bebés→bebes-ninos, Adulto mayor→adulto-mayor). Tarjetas 140px+ alto, iconos 56px en píldora de color, scroll-snap mobile / grid 4-col desktop.
- `src/app/page.tsx` — reemplazo barra de búsqueda compacta por Hero cuando home está limpia (sin filtros). En vista filtrada se mantiene barra simplificada (más alta: min-h 48px, border-2). Autocomplete preservado, integrado dentro del Hero.
- Tap targets: todos los CTAs ≥48-56px, inputs ≥48px, tipografía base ≥16px (subió a 18-20px en hero).
- Contraste: textos slate-900/slate-50 sobre fondos claros/oscuros, foco con ring-4 cyan-500/30.
- Performance: sin nuevas dependencias; Hero/FeaturedCategories importados estáticos pero compactos. Carrusel mobile usa `overflow-x-auto` nativo (no JS extra).

Archivos: `src/components/home/Hero.tsx`, `src/components/home/FeaturedCategories.tsx`, `src/app/page.tsx`.

---

## 2026-05-07 — Perf: lazy-load floating UI bundle (TBT/initial JS ↓)

Reducción JS inicial extrayendo componentes no-críticos del layout a `next/dynamic` con `ssr: false`.

- Nuevo `src/components/DeferredClientBundle.tsx` (Client) wrappea con `dynamic()`:
  - `PWARegister` (registra SW, solo prod, post-load)
  - `InstallPWAButton` (espera `beforeinstallprompt`, no siempre dispara)
  - `PushOptInButton` (banner 8s delay, mayoría dismissed/granted)
- `WhatsAppButton` queda import directo (visible inmediato, no defer).
- `layout.tsx` consolida 3 imports → 1 wrapper. Components viven en chunks separados, no entran al bundle inicial; cargan solo cuando `useEffect` los monta.

Build local OK exit 0. Verificación post-deploy: Lighthouse mobile esperado TBT 720ms→<600ms (chunks SW/push fuera del main thread inicial).

---

## 2026-05-07 — Fix: SEO robots.txt sitemap URL roto + a11y contrast footer

Fix bug Lighthouse SEO 92→100 (robots.txt invalid).

- `curl https://tu-farmacia.cl/robots.txt` reveló línea rota: `Sitemap: https://tu-farmacia.cl\n/sitemap.xml`. Causa: `NEXT_PUBLIC_SITE_URL` en Vercel tiene trailing `\n` (común al pegar valor en UI).
- Fix defensivo en código: `(env.NEXT_PUBLIC_SITE_URL || 'https://tu-farmacia.cl').trim().replace(/\/$/, '')` aplicado en `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/layout.tsx` (metadataBase, JSON-LD, alternates.canonical).
- Removido `host:` field de robots (no estándar W3C, Yandex-only, Lighthouse no lo usa).
- A11y contrast: footer copyright `text-slate-400 dark:text-slate-500` (~3.5:1 fail AA) → `text-slate-600 dark:text-slate-300` (~7:1 pass AAA).

Build local OK. Próximo lighthouse esperado: SEO 92→100, A11y leve mejora.

---

## 2026-05-07 — Feat: Push notif auto-broadcast en `apply_bulk` descuentos

Cierre del canal push: ya no requiere paso manual a `/admin/push`. Marcar oferta masiva → suscriptores reciben notificación automáticamente.

- Nueva fn reusable `src/lib/push/broadcast.ts` `sendBroadcast({title, body, url, tag})`:
  - Configura web-push lazy (singleton flag `configured`), reusa VAPID env.
  - Lee `db.push_subscriptions.findMany()` paralelo, payload JSON `{title, body, url, tag}`.
  - Cleanup auto endpoints `410|404` con `deleteMany`.
  - Devuelve `{ok, sent, failed, total, cleaned}`.
- Refactor `/api/push/broadcast/route.ts` ahora wrapper delgado (auth + parse + delegar a `sendBroadcast`).
- `/api/admin/descuentos` POST `apply_bulk` acepta `notify: true` opcional:
  - Tras `updateMany`, si `notify && discount_percent > 0 && updated > 0` → `sendBroadcast` best-effort en `try/catch` (no bloquea respuesta si falla).
  - Title dinámico: scope `category` → busca nombre `db.categories.findUnique` → `🔥 {Categoría}: {N}% off`. Otro caso → `🔥 Ofertas hasta {N}% off`.
  - Body: `{updated} producto(s) con descuento`. URL: `/?discount=true` (home filtro existente).
  - Tag único `discount-{Date.now()}` (evita merge de notificaciones).
  - Respuesta extiende: `{success, updated, push: {sent, failed, total} | null}`.
- UI `/admin/descuentos` (tab "Aplicar descuento"):
  - Checkbox `applyNotify` (default true) con icono `Bell` violet, label "Enviar notificación push a suscriptores".
  - Pasa `notify: applyNotify` en payload.
  - Result UI muestra dos chips: verde "{N} productos actualizados" + violet "Push enviado: {sent}/{total}" (+ failed si >0).

Build local OK. Push notif ahora cierra loop completo: admin marca oferta → suscriptores reciben push instantáneo → tap abre `/?discount=true`.

---

## 2026-04-29 — Feat: Fase 5 inteligencia — Health Score + Insights automáticos + Activity Feed

ERP cubre ya datos completos (ventas, finanzas, farmacia, equipo, clientes). Fase 5 añade **inteligencia + narrativa** para percepción profesional: 1 número que cuenta la historia, anomalías detectadas automáticamente, pulso del negocio en tiempo real.

- **Health Score del negocio** (`HealthScoreCard.tsx` + `/api/admin/ejecutivo` ampliado, mostrado en `/admin/ejecutivo`):
  - Score 0-100 ponderado: meta cumplimiento (30%) + margen vs target 30% (25%) + alertas críticas inverso (20%) + rotación MoM (15%) + cumplimiento tareas 7d (10%).
  - Endpoint extiende Promise.all con: `internal_tasks` count (done 7d / open), `orders` count today/yesterday.
  - Devuelve bloque `health { score, label, breakdown[5], suggestion }`. Label: Crítico (<50) / En riesgo (<65) / Estable (<80) / Saludable / Excelente (≥90).
  - `suggestion` accionable: detecta el componente más bajo y emite frase concreta ("Paga N facturas vencidas", "Sube precios o negocia costos", etc.).
  - UI: dial SVG semicircular con color por tier (rojo→ámbar→indigo→esmeralda) + breakdown con barras de progreso por componente + chip sugerencia.
- **Insights automáticos** (`/admin/insights` + `GET /api/admin/insights`, owner-only):
  - Detecciones: anomalía drop (ratio última semana / prom 4 semanas previas ≤ 0.4 con baseline ≥5 u/sem), trending (ratio ≥ 1.6, baseline ≥5), capital inmovilizado (stock ≥5 sin venta 30d con cost_price, capital ≥20k), lotes vencen 60d sin descuento aplicado, clientes en riesgo (≥3 compras, daysSince > frequency*1.5 y >30d), ventas hoy < 40% del promedio 8 semanas (sólo después de las 14h con baseline ≥5).
  - Sort por severity (critical → warning → positive → info). Cada insight tiene `href` para acción rápida.
  - UI: 4 KPIs por severity + lista con icono temático, badge severity, línea izquierda de color, link a destino.
- **Activity Feed global** (`/admin/actividad` + `GET /api/admin/actividad`, owner-only) + widget en `/admin/ejecutivo`:
  - Une 6 fuentes en un solo feed: `audit_log` (mutaciones), `orders` (ventas POS+online), `caja_cierres`, `stock_movements` (adjustment/damage/expired/count_correction), `internal_tasks` completadas, `purchase_orders` recibidas.
  - Cada evento mapea: type, severity (info/positive/warning), icon, user, title, detail, amount, href, timestamp. Cierres con diferencia >$1000 marcan warning. Stock con delta negativo marca warning.
  - Página: filtros pill por tipo (Todos/Ventas/Cierres caja/Tareas/Auditoría/Stock/Compras) + filtro texto por usuario + range 24h/7d/30d. Eventos agrupados por día con header weekday+fecha. `divide-y` entre items.
  - Widget compacto (`ActivityFeedWidget.tsx`, default limit 8): mostrado en ejecutivo entre top tables y quick actions. Link "Ver todo →".
- **Sidebar / Roles / CommandPalette**:
  - `OWNER_ONLY_ROUTES` += `/admin/insights`, `/admin/actividad`.
  - Sidebar grupo Operación: nuevos items "Insights" (Sparkles) y "Actividad" (Heart) entre Ejecutivo y Equipo.
  - CommandPalette: 2 entradas nav nuevas con subtitle.

### Archivos
Nuevos: `admin/insights/page.tsx`, `admin/actividad/page.tsx`, `api/admin/insights/route.ts`, `api/admin/actividad/route.ts`, `components/admin/HealthScoreCard.tsx`, `components/admin/ActivityFeedWidget.tsx`.
Modificados: `api/admin/ejecutivo/route.ts` (+ tasks 7d / orders today/yesterday + bloque health), `admin/ejecutivo/page.tsx` (mount HealthScoreCard + ActivityFeedWidget), `lib/roles.ts`, `components/admin/Sidebar.tsx`, `components/admin/CommandPalette.tsx`.

Build limpio (27 páginas admin), 0 errores TS. Solo warnings preexistentes Dynamic server usage (cookies, intencional).

---

## 2026-04-29 — Feat: Fase 4 ops — Equipo leaderboard + Cierre del día digital

- **Leaderboard equipo** (`/admin/equipo` + `GET /api/admin/equipo`, owner-only):
  - Endpoint agrega `orders` filtrado por `payment_provider IN (pos_*)` + `status=completed` agrupado por `sold_by_user_id`. Period selector `today|week|month`. Devuelve para c/vendedor: revenue, count, avg_ticket, share_pct, first/last_sale, top_product (joinea `order_items`), sparkline 7 días siempre (independiente del periodo).
  - Página: 4 KPIs cabecera (ventas equipo, ticket promedio, vendedores activos, top vendedor) + podio top 3 (Crown/Medal/Award + sparkline + % del total + top producto) + tabla resto del equipo. Toggle periodo en header. Sparkline SVG inline (sin lib externa).
- **Cierre del día digital** (`/admin/cierre-dia` + `GET /api/admin/cierre-dia` + `POST /api/admin/cierre-dia/email`):
  - Visible para los 3 roles admin. Date picker (default hoy, max=hoy → permite consultar días anteriores).
  - Endpoint GET en una sola query: ventas (POS por método de pago + online), delta vs día previo, ticket promedio, COGS estimado + margen bruto + %, gastos del día, caja_cierre del día (turno, fondo, esperado/contado/diferencia), recetas dispensadas + controladas, turno farmacéutico, tareas (done hoy / abiertas / atrasadas), avisos críticos activos, ventas por vendedor, top 10 productos, retiros agendados para mañana, alertas operativas (stock cero, lotes 7d, faltas con stock).
  - Página: 4 KPIs hero + desglose método pago + caja del día + ventas por vendedor (con link a `/admin/equipo` si owner) + farmacia (recetas + turno) + top 10 productos + 4 mini-stats (tareas hechas/abiertas/atrasadas/avisos críticos) + bloque "Para mañana" (retiros + alertas).
  - Botón Imprimir (`window.print()` con `@media print` que oculta sidebar/header/buttons → wrap-up físico).
  - Botón "Enviar al dueño" (owner-only): POST reusa builder + `sendDailySummary` de `lib/email.ts`. Lee `alert_email` o acepta override `to` en body. Sin email configurado → 400.
- **Sidebar** (grupo Operación): nuevos items "Equipo" (Trophy, owner) y "Cierre del día" (ClipboardCheck, todos).
- **roles.ts**: `/admin/cierre-dia` agregado a `SELLER_ROUTES` (heredado por todos), `/admin/equipo` a `OWNER_ONLY_ROUTES`.

### Archivos
Nuevos: `admin/equipo/page.tsx`, `admin/cierre-dia/page.tsx`, `api/admin/equipo/route.ts`, `api/admin/cierre-dia/route.ts`, `api/admin/cierre-dia/email/route.ts`.
Modificados: `lib/roles.ts`, `components/admin/Sidebar.tsx`, `bitacora.md`.

Build limpio (24 páginas admin), 0 errores TS. Solo warnings preexistentes Dynamic server usage (cookies, intencional).

---

## 2026-04-29 — Feat: Fase 3 cohesión — Cliente 360°, forecast meta, NotificationBell unificado, liquidación lotes

- **Forecast + meta mensual en Ejecutivo** (`/api/admin/ejecutivo` + `admin/ejecutivo/page.tsx`):
  - Endpoint lee `monthly_sales_target` desde `admin_settings` y devuelve bloque `forecast { monthly_target, revenue_so_far, daily_avg, forecast_close, target_progress_pct, forecast_vs_target_pct, days_elapsed, days_in_month }`. Run-rate proyectado = (ingresos / día_actual) × días_del_mes.
  - Card "Meta del mes" con 4 KPIs (Meta · Avance + % · Promedio diario · Proyección cierre con color rojo<85% / ámbar<100% / esmeralda≥100%) + barra de progreso con marker de pace ideal. CTA "Configurar meta" si no hay target.
  - Fix bug histórico: `/api/admin/vendedor` leía `daily_revenue_goal` pero `/admin/configuracion` guarda `daily_sales_target` → vendedor ahora lee `daily_sales_target` con fallback al key viejo.
- **NotificationBell unifica avisos** (`components/admin/NotificationBell.tsx`):
  - Fetch paralelo a `/api/admin/operaciones` + `/api/admin/avisos` (filtra por rol y vigencia server-side).
  - Mapeo severity: `critical→critical`, `warning→urgent`, `info→info`. Pinned no descartables (filtro persiste, `clearAll` los preserva). Icono Pin para pinned, Megaphone para resto.
  - Truncado a 80 chars en preview, link a `/admin/avisos` para ver completo.
- **Perfil Cliente 360°** (`/admin/clientes/[id]/page.tsx` nuevo + `/api/admin/clientes/[id]` ampliado):
  - API ahora calcula KPIs (lifetime_spend, order_count, avg_ticket, first/last_order, frequency_days = span/(n-1), next_predicted) y top productos recurrentes (≥2 órdenes, ordenado por frecuencia + cantidad). Para registrados: incluye prescripciones por `patient_rut == profile.rut` y `loyalty_transactions`. Para guests: prescripciones por `customer_phone` match.
  - Página: header con badge tipo · identity card (RUT/teléfono/email/desde) · 4 StatCards (gasto total, ticket promedio, última compra relativa, frecuencia + próxima compra) · card puntos con equivalente en CLP · 4 tabs (Órdenes con link a detalle / Productos recurrentes con link a producto / Recetas con badge controlado / Puntos con +/- color).
  - Botón "Perfil 360°" en panel lateral de `/admin/clientes` (registered → `/admin/clientes/[uid]`, guest → `/admin/clientes/guest?email=`).
- **POS lookup cliente por RUT/teléfono** (`api/admin/pos/customer-history` + `admin/pos/page.tsx`):
  - Endpoint acepta `?rut=` además de `?phone=`. RUT busca en `profiles.rut` (autoritativo). Si match RUT, OR-merge con phone match. Devuelve también `phone` de profile.
  - Input "RUT cliente" agregado en POS, lookup debounced sobre rut+phone. Link "Ver perfil 360° →" en customer history card cuando `user_id` está disponible.
- **Liquidación lotes por vencer** (`/admin/farmacia/liquidacion` + `/api/admin/farmacia/liquidacion`):
  - GET agrupa `product_batches` con `expiry_date ≤ +60d, quantity > 0` por producto. Devuelve `min_expiry`, `days_to_expiry`, `tier` (expired/critical/urgent/warning), `suggested_discount` por antigüedad (vencido=50%, ≤15d=40%, ≤30d=25%, ≤60d=10%), `total_at_risk`, `potential_loss`. Summary global con KPIs.
  - POST aplica `discount_percent` masivo: itera items, valida 0-99, update `products.discount_percent`, `logAudit` por producto con `reason=liquidation_expiry`, `revalidateTag('products')`.
  - Página: 4 StatCards (productos en riesgo · pérdida potencial · vencidos · ≤15d) + filtros por tier + tabla con checkboxes, descuento editable inline (sugerencia precargada), bulk apply. Botón "Aplicar sugerencia" rellena con valores recomendados.
- **Sidebar**: nuevo item "Liquidación" (TrendingDown) en grupo Farmacia. `PHARMACIST_EXTRA_ROUTES` incluye `/admin/farmacia/liquidacion`.

### Archivos
Nuevos: `admin/clientes/[id]/page.tsx`, `admin/farmacia/liquidacion/page.tsx`, `api/admin/farmacia/liquidacion/route.ts`.
Modificados: `api/admin/ejecutivo/route.ts`, `admin/ejecutivo/page.tsx`, `api/admin/vendedor/route.ts`, `components/admin/NotificationBell.tsx`, `api/admin/clientes/[id]/route.ts`, `admin/clientes/page.tsx`, `api/admin/pos/customer-history/route.ts`, `admin/pos/page.tsx`, `lib/roles.ts`, `components/admin/Sidebar.tsx`.

Build limpio (24+ páginas admin), 0 errores TS. Solo warnings preexistentes Dynamic server usage (cookies).

---

## 2026-04-29 — Feat: Fase 2 cohesión operativa — vendedor landing, tareas internas, avisos, meta diaria

- **Schema**: `internal_tasks` (asignación por uid o por rol, prioridad low/normal/high, due_date, status open/done/cancelled, audit fields completed_*) + `announcements` (severity info/warning/critical, visible_to all/owner/pharmacist/seller, pinned, expires_at). Pushed a Cloud SQL via `prisma db push`.
- **Landing vendedor** (`/admin/vendedor` + `GET /api/admin/vendedor`, todos los roles admin). Reemplaza `/admin/pos` como landing del rol seller en `landingRouteForRole()`. Saludo personalizado por hora del día, badge caja activa/sin abrir, botón Abrir POS, KPIs personales (mis ventas hoy filtrado por `sold_by_user_id`, ticket promedio, gauge meta diaria local), bandeja retiros del día (orden `status=reserved` con pickup_code, expiry timer), MyTasksCard inline, 4 acciones rápidas (POS/Arqueo/Órdenes/Clientes). Auto-poll 60s.
- **Tareas internas** (`/admin/tareas` + `/api/admin/tareas` + `/api/admin/tareas/[id]`). Owner crea y asigna a uid específico o a rol broadcast (`assigned_role`). Vendedor/farmacéutico ven scope=mine (asignadas a uid OR a su rol). PUT actions: complete (asignado o owner), reopen, cancel (owner), edit fields (owner). DELETE owner-only. Modal de creación con select de equipo (`/api/admin/users`), prioridad, due_date.
- **Avisos del equipo** (`/admin/avisos` + `/api/admin/avisos` + `/api/admin/avisos/[id]`, owner-only para CRUD; lectura filtrada por rol). Severity (info/warning/critical), visible_to (all/owner/pharmacist/seller), pinned (no descartable), expires_at (auto-oculta vencidos al lector). Owner ve todos con `?scope=all` incluido expirados.
- **Componentes compartidos**:
  - `AnnouncementsBanner.tsx`: banner condicional según severity, dismiss persistido en localStorage (excepto pinned). Acepta `items` prop o auto-fetch.
  - `MyTasksCard.tsx`: lista tareas pendientes del usuario con due-label inteligente (Atrasada Nd / Hoy / Mañana / Nd / fecha), checkbox para completar, badge contador.
  - `DailyGoalGauge.tsx`: gauge SVG semicircular (radio 70). Tonos por % (rojo<40, ámbar<75, índigo<100, esmeralda al alcanzar). Empty state linkea a `/admin/configuracion`.
- **Sidebar**: nuevos items en grupo Operación ("Mi panel" BadgeCheck → `/admin/vendedor`, "Tareas" CheckSquare → `/admin/tareas`) + grupo Sistema ("Avisos" Megaphone → `/admin/avisos`, owner-only).
- **roles.ts**: `SELLER_ROUTES` ahora incluye `/admin/vendedor` y `/admin/tareas` (heredado por todos los roles admin). `OWNER_ONLY_ROUTES` incluye `/admin/avisos`. `landingRouteForRole(seller) → /admin/vendedor`.

### Archivos
Nuevos: `admin/vendedor/page.tsx`, `admin/tareas/page.tsx`, `admin/avisos/page.tsx`, `api/admin/vendedor/route.ts`, `api/admin/tareas/{route,[id]/route}.ts`, `api/admin/avisos/{route,[id]/route}.ts`, `components/admin/{AnnouncementsBanner,MyTasksCard,DailyGoalGauge}.tsx`.
Modificados: `prisma/schema.prisma`, `lib/roles.ts`, `components/admin/Sidebar.tsx`.

Build limpio, 0 errores TS.

---

## 2026-04-28 — Feat: Fase 1 ERP cohesión — landing por rol, panel farmacéutico, centro alertas

- **Landing por rol** (`src/app/admin/page.tsx` reescrito como redirect cliente): owner → `/admin/ejecutivo`, pharmacist → `/admin/farmacia`, seller → `/admin/pos`. Dashboard clásico movido a `/admin/dashboard` (sigue accesible desde sidebar). Helper `landingRouteForRole()` en `lib/roles.ts`.
- **Panel farmacéutico nuevo** (`/admin/farmacia` + `GET /api/admin/farmacia`, owner+pharmacist): KPIs (recetas hoy, recetas mes, controladas hoy, sin registrar, lotes <30d, controlados sin stock), 3 acciones rápidas (POS, abrir/cerrar turno farmacéutico, calidad catálogo), feed últimas 10 recetas con badge controlado, top 5 lotes por vencer con semáforo días-restantes. Badge de turno activo en header.
- **Centro de alertas** (`NotificationBell.tsx` reescrito): consume `/api/admin/operaciones` (1 query, ya agregaba 12 en paralelo). Agrupa por severidad (Crítico · Urgente · 7 días). Persiste read/dismissed por usuario en `localStorage`. Dot rojo si hay críticos, ámbar si solo urgentes. Auto-poll 60s. Footer con link a `/admin/operaciones`.
- **DailyChecklist** (`src/components/admin/DailyChecklist.tsx`): card colapsable con cierre de caja ayer · fondo configurado · reservas expiradas procesadas · vencidos retirados. Persiste "ocultar hoy" en `localStorage`. Montado en `/admin/operaciones` y `/admin/ejecutivo`.
- **Command Palette ⌘K** reescrito: 31 entradas de navegación + 11 acciones rápidas autogeneradas, todas filtradas por `canAccessRoute(role, href)`. Acciones nuevas: ajustar stock, crear OC, Z-report, registrar gasto, faltas, vencimientos. Estilizado con tokens admin (var(--admin-*)).
- **Density toggle** en topbar (Rows3/Rows4 icons): persiste `data-density="compact"` en `[data-admin="1"]`. CSS scoping en `admin.css` reduce font-size 13px y padding tablas. Valioso en catálogo 34k productos y stock movements.
- **Sidebar limpieza badges**: removidos badges de Órdenes pendientes y Productos stock crítico (duplicaban centro de alertas). Mantienen badges Compras draft (azul) + Faltas (violeta).
- **Sidebar item nuevo**: "Mi panel" en grupo Farmacia (Stethoscope) → `/admin/farmacia`. Dashboard apunta a `/admin/dashboard`.
- **roles.ts**: `SELLER_ROUTES` ahora incluye `/admin/dashboard`, `PHARMACIST_EXTRA_ROUTES` incluye `/admin/farmacia`. Nueva fn `landingRouteForRole()`.

### Archivos
Nuevos: `admin/farmacia/page.tsx`, `api/admin/farmacia/route.ts`, `components/admin/DailyChecklist.tsx`, `admin/dashboard/page.tsx`.
Reescritos: `admin/page.tsx` (redirect), `components/admin/NotificationBell.tsx`, `components/admin/CommandPalette.tsx`.
Modificados: `admin/layout.tsx` (density toggle), `admin/admin.css` (variantes density), `components/admin/Sidebar.tsx`, `lib/roles.ts`, `admin/operaciones/page.tsx`, `admin/ejecutivo/page.tsx`.

Build limpio, 0 errores TS. Solo warnings preexistentes "Dynamic server usage" (cookies, intencional).

---

## 2026-04-28 — Feat: Auditoría + FEFO + Dashboard ejecutivo + Fix masivo guards

- **T1: Fix guards de rol (21 páginas)**: reemplazado `user.role !== 'admin'` por `isAdminRole(user.role)` (16 páginas) o `isOwnerRole(user.role)` (5 páginas owner-only: reportes, costos, configuración, proveedores, compras). Sin esto, owner/pharmacist/seller eran rebotados al storefront pese a tener rol válido.
- **T2: Audit log cableado**. `lib/audit.ts:logAudit` ya existía sin callers. Wirear en mutaciones sensibles:
  - `POST /api/admin/products`, `PUT/DELETE /api/admin/products/[id]` con diff de campos auditables (price/stock/cost_price/active/discount/category/prescription_type)
  - `PUT /api/admin/orders/[id]` (status changes + actions: approve/reject/refund + notes)
  - `POST /api/admin/stock-movements/adjust`
  - `POST /api/admin/pos/sale`
  - `POST /api/admin/users/invite`, `PATCH /api/admin/users/[uid]`, `POST /api/admin/users` (cambio rol)
  - `POST /api/admin/purchase-orders/[id]/receive`
  - Nueva ruta `GET /api/admin/audit?entity=&action=&user=&from=&to=&page=` con filtros + paginación, owner-only.
  - Nueva página `/admin/sistema/auditoria` (DataTable con filas expandibles mostrando diff campo por campo old → new).
- **T3: POS auto-registra recetas**. Ya existía modal de captura datos paciente/médico/Nº receta y `POST /api/admin/pos/sale` ya persistía a `prescription_records`. Agregada columna "Origen" (POS/Manual via `order_id` truthy) y export CSV con BOM UTF-8 en `/admin/libro-recetas` para entrega ISP.
- **T4: FEFO en POS**. `POST /api/admin/pos/sale` ahora descuenta de `product_batches` con menor `expiry_date` primero. Trace de lotes consumidos guardado en `stock_movements.admin_id`. Sin migración necesaria — usa schema existente.
- **T5: Dashboard ejecutivo del dueño** (`/admin/ejecutivo`, owner-only). Una sola pantalla con:
  - KPIs financieros mes en curso: Ingresos, COGS estimado (order_items × cost_price), Margen bruto + %, EBITDA estimado, Gastos operativos, AP vencido + por vencer 7d.
  - MoM y YoY en `StatCard.delta`.
  - Alertas accionables (panel rojo): AP vencido con link a `/admin/finanzas/cuentas-pagar`, caída ingresos > 10% MoM, faltas pendientes con link a `/admin/faltas`.
  - Top 5 productos por margen absoluto y top 5 por rotación del mes.
  - Acciones rápidas a finanzas/costos/reportes.
  - Endpoint nuevo `GET /api/admin/ejecutivo` (composición de aggregates en un round-trip).
- **Sidebar**: nuevo item "Ejecutivo" (Crown icon, grupo Operación), "Auditoría" (ShieldCheck, grupo Sistema). Ambos owner-only via `OWNER_ONLY_ROUTES`.

### Bitácora del cambio
- 21 archivos guard fix + 9 endpoints con audit + 4 archivos nuevos (audit page/api, ejecutivo page/api) + sidebar + roles + libro-recetas.
- Build limpio, 0 errores TS. Solo warnings preexistentes de "Dynamic server usage" (cookies → intencional).

---

## 2026-04-28 — Feat: Admin Console redesign + roles + invitaciones

- **Diseño aislado del storefront**: nuevo `apps/web/src/app/admin/admin.css` con tokens scoped a `[data-admin="1"]`. Canvas zinc/violeta, paleta dark `#0b0b0f / #111118 / #16161f`, accent indigo→violet (en lugar de emerald). Tipografía 14–15px tabular. Motion `cubic-bezier(0.16,1,0.3,1)`.
- **Sidebar agrupado** (`Sidebar.tsx` reescrito): 8 grupos colapsables (Operación · Catálogo · Ventas · Compras · Inventario · Farmacia · Finanzas · Sistema). Estado por grupo persistido en `localStorage`. Grupo se oculta completo si `canAccessRoute` no deja items visibles. Brand "Tu Farmacia · Console" + footer con avatar + RoleBadge.
- **Layout shell** (`admin/layout.tsx`): topbar refinado con search central (320–420px), badge "Producción" cuando hostname coincide con prod, avatar con iniciales + chip de rol. `max-w-screen-2xl`, padding `lg:p-10`, `admin-fade-in` por route.
- **Primitivos compartidos** (`components/admin/ui/`): `PageHeader`, `Card`, `StatCard` (con delta + sparkline slot), `DataTable`, `EmptyState`, `RoleBadge`. Adoptados en Dashboard, Productos y Usuarios; resto migrará incrementalmente.
- **Roles polish** (`lib/roles.ts`): nuevos `roleLabel`, `roleDescription`, `routesForRole`, `routesLostOnDemotion`. Sets `SELLER_ROUTES`/`PHARMACIST_EXTRA_ROUTES`/`OWNER_ONLY_ROUTES` ahora `export`.
- **Gestión de Usuarios** (`/admin/usuarios` rewrite + nuevos endpoints):
  - `POST /api/admin/users/invite`: crea Firebase user, asigna rol via custom claim, devuelve `generatePasswordResetLink`.
  - `PATCH /api/admin/users/[uid]`: enable/disable usuario.
  - UI: search en vivo, segmented filter por rol, modal de invitación (email + nombre + rol con descripción), modal de confirmación al demotear (lista las rutas que se pierden), toggle disable, columna "último ingreso" (relativa) y "creado", auto-protección (no puedes cambiar tu propio rol ni deshabilitarte).
- **Dashboard** (`admin/page.tsx`): adoptó `PageHeader` + `StatCard`. Fix bug `user.role !== 'admin'` → `isAdminRole(user.role)` (antes bloqueaba a owners/pharmacists/sellers en cliente).

---

## 2026-04-28 — Perf: Caché Next.js + Edge Config + Índices DB

- **`unstable_cache`** en `/api/products` (300s, tag `products`), `/api/products/[slug]` (600s), `/api/products/filters` (1800s). Rutas dinámicas (search/barcode) no cacheadas.
- **`revalidateTag('products')`** en todos los endpoints de mutación: admin/products CRUD, import, bulk-price, update-prices, stock, stock-movements/adjust, purchase-orders receive, pos/sale, webpay/return.
- **`revalidateTag('categories')`** en admin/categories/[id] PUT+DELETE.
- **Edge Config** (`@vercel/edge-config`) para `admin_settings` GET: sub-1ms vs DB round-trip. Fallback a DB + backfill automático. PATCH escribe DB (fuente de verdad) + `updateEdgeConfig` no-bloqueante. `VERCEL_API_TOKEN` en Vercel.
- **Índice DB**: `idx_products_active_stock ON products(active, stock DESC)` — query inventario valorizado 48ms → <1ms.
- **Skipped**: ISR homepage (es `'use client'`), lazy firebase-admin (ya lazy), Upstash Redis (sin credenciales; `unstable_cache` cubre el caso hot-products).

---

## 2026-04-27 — Feat: Módulo Gestión Financiera

- **Schema**: 4 tablas nuevas (`purchase_payments`, `gasto_categories`, `gastos`, `recurring_expenses`) + 4 campos en `purchase_orders` (`paid`, `paid_at`, `payment_method_ap`, `due_date`). Seed: 11 categorías fijas.
- **Cuentas por Pagar** (`/admin/finanzas/cuentas-pagar`): lista OC received con estado pago, vencimiento, abonos parciales. Modal para registrar pagos/abonos con `mark_fully_paid`.
- **Gastos** (`/admin/finanzas/gastos`): CRUD gastos por mes + plantillas recurrentes (generar gasto del mes con un clic, día_del_mes 1-28).
- **P&L** (`/admin/finanzas/pyl`): mensual + YoY + YTD. BarChart Recharts. Tabla con % cambio anual.
- **Cash Flow** (`/admin/finanzas/cash-flow`): 30d reales (ingresos + pagos) + 30d proyección (OC vencimiento + recurrentes). AreaChart.
- **Dashboard** (`/admin/finanzas`): 4 KPIs mes en curso (OC pendientes, gastos, ingresos, margen bruto).
- **Acceso**: owner-only (`getOwnerUser()`). Sidebar filtra `/admin/finanzas` para owner.

---

## 2026-04-27 — Feat: Sistema de Roles y Permisos ERP

- **Roles**: `owner` (dueño), `pharmacist` (farmacéutico), `seller` (vendedor) en Firebase custom claims. `admin` legacy tratado como `owner`.
- **`roles.ts`**: `isAdminRole`, `isOwnerRole`, `canAccessRoute` — control centralizado de acceso por ruta.
- **`api-helpers.ts`**: `getAdminUser` acepta 3 roles + nuevo `getOwnerUser` + campo `name` en `DecodedUser`.
- **Sidebar**: filtra navItems según rol. Seller ve 7 items. Pharmacist ve 18. Owner ve todo.
- **API protection**: `getOwnerUser()` protege reportes, proveedores, compras, finanzas.
- **POS trazabilidad**: `sold_by_user_id` + `sold_by_name` en tabla `orders` (DB migration). Cada venta POS registra quién vendió.
- **POS UI**: muestra nombre del vendedor activo en el header.
- **Gestión Usuarios** (`/admin/usuarios`): lista todos los usuarios Firebase. Owner puede asignar roles con dropdown. Sección equipo vs clientes.
- **Badge de rol** en header del admin (visible desktop).

---

## Estado actual: Cierre de caja POS completo — pos_mixed + Z-report + shift awareness (Abril 2026)

---

## 2026-04-26 — Feat: Cierre de caja POS — plan completo (6 tareas)

### Task 1: DB schema en producción
- `caja_cierres` model verificado en `prisma/schema.prisma` — campos: `id`, `turno_inicio`, `turno_fin`, `fondo_inicial`, `ventas_efectivo`, `ventas_debito`, `ventas_credito`, `ventas_total`, `num_transacciones`, `efectivo_esperado`, `efectivo_contado`, `diferencia`, `notas`, `cerrado_por`, `created_at`
- `prisma db push` aplicado a Cloud SQL producción (`tu-farmacia-prod:southamerica-east1:tu-farmacia-db`)

### Task 2+3: pos_mixed en API arqueo + tipo ShiftData
- `GET /api/admin/arqueo`: filtro `payment_provider` ampliado a `['pos_cash','pos_debit','pos_credit','pos_mixed']`
- `select` incluye `cash_amount` y `card_amount` para splits de ventas mixtas
- Cálculo: `pos_mixed` suma `cash_amount` a efectivo y `card_amount` a débito/crédito
- `ShiftData.ventas.mixto: number` agregado al tipo en `arqueo/page.tsx`
- Card "Mixto" (Shuffle icon, purple) en KPI row del arqueo

### Task 4: Z-report imprimible
- `arqueo/page.tsx`: botón `Printer` en header → `window.print()`
- `<div id="zreport-print">`: oculto en pantalla, visible solo en `@media print` (posición fixed, fondo blanco, monospace)
- Contenido: nombre farmacia, fecha, turno inicio→fin, quién cerró, fondo inicial, desglose ventas (efectivo/débito/crédito/mixto/total), efectivo esperado/contado/diferencia

### Task 5: POS shift-awareness + prescription modal

**`/admin/pos`:**
- Banner ámbar cuando `fondo_inicial === 0` → "Configura el fondo antes de iniciar ventas" + link a Arqueo
- Modal de confirmación de receta al agregar `prescription_type: 'required' | 'controlled'` al carrito (primera vez): muestra tipo, nombre, botones Cancelar / "Receta verificada ✓"
- `addToCartDirect()` separado de `addToCart()` para bypass del modal en confirmación

**`/admin/operaciones`:**
- Card "Estado de caja": fondo inicial, hora inicio turno, ventas POS del día
- Ícono ámbar si fondo=0, esmeralda si configurado; link a `/admin/arqueo`
- `Promise.all` paralelo: operaciones + arqueo en un solo `load()`

### Task 6: Build + deploy
- Build limpio sin errores TypeScript
- `git push origin main` → Vercel auto-deploy

---

## 2026-04-26 — Feat: POS shift-awareness + caja status en operaciones

**`/admin/pos`:**
- Banner ámbar en POS cuando `fondo_inicial === 0` → alerta "Configura el fondo antes de iniciar ventas" con link a Arqueo
- Modal de confirmación de receta al agregar medicamentos `required` o `controlled` al carrito (primera vez): muestra nombre, tipo de receta requerida, botones Cancelar / "Receta verificada ✓"
- `addToCartDirect()` separado de `addToCart()` para que el modal confirme y llame directo

**`/admin/operaciones`:**
- Card "Estado de caja" con fondo inicial, hora de inicio de turno y resumen de ventas POS del día
- Ícono Banknote ámbar si fondo=0, esmeralda si configurado
- Clickeable → link a `/admin/arqueo`
- `Promise.all` paralelo: operaciones + arqueo en un solo `load()`

---

## 2026-04-26 — Feat: Búsqueda semántica por principio activo / acción terapéutica

- `GET /api/products?search=X` ya buscaba en `name`, `active_ingredient`, `therapeutic_action`, `laboratory`
- Nuevo: cada producto en el response incluye `match_field` (`'active_ingredient' | 'therapeutic_action' | 'laboratory' | null`) y `match_value` (valor del campo)
- Homepage: badge azul en cada card indicando por qué coincidió (solo cuando `match_field ≠ null`, es decir, no es match por nombre)
- Homepage: banner de contexto encima de resultados cuando hay matches semánticos
- Badge visible en vista grid y vista lista
- Sin cambio de schema DB — ILIKE en 4 campos, anotación en JS post-fetch

---

## 2026-04-26 — Feat: Dashboard Operacional Diario

**`/admin/operaciones`** — Vista matutina unificada para el dueño/farmacéutico:

- **API `GET /api/admin/operaciones`**: un solo endpoint con `Promise.all` de 12 queries paralelas — reservas expiradas, reservas urgentes (<6h), vencidos con stock, lotes por vencer en 7d, faltas con stock disponible, OC borrador, counts de stock crítico/cero, KPIs hoy/ayer, webpay pendientes.
- **Sección Crítico (rojo)**: reservas expiradas sin procesar + productos vencidos con stock. Cada item enlaza directo al detalle.
- **Sección Urgente (amber)**: reservas por expirar pronto, faltas cuyo producto ya llegó al stock (con botón llamada directa al cliente), OC en borrador sin confirmar.
- **Sección 7 días (naranja)**: lotes próximos a vencer.
- **KPI cards**: ventas hoy vs ayer con badge ▲/▼ %, total pedidos, stock crítico count, faltas pendientes.
- **Acciones rápidas**: 6 links con badges de alerta (POS, Órdenes, Arqueo, Reposición, Faltas, Vencimientos).
- **Auto-refresh** cada 60s. Sidebar: nuevo link "Operaciones" (Activity icon) entre Dashboard y POS.

---

## Decisiones de producto (2026-04-26)

**Sin delivery** — La farmacia no ofrece despacho a domicilio. Todos los pedidos son retiro en tienda o pago Webpay para retiro. No agregar flujo de delivery ni campo de dirección de envío.

---

## 2026-04-26 — Fix: Admin navbar — mobile drawer + desktop toggle unificado

**Problema:** Bottom nav móvil tenía 22 items en `flex h-16` → inutilizable. Toggle desktop usaba sync frágil (2 estados separados + localStorage + custom events).

**`src/components/admin/Sidebar.tsx`:**
- Eliminado bottom nav móvil (22 items imposibles en una barra)
- Nuevo slide-out drawer móvil: overlay backdrop, cierra con ESC/backdrop/navegación
- Estado interno `isCollapsed` eliminado → ahora recibe props (`isCollapsed`, `onToggle`, `mobileOpen`, `onMobileClose`)
- Toggle en header del sidebar (ChevronLeft/Right) para desktop
- `NavItem` extraído como subcomponente local

**`src/app/admin/layout.tsx`:**
- Estado unificado: layout es owner de `sidebarCollapsed` + `mobileOpen`
- Eliminada sincronización via custom events y `window.addEventListener('sidebar-collapse')`
- `handleSidebarToggle()` único punto de escritura a localStorage
- Botón hamburger `☰` (Menu icon) visible solo en mobile (`lg:hidden`)
- Eliminado `pb-16` del main (ya no hay bottom nav)

---

## 2026-04-26 — Feat: Image upload, inline edit precio/descuento, repetir pedido en lista

**Admin productos — upload imagen a Firebase Storage:**
- `src/lib/firebase/storage.ts`: nueva función `uploadProductImage(file, productId)` → path `products/{id}/{ts}_{filename}`
- `src/app/admin/productos/page.tsx`: botón "Subir imagen" con spinner, input file oculto, escribe URL Firebase en `formData.image_url` al completar

**Admin productos — edición inline precio y descuento:**
- Precio ya tenía inline edit (`editingPriceId`). Agregado `editingDiscountId` con misma lógica.
- Click en badge descuento → input 0-100 → Enter/blur guarda via `PUT /api/admin/products/[id]`

**Mis pedidos (lista) — botón "Repetir":**
- `GET /api/orders` ahora incluye `order_items` (Prisma `include`)
- `src/lib/api.ts`: tipo `OrderWithItems` para lista paginada
- `src/app/mis-pedidos/page.tsx`: botón "Repetir" en cada card → `addToCart` por ítem → router `/carrito`

---

## 2026-04-21 — Data: Import Catálogo Completo ERP (34,107 productos)

**Script `pharmacy-ecommerce/scripts/import_backup_productos.mjs`**:
- Parseó `BACKUP_PRODUCTOS.txt` (backup ERP Golan/EcoSur, 34,107 productos únicos)
- Actualizó 1,504 productos existentes (name + price si backup tiene precio)
- Insertó 32,603 nuevos productos con `external_id` del ERP
- Activos (con PVP): 24,933 | Inactivos (sin precio): 9,176
- `barcode_catalog`: 39,288 entradas (EAN completos para lookup POS sin FK)
- `product_barcodes`: 39,288 entradas (vinculadas a products.id)
- Multi-barcode correctamente separados por `|`

---

## 2026-04-20 — Feat: Panel Fidelización Admin

**Panel `/admin/fidelidad`**:
- API `GET /api/admin/loyalty/stats` — KPIs (miembros con puntos, puntos pendientes, valor CLP, tasa de canje), top 10 clientes por puntos, últimas 20 transacciones del programa, datos mensuales otorgados/canjeados (raw SQL, últimos 6 meses)
- Página `/admin/fidelidad` — 4 KPI cards, BarChart Recharts (otorgados vs canjeados por mes), ranking top 10 clientes con medallas #1/#2/#3, feed últimas 20 transacciones con íconos +/- y fecha
- Sidebar: link "Fidelización" con Star icon entre Clientes y Categorías

---

## 2026-04-19 — Feat: FASE E — Comparador de Precios Proveedores

**FASE E — Comparador de Precios** (`/admin/compras/comparador`):
- API `/api/admin/supplier-prices` GET+POST — lista y upsert precios por proveedor+producto
- API `/api/admin/supplier-prices/import` POST — importa Excel con columnas `codigo`/`producto` + `precio`; mapea via `supplier_product_mappings` con fallback por nombre de producto
- API `/api/admin/supplier-prices/compare` GET — agrupa todos los precios por producto, calcula mejor proveedor, peor precio, ahorro potencial (%)
- Página `/admin/compras/comparador` — tabla expandible con precios por proveedor, badge "MEJOR", columna margen vs PVP, upload Excel por proveedor, modal para agregar precio manual con búsqueda de producto
- Sidebar: nuevo link "Comparador" con ícono Scale entre Compras
- Reposición integrada: cada producto en `/admin/reposicion` muestra "Mejor proveedor: X ($precio, N% ahorro)"

---

## 2026-04-19 — Feat: Fases A-D del plan Reemplazar Golan

**FASE A — Análisis de Costos** (`/admin/costos`):
- Calculadora de margen neto por producto incluyendo overhead operacional proporcional
- Semáforo verde/amarillo/rojo según margen neto
- Simulador de descuento: drag slider → ve qué pasa con los márgenes
- Configuración de costos fijos: arriendo, sueldos, contador, ERP, otros
- Exportar CSV

**FASE B — Cuaderno de Faltas** (`/admin/faltas`):
- Nueva tabla `faltas` en Cloud SQL
- Registro de productos que clientes piden sin stock
- Badge en sidebar con count pendiente
- Auto-notificación: al recibir OC o ajustar stock positivo → falta → `notified`
- Botón "Falta" en POS cuando producto tiene stock=0

**FASE C — Vencimientos** (`/admin/vencimientos`):
- Nueva tabla `product_batches` en Cloud SQL
- KPIs: vencidos, vencen en 30d, 90d
- Acción "Liquidar" → aplica discount_percent en producto
- Acción "Dar de baja" → stock_movements reason=adjustment negativo
- Alertas cron: email cuando productos vencen en < 7 días

**FASE D — POS mejoras**:
- Pago mixto (pos_mixed): efectivo + tarjeta separados, campos cash_amount/card_amount en orders
- Bioequivalentes: botón "Alternativas" en productos con stock=0 → modal con mismo active_ingredient en stock
- Botón "Falta" en productos sin stock → abre /admin/faltas

**Nueva tabla**: `supplier_price_lists` (base para FASE E comparador de proveedores)

---

## 2026-04-18 — Feat: Fidelización omnipresente + Compra Rápida + mejoras admin

- **Carrito**: Preview "Ganarás X puntos" para usuarios registrados. CTA de registro con puntos estimados para usuarios anónimos.
- **Admin dashboard**: Comparación "vs ayer" en el card "Ventas hoy" con badge ▲/▼ % delta.
- **Homepage "Compra Rápida"**: Sección personalizada para usuarios con historial — muestra sus 6 productos más comprados con botón directo "Agregar". API nueva: `GET /api/products/frequent`.
- **POS fidelización**: Customer history API ahora retorna `user_id` y `loyalty_points` cuando el teléfono corresponde a un usuario registrado. POS pasa `customer_user_id` al crear la venta → puntos acreditados en ventas presenciales. Badge de puntos visible en el panel de cliente del POS.
- **Top sellers homepage**: Filtro mínimo $1.000 CLP aplicado. WhatsApp button reposicionado para no solapar "Cotizar".
- **Inventario admin**: Columna "Valor Retail" eliminada de la tabla (solo queda en KPI summary).

---

---

## 2026-04-17 — Feat: Tercera Edad UX + ERP ampliado

- **Homepage (cliente)**: Grid de productos 1 col mobile / 2 col tablet / 3 col desktop. Nombres `text-lg`, precios `text-2xl`, tarjetas más grandes. Categorías 1 col mobile, botones 64px height.
- **Carrito**: Nombre producto `text-base/text-lg`, precio unitario `text-base`, subtotal `text-xl` en verde.
- **Mis Pedidos**: Precio orden `text-2xl font-black`, status badges más grandes (`text-sm`, iconos `w-5`).
- **Producto detalle**: Productos relacionados 1 col mobile, precios `text-xl`, imágenes más grandes.
- **Reportes ERP**: Nuevo tab "Clientes" — KPIs únicos, distribución registrados/guests, top 10 clientes por gasto. API agrega `customerMetrics`.
- **Reportes ERP**: Gráfico de área "Ventas por hora del día" (UTC-4 Chile) para identificar picos de actividad. API agrega `salesByHour`.
- **Configuración admin**: Sección "Información de la Farmacia" (nombre, dirección, teléfono, web) — datos dinámicos en cotizaciones.
- **Cotización**: Carga datos de farmacia desde `admin_settings` en lugar de constantes hardcodeadas.

---

## 2026-04-17 — Feat: Inventario, retiros en POS, mejoras operacionales

- **Inventario (`/admin/inventario`)**: Nueva página con valorización de stock (retail + costo + margen), filtros por bajo stock / sin stock / sin costo, sorting multi-columna, export CSV. Tab "Sugerencias de reposición" agrupa productos bajo umbral por proveedor con link directo a contacto y OC.
- **POS retiros**: Botón "Retiro" en POS abre modal para buscar reservas por código de 6 dígitos. Muestra detalles del pedido, permite aprobar con un clic → descuenta stock, envía email, actualiza stats del turno.
- **Órdenes — expiry countdown**: Badge ⏱ en lista de órdenes para reservas pendientes (rojo si expirada, ámbar si < 6h).
- **Búsqueda por ID**: Orders API `/api/admin/orders` ahora permite buscar por ID parcial (startsWith).
- **Sidebar**: Agregado link "Inventario" (Warehouse icon) entre Stock y Reportes.
- **API**: `GET /api/admin/pos/pickup?code=XXXXXX` busca orden por código de retiro.

---

## 2026-04-16 — Feat: external_id y códigos de barra editables en formulario de productos

- **external_id**: ahora editable en el formulario tanto al crear como al editar un producto (antes solo lectura)
- **Barcodes**: UI de chips con botón × para eliminar, input para agregar por Enter o botón "Agregar"
- Un producto puede tener múltiples códigos EAN; se guardan en tabla `product_barcodes`
- API `POST /api/admin/products`: crea barcodes junto al producto en la misma operación
- API `PUT /api/admin/products/[id]`: reemplaza todos los barcodes atómicamente en transacción Prisma (deleteMany + createMany)
- `api.ts`: `CreateProductData` ahora incluye `external_id` y `barcodes` opcionales
- Regenerado el cliente Prisma (`prisma generate`) para incluir la relación `product_barcodes`
- Fix colateral: `email` en `storePickup` ahora es opcional en el tipo TypeScript

---

## 2026-04-11 — Feat: mock fallback en carrusel "Más vendidos"

- Agregado array `MOCK_TOP_SELLERS` con 8 productos farmacéuticos realistas (Paracetamol, Ibuprofeno, Omeprazol, Loratadina, Vitamina C, Metformina, Clonazepam, Amoxicilina) con precios CLP y algunos con descuento.
- El estado inicial de `topSellers` usa los mocks — el carrusel se muestra inmediatamente sin esperar la API.
- `loadTopSellers` solo reemplaza mocks si la API devuelve datos reales (`data.length > 0`).
- Permite visualizar el carrusel en producción aunque no haya historial de ventas aún.
- Build OK (57 páginas, 0 errores TypeScript).

---

## 2026-04-10 — Chore: desktop package-lock.json trackeado

- Agregado `pharmacy-ecommerce/apps/desktop/package-lock.json` al repo (antes sin trackear).
- Build web OK (57 páginas, 0 errores). Sin cambios funcionales.
- Push `d088f64` → Vercel no hace rebuild (archivo fuera del root dir configurado).

---

## 2026-04-10 — Fix: Admin order detail + POS Electron sin productos

**Bug fix — "Orden no encontrada" en detalle de orden admin:**
- Causa: `orderApi.get(id)` llamaba `GET /api/orders/[id]` que filtra `WHERE user_id = auth.uid()`.
  Las órdenes de otros usuarios son invisibles para el admin con ese endpoint.
- Fix: Nuevo `GET /api/admin/orders/[id]` (usa `getAdminUser`, sin filtro de user_id, incluye `order_items`).
- `api.ts`: nuevo `orderApi.adminGet(id)` → `/api/admin/orders/[id]`.
- `admin/ordenes/[id]/page.tsx`: usa `adminGet` en lugar de `get`.

**Bug fix — POS en Electron no muestra productos al buscar:**
- Causa: `main.js` tenía `APP_URL = 'https://tu-farmacia.cl'` (dominio no configurado en Vercel).
  Las llamadas a `/api/products` fallaban silenciosamente (catch vacío → array vacío → "Sin resultados").
- Fix: `APP_URL` corregido a `'https://tu-farmacia.vercel.app'`.
- Fix adicional: POS ahora muestra el mensaje de error real en pantalla (ya no catch silente).

---

## 2026-04-10 — Canjeo de puntos + Banners de puntos ganados

**Banners de puntos ganados:**
- `/checkout/webpay/success`: banner amber "¡Ganaste X puntos!" (solo usuarios registrados, puntos ya acreditados)
- `/checkout/reservation`: banner amber "Ganarás X puntos al retirar" (futuro, se acreditan al aprobar el admin)
- `calcPoints` se usa client-side desde `loyalty-utils` — no requiere llamada extra al API

**Canjeo de puntos de fidelización:**
- Tasa: 1 punto = $100 CLP de descuento (simétrico a ganancia: $1.000 gastados = 1 punto)
- Solo disponible en "Retiro en tienda" (Webpay tiene riesgo de reversión de pago)
- UI en checkout: toggle "Usar X puntos = $Y.000 de descuento" con total tachado + total efectivo
- Backend atómico: deducción de puntos + creación de orden en misma transacción Prisma
- `loyalty_transactions` registra puntos negativos con `reason='redemption'` y `order_id`
- Restauración automática: al cancelar orden (admin PUT) y al expirar reserva (cron cleanup)
- `loyalty.ts`: nuevas funciones `redeemLoyaltyPoints`, `restoreLoyaltyPoints`, `POINTS_TO_CLP`
- `loyalty-utils.ts`: exporta `POINTS_TO_CLP` para uso en Client Components

---

## 2026-04-10 — Lector de códigos de barra en POS + App Electron

**Lector de barras (USB HID) en POS:**
- Detección por timing: chars < 50ms entre sí + Enter = escáner (no teclado humano)
- Listener global `keydown` con `{ capture: true }` para interceptar antes que cualquier input
- `handleBarcodeScan(code)`: busca producto por `external_id` via `/api/products?barcode=X`, agrega al carrito
- Flash visual verde/rojo 2.5s con nombre del producto o mensaje de error
- Indicador "Lector de barras activo" en el header del POS
- API `/api/products`: nuevo filtro `?barcode=X` → `where.external_id = X`
- Nota: los barcodes se cargarán cuando el usuario entregue la BD con `external_id` por producto

**App Electron (mostrador farmacia):**
- Nuevo directorio `pharmacy-ecommerce/apps/desktop/`
- `main.js`: carga `https://tu-farmacia.cl` (live URL, sin servidor local)
- Flag `--pos`: abre `/admin/pos` directamente en 1280×800, oculta menú
- Flag `--kiosk`: modo pantalla completa kiosk
- Menú de app: POS (Ctrl+P), Admin (Ctrl+A), Recarga (Ctrl+R), Atrás (Alt+←), Pantalla completa (F11), Modo kiosk (Ctrl+Shift+K), Imprimir (Ctrl+Shift+P)
- Atajos globales: F5 recarga, Escape sale de kiosk
- Links externos se abren en el browser del sistema
- `preload.js`: expone solo `window.electronApp.platform` (aislamiento seguro)
- Build: `electron-builder --win --x64` → genera portable + instalador NSIS
- `package.json` scripts: `start`, `start:pos`, `build`, `build:portable`

---

## 2026-04-10 — Fidelización de puntos + Checkout mejorado para adultos mayores

**Feature A — Fidelización:**
- Schema: `loyalty_points Int` + `phone String?` en `profiles`, tabla `loyalty_transactions` (user_id, order_id, points, reason)
- Regla: 1 punto por cada $1000 CLP gastados (`Math.floor(total/1000)`)
- Se otorgan al confirmar pago Webpay (`/api/webpay/return`) y al aprobar retiro en tienda (`/api/admin/orders/[id]` → `approve_reservation`)
- API `GET /api/loyalty` → `{ points: number }` para el cliente
- `/mis-pedidos`: banner amber con estrella mostrando puntos acumulados
- Checkout: preview de puntos a ganar en el resumen del pedido

**Feature D — Checkout UX (adultos mayores):**
- Si el usuario está logueado: pre-llena nombre + email automáticamente
- Oculta campo contraseña (ya tiene sesión activa)
- Muestra "Hola, {nombre}" + aviso "Sesión activa — tus datos están pre-completados"
- `processStorePickup` salta el flujo de registro/login si hay sesión
- Email pre-llenado es `readOnly` para usuarios logueados

**Fix adicional:** `handleDuplicate` en admin/productos faltaba el campo `cost_price`.

---

## 2026-04-10 — MCP Plugins: GitHub + GoodMem reparados

**Problema:** `/mcp` reportaba `Failed to reconnect to plugin:goodmem:goodmem`. GitHub también fallaba silenciosamente.

**Causa raíz GoodMem:**
- El plugin `goodmem@claude-plugins-official` instala un servidor MCP en TypeScript (`mcp/src/index.ts`).
- El `.mcp.json` apunta a `${CLAUDE_PLUGIN_ROOT}/mcp/dist/index.js`, pero ese archivo **no existía** — el build nunca se había corrido.
- Fix: `cd ~/.claude/plugins/cache/.../goodmem/0.1.0/mcp && npm install && npm run build` → generó `dist/index.js` (788 KB bundle).

**Causa raíz GitHub:**
- El plugin `github@claude-plugins-official` usa MCP HTTP apuntando a `https://api.githubcopilot.com/mcp/` con `Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}`.
- La variable de entorno no estaba seteada.
- Fix: obtener token con `gh auth token` → `setx GITHUB_PERSONAL_ACCESS_TOKEN "gho_..."` (persistente en Windows).

**Acción requerida:** Reiniciar Claude Code para que ambos cambios tomen efecto.

**Nota:** Si GitHub MCP falla con error de auth, crear PAT clásico en `github.com/settings/tokens` con scopes `repo`, `read:org`, `copilot`.

---

## 2026-04-09 — Obsidian Mind Vault integrado como PKM del proyecto

**Vault instalado:** `C:\Users\Admin\Documents\obsidian-mind` (v3.7.0 — breferrari/obsidian-mind)

**Qué es:** Sistema de PKM (Personal Knowledge Management) integrado con Claude Code.
Sirve como cerebro externo del proyecto: decisiones, gotchas, patrones, fases ERP, arquitectura.

**Mapeo de contenido Tu Farmacia → Vault:**
- `brain/Gotchas.md` → gotchas conocidos del codebase (Webpay 26 chars, CLP sin decimales, Firebase Edge Runtime, etc.)
- `brain/Patterns.md` → patrones recurrentes del stack
- `brain/Key Decisions.md` → decisiones: migración Supabase→Firebase, Cloud SQL, Transbank prod
- `brain/North Star.md` → objetivos: ERP completo, POS, reportes financieros
- `reference/` → arquitectura: Auth flow, DB schema, API routes
- `work/active/` → fases ERP en progreso
- `work/archive/` → fases completadas

**Archivos actualizados:**
- `CLAUDE.md` → sección "Obsidian Mind Vault (PKM)" con mapeo, sistema de memoria y reglas
- `context.md` → sección 13 con paths del vault y comandos `/om-standup`, `/om-wrap-up`, `/om-dump`

**Comandos Claude disponibles desde el vault** (correr `claude` dentro de `obsidian-mind/`):
- `/om-standup` — kickoff de sesión
- `/om-wrap-up` — cierre: archiva, actualiza índices, captura learnings
- `/om-dump` — captura rápida de decisiones/ideas

---

## PLAN ERP — Fases Priorizadas (Abril 9, 2026)

> Diseñado en sesión de brainstorming. Ejecutar fase por fase en este orden.

### Fase 1 — Proveedores + Compras ← **SIGUIENTE**
### Fase 2 — Punto de Venta (POS)
### Fase 3 — Reportes Financieros (márgenes, costos, exportación)

---

## FASE 1: Módulo Proveedores + Compras

### Contexto del negocio
- Proveedores principales: **Mediven** y **Globalpharma** (portales web)
- Las cajas llegan con **facturas en papel** (también PDF por email, pero difícil acceso)
- **Flujo preferido**: sacar foto con cámara del celular a la factura → OCR automático → confirmar productos → stock sube
- Los códigos de producto del proveedor NO coinciden con `external_id` actual → hay que construir mapeo
- Se quiere guardar **precio de costo** para calcular márgenes reales (alimenta Fase 3)

### Tablas nuevas (migración Prisma)

```prisma
model suppliers {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String   @db.VarChar(255)
  rut             String?  @db.VarChar(20)
  contact_name    String?  @db.VarChar(255)
  contact_email   String?  @db.VarChar(255)
  contact_phone   String?  @db.VarChar(20)
  website         String?  @db.VarChar(255)
  notes           String?
  active          Boolean  @default(true)
  created_at      DateTime @default(now()) @db.Timestamptz(6)
  updated_at      DateTime @default(now()) @updatedAt @db.Timestamptz(6)
  purchase_orders purchase_orders[]
  supplier_product_mappings supplier_product_mappings[]
}

model purchase_orders {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  supplier_id     String   @db.Uuid
  invoice_number  String?  @db.VarChar(100)
  invoice_date    DateTime? @db.Date
  status          String   @default("draft") @db.VarChar(20)  // draft | received | cancelled
  total_cost      Decimal? @db.Decimal(10, 2)
  notes           String?
  image_url       String?  @db.VarChar(500)   // foto de la factura subida a Firebase Storage
  ocr_raw         String?  // JSON raw del resultado Vision API (para debug)
  created_by      String   @db.VarChar(255)
  created_at      DateTime @default(now()) @db.Timestamptz(6)
  updated_at      DateTime @default(now()) @updatedAt @db.Timestamptz(6)
  suppliers       suppliers @relation(fields: [supplier_id], references: [id])
  items           purchase_order_items[]
}

model purchase_order_items {
  id                   String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  purchase_order_id    String   @db.Uuid
  product_id           String?  @db.Uuid    // null si no mapeado aún
  supplier_product_code String? @db.VarChar(100)
  product_name_invoice String?  @db.VarChar(255)  // nombre tal como viene en la factura
  quantity             Int
  unit_cost            Decimal  @db.Decimal(10, 2)
  subtotal             Decimal  @db.Decimal(10, 2)
  purchase_orders      purchase_orders @relation(fields: [purchase_order_id], references: [id], onDelete: Cascade)
  products             products? @relation(fields: [product_id], references: [id], onDelete: SetNull)
}

model supplier_product_mappings {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  supplier_id     String   @db.Uuid
  supplier_code   String   @db.VarChar(100)
  product_id      String   @db.Uuid
  created_at      DateTime @default(now()) @db.Timestamptz(6)
  suppliers       suppliers @relation(fields: [supplier_id], references: [id], onDelete: Cascade)
  products        products  @relation(fields: [product_id], references: [id], onDelete: Cascade)
  @@unique([supplier_id, supplier_code])
}
```

**Campo a agregar en `products`:**
```prisma
cost_price  Decimal? @db.Decimal(10, 2)   // precio de costo más reciente
```

**Relaciones a agregar en `products`:**
```prisma
purchase_order_items     purchase_order_items[]
supplier_product_mappings supplier_product_mappings[]
```

### API Routes nuevas

```
GET  POST  /api/admin/suppliers              → CRUD proveedores
GET  PUT   DELETE /api/admin/suppliers/[id]  → detalle/editar/eliminar proveedor

GET  POST  /api/admin/purchase-orders        → lista / crear nueva OC
GET  PUT   /api/admin/purchase-orders/[id]   → detalle / actualizar estado
POST       /api/admin/purchase-orders/[id]/receive  → confirmar recepción: actualiza stock + cost_price

POST       /api/admin/purchase-orders/scan   → recibe imagen base64, llama Vision API, devuelve líneas extraídas
POST       /api/admin/purchase-orders/[id]/map-product  → guarda mapeo supplier_code → product_id
```

### Páginas nuevas

```
/admin/proveedores              → lista de proveedores con stats (# OC, último pedido)
/admin/proveedores/nuevo        → formulario crear proveedor
/admin/proveedores/[id]         → detalle proveedor + historial de compras

/admin/compras                  → lista de órdenes de compra (filtro: proveedor, estado, fecha)
/admin/compras/nueva            → crear OC:
                                   1. Seleccionar proveedor
                                   2. FOTO con cámara (capture="environment") o subir imagen
                                   3. OCR → tabla de líneas extraídas
                                   4. Mapear productos no reconocidos (buscar en catálogo)
                                   5. Confirmar → stock sube, cost_price actualiza
/admin/compras/[id]             → detalle OC + líneas + foto de factura
```

### Flujo OCR con cámara (detalle técnico)

1. `<input type="file" accept="image/*" capture="environment">` → abre cámara en móvil
2. Frontend convierte imagen a base64 → POST `/api/admin/purchase-orders/scan`
3. API llama `@google-cloud/vision` TextDetection (ya tienen `GOOGLE_CLOUD_VISION_API_KEY`)
4. API parsea el texto para extraer líneas: código, descripción, cantidad, precio unitario
5. Para cada línea: buscar en `supplier_product_mappings` → si hay match, asigna `product_id`; si no, queda pendiente de mapeo manual
6. Frontend muestra tabla: líneas auto-reconocidas (verde) + líneas a mapear (naranja, con búsqueda inline)
7. Al confirmar: `POST /api/admin/purchase-orders/[id]/receive`
   - Incrementa `stock` en cada producto
   - Actualiza `cost_price` en `products`
   - Registra movimiento en `stock_movements` (reason: 'purchase')
   - Guarda nuevos mappings para el futuro
   - Cambia status a 'received'

### Sidebar — nuevos items a agregar

En `src/components/admin/Sidebar.tsx`:
- "Proveedores" (icono: Truck) → `/admin/proveedores`
- "Compras" (icono: ShoppingCart o ClipboardList) → `/admin/compras` (con badge de OCs en draft)

### Componente existente a aprovechar

`src/components/admin/ScanInvoiceModal.tsx` — revisar si reusar o refactorizar como base para el flujo de cámara+OCR.

### Orden de implementación sugerido

1. Migración Prisma (nuevas tablas + `cost_price` en products)
2. API `/api/admin/suppliers` CRUD
3. Página `/admin/proveedores`
4. API `/api/admin/purchase-orders/scan` (Vision OCR)
5. API `/api/admin/purchase-orders` CRUD + receive endpoint
6. Página `/admin/compras/nueva` (flujo cámara → OCR → mapeo → confirmar)
7. Página `/admin/compras` (lista) + `/admin/compras/[id]` (detalle)
8. Actualizar sidebar

---

## SESIÓN Abril 9, 2026 — ERP Fase 1 completa ✅

### Completado
- **Migración Prisma** (`prisma db push`): tablas `suppliers`, `purchase_orders`, `purchase_order_items`, `supplier_product_mappings` + campo `cost_price` en `products`
  - Approach: `prisma db push` + IP temporalmente autorizada en Cloud SQL (no `migrate dev` — DB sin historial de migraciones)
- **API `/api/admin/suppliers`** CRUD completo (GET, POST, GET/:id, PUT/:id, DELETE/:id con validación de OCs)
- **API `/api/admin/purchase-orders`**: lista/crear, detalle/actualizar, `/receive` (transacción atómica: stock++, cost_price, stock_movements, mappings), `/map-product`, `/scan` (Vision API OCR)
- **Páginas admin**: `/admin/proveedores` (lista + modal), `/admin/compras` (lista filtrable), `/admin/compras/nueva` (flujo 4 pasos: proveedor → foto → OCR → confirmar), `/admin/compras/[id]` (detalle)
- **Sidebar**: items "Proveedores" (Truck) + "Compras" (ClipboardList) con badge azul para OCs en draft
- **lib/api.ts**: `supplierApi` + `purchaseOrderApi` con tipos TypeScript
- **Obsidian vault**: `brain/Gotchas.md`, `brain/North Star.md`, `work/active/ERP Fase 1.md` poblados
- **Build**: 45/45 páginas, 0 errores TypeScript

### Decisiones técnicas
- OCR usa Google Cloud Vision API REST (misma key que scan-invoice existente, no SDK)
- Parser de facturas heurístico multi-línea (distinto al `HeuristicParser` existente que parsea etiqueta single-product)
- `$transaction` de Prisma en `/receive` para atomicidad
- Firebase Storage para foto de factura: diferido a Fase 2 (image_url = null en draft)

### Pendientes (siguiente sesión)
- ~~Fase 2 — POS (Punto de Venta)~~ ✅ Completado

---

## SESIÓN Abril 9, 2026 — ERP Fase 2 completa ✅ — POS (Punto de Venta)

### Completado
- **API `POST /api/admin/pos/sale`**: crea orden `completed` + `payment_provider='pos_cash'|'pos_debit'|'pos_credit'` en `$transaction` atómica con decremento de stock y `stock_movements` reason=`sale_pos`
- **Página `/admin/pos`**: layout split (búsqueda izquierda, carrito derecho), búsqueda con debounce, grid de productos, control qty en carrito, selector de método de pago, modal de confirmación con calculadora de vuelto para efectivo, campos opcionales de cliente
- **Sidebar**: item "POS" (Receipt) en segunda posición tras Dashboard
- **lib/api.ts**: `posApi.sale()` exportado

### Decisiones técnicas
- No se requirió migración de esquema: se reutiliza tabla `orders` con nuevos valores de `payment_provider`
- Validación de stock antes de iniciar transacción (pre-check) + decremento atómico en `$transaction`
- La venta POS aparece automáticamente en `/admin/ordenes` con estado `completed`
- `reason: 'sale_pos'` en `stock_movements` distingue ventas POS de ventas online

### Pendientes
- ~~Fase 3 — Reportes Financieros~~ ✅ Completado

---

## SESIÓN Abril 9, 2026 — ERP Fase 3 completa ✅ — Reportes Financieros

### Completado
- **API `/api/admin/reportes`** extendida:
  - Incluye órdenes POS (`payment_provider IN ['pos_cash','pos_debit','pos_credit']`) junto a órdenes online
  - KPIs nuevos: `totalCost`, `grossMargin`, `marginPct`
  - `channelBreakdown`: online vs POS (con desglose efectivo/débito/crédito)
  - `salesByDay`: divide `ventas` (online) + `ventas_pos` por día
  - `topProducts`: agrega `cost`, `margin`, `margin_pct` (cuando product tiene `cost_price`)
  - `topByMargin`: top 10 por margen bruto (filtrado a productos con costo)
  - `byCategory`: agrega `cost` y `margin` por categoría
- **Página `/admin/reportes`** renovada:
  - Tabs "Ventas" y "Financiero"
  - 6 KPI cards: Revenue, Órdenes, Ticket promedio, Costo total, Margen bruto, % Margen
  - Canal breakdown (Online vs POS con desglose de método de pago)
  - Gráfico líneas: ventas por día separado por canal
  - Tab Financiero: bar chart top 10 por margen, bar chart Revenue vs Costo por categoría, tabla financiera completa
  - CSV export con columnas Costo, Margen, % Margen

### Decisiones técnicas
- Margen solo calculable cuando products.cost_price ≠ NULL (se actualiza al recibir OCs en Fase 1)
- `margin_pct >= 20%` = verde, `>= 0%` = ámbar, `< 0%` = rojo
- Warning banner si totalCost === 0 (no hay productos con costo ingresado aún)

### Estado ERP
- Fase 1 Proveedores + Compras ✅
- Fase 2 POS ✅
- Fase 3 Reportes Financieros ✅
- Mejoras post-Fase 3 ✅

### Mejoras post-Fase 3 (misma sesión)
- **compras/[id]**: botón "Recibir OC" (llama `/receive` API) + banner verde cuando recibida. Antes no había UI para recibir OC.
- **GET /api/admin/stock-movements**: lista paginada con filtros por `reason`
- **POST /api/admin/stock-movements/adjust**: ajuste manual atómico ($transaction) con validación de stock no negativo
- **Página `/admin/stock`**: tabla de movimientos con delta coloreado, filtros, paginación + modal "Ajustar stock" con búsqueda de producto
- **Sidebar**: item "Stock" (ArrowUpDown)
- **Órdenes**: stat card "Ventas POS", filtro chip POS (matches pos_cash|debit|credit), CSV labels POS. API: parámetro `channel=pos|online`
- **Reportes API**: ahora incluye órdenes POS automáticamente (revenue POS visible en dashboard)

---

## SESIÓN Abril 9, 2026 — Imágenes rotas arregladas

### Completado
- **Script `fix_broken_images.mjs`**: detecta y arregla URLs de imagen rotas en Cloud SQL
  - Fase 1: chequeo paralelo de URLs (20 concurrentes) — detectó 149 URLs rotas de 1462
  - Fase 2: búsqueda de reemplazo via DuckDuckGo + update en Cloud SQL
  - Resultado: **147/149 arregladas, 0 sin reemplazo, 0 errores DB** (8.5 min)
  - Los primeros 2 fueron arreglados en tandas anteriores del mismo script
- **Nota técnica**: script actualiza Cloud SQL (Prisma/producción), no Supabase (obsoleto)

### Sin tareas pendientes

---

## SESIÓN Abril 9, 2026 — Limpieza post-migración

### Completado
- **Vars Supabase eliminadas de Vercel**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — ya no quedan referencias a Supabase en producción
- **Migración usuarios**: 3 usuarios migrados de Supabase Auth → Firebase Auth con mismos UIDs (Adan Ardiles, Gloria Cortes, admin@pharmacy.com). Script: `pharmacy-ecommerce/scripts/run-migration.mjs`
- **Reset-password branded**: `sendPasswordResetEmail` con `handleCodeInApp: true` → link del email apunta directamente a `https://tu-farmacia.cl/auth/reset-password?oobCode=...` (ya no pasa por página genérica de Firebase)
- **Cron cada 30 min**: `vercel.json` actualizado de `0 3 * * *` a `*/30 * * * *` (Vercel Pro confirmado)

### Sin tareas pendientes
El stack está 100% limpio y en producción.

---

## SESIÓN Abril 8, 2026 (tarde) — Migración completa

### Completado
- **Service account GCP**: `tu-farmacia-prod-1d6e516dbae2.json` creado, protegido en `.gitignore`
- **Credenciales en Vercel** (production + development): `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `GOOGLE_CLOUD_VISION_API_KEY`, `GOOGLE_SERVICE_ACCOUNT`, `CLOUD_SQL_INSTANCE`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **Cloud SQL**: instancia `tu-farmacia-db` (PostgreSQL 15, southamerica-east1), usuario `farmacia`, DB `farmacia`
- **Datos migrados**: 1482 productos, 17 categorías, 48 órdenes, 174 mapeos terapéuticos
- **Firebase Auth Email/Password**: habilitado via Identity Platform API
- **Supabase eliminado**: `@supabase/ssr`, `@supabase/supabase-js` removidos; `src/lib/supabase/` eliminado
- **Prisma 7**: schema actualizado con `driverAdapters` preview; `prisma generate` OK
- **Build**: ✅ 43/43 páginas, 0 errores TypeScript
- **Deploy**: `git push origin main` → Vercel auto-deploy lanzado
- **context.md**: creado en `pharmacy-ecommerce/context.md` con todas las credenciales y tareas

### Pendiente
1. **Migrar usuarios** (opcional): exportar CSV desde Supabase Auth → ejecutar `scripts/migrate-users.ts`
2. **Setear admin**: `npx ts-node scripts/migrate-users.ts --set-admin timadapa@gmail.com`
3. **Remover vars Supabase en Vercel** (después de validar): `vercel env rm NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
4. **Validar en producción**: registrar usuario → login → checkout → admin panel

### Credenciales Cloud SQL (también en context.md)
- Instance: `tu-farmacia-prod:southamerica-east1:tu-farmacia-db`
- IP pública: `34.39.232.207` (sin authorized networks — usa Cloud SQL connector IAM)
- DB: `farmacia` / User: `farmacia` / Password: `srcmlaYhkEo19YivrG4FDLH0woou`

---

## Estado anterior: EN MIGRACIÓN — Supabase → Firebase Auth + Cloud SQL (Abril 2026)

---

## SESIÓN Abril 8, 2026 — Build OK + bugs corregidos

### Resultado
- `next build` pasa: 43/43 páginas, 0 errores TypeScript

### Bug crítico encontrado y corregido
**Edge Runtime + firebase-admin:** `firebase-admin` no puede correr en Next.js middleware (Edge Runtime).
- **Síntoma:** Build falla / error en runtime al usar `adminAuth.verifySessionCookie()` en `src/middleware.ts`
- **Fix:** Reescrito el middleware para decodificar el JWT del session cookie sin usar firebase-admin SDK (decode sin verificar firma para routing decisions). La verificación segura ocurre en las API routes (Node.js runtime).
- **Regla para el futuro:** Todo código que use `firebase-admin` debe estar en API routes o Server Components con `export const runtime = 'nodejs'`, NUNCA en `middleware.ts`.

---

## EN PROGRESO: Migración Supabase → Firebase Auth + Cloud SQL PostgreSQL (Abril 7-8, 2026)

### Resumen
Migración completa del stack de datos de Supabase (Auth + PostgreSQL + RLS) a Google Cloud (Firebase Auth + Cloud SQL PostgreSQL 16) manteniendo Vercel como hosting.

### Código completado (esperando Cloud SQL billing fix):
- `src/lib/firebase/client.ts` — Firebase browser client singleton
- `src/lib/firebase/admin.ts` — Firebase Admin SDK (Auth)
- `src/lib/firebase/api-helpers.ts` — `getAuthenticatedUser`, `getAdminUser`, `errorResponse` (reemplaza lib/supabase/api-helpers.ts)
- `src/lib/firebase/middleware.ts` — Session cookie verification para /admin y /mis-pedidos
- `src/lib/db.ts` — Prisma client singleton con Cloud SQL connector
- `src/middleware.ts` — Actualizado a Firebase middleware
- `src/app/api/auth/session/route.ts` — POST/DELETE para crear/destruir session cookie Firebase
- `src/app/api/auth/register/route.ts` — Firebase Admin createUser
- `src/store/auth.ts` — Reescrito con Firebase Auth SDK
- `src/app/auth/forgot-password/page.tsx` — Firebase sendPasswordResetEmail
- `src/app/auth/reset-password/page.tsx` — Firebase confirmPasswordReset
- `src/lib/api.ts` — Todas las llamadas Supabase → fetch a API routes
- `src/app/api/products/route.ts` — Nueva, Prisma (reemplaza PostgREST)
- `src/app/api/products/[slug]/route.ts` — Nueva, Prisma
- `src/app/api/products/id/route.ts` — Nueva, Prisma
- `src/app/api/products/batch/route.ts` — Nueva, Prisma
- `src/app/api/products/filters/route.ts` — Nueva, Prisma
- `src/app/api/categories/route.ts` — Nueva, Prisma
- `src/app/api/categories/[id]/route.ts` — Nueva, Prisma
- `src/app/api/orders/route.ts` — Nueva, Firebase auth + Prisma
- `src/app/api/orders/[id]/route.ts` — Nueva, Firebase auth + Prisma
- `src/app/api/webpay/create/route.ts` — Reescrito con Prisma
- `src/app/api/webpay/return/route.ts` — Reescrito con Prisma ($transaction atomic)
- `src/app/api/store-pickup/route.ts` — Reescrito con Prisma
- `src/app/api/admin/orders/route.ts` — Reescrito con Prisma
- `src/app/api/admin/orders/[id]/route.ts` — Reescrito con Prisma (approve/reject/stock restore)
- `src/app/api/admin/products/route.ts` — Reescrito con Prisma
- `src/app/api/admin/products/[id]/route.ts` — Reescrito con Prisma
- `src/app/api/admin/products/[id]/stock/route.ts` — Reescrito con Prisma
- `src/app/api/admin/products/import/route.ts` — Reescrito con Prisma
- `src/app/api/admin/categories/route.ts` — Reescrito con Prisma
- `src/app/api/admin/categories/[id]/route.ts` — Reescrito con Prisma
- `src/app/api/admin/settings/route.ts` — Reescrito con Prisma
- `src/app/api/admin/reportes/route.ts` — Reescrito con Prisma
- `src/app/api/admin/scan-invoice/route.ts` — POST: Google Cloud Vision OCR + Firebase Storage audit trail + parser heurístico
- `src/lib/invoice-parser/types.ts` — Interfaces `ScannedProductData` + `InvoiceParser`
- `src/lib/invoice-parser/heuristic-parser.ts` — Parser regex para facturas CL (precio CLP, labs, receta, presentación)
- `src/lib/invoice-parser/registry.ts` — `getParser()` pluggable para múltiples formatos de factura
- `src/components/admin/ScanInvoiceModal.tsx` — Modal con capture/processing/review/error (camera + file upload)
- `src/app/api/admin/scan-invoice/route.ts` — Import actualizado a Firebase api-helpers
- `src/app/api/admin/clientes/route.ts` — Reescrito con Firebase Admin listUsers + Prisma
- `src/app/api/admin/clientes/[id]/route.ts` — Reescrito con Firebase Admin SDK
- `src/app/api/cron/cleanup-orders/route.ts` — Reescrito con Prisma updateMany
- `src/app/page.tsx` — loadDiscountedProducts usa fetch a /api/products
- `src/app/checkout/page.tsx` — Fallback sign-in usa Firebase
- `src/app/sitemap.ts` — Usa getDb() + Prisma directamente
- `src/lib/excel-import.ts` — loadAllProductsForDiff usa fetch paginado a /api/products
- `scripts/migrate-users.ts` — One-time script para migrar usuarios Supabase CSV → Firebase
- `database/cloud-sql-extra-tables.sql` — SQL para tablas extra (admin_settings, stock_movements, discount_percent)

### Build status: ✅ `next build` pasa — 43/43 páginas, 0 errores TypeScript
Bugs corregidos durante build:
- `firebase/middleware.ts`: firebase-admin no corre en Edge Runtime. Reescrito con decodificación JWT sin verificar firma (solo UX redirects; seguridad real en API routes con firebase-admin).
- `firebase/admin.ts`: `adminAuth` inicializaba en module load → crash build. Convertido a Proxy lazy.
- `firebase/client.ts`: Firebase client SDK hacía llamadas HTTP durante SSR prerender → `auth/invalid-api-key`. Fix: solo inicializar en browser (`typeof window !== 'undefined'`).
- `db.ts`: string literals `'PUBLIC'`/`'PASSWORD'` no compatibles con tipos del connector. Fix: `IpAddressTypes.PUBLIC` / `AuthTypes.PASSWORD`.
- `admin/settings`: `updated_at` no existe en `admin_settings`. Removido.
- `admin/products/[id]/stock`: `errorResponse` faltaba segundo argumento status. Agregado 400.

### Firebase configurado ✅ (Abril 8, 2026)
- Web app creada en Firebase: `1:164275006028:web:0bcb105734e84a2f7be2e9`
- Variables en Vercel (production + development): `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`
- `.env.local` actualizado con valores Firebase para desarrollo local
- **Pendiente Firebase**: habilitar Email/Password en Firebase Console → Authentication → Sign-in method
- **Pendiente**: crear service account GCP → agregar `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` a Vercel
- **Pendiente**: habilitar Vision API + crear API key → agregar `GOOGLE_CLOUD_VISION_API_KEY` a Vercel

### BLOQUEADOR: Cloud SQL billing
- Proyecto GCP `tu-farmacia-prod` tiene problema de billing en `timadapa@gmail.com`
- Ir a console.cloud.google.com/billing → vincular cuenta de facturación válida
- Luego: crear instancia Cloud SQL + migrar datos + generar prisma/schema.prisma

### Pendiente después de billing fix:
1. Crear Cloud SQL instance + DB + usuario
2. pg_dump desde Supabase → importar a Cloud SQL (+ ejecutar cloud-sql-extra-tables.sql)
3. Service account con roles/cloudsql.client
4. Cloud SQL Auth Proxy local → `prisma db pull` → `prisma generate`
5. Habilitar Firebase Auth Email/Password en console.firebase.google.com
6. Configurar variables de entorno en Vercel (agregar Firebase+CloudSQL, remover Supabase)
7. Ejecutar scripts/migrate-users.ts con CSV export de Supabase
8. Setear custom claim admin: `npx ts-node scripts/migrate-users.ts --set-admin email@x.com`
9. Remover paquetes npm: `@supabase/ssr @supabase/supabase-js`
10. Eliminar src/lib/supabase/ (4 archivos)
11. Build + deploy

---

## COMPLETADO: Fix dark mode admin - badges, modales, tablas, globales (Abril 6, 2026)

### Resumen
- **Dark mode badges de estado (dashboard)**: Los `textColor` de los stat cards en `admin/page.tsx` no tenían `dark:` variants. Fix: `dark:text-{color}-400` en todos los 6 stat cards.
- **Dark mode status badges (dashboard)**: `statusBadgeColors` en `admin/page.tsx` sin variantes dark. Fix: `dark:bg-{color}-900/30 dark:text-{color}-300` en los 7 estados.
- **Dark mode bulk actions bar (productos)**: Barra de selección masiva sin dark variants. Fix: `dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300`.
- **Dark mode import modal (productos)**: Todos los elementos del modal de importación Excel sin dark variants — summary cards, tabla preview (headers, rows, text), warning boxes, results section. Fix: dark variants completas en cada elemento.
- **Dark mode product table (productos)**: Mobile cards (badges activo/inactivo, stock, precio), pagination buttons (borders, text, hover), empty state (icon). Fix: `dark:` variants en todos.
- **Dark mode product form (productos)**: Label "Producto activo" sin dark variant, precio final sin dark variant. Fix: `dark:text-slate-300` / `dark:text-emerald-400`.
- **Dark mode categorias badges**: Badge "Activo" sin dark variant. Fix: `dark:bg-green-900/30 dark:text-green-300`.
- **Dark mode clientes badges**: Type badges (Registrado/Invitado) sin dark variants, avatar backgrounds/icons sin dark variants, order count sin dark variant. Fix: `dark:bg-{color}-900/30 dark:text-{color}-300` en todos.
- **Dark mode globals.css**: Agregadas overrides CSS para badges de colores en dark mode (green, yellow, amber, blue, red, orange, purple, pink) — backgrounds, text colors, borders, hover states. También overrides para slate text colors más precisos en dark mode.

### Archivos modificados
- `src/app/admin/page.tsx` — stat card textColors, statusBadgeColors con dark variants
- `src/app/admin/productos/page.tsx` — bulk actions bar, import modal, product table, pagination, form labels
- `src/app/admin/categorias/page.tsx` — active badge dark variant
- `src/app/admin/clientes/page.tsx` — type badges, avatars, order count dark variants
- `src/app/globals.css` — overrides CSS para colored badges, borders, backgrounds en dark mode

---

## COMPLETADO: Dark mode status badges + dark mode toggle en admin (Abril 4, 2026)

### Resumen
- **Dark mode STATUS_CONFIG / statusOptions**: Las listas de colores de estado en `admin/ordenes/page.tsx` y `admin/ordenes/[id]/page.tsx` no tenían variantes `dark:`. Como se usan concatenadas en `className`, los badges de estado aparecían con fondo claro intenso en dark mode. Fix: dark variants agregadas a todas las entradas (7 estados × 2 archivos).
- **Dark mode botones aprobar/rechazar (ordenes)**: Los botones inline "Aprobar" / "Rechazar" en la lista de órdenes (mobile + desktop) usaban `bg-emerald-100 text-emerald-800` y `bg-red-100 text-red-800` sin variantes dark. Fix: `dark:bg-emerald-900/30 dark:text-emerald-300` y equivalente en rojo.
- **Dark mode toggle en panel admin**: El header del admin no tenía toggle de tema claro/oscuro. Los admins debían volver a la Navbar pública para cambiarlo. Fix: botón Sol/Luna en el header del admin (junto a la notificación bell), usando el mismo `useTheme` hook que la Navbar pública.

### Archivos modificados
- `src/app/admin/ordenes/page.tsx` — STATUS_CONFIG con dark: variants, botones aprobar/rechazar con dark: variants
- `src/app/admin/ordenes/[id]/page.tsx` — statusOptions con dark: variants, email link en sección amber
- `src/app/admin/layout.tsx` — dark mode toggle (Sun/Moon) en header del admin
- `src/app/not-found.tsx` — dark mode (ícono, título, descripción)
- `src/app/error.tsx` — dark mode (ícono, título, descripción)
- `src/app/admin/error.tsx` — dark mode (ícono, título, descripción)
- `src/app/admin/loading.tsx` — dark mode en texto "Cargando panel..."
- `src/hooks/useAdminShortcuts.ts` — fix bug: shortcut `?` nunca disparaba porque `e.key === '?'` requiere Shift presionado, pero la condición tenía `!e.shiftKey` que lo bloqueaba siempre. Fix: eliminar el chequeo `!e.shiftKey`

---

## COMPLETADO: URL params + charts dark mode + bugfixes admin (Abril 4, 2026)

### Resumen
- **Bug fix: URL params no se leían en admin/productos**: La página inicializaba `stockFilter=''` y `searchTerm=''` con `useState('')` sin importar la URL. Links desde NotificationBell (`?stock=out`, `?stock=low`), dashboard (`?stock=low`, `?search=productname`), y shortcut ⌘N (`?action=new`) eran ignorados. Fix: `useSearchParams` con lazy `useState` initializer — 0 re-renders extra, se aplica en mount.
- **Charts dark mode (Recharts)**: Grid y axis de charts en `admin/page.tsx` y `admin/reportes/page.tsx` usaban `stroke="#374151"` / `"#E2E8F0"` hardcodeados. Recharts usa SVG props, no puede usar Tailwind `dark:`. Fix: `MutationObserver` en `document.documentElement` que detecta cambio de clase `dark` y actualiza `isDark` state. Grid usa `#334155` (dark) / `#E2E8F0` (light), axis usa `#64748B` / `#94A3B8`.

### Archivos modificados
- `src/app/admin/productos/page.tsx` — lee `?stock`, `?search`, `?action=new` desde URL en mount
- `src/app/admin/page.tsx` — isDark state con MutationObserver para chart colors
- `src/app/admin/reportes/page.tsx` — isDark state con MutationObserver para chart colors

---

## COMPLETADO: Fix notificaciones + dark mode total admin (Abril 4, 2026)

### Resumen
- **Fix crítico NotificationBell**: Dos bugs raíz corregidos: (1) cada poll sobreescribía `read: false` borrando el estado leído; (2) `clearAll` vaciaba el array pero el siguiente poll lo repoblaba completo. Fix: `dismissedIds` como `useRef<Set<string>>` — IDs descartadas persisten entre re-renders. Merge ahora preserva `read` state con `existingReadState` map. Agregado botón ✕ por notificación (hover).
- **Dark mode admin/clientes**: Dark mode completo — tabla (header, rows, hover, selected), mobile cards, footer, side panel (container, header, botones), info de cliente, edit form labels/buttons, order stats, order history cards, items, badges.
- **Dark mode admin/categorias**: Skeletons, badge "Inactivo", warning box de eliminación, hover buttons.
- **Dark mode admin/reportes**: Loading skeleton, KPI icon backgrounds (dark tints), chart title faltante.
- **Dark mode admin/productos (completo)**: Todos los inputs/selects del filter bar (search, categoría, stock, sort), filter toggle button, stats pill, active filter chips (todos los colores), advanced filters panel (labels, lab search, lab list, prescription buttons, price inputs, quick filters, summary box, clear button).

### Archivos modificados
- `src/components/admin/NotificationBell.tsx` — fix dismiss persistente + preservar read state + botón ✕ por item
- `src/app/admin/clientes/page.tsx` — dark mode completo
- `src/app/admin/categorias/page.tsx` — dark mode completo
- `src/app/admin/reportes/page.tsx` — dark mode completado
- `src/app/admin/productos/page.tsx` — dark mode completado (filter bar + advanced filters)

---

## COMPLETADO: Dark mode completo en todas las páginas admin (Abril 3, 2026 - continuación)

### Resumen
- **Dark mode StockModal**: Historia de movimientos (sticky header, dividers, badges de delta +/-).
- **Dark mode admin/ordenes/[id]**: Timeline, loading skeleton, cards de acción (reserva, webpay), sección de productos, cliente, resumen, acciones rápidas.
- **Dark mode admin/ordenes/page**: Header, stat cards, filtros, tabla desktop (thead, tbody, rows), mobile cards, paginación, empty state.
- **Dark mode admin/configuracion**: Labels, placeholders, divisor, mensaje de guardado.
- **Dark mode admin/page (dashboard)**: Header, skeletons, text de stat cards, chart headers, listas de stock crítico y órdenes recientes.
- **Dark mode admin/productos**: Header, form modal bg, import modal bg, labels del form, tabla (thead, tbody, rows hover/selected, stock badges), loading skeleton.

### Archivos modificados
- `src/components/admin/StockModal.tsx` — historial de movimientos con dark mode
- `src/app/admin/ordenes/[id]/page.tsx` — dark mode completo
- `src/app/admin/ordenes/page.tsx` — dark mode completo
- `src/app/admin/configuracion/page.tsx` — dark mode completo
- `src/app/admin/page.tsx` — dark mode en dashboard
- `src/app/admin/productos/page.tsx` — dark mode parcial (header, modals, tabla)

---

## COMPLETADO: Bugfixes, dark mode admin, categorías inactivas (Abril 3, 2026)

### Resumen
- **res.ok en reportes**: `loadData` en reportes ahora verifica `res.ok` antes de `setData`. Sin esto, un 401/403 ponía `{ error: '...' }` en `data` y crasheaba el render en `data.kpis.totalRevenue`.
- **Crash en clientes**: Panel de detalle de cliente hacía `data.customer.name` sin verificar `res.ok`. Si la API fallaba (e.g. 404), crasheaba. Corregido con early return.
- **Register redirect**: Página de registro ignoraba `?redirect=` del query. Al registrarse desde checkout, el usuario volvía al home perdiendo el carrito. Corregido con Suspense + `useSearchParams`, igual que login page. También preserva el redirect en el link "Inicia sesión".
- **Cart botón + sin deshabilitar**: El botón de incrementar cantidad en carrito no tenía `disabled` cuando `quantity >= stock`. El usuario podía hacer click indefinidamente (cartStore lo capaba en fetchCart, pero sin feedback visual). Corregido: `disabled={item.quantity >= item.stock}`.
- **Categorías inactivas invisibles (bug crítico)**: `productApi.listCategories()` filtraba `active = true`. Si el admin desactivaba una categoría, desaparecía del panel de admin sin poder reactivarla. Corregido: `listCategories` acepta `activeOnly` param (default: `true` para público, `false` para admin). Admin categorías y dashboard usan `false`.
- **Dark mode NotificationBell dropdown**: Fondo, bordes, textos y highlight de no-leído actualizados.
- **Dark mode CommandPalette**: Dialog, input, resultados, footer con teclas de acceso, búsquedas recientes.
- **Dark mode admin/reportes**: Header, botones de período, KPI cards, headers de charts, tabla de productos, empty states.

### Archivos modificados
- `src/lib/api.ts` — listCategories acepta activeOnly param
- `src/app/admin/categorias/page.tsx` — usa listCategories(false) + dark mode completo
- `src/app/admin/page.tsx` — usa listCategories(false) para conteo correcto
- `src/app/admin/reportes/page.tsx` — res.ok check + dark mode completo
- `src/app/admin/clientes/page.tsx` — res.ok check antes de acceder a data.customer
- `src/app/auth/register/page.tsx` — Suspense + useSearchParams + redirect chain
- `src/app/carrito/page.tsx` — botón + disabled cuando quantity >= stock
- `src/components/admin/NotificationBell.tsx` — dark mode dropdown
- `src/components/admin/CommandPalette.tsx` — dark mode dialog completo

---

## COMPLETADO: Dark mode elegante + responsividad móvil (Abril 3, 2026)

### Resumen
- **Dark mode elegante**: Reemplazada paleta `slate-*` (azul-grisáceo `#0f172a`) por warm-neutral dark (`#13131a`, `#1e1e27`, `#2a2a35`). Un único bloque CSS en `globals.css` post-utilities override afecta todas las páginas sin tocar archivos individuales. Referencia visual: GitHub Dark, Linear, Vercel dark UI.
- **Responsividad móvil 320-375px**: 6 bugs críticos corregidos:
  - `overflow-x: hidden` en `html` y `body` — elimina scroll horizontal global
  - Navbar logo: `text-sm sm:text-lg`, SVG `w-7 sm:w-[34px]`, gap reducido en xs
  - Cart button navbar: `px-3 sm:px-4`, `min-h-48px` en xs
  - Categorías home: `text-sm sm:text-base` en grid 2 columnas
  - Mis-pedidos lista: badge de estado `flex-col` en móvil con `whitespace-nowrap`
  - Mis-pedidos detalle: `min-w-0 flex-1` en nombres, pickup code `text-3xl sm:text-4xl`
  - Reserva: pickup code `text-3xl sm:text-5xl` (era `text-5xl` fijo — desbordaba)
- **Dark mode auth**: `auth/login` y `auth/register` — todos los elementos con `dark:` variants (register estaba completamente sin dark mode)
- **Mis-pedidos detail statusConfig**: todos los badges de estado con `dark:bg-*/30 dark:text-*-300`
- **context.md creado**: Documentación completa de herramientas, CLIs, plugins y estado del proyecto para retomar desde otro PC

### Archivos modificados
- `src/app/globals.css` — paleta dark mode elegant + overflow-x:hidden + overrides de slate-*
- `src/components/Navbar.tsx` — logo compacto xs, cart button xs, gap reducido
- `src/app/page.tsx` — categorías text-sm xs
- `src/app/mis-pedidos/page.tsx` — badge estado layout móvil
- `src/app/mis-pedidos/[id]/page.tsx` — statusConfig dark:, product min-w-0, pickup code size, header badge
- `src/app/checkout/reservation/page.tsx` — pickup code size
- `src/app/auth/login/page.tsx` — dark mode completo
- `src/app/auth/register/page.tsx` — dark mode completo
- `context.md` (raíz repo) — nuevo archivo de contexto

---

## COMPLETADO: Dark mode + recetas WhatsApp + horario (Abril 2, 2026)

### Resumen
- **Dark mode completo**: Todas las páginas (homepage, producto, carrito, checkout, mis-pedidos, auth, resultados Webpay) ahora tienen soporte completo dark mode con `dark:` variants de Tailwind.
- **Toggle dark mode en Navbar**: Botón Sol/Luna en la barra superior. Persiste preferencia en localStorage (`theme`). Anti-flash script en `<head>` evita parpadeo al cargar.
- **Checkout WhatsApp (Webpay)**: Al seleccionar pago Webpay y confirmar, aparece modal para contactar por WhatsApp antes de proceder al pago, evitando problemas de stock.
- **Productos con receta → solo WhatsApp**: Productos `prescription_type === 'retained'` (Receta Retenida) o `prescription_type === 'prescription'` (Receta Médica) ya no muestran botón "Agregar al carrito". En su lugar muestran aviso amarillo explicativo + botón verde "Consultar por WhatsApp" con mensaje pre-llenado del producto.
- **Horario de atención actualizado**: Footer ahora muestra "Lunes a Domingo: 9:00 - 20:00" (antes era L-V 9-19 + Sáb 10-14).

### Archivos modificados
- `src/app/layout.tsx` — horario footer, dark mode footer, anti-flash script
- `src/app/page.tsx` — dark mode homepage
- `src/app/producto/[slug]/page.tsx` — dark mode + lógica WhatsApp para recetas
- `src/app/carrito/page.tsx` — dark mode
- `src/app/checkout/page.tsx` — dark mode + modal WhatsApp pre-Webpay
- `src/app/checkout/webpay/success/page.tsx` — dark mode
- `src/app/mis-pedidos/page.tsx` — dark mode
- `src/app/mis-pedidos/[id]/page.tsx` — dark mode
- `src/components/Navbar.tsx` — toggle Sol/Luna
- `src/hooks/useTheme.ts` — localStorage key `theme` (app-wide)
- `tailwind.config.js` — `darkMode: 'class'`

---

## COMPLETADO: Correcciones UX y calidad de código (Marzo 27, 2026 — sesión 5)

### Resumen
- **isPickup consistente en admin detalle de orden**: `admin/ordenes/[id]/page.tsx` usaba `!!order.pickup_code` para detectar retiro, mientras el resto del código usa `payment_provider === 'store'`. Unificado a `payment_provider === 'store'`.
- **Feedback de guardado en Configuración**: `handleSave` en admin/configuracion mostraba "Guardado" incluso si el PATCH devolvía un HTTP error. Corregido: ahora solo muestra éxito si `res.ok`.
- **Redirect chain en registro**: Si un usuario llegaba a login con `?redirect=/mis-pedidos` y luego hacía clic en "Regístrate", perdía el contexto y al registrarse volvía al home. Corregido: login page pasa el `?redirect=` al link de registro, y la página de registro ahora acepta y usa ese parámetro con Suspense boundary.
- **Cart stock cap**: La página de carrito no limitaba la cantidad al stock disponible. Un usuario podía agregar más unidades de las disponibles y solo descubrirlo al hacer checkout. Corregido: `CartItem` ahora incluye `stock`, `fetchCart` lo popula desde los datos del producto y automáticamente ajusta cantidades que excedan el stock (también sincroniza localStorage). El botón "+" en el carrito se deshabilita al alcanzar el stock. Se muestra indicador visual "Quedan N" o "Máximo disponible" cuando stock ≤ 10.

---

## COMPLETADO: Correcciones checkout y UX (Marzo 27, 2026 — sesión 4)

### Resumen
- **Bug crítico: botón checkout deshabilitado para usuarios autenticados**: La condición `disabled` del botón incluía `!password || !confirmPassword`, pero para usuarios con sesión activa esos campos no se renderizan y su estado permanece como `''`. Resultado: usuarios logueados nunca podían completar una compra. Corregido: condición cambiada a `(!user && (!password || !confirmPassword))`.
- **Email no trimmeado en payload de checkout**: `email` no se le aplicaba `.trim()` en el payload enviado a `/api/webpay/create` y `/api/store-pickup`, a diferencia de `name`, `surname`, `phone`. Corregido.
- **Race condition en webpay/return**: El flujo SELECT + UPDATE no era atómico. Dos callbacks concurrentes de Transbank podían ambos encontrar la orden en estado `pending` y deducir el stock dos veces. Corregido: el UPDATE ahora incluye `.eq('status', 'pending')` (compare-and-swap). Si el UPDATE no afecta filas, el request es idempotente y redirige a éxito.
- **Login redirect post-checkout**: Al hacer clic en "Inicia sesión" desde `/checkout`, el usuario era redirigido al home después del login, perdiendo el carrito/formulario. Corregido: login page acepta `?redirect=` query param. Links en checkout apuntan a `/auth/login?redirect=/checkout`. También corregido en `/mis-pedidos` → `/auth/login?redirect=/mis-pedidos`.

---

## COMPLETADO: Correcciones y mejoras (Marzo 27, 2026 — sesión 3)

### Resumen
- **Bug crítico: user_id en órdenes**: `/api/webpay/create` y `/api/store-pickup` siempre creaban órdenes con `user_id: null`. Los usuarios autenticados no veían sus órdenes en `/mis-pedidos`. Corregido: ambas rutas ahora llaman `getAuthenticatedUser()` y asignan `user_id` si hay sesión activa.
- **NotificationBell loop infinito**: `lastCheck` estaba en deps de `useEffect`, causando que `setLastCheck(new Date())` al final de `checkNotifications` re-disparara el efecto inmediatamente (bucle cerrado sin pausa de 30s). Corregido: eliminado `lastCheck`, `checkNotifications` envuelto en `useCallback([user])`.
- **Admin dashboard revenue**: Ingresos calculados con el endpoint `/api/admin/reportes` (server-side, sin límite de 1000 órdenes). La llamada se inicia en paralelo antes del `Promise.all` para no bloquear carga.
- **Admin dashboard "Por atender"**: Ahora incluye `pending + reserved` (retiros de tienda también necesitan atención).
- **Páginas de recuperación de contraseña**: Nuevas páginas `/auth/forgot-password` y `/auth/reset-password` con flujo completo de Supabase `resetPasswordForEmail` + `onAuthStateChange('PASSWORD_RECOVERY')`.
- **Show/hide contraseña**: Toggle Eye/EyeOff agregado a campos de contraseña en `/auth/login` y `/auth/register`.
- **Cron + emails reservas expiradas**: `cleanup-orders` ahora consulta emails antes del UPDATE y llama `sendPickupRejectionEmail` (no-blocking) para cada reserva cancelada por expiración.

---

## COMPLETADO: Correcciones y mejoras adicionales (Marzo 27, 2026 — sesión 2)

### Resumen
- **Admin sidebar badge fix**: `layout.tsx` usaba `orderApi.list()` (filtraba por user_id). Cambiado a `orderApi.listAll()` — ahora muestra el conteo real de órdenes pendientes de clientes.
- **Admin CommandPalette fix**: Búsqueda de órdenes usaba `orderApi.list({ limit: 5 })`. Cambiado a `orderApi.listAll({ limit: 20 })` — ahora encuentra órdenes de cualquier cliente.
- **Admin clientes — bug fix**: `STATUS_LABELS` no incluía el estado `'paid'`. Órdenes Webpay en estado "Pagado" no mostraban badge. Agregado.
- **Revenue bug fix**: Cálculo de ingresos en dashboard incluía órdenes `reserved` (retiros sin pagar). Corregido para solo sumar estados `['paid','processing','shipped','delivered']`.
- **filteredOrders memo bug**: `filterProvider` estaba ausente del array de dependencias del `useMemo` en `/admin/ordenes`. El filtro por proveedor de pago no se aplicaba. Corregido.
- **Email aprobación de reserva**: Nueva función `sendPickupApprovalEmail()` en `email.ts`. Cuando admin aprueba una reserva de retiro, el cliente recibe email con su código y el total a pagar en tienda.
- **approveReservation API**: Expandido `select` para obtener `guest_email`, `guest_name`, `guest_surname`, `pickup_code`, `total`, y campos de items. Llama `sendPickupApprovalEmail` de forma no-bloqueante tras aprobar.

---

## COMPLETADO: Mejoras post-Webpay (Marzo 27, 2026)

### Resumen
- **Timeline órdenes Webpay**: Admin `/ordenes/[id]` y `/mis-pedidos/[id]` ahora usan `webpayFlow = ['paid','processing','delivered']` detectado via `payment_provider === 'webpay'`. Ya no muestra el paso "Enviado" irrelevante.
- **Tarjeta acción admin**: Órdenes Webpay con `status='paid'` muestran card azul "Pago Webpay confirmado — Preparar pedido".
- **Admin lista órdenes — bug fix**: Columna "Pago" estaba hardcodeada a "Retiro" para todos. Ahora muestra "Webpay" (badge azul) o "Retiro" (badge ámbar) según `payment_provider`.
- **Filtro por método de pago**: Panel de filtros avanzados + chip de stat clickeable "Webpay a preparar".
- **Cron limpieza**: `GET /api/cron/cleanup-orders` cancela órdenes Webpay pendientes > 30 min y reservas de retiro expiradas. Configurado en `vercel.json` cada 30 min.
- **Fix Resend build**: Inicialización lazy del cliente Resend (evita error en build sin `RESEND_API_KEY`).
- **Emails**: `sendWebpayConfirmation()` y `sendPickupReservationEmail()` con templates HTML branded.
- **CRON_SECRET**: Agregar a Vercel env vars (cualquier string seguro, ej: `openssl rand -hex 32`).

---

## COMPLETADO: Integración Webpay Plus (Marzo 26, 2026)

### Resumen
- Reemplazó MercadoPago como método de pago online
- Instalado `transbank-sdk` npm
- Creado cliente singleton en `src/lib/transbank.ts` (integration/production por env vars)
- **Nuevas rutas API:**
  - `POST /api/webpay/create` — crea orden `pending` + transacción Transbank
  - `GET|POST /api/webpay/return` — maneja callback de Transbank, hace commit, descuenta stock
- **Nuevas páginas:**
  - `/checkout/webpay/success` — muestra comprobante + token para validación
  - `/checkout/webpay/error` — muestra error/cancelación + token para validación
- Checkout actualizado con selector de método de pago: Webpay Plus (default) o Pagar en tienda
- Todos los edge cases manejados: cancelación (TBK_TOKEN), rechazo, timeout, error de formulario
- Credenciales integración: commerce `597055555532`, api key `579B532A...`
- Credenciales producción: commerce `597053071648`, api key pendiente (enviado formulario validación a Transbank)
- **Validación Transbank enviada** — API key de producción llega en ~24h hábiles

### Env vars Vercel (producción)
- `TRANSBANK_ENVIRONMENT=integration` (cambiar a `production` cuando llegue API key)
- `TRANSBANK_COMMERCE_CODE` (agregar cuando sea producción)
- `TRANSBANK_API_KEY` (agregar cuando llegue de Transbank)
- `NEXT_PUBLIC_BASE_URL=https://tu-farmacia.cl`

### Activar producción (cuando llegue API key)
```bash
vercel env add TRANSBANK_ENVIRONMENT production --value production --force
vercel env add TRANSBANK_COMMERCE_CODE production --value 597053071648 --force
vercel env add TRANSBANK_API_KEY production --value <KEY> --force
git push origin main  # auto-deploy
```

---

## COMPLETADO: Setup entorno + verificación estado (Marzo 24, 2026)

### Resumen
- Instaladas dependencias `npm install` en `apps/web` (176 paquetes: resend, recharts, xlsx, etc.)
- Creado `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verificado via Supabase CLI (`supabase link --project-ref jvagvjwrjiekaafpjbit` + `db query --linked`) que **todas las migraciones ya están aplicadas**: tablas `stock_movements`, `admin_settings` (con seed data), columna `discount_percent` en `products`
- Confirmado que todos los planes de `docs/plans/` están **100% implementados** en código:
  - Stock management + historial + badge sidebar ✅
  - Reportes con Recharts + CSV export ✅
  - Alertas email con Resend ✅
  - Sistema de descuentos (homepage ofertas, badges, checkout, admin) ✅
  - Fix import Excel no-destructivo (UPSERT por external_id) ✅
  - Fix script Python imágenes (fallback queries, progress file, rate limit) ✅
- Build exitoso con `NODE_OPTIONS=--max-old-space-size=6144` (máquina requiere 6GB para build)

---

## COMPLETADO: Fixes de calidad y seguridad (Marzo 20, 2026)

### Mejoras implementadas

**Validaciones y UX checkout**:
- Dirección de envío ahora requerida para pagos con MercadoPago (antes era opcional, generando órdenes sin dirección)
- Indicador visual `*` en campo de dirección
- Placeholder mejorado con ejemplo: "Calle, número, departamento, ciudad..."

**Store pickup**:
- Tiempo de expiración de reserva extendido de 4 a 24 horas (más razonable para adultos mayores)

**Robustez**:
- `formatPrice()` ahora maneja NaN con guard: retorna `$0` en vez de `$NaN`

**Accesibilidad y textos admin**:
- Corregido acento: "Marcar leídas" en NotificationBell

---

## COMPLETADO: UX y Rendimiento (Marzo 20, 2026)

### Mejoras implementadas

**Detalle de pedido del cliente (`/mis-pedidos/[id]`)**:
- Timeline visual de estado del pedido (similar al admin pero orientado al cliente)
- Soporte para flujo de retiro en tienda y envío a domicilio
- Botón de imprimir pedido
- Enlace de WhatsApp para consultas sobre el pedido
- Etiqueta correcta "Retiro en tienda" vs "Envío" en resumen
- Fecha de expiración visible para reservas pendientes
- Conteo de productos en resumen

**Página de producto (`/producto/[slug]`)**:
- Sección de descripción del producto visible para el cliente

**Panel admin - Rendimiento**:
- Optimización de carga de stats: reemplazado fetch de 1000+ productos por queries con `stock_filter` (4 queries livianas en paralelo)
- Eliminado polling de localStorage cada 500ms; reemplazado por CustomEvent `sidebar-collapse` para comunicación sidebar-layout

**SEO y accesibilidad**:
- `robots.txt` con reglas de crawling (bloquea admin, api, auth, checkout)
- Corrección de acentos en página de error ("salió", "Ocurrió")

---

## COMPLETADO: Sistema de Descuentos (Marzo 4, 2026)

### Funcionalidad
- **Campo DB**: `products.discount_percent INTEGER NULL CHECK(1-99)` — requiere migración SQL manual en Supabase
- **Helper**: `discountedPrice(price, pct)` en `src/lib/format.ts` — Math.ceil, compatible con CLP
- **Cart store**: aplica precio con descuento en `subtotal` y `total`; `CartItem` incluye `original_price` y `discount_percent`
- **Admin productos**: columna "Descuento" en tabla con badge rojo `-X% OFF`; campo numérico en form con preview "Precio final: $..."
- **API PATCH** `/api/admin/products/[id]`: acepta `discount_percent` (0 → null en DB)
- **Homepage Ofertas**: carrusel horizontal entre buscador y categorías, solo si hay productos con descuento activos
- **Homepage grid**: badge `-X% OFF` + precio original tachado en cards con descuento
- **Checkout APIs**: `guest-checkout` y `store-pickup` usan precio con descuento en total y `price_at_purchase`

### Migración SQL requerida
```sql
ALTER TABLE products
ADD COLUMN discount_percent INTEGER DEFAULT NULL
CHECK (discount_percent > 0 AND discount_percent <= 99);
```

---

**Sitio live**: https://tu-farmacia.cl (también https://tu-farmacia.vercel.app)
**Admin**: https://tu-farmacia.cl/admin
  - timadapa@gmail.com / Admin123!

---

## COMPLETADO: Fix Imágenes en Importación de Productos (Marzo 2026)

### Bug crítico resuelto: importación destruía imágenes de productos

**Problema**: `scripts/import_to_supabase.js` hacía `DELETE` de todos los productos y pedidos antes de reimportar, dejando `image_url: null` en 1189 productos.

**Cambios**:
- `scripts/import_to_supabase.js`: reemplazado DELETE-all + insert con UPSERT no-destructivo. Carga existentes por `external_id`, actualiza precio/stock/etc sin tocar `image_url`, inserta solo productos verdaderamente nuevos.
- `apps/web/src/app/api/admin/products/import/route.ts`: añadido safety check antes de INSERT para filtrar productos que ya existen por `external_id` (previene duplicados cuando `diffProducts()` falla).
- `scripts/update_images_supabase.py`: mejoras — múltiples queries de fallback por producto (hasta 4), detección de rate limit + espera 30s, archivo de progreso `image_search_progress.json` para reanudar si se interrumpe, filtro de `.gif` y URLs largas.
- Instalado package `resend` (faltaba, bloqueaba build).

**Para recuperar imágenes perdidas**: ejecutar `python scripts/update_images_supabase.py` desde `pharmacy-ecommerce/scripts/`.

---

## COMPLETADO: Stock Management + Reportes + Alertas Email (Marzo 2026)

### 1. Gestión de Stock (`admin/productos`)
- **Edición inline**: click en el número de stock en la tabla → se convierte en input, Enter guarda, Escape cancela
- **StockModal** (`src/components/admin/StockModal.tsx`): botón 🕐 abre modal con stock actual, form para agregar/restar unidades, razón, e historial de movimientos
- **API**: `PATCH /api/admin/products/[id]/stock` — delta + reason → actualiza `products.stock` + inserta en `stock_movements`
- **API**: `GET /api/admin/products/[id]/stock` — devuelve historial de movimientos del producto
- **DB**: tabla `stock_movements` (id, product_id, delta, reason, admin_id, created_at) con RLS admin-only

### 2. Página de Reportes (`admin/reportes`)
- Período: 7d / 30d / 90d con botones rápidos
- KPIs: revenue total, órdenes pagadas, ticket promedio, productos distintos
- Gráficos (Recharts): ventas por día (line), revenue por categoría (pie), top 10 productos (bar horizontal)
- Tabla detallada con ranking de productos, exportable a CSV con BOM UTF-8
- Datos reales desde `order_items` — reemplaza datos simulados del dashboard
- **API**: `GET /api/admin/reportes?from=&to=`

### 3. Configuración (`admin/configuracion`)
- Form para `alert_email` y `low_stock_threshold`
- **DB**: tabla `admin_settings` (key, value) con seed: threshold=10, email=admin@pharmacy.com
- **API**: `GET/PATCH /api/admin/settings`

### 4. Alertas Email (Resend)
- Dependencia: `resend@^6.9.3`
- `src/lib/email.ts`: `sendLowStockAlert(email, products, threshold)`
- Trigger: al aprobar una reserva (`PUT /api/admin/orders/[id]` action=approve_reservation), si stock resultante ≤ umbral → email al admin
- No-blocking: error en email no falla la respuesta principal

### 5. Dashboard
- Gráfico "Top Productos" ahora usa datos reales de `order_items` via `/api/admin/reportes`
- Eliminada función `calculateTopProducts` que usaba datos simulados (`100 - stock`)

### 6. Sidebar
- Agregados links: "Reportes" (BarChart2) y "Configuracion" (Settings)

### Pendiente (requiere acción manual del usuario)
- Ejecutar migraciones SQL en Supabase dashboard (tablas `stock_movements` y `admin_settings`)
- Configurar `RESEND_API_KEY` en variables de entorno de Vercel
- Registrar dominio en Resend para enviar desde email propio (actualmente usa onboarding@resend.dev)

---

## COMPLETADO: Mejora Panel Admin Órdenes (Febrero 2026)

### Cambios realizados (`src/app/admin/ordenes/page.tsx`)
- **Stats bar**: 4 tarjetas con ingresos totales, total órdenes, pendientes, reservas. Las de pendientes y reservas son clickeables como filtros rápidos.
- **Columna Cliente**: nombre del cliente (guest o registrado) + email con icono
- **Columna Pago**: badge "MercadoPago" (azul) o "Retiro en tienda" (ámbar)
- **Búsqueda visible siempre**: barra de búsqueda fuera del panel de filtros, busca por ID + nombre + email
- **Chips de estado en filtros**: pills con colores por estado, sin abrir dropdowns
- **Paginación numerada**: botones con números de página + indicador "X–Y de Z"
- **CSV mejorado**: incluye nombre, email, teléfono, método de pago, código retiro (con BOM UTF-8 para Excel)
- **Refactor filtros**: `useMemo` para filtrado reactivo sin re-fetch

### Cambios en `src/lib/api.ts`
- Interface `Order`: agregados `guest_name`, `guest_surname`, `guest_email` (estaban solo en `OrderWithItems`)
- Interface `OrderWithItems`: eliminados campos duplicados (ahora heredados de `Order`)

---

## COMPLETADO: Importación Excel desde Admin (Febrero 2026)

### Problema
La importación de productos desde Excel solo se puede hacer por CLI (`scripts/import_to_supabase.js`) y ese script **borra todos los productos** antes de importar. Se necesita una importación inteligente desde el panel admin que detecte productos nuevos vs existentes y muestre los cambios antes de aplicarlos.

### Objetivo
Botón "Importar Excel" en admin/productos que:
1. Parsea Excel (.xlsx) en el navegador (misma estructura que `2026-01-19_LISTA_DE_PRECIOS.xlsx`)
2. Compara contra productos existentes usando `external_id`
3. Muestra vista previa: productos nuevos, cambios de stock/precio, sin cambios
4. Aplica cambios (INSERT nuevos + UPDATE existentes, nunca DELETE)
5. Muestra reporte de resultados

### Formato Excel esperado (16 columnas)
```
id | producto | laboratorio | departamento | accion_terapeutica |
principio_activo | unidades_presentacion | presentacion | receta |
control_legal | es_bioequivalente | registro_sanitario |
titular_registro | stock | precio | precio_por_unidad
```

### Archivos a crear/modificar

#### Nuevos
- `src/lib/excel-import.ts` — Parseo Excel + helpers (slugify, parsePrice, mapPrescriptionType, buildDescription) + constantes de categorías (DEPT_TO_CATEGORY, EXTRA_MAPPINGS) + función diffProducts()
- `src/app/api/admin/products/import/route.ts` — API endpoint: auth admin, resuelve categorías, genera slugs únicos, upsert por batches de 100

#### Modificados
- `package.json` — agrega dependencia `xlsx: ^0.18.5`
- `src/lib/api.ts` — agrega `productApi.bulkImport()`
- `src/app/admin/productos/page.tsx` — botón "Importar Excel" + modal de 3 pasos (upload → preview → results)

### Flujo UI
```
[Importar Excel] → Modal con file picker (.xlsx)
  → Parsea en browser + carga todos los productos de DB
  → Diff por external_id
  → Vista previa:
    - Tarjeta verde: N productos nuevos (tabla con nombre, lab, precio, stock)
    - Tarjeta azul: N productos a actualizar (tabla con stock old→new, precio old→new)
    - Tarjeta gris: N sin cambios
  → [Importar N productos] → API upsert en batches
  → Reporte: insertados + actualizados + errores
  → [Cerrar] → recarga lista
```

### Lógica de categorías (misma que script CLI)
1. Buscar `accion_terapeutica` en tabla `therapeutic_category_mapping`
2. Si no: buscar `departamento` en DEPT_TO_CATEGORY
3. Si no: slugificar departamento y buscar en categorías
4. Fallback: categoría 'otros'

### Notas técnicas
- Parseo client-side con `xlsx` (evita complejidad de file upload al server)
- Diffing por `external_id` (columna 'id' del Excel)
- Non-destructive: solo INSERT + UPDATE, nunca DELETE
- Upsert con `onConflict: 'external_id'`
- Batches de 100 para evitar timeouts

### Fix crítico post-implementación: productApi.list() cap de 100 items

**Problema detectado en code review**: `productApi.list()` tiene un cap duro de 100 items (`Math.min(params?.limit || 12, 100)` en api.ts). Al llamar `productApi.list({ limit: 10000 })` solo devolvía 100 productos — con 1189 productos en DB, los 1089 restantes se habrían marcado como "nuevos" en cada re-importación, creando duplicados masivos.

**Fix**: Creada función `loadAllProductsForDiff()` en `excel-import.ts` que consulta Supabase directamente en batches de 1000 hasta que no haya más datos. El componente admin ahora usa esta función en lugar de `productApi.list()`.

---

## COMPLETADO: Admin Mobile Responsive (Febrero 2026)

### Problema
Panel admin no era usable en celulares: tablas con min-w-[800px] forzaban scroll horizontal, dropdowns desbordaban la pantalla, touch targets muy pequeños, colores inconsistentes (gray vs slate).

### Cambios realizados (9 archivos, 7 fases)
- **Sidebar.tsx**: Hamburger touch target p-3, sidebar max-w-[85vw]
- **layout.tsx**: Padding responsive px-4 sm:px-6 lg:px-8
- **NotificationBell.tsx**: Dropdown max-w-[calc(100vw-2rem)], max-h-[60vh] sm:max-h-96
- **CommandPalette.tsx**: Resultados max-h-[50vh] sm:max-h-[400px]
- **admin/page.tsx**: Stat grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6
- **ordenes/page.tsx**: Tabla → cards en mobile (md:hidden), filtros sm:grid-cols-2
- **ordenes/[id]/page.tsx**: Quick actions grid-cols-1 sm:grid-cols-2, min-h-[44px]
- **productos/page.tsx**: Tabla → cards en mobile, filtros w-full sm:w-auto, form grid-cols-1 sm:grid-cols-2
- **categorias/page.tsx**: Header flex-col sm:flex-row, modal p-4 sm:p-6, botones min-h-[44px]
- **Todos los archivos admin**: gray-* → slate-* (178 ocurrencias) para consistencia de color

---

## COMPLETADO: Sistema de Aprobacion de Reservas (Febrero 2026)

### Problema
Las reservas para retiro en tienda (store-pickup) no tenian flujo de aprobacion: el admin no recibia notificacion, no podia aceptar/rechazar, y el stock no se reducia al reservar.

### Cambios realizados (8 archivos, 6 fases)

#### Fase 1: API (admin/orders/[id]/route.ts)
- Nuevo action `approve_reservation`: valida status='reserved', llama decrement_stock() por cada item, cambia a 'processing'
- Nuevo action `reject_reservation`: valida status='reserved', cambia a 'cancelled'

#### Fase 2: API Client (lib/api.ts)
- `orderApi.approveReservation(id)` y `orderApi.rejectReservation(id)`

#### Fase 3: Notificaciones
- NotificationBell: polling de ordenes 'reserved' con tipo 'reservation' (icono Store, color amber)
- Sidebar: badge amber para reservas pendientes
- Layout: carga stats de reservas para sidebar

#### Fase 4: Admin Lista Ordenes (admin/ordenes/page.tsx)
- Ordenes 'reserved': botones "Aprobar"/"Rechazar" en vez de dropdown de estado
- Confirmacion antes de ejecutar

#### Fase 5: Admin Detalle Orden (admin/ordenes/[id]/page.tsx)
- Seccion prominente con fondo amber: info cliente, telefono, email, codigo retiro, expiracion
- Botones grandes "Aprobar Reserva" (emerald) y "Rechazar" (rojo), min-h-56px
- Dropdown de estado deshabilitado para ordenes reservadas
- Timeline simplificado: reserved → processing → delivered

#### Fase 6: Paginas Cliente
- reservation/page.tsx: "Pendiente de aprobacion" + aviso de revision por farmacia
- mis-pedidos: badges contextuales para store-pickup (Pendiente aprobacion / Aprobado - Listo para retiro)
- mis-pedidos/[id]: seccion retiro en tienda con codigo y estado

### Flujo
```
Cliente reserva → status='reserved' (stock sin reducir)
  ├── Admin ACEPTA → status='processing' + stock reducido
  └── Admin RECHAZA → status='cancelled'
```

---

## COMPLETADO: Perfeccionamiento Frontend Tercera Edad (Febrero 2026)

### Problema
Inconsistencias en el frontend: emojis en categorias, colores `gray` vs `slate`, touch targets de 40-48px, text-sm en textos importantes, paginas success/failure/pending con estilos diferentes al resto.

### Cambios realizados (17 archivos, 7 fases)

#### Fase 1: Foundation (globals.css)
- `.btn`: min-h 48px→56px, rounded-xl→rounded-2xl
- `.btn-primary`: border→border-2
- `.card`: border→border-2
- `.input`: min-h 52px→56px

#### Fase 2: Layout + Navbar
- Navbar: h-16→h-72px, todos los botones min-h-56px
- Footer: text-sm→text-base, py-8→py-10
- Cart button: rounded-2xl, min-h-56px
- Dropdown items: min-h-56px

#### Fase 3: Homepage
- Emojis reemplazados por iconos Lucide profesionales (Pill, Heart, Brain, etc.)
- Category buttons: min-h-52→56px, text-sm→text-base, rounded-2xl
- Product card names: text-sm→text-base
- Add-to-cart: min-h-44→56px, text-base, rounded-2xl, border-2
- Search clear button: w-8→w-10
- Scroll-to-top: w-12→w-14

#### Fase 4: Producto + Carrito
- Back button: min-h-44→56px
- Quantity buttons: w-12→w-14 (producto), w-11→w-14 (carrito)
- Cart images: w-24→w-28
- Delete button: w-10→w-14
- Badges: text-sm→text-base, rounded-2xl
- Lab label: text-sm→text-base, removido uppercase

#### Fase 5: Checkout flow
- Success/Failure/Pending: reescritas completas
  - gray→slate, rounded-lg→rounded-2xl, border→border-2
  - Buttons: min-h-56px, font-bold text-lg
  - green→emerald para consistencia de marca
- Checkout: helper text slate-400→500, button min-h-60→64px

#### Fase 6: Auth + Mis Pedidos
- Login/Register: gray→slate, text-sm→text-base en labels, border-2, rounded-2xl
- Mis Pedidos: gray→slate, text-sm→text-base
- Mis Pedidos/[id]: gray→slate, green→emerald, back link min-h-56px

#### Fase 7: Cleanup
- Eliminados ProductCard.tsx y CartItem.tsx (componentes muertos)
- Build verificado sin errores
- Grep verificado: cero `text-gray`, `rounded-lg` o emojis en paginas de cliente

---

## COMPLETADO: Sistema de Skills para Claude Code (Febrero 2026)

### Que se hizo
Se implemento el sistema de "Skills" de Claude Code para mantener continuidad entre sesiones y automatizar tareas repetitivas.

### Archivos creados
- `CLAUDE.md` — Contexto del proyecto que Claude lee automaticamente cada sesion (stack, build, DB schema, gotchas, design rules)
- `.claude/commands/continuar.md` — Comando `/continuar`: retoma trabajo pendiente leyendo bitacora + handover
- `.claude/commands/deploy.md` — Comando `/deploy`: pipeline completo build → commit → push → verificar
- `.claude/commands/review.md` — Comando `/review`: revision de codigo (seguridad, calidad, buenas practicas)
- `.claude/commands/debug.md` — Comando `/debug`: framework sistematico de 7 pasos
- `.claude/commands/handover.md` — Comando `/handover`: genera resumen de sesion para continuidad
- `HANDOVER.md` — Documento de handover de la sesion anterior
- `GUIA-CLAUDE-CODE-SKILLS.md` — Guia en espanol explicando como funciona todo el sistema

### Commit
`4d7d471` — feat: add Claude Code skills system - CLAUDE.md, slash commands, and guide

---

## COMPLETADO: Rediseño Mobile-First para Tercera Edad (Febrero 2026)

### Problema
El sitio tenía texto pequeño (11-14px), botones diminutos, filtros complejos (sidebar, pills, dropdowns), y una UX pensada para usuarios tech-savvy. El público principal son adultos mayores en Coquimbo, Chile, que usan celular.

### Objetivo
Rediseño completo mobile-first: texto 18px+ base, botones 48px+ touch targets, interfaz extremadamente simple, perfecto en cualquier celular.

### Cambios realizados

#### 1. `globals.css` — Base tipográfica agrandada
- `html { font-size: 18px }` (antes ~14-16px)
- `.btn`: min-h-[48px], py-3.5, text-base
- `.btn-primary`: text-lg, sombra pronunciada
- `.input`: min-h-[52px], border-2, text-lg
- Body bg: white con antialiased

#### 2. `Navbar.tsx` — Header simplificado
- Una sola fila: Logo + Avatar usuario + Botón carrito
- Eliminado: botón "Iniciar Sesión" verde (reemplazado por icono avatar)
- Carrito prominente con emerald-50 bg y badge de count
- Menú usuario click-to-open con backdrop overlay
- Búsqueda movida al homepage inline

#### 3. `page.tsx` — Homepage reescrita completamente
- **ELIMINADO**: vista lista, sort dropdown, items-per-page, view mode toggle, paginación numérica, FilterSidebar, FilterDrawer, CategoryPills, ActiveFilters
- **AGREGADO**: Grid de categorías 2 cols con botones grandes (52px), búsqueda siempre visible (text-lg, border-2), "Cargar más" en vez de paginación, cards con botón "Agregar" full-width, barra carrito sticky bottom (64px)
- Filtro `in_stock: true` por defecto, 20 items por página acumulados

#### 4. `producto/[slug]/page.tsx` — Detalle de producto agrandado
- Precio: text-4xl font-black (antes text-3xl)
- Badges: px-3 py-1.5 rounded-xl text-sm (antes px-2.5 py-1 text-xs)
- Info table: py-3, border-2 (antes py-2.5, border)
- Botones +/-: w-12 h-12 (antes p-3), cantidad text-xl
- "Agregar al carrito": min-h-[64px] text-xl (antes py-4 text-lg)
- Envío/seguridad: iconos w-6 h-6 con bg rounded-xl
- Breadcrumb reemplazado por botón "Volver" simple
- Feedback visual: checkmark "Agregado" antes de navegar al carrito

#### 5. `carrito/page.tsx` — Carrito agrandado
- Imágenes: w-24 h-24 (antes w-20 h-20) con `<img>` directo
- Botones +/-: w-11 h-11 (antes p-1.5), cantidad text-lg font-bold
- Subtotal: text-lg font-black
- Botón eliminar: w-10 h-10 con hover bg-red-50
- Total: text-3xl font-black text-emerald-700
- "Continuar al pago": min-h-[56px] text-lg font-bold rounded-2xl
- Layout: stacked (no sidebar) para mobile

#### 6. `checkout/page.tsx` — Checkout agrandado
- Método pago cards: min-h-[80px], p-5, rounded-2xl, iconos w-7 h-7
- Labels: font-semibold text-slate-700
- Inputs: heredan .input (min-h-[52px] border-2 text-lg)
- Total: text-3xl font-black
- Botón pagar: min-h-[60px] text-lg font-bold
- Error msg: border-2 rounded-xl font-semibold
- Layout: stacked (no sidebar) para mobile

#### 7. `checkout/reservation/page.tsx` — Reserva agrandada
- Código retiro: text-5xl font-black (antes text-4xl)
- Botón copiar: min-w-[48px] min-h-[48px]
- Instrucciones: text-base (antes text-sm), space-y-3
- Botón "Seguir comprando": min-h-[56px] text-lg

#### 8. `layout.tsx` — Footer actualizado
- Nombre farmacia: text-lg font-bold
- Ubicación: "Coquimbo, Chile"
- Copyright con año dinámico
- Border-t-2 para visibilidad

### Build
- `next build` exitoso, 24 páginas, 0 errores TypeScript

### Plan detallado
Ver `.claude/plans/tranquil-discovering-alpaca.md`

---

## COMPLETADO: Sistema de Filtros + Descripciones (Febrero 2026)

### Cambios realizados
- 5 componentes de filtros creados (FilterContent, FilterSidebar, FilterDrawer, CategoryPills, ActiveFilters)
- Homepage refactoreada con sidebar filtros + pills
- Página de producto con badges (receta, bioequivalente, categoría) y tabla info estructurada
- **NOTA**: Los componentes de filtros fueron reemplazados por el rediseño mobile-first (categorías como grid simple)

---

## COMPLETADO: Corrección páginas de pago (Febrero 2026)

### Cambios
- Formato precios CLP corregido ($3990.00 → $3.990) en mis-pedidos
- Locale es-AR → es-CL para fechas
- Estado `reserved` agregado en mis-pedidos, admin/ordenes (4 archivos)
- checkout/failure rediseñado (no "Volver al carrito", sino "Volver a intentar")
- checkout/success, pending mejorados con Suspense wrappers

---

## Arquitectura

```
Next.js 14 (Vercel)
  ├─ Client: Supabase JS → Supabase DB (lecturas públicas: productos, categorías)
  ├─ Client: Supabase Auth (login, register, sesión con cookies)
  ├─ API Routes: checkout, guest-checkout, store-pickup, webhook MercadoPago
  ├─ API Routes: admin CRUD (productos, categorías, órdenes)
  └─ Cart: 100% localStorage (sin backend)
```

**Supabase**: `jvagvjwrjiekaafpjbit` (DB + Auth + RLS)
**Vercel**: `prj_OfRAgKGzo9TrgQY1C2isbIzVrIs7` (team `team_slBDUpChUWbGxQNGQWmWull3`)
**Pagos**: MercadoPago (CLP - pesos chilenos)

---

## Base de datos

- **1189 productos** importados desde Excel (`2026-01-19_LISTA_DE_PRECIOS.xlsx`)
- **17 categorías** profesionales farmacéuticas
- **156+ mapeos** terapéuticos (acción terapéutica → categoría)
- **RLS** habilitado en todas las tablas
- **Trigger** `handle_new_user()` auto-crea perfil al registrarse
- **Función** `is_admin()` para verificar rol admin

### Campos por producto
name, slug, description, price, stock, category_id, image_url, active,
external_id, laboratory, therapeutic_action, active_ingredient,
prescription_type (direct/prescription/retained), presentation

### 17 categorías
dolor-fiebre, sistema-digestivo, sistema-cardiovascular, sistema-nervioso,
sistema-respiratorio, dermatologia, oftalmologia, salud-femenina,
diabetes-metabolismo, antibioticos-infecciones, vitaminas-suplementos,
higiene-cuidado-personal, bebes-ninos, adulto-mayor, insumos-medicos,
productos-naturales, otros

---

## Historial completado

### 2026-04-02: Webpay Plus producción activado (COMPLETADA)

- Credenciales productivas configuradas en Vercel: `TRANSBANK_COMMERCE_CODE`, `TRANSBANK_API_KEY`, `TRANSBANK_ENVIRONMENT=production`
- Bug CRLF en env vars corregido (Windows echo → printf para evitar `\r`)
- Checkout habilitado: dos opciones — Retiro en tienda + Webpay Plus (tarjeta real)
- Cron cleanup-orders cambiado de `*/30 * * * *` → `0 3 * * *` (límite Hobby plan)
- Deploy directo vía Vercel CLI (repo desconectado de GitHub en Vercel)
- Fix `.vercel/project.json` en raíz del repo para deploy correcto
- URL producción: https://tu-farmacia.cl

### 2026-04-01: Webpay Plus deshabilitado en checkout (COMPLETADA)

- Checkout simplificado: solo retiro en tienda habilitado
- Webpay Plus visible como opción pero desactivada con badge "Próximamente"
- Todo el código Transbank/Webpay intacto (APIs, lib/transbank.ts) — listo para activar
- `transbank-sdk` instalado en node_modules para que compile
- 32 productos sin imagen → 0 (búsqueda automática DuckDuckGo + manual)
- Total productos activos con imagen: 1.453/1.453 (100%)

### 2026-02-08: Migración Railway → Supabase (COMPLETADA)

**Antes**: 3 microservicios Rust en Railway + PostgreSQL + Redis
**Después**: Supabase (DB+Auth) + Next.js API routes

### 2026-02-09: Importación de productos (COMPLETADA)

- 1189 productos importados desde Excel
- Búsqueda automática de imágenes: **1075/1188 (90.5%)**
- Corrección masiva http→https: 79 URLs corregidas

### 2026-02-08: Corrección errores checkout y Mixed Content (COMPLETADA)

- NEXT_PUBLIC_SITE_URL configurado
- Mixed Content DB: 24 productos http:// → https://
- sanitizeImageUrl() en api.ts
- guest-checkout: guarda guest_name/guest_surname
- Errores usuario amigables en checkout

---

## Archivos clave

```
apps/web/
├── src/lib/supabase/client.ts    # Cliente browser (anon key)
├── src/lib/supabase/server.ts    # Cliente server (service role)
├── src/lib/api.ts                # API de productos/órdenes
├── src/store/auth.ts             # Zustand auth (Supabase Auth)
├── src/store/cart.ts             # Zustand cart (localStorage)
├── src/middleware.ts              # Auth session refresh
├── src/app/api/                  # 10 API routes
├── src/app/page.tsx              # Homepage mobile-first (REDISEÑADO)
├── src/app/producto/[slug]/page.tsx  # Detalle producto (REDISEÑADO)
├── src/app/carrito/page.tsx      # Carrito (REDISEÑADO)
├── src/app/checkout/page.tsx     # Checkout (REDISEÑADO)
├── src/app/checkout/reservation/page.tsx  # Reserva (REDISEÑADO)
├── src/components/Navbar.tsx     # Navbar simplificado (REDISEÑADO)
└── src/app/globals.css           # Base 18px (REDISEÑADO)

scripts/
├── import_to_supabase.js         # Importar Excel → Supabase
└── update_images_supabase.py     # Buscar imágenes DuckDuckGo

supabase/migrations/
└── 20240101000000_initial_schema.sql  # Schema idempotente
```

## REGISTRADO: Auditoría sistema previa a plan Golan (Abril 19, 2026)

### Resumen
Sesión de verificación y documentación del estado actual del sistema Tu Farmacia. Usuario solicito DETENER todo desarrollo y SOLO registrar hallazgos. Se confirmo que dos features solicitadas *ya estaban completamente implementadas* en producción:

1. **RUT Obligatorio en Registro**: Campo RUT con validacion modulo-11 chileno, formato 12.345.678-9, aviso "Necesario para acumular puntos de fidelidad". Archivo: `src/app/auth/register/page.tsx` (RUT validacion, formateo) + `src/app/api/auth/register/route.ts` (API guarda rut en profiles.rut)

2. **Importacion PDF Facturas**: Wizard 4-pasos en `src/app/admin/compras/nueva/page.tsx`:
   - Paso 1: Seleccionar proveedor
   - Paso 2: Subir foto JPEG/PNG o PDF de factura
   - Paso 3: Revision OCR + mapeo de productos a catalogo
   - Paso 4: Confirmar recepcion (stock++, cost_price, movimientos)
   - Backend: `src/app/api/admin/purchase-orders/scan/route.ts` usa Google Cloud Vision API (tanto `images:annotate` para fotos como `files:annotate` para PDFs), parsea lineas con heuristica numerica, busca matches en `supplier_product_mappings`

### Archivos inspeccionados
- `src/app/auth/register/page.tsx` (243 lineas) — RUT input con formateo inline, validacion modulo-11
- `src/app/api/auth/register/route.ts` (52 lineas) — POST route, recibe rut, valida, upsert profile
- `src/app/admin/compras/nueva/page.tsx` (gran archivo) — Complete 4-step wizard for POs
- `src/app/api/admin/purchase-orders/scan/route.ts` (169 lineas) — OCR endpoint, Vision API integration, parseInvoiceLines heuristic parser
- `prisma/schema.prisma` — profiles.rut (String?, VarChar(20)), products.cost_price, purchase_order_items.unit_cost
- `pharmacy-ecommerce/context.md` (183 lineas) — Sistema snapshots a abril 13, 2026 con todas las features completadas
- `context.md` (raiz) (412 lineas) — Documentacion completa stack, infraestructura, credentials, arquitectura
- `golan_info.md` — Extenso registro de features de Golan ERP a reemplazar

### Hallazgos clave
- **Sistema en produccion**: Webpay Plus activo con commerce code real (597053071888), Transbank integration completa
- **RUT validation**: Implementa algoritmo modulo-11 correcto para RUTs chilenos (7-9 digitos + digito verificador)
- **PDF OCR**: Google Cloud Vision API configurada para parsear facturas, extrae lineas de producto con cantidad/precio/subtotal via heuristica numerica
- **POS completamente funcional**: Electron app + scanner HID, busqueda por barcode en product_barcodes
- **Loyalty program**: Puntos por $1,000 CLP (1 punto = $100 descuento), sistema activo
- **Email integrations**: Resend configurado, emails transaccionales para Webpay, reservas, alertas stock
- **Admin features**: Reportes con Recharts, stock movements, supplier management, purchase orders, inventory valuation
- **Context files**: Context.md y golan_info.md ya existen con documentacion exhaustiva

### Plan para proxima sesion
Usuario solicito documentacion para SIGUIENTE sesion crear plan completo reemplazo Golan ERP. Siguientes features pendientes (no implementadas aun):
- Margen & Cost Analysis (precio vs costo vs margen para todos productos) — direcciona preocupacion Alex sobre viabilidad descuentos
- Cotizaciones/Presupuestos (quotes formales para clientes institucionales)
- Cuaderno de Faltas (logging de solicitudes out-of-stock)
- Expiry date tracking + liquidation alerts

### Notas tecnicas
- RUT validation uses modulo-11 algorithm con multiplicadores 2-7 cycling
- PDF OCR usa `vision.googleapis.com/v1/files:annotate` con type `DOCUMENT_TEXT_DETECTION` (no image:annotate)
- parseInvoiceLines() heuristica: busca numeros en linea, asume ultimo=subtotal, penultimo=unit_cost, anterior=quantity si hay 3+ numeros
- Supplier product mapping: tabla `supplier_product_mappings` con `(supplier_id, supplier_code)` composite key, lookup durante OCR review
- Cost tracking: purchase_order_items.unit_cost guardado al recibir OC, productos.cost_price actualizado, movimientos registrados

---

## Notas técnicas

- MercadoPago usa `CLP` (pesos chilenos), precios redondeados con `Math.ceil()`
- Webhooks usan idempotency check para evitar double-processing
- Store pickup genera código de 6 dígitos, expira en 48h
- Guest checkout permite comprar sin cuenta (user_id = NULL)
- `vercel link` puede sobrescribir `.env.local` - siempre hacer backup
- Deploy via `git push origin main` (auto-deploy GitHub integration)
- Root dir en Vercel: `pharmacy-ecommerce/apps/web`
- **Build**: usar `./node_modules/.bin/next build` (NO `npx next build` que usa v16)
- **Diseño**: Mobile-first, 18px base, 48px+ touch targets, alto contraste

## 2026-05-05 — POS: códigos de barra visibles en cuadrícula
- Toggle "Códigos" en toolbar POS muestra/oculta SVG de barras (JsBarcode, EAN13/CODE128) bajo cada tarjeta de producto
- Estado persistido en `localStorage` (`pos.showBarcodes`)
- Rinde `external_id`; placeholder "Sin código" si falta
- Permite al cajero comparar varios códigos simultáneos sin abrir cada producto

## 2026-05-05 — Productos admin: vista cuadrícula + toggle códigos
- `/admin/productos`: nuevo toggle vista (Tabla/Cuadrícula) y toggle "Códigos" en toolbar
- Cuadrícula: cards 2-6 col según ancho, imagen aspect-square, nombre, precio, stock badge, click→editar, hover→duplicar/eliminar
- Toggle códigos rinde JsBarcode SVG (EAN13/CODE128) en cards mobile y en grid view
- Estado persistido (`admin.productos.viewMode`, `admin.productos.showBarcodes`)

## 2026-05-05 — Mejoras códigos: zoom modal + atajos teclado
- POS y `/admin/productos`: click en barcode rinde modal con código gigante (height 140, width 3) para escanear desde pantalla
- POS: tecla `B` toggle códigos
- Productos: teclas `B` (códigos) y `G` (vista tabla/cuadrícula)
- POS: barcode movido fuera del `<button>` (HTML válido, role=button con keyboard support)
- Esc cierra zoom

## 2026-05-05 — SEO + a11y + perf hardening (offline-safe, branch offline-improvements)
DB Cloud SQL suspendida (caso d8816534195156363 en revisión Google). Mejoras sin tocar DB ni Firebase admin.

**SEO**
- Layout root JSON-LD ahora usa `@graph` con `Pharmacy + Store + LocalBusiness`, `WebSite` con `SearchAction` (?search=q), telephone, openingHoursSpecification, areaServed (Coquimbo/La Serena/Chile), paymentAccepted, sameAs WhatsApp.
- Producto JSON-LD enriquecido: `@graph` con Product (sku, mpn, category, finalPrice con descuento, priceValidUntil, itemCondition, hasMerchantReturnPolicy 10 días, shippingDetails CL 1-5d) + BreadcrumbList (Inicio → Categoría → Producto).
- OG image fallback `/og-image.png` (1200x630) en root + producto.
- `keywords` ampliado (La Serena, despacho, cotización).
- robots.ts: Allow `/`, `/producto/`, `/cotizacion`. Disallow `/admin/`, `/api/`, `/auth/`, `/checkout/`, `/carrito`, `/mi-cuenta/`, `/mis-pedidos/`, `/rastrear-pedido/`, query strings sort_by/page. Block GPTBot/CCBot. Host directive.
- sitemap.ts: Añadidos /cotizacion, /rastrear-pedido, /auth/*. Fallback con 16 categorías estáticas cuando DB cae (mantiene SEO durante outage).
- manifest.ts: scope, orientation, lang es-CL, categories, maskable icon, shortcuts (Catálogo/Cotización/Rastrear).
- Layouts noindex creados: auth, checkout, mi-cuenta, mis-pedidos, carrito, rastrear-pedido. Cotización layout con metadata indexable + canonical.
- Layout link `/manifest.json` → `/manifest.webmanifest` (Next ts manifest). dns-prefetch + preconnect Google Fonts.
- page.tsx home: parsea `?search=` y `?q=` desde URL → soporta SearchAction.

**Perf**
- next.config.js: `optimizePackageImports` (lucide-react, recharts, date-fns), `compress`, `poweredByHeader: false`, `productionBrowserSourceMaps: false`.
- Image deviceSizes + imageSizes finos (360-1920, 16-384).
- Headers: HSTS preload 2y, X-Content-Type-Options, X-Frame-Options SAMEORIGIN, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (camera self / geolocation self / payment self / microphone none), Cache-Control immutable para /_next/static/fonts/images.
- X-Robots-Tag noindex en /admin/* y /api/* (defensa en profundidad).

**Build**
- Local OK (NODE_OPTIONS 6GB). 87.6kB First Load shared. /manifest.webmanifest emitido. Todas las páginas estáticas o dinámicas según corresponde.
- Branch offline-improvements (NO merge a main hasta DB restaurada).

## 2026-05-05 — LCP wins: priority + fetchPriority en imágenes hero (offline-improvements)
- `app/page.tsx`: `priority` + `fetchPriority="high"` en primer Image (idx===0) de 3 carruseles (frequentProducts, topSellers, discountedProducts) y primeros 3 (idx<3) del grid principal `allProducts`.
- `app/producto/[slug]/ProductPageClient.tsx`: añadido `fetchPriority="high"` a la imagen principal (ya tenía `priority`).
- Map callbacks ahora reciben `idx` para evaluación condicional.
- Build local OK (NODE_OPTIONS 6GB), 87.6kB First Load shared sin cambios.
- Branch offline-improvements; sin tocar /api/*, /lib/db.ts, /lib/firebase/*.

## 2026-05-07 — PWA producción: service worker + offline page + merge a main

PR #2 (offline-improvements → main) merged squash. Deploy prod Vercel ✅.

**SW + offline**
- `public/sw.js`: SW vanilla (no Workbox). Precache `/offline`, `/icon`, `/apple-icon`, `/manifest.json`. Strategy network-first navigation con fallback a `/offline` cuando offline. Skip non-GET, skip `/api/*`, skip `/admin/*`, skip `/checkout` (evita interceptar pagos Webpay).
- `src/components/PWARegister.tsx`: registra `/sw.js` con scope `/` tras window load. Sólo en prod.
- `src/app/offline/page.tsx`: pantalla offline branded turquesa (no Chrome dino).
- `src/app/icon.tsx` + `apple-icon.tsx`: Next 14 dynamic icons (192/180px PNG generados).
- `src/app/opengraph-image.tsx`: OG card turquesa para WhatsApp/social share.

**Headers + middleware**
- `next.config.js`: `Service-Worker-Allowed: /` + `Cache-Control: public, max-age=0, must-revalidate` para `/sw.js`. Manifest content-type `application/json`.
- `middleware.ts`: bypass `/sw.js`, `/manifest.json`, `/offline`, `/icon`, `/apple-icon`, `/opengraph-image` (no auth, no rewrites).
- `prisma.config.ts`: tolera DATABASE_URL ausente en build (no crashea Vercel build sin runtime env).

**Verificación prod**
- `https://tu-farmacia.cl/{,sw.js,manifest.json,offline,icon,apple-icon}` → todos 200, content-types OK.

**Scope reglas**
- `CLAUDE.md`: añadida sección scope separando este repo (Tu Farmacia prod) de `pharma-server` (experimental, separado).

## 2026-05-07 — PWA install prompt: botón "Instalar" móvil

Comp `InstallPWAButton.tsx` (client) capta `beforeinstallprompt`, muestra banner flotante bottom turquesa con btn Instalar (≥44px tap target) + "Ahora no". Detecta display-mode standalone → no muestra si ya instalada. `appinstalled` → ocultar. Dismiss localStorage 7d (no molestar adultos mayores). Mounted en `layout.tsx` junto a `PWARegister`. Build local OK, prod deployed `a914130`. Smoke `/` 200.

## 2026-05-07 — PWA SW v2: SWR cache productos + pre-cache home

`public/sw.js` CACHE_VERSION `tf-v2` (drop caches viejos).
- Pre-cache: `/`, `/offline`, `/manifest.json`, `/favicon.ico` en install → home navegable offline desde primera carga.
- Navegaciones HTML: stale-while-revalidate (cached primero + fetch bg) en lugar de network-first → mejor UX en redes lentas.
- `/api/products/*` allowlist con SWR + freshness 30min vía header custom `sw-cached-at`. Offline + cache válido → devuelve stale; offline sin cache → 503 JSON.
- Demás `/api/*` (cart, orders, profile, auth, checkout, webpay) sin cachear (server siempre valida stock/precio en mutaciones).
- LRU trim: runtime 60, api 40 entries.
- Deploy `145c5de` prod ✅. Verificado /sw.js sirviendo tf-v2 con content-type correcto.

## 2026-05-07 — Lighthouse audit + fixes CLS/LCP home (commit ce1f05a)

Lighthouse CLI mobile prod (https://tu-farmacia.cl, throttling=simulate):
- Performance **63** ❌ | A11y 86 | BP 100 ✅ | SEO 92
- LCP 3.9s (bad) | CLS 0.416 (catastrophic) | TBT 290ms | FCP 1.0s ✅

Root causes:
- CLS 0.22: `MobileCategoryGrid` retorna `null` mientras `categories` state vacío → al popularse pushea contenido 284px abajo.
- CLS adicional: secciones `topSellers`/`discountedProducts` short-circuit con `.length > 0` → pop-in al cargar.
- LCP element: 2da imagen producto en scroller horizontal (`TAPSIN LIMONADA DIA`) con `loading=lazy`. Priority solo `idx === 0`.

Fixes (`src/app/page.tsx`):
- MobileCategoryGrid: placeholder `<div className="lg:hidden min-h-[220px]" aria-hidden />` durante load.
- TopSellers/Ofertas: placeholder `min-h-[260px]` durante fetch.
- Scrollers: `priority={idx < 2}` + `fetchPriority={idx < 2 ? 'high' : 'auto'}` (3 ocurrencias: frequentProducts, topSellers, discountedProducts).

Build local OK. Push ce1f05a → Vercel auto-deploy. Re-correr Lighthouse post-deploy para verificar mejoras.

Pending diagnostics no abordados (próxima iteración):
- robots.txt invalid (SEO 92)
- aria-allowed-attr, color-contrast, link-name (A11y 86)
- mainthread-work-breakdown (TBT 290ms)

## 2026-05-07 — Skeleton fix Speed Index regression (commit d3fb0d3)

Lighthouse post-fix CLS (ce1f05a):
- Perf 63→78 ✅ | CLS 0.416→0.001 ✅ FIXED
- LCP 3.9s→3.8s ~igual (bottleneck = Next/image proxy a CDNs externos lentos)
- Speed Index 2.1s→4.9s **regresión** — placeholders min-h vacíos cuentan como "no renderizado"
- TBT 290→330ms

Fix: reemplazar min-h vacíos con `ScrollerSkeleton` + `CategoryGridSkeleton` (animate-pulse, mismo height). Skeleton pinta de inmediato → SI restaurado sin reintroducir CLS.

Pendiente medir post-deploy d3fb0d3.

## 2026-05-07 — Lighthouse v3 post-skeleton (commit d3fb0d3) — final perf state

| Métrica | Baseline | v2 (CLS fix) | v3 (skeleton) |
|---|---|---|---|
| Perf | 63 | 78 | 71 |
| CLS | 0.416 | 0.001 | 0.014 ✅ |
| LCP | 3.9s | 3.8s | 3.7s |
| SI | 2.1s | 4.9s | 2.9s ✅ |
| TBT | 290ms | 330ms | 720ms |
| FCP | 1.0s | 1.2s | 1.0s |

CLS resuelto definitivamente. SI restaurado tras regresión.
TBT/LCP estancados — bottleneck = chunks JS pesados (`2117-*.js` 1020ms bootup, page bundle Home 973ms con 1130 LOC client). Mejora real requiere refactor a Server Components (alto costo/riesgo).
Decisión: aceptar Perf 71-78 (Lighthouse single-run noise ±10pts), avanzar a push notifications.

Pendiente futuro perf:
- Migrar `app/page.tsx` Home a Server Component + `loadProducts`/`loadTopSellers` server-side.
- Code-split Recharts (solo admin lo usa, no debería estar en home chunk).
- Auditar chunk 2117 — qué exporta y por qué carga en home.

## 2026-05-07 — Push notifications full impl (commit 6e4ef0f)

DB prod migration aplicada: `push_subscriptions` (UUID id, FK profiles cascade, endpoint UNIQUE, p256dh, auth, user_agent, created_at, last_used_at). Indexes user_id + created_at desc.
Migration script: `scripts/run-migration.mjs` usa `@google-cloud/cloud-sql-connector` + service account de `.env.prod-temp` (vercel env pull). Trim+escape multiline GOOGLE_SERVICE_ACCOUNT JSON.

VAPID: `npx web-push generate-vapid-keys` → env vars Vercel prod (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT=mailto:contacto@tu-farmacia.cl).

SW tf-v2→tf-v3: handler push (parsea data JSON, fallback text, notificación con icon/badge=/icon, tag, data.url) + notificationclick (matchAll windows + focus o openWindow).

API:
- `POST /api/push/subscribe` — upsert by endpoint (idempotente), attach userId si auth.
- `POST /api/push/unsubscribe` — delete by endpoint.
- `POST /api/push/broadcast` — admin-only (`getAdminUser()`), Promise.all paralelo, captura 410/404 → bulk delete stale.

Frontend `PushOptInButton.tsx`: muestra banner cyan 8s post-load si `Notification.permission==='default'` y no dismissed (14d). Click "Activar" → `Notification.requestPermission()` → `pushManager.subscribe({applicationServerKey: vapid})` → POST subscribe. Dismiss persistido localStorage. Mounted en layout junto a InstallPWAButton.

Admin `/admin/push`: form title (50ch) + body (120ch) + url, confirm dialog, POST broadcast, render `{sent}/{total}, {failed} fail, {cleaned} stale`.

Pendiente verificación e2e en mobile real.

## 2026-05-08 — Global search autocomplete (Navbar)

Nueva feature: search bar global en Navbar (storefront, hidden en /admin).

**API**: `src/app/api/search/suggest/route.ts` — `GET /api/search/suggest?q=...` (min 2 chars). Top 8 productos (Prisma `findMany` OR sobre name/active_ingredient/laboratory/therapeutic_action, `mode:insensitive`, orderBy stock desc + name asc) + top 3 categorías (name match). `match_field`/`match_value` para indicar match no-name. `force-dynamic`, sin cache.

**Componentes**: `src/components/search/`
- `SearchBar.tsx` — input + dropdown/listbox. Debounce 200ms, AbortController para cancelar inflight. Recent searches en `localStorage` key `tf:recent-searches` (max 6). Keyboard nav ↑↓ Enter Esc, `aria-selected`. Highlight match con `<mark>`. Variantes `desktop` (dropdown absolute) + `overlay` (full-screen mobile). Click-outside cierra desktop. Enter sin item → submit a `/?search=...`.
- `NavbarSearch.tsx` — wrapper responsive: desktop inline (md+, max-w-xl flex-1), mobile icon button → full-screen overlay con `body.overflow=hidden`.

**Navbar.tsx**: import `NavbarSearch`, render entre logo y actions sólo si `!isAdmin`.

## 2026-05-08 — UI audit P0/P1 (sesión 1)

Audit completo de storefront (`/`, `/producto/[slug]`, `/carrito`, `/checkout`, `/mi-cuenta`, `/auth/login`) → 41 issues priorizados en `/tmp/ui-audit.md`. Top 5 P0/P1 implementados:

1. **checkout Webpay clearCart()** — removido pre-submit. Cart se limpia ahora en `/checkout/webpay/success` post-confirmación. Si user cancela en banco → carrito intacto para reintento. (ya en HEAD c432117)
2. **producto/[slug] React.cache** — `getProductBySlug` envuelto en `cache()` de React. `generateMetadata` + `default` page comparten 1 sola query Prisma por request en lugar de 2. Commit `cc0a1e1`.
3. **modal Webpay a11y** — `role="dialog" aria-modal="true" aria-labelledby aria-describedby`, focus-trap (Tab/Shift+Tab cíclico), Esc cierra, focus-restore al trigger, body overflow lock. (ya en HEAD c432117)
4. **inputMode numeric/email** — `<input type="tel" inputMode="numeric" pattern="[0-9+\s\-]*">` + email `inputMode="email"`. Teclado correcto en mobile target adulto mayor. (ya en HEAD c432117)
5. **Image priority limit** — antes 8+ `<Image priority>` simultáneos (frequent + top-sellers + ofertas + grid) → red bloqueada, LCP castigado. Ahora solo top-sellers `idx===0` priority/fetchPriority=high; resto `loading="lazy"`. Commit `7df2d5e`.

Build local OK (160 páginas generadas). Error en `collect-build-traces` (`_app.js.nft.json`) es Windows-specific, Vercel deploy tolera.

P2/P3 → siguiente sesión. Audit completo en `/tmp/ui-audit.md`.


## 2026-05-08 — UI audit P2/P3 batch (a11y + perf + ux)

Continuación sesión audit. Lighthouse mobile prod baseline (https://tu-farmacia.cl):
- Perf 76 · A11y 86 · BP 100 · SEO 100
- LCP 3.7s · TBT 400ms · CLS 0 · SI 4.9s
- Desktop A11y 81 (color-contrast 65 items)

Top issue: contraste `bg-cyan-600 + white text` 3.68:1 + `text-slate-400` 2.85:1 sobre blanco → fail WCAG AA. Toast sin `aria-live`. Universal `*` transition jank.

Fixes aplicados (1 commit):

1. **a11y**:
   - `globals.css`: scope universal transition a `body, .card, .btn*, nav, button, a, input` (eliminar `*` selector → ~1000 nodos fuera del transition reflow).
   - `globals.css`: `html:not(.dark) .text-slate-400 → #64748b` (slate-500 = 4.55:1 AA pass).
   - `globals.css`: `html:not(.dark) .bg-cyan-600 → #0e7490` (cyan-700 = 5.05:1 con white AA pass).
   - `.btn-primary` → `bg-cyan-700` (consistente con override anterior).
   - `Toast` (page.tsx): `role="status" aria-live="polite" aria-atomic="true"` → SR anuncia "agregado al carrito".
   - `auth/login`: `aria-pressed={showPassword}` en toggle ojo.

2. **perf**:
   - `page.tsx`: `loadCategories + loadDiscountedProducts + loadTopSellers` → `Promise.all` (3 fetches concurrentes en mount, antes secuencial).
   - `page.tsx`: `AbortController` en autocomplete fetch (cancela request previo en cada keystroke → previene resultados stale + libera red).

3. **ux**:
   - `page.tsx` `handleAddToCart`: try/catch con toast error explícito (antes: si `addToCart` falla mostraba toast falso "agregado").
   - `auth/login`: redirect sanitize endurecido (rechaza `//evil.com` y `/\`).
   - `WhatsAppButton`: `opacity-90` → 100 (mejor contraste verde sobre fondos claros).
   - `seguimiento/[token]/error.tsx` nuevo: error boundary con CTA WhatsApp + retry + link home.

Build local OK 160 páginas, sin warnings nuevos. Commit pendiente push.

Diferidos (P2/P3 sin tocar esta sesión): U7 IntersectionObserver auto-load, U8 debounce qty cart, U9 undo toast eliminar, U14 clear-search btn 28→44px, A9 zoom hint mobile, A10 cart qty 44→48px, M3-M9 mobile layouts (modal 320px, payment grid stack, image carousel snap, tablet `sm:grid-cols-2` PDP, safe-area WhatsApp), P3 prefetch hover, P6 reuse server product, P10/P11 loyalty store cache, breadcrumbs schema, empty state filtros `/productos`, bottom-nav (descartado: contradice UX adulto mayor con navbar grande superior). Total: ~20 P2/P3 diferidos para próxima sesión.

## 2026-05-09 — V1 Home polish (sesión 1 paralela)

Vertical V1 audit cliente (sesión paralela #1 de 5). Cierre de 6 items audit `audits/ui-audit-2026-05-08.md`:

- **A3** — SKU `text-[10px] text-slate-400` (líneas 880 + 949 page.tsx) → `text-xs text-slate-500 dark:text-slate-400` ambas instancias (grid + list view). Cumple AA contraste + legibilidad target adulto mayor.
- **A5** — Scroll-top button (línea 407-417) ahora `focus-visible:ring-4 focus-visible:ring-cyan-500/50 focus-visible:outline-none` explícito.
- **A6 / M2** — Stack collision esquina inferior-derecha mobile (cart bar + WhatsApp + scroll-top). Solución: scroll-top swap a `left-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))]` cuando `cart.item_count > 0`. Desapila esquina derecha sin esconder ninguna acción.
- **U6** — Debounce dual eliminado. Un solo `useEffect` 350ms maneja commit `searchTerm` + fetch autocomplete (con AbortController preservado). Antes: 400ms search + 300ms autocomplete → 2 requests por keystroke.
- **U7** — IntersectionObserver auto-load. Sentinel `<div ref={loadMoreSentinelRef}>` antes del btn "Cargar más" (preservado como fallback a11y). `rootMargin: 400px 0px` precarga próxima página al acercarse.
- **U11** — Skeleton infinita resuelta. Flags `topSellersLoaded` / `discountedLoaded` set `true` en `finally` de cada loader. Skeleton sólo si `!loaded && length===0`. Sección entera oculta si `loaded && length===0`.

Archivos: `src/app/page.tsx` exclusivamente. Build local OK 160/160 (warnings webpack cache restore inofensivos en build clean Windows; manifest finalizado tras retry — no bloquea Vercel). Commit + push tras `git pull --rebase`.

## 2026-05-09 — V3 Checkout a11y + UX (sesión 3 paralela)

Vertical V3 audit `ui-audit-2026-05-08.md` cerrado:
- **A11** ✅ (ya cerrado en sesión previa) — phone `inputMode="numeric" pattern="[0-9+\s\-]*"`.
- **A12** ✅ — email `readOnly={!!user}` ahora con `aria-readonly`, fondo `bg-slate-100 dark:bg-slate-900/60 cursor-not-allowed text-slate-500`, helper text "Editar en Mi Cuenta" con link `/mi-cuenta`, `title` tooltip.
- **A13** ✅ (ya cerrado: `role="dialog" aria-modal aria-labelledby aria-describedby` + focus-trap inline + Esc + body scroll lock + focus-restore en `useEffect`).
- **U3** ✅ — Webpay flow ya NO obliga modal preflight: `handleSubmit` paymentMethod==='webpay' → `processWebpay()` directo. Modal sigue disponible vía banner cyan "¿Dudas? Pregunta por WhatsApp" (botón opens modal). Modal copy cambia: primary btn "Pagar ahora sin preguntar" cyan, secondary outline verde "Tengo dudas — preguntar por WhatsApp". Reduce fricción enorme (antes obligaba salir a WhatsApp). Stock validado server-side ya (route store-pickup + webpay/create), pago directo seguro.
- **U10** ✅ — Validación onBlur. `validatePhoneStr` regex `/^(\+?56)?9\d{8}$/` (celular CL), `validateEmailStr` HTML5-style + required cuando webpay. Errores inline con `aria-invalid` + `aria-describedby`. `canSubmit` requiere ausencia de errores (deshabilita botón).
- **U5** ✅ — `/api/store-pickup` ahora colecta `stockShortages[]` y responde `{ error, code: 'STOCK_INSUFFICIENT', items: [{product_id, product_name, requested, available}] }` (status 400). Cliente `lib/api.ts:apiRequest` parsea JSON-error y attacha `code`/`items` al `Error`. Checkout muestra panel rojo con lista por producto + CTA "Volver al carrito y ajustar cantidades".

Archivos: `src/app/checkout/page.tsx`, `src/app/api/store-pickup/route.ts`, `src/lib/api.ts`. NO se tocó `clearCart()` timing (U4 P0 — fuera de scope, requiere webhook arquitectural).

Build local OK (compile + types + 160/160 static pages). ENOENT `_app.js.nft.json` collect-build-traces es bug Windows-only, no bloquea Vercel. Commit `b72f4cc`.


## 2026-05-09 — Cierre sprint paralelo V1-V5: deploy final verificado

Sweep audit canonical `audits/ui-audit-2026-05-08.md` + verificación deploy.

Items cerrados sweep (además de los marcados en sesiones V1-V5):
- **A1** ✅ — `globals.css:82-99` scoped transitions a `body, .card, .btn*, .input, nav, header, footer, button, a` (V5 `38cc157`).
- **A2** ✅ — toast `page.tsx:74` `role="status" aria-live="polite" aria-atomic="true"`.
- **A4** ✅ — override global `.text-slate-400 → #475569` (slate-600 7.46:1 AAA) light, dark preserva (V5).
- **A7** ✅ — WhatsAppButton `opacity-90` removido (V5).
- **A14** ✅ — login toggle `aria-pressed={showPassword}` ya presente.
- **U15** ✅ — login redirect rechaza protocol-relative + backslash bypass (`startsWith('/') && !startsWith('//') && !startsWith('/\')`).
- **P4** ✅ — universal `*` transition reemplazado (idem A1).

Commits sprint paralelo:
- V1 home: `c319136` (A3/A5/A6/U6/U7/U11)
- V2 PDP: `d0b2cc8` + docs `0f58cdb` (A8/U2/M6/P5/P6, U12 deferido)
- V3 checkout: `b72f4cc` + docs `985e4d9` (A11/A12/A13/U3/U10/U5)
- V4 auth/mi-cuenta/mis-pedidos: revertido por race condition entre worktrees. A14/U15 ya cerrados en código previo, mi-cuenta+mis-pedidos cards actuales OK target adulto mayor (cards info, status badges, link "Ver pedido", reorder, loyalty section). V4 cerrado de facto sin commit dedicado.
- V5 globals/navbar/safe-area: `38cc157` (A15/M9/A1/A2/A4/A7/P4).

Build local final: `Compiled successfully`, 160/160 páginas estáticas. Warnings dynamic-route admin (cookies) preexistentes, no nuevos.

Lighthouse final (3 muestras mobile por variance):
- **Desktop**: 100/100/96/100 LCP 0.7s ✅ target 100/100/96/100 LCP ≤0.7s.
- **Mobile**: muestras `[91, 82, 97]` perf, LCP `[3.1, 3.8, 2.5]s`, a11y/best-practices/seo `100/100/100` consistente. Median 91 perf vs target 94. Variance ±7 puntos confirma noise red móvil throttling LH; V1 commit redujo `priority` images (`idx<2`/`idx<3` → `idx===0` mayoría carruseles), no introduce regresión causal. No revertido.

Smoke prod: 14/14 rutas `200` (`/`, `/productos`, `/carrito`, `/checkout`, `/cotizacion`, `/seguimiento/test`, `/producto/broxal-...`, `/auth/{login,register,forgot-password}`, `/mi-cuenta`, `/mis-pedidos`, `/rastrear-pedido`, `/offline`).

Diferidos formales (próxima sesión, no scope cierre):
- **U4 (P0)** — `clearCart()` antes submit Webpay → mover a webhook success. Requiere refactor arquitectural endpoint + idempotency.
- **U12 (P2)** — PDP `prescription_pending` requiere migration Prisma `orders.prescription_pending Boolean` + cambios api orders.
- **P1, P2, P3, P7-P11** — perf de fondo (RSC refactor home, priority images audit completo, fetch batching, modularizeImports lucide, AbortController search, skeleton ux, loyalty cache store).
- **U1, U8, U9, U13, U14** — UX nice-to-haves (try/catch toast addToCart, debounce qty cart, undo toast eliminar, dropdown a11y, btn clear-search 28→44px).
- **M1, M2, M5, M7, M8, M10** — mobile layout polish (viewport scaling, cart bar consolidation, snap carousels, btn cotizar tooltip, modal padding 320px, html font-size 18px review).

Working tree limpio post-commit, `origin/main` sincronizado, Vercel auto-deploy verde.

## 2026-05-09 — UX/Mobile polish batch (V6)

Cierra 9 items audit `ui-audit-2026-05-08.md`:
- **U1** ✅ — `handleAddToCart` ya con try/catch + toast error path verificado.
- **U8** ✅ — qty cart debounce 400ms. `pendingQty` state + `qtyTimersRef` por productId. Optimistic UI con `aria-live="polite"` en counter. 1→5 reduce 4 reqs a 1.
- **U9** ✅ — undo toast eliminar 5s ya implementado (`role="status" aria-live="polite"`, btn Deshacer + RotateCcw).
- **U13** ✅ — Navbar dropdown Esc handler ya presente, overlay agrega `aria-hidden="true"`.
- **U14** ✅ — clear-search btn `w-9 h-9` (36px) → `w-11 h-11` (44px).
- **M1** ✅ — viewport `userScalable: true, maximumScale: 5` agregados (zoom 500% adultos mayores).
- **M5** ✅ — carruseles ya `snap-x snap-mandatory` + `snap-start` (3 instancias).
- **M7** ✅ — btn Cotizar mobile + `aria-label="Cotizar receta médica"` + `title` + `min-w-[48px] justify-center`.
- **M8** ✅ — modal checkout ya `max-w-[calc(100vw-2rem)] sm:max-w-md p-4 sm:p-6`.

Archivos: `layout.tsx`, `page.tsx`, `carrito/page.tsx`, `Navbar.tsx`. Build local OK 160/160. Audit sweep table actualizado: A11y 16/16, Perf 3/11, UX 13/15, Mobile 8/10.

Diferidos restantes:
- U4 (P0) — clearCart Webpay → webhook (arch refactor).
- U12 (P2) — prescription_pending migration.
- P1/P2/P3/P7-P11 — perf refactors.
- M2 (P1) — cart bar consolidation 3-layer mobile (refactor grande).
- M10 (P3) — html font-size 18px review (decisión documentada).

## 2026-05-09 — V7 U4 fix Webpay clearCart post-pago (P0)

Cierra **U4 (P0)**.

Hallazgo audit invertido: el bug real NO era `clearCart()` antes de `form.submit()` (esa llamada ya no existe en `processWebpay`), sino que tras pago Webpay exitoso `/api/webpay/return` redirige a `/checkout/reservation?paid=webpay` y esa ruta **nunca llamaba `clearCart()`**. La page legacy `/checkout/webpay/success` sí limpiaba pero no se usa (return route no apunta ahí).

Resultado pre-fix: usuario pagaba con Webpay, volvía al sitio, carrito persistía → riesgo doble compra/confusión.

Fix: `useEffect` en `checkout/reservation/page.tsx` que llama `clearCart()` cuando `searchParams.get('paid') === 'webpay'`. Idempotente (zustand store). Store-pickup path intacto (sigue limpiando en `checkout/page.tsx:191` post-response OK).

Archivos: `src/app/checkout/reservation/page.tsx` (+9/-1).
Build local OK 160/160. Sweep: A11y 16/16, Perf 3/11, UX **14/15**, Mobile 8/10.
Diferidos restantes: U12, P1/P2/P3/P7-P11, M2, M10.

## 2026-05-09 — V8 loyalty store cache + audit sweep perf

Cierra **P10/P11 (P2)**. Verifica y cierra **P3, P8** (ya implementados en V1) + **P2** (mitigado V1 home + `idx<3` /productos catalog tolerable).

Nuevo `src/store/loyalty.ts`: zustand store con cache TTL 60s. State `{points, pointsValue, transactions, loadedAt, inflight}`. `loadLoyalty(force?)` deduplica requests in-flight + respeta TTL. `clear()` invocado en logout (`auth.ts`).

Migración 3 callsites:
- **Navbar.tsx** — read `points` del store, `loadLoyalty()` en `useEffect[user]`. Antes: fetch raw cada mount.
- **checkout/page.tsx** — same. `loyaltyPoints` derivado de `storePoints ?? 0`.
- **mis-pedidos/page.tsx** — read full state (`points`, `pointsValue`, `transactions`). Eliminado `loadLoyalty()` local + 3 `useState` locales. Null guards en render (`loyaltyValue ?? 0`, `loyaltyTxs && loyaltyTxs.length > 0`).

Resultado: 1 fetch `/api/loyalty` por sesión user (TTL 60s) en lugar de 3 (1 Navbar + 1 checkout + 1 mis-pedidos cada navegación).

Build OK 160/160. Sweep: A11y 16/16, Perf **6/11** (P3/P8 verificados ya cerrados, P10/P11 nuevos), UX 14/15, Mobile 8/10.
Diferidos restantes: U12 migration, P1 (RSC home refactor), P7 lucide modularizeImports, P9 skeleton overlay, M2, M10.

## 2026-05-09 — V9 P9 skeleton overlay (no-flash transitions)

Cierra **P9 (P3)**.

Antes: skeleton 6 cards aparecía cada vez que `isLoading=true`, incluyendo cambios de categoría/búsqueda → flash de skeleton sobre fondo vacío.

Fix: condición skeleton ahora `isLoading && allProducts.length === 0` (solo carga inicial vacía). Para transiciones la lista vieja se mantiene con `opacity-60 pointer-events-none` + overlay pill superior "Actualizando…" (`aria-live="polite"`, `aria-busy="true"`, `Loader2` spinner). Cuando llega nueva data, lista se reemplaza in-place sin flash.

Drop `setAllProducts([])` de tres lugares (`handleCategoryChange`, search debounce x2, `setShowDiscountOnly` toggle) — ahora `loadProducts(1, true)` reemplaza al resolver.

Build OK 160/160. Sweep: A11y 16/16, Perf **10/11**, UX 14/15, Mobile 8/10. Único Perf restante: P1 (RSC home refactor — esfuerzo grande, no priorizado).

## 2026-05-10 — rastrear-pedido copy code + skeleton (cierre R10/R11 audit V11)

Cierra **R10/R11** diferidos en sweep V11 (2026-05-09).

R10: botón copy junto al código de retiro. Touch target 44×44, `aria-label` dinámico (`Copiar código de retiro` / `Código copiado`), feedback visual Check icon 2s, fallback silencioso si `navigator.clipboard` no disponible. Layout: `inline-flex items-center gap-3` mantiene código + botón alineados.

R11: `TrackSkeleton` reemplaza fallback Suspense vacío (`<div min-h-[80vh] />`). Skeleton animado replica estructura — header icon + título + 2 inputs + submit btn. Evita layout shift en carga inicial `useSearchParams()`.

Archivos: `src/app/rastrear-pedido/page.tsx` (+49/-5).
Build OK 160/160. Commit `e5a48c4`.

## 2026-05-10 — ProfessionalInfo expansion adulto mayor móvil

Refactor `ProfessionalInfo.tsx` (162→394 líneas) con suite completa de herramientas accesibilidad pensadas para adulto mayor móvil:

**Toolbar superior** (`role="toolbar"`, no-print) con touch targets 44×44:
- **Font A- / A+** (3 niveles `lg`/`xl`/`xxl` = 1rem/1.2rem/1.4rem). Persiste en `localStorage` key `tf:prof-info:font`. Aplicado vía `style={{ fontSize }}` en root + clases `text-[Nem]` internas (em cascade, escala uniforme todo el bloque).
- **Expandir/Colapsar todo** — toggle inteligente según estado (`allOpen` derivado de `openIds.size === results.length`).
- **Imprimir** — `window.print()` precedido por `setOpenIds(all)` + `document.body.classList.add('printing-prof-info')` con cleanup post-print.
- **Compartir** — `navigator.share` preferido (Android/iOS nativos) → fallback `wa.me/?text=` deep-link WhatsApp.

**TTS lectura en voz alta** (Web Speech API `speechSynthesis`):
- Hook `useSpeech` SSR-safe (`supported` false until `useEffect` confirma `'speechSynthesis' in window`).
- Botón Volume2 44×44 en cada section (8 por bloque). `lang='es-CL'`, `rate=0.92`, `pitch=1`.
- `aria-pressed` indica playing. Click mismo botón → `stop()`. Cambio a otra section → cancela actual.
- Botón global "Detener lectura" aparece en toolbar (`speakingId !== null`).

**Beers auto-detector**:
- Regex `/\bEVITAR\b|\bBeers\b|alto riesgo|riesgo alto|inapropiado/i` sobre `precauciones_adulto_mayor`.
- Badge rojo `Beers` compact en header del accordion (≥sm) + banner ShieldAlert grande dentro del body al abrir.
- Texto: "Atención adulto mayor: este principio activo tiene precauciones especiales según criterios Beers. Consulte siempre con su médico antes de usarlo."

**Print CSS** (`globals.css` +20 líneas):
- `body.printing-prof-info` scope: `visibility:hidden` global, visible solo `#prof-info-print`.
- `position:fixed` top-left, `padding:8mm`, fondo blanco forzado.
- `.no-print` (toolbar, TTS btns) `display:none !important`.
- `@page { size: A4 portrait; margin: 10mm }`.
- `pointer-events:none` en botones expand para evitar collapse accidental durante render.

**Font escalado uniforme**:
- Todas las clases `text-{xs,sm,base,lg,xl,2xl,3xl}` reemplazadas por `text-[Nem]` (e.g., `text-[1em]`, `text-[1.5em]`, `text-[0.875em]`).
- Cascade desde root section permite que A+/A++ escale TODO proporcionalmente sin reescribir Tailwind ni media queries adicionales.
- Iconos w-5/w-6 mantienen rem fijo (intencional — no escalar UI controls).

Archivos: `src/app/producto/[slug]/ProfessionalInfo.tsx` (+232/-65), `src/app/globals.css` (+20). Build OK 160/160. `/producto/[slug]` 69.3→71.5 kB (+2.2 kB nuevos controles).

## 2026-05-10 — Drug interactions checker carrito (Frente D)

Nueva feature: verificador de interacciones medicamentosas en `/carrito` para detectar pares riesgosos cuando adulto mayor (polifarmacia común) agrega varios productos.

**Nuevo `src/lib/drug-interactions.ts`** (~280 líneas):
- `Severity` = `'critica' | 'mayor' | 'moderada'`.
- `GROUPS`: 12 grupos farmacológicos (AINE×13, ANTICOAGULANTE×6, IBP×5, BENZODIAZEPINA×6, IECA×4, ARA2×5, ISRS×5, NITRATO×4, ESTATINA_3A4×3, MACROLIDO_3A4×2, PDE5×3, HIPOGLICEMIANTE×5).
- `RULES`: 30 reglas explícitas grupo×grupo / fármaco×grupo / fármaco×fármaco. Incluye `exclude` pairs (ej. `CLOPIDOGREL+PANTOPRAZOL` excluido del rule IBP genérico).
- `PAIR_MAP`: expansión al module load → `Map<sortedPair, InteractionDetail>` con dedup por mayor severidad.
- `checkInteractions(activeIngredients[])`: tokeniza vía `tokenizeIngredients` (drug-info), genera pares únicos, consulta map, devuelve ordenado por severidad descendente.

**Reglas críticas** (algunas):
- ANTICOAGULANTE × AINE → sangrado mayor
- SIMVASTATINA × CLARITROMICINA → rabdomiolisis
- METOTREXATO × AINE → toxicidad grave
- METOTREXATO × COTRIMOXAZOL → toxicidad hematológica
- PDE5 × NITRATO → hipotensión severa contraindicada
- BENZODIAZEPINA × BENZODIAZEPINA → Beers adulto mayor

**Mayores** (selección): CLOPIDOGREL×IBP (exc. pantoprazol), ESTATINA_3A4×MACROLIDO_3A4, IECA×ESPIRONOLACTONA, IECA×AINE, ARA2×AINE, LITIO×AINE, ISRS×TRAMADOL, DIGOXINA×AMIODARONA, WARFARINA×AMIODARONA/CIPROFLOXACINO/METRONIDAZOL, BENZODIAZEPINA×TRAMADOL/CODEINA, METFORMINA×CONTRASTE.

**Nuevo `src/components/DrugInteractionAlert.tsx`** (~150 líneas):
- `role="alert"` `aria-live="polite"` en root.
- Header colapsable (`aria-expanded`, `aria-controls`) con icono según severidad máxima, conteo total, breakdown por nivel (chips `2 Crítica · 1 Mayor · 3 Moderada`).
- Lista por par: nombres prettify, badge severidad, **Efecto** + **Recomendación**.
- Color-coding: rojo (crítica/ShieldAlert), naranja (mayor/AlertTriangle), ámbar (moderada/AlertCircle). Dark mode incluido.

**Integraciones**:
- `lib/api.ts`: `CartItem.active_ingredient?: string | null`.
- `store/cart.ts:fetchCart`: incluye `product.active_ingredient ?? null` en enriched item.
- `app/carrito/page.tsx`: `useMemo(checkInteractions(items.map(active_ingredient)))` skip si `items.length < 2`. Render `<DrugInteractionAlert>` arriba de la lista de items.

Build OK 160/160. Carrito JS sin impacto medible (drug-info ya en shared chunk porque `/producto/[slug]` también lo importa — split a `chunks/2117-*.js`).

## 2026-05-10 — PDP pre-emptive interaction warning

Extiende verificador (Frente D) al PDP `/producto/[slug]` para detección anticipada.

**Cambio**: si el carrito tiene ≥1 producto con `active_ingredient`, antes de mostrar el botón "Agregar al carrito" se computan:
- `baseline = checkInteractions(cart.items.active_ingredient)`
- `hypothetical = checkInteractions([...cart, currentProduct.active_ingredient])`
- `newInteractions = hypothetical - baseline` (diff por par drugs[0]+drugs[1])

Solo se muestran las interacciones **nuevas** que aparecerían SI agregara este producto (evita repetir alertas ya visibles en carrito).

Filtro adicional: si el producto YA está en carrito (`item.product_id === product.id`), se excluye de baseline para no doble contar (caso usuario aumenta cantidad).

**DrugInteractionAlert** refactor: nuevas props opcionales `headerTitle`, `headerSubtitle`, `defaultOpen` para reusar component con copy contextual.

PDP copy:
- title: `Posible interacción con un producto de su carrito` / `Posibles interacciones con productos de su carrito (N)`
- subtitle: `Si agrega este producto, podría tener estas interacciones medicamentosas. Consulte con su médico o farmacéutico antes de continuar.`

Banner aparece arriba del qty selector + botón agregar (`product.stock > 0 && !added`). Auto-fetch del carrito en mount si aún null (cubre primera visita post-cold-start).

Archivos: `components/DrugInteractionAlert.tsx` (+15/-7), `app/producto/[slug]/ProductPageClient.tsx` (+27/-1). Build OK 160/160.

## 2026-05-10 — Print Lista de Medicamentos (Frente F)

Feature: botón "Imprimir lista para el médico" en `/carrito` genera documento A4 papel con datos de tratamiento, pensado para adulto mayor que lleva físicamente al control.

**Nuevo `components/PrintMedicationList.tsx`** (~160 líneas):
- Componente print-only (visible solo durante `body.printing-med-list`).
- Encabezado: logo Tu Farmacia + dirección Coquimbo + WhatsApp + fecha localizada `es-CL`.
- Datos paciente en grilla: Paciente (auto: `user.name`), RUT (blank), Edad (blank), Email (auto: `user.email`), Médico tratante (blank), Diagnóstico (blank).
- Tabla medicamentos: #, Producto, Principio activo, Posología orientativa (de `lookupDrugInfo`), Cantidad, **Dosis indicada por médico** (espacio en blanco para llenar).
- Sección Interacciones (si las hay): mismas reglas que carrito (`checkInteractions`), border rojo, sev badge crítica/mayor/moderada.
- Notas médico/farmacéutico: 4 líneas en blanco.
- Footer: firma médico + firma paciente.
- Disclaimer legal abajo.

**Print CSS scoped** (`globals.css` +130 líneas):
- `.print-only { display: none }` por default; visible solo bajo `body.printing-med-list`.
- A4 portrait `@page { size: A4 portrait; margin: 8mm }`.
- Serif `Georgia` 11pt para look profesional papel.
- Grid 2-col paciente, table con border negro 1px, severidad badges con border colorido.
- `position: fixed top:0 left:0 right:0` reemplaza viewport completo.

**Integración `/carrito/page.tsx`**:
- `handlePrintMedList`: agrega class → `window.print()` → cleanup 400ms.
- Botón Printer secundario (no-cyan, slate outline) abajo de "Continuar al pago".
- Render `<PrintMedicationList>` solo si hay items, fuera del flujo visual normal (visible vía CSS print).
- Auto-fill paciente desde `useAuthStore.user.name/email` si logueado.

Archivos: `components/PrintMedicationList.tsx` (+162), `app/globals.css` (+130), `app/carrito/page.tsx` (+18). Build OK 160/160.

## 2026-05-10 — Badge interacción en ProductCard /productos (Frente G)

Cierra ciclo interacciones: PDP (preview), Carrito (full), **ProductCard listings (subtle hint)**.

**`lib/drug-interactions.ts` +2 helpers**:
- `checkProductInteractions(cartIngredients, productIngredient)`: devuelve solo pares NUEVOS (producto × carrito). Eficiente para listados — pre-tokeniza cart drugs una vez.
- `topInteractionSeverity(cartIngredients, productIngredient)`: shortcut, devuelve `Severity | null` para banner cards.
- Fix iteración Set→Array (TS target no permite Set iter directo sin `--downlevelIteration`).

**`components/catalog/ProductCard.tsx`**:
- Nueva prop opcional `interactionSeverity?: Severity | null`.
- Badge top-right en card overlay imagen: `AlertTriangle` + texto "Interacción" (oculto `<sm`). Color según severidad:
  - crítica → rojo
  - mayor → naranja
  - moderada → ámbar
- `role="status"`, `aria-label` + `title` con texto completo ("Interacción crítica con tu carrito" / "Interacción con tu carrito" / "Posible interacción con tu carrito").
- No invasivo: badge pequeño (10px text), no bloquea agregar.

**`app/productos/page.tsx`**:
- `useEffect` auto-fetch cart si null.
- `useMemo` cart ingredients.
- Pasa `interactionSeverity={topInteractionSeverity(cartIngredients, product.active_ingredient)}` a cada `<ProductCard>`.
- Costo per render: O(N_productos × tokens_producto × |cart_drugs|) — tokens chicos, cart típicamente <10 drugs → negligible.

Resultado: navegando catálogo con carrito poblado, productos riesgosos resaltan visualmente antes de hacer click. Adulto mayor identifica potenciales conflictos sin tener que abrir cada producto.

Archivos: `lib/drug-interactions.ts` (+45/-3), `components/catalog/ProductCard.tsx` (+24/-2), `app/productos/page.tsx` (+8/-1). Build OK 160/160.

## 2026-05-10 — Combo lookup bidireccional + Filter toggle interacciones (Frente B + H)

**Frente B — Combo bidireccional `drug-info.ts`**:
- Nuevo `COMBO_INDEX: Map<sortedComboKey, canonicalKey>` construido al module load. Itera todas las keys de DRUG_INFO con ` + `, las sortea y mapea al canonical.
- `lookupDrugInfo` ahora consulta `COMBO_INDEX.get(sortedQuery)` — match independiente del orden en KB key vs orden de tokens en `active_ingredient`.
- Elimina necesidad de orden alfabético al agregar entradas combo nuevas al KB (era restricción artificial).
- También elimina el fallback "orden original" (ya no necesario porque sorted-vs-sorted siempre matchea).

**Frente H — Filter toggle interacciones `/productos`**:
- Banner ámbar con `AlertTriangle` arriba del grid productos cuando `interactionCount > 0`: "N productos podrían interactuar con tu carrito".
- Botón toggle "Ocultar interacciones" / "Mostrar todos" — `aria-pressed`, color invertido según estado (ámbar fill ↔ outline).
- Memoización 2 niveles:
  - `itemsWithSev`: map de `{product, severity}` computado una vez por (items, cartIngredients).
  - `visibleItems`: filter aplicado solo si `hideInteractions=true`.
  - `interactionCount`: count de severity !== null, derivado de `itemsWithSev`.
- `ProductCard` consume `severity` precomputada (evita doble cómputo).

Resultado: usuario con carrito poblado puede esconder productos riesgosos del catálogo con un click. Senior dev pattern: precompute en parent, pass to child, no recompute en card.

Archivos: `lib/drug-info.ts` (+15/-9), `app/productos/page.tsx` (+34/-2). Build OK 160/160.

## 2026-05-10 — Detector de principio activo duplicado (Frente I)

Feature: detección de duplicación de principios activos en carrito → alerta de riesgo de sobredosis (caso paradigmático: paracetamol oculto en antigripales sumado a paracetamol puro).

**Nuevo `lib/drug-duplicates.ts`** (~60 líneas):
- `DuplicateGroup`: `{ drug, prettyDrug, items: CartItem[] }`.
- `checkDuplicates(items)`: tokeniza cada `active_ingredient`, agrupa por canonical name vía `Map<drug, items[]>`, devuelve grupos con `length > 1`. De-dup tokens dentro del mismo item.
- TS-safe iteration via `Map.forEach` (target ES2015 no soporta `for...of` sobre `Map.entries()` sin downlevelIteration).

**Nuevo `components/DrugDuplicateAlert.tsx`** (~95 líneas):
- Banner fuchsia (color distinto a interacciones — semánticamente separado).
- `role=alert`, `aria-live=polite`, colapsable (`aria-expanded`, `aria-controls`).
- Header con `AlertOctagon` icon: "N principios activos duplicados".
- Mensaje claro: "Riesgo de doble dosis. Algunos productos comparten el mismo principio activo (por ejemplo, paracetamol presente en antigripales). Verifique con su médico o farmacéutico antes de combinarlos."
- Por grupo: principio activo pretty + count items + lista de productos involucrados (nombre + qty).

**Integración `/carrito/page.tsx`**:
- `useMemo` duplicates (skip si `items.length < 2`).
- Render DrugDuplicateAlert ARRIBA de DrugInteractionAlert (orden semántico: primero verificar duplicados, luego interacciones cruzadas).

Casos detectados típicos en farmacia Chile:
- PARACETAMOL puro + (PARACETAMOL+CLORFENAMINA+FENILEFRINA) antigripal → doble paracetamol
- IBUPROFENO + (IBUPROFENO+PSEUDOEFEDRINA) → doble AINE mismo principio
- CAFEINA en analgésicos compuestos + suplementos energéticos

Archivos: `lib/drug-duplicates.ts` (+62), `components/DrugDuplicateAlert.tsx` (+98), `app/carrito/page.tsx` (+6). Build OK 160/160.

## 2026-05-10 — PDP duplicate warning + print duplicates section

Extiende detección de duplicados al PDP y a la Lista de Medicamentos impresa.

**PDP `ProductPageClient.tsx`**:
- `useMemo` newDuplicates: construye item hipotético del producto actual, ejecuta `checkDuplicates([...otherItems, hypothetical])` vs baseline, devuelve solo grupos NUEVOS (por `drug` canonical name).
- Filtro `item.product_id !== initialProduct.id` evita doble cuenta cuando el producto YA está en carrito.
- Render `<DrugDuplicateAlert>` ANTES de `<DrugInteractionAlert>` (orden: duplicado primero, interacción luego). Solo si `product.stock > 0 && !added`.

**PrintMedicationList**:
- `useMemo` duplicates via `checkDuplicates(items)`.
- Nueva sección "Principios activos duplicados" border fuchsia, antes de Interacciones.
- Lista jerárquica: principio activo → productos involucrados con qty.

**Print CSS** (`globals.css` +30):
- `.med-duplicates` border `#a21caf` fuchsia con background `#fdf4ff`.
- `.med-dup-items` lista anidada disc, font 9pt.
- Visual diferenciado de interacciones (rojo) — adulto mayor identifica los dos tipos de alerta de un vistazo.

Archivos: `ProductPageClient.tsx` (+24/-1), `PrintMedicationList.tsx` (+24/-1), `globals.css` (+30). Build OK 160/160.

## 2026-05-10 — Compartir lista medicamentos por WhatsApp

Botón secundario "Compartir por WhatsApp" en `/carrito` junto a "Imprimir lista". Útil cuando adulto mayor quiere consultar con familiar o médico antes de comprar.

**`buildShareText`** genera texto plano formato WhatsApp:
```
*Mis medicamentos — Tu Farmacia*
Fecha: 10-05-2026

1. *Paracetamol 500mg* × 2
   Principio activo: PARACETAMOL
2. *Tapsin Día* × 1
   Principio activo: PARACETAMOL + CLORFENAMINA + FENILEFRINA

⚠ *Principios activos duplicados:*
- Paracetamol (2 productos)

⚠ *Interacciones detectadas:*
- Sertralina + Tramadol [MAYOR]

Pregunta: ¿es seguro combinar estos medicamentos?
```

**`handleShareList`**:
- Prefiere `navigator.share` (Web Share API nativa iOS/Android) para abrir picker del sistema.
- Fallback `wa.me/?text=` con `encodeURIComponent` si no soporta.
- Try/catch silencioso para cancelación user.

**Layout**: grid 1-col mobile, 2-col `sm` (imprimir + compartir lado a lado). Botón emerald distinto del print (slate) para diferenciación visual.

Archivos: `app/carrito/page.tsx` (+62/-7). Build OK 160/160.

## 2026-05-10 — useSpeech hook compartido + TTS en DrugInteractionAlert

Refactor: extrae `useSpeech` de `ProfessionalInfo.tsx` a `hooks/useSpeech.ts` (config es-CL rate 0.92 SSR-safe). `ProfessionalInfo` ahora importa el hook (drop código duplicado).

Nueva feature: botón TTS por interacción en `DrugInteractionAlert`. Lee en voz alta el par + severidad + efecto + recomendación. `aria-pressed` indica estado playing. `aria-label` contextual ("Escuchar interacción Sertralina más Tramadol" / "Detener lectura"). Botón 44×44 touch target.

El audio se construye verbalmente: `{drug1} más {drug2}. Severidad {Crítica/Mayor/Moderada}. Efecto: ... Recomendación: ...`. La conjunción "más" en lugar de "+" suena natural en español.

Adulto mayor con dificultad visual puede ESCUCHAR cada alerta sin tener que leer.

Archivos: `hooks/useSpeech.ts` (nuevo, +52), `app/producto/[slug]/ProfessionalInfo.tsx` (-32 código duplicado, +1 import), `components/DrugInteractionAlert.tsx` (+30 TTS btn por interacción). Build OK 160/160.

## 2026-05-10 — drug-info cobertura 100%

Cierre cobertura KB: 1004/1004 productos (antes 999/1004, 99.5%).

**Bugs raíz en `stripDoses` (drug-info.ts:4207)**:
1. Regex trailing `\b` falla cuando unidad es `%` seguida de espacio/coma. `%` non-word, espacio non-word → no word boundary → la dosis `0,3%` no se elimina y el token queda `HIDROXIPROPILMETILCELULOSA 0`. Fix: trailing `(?![A-Za-z0-9])` lookahead en lugar de `\b`. Cubre `%`, fin de string, y signos de puntuación.
2. Unidad `gr` (gramos) faltante en alternancia → `25gr/100gr` no se eliminaba. Agregado.

**Alias agregados** (homeopatía con sufijo de dilución D1..D30 + variante con sufijo I):
- `THUJA D1|D2|D3|D4|D6|D12|D30` → `HOMEOPATICO`
- `SYMPHYTUM OFFICINALE I` → `CONSUELDA`

**Verificación**: nuevo script `scripts/check-drug-coverage.mjs` (corre `lookupDrugInfo` contra `scripts/ai.json` del dump SQL) reporta 646/646 rows = 1004/1004 productos. Sin regresiones en combos bidireccionales (`TRAMADOL + PARACETAMOL` y `PARACETAMOL + TRAMADOL` → misma key combo).

Archivos: `src/lib/drug-info.ts` (regex + 9 aliases), `scripts/check-drug-coverage.mjs` (+25 nuevo), `scripts/ai.json` (snapshot dump). Build OK 160/160.

## 2026-05-11 — Cobertura suplementos: 6 entradas singles + 18 aliases nuevos

Extensión KB `drug-info.ts` para mejor cobertura de nutracéuticos. Gap-analysis sobre 652 AIs únicos del catálogo:
- 100% match (652/652) con tokenize+lookup actual (combos vía COMBO_INDEX).
- 4 AIs sin match previo: `CONDROITINA, GLUCOSAMINA` (n=3), `DIOSMINA, HESPERIDINA` (n=3), `BRIMONIDINA` (n=1). Las dos combinaciones ya tenían combo en KB; los singles faltaban para uso aislado.

**Entradas nuevas (singles)**: `GLUCOSAMINA`, `CONDROITINA`, `DIOSMINA`, `HESPERIDINA`, `CAFEINA`, `BRIMONIDINA`. Lenguaje nutracéutico en suplementos ("apoyo nutricional", "uso tradicional"). Estructura completa: categoria, indicaciones, posologia, efectos_adversos, contraindicaciones, precauciones_adulto_mayor, interacciones, conservacion.

**Aliases nuevos (18)**: `VIT C|D|D3|E|A|B1|B6|B12|B9`, `ACIDO ASCORBICO`, `TOCOFEROL`, `RETINOL`, `METILCOBALAMINA`, `FOLATO`, `ACIDO FOLINICO`, `SULFATO/CLORHIDRATO DE GLUCOSAMINA`, `SULFATO DE CONDROITINA`, `DIOSMINA HESPERIDINA` → claves canónicas KB.

**Verificación**: re-corrida análisis → 0 misses (147/147 suplementos detectados matchean). Build local OK (Next 14.2.35).

Archivos: `pharmacy-ecommerce/apps/web/src/lib/drug-info.ts` (+~100 líneas).

---

## 2026-05-12 — Importación facturas proveedor: parser modular + lote/vto

**Por qué**: digitalizar facturas Mediven (SII) y pedidos Global (Comprobante de Pedido) en lugar de cargar manual con software antiguo "golan". Captura completa: header + líneas + lote + vencimiento.

**Cambios**:
- Refactor `src/lib/invoice-parser/`: nuevos `types.ts`, `util.ts`, `index.ts` + `parsers/{global,mediven,generic}.ts`. Entry: `parseInvoice(text) → {format, header, lines}`. Detección automática por keywords/RUT.
- **Mediven** (nuevo, RUT 76.425.071-0): factura SII con tabla `Descripción|Cant|Precio|Total|Lote(MM-YYYY+code)`. Layout duplicado original/cedible → dedupe. Header: folio, fecha, vence, OC ref, neto/IVA/total. `MM-YYYY` → último día del mes ISO.
- **Global** (extraído): lógica `Comprobante de Pedido` actual + header (Pedido N°, fecha, total). RUT impreso es del comprador, no del proveedor → `supplier_rut=null`.
- Schema: `purchase_order_items` +`batch_code`, +`expiry_date`. `purchase_orders` +`subtotal_net`, +`tax_amount`, +`invoice_format`, +`po_reference`. `prisma db push` aplicado a prod.
- API `/api/admin/purchase-orders/scan`: usa `parseInvoice`, devuelve `{format, header, lines, detected_supplier_id}`. Auto-match proveedor por RUT.
- API POST `/api/admin/purchase-orders`: persiste header completo + batch/expiry por línea.
- API receive: crea `product_batches` por cada item con `expiry_date`.
- UI `/admin/compras/nueva`: campos cabecera (vence, OC), badge formato detectado, inputs lote+vto editables por línea, auto-llenado desde scan.
- Cliente `lib/api.ts`: nuevos tipos `InvoiceHeader`, `InvoiceFormat`, `ScanResponse`. `purchaseOrderApi.create` acepta batch/header.

Archivos: `pharmacy-ecommerce/apps/web/src/lib/invoice-parser/**`, `prisma/schema.prisma`, `app/api/admin/purchase-orders/{route.ts,scan/route.ts,[id]/receive/route.ts}`, `app/admin/compras/nueva/page.tsx`, `lib/api.ts`.

## 2026-05-12 — Digitalización facturas proveedor (full pipeline)

### DB (prod, vía cloud-sql-connector):
- `ALTER suppliers ADD COLUMN default_invoice_format VARCHAR(20)`.
- Reasignada fila Mediven existente (tenía RUT del comprador) → `Mediven SpA`, RUT `76425071-0`, email/teléfono completos, `default_invoice_format='mediven'`.
- Insertado supplier `Global` (rut=null, `default_invoice_format='global'`).
- `CREATE UNIQUE INDEX purchase_orders_supplier_invoice_unique ON (supplier_id, invoice_number) WHERE invoice_number IS NOT NULL`.

### Backend:
- `src/app/api/admin/purchase-orders/scan/route.ts`: pdf-parse v2 como primaria (texto nativo PDF), Vision OCR como fallback si <100 chars. Nuevo campo `text_source: 'pdf'|'vision'` en respuesta. Fallback de auto-match: si no hay RUT match, busca supplier por `default_invoice_format` (resuelve Global).
- `src/app/api/admin/purchase-orders/route.ts`: POST chequea duplicado `(supplier_id, invoice_number)` → 409 con `existing_id`. Catch `P2002` race-cond.
- `src/app/api/admin/purchase-orders/[id]/route.ts` GET: ahora serializa `due_date`, `subtotal_net`, `tax_amount`, `expiry_date` por item.
- `src/app/api/admin/suppliers/route.ts` (POST) + `[id]/route.ts` (PUT): aceptan `default_invoice_format`.

### Frontend:
- `/admin/compras/nueva`: badge formato en cada supplier, pre-llena `invoiceFormat` con el default del supplier al elegir. Manejo de 409 → confirma navegar a OC existente.
- `/admin/compras/[id]`: badge formato en header, filas `due_date` (rojo) y `po_reference`, línea-item con lote+vto, breakdown neto/IVA/total, botón "Exportar JSON" con `ocr_raw` completo.

### Tests:
- `vitest` configurado. `npm test` → 12/12 PASS.
- `src/lib/invoice-parser/__tests__/{global,mediven}.test.ts` validan header completo, conteo de líneas, lote+vto BENTLEY=5L332/2027-12-31, sin lotes en Global, ningún item sin código en Global, sum(items) ≈ neto en Mediven.
- Fixtures en `__tests__/fixtures/{global,mediven}.txt` (capturados con pdf-parse de los PDFs reales).

### Datos cargados en prod (3 OCs en estado draft):
- `0000750277` Global · 71 items (66 mapeados) · $1.297.766.
- `0000740850` Global · 53 items (48 mapeados) · $963.461.
- `3625647`   Mediven · 9 items (9 mapeados, todos con lote+vto) · $121.451 (neto $102.060 + IVA $19.391).

### Scripts:
- `scripts/import-pdf-invoices.ts` (tsx): pipeline ingestion idempotente que crea OCs y mappings desde PDFs.
- `scripts/extract-pdf-text.mjs`: genera fixtures de prueba desde PDFs reales.

## 2026-05-12 (cont.) — Receive + UI fixes

- BUG fix prod: `stock_movements.reason` constraint NO permitía 'purchase' → cambié receive route a 'reposicion' (constraint allow: reposicion/correccion/merma/inventario/venta/import_excel/ventas_historicas).
- Script `scripts/receive-draft-ocs.ts`: recibió las 3 OCs draft → stock +955 unidades, 9 lotes Mediven creados con notes "Factura 3625647", supplier_product_mappings upserts.
- Script `scripts/remap-unmapped-items.ts`: 2da pasada fuzzy match (tokens ≥4 chars + stopwords) → 6/10 de los items Global sin mapear quedaron mapeados.
- UI mejoras:
  · /admin/compras lista: badge formato + flag "Sin recibir >7d" + filtros desde/hasta + suma página.
  · /admin/compras/[id]: collapsible "Texto OCR original" para debug.
  · /admin/compras/nueva: drag-and-drop PDF/imagen en zona upload + badge "PDF nativo" vs "Vision OCR".
- Parser: detector `isCreditNote()` (NCE/Nota Crédito) → short-circuits a generic con lines=[]. UI bloquea import con alert "es NOTA DE CRÉDITO".
- Tests: 17/17 pass (vitest). Build local OK.

## 2026-05-12 (cont.2) — Revert PROPOLEO false-positive

- Detectado: fuzzy remap mapeó "PROPOLEO+VITC SP.AD.30 ML" (sup_code 9990256, qty 9) a "SL.VITC EFV.NAR.1000MG.20" (totalmente distinto). Score 0.50 inflado por single-token "VITC" en nombres cortos.
- Migración `20260512_revert_propoleo_mismatch.sql`: stock-=9 producto incorrecto, DELETE stock_movement, DELETE supplier_product_mapping, item.product_id=NULL.
- Hardening: scripts/remap-unmapped-items.ts ahora requiere `inter≥2 OR score≥0.60`. Previene regresiones single-token.
- Item PROPOLEO ahora pendiente para mapeo manual del operador.

## 2026-05-12 (cont.3) — Resolver 5 items unmapped (3 productos nuevos + 1 map existente)

- 5 `purchase_order_items` quedaban con `product_id=NULL` en OCs Global recibidas (`0000740850`, `0000750277`) tras revert PROPOLEO. Stock real con agujero.
- Script `scripts/resolve-unmapped.mjs` (transaccional, dry-run + `--execute`): mapea/crea + stock + movement + supplier_product_mapping en BEGIN/COMMIT atómico.
- Resoluciones:
  · BURTEN-SL 30 MG 2 COMP SUBLINGUALES (KETOROLACO) (sup_code 100000516, qty 5) → mapeado a `BURTEN SL 30MG.2COM.` (`198f4362…`) existente. Stock 1 → 6.
  · PROPOLEO+VITC SP.AD.30 ML (sup_code 9990256, qty 9) → producto NUEVO. Categoría `productos-naturales`. cost 1370, price 1790. Stock 9.
  · TRIOVAL DIA-NOCHE 20 COMP.REC. (sup_code 6256, qty 12+6=18 en ambas OCs) → producto NUEVO. Categoría `dolor-fiebre`. cost 3420, price 4450. Stock 18.
  · ALL-OUT PREVENCION PIOJOS SPRAY 120 ML (sup_code 27701044, qty 3) → producto NUEVO. Categoría `higiene-cuidado-personal`. cost 3405, price 4430. Stock 3.
- 4 `supplier_product_mappings` upsert para Global → futuras facturas auto-match por código.
- 5 `stock_movements` (`reason='reposicion'`, `admin_id='system-unmapped-resolve'`).
- `purchase_order_items.product_id IS NULL AND status='received'`: 5 → **0**. Stock real consistente.
- Decisiones price: margen ~30% sobre cost para que productos sean vendibles inmediatamente; owner ajusta en `/admin/productos` si lo desea.

## 2026-05-13 — UI auto-match button (suggest-matches)

- Nuevo endpoint `POST /api/admin/purchase-orders/[id]/suggest-matches`: token fuzzy (≥4 chars, stopwords, inter≥2 OR score≥0.60) → devuelve top-3 candidatos por item unmapped + flag `confident`. NUNCA aplica cambios.
- Componente `src/components/admin/SuggestMatchesModal.tsx`: modal con radio por item (omitir + N candidatos), badge confidence (verde si confident, ámbar si débil), pre-selecciona primer candidato confident. "Aplicar N" loop POST `/map-product` por cada selección.
- Botón "Sugerir matches" en `/admin/compras/[id]` aparece solo si status=draft AND existe ≥1 item sin `product_id`.
- Regla viva post-PROPOLEO: fuzzy NUNCA aplica sin confirmación humana → modal con radio + botón explícito "Aplicar".
- Regex `\p{L}` (Unicode property) no compila en target TS pre-ES6 → fallback ASCII + diacríticos ES (`[A-Za-zÁÉÍÓÚÑÜáéíóúñü0-9\s]`).
- Tests: 17/17 pass. Build local OK.

## 2026-05-13 (cont.) — Cron alerts pagos + vencimientos

- `/api/cron/payment-alerts` (GET, CRON_SECRET): query `purchase_orders WHERE status='received' AND paid=false AND due_date <= today+2`. Push por OC (no agrupado, operador ve cada factura). Tag `payment-{id}`. Title diferenciado: "⏰ Pago próximo" vs "⚠️ Pago vencido" (si due_date < hoy). URL `/admin/compras/{id}`.
- `/api/cron/expiry-alerts` (GET, CRON_SECRET): query `product_batches WHERE quantity>0 AND expiry_date <= today+30`. Agrupa por producto (suma quantity, cuenta lotes, marca vencidos). Title "⏰ Vencen pronto" o "⚠️ Vencidos". Body: "${nombre} · N unid. en M lotes · vence DD/MM/YYYY". Tag `expiry-{product_id}`. URL `/admin/vencimientos`.
- Ambos usan `sendBroadcast()` (web-push existente) — push a todas las subs registradas en `push_subscriptions`. Auto-cleanup stale endpoints (410/404).
- `vercel.json`: +2 crons, ambos schedule `0 12 * * *` (12 UTC = 09 Chile invierno).
- Gotchas TS: Prisma 7 no acepta `{ lte: x, not: null }` en campos DateTime nullable (devuelve null types). Eliminar `not: null` — el `lte` ya excluye NULL implícitamente. Map iteration requiere `Array.from(map.values())` con target pre-ES2015.
- 17/17 tests pass · build local OK.

## 2026-05-13 (cont.2) — Tab "Resumen" en /admin/compras con BarChart mensual

- `GET /api/admin/purchase-orders/monthly-summary?months=N` (N=1..24): buckets por mes (`YYYY-MM`), agrupado por proveedor. Solo `status='received'`. Devuelve `{ data: [{ month, label, total, [supplierName]: n }], suppliers: [{id,name}] }`.
- Componente `MonthlySummaryChart.tsx` (recharts): `BarChart` stacked por proveedor, ResponsiveContainer h-72. Selector `3/6/12 meses`. Tooltip formato CLP completo, YAxis k/M abreviado. Card secundaria con total período + breakdown por proveedor (%, monto, color dot).
- `/admin/compras/page.tsx`: tabs "Listado" / "Resumen". `activeTab` state default `'listado'`. En `resumen` se oculta banner reorden + filtros + tabla + paginación.
- Gotcha recharts 3.x: `Tooltip formatter` recibe `ValueType | undefined` → tipar como `(v) => …` + cast `Number(v)`.
- Colors palette 8 valores (emerald/blue/amber/pink/violet/cyan/red/lime).
- 17/17 tests · build OK.
