#!/usr/bin/env node
// Phase B: limpia colisiones donde barcode == external_id de OTRO producto.
// Solo borra rows donde:
//   - ningun producto involucrado esta activo, O
//   - solo el ext_id-product esta activo (borrar pb row restaura ext_id fallback)
// Mantiene rows donde el barcode-holder esta activo (resuelve correctamente).
// Tambien: trim whitespace barcodes, y limpia 1 colision supplier_code si segura.
import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';
import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.prod-temp' });
const raw = process.env.GOOGLE_SERVICE_ACCOUNT.trim().replace(/\n/g, '\\n').replace(/\r/g, '');
const cr = JSON.parse(raw); cr.private_key = cr.private_key.replace(/\\n/g, '\n');
const auth = new GoogleAuth({ credentials: cr, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
const conn = new Connector({ auth });
const opts = await conn.getOptions({ instanceConnectionName: process.env.CLOUD_SQL_INSTANCE.trim(), ipType: IpAddressTypes.PUBLIC, authType: AuthTypes.PASSWORD });
const pool = new pg.Pool({ ...opts, user: process.env.DB_USER.trim(), password: process.env.DB_PASSWORD.trim(), database: process.env.DB_NAME.trim(), max: 1 });
const c = await pool.connect();

await c.query('BEGIN');
try {
  // 1) Delete colisiones ext_id (safe set)
  const delExt = await c.query(`
    DELETE FROM product_barcodes pb
    USING products pb_p, products p2
    WHERE pb_p.id = pb.product_id
      AND p2.external_id = pb.barcode
      AND p2.id <> pb.product_id
      AND (
        (pb_p.active = false AND p2.active = false) OR
        (pb_p.active = false AND p2.active = true)
      )
    RETURNING pb.barcode, pb.product_id
  `);
  console.log(`[1] Colisiones ext_id eliminadas: ${delExt.rowCount}`);

  // 2) Tambien borra de barcode_catalog si su external_id apunta al pb-product borrado
  //    (catalog quedaria huerfano logicamente). En realidad catalog usa external_id-key.
  //    Verificar: barcode_catalog tiene (external_id, barcode). Si borre pb row,
  //    catalog row del MISMO barcode tiene el external_id del pb-product (no del p2).
  //    Limpiar:
  const delCat = await c.query(`
    DELETE FROM barcode_catalog bc
    WHERE NOT EXISTS (SELECT 1 FROM product_barcodes pb WHERE pb.barcode = bc.barcode)
    RETURNING barcode, external_id
  `);
  console.log(`[2] barcode_catalog huerfanos eliminados: ${delCat.rowCount}`);

  // 3) Colision supplier_code unica
  const supCol = await c.query(`
    SELECT pb_p.active AS bc_active, sup_p.active AS sup_active
    FROM product_barcodes pb
    JOIN products pb_p ON pb_p.id = pb.product_id
    JOIN supplier_product_mappings spm ON spm.supplier_code = pb.barcode AND spm.product_id <> pb.product_id
    JOIN products sup_p ON sup_p.id = spm.product_id
    WHERE pb.barcode = '199002'
  `);
  if (supCol.rows.length && !supCol.rows[0].bc_active) {
    const r = await c.query(`DELETE FROM product_barcodes WHERE barcode = '199002' RETURNING barcode`);
    console.log(`[3] Supplier-code collision eliminada: ${r.rowCount}`);
  } else {
    console.log(`[3] Supplier-code collision NO eliminada (bc_active=${supCol.rows[0]?.bc_active})`);
  }

  // 4) Whitespace trim
  const trim = await c.query(`
    UPDATE product_barcodes SET barcode = TRIM(barcode)
    WHERE barcode <> TRIM(barcode) AND NOT EXISTS (
      SELECT 1 FROM product_barcodes pb2 WHERE pb2.barcode = TRIM(product_barcodes.barcode) AND pb2.id <> product_barcodes.id
    )
    RETURNING barcode
  `);
  console.log(`[4] Whitespace trimmed: ${trim.rowCount}`);

  await c.query('COMMIT');
  console.log('\nCOMMIT OK');
} catch (e) {
  await c.query('ROLLBACK');
  console.error('ROLLBACK:', e.message);
  process.exitCode = 1;
}

// verify
const remain = await c.query(`
  SELECT COUNT(*)::int AS n FROM product_barcodes pb
  JOIN products pb_p ON pb_p.id = pb.product_id
  JOIN products p2 ON p2.external_id = pb.barcode AND p2.id <> pb.product_id
`);
console.log(`\nColisiones ext_id restantes: ${remain.rows[0].n} (esperado: 4, todas bc-active)`);

c.release(); await pool.end(); conn.close();
