// Script para ejecutar migración 004 e importar productos desde Excel
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const connectionString = process.env.DATABASE_URL ||
    'postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway';

async function runImport() {
    const client = new Client({ connectionString });

    try {
        console.log('=====================================');
        console.log('  IMPORTACIÓN DE PRODUCTOS EXCEL');
        console.log('=====================================\n');

        // Step 1: Run migration
        console.log('[PASO 1/3] Ejecutando migración 004_excel_import.sql...');
        await client.connect();

        const migration004Path = path.join(__dirname, '..', 'database', 'migrations', '004_excel_import.sql');

        if (fs.existsSync(migration004Path)) {
            const migration004 = fs.readFileSync(migration004Path, 'utf8');
            await client.query(migration004);
            console.log('✓ Migración 004 completada\n');
        } else {
            console.log('⚠ Migración 004 no encontrada, continuando...\n');
        }

        // Verify columns exist
        const columnsResult = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'products'
            AND column_name IN ('external_id', 'laboratory')
        `);

        if (columnsResult.rows.length >= 2) {
            console.log('✓ Columnas external_id y laboratory verificadas\n');
        } else {
            console.log('⚠ Algunas columnas no existen, verificando...');
            console.log('  Columnas encontradas:', columnsResult.rows.map(r => r.column_name).join(', '));
        }

        await client.end();

        // Step 2: Run Python import script
        console.log('[PASO 2/3] Ejecutando importación de productos...\n');

        const pythonScript = path.join(__dirname, 'import_products.py');

        try {
            // Try python3 first, then python
            let pythonCmd = 'python3';
            try {
                execSync('python3 --version', { stdio: 'ignore' });
            } catch {
                pythonCmd = 'python';
            }

            execSync(`${pythonCmd} "${pythonScript}"`, {
                stdio: 'inherit',
                env: { ...process.env, DATABASE_URL: connectionString }
            });
        } catch (error) {
            console.error('❌ Error ejecutando script Python:', error.message);
            console.log('\nAsegúrate de tener instalado:');
            console.log('  pip install pandas psycopg2-binary openpyxl');
            process.exit(1);
        }

        // Step 3: Verify import
        console.log('\n[PASO 3/3] Verificando importación...\n');

        const verifyClient = new Client({ connectionString });
        await verifyClient.connect();

        const productsCount = await verifyClient.query('SELECT COUNT(*) FROM products');
        const categoriesCount = await verifyClient.query('SELECT COUNT(*) FROM categories');
        const availableCount = await verifyClient.query('SELECT COUNT(*) FROM products WHERE stock > 0');
        const outOfStockCount = await verifyClient.query('SELECT COUNT(*) FROM products WHERE stock = 0');
        const inventoryValue = await verifyClient.query('SELECT COALESCE(SUM(stock * price), 0) as total FROM products');

        // Sample products
        const sampleProducts = await verifyClient.query(`
            SELECT name, laboratory, stock, price
            FROM products
            ORDER BY RANDOM()
            LIMIT 5
        `);

        await verifyClient.end();

        console.log('=====================================');
        console.log('  RESUMEN DE IMPORTACIÓN');
        console.log('=====================================');
        console.log(`Total productos:     ${productsCount.rows[0].count}`);
        console.log(`  - Disponibles:     ${availableCount.rows[0].count}`);
        console.log(`  - Agotados:        ${outOfStockCount.rows[0].count}`);
        console.log(`Total categorías:    ${categoriesCount.rows[0].count}`);
        console.log(`Valor inventario:    $${Number(inventoryValue.rows[0].total).toLocaleString('es-CL')} CLP`);
        console.log('=====================================\n');

        console.log('Muestra de productos importados:');
        console.log('--------------------------------');
        sampleProducts.rows.forEach((p, i) => {
            console.log(`${i + 1}. ${p.name}`);
            console.log(`   Lab: ${p.laboratory || 'N/A'} | Stock: ${p.stock} | Precio: $${Number(p.price).toLocaleString('es-CL')}`);
        });

        console.log('\n✅ Importación completada exitosamente!');
        console.log('\nPuedes verificar los productos en:');
        console.log('  - Frontend: https://tu-farmacia.vercel.app');
        console.log('  - Admin: https://tu-farmacia.vercel.app/admin/productos');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

runImport();
