#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Buscar y asignar imagenes a productos sin image_url via DuckDuckGo.
Usa Supabase REST API.
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import time
import random
import json
import urllib.request
import urllib.parse

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

PROGRESS_FILE = 'image_search_progress.json'

def load_progress():
    """Load set of already-processed product IDs from progress file."""
    try:
        with open(PROGRESS_FILE, 'r') as f:
            return set(json.load(f))
    except Exception:
        return set()

def save_progress(done_ids):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(list(done_ids), f)

def search_image(name, lab='', retry_count=0):
    """Search for an image using multiple fallback queries."""
    clean_name = name.split('(')[0].strip()
    queries = [
        f"{clean_name} {lab} farmacia".strip(),
        f"{clean_name} medicamento",
        f"{clean_name} comprimido pastilla",
        clean_name[:40],
    ]
    # Remove duplicates while preserving order
    seen = set()
    unique_queries = []
    for q in queries:
        if q.strip() and q not in seen:
            seen.add(q)
            unique_queries.append(q)

    for query in unique_queries:
        try:
            with DDGS() as ddgs:
                results = list(ddgs.images(query, region="cl-es", safesearch="off", max_results=5))
                for r in results:
                    img = r.get('image', '')
                    if (img.startswith('http') and 'x-raw-image' not in img
                            and len(img) < 500 and not img.endswith('.gif')):
                        return img
        except Exception as e:
            err_str = str(e).lower()
            if 'ratelimit' in err_str or '202' in str(e) or 'too many' in err_str:
                if retry_count < 2:
                    print('\n[RATE LIMIT] Esperando 30s...', flush=True)
                    time.sleep(30)
                    return search_image(name, lab, retry_count + 1)
            time.sleep(2)

    return None

def main():
    print('=' * 55)
    print('  BÚSQUEDA DE IMÁGENES PARA PRODUCTOS (Python)')
    print('=' * 55)
    print()

    # Load already-processed IDs for resume support
    done_ids = load_progress()
    if done_ids:
        print(f'Retomando desde progreso anterior ({len(done_ids)} ya procesados)...')

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

    # Filter out already-processed products
    products = [p for p in products if p['id'] not in done_ids]

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

        clean_name = name.split('(')[0].strip()
        elapsed = (time.time() - start) / 60
        eta = (elapsed / (i + 1)) * (total - i - 1) if i > 0 else 0
        short_name = clean_name[:40].ljust(40)
        print(f'[{i+1}/{total}] ({elapsed:.1f}m, ETA: {eta:.1f}m) {short_name} ', end='', flush=True)

        image_url = search_image(name, lab)

        if image_url:
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

        # Mark as processed and save progress every 10 items
        done_ids.add(pid)
        if (i + 1) % 10 == 0:
            save_progress(done_ids)

        # Random delay 1.5-3.5 seconds
        time.sleep(random.uniform(1.5, 3.5))

        # Progress every 50
        if (i + 1) % 50 == 0:
            pct = (updated / (i + 1)) * 100
            print(f'\n--- Progreso: {updated} OK ({pct:.0f}%), {failed} sin imagen, {errors} errores ---\n')

    save_progress(done_ids)
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
