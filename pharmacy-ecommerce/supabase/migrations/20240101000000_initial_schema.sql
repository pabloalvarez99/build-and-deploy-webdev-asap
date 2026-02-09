-- ============================================
-- Supabase Schema for Pharmacy E-commerce
-- Idempotent: safe to run multiple times
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    active BOOLEAN DEFAULT true,
    external_id VARCHAR(50),
    laboratory VARCHAR(255),
    therapeutic_action VARCHAR(255),
    active_ingredient VARCHAR(500),
    prescription_type VARCHAR(50) DEFAULT 'direct',
    presentation VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_external_id ON products(external_id);
CREATE INDEX IF NOT EXISTS idx_products_laboratory ON products(laboratory);
CREATE INDEX IF NOT EXISTS idx_products_laboratory_category ON products(laboratory, category_id);
CREATE INDEX IF NOT EXISTS idx_products_therapeutic_action ON products(therapeutic_action);
CREATE INDEX IF NOT EXISTS idx_products_prescription_type ON products(prescription_type);
CREATE INDEX IF NOT EXISTS idx_products_active_ingredient ON products(active_ingredient);

-- 4. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reserved', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    mercadopago_preference_id VARCHAR(255),
    mercadopago_payment_id VARCHAR(255),
    shipping_address TEXT,
    notes TEXT,
    guest_email VARCHAR(255),
    guest_session_id VARCHAR(255),
    payment_provider VARCHAR(50) DEFAULT 'mercadopago',
    stripe_checkout_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    reservation_expires_at TIMESTAMP WITH TIME ZONE,
    pickup_code VARCHAR(10),
    customer_phone VARCHAR(20),
    guest_name VARCHAR(255),
    guest_surname VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_mercadopago ON orders(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_guest_session ON orders(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider ON orders(payment_provider);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON orders(pickup_code);

-- 5. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10, 2) NOT NULL CHECK (price_at_purchase >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 6. THERAPEUTIC CATEGORY MAPPING
CREATE TABLE IF NOT EXISTS therapeutic_category_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapeutic_action VARCHAR(255) NOT NULL,
    category_slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_therapeutic_mapping_action ON therapeutic_category_mapping(therapeutic_action);

-- 7. TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. AUTO-CREATE PROFILE ON USER SIGNUP
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'name', 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 9. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
    UPDATE products SET stock = stock - p_quantity
    WHERE id = p_product_id AND stock >= p_quantity;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION get_distinct_laboratories()
RETURNS TABLE(laboratory TEXT) AS $$
    SELECT DISTINCT p.laboratory FROM products p
    WHERE p.laboratory IS NOT NULL AND p.active = true
    ORDER BY p.laboratory;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_distinct_therapeutic_actions()
RETURNS TABLE(therapeutic_action TEXT) AS $$
    SELECT DISTINCT p.therapeutic_action FROM products p
    WHERE p.therapeutic_action IS NOT NULL AND p.active = true
    ORDER BY p.therapeutic_action;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_distinct_active_ingredients()
RETURNS TABLE(active_ingredient TEXT) AS $$
    SELECT DISTINCT p.active_ingredient FROM products p
    WHERE p.active_ingredient IS NOT NULL AND p.active = true
    ORDER BY p.active_ingredient;
$$ LANGUAGE sql STABLE;

-- 10. HELPER FUNCTION
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 11. ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapeutic_category_mapping ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DO $$ BEGIN
  -- profiles
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  -- categories
  DROP POLICY IF EXISTS "Anyone can read active categories" ON categories;
  DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
  DROP POLICY IF EXISTS "Admins can update categories" ON categories;
  DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
  -- products
  DROP POLICY IF EXISTS "Anyone can read products" ON products;
  DROP POLICY IF EXISTS "Admins can insert products" ON products;
  DROP POLICY IF EXISTS "Admins can update products" ON products;
  DROP POLICY IF EXISTS "Admins can delete products" ON products;
  -- orders
  DROP POLICY IF EXISTS "Users can read own orders" ON orders;
  DROP POLICY IF EXISTS "Admins can read all orders" ON orders;
  DROP POLICY IF EXISTS "Service role can insert orders" ON orders;
  DROP POLICY IF EXISTS "Service role can update orders" ON orders;
  -- order_items
  DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
  DROP POLICY IF EXISTS "Admins can read all order items" ON order_items;
  DROP POLICY IF EXISTS "Service role can insert order items" ON order_items;
  -- therapeutic
  DROP POLICY IF EXISTS "Anyone can read therapeutic mappings" ON therapeutic_category_mapping;
  DROP POLICY IF EXISTS "Admins can manage therapeutic mappings" ON therapeutic_category_mapping;
END $$;

-- Create policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can read active categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update categories" ON categories FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete categories" ON categories FOR DELETE USING (is_admin());

CREATE POLICY "Anyone can read products" ON products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON products FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update products" ON products FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete products" ON products FOR DELETE USING (is_admin());

CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all orders" ON orders FOR SELECT USING (is_admin());
CREATE POLICY "Service role can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update orders" ON orders FOR UPDATE USING (true);

CREATE POLICY "Users can read own order items" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can read all order items" ON order_items FOR SELECT USING (is_admin());
CREATE POLICY "Service role can insert order items" ON order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read therapeutic mappings" ON therapeutic_category_mapping FOR SELECT USING (true);
CREATE POLICY "Admins can manage therapeutic mappings" ON therapeutic_category_mapping FOR ALL USING (is_admin());

-- 12. SEED DATA (only if tables are empty)
INSERT INTO categories (name, slug, description, active)
SELECT * FROM (VALUES
('Dolor y Fiebre', 'dolor-fiebre', 'Analgesicos, antipireticos, antiinflamatorios y antigripales', true),
('Sistema Digestivo', 'sistema-digestivo', 'Antiacidos, laxantes, antiespasmódicos y reguladores gastrointestinales', true),
('Sistema Cardiovascular', 'sistema-cardiovascular', 'Hipotensores, hipocolesterolemicos, anticoagulantes y medicamentos cardíacos', true),
('Sistema Nervioso', 'sistema-nervioso', 'Antidepresivos, ansiolíticos, anticonvulsionantes y sedantes', true),
('Sistema Respiratorio', 'sistema-respiratorio', 'Expectorantes, broncodilatadores, antitusivos y descongestionantes', true),
('Dermatología', 'dermatologia', 'Antimicóticos, antiinflamatorios tópicos, corticoides dermicos y humectantes', true),
('Oftalmología', 'oftalmologia', 'Antiglaucomatosos, antibióticos oftálmicos y humectantes oculares', true),
('Salud Femenina', 'salud-femenina', 'Anticonceptivos, terapia hormonal y productos ginecológicos', true),
('Diabetes y Metabolismo', 'diabetes-metabolismo', 'Hipoglicemiantes, tiroideoterapia y reguladores metabólicos', true),
('Antibióticos e Infecciones', 'antibioticos-infecciones', 'Antibióticos sistemicos, antivirales y antimicóticos orales', true),
('Vitaminas y Suplementos', 'vitaminas-suplementos', 'Vitaminas, minerales, suplementos alimenticios y productos naturales', true),
('Higiene y Cuidado Personal', 'higiene-cuidado-personal', 'Higiene bucal, corporal, capilar, protección solar y cosmetica', true),
('Bebes y Ninos', 'bebes-ninos', 'Panales, accesorios infantiles y productos pediatricos', true),
('Adulto Mayor', 'adulto-mayor', 'Panales adulto, accesorios de movilidad y cuidado geriatrico', true),
('Insumos Medicos', 'insumos-medicos', 'Accesorios medicos, material de curación, tests y dispositivos', true),
('Productos Naturales', 'productos-naturales', 'Homeopatía, fitoterapia y medicina natural', true),
('Otros', 'otros', 'Productos varios y sin clasificación específica', true)
) AS v(name, slug, description, active)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Sample products (only if no products exist)
INSERT INTO products (name, slug, description, price, stock, category_id, image_url)
SELECT name, slug, description, price, stock, category_id, image_url FROM (
  SELECT 'Paracetamol 500mg x 20' as name, 'paracetamol-500mg-20' as slug, 'Analgesico y antipiretico. Caja con 20 comprimidos.' as description, 5.99 as price, 100 as stock, (SELECT id FROM categories WHERE slug = 'dolor-fiebre') as category_id, 'https://via.placeholder.com/300x300?text=Paracetamol' as image_url
  UNION ALL SELECT 'Ibuprofeno 400mg x 10', 'ibuprofeno-400mg-10', 'Antiinflamatorio no esteroideo. Caja con 10 comprimidos.', 7.50, 80, (SELECT id FROM categories WHERE slug = 'dolor-fiebre'), 'https://via.placeholder.com/300x300?text=Ibuprofeno'
  UNION ALL SELECT 'Vitamina C 1000mg x 30', 'vitamina-c-1000mg-30', 'Suplemento de vitamina C. 30 comprimidos efervescentes.', 12.99, 50, (SELECT id FROM categories WHERE slug = 'vitaminas-suplementos'), 'https://via.placeholder.com/300x300?text=VitaminaC'
  UNION ALL SELECT 'Omega 3 x 60 capsulas', 'omega-3-60-capsulas', 'Aceite de pescado rico en EPA y DHA. 60 capsulas blandas.', 18.50, 40, (SELECT id FROM categories WHERE slug = 'vitaminas-suplementos'), 'https://via.placeholder.com/300x300?text=Omega3'
  UNION ALL SELECT 'Shampoo Anticaspa 400ml', 'shampoo-anticaspa-400ml', 'Shampoo medicado para control de caspa.', 15.99, 60, (SELECT id FROM categories WHERE slug = 'higiene-cuidado-personal'), 'https://via.placeholder.com/300x300?text=Shampoo'
  UNION ALL SELECT 'Crema Hidratante 200ml', 'crema-hidratante-200ml', 'Crema corporal hidratante para piel seca.', 22.00, 45, (SELECT id FROM categories WHERE slug = 'higiene-cuidado-personal'), 'https://via.placeholder.com/300x300?text=Crema'
  UNION ALL SELECT 'Panales Bebe Talla M x 40', 'panales-bebe-m-40', 'Panales desechables talla M. Paquete de 40 unidades.', 28.99, 30, (SELECT id FROM categories WHERE slug = 'bebes-ninos'), 'https://via.placeholder.com/300x300?text=Panales'
  UNION ALL SELECT 'Protector Solar FPS 50', 'protector-solar-fps50', 'Protector solar de amplio espectro. 120ml.', 35.00, 25, (SELECT id FROM categories WHERE slug = 'dermatologia'), 'https://via.placeholder.com/300x300?text=Protector'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- Therapeutic mappings (only if empty)
INSERT INTO therapeutic_category_mapping (therapeutic_action, category_slug)
SELECT * FROM (VALUES
('ANALGESICO-ANTIPIRETICO', 'dolor-fiebre'),('ANALGESICO-ANTIINFLAMATORIO', 'dolor-fiebre'),('ANALGESICO', 'dolor-fiebre'),('ANALGESICO MAYOR', 'dolor-fiebre'),('ANALGESICO-RELAJANTE', 'dolor-fiebre'),('ANTIGRIPAL', 'dolor-fiebre'),('ANTIHISTAMINICO-DESCONGESTIONA', 'dolor-fiebre'),('ANTIINFLAMATORIO TOPICO', 'dolor-fiebre'),('ANTIJAQUECOSO', 'dolor-fiebre'),('RELAJANTE MUSCULAR', 'dolor-fiebre'),('ANTI-INFLAMATORIO NO ESTEROIDAL', 'dolor-fiebre'),
('ANTIACIDOS', 'sistema-digestivo'),('ANTIACIDO-ANTIFLATULENTO', 'sistema-digestivo'),('ANTIULCEROSO', 'sistema-digestivo'),('LAXANTE', 'sistema-digestivo'),('ANTIESPASMODICO', 'sistema-digestivo'),('REGULADOR GASTROINTESTINAL', 'sistema-digestivo'),('REGULADOR FLORA INTESTINAL', 'sistema-digestivo'),('ANTIEMETICO', 'sistema-digestivo'),('ANTIDIARREICO', 'sistema-digestivo'),('ANTIFLATULENTOS', 'sistema-digestivo'),('ANTISEPTICO INTESTINAL', 'sistema-digestivo'),('TRATAMIENTO COLON IRRITABLE', 'sistema-digestivo'),('ANTIHELMINTICO', 'sistema-digestivo'),('ENEMA', 'sistema-digestivo'),('PROBIOTICOS', 'sistema-digestivo'),
('HIPOTENSORES', 'sistema-cardiovascular'),('HIPOCOLESTEROLEMICO', 'sistema-cardiovascular'),('ANTICOAGULANTE', 'sistema-cardiovascular'),('ANTIAGREGANTE PLAQUETARIO', 'sistema-cardiovascular'),('ANTIANGINOSO', 'sistema-cardiovascular'),('ANTIARRITMICO', 'sistema-cardiovascular'),('CARDIOTONICO', 'sistema-cardiovascular'),('VASODILATADOR', 'sistema-cardiovascular'),('VASODIL', 'sistema-cardiovascular'),('DIURETICO', 'sistema-cardiovascular'),('ANTIVARICOSO', 'sistema-cardiovascular'),
('ANTIDEPRESIVO', 'sistema-nervioso'),('SEDANTES', 'sistema-nervioso'),('NEUROLEPTICO(TRANQUILIZANTE MAYOR)', 'sistema-nervioso'),('ANTICONVULSIONANTE', 'sistema-nervioso'),('HIPNOTICOS', 'sistema-nervioso'),('ANTIPARKINSONIANO', 'sistema-nervioso'),('ESTIMULANTES CEREBRALES', 'sistema-nervioso'),('CEREBROTONICO', 'sistema-nervioso'),
('EXPECTORANTE', 'sistema-respiratorio'),('BRONCODILATADOR', 'sistema-respiratorio'),('BRONCODILATADOR INHALATORIO', 'sistema-respiratorio'),('ANTITUSIVO', 'sistema-respiratorio'),('DESCONGESTIONANTE NASAL', 'sistema-respiratorio'),('DESCONGESTIONANTE TOPICO', 'sistema-respiratorio'),('CORTICOTERAPIA INHALATORIA', 'sistema-respiratorio'),('CORTICOTERAPIA NASAL', 'sistema-respiratorio'),('ANTIHISTAMINICO', 'sistema-respiratorio'),
('ANTIMICOTICO TOPICO', 'dermatologia'),('CORTICOTERAPIA DERMICA', 'dermatologia'),('HUMECTANTE DERMICO', 'dermatologia'),('ANTISEPTICO DERMICO', 'dermatologia'),('ANTIACNE', 'dermatologia'),('ANTIPRURIGINOSO', 'dermatologia'),('REGENERADOR TEJIDO', 'dermatologia'),('QUERATOLITICO', 'dermatologia'),('CALLICIDA', 'dermatologia'),('QUEMADURAS', 'dermatologia'),('PEDICULICIDA', 'dermatologia'),('ANTISARNICO', 'dermatologia'),('CORTICOTER', 'dermatologia'),('CORTICOTERAPIA SISTEMICA', 'dermatologia'),
('ANTIGLAUCOMATOSO', 'oftalmologia'),('ANTIBIOTICO OFTALMICO', 'oftalmologia'),('HUMECTANTE OCULAR', 'oftalmologia'),('DESCONGESTIONANTE OFTALMICO', 'oftalmologia'),('LAGRIMAS ARTIFICIALES', 'oftalmologia'),
('ANTICONCEPTIVO ORAL Y VAGINAL', 'salud-femenina'),('ANTICONCEPTIVO ORAL', 'salud-femenina'),('ANTICONCEPTIVO NO ORAL', 'salud-femenina'),('ANTICONCEPTIVO DE EMERGENCIA', 'salud-femenina'),('TERAPIA POSMENOPAUSICA', 'salud-femenina'),('ANTIINFECCIOSO VAGINAL', 'salud-femenina'),
('HIPOGLICEMIANTE', 'diabetes-metabolismo'),('TIROIDEOTERAPIA', 'diabetes-metabolismo'),('INSULINA', 'diabetes-metabolismo'),('ANTIGOTOSO', 'diabetes-metabolismo'),
('ANTIBIOTERAPIA', 'antibioticos-infecciones'),('PENICILINOTERAPIA', 'antibioticos-infecciones'),('MACROLIDOTERAPIA', 'antibioticos-infecciones'),('CEFALOSPORINOTERAPIA', 'antibioticos-infecciones'),('QUINOLONOTERAPIA', 'antibioticos-infecciones'),('ANTIVIRAL', 'antibioticos-infecciones'),('ANTIMICOTICO SISTEMICO', 'antibioticos-infecciones'),
('SUPLEMENTO ALIMENTICIO', 'vitaminas-suplementos'),('POLIVITAMINOTERAPIA', 'vitaminas-suplementos'),('POLIVITAMINA+MINERALES', 'vitaminas-suplementos'),('VITAMINOTERAPIA C', 'vitaminas-suplementos'),('VITAMINOTERAPIA D', 'vitaminas-suplementos'),('VITAMINOTERAPIA B', 'vitaminas-suplementos'),('ANTIANEMICO', 'vitaminas-suplementos'),('ANTIOXIDANTE', 'vitaminas-suplementos'),('MINERALOTERAPIA', 'vitaminas-suplementos'),('REHIDRATANTE', 'vitaminas-suplementos'),('INMUNOMODULADOR', 'vitaminas-suplementos'),
('FILTRO SOLAR', 'higiene-cuidado-personal'),('SHAMPOO', 'higiene-cuidado-personal'),('ANTICASPA', 'higiene-cuidado-personal'),('JABONES', 'higiene-cuidado-personal'),('PASTAS DENTALES', 'higiene-cuidado-personal'),('ENJUAGUES BUCALES', 'higiene-cuidado-personal'),('PRESERVATIVO', 'higiene-cuidado-personal'),('REPELENTE DE INSECTOS', 'higiene-cuidado-personal'),
('ACCESORIOS INFANTILES', 'bebes-ninos'),('PAÑALES DE BEBE', 'bebes-ninos'),('ALIMENTOS LACTEOS', 'bebes-ninos'),
('PAÑALES Y CUIDADO ADULTO MAYOR', 'adulto-mayor'),
('ACCESORIOS MEDICOS', 'insumos-medicos'),('LIMPIEZA DE HERIDAS', 'insumos-medicos'),('PRUEBA EMBARAZO', 'insumos-medicos'),('ALCOHOL-AGUA OXIGENADA', 'insumos-medicos'),
('PRODUCTOS NATURALES', 'productos-naturales'),
('SIN ASIGNACION', 'otros'),('OTROS', 'otros'),('EDULCORANTE', 'otros')
) AS v(therapeutic_action, category_slug)
WHERE NOT EXISTS (SELECT 1 FROM therapeutic_category_mapping LIMIT 1);
