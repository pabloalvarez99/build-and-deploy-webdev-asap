#!/usr/bin/env node
/**
 * Script para configurar las categorías profesionales
 */

const { Client } = require('pg');
const DB_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  console.log('1. Limpiando categorias antiguas...');
  await client.query('UPDATE products SET category_id = NULL');
  await client.query('DELETE FROM categories');
  console.log('Categorias eliminadas');

  console.log('\n2. Creando nuevas categorias profesionales...');
  const categories = [
    ['Dolor y Fiebre', 'dolor-fiebre', 'Analgesicos, antipireticos, antiinflamatorios y antigripales'],
    ['Sistema Digestivo', 'sistema-digestivo', 'Antiacidos, laxantes, antiespasmodicos y reguladores gastrointestinales'],
    ['Sistema Cardiovascular', 'sistema-cardiovascular', 'Hipotensores, hipocolesterolemicos, anticoagulantes y medicamentos cardiacos'],
    ['Sistema Nervioso', 'sistema-nervioso', 'Antidepresivos, ansioliticos, anticonvulsionantes y sedantes'],
    ['Sistema Respiratorio', 'sistema-respiratorio', 'Expectorantes, broncodilatadores, antitusivos y descongestionantes'],
    ['Dermatologia', 'dermatologia', 'Antimicoticos, antiinflamatorios topicos, corticoides dermicos y humectantes'],
    ['Oftalmologia', 'oftalmologia', 'Antiglaucomatosos, antibioticos oftalmicos y humectantes oculares'],
    ['Salud Femenina', 'salud-femenina', 'Anticonceptivos, terapia hormonal y productos ginecologicos'],
    ['Diabetes y Metabolismo', 'diabetes-metabolismo', 'Hipoglicemiantes, tiroideoterapia y reguladores metabolicos'],
    ['Antibioticos e Infecciones', 'antibioticos-infecciones', 'Antibioticos sistemicos, antivirales y antimicoticos orales'],
    ['Vitaminas y Suplementos', 'vitaminas-suplementos', 'Vitaminas, minerales, suplementos alimenticios y productos naturales'],
    ['Higiene y Cuidado Personal', 'higiene-cuidado-personal', 'Higiene bucal, corporal, capilar, proteccion solar y cosmetica'],
    ['Bebes y Ninos', 'bebes-ninos', 'Panales, accesorios infantiles y productos pediatricos'],
    ['Adulto Mayor', 'adulto-mayor', 'Panales adulto, accesorios de movilidad y cuidado geriatrico'],
    ['Insumos Medicos', 'insumos-medicos', 'Accesorios medicos, material de curacion, tests y dispositivos'],
    ['Productos Naturales', 'productos-naturales', 'Homeopatia, fitoterapia y medicina natural'],
    ['Otros', 'otros', 'Productos varios y sin clasificacion especifica']
  ];

  for (const [name, slug, desc] of categories) {
    await client.query(
      'INSERT INTO categories (name, slug, description, active) VALUES ($1, $2, $3, true)',
      [name, slug, desc]
    );
  }
  console.log(categories.length + ' categorias creadas');

  const catResult = await client.query('SELECT id, slug FROM categories');
  const categoryMap = {};
  catResult.rows.forEach(c => categoryMap[c.slug] = c.id);

  console.log('\n3. Configurando mapeo de acciones terapeuticas...');

  const mappings = {
    'dolor-fiebre': ['ANALGESICO-ANTIPIRETICO', 'ANALGESICO-ANTIINFLAMATORIO', 'ANALGESICO', 'ANALGESICO MAYOR', 'ANTIGRIPAL', 'ANTIHISTAMINICO-DESCONGESTIONA', 'ANTIINFLAMATORIO TOPICO', 'ANTIJAQUECOSO', 'RELAJANTE MUSCULAR', 'ANTI-INFLAMATORIO NO ESTEROIDAL', 'ANALGESICO-RELAJANTE'],
    'sistema-digestivo': ['ANTIACIDOS', 'ANTIACIDO-ANTIFLATULENTO', 'ANTIULCEROSO', 'LAXANTE', 'ANTIESPASMODICO', 'REGULADOR GASTROINTESTINAL', 'REGULADOR FLORA INTESTINAL', 'ANTIEMETICO', 'ANTIDIARREICO', 'ANTIFLATULENTOS', 'ANTISEPTICO INTESTINAL', 'TRATAMIENTO COLON IRRITABLE', 'ANTIHELMINTICO', 'ENEMA', 'PROBIOTICOS'],
    'sistema-cardiovascular': ['HIPOTENSORES', 'HIPOCOLESTEROLEMICO', 'ANTICOAGULANTE', 'ANTIAGREGANTE PLAQUETARIO', 'ANTIANGINOSO', 'ANTIARRITMICO', 'CARDIOTONICO', 'VASODILATADOR', 'VASODIL', 'DIURETICO', 'ANTIVARICOSO'],
    'sistema-nervioso': ['ANTIDEPRESIVO', 'SEDANTES', 'NEUROLEPTICO(TRANQUILIZANTE MAYOR)', 'ANTICONVULSIONANTE', 'HIPNOTICOS', 'ANTIPARKINSONIANO', 'ESTIMULANTES CEREBRALES', 'CEREBROTONICO'],
    'sistema-respiratorio': ['EXPECTORANTE', 'BRONCODILATADOR', 'BRONCODILATADOR INHALATORIO', 'ANTITUSIVO', 'DESCONGESTIONANTE NASAL', 'DESCONGESTIONANTE TOPICO', 'CORTICOTERAPIA INHALATORIA', 'CORTICOTERAPIA NASAL', 'ANTIHISTAMINICO'],
    'dermatologia': ['ANTIMICOTICO TOPICO', 'CORTICOTERAPIA DERMICA', 'HUMECTANTE DERMICO', 'ANTISEPTICO DERMICO', 'ANTIACNE', 'ANTIPRURIGINOSO', 'REGENERADOR TEJIDO', 'QUERATOLITICO', 'CALLICIDA', 'QUEMADURAS', 'PEDICULICIDA', 'ANTISARNICO', 'CORTICOTER', 'CORTICOTERAPIA SISTEMICA'],
    'oftalmologia': ['ANTIGLAUCOMATOSO', 'ANTIBIOTICO OFTALMICO', 'HUMECTANTE OCULAR', 'DESCONGESTIONANTE OFTALMICO', 'LAGRIMAS ARTIFICIALES', 'DESEGREGACION TAPON DE CERUMEN', 'ANTIOTALGICO'],
    'salud-femenina': ['ANTICONCEPTIVO ORAL Y VAGINAL', 'ANTICONCEPTIVO ORAL', 'ANTICONCEPTIVO NO ORAL', 'ANTICONCEPTIVO DE EMERGENCIA', 'ANTICONCEPTIVO TRIFASICO', 'TERAPIA POSMENOPAUSICA', 'ANTIINFECCIOSO VAGINAL', 'PROGESTAGENOTERAPIA', 'TRICOMONICIDA ORAL', 'MENORRAGIA'],
    'diabetes-metabolismo': ['HIPOGLICEMIANTE', 'TIROIDEOTERAPIA', 'INSULINA', 'ANTIGOTOSO', 'ANOREXIGENOS'],
    'antibioticos-infecciones': ['ANTIBIOTERAPIA', 'PENICILINOTERAPIA', 'MACROLIDOTERAPIA', 'CEFALOSPORINOTERAPIA', 'QUINOLONOTERAPIA', 'ANTIVIRAL', 'ANTIMICOTICO SISTEMICO', 'SULFATERAPIA', 'ANTISEPTICO URINARIO', 'ANTIESPASMÓDICO URINARIO', 'HIPERPLASIA PROSTATICA BENIGNA'],
    'vitaminas-suplementos': ['SUPLEMENTO ALIMENTICIO', 'POLIVITAMINOTERAPIA', 'POLIVITAMINA+MINERALES', 'VITAMINOTERAPIA C', 'VITAMINOTERAPIA D', 'VITAMINOTERAPIA B', 'VITAMINOTERAPIA E', 'ANTIANEMICO', 'ANTIOXIDANTE', 'MINERALOTERAPIA', 'ELECTROLITOTERAPIA', 'REHIDRATANTE', 'INMUNOMODULADOR', 'PRODUCTOS NATURALES'],
    'higiene-cuidado-personal': ['DESODORANTES', 'SHAMPOO', 'ANTICASPA', 'JABONES', 'JABON HIPOALERGENICO', 'FILTRO SOLAR', 'PROTECTOR LABIAL', 'HUMECTANTE LABIAL', 'CREMAS MANOS Y CUERPO', 'CREMAS DE TRATAMIENTO', 'CREMAS DE ROSTRO', 'TALCOS', 'ENJUAGUES BUCALES', 'PASTAS DENTALES', 'CEPILLOS DENTALES', 'ANTISEPTICO BUCAL', 'ADHESIVOS PARA PROTESIS', 'LIMPIEZA DENTAL', 'ANESTESICO DENTAL', 'PREVENCION DE CARIES', 'ARTICULOS ASEO', 'ARTICULOS DE BELLEZA', 'ACCESORIOS MAQUILLAJES', 'ESMALTE UNAS', 'TINTURAS', 'BALSAMOS Y ACONDICIONADORES', 'TRATAMIENTO CAPILAR', 'PREVENCION DE CALVICIE', 'MAQUINAS DE AFEITAR', 'ESPUMAS DE AFEITAR', 'PRESERVATIVO', 'LUBRIC', 'TOALLAS HIGIENICAS', 'REPELENTE DE INSECTOS', 'ANDROGENO TERAPIA'],
    'bebes-ninos': ['ACCESORIOS INFANTILES', 'PANALES DE BEBE', 'ALIMENTOS LACTEOS'],
    'adulto-mayor': ['PANALES Y CUIDADO ADULTO MAYOR'],
    'insumos-medicos': ['ACCESORIOS MEDICOS', 'LIMPIEZA DE HERIDAS', 'PRUEBA EMBARAZO', 'TEST DROGAS', 'ALCOHOL-AGUA OXIGENADA', 'ANESTESICO-ANTISEPTICO', 'ANTIHEMORROIDAL'],
    'productos-naturales': ['HOMEOPATIA - H.MEDICINALES'],
    'otros': ['SIN ASIGNACION', 'OTROS', 'EDULCORANTE', 'EST', 'ESTIM', 'TRAT', 'ONCOLOGICO']
  };

  // Build flat map
  const actionToCategory = {};
  for (const [catSlug, actions] of Object.entries(mappings)) {
    for (const action of actions) {
      actionToCategory[action.toUpperCase()] = catSlug;
    }
  }
  console.log('Mapeos configurados: ' + Object.keys(actionToCategory).length + ' acciones');

  console.log('\n4. Asignando productos a categorias...');
  const products = await client.query('SELECT id, therapeutic_action FROM products');
  let assigned = 0, unassigned = 0;

  for (const p of products.rows) {
    let catSlug = 'otros';
    if (p.therapeutic_action) {
      const mapped = actionToCategory[p.therapeutic_action.toUpperCase()];
      if (mapped) {
        catSlug = mapped;
        assigned++;
      } else {
        unassigned++;
      }
    } else {
      unassigned++;
    }
    const catId = categoryMap[catSlug];
    if (catId) {
      await client.query('UPDATE products SET category_id = $1 WHERE id = $2', [catId, p.id]);
    }
  }

  console.log('Asignados correctamente:', assigned);
  console.log('Sin mapeo (a Otros):', unassigned);

  // Summary
  const summary = await client.query(`
    SELECT c.name, COUNT(p.id) as count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY count DESC
  `);

  console.log('\n' + '='.repeat(50));
  console.log('RESUMEN - Productos por Categoria');
  console.log('='.repeat(50));
  summary.rows.forEach(r => {
    const bar = '█'.repeat(Math.min(Math.floor(parseInt(r.count) / 10), 30));
    console.log(r.count.toString().padStart(4) + ' │ ' + bar + ' ' + r.name);
  });

  // Prescription type summary
  const prescSummary = await client.query(`
    SELECT prescription_type, COUNT(*) as count
    FROM products
    GROUP BY prescription_type
    ORDER BY count DESC
  `);

  console.log('\n' + '='.repeat(50));
  console.log('Por Tipo de Venta');
  console.log('='.repeat(50));
  prescSummary.rows.forEach(p => {
    const type = p.prescription_type === 'direct' ? 'Venta Directa' :
                 p.prescription_type === 'prescription' ? 'Receta Medica' :
                 p.prescription_type === 'retained' ? 'Receta Retenida' : p.prescription_type || 'Sin asignar';
    console.log(p.count.toString().padStart(4) + ' │ ' + type);
  });

  console.log('\n✅ Configuracion completada!');

  await client.end();
}

main().catch(console.error);
