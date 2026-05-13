#!/usr/bin/env node
// Resolve 5 unmapped purchase_order_items (OCs 0000740850 + 0000750277, supplier Global).
// Map BURTEN-SL to existing product; create 3 new products; apply stock + movements + mappings.
// Usage: node scripts/resolve-unmapped.mjs [--execute]
import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';
import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.prod-temp' });

const EXECUTE = process.argv.includes('--execute');
const ADMIN_ID = 'system-unmapped-resolve';
const GLOBAL_SUPPLIER_ID = '97736b06-e53c-46f5-9a62-b32b94399975';

const rawSA = process.env.GOOGLE_SERVICE_ACCOUNT.trim().replace(/\n/g, '\\n').replace(/\r/g, '');
const credentials = JSON.parse(rawSA);
credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
const connector = new Connector({ auth });
const opts = await connector.getOptions({ instanceConnectionName: process.env.CLOUD_SQL_INSTANCE.trim(), ipType: IpAddressTypes.PUBLIC, authType: AuthTypes.PASSWORD });
const pool = new pg.Pool({ ...opts, user: process.env.DB_USER.trim(), password: process.env.DB_PASSWORD.trim(), database: process.env.DB_NAME.trim(), max: 1 });

// Plan
const BURTEN_EXISTING_ID = '198f4362-08b8-4058-b798-568afda4f491';

// new products to create
const NEW_PRODUCTS = [
  {
    key: 'PROPOLEO_VITC',
    name: 'PROPOLEO+VITC SP.AD.30 ML',
    slug: 'propoleo-vitc-spray-adulto-30ml',
    category_id: '4dfe3a3b-7dc1-4ac2-ad4b-21015a17402e', // productos-naturales
    presentation: 'Spray 30 ML',
    cost_price: 1370,
    price: 1790, // ~30% margin, rounded
    initial_stock: 9,
  },
  {
    key: 'TRIOVAL_DIA_NOCHE',
    name: 'TRIOVAL DIA-NOCHE 20 COMP.REC. (PARACETAMOL+PSEUDOEF+CLORFEN)',
    slug: 'trioval-dia-noche-20-comp-rec',
    category_id: '51b2f83b-4902-47de-8908-e3098988de92', // dolor-fiebre
    presentation: '20 Comprimidos Recubiertos',
    cost_price: 3420,
    price: 4450, // ~30% margin
    initial_stock: 0, // movements per item below
    active_ingredient: 'Paracetamol + Pseudoefedrina + Clorfenamina',
  },
  {
    key: 'ALL_OUT_SPRAY',
    name: 'ALL-OUT PREVENCION PIOJOS SPRAY 120 ML',
    slug: 'all-out-prevencion-piojos-spray-120ml',
    category_id: '5bfe6607-c6ef-4cf0-94da-1702b08f68c1', // higiene-cuidado-personal
    presentation: 'Spray 120 ML',
    cost_price: 3405,
    price: 4430, // ~30% margin
    initial_stock: 3,
  },
];

// Items to map
// Each: { itemId, plan: 'existing' | newKey, supplier_code, qty }
const ITEMS = [
  { itemId: '26772cce-c6d6-4fc0-87d1-9c7630c73419', label: 'BURTEN-SL', target: { kind: 'existing', product_id: BURTEN_EXISTING_ID }, supplier_code: '100000516', qty: 5 },
  { itemId: 'd6257567-8d7d-4474-a69d-f42ee85118fa', label: 'PROPOLEO+VITC', target: { kind: 'new', key: 'PROPOLEO_VITC' }, supplier_code: '9990256', qty: 9 },
  { itemId: 'b4fc27c6-f16d-4795-9bd5-81ea68492fec', label: 'TRIOVAL OC1', target: { kind: 'new', key: 'TRIOVAL_DIA_NOCHE' }, supplier_code: '6256', qty: 12 },
  { itemId: 'fdc1bdff-877e-497b-aaf7-309e649e7097', label: 'ALL-OUT', target: { kind: 'new', key: 'ALL_OUT_SPRAY' }, supplier_code: '27701044', qty: 3 },
  { itemId: '45eda184-43c1-474d-800a-03251ed1d26e', label: 'TRIOVAL OC2', target: { kind: 'new', key: 'TRIOVAL_DIA_NOCHE' }, supplier_code: '6256', qty: 6 },
];

console.log(`\n=== resolve-unmapped (${EXECUTE ? 'EXECUTE' : 'DRY-RUN'}) ===\n`);
console.log('Plan:');
console.log(`  - Map BURTEN-SL to existing product ${BURTEN_EXISTING_ID} (+5 stock)`);
for (const p of NEW_PRODUCTS) console.log(`  - Create product "${p.name}" cat=${p.category_id.slice(0,8)}.. cost=${p.cost_price} price=${p.price}`);
console.log(`  - Per-item: BURTEN +5, PROPOLEO+VITC +9, TRIOVAL +12 (OC1) +6 (OC2) = +18, ALL-OUT +3`);

const c = await pool.connect();
try {
  if (EXECUTE) await c.query('BEGIN');
  else await c.query('BEGIN'); // wrap in tx even for dry-run so we ROLLBACK

  // 1. Create new products, track ids
  const newIds = {};
  for (const p of NEW_PRODUCTS) {
    const cols = ['name','slug','price','stock','category_id','active','prescription_type','presentation','cost_price'];
    const vals = [p.name, p.slug, p.price, p.initial_stock || 0, p.category_id, true, 'direct', p.presentation, p.cost_price];
    if (p.active_ingredient) { cols.push('active_ingredient'); vals.push(p.active_ingredient); }
    const placeholders = cols.map((_, i) => `$${i+1}`).join(',');
    const res = await c.query(`INSERT INTO products (${cols.join(',')}) VALUES (${placeholders}) RETURNING id, name`, vals);
    newIds[p.key] = res.rows[0].id;
    console.log(`  + product ${p.key} id=${res.rows[0].id}`);
  }

  // 2. Per-item: update purchase_order_items.product_id, products.stock, stock_movements, supplier_product_mappings
  for (const it of ITEMS) {
    const productId = it.target.kind === 'existing' ? it.target.product_id : newIds[it.target.key];
    if (!productId) throw new Error(`No productId for ${it.label}`);
    // 2a. map item
    await c.query(`UPDATE purchase_order_items SET product_id=$1 WHERE id=$2`, [productId, it.itemId]);
    // 2b. stock += qty (NOTE: for new products, initial_stock already set for some — only apply delta for items not already counted)
    let applyStock = it.qty;
    if (it.target.kind === 'new') {
      const np = NEW_PRODUCTS.find(p => p.key === it.target.key);
      if (np && np.initial_stock === it.qty) {
        // initial_stock already reflects this item; skip
        applyStock = 0;
      }
    }
    if (applyStock > 0) {
      await c.query(`UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2`, [applyStock, productId]);
    }
    // 2c. stock movement (always log full qty for audit)
    await c.query(
      `INSERT INTO stock_movements (id, product_id, admin_id, delta, reason, created_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, now())`,
      [productId, ADMIN_ID, it.qty, 'reposicion']
    );
    // 2d. supplier mapping (upsert)
    await c.query(
      `INSERT INTO supplier_product_mappings (id, supplier_id, supplier_code, product_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, now())
       ON CONFLICT DO NOTHING`,
      [GLOBAL_SUPPLIER_ID, it.supplier_code, productId]
    );
    console.log(`  ✓ ${it.label}: item→${productId.slice(0,8)} stock+${applyStock} (audit ${it.qty}) mapping sup_code=${it.supplier_code}`);
  }

  // 3. Verify zero unmapped remain on received OCs
  const remaining = await c.query(`
    SELECT COUNT(*) AS n FROM purchase_order_items i
    JOIN purchase_orders po ON po.id = i.purchase_order_id
    WHERE i.product_id IS NULL AND po.status='received'
  `);
  console.log(`\n  remaining unmapped on received OCs: ${remaining.rows[0].n}`);

  if (EXECUTE) {
    await c.query('COMMIT');
    console.log('\n✅ COMMIT');
  } else {
    await c.query('ROLLBACK');
    console.log('\n↩  DRY-RUN rolled back. Re-run with --execute to apply.');
  }
} catch (e) {
  await c.query('ROLLBACK');
  console.error('\n❌ ROLLBACK:', e.message);
  process.exit(1);
} finally {
  c.release(); await pool.end(); connector.close();
}
