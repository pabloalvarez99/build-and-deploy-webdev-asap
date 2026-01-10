// Script para ejecutar migraciones en PostgreSQL
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway';

async function runMigrations() {
    const client = new Client({ connectionString });

    try {
        console.log('Conectando a PostgreSQL...');
        await client.connect();
        console.log('✓ Conectado');

        // Migración 001
        console.log('\n[1/2] Ejecutando migración 001_initial.sql...');
        const migration001 = fs.readFileSync(
            path.join(__dirname, 'database', 'migrations', '001_initial.sql'),
            'utf8'
        );
        await client.query(migration001);
        console.log('✓ Migración 001 completada');

        // Migración 002
        console.log('\n[2/2] Ejecutando migración 002_guest_checkout.sql...');
        const migration002 = fs.readFileSync(
            path.join(__dirname, 'database', 'migrations', '002_guest_checkout.sql'),
            'utf8'
        );
        await client.query(migration002);
        console.log('✓ Migración 002 completada');

        // Verificar datos
        console.log('\n--- Verificación ---');
        const categories = await client.query('SELECT COUNT(*) FROM categories');
        console.log(`✓ Categorías creadas: ${categories.rows[0].count}`);

        const products = await client.query('SELECT COUNT(*) FROM products');
        console.log(`✓ Productos creados: ${products.rows[0].count}`);

        const users = await client.query('SELECT COUNT(*) FROM users');
        console.log(`✓ Usuarios creados: ${users.rows[0].count}`);

        console.log('\n✅ Migraciones completadas exitosamente!');
    } catch (error) {
        console.error('❌ Error ejecutando migraciones:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigrations();
