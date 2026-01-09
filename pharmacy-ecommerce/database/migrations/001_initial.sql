-- Pharmacy E-commerce Database Schema
-- Migration: 001_initial.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX idx_categories_slug ON categories(slug);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for products
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    mercadopago_preference_id VARCHAR(255),
    mercadopago_payment_id VARCHAR(255),
    shipping_address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_mercadopago ON orders(mercadopago_payment_id);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10, 2) NOT NULL CHECK (price_at_purchase >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for order items
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
-- Hash generated with argon2: $argon2id$v=19$m=19456,t=2,p=1$...
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@pharmacy.com', '$argon2id$v=19$m=19456,t=2,p=1$YWRtaW5zYWx0MTIzNDU$rJmT1bLKqXWI7GqKM/KkPQ0qZ5QxhR8wJ3Kj7IHNNBU', 'Admin', 'admin');

-- Insert sample categories
INSERT INTO categories (name, slug, description) VALUES
('Medicamentos', 'medicamentos', 'Medicamentos de venta libre y con receta'),
('Vitaminas y Suplementos', 'vitaminas-suplementos', 'Vitaminas, minerales y suplementos alimenticios'),
('Cuidado Personal', 'cuidado-personal', 'Productos de higiene y cuidado personal'),
('Bebés y Niños', 'bebes-ninos', 'Productos para el cuidado de bebés y niños'),
('Dermocosméticos', 'dermocosmeticos', 'Productos dermatológicos y cosméticos');

-- Insert sample products
INSERT INTO products (name, slug, description, price, stock, category_id, image_url) VALUES
('Paracetamol 500mg x 20', 'paracetamol-500mg-20', 'Analgésico y antipirético. Caja con 20 comprimidos.', 5.99, 100, (SELECT id FROM categories WHERE slug = 'medicamentos'), 'https://via.placeholder.com/300x300?text=Paracetamol'),
('Ibuprofeno 400mg x 10', 'ibuprofeno-400mg-10', 'Antiinflamatorio no esteroideo. Caja con 10 comprimidos.', 7.50, 80, (SELECT id FROM categories WHERE slug = 'medicamentos'), 'https://via.placeholder.com/300x300?text=Ibuprofeno'),
('Vitamina C 1000mg x 30', 'vitamina-c-1000mg-30', 'Suplemento de vitamina C. 30 comprimidos efervescentes.', 12.99, 50, (SELECT id FROM categories WHERE slug = 'vitaminas-suplementos'), 'https://via.placeholder.com/300x300?text=VitaminaC'),
('Omega 3 x 60 cápsulas', 'omega-3-60-capsulas', 'Aceite de pescado rico en EPA y DHA. 60 cápsulas blandas.', 18.50, 40, (SELECT id FROM categories WHERE slug = 'vitaminas-suplementos'), 'https://via.placeholder.com/300x300?text=Omega3'),
('Shampoo Anticaspa 400ml', 'shampoo-anticaspa-400ml', 'Shampoo medicado para control de caspa.', 15.99, 60, (SELECT id FROM categories WHERE slug = 'cuidado-personal'), 'https://via.placeholder.com/300x300?text=Shampoo'),
('Crema Hidratante 200ml', 'crema-hidratante-200ml', 'Crema corporal hidratante para piel seca.', 22.00, 45, (SELECT id FROM categories WHERE slug = 'cuidado-personal'), 'https://via.placeholder.com/300x300?text=Crema'),
('Pañales Bebé Talla M x 40', 'panales-bebe-m-40', 'Pañales desechables talla M. Paquete de 40 unidades.', 28.99, 30, (SELECT id FROM categories WHERE slug = 'bebes-ninos'), 'https://via.placeholder.com/300x300?text=Panales'),
('Protector Solar FPS 50', 'protector-solar-fps50', 'Protector solar de amplio espectro. 120ml.', 35.00, 25, (SELECT id FROM categories WHERE slug = 'dermocosmeticos'), 'https://via.placeholder.com/300x300?text=Protector');
