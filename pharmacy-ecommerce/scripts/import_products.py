#!/usr/bin/env python3
"""
Script para importar productos desde Excel a PostgreSQL
Actualizado para incluir external_id, laboratory, y productos con stock=0
"""

import pandas as pd
import psycopg2
import re
import unicodedata
import os

# Database connection - use environment variable or default to Railway
DB_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway'
)

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

def clean_text(text):
    """Clean text by removing special characters like degree symbol"""
    if not text or pd.isna(text):
        return ""
    text = str(text).strip()
    # Replace degree symbol and other problematic chars
    text = text.replace('°', '').replace('º', '')
    # Normalize unicode
    text = unicodedata.normalize('NFKC', text)
    return text

def main():
    # Determine script directory to find Excel file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    excel_path = os.path.join(parent_dir, '2026-01-08 REPORTE STOCK.xlsx')

    # Read Excel
    print(f"Leyendo Excel desde: {excel_path}")
    df = pd.read_excel(excel_path, header=None)

    # Skip header rows (first 2 rows are headers)
    df = df.iloc[2:]
    df.columns = ['id', 'producto', 'linea', 'stock', 'cpp', 'valorizado']

    # Clean data
    df = df.dropna(subset=['producto'])  # Remove rows without product name
    df['stock'] = pd.to_numeric(df['stock'], errors='coerce').fillna(0).astype(int)
    df['cpp'] = pd.to_numeric(df['cpp'], errors='coerce').fillna(0)

    # Clean text fields
    df['producto'] = df['producto'].apply(clean_text)
    df['linea'] = df['linea'].apply(clean_text)
    df['id'] = df['id'].apply(lambda x: str(x).strip() if not pd.isna(x) else '')

    # Filter only products with invalid price (price = 0 or negative)
    # Include products with stock = 0 (they will show as "Agotado")
    df = df[df['cpp'] > 0]

    print(f"Productos validos para importar: {len(df)}")
    print(f"  - Con stock > 0: {len(df[df['stock'] > 0])}")
    print(f"  - Con stock = 0 (Agotados): {len(df[df['stock'] == 0])}")

    # Connect to database
    print(f"\nConectando a la base de datos...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Get existing categories or create new ones
    print("Procesando categorias (laboratorios)...")
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
                "INSERT INTO categories (name, slug, description, active) VALUES (%s, %s, %s, %s) RETURNING id",
                (cat_name, slug, f"Productos de {cat_name}", True)
            )
            category_map[cat_name] = cur.fetchone()[0]

    conn.commit()
    print(f"Categorias procesadas: {len(category_map)}")

    # Delete existing products (user requested full replacement)
    print("\nLimpiando productos anteriores...")
    cur.execute("DELETE FROM order_items")
    cur.execute("DELETE FROM products")
    conn.commit()
    print("Productos eliminados.")

    # Insert products
    print("\nInsertando productos...")
    products_inserted = 0
    products_with_stock = 0
    products_out_of_stock = 0

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
            external_id = str(row['id']).strip() if not pd.isna(row['id']) else None
            laboratory = str(row['linea']).strip() if not pd.isna(row['linea']) else None

            # Get category
            cat_name = str(row['linea']).strip() if not pd.isna(row['linea']) else None
            category_id = category_map.get(cat_name) if cat_name else None

            # Insert product with new fields
            cur.execute("""
                INSERT INTO products (name, slug, description, price, stock, category_id, external_id, laboratory, active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                name,
                slug,
                f"Producto farmaceutico: {name}",
                price,
                stock,
                category_id,
                external_id,
                laboratory,
                True
            ))

            products_inserted += 1
            if stock > 0:
                products_with_stock += 1
            else:
                products_out_of_stock += 1

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

    cur.execute("SELECT COUNT(*) FROM products WHERE stock > 0")
    available_products = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM products WHERE stock = 0")
    out_of_stock_products = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM categories")
    total_categories = cur.fetchone()[0]

    cur.execute("SELECT SUM(stock * price) FROM products")
    inventory_value = cur.fetchone()[0] or 0

    print(f"\n{'='*50}")
    print(f"=== IMPORTACION COMPLETADA ===")
    print(f"{'='*50}")
    print(f"Productos importados: {products_inserted}")
    print(f"  - Con stock disponible: {products_with_stock}")
    print(f"  - Agotados (stock = 0): {products_out_of_stock}")
    print(f"Total productos en DB: {total_products}")
    print(f"Total categorias: {total_categories}")
    print(f"Valor total inventario: ${inventory_value:,.0f} CLP")
    print(f"{'='*50}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
