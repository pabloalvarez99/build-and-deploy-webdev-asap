// Script para ejecutar migración de Stripe
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway';

async function runStripeMigration() {
    const client = new Client({ connectionString });

    try {
        console.log('Conectando a PostgreSQL...');
        await client.connect();
        console.log('✓ Conectado');

        // Migración 003 - Stripe
        console.log('\nEjecutando migración 003_stripe_integration.sql...');
        const migration003 = fs.readFileSync(
            path.join(__dirname, 'database', 'migrations', '003_stripe_integration.sql'),
            'utf8'
        );
        await client.query(migration003);
        console.log('✓ Migración 003 completada');

        // Verificar columnas
        console.log('\n--- Verificación ---');
        const columns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name IN ('payment_provider', 'stripe_checkout_session_id', 'stripe_payment_intent_id')
        `);
        
        columns.rows.forEach(col => {
            console.log(`✓ Columna ${col.column_name}: ${col.data_type}`);
        });

        console.log('\n✅ Migración Stripe completada exitosamente!');
    } catch (error) {
        console.error('❌ Error ejecutando migración:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runStripeMigration();
