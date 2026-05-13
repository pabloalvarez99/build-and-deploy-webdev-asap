#!/usr/bin/env tsx
// 2da pasada fuzzy match para items sin product_id en OCs draft.
// Estrategia: tokens significativos (≥4 chars), score por # tokens match, top-1 con score ≥ 2.

import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';
import pg from 'pg';
import { config as dotenv } from 'dotenv';
dotenv({ path: '.env.prod-temp' });

const STOPWORDS = new Set([
  'MG', 'ML', 'GR', 'COMP', 'CAPS', 'CAP', 'TAB', 'BE', 'CNP', 'DM', 'RT',
  'COM', 'COMPR', 'COMPRIMIDOS', 'CAPSULAS', 'CAPSULA', 'X', 'POR', 'CON', 'SIN',
  'DE', 'LA', 'EL', 'Y', 'A', 'LP', 'REC', 'ENT', 'JBE', 'SOL', 'CR', 'UNG',
]);

function tokens(s: string): string[] {
  return s
    .toUpperCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

async function getPool() {
  const rawSA = process.env.GOOGLE_SERVICE_ACCOUNT!.trim().replace(/\n/g, '\\n').replace(/\r/g, '');
  const cr = JSON.parse(rawSA); cr.private_key = cr.private_key.replace(/\\n/g, '\n');
  const auth = new GoogleAuth({ credentials: cr, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const conn = new Connector({ auth });
  const opts = await conn.getOptions({ instanceConnectionName: process.env.CLOUD_SQL_INSTANCE!.trim(), ipType: IpAddressTypes.PUBLIC, authType: AuthTypes.PASSWORD });
  const pool = new pg.Pool({ ...opts, user: process.env.DB_USER!.trim(), password: process.env.DB_PASSWORD!.trim(), database: process.env.DB_NAME!.trim(), max: 1 });
  return { pool, conn };
}

async function main() {
  const { pool, conn } = await getPool();
  const c = await pool.connect();
  try {
    const unmapped = await c.query(`
      SELECT i.id, i.purchase_order_id, i.supplier_product_code, i.product_name_invoice, po.supplier_id
      FROM purchase_order_items i
      JOIN purchase_orders po ON po.id = i.purchase_order_id
      WHERE i.product_id IS NULL AND po.status = 'draft'
    `);
    console.log(`unmapped items: ${unmapped.rows.length}`);

    const products = await c.query(`SELECT id, name FROM products WHERE active = true`);
    console.log(`active products: ${products.rows.length}`);

    let matched = 0;
    for (const item of unmapped.rows) {
      const invTokens = tokens(item.product_name_invoice || '');
      if (invTokens.length < 1) { console.log(`✗ "${item.product_name_invoice}" — sin tokens útiles`); continue; }

      let best: { id: string; name: string; score: number; inter: number } | null = null;
      for (const p of products.rows) {
        const prodTokens = tokens(p.name);
        const inter = invTokens.filter((t) => prodTokens.includes(t)).length;
        if (inter === 0) continue;
        const score = inter / Math.max(invTokens.length, prodTokens.length);
        if (!best || score > best.score) best = { id: p.id, name: p.name, score, inter };
      }
      // Anti false-positive: requiere ≥2 tokens compartidos O score ≥ 0.60 (un solo token coincidente con score alto = nombre corto idéntico, OK)
      if (best && (best.inter >= 2 || best.score >= 0.60)) {
        await c.query('UPDATE purchase_order_items SET product_id = $1 WHERE id = $2', [best.id, item.id]);
        if (item.supplier_product_code) {
          await c.query(
            `INSERT INTO supplier_product_mappings (supplier_id, supplier_code, product_id)
             VALUES ($1,$2,$3)
             ON CONFLICT (supplier_id, supplier_code) DO UPDATE SET product_id = EXCLUDED.product_id`,
            [item.supplier_id, item.supplier_product_code, best.id]
          );
        }
        matched++;
        console.log(`✓ "${item.product_name_invoice}" → "${best.name}" (score ${best.score.toFixed(2)})`);
      } else {
        console.log(`✗ "${item.product_name_invoice}" — best=${best?.name ?? 'none'} score=${best?.score?.toFixed(2) ?? '0'}`);
      }
    }
    console.log(`\nresult: ${matched}/${unmapped.rows.length} mapeados`);
  } finally {
    c.release(); await pool.end(); conn.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
