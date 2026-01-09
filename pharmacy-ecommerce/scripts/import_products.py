#!/usr/bin/env python3
"""
Script para importar productos desde Excel a PostgreSQL
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import re
import unicodedata

# Database connection
DB_URL = "postgresql://postgres:postgres@localhost:5432/pharmacy"

def slugify(text):
    """Convert text to URL-friendly slug"""
    if not text or pd.isna(text):
        return ""
    # Normalize unicode characters
    text = str(text).lower()
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    # Replace spaces and special chars with hyphens
    text = re.sub(r'[^a-z0-9]+', '-', text)
    # Remove leading/trailing hyphens
    text = text.strip('-')
    return text[:100]  # Limit length

def main():
    # Read Excel
    print("Leyendo Excel...")
    df = pd.read_excel('2026-01-08 REPORTE STOCK.xlsx', header=None)

    # Skip header rows (first 2 rows are headers)
    df = df.iloc[2:]
    df.columns = ['id', 'producto', 'linea', 'stock', 'cpp', 'valorizado']

    # Clean data
    df = df.dropna(subset=['producto'])  # Remove rows without product name
    df['stock'] = pd.to_numeric(df['stock'], errors='coerce').fillna(0).astype(int)
    df['cpp'] = pd.to_numeric(df['cpp'], errors='coerce').fillna(0)

    # Filter products with stock > 0 and valid price
    df = df[(df['stock'] > 0) & (df['cpp'] > 0)]

    print(f"Productos validos: {len(df)}")

    # Connect to database
    print("Conectando a la base de datos...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Get existing categories or create new ones
    print("Procesando categorias...")
    categories = df['linea'].dropna().unique()
    category_map = {}

    for cat_name in categories:
        if not cat_name or pd.isna(cat_name):
            continue

        cat_name = str(cat_name).strip()
        if not cat_name:
            continue

        slug = slugify(cat_name)
        if not slug:
            continue

        # Check if category exists
        cur.execute("SELECT id FROM categories WHERE slug = %s", (slug,))
        result = cur.fetchone()

        if result:
            category_map[cat_name] = result[0]
        else:
            # Create category
            cur.execute(
                "INSERT INTO categories (name, slug, description) VALUES (%s, %s, %s) RETURNING id",
                (cat_name, slug, f"Productos de {cat_name}")
            )
            category_map[cat_name] = cur.fetchone()[0]

    conn.commit()
    print(f"Categorias procesadas: {len(category_map)}")

    # Delete existing products (optional - start fresh)
    print("Limpiando productos anteriores...")
    cur.execute("DELETE FROM order_items")
    cur.execute("DELETE FROM products")
    conn.commit()

    # Insert products
    print("Insertando productos...")
    products_inserted = 0

    for _, row in df.iterrows():
        try:
            name = str(row['producto']).strip()
            if not name:
                continue

            slug = slugify(name)
            if not slug:
                continue

            # Make slug unique by adding counter if needed
            base_slug = slug
            counter = 1
            while True:
                cur.execute("SELECT id FROM products WHERE slug = %s", (slug,))
                if not cur.fetchone():
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1

            stock = int(row['stock']) if not pd.isna(row['stock']) else 0
            price = float(row['cpp']) if not pd.isna(row['cpp']) else 0

            # Get category
            cat_name = str(row['linea']).strip() if not pd.isna(row['linea']) else None
            category_id = category_map.get(cat_name) if cat_name else None

            # Insert product
            cur.execute("""
                INSERT INTO products (name, slug, description, price, stock, category_id, active)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                name,
                slug,
                f"Producto farmaceutico: {name}",
                price,
                stock,
                category_id,
                True
            ))

            products_inserted += 1

            if products_inserted % 100 == 0:
                print(f"  Insertados: {products_inserted}")
                conn.commit()

        except Exception as e:
            print(f"Error en producto {row['producto']}: {e}")
            continue

    conn.commit()

    # Summary
    cur.execute("SELECT COUNT(*) FROM products")
    total_products = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM categories")
    total_categories = cur.fetchone()[0]

    print(f"\n=== Importacion completada ===")
    print(f"Productos importados: {products_inserted}")
    print(f"Total productos en DB: {total_products}")
    print(f"Total categorias: {total_categories}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
