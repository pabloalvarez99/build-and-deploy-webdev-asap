-- Migration 005: Professional pharmacy categories system
-- Adds structured fields for therapeutic classification and reorganizes categories

-- ============================================
-- PART 1: Add structured fields to products
-- ============================================

-- Therapeutic action (e.g., ANALGESICO-ANTIPIRETICO, HIPOTENSORES)
ALTER TABLE products ADD COLUMN IF NOT EXISTS therapeutic_action VARCHAR(255);

-- Active ingredient/principle (e.g., PARACETAMOL, IBUPROFENO)
ALTER TABLE products ADD COLUMN IF NOT EXISTS active_ingredient VARCHAR(500);

-- Prescription type: 'direct' (venta libre), 'prescription' (receta médica), 'retained' (receta retenida)
ALTER TABLE products ADD COLUMN IF NOT EXISTS prescription_type VARCHAR(50) DEFAULT 'direct';

-- Presentation form (e.g., COMPRIMIDO, JARABE, CREMA)
ALTER TABLE products ADD COLUMN IF NOT EXISTS presentation VARCHAR(255);

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_products_therapeutic_action ON products(therapeutic_action);
CREATE INDEX IF NOT EXISTS idx_products_prescription_type ON products(prescription_type);
CREATE INDEX IF NOT EXISTS idx_products_active_ingredient ON products(active_ingredient);

-- ============================================
-- PART 2: Clean up old categories (remove lab-based categories)
-- ============================================

-- First, set all products to have NULL category (we'll reassign them)
UPDATE products SET category_id = NULL;

-- Delete all categories that have 0 products (the lab-based ones)
DELETE FROM categories WHERE id NOT IN (SELECT DISTINCT category_id FROM products WHERE category_id IS NOT NULL);

-- Delete all remaining categories to start fresh
DELETE FROM categories;

-- ============================================
-- PART 3: Create professional pharmacy categories
-- ============================================

INSERT INTO categories (name, slug, description, active) VALUES
-- Main therapeutic categories
('Dolor y Fiebre', 'dolor-fiebre', 'Analgésicos, antipiréticos, antiinflamatorios y antigripales', true),
('Sistema Digestivo', 'sistema-digestivo', 'Antiácidos, laxantes, antiespasmódicos y reguladores gastrointestinales', true),
('Sistema Cardiovascular', 'sistema-cardiovascular', 'Hipotensores, hipocolesterolémicos, anticoagulantes y medicamentos cardíacos', true),
('Sistema Nervioso', 'sistema-nervioso', 'Antidepresivos, ansiolíticos, anticonvulsionantes y sedantes', true),
('Sistema Respiratorio', 'sistema-respiratorio', 'Expectorantes, broncodilatadores, antitusivos y descongestionantes', true),
('Dermatología', 'dermatologia', 'Antimicóticos, antiinflamatorios tópicos, corticoides dérmicos y humectantes', true),
('Oftalmología', 'oftalmologia', 'Antiglaucomatosos, antibióticos oftálmicos y humectantes oculares', true),
('Salud Femenina', 'salud-femenina', 'Anticonceptivos, terapia hormonal y productos ginecológicos', true),
('Diabetes y Metabolismo', 'diabetes-metabolismo', 'Hipoglicemiantes, tiroideoterapia y reguladores metabólicos', true),
('Antibióticos e Infecciones', 'antibioticos-infecciones', 'Antibióticos sistémicos, antivirales y antimicóticos orales', true),
('Vitaminas y Suplementos', 'vitaminas-suplementos', 'Vitaminas, minerales, suplementos alimenticios y productos naturales', true),
('Higiene y Cuidado Personal', 'higiene-cuidado-personal', 'Higiene bucal, corporal, capilar, protección solar y cosmética', true),
('Bebés y Niños', 'bebes-ninos', 'Pañales, accesorios infantiles y productos pediátricos', true),
('Adulto Mayor', 'adulto-mayor', 'Pañales adulto, accesorios de movilidad y cuidado geriátrico', true),
('Insumos Médicos', 'insumos-medicos', 'Accesorios médicos, material de curación, tests y dispositivos', true),
('Productos Naturales', 'productos-naturales', 'Homeopatía, fitoterapia y medicina natural', true),
('Otros', 'otros', 'Productos varios y sin clasificación específica', true);

-- ============================================
-- PART 4: Create mapping table for therapeutic actions to categories
-- ============================================

CREATE TABLE IF NOT EXISTS therapeutic_category_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapeutic_action VARCHAR(255) NOT NULL,
    category_slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert mappings
INSERT INTO therapeutic_category_mapping (therapeutic_action, category_slug) VALUES
-- Dolor y Fiebre
('ANALGESICO-ANTIPIRETICO', 'dolor-fiebre'),
('ANALGESICO-ANTIINFLAMATORIO', 'dolor-fiebre'),
('ANALGESICO', 'dolor-fiebre'),
('ANALGESICO MAYOR', 'dolor-fiebre'),
('ANALGESICO-RELAJANTE', 'dolor-fiebre'),
('ANTIGRIPAL', 'dolor-fiebre'),
('ANTIHISTAMINICO-DESCONGESTIONA', 'dolor-fiebre'),
('ANTIINFLAMATORIO TOPICO', 'dolor-fiebre'),
('ANTIJAQUECOSO', 'dolor-fiebre'),
('RELAJANTE MUSCULAR', 'dolor-fiebre'),
('ANTI-INFLAMATORIO NO ESTEROIDAL', 'dolor-fiebre'),

-- Sistema Digestivo
('ANTIACIDOS', 'sistema-digestivo'),
('ANTIACIDO-ANTIFLATULENTO', 'sistema-digestivo'),
('ANTIULCEROSO', 'sistema-digestivo'),
('LAXANTE', 'sistema-digestivo'),
('ANTIESPASMODICO', 'sistema-digestivo'),
('REGULADOR GASTROINTESTINAL', 'sistema-digestivo'),
('REGULADOR FLORA INTESTINAL', 'sistema-digestivo'),
('ANTIEMETICO', 'sistema-digestivo'),
('ANTIDIARREICO', 'sistema-digestivo'),
('ANTIFLATULENTOS', 'sistema-digestivo'),
('ANTISEPTICO INTESTINAL', 'sistema-digestivo'),
('TRATAMIENTO COLON IRRITABLE', 'sistema-digestivo'),
('ANTIHELMINTICO', 'sistema-digestivo'),
('ENEMA', 'sistema-digestivo'),
('PROBIOTICOS', 'sistema-digestivo'),

-- Sistema Cardiovascular
('HIPOTENSORES', 'sistema-cardiovascular'),
('HIPOCOLESTEROLEMICO', 'sistema-cardiovascular'),
('ANTICOAGULANTE', 'sistema-cardiovascular'),
('ANTIAGREGANTE PLAQUETARIO', 'sistema-cardiovascular'),
('ANTIANGINOSO', 'sistema-cardiovascular'),
('ANTIARRITMICO', 'sistema-cardiovascular'),
('CARDIOTONICO', 'sistema-cardiovascular'),
('VASODILATADOR', 'sistema-cardiovascular'),
('VASODIL', 'sistema-cardiovascular'),
('DIURETICO', 'sistema-cardiovascular'),
('ANTIVARICOSO', 'sistema-cardiovascular'),

-- Sistema Nervioso
('ANTIDEPRESIVO', 'sistema-nervioso'),
('SEDANTES', 'sistema-nervioso'),
('NEUROLEPTICO(TRANQUILIZANTE MAYOR)', 'sistema-nervioso'),
('ANTICONVULSIONANTE', 'sistema-nervioso'),
('HIPNOTICOS', 'sistema-nervioso'),
('ANTIPARKINSONIANO', 'sistema-nervioso'),
('ESTIMULANTES CEREBRALES', 'sistema-nervioso'),
('CEREBROTONICO', 'sistema-nervioso'),

-- Sistema Respiratorio
('EXPECTORANTE', 'sistema-respiratorio'),
('BRONCODILATADOR', 'sistema-respiratorio'),
('BRONCODILATADOR INHALATORIO', 'sistema-respiratorio'),
('ANTITUSIVO', 'sistema-respiratorio'),
('DESCONGESTIONANTE NASAL', 'sistema-respiratorio'),
('DESCONGESTIONANTE TOPICO', 'sistema-respiratorio'),
('CORTICOTERAPIA INHALATORIA', 'sistema-respiratorio'),
('CORTICOTERAPIA NASAL', 'sistema-respiratorio'),
('ANTIHISTAMINICO', 'sistema-respiratorio'),

-- Dermatología
('ANTIMICOTICO TOPICO', 'dermatologia'),
('CORTICOTERAPIA DERMICA', 'dermatologia'),
('HUMECTANTE DERMICO', 'dermatologia'),
('ANTISEPTICO DERMICO', 'dermatologia'),
('ANTIACNE', 'dermatologia'),
('ANTIPRURIGINOSO', 'dermatologia'),
('REGENERADOR TEJIDO', 'dermatologia'),
('QUERATOLITICO', 'dermatologia'),
('CALLICIDA', 'dermatologia'),
('QUEMADURAS', 'dermatologia'),
('PEDICULICIDA', 'dermatologia'),
('ANTISARNICO', 'dermatologia'),
('CORTICOTER', 'dermatologia'),
('CORTICOTERAPIA SISTEMICA', 'dermatologia'),

-- Oftalmología
('ANTIGLAUCOMATOSO', 'oftalmologia'),
('ANTIBIOTICO OFTALMICO', 'oftalmologia'),
('HUMECTANTE OCULAR', 'oftalmologia'),
('DESCONGESTIONANTE OFTALMICO', 'oftalmologia'),
('LAGRIMAS ARTIFICIALES', 'oftalmologia'),
('DESEGREGACION TAPON DE CERUMEN', 'oftalmologia'),
('ANTIOTALGICO', 'oftalmologia'),

-- Salud Femenina
('ANTICONCEPTIVO ORAL Y VAGINAL', 'salud-femenina'),
('ANTICONCEPTIVO ORAL', 'salud-femenina'),
('ANTICONCEPTIVO NO ORAL', 'salud-femenina'),
('ANTICONCEPTIVO DE EMERGENCIA', 'salud-femenina'),
('ANTICONCEPTIVO TRIFASICO', 'salud-femenina'),
('TERAPIA POSMENOPAUSICA', 'salud-femenina'),
('ANTIINFECCIOSO VAGINAL', 'salud-femenina'),
('PROGESTAGENOTERAPIA', 'salud-femenina'),
('TRICOMONICIDA ORAL', 'salud-femenina'),
('MENORRAGIA', 'salud-femenina'),

-- Diabetes y Metabolismo
('HIPOGLICEMIANTE', 'diabetes-metabolismo'),
('TIROIDEOTERAPIA', 'diabetes-metabolismo'),
('INSULINA', 'diabetes-metabolismo'),
('ANTIGOTOSO', 'diabetes-metabolismo'),
('ANOREXIGENOS', 'diabetes-metabolismo'),

-- Antibióticos e Infecciones
('ANTIBIOTERAPIA', 'antibioticos-infecciones'),
('PENICILINOTERAPIA', 'antibioticos-infecciones'),
('MACROLIDOTERAPIA', 'antibioticos-infecciones'),
('CEFALOSPORINOTERAPIA', 'antibioticos-infecciones'),
('QUINOLONOTERAPIA', 'antibioticos-infecciones'),
('ANTIVIRAL', 'antibioticos-infecciones'),
('ANTIMICOTICO SISTEMICO', 'antibioticos-infecciones'),
('SULFATERAPIA', 'antibioticos-infecciones'),
('ANTISEPTICO URINARIO', 'antibioticos-infecciones'),
('ANTIESPASMÓDICO URINARIO', 'antibioticos-infecciones'),
('HIPERPLASIA PROSTATICA BENIGNA', 'antibioticos-infecciones'),

-- Vitaminas y Suplementos
('SUPLEMENTO ALIMENTICIO', 'vitaminas-suplementos'),
('POLIVITAMINOTERAPIA', 'vitaminas-suplementos'),
('POLIVITAMINA+MINERALES', 'vitaminas-suplementos'),
('VITAMINOTERAPIA C', 'vitaminas-suplementos'),
('VITAMINOTERAPIA D', 'vitaminas-suplementos'),
('VITAMINOTERAPIA B', 'vitaminas-suplementos'),
('VITAMINOTERAPIA E', 'vitaminas-suplementos'),
('ANTIANEMICO', 'vitaminas-suplementos'),
('ANTIOXIDANTE', 'vitaminas-suplementos'),
('MINERALOTERAPIA', 'vitaminas-suplementos'),
('ELECTROLITOTERAPIA', 'vitaminas-suplementos'),
('REHIDRATANTE', 'vitaminas-suplementos'),
('INMUNOMODULADOR', 'vitaminas-suplementos'),

-- Higiene y Cuidado Personal
('DESODORANTES', 'higiene-cuidado-personal'),
('SHAMPOO', 'higiene-cuidado-personal'),
('ANTICASPA', 'higiene-cuidado-personal'),
('JABONES', 'higiene-cuidado-personal'),
('JABON HIPOALERGENICO', 'higiene-cuidado-personal'),
('FILTRO SOLAR', 'higiene-cuidado-personal'),
('PROTECTOR LABIAL', 'higiene-cuidado-personal'),
('HUMECTANTE LABIAL', 'higiene-cuidado-personal'),
('CREMAS MANOS Y CUERPO', 'higiene-cuidado-personal'),
('CREMAS DE TRATAMIENTO', 'higiene-cuidado-personal'),
('CREMAS DE ROSTRO', 'higiene-cuidado-personal'),
('TALCOS', 'higiene-cuidado-personal'),
('ENJUAGUES BUCALES', 'higiene-cuidado-personal'),
('PASTAS DENTALES', 'higiene-cuidado-personal'),
('CEPILLOS DENTALES', 'higiene-cuidado-personal'),
('ANTISEPTICO BUCAL', 'higiene-cuidado-personal'),
('ADHESIVOS PARA PROTESIS', 'higiene-cuidado-personal'),
('LIMPIEZA DENTAL', 'higiene-cuidado-personal'),
('ANESTESICO DENTAL', 'higiene-cuidado-personal'),
('PREVENCION DE CARIES', 'higiene-cuidado-personal'),
('ARTICULOS ASEO', 'higiene-cuidado-personal'),
('ARTICULOS DE BELLEZA', 'higiene-cuidado-personal'),
('ACCESORIOS MAQUILLAJES', 'higiene-cuidado-personal'),
('ESMALTE UÑAS', 'higiene-cuidado-personal'),
('TINTURAS', 'higiene-cuidado-personal'),
('BALSAMOS Y ACONDICIONADORES', 'higiene-cuidado-personal'),
('TRATAMIENTO CAPILAR', 'higiene-cuidado-personal'),
('PREVENCION DE CALVICIE', 'higiene-cuidado-personal'),
('MAQUINAS DE AFEITAR', 'higiene-cuidado-personal'),
('ESPUMAS DE AFEITAR', 'higiene-cuidado-personal'),
('PRESERVATIVO', 'higiene-cuidado-personal'),
('LUBRIC', 'higiene-cuidado-personal'),
('TOALLAS HIGIENICAS', 'higiene-cuidado-personal'),
('REPELENTE DE INSECTOS', 'higiene-cuidado-personal'),
('ANDROGENO TERAPIA', 'higiene-cuidado-personal'),

-- Bebés y Niños
('ACCESORIOS INFANTILES', 'bebes-ninos'),
('PAÑALES DE BEBE', 'bebes-ninos'),
('ALIMENTOS LACTEOS', 'bebes-ninos'),

-- Adulto Mayor
('PAÑALES Y CUIDADO ADULTO MAYOR', 'adulto-mayor'),

-- Insumos Médicos
('ACCESORIOS MEDICOS', 'insumos-medicos'),
('LIMPIEZA DE HERIDAS', 'insumos-medicos'),
('PRUEBA EMBARAZO', 'insumos-medicos'),
('TEST DROGAS', 'insumos-medicos'),
('ALCOHOL-AGUA OXIGENADA', 'insumos-medicos'),
('ANESTESICO-ANTISEPTICO', 'insumos-medicos'),
('ANTIHEMORROIDAL', 'insumos-medicos'),

-- Productos Naturales
('PRODUCTOS NATURALES', 'productos-naturales'),

-- Otros/Sin asignación
('SIN ASIGNACION', 'otros'),
('OTROS', 'otros'),
('EDULCORANTE', 'otros'),
('EST', 'otros'),
('ESTIM', 'otros'),
('TRAT', 'otros'),
('ONCOLOGICO', 'otros');

-- Create index for mapping lookups
CREATE INDEX IF NOT EXISTS idx_therapeutic_mapping_action ON therapeutic_category_mapping(therapeutic_action);
