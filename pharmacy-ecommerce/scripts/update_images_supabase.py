#!/usr/bin/env python3
"""
Buscar y asignar imágenes a productos sin image_url via DuckDuckGo.
Usa Supabase REST API.
"""

import time
import random
import json
import urllib.request
import urllib.parse
import sys

try:
    from duckduckgo_search import DDGS
except ImportError:
    print("Instalando duckduckgo-search...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "duckduckgo-search"])
    from duckduckgo_search import DDGS

SUPABASE_URL = 'https://jvagvjwrjiekaafpjbit.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YWd2andyamlla2FhZnBqYml0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU5MDI5NCwiZXhwIjoyMDg2MTY2Mjk0fQ.wx7EcK6R5AT_ATd3wuXMoKW2NQJKyUimJmGrUrLfsAo'

def supabase_get(table, query=''):
    url = f'{SUPABASE_URL}/rest/v1/{table}?{query}'
    req = urllib.request.Request(url, headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def supabase_patch(table, query, data):
    url = f'{SUPABASE_URL}/rest/v1/{table}?{query}'
    req = urllib.request.Request(url, method='PATCH', headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
    }, data=json.dumps(data).encode())
    with urllib.request.urlopen(req) as resp:
        return resp.status

def search_image(query):
    """Search for an image using DuckDuckGo"""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.images(
                query,
                region="cl-es",
                safesearch="off",
                max_results=3
            ))
            if results:
                for r in results:
                    img = r.get('image', '')
                    if img.startswith('http') and 'x-raw-image' not in img:
                        return img
    except Exception as e:
        pass
    return None

def main():
    print('=' * 55)
    print('  BÚSQUEDA DE IMÁGENES PARA PRODUCTOS (Python)')
    print('=' * 55)
    print()

    # Get products without images
    print('Cargando productos sin imagen...')
    products = []
    offset = 0
    while True:
        batch = supabase_get('products',
            f'select=id,name,laboratory&or=(image_url.is.null,image_url.eq.)&order=name&limit=500&offset={offset}')
        if not batch:
            break
        products.extend(batch)
        offset += 500
        if len(batch) < 500:
            break

    total = len(products)
    print(f'Encontrados {total} productos sin imagen.\n')

    if total == 0:
        print('Todos los productos ya tienen imagen.')
        return

    updated = 0
    failed = 0
    errors = 0
    start = time.time()

    for i, prod in enumerate(products):
        pid = prod['id']
        name = prod['name']
        lab = prod.get('laboratory', '') or ''

        # Build search query
        clean_name = name.split('(')[0].strip()
        search_query = f"{clean_name} {lab} medicamento chile".strip()

        elapsed = (time.time() - start) / 60
        eta = (elapsed / (i + 1)) * (total - i - 1) if i > 0 else 0
        short_name = clean_name[:40].ljust(40)
        print(f'[{i+1}/{total}] ({elapsed:.1f}m, ETA: {eta:.1f}m) {short_name} ', end='', flush=True)

        image_url = search_image(search_query)

        if image_url:
            # Always use https to avoid mixed content on HTTPS sites
            if image_url.startswith('http://'):
                image_url = 'https://' + image_url[7:]
            try:
                supabase_patch('products', f'id=eq.{pid}', {'image_url': image_url})
                updated += 1
                print('OK')
            except Exception as e:
                errors += 1
                print('DB ERROR')
        else:
            failed += 1
            print('-')

        # Random delay 1.5-3.5 seconds
        time.sleep(random.uniform(1.5, 3.5))

        # Progress every 50
        if (i + 1) % 50 == 0:
            pct = (updated / (i + 1)) * 100
            print(f'\n--- Progreso: {updated} OK ({pct:.0f}%), {failed} sin imagen, {errors} errores ---\n')

    total_time = (time.time() - start) / 60

    print()
    print('=' * 55)
    print('  BÚSQUEDA COMPLETADA')
    print('=' * 55)
    print(f'  Tiempo total:        {total_time:.1f} minutos')
    print(f'  Imágenes asignadas:  {updated}')
    print(f'  Sin resultado:       {failed}')
    print(f'  Errores DB:          {errors}')
    print(f'  Cobertura:           {(updated / total) * 100:.1f}%')
    print('=' * 55)

if __name__ == '__main__':
    main()
