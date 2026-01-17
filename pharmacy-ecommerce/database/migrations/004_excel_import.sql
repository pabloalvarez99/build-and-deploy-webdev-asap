-- Migration 004: Add columns for Excel import mapping
-- This migration adds external_id and laboratory columns to products table

-- Add external_id column for mapping Excel ID
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_id VARCHAR(50);

-- Add laboratory column for storing LINEA from Excel (manufacturer/brand)
ALTER TABLE products ADD COLUMN IF NOT EXISTS laboratory VARCHAR(255);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_products_external_id ON products(external_id);
CREATE INDEX IF NOT EXISTS idx_products_laboratory ON products(laboratory);

-- Add composite index for filtering by laboratory and category
CREATE INDEX IF NOT EXISTS idx_products_laboratory_category ON products(laboratory, category_id);
