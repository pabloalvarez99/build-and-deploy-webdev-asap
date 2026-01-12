// Script para actualizar precios a Pesos Chilenos (CLP)
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway';

// Precios reales en Pesos Chilenos
const preciosCLP = {
  'Paracetamol 500mg x 20': 2990,
  'Ibuprofeno 400mg x 10': 3490,
  'Vitamina C 1000mg x 30': 8990,
  'Omega 3 x 60 cápsulas': 12990,
  'Crema Hidratante 200ml': 9990,
  'Shampoo Anticaspa 400ml': 7490,
  'Pañales Bebé Talla M x 40': 14990,
  'Protector Solar FPS 50': 15990
};

async function updatePrices() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✓ Conectado a PostgreSQL\n');
    console.log('Actualizando precios a Pesos Chilenos (CLP)...\n');
    
    for (const [nombre, precio] of Object.entries(preciosCLP)) {
      const result = await client.query(
        'UPDATE products SET price = $1 WHERE name = $2 RETURNING name, price',
        [precio, nombre]
      );
      
      if (result.rows.length > 0) {
        const formattedPrice = new Intl.NumberFormat('es-CL', {
          style: 'currency',
          currency: 'CLP',
          minimumFractionDigits: 0
        }).format(result.rows[0].price);
        console.log(`✓ ${result.rows[0].name}: ${formattedPrice}`);
      } else {
        console.log(`⚠ No encontrado: ${nombre}`);
      }
    }
    
    console.log('\n--- Verificación ---');
    const allProducts = await client.query('SELECT name, price FROM products ORDER BY price DESC');
    console.log('\nTodos los productos:');
    allProducts.rows.forEach(p => {
      const formattedPrice = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
      }).format(p.price);
      console.log(`  ${p.name}: ${formattedPrice}`);
    });
    
    console.log('\n✅ Precios actualizados exitosamente a CLP!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updatePrices();
