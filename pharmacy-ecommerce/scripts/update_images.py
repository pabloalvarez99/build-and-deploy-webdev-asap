import os
import time
import psycopg2
import random
from urllib.parse import quote_plus

# Try to import duckduckgo_search, if not available, instruct user
try:
    from duckduckgo_search import DDGS
except ImportError:
    print("Error: La librería 'duckduckgo_search' no está instalada.")
    print("Por favor ejecuta: pip install duckduckgo-search")
    exit(1)

# Database connection
DB_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway'
)

def search_image(query):
    """Search for an image using DuckDuckGo"""
    try:
        with DDGS() as ddgs:
            # Search for images (Chile region, safe search off to get medical products)
            results = list(ddgs.images(
                query,
                region="cl-es",
                safesearch="off",
                max_results=1
            ))
            
            if results and len(results) > 0:
                return results[0]['image']
            
    except Exception as e:
        print(f"Error buscando '{query}': {e}")
    return None

def main():
    print("Conectando a la base de datos...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Get products without images
    cur.execute("""
        SELECT id, name, laboratory 
        FROM products 
        WHERE image_url IS NULL OR image_url = ''
        ORDER BY id
    """)
    products = cur.fetchall()
    
    total = len(products)
    print(f"Encontrados {total} productos sin imagen.")

    updated_count = 0
    
    for i, (prod_id, name, lab) in enumerate(products):
        # Construct search query
        # Clean name slightly
        clean_name = name.split('(')[0].strip() # Remove generic info in parenthesis if any
        
        # Search query: "Name Laboratory Chile"
        search_query = f"{clean_name} {lab or ''} producto chile"
        search_query = " ".join(search_query.split()) # Remove extra spaces
        
        print(f"[{i+1}/{total}] Buscando: {search_query} ...", end="", flush=True)
        
        image_url = search_image(search_query)
        
        if image_url:
            print(f" OK")
            # Update DB
            try:
                cur.execute(
                    "UPDATE products SET image_url = %s WHERE id = %s",
                    (image_url, prod_id)
                )
                conn.commit()
                updated_count += 1
            except Exception as e:
                print(f" Error DB: {e}")
        else:
            print(f" No encontrada")
            
        # Random delay to be polite and avoid blocks (1.5 to 3.5 seconds)
        time.sleep(random.uniform(1.5, 3.5))

    print(f"\nProceso finalizado. {updated_count} imagenes actualizadas.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
