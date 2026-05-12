#!/usr/bin/env tsx
// Recibe TODAS las OCs en estado 'draft' creadas por import-pdf-invoices.
// Mismo logic que /api/admin/purchase-orders/[id]/receive pero vía pg directo.

import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';
import pg from 'pg';
import { config as dotenv } from 'dotenv';
dotenv({ path: '.env.prod-temp' });

async function getPool() {
  const rawSA = process.env.GOOGLE_SERVICE_ACCOUNT!.trim().replace(/\n/g, '\\n').replace(/\r/g, '');
  const cr = JSON.parse(rawSA); cr.private_key = cr.private_key.replace(/\\n/g, '\n');
  const auth = new GoogleAuth({ credentials: cr, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const conn = new Connector({ auth });
  const opts = await conn.getOptions({ instanceConnectionName: process.env.CLOUD_SQL_INSTANCE!.trim(), ipType: IpAddressTypes.PUBLIC, authType: AuthTypes.PASSWORD });
  const pool = new pg.Pool({ ...opts, user: process.env.DB_USER!.trim(), password: process.env.DB_PASSWORD!.trim(), database: process.env.DB_NAME!.trim(), max: 1 });
  return { pool, conn };
}

const ADMIN = 'script:receive-draft-ocs';

async function receiveOC(c: pg.PoolClient, poId: string) {
  const po = await c.query(`SELECT id, supplier_id, invoice_number, status FROM purchase_orders WHERE id = $1`, [poId]);
  if (!po.rows[0]) { console.log(`✗ ${poId} no existe`); return; }
  if (po.rows[0].status !== 'draft') { console.log(`↻ ${poId} status=${po.rows[0].status} — skip`); return; }
  const supplierId = po.rows[0].supplier_id;
  const invoiceNumber = po.rows[0].invoice_number;

  const items = await c.query(
    `SELECT id, product_id, supplier_product_code, quantity, unit_cost, batch_code, expiry_date
     FROM purchase_order_items WHERE purchase_order_id = $1`, [poId]
  );
  const mapped = items.rows.filter((i) => i.product_id !== null);
  console.log(`OC ${invoiceNumber} (${poId}) — ${mapped.length}/${items.rows.length} mapeados`);
  if (!mapped.length) { console.log(`  ✗ sin items mapeados — skip`); return; }

  await c.query('BEGIN');
  try {
    let batches = 0;
    for (const item of mapped) {
      await c.query(
        `UPDATE products SET stock = stock + $1, cost_price = $2 WHERE id = $3`,
        [item.quantity, item.unit_cost, item.product_id]
      );
      await c.query(
        `INSERT INTO stock_movements (product_id, delta, reason, admin_id) VALUES ($1,$2,'reposicion',$3)`,
        [item.product_id, item.quantity, ADMIN]
      );
      if (item.supplier_product_code) {
        await c.query(
          `INSERT INTO supplier_product_mappings (supplier_id, supplier_code, product_id)
           VALUES ($1,$2,$3)
           ON CONFLICT (supplier_id, supplier_code) DO UPDATE SET product_id = EXCLUDED.product_id`,
          [supplierId, item.supplier_product_code, item.product_id]
        );
      }
      if (item.expiry_date) {
        await c.query(
          `INSERT INTO product_batches (product_id, batch_code, expiry_date, quantity, notes)
           VALUES ($1,$2,$3,$4,$5)`,
          [item.product_id, item.batch_code, item.expiry_date, item.quantity,
           invoiceNumber ? `Factura ${invoiceNumber}` : null]
        );
        batches++;
      }
    }
    await c.query(`UPDATE purchase_orders SET status = 'received' WHERE id = $1`, [poId]);

    // Notificar faltas pending
    const pids = mapped.map((m) => m.product_id);
    await c.query(
      `UPDATE faltas SET status = 'notified', notified_at = NOW()
       WHERE product_id = ANY($1::uuid[]) AND status = 'pending'`,
      [pids]
    );
    await c.query('COMMIT');
    console.log(`  ✓ stock++ en ${mapped.length} productos, ${batches} lotes creados, status=received`);
  } catch (e) {
    await c.query('ROLLBACK'); throw e;
  }
}

async function main() {
  const { pool, conn } = await getPool();
  const c = await pool.connect();
  try {
    const drafts = await c.query(
      `SELECT id FROM purchase_orders WHERE status='draft' AND created_by='script:import-pdf-invoices' ORDER BY created_at`
    );
    for (const r of drafts.rows) await receiveOC(c, r.id);
  } finally {
    c.release(); await pool.end(); conn.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
