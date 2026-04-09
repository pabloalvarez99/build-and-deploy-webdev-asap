#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Detecta y arregla imágenes rotas en productos.
1. Obtiene todos los productos con image_url (no null/vacío)
2. Hace HEAD request a cada URL (timeout 6s)
3. Si la URL está caída (4xx, 5xx, timeout, error de conexión):
   - Busca imagen de reemplazo en DuckDuckGo
   - Actualiza Supabase con la nueva URL
   - Si no encuentra reemplazo, pone image_url = null para que otro script lo intente
4. Guarda progreso en broken_check_progress.json
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import time
import random
import json
import urllib.request
import urllib.parse
import urllib.error

try:
    from duckduckgo_search import DDGS
except ImportError:
    print("Instalando duckduckgo-search...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "duckduckgo-search"])
    from duckduckgo_search import DDGS

SUPABASE_URL = 'https://jvagvjwrjiekaafpjbit.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YWd2andyamlla2FhZnBqYml0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU5MDI5NCwiZXhwIjoyMDg2MTY2Mjk0fQ.wx7EcK6R5AT_ATd3wuXMoKW2NQJKyUimJmGrUrLfsAo'

PROGRESS_FILE = 'broken_check_progress.json'
BROKEN_LOG_FILE = 'broken_images_log.json'

# ─── Supabase helpers ────────────────────────────────────────────────────────

def supabase_get(table, query=''):
    url = f'{SUPABASE_URL}/rest/v1/{table}?{query}'
    req = urllib.request.Request(url, headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

def supabase_patch(table, query, data):
    url = f'{SUPABASE_URL}/rest/v1/{table}?{query}'
    req = urllib.request.Request(url, method='PATCH', headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
    }, data=json.dumps(data).encode())
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.status

# ─── Progress helpers ─────────────────────────────────────────────────────────

def load_progress():
    try:
        with open(PROGRESS_FILE, 'r') as f:
            return set(json.load(f))
    except Exception:
        return set()

def save_progress(done_ids):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(list(done_ids), f)

def load_broken_log():
    try:
        with open(BROKEN_LOG_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return []

def save_broken_log(entries):
    with open(BROKEN_LOG_FILE, 'w') as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)

# ─── URL check ───────────────────────────────────────────────────────────────

def is_url_alive(url, timeout=6):
    """Returns (alive: bool, status_code: int|None)"""
    try:
        # Ensure https
        if url.startswith('http://'):
            url = 'https://' + url[7:]
        req = urllib.request.Request(
            url,
            method='HEAD',
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*,*/*',
            }
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.status
            return status < 400, status
    except urllib.error.HTTPError as e:
        return False, e.code
    except Exception:
        # Connection error, timeout, SSL, etc.
        return False, None

# ─── Image search ─────────────────────────────────────────────────────────────

def search_image(name, lab='', retry_count=0):
    clean_name = name.split('(')[0].strip()
    queries = [
        f"{clean_name} {lab} farmacia".strip(),
        f"{clean_name} medicamento",
        f"{clean_name} comprimido pastilla",
        clean_name[:40],
    ]
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

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print('=' * 60)
    print('  DETECCIÓN Y ARREGLO DE IMÁGENES ROTAS')
    print('=' * 60)
    print()

    done_ids = load_progress()
    broken_log = load_broken_log()
    if done_ids:
        print(f'Retomando — {len(done_ids)} productos ya chequeados')

    # Fetch all products WITH an image_url (not null, not empty)
    print('Cargando productos con image_url...')
    products = []
    offset = 0
    while True:
        # Supabase filter: image_url not null AND not empty string
        batch = supabase_get(
            'products',
            f'select=id,name,laboratory,image_url'
            f'&image_url=not.is.null'
            f'&image_url=neq.'
            f'&order=name&limit=500&offset={offset}'
        )
        if not batch:
            break
        products.extend(batch)
        offset += 500
        if len(batch) < 500:
            break

    # Filter already checked
    products = [p for p in products if p['id'] not in done_ids]
    total = len(products)
    print(f'Total con imagen: {len(products) + len(done_ids)} | Por chequear: {total}\n')

    if total == 0:
        print('Todos los productos ya fueron chequeados.')
        return

    broken_count = 0
    fixed_count = 0
    nulled_count = 0
    ok_count = 0
    start = time.time()

    for i, prod in enumerate(products):
        pid = prod['id']
        name = prod['name']
        lab = prod.get('laboratory', '') or ''
        image_url = prod.get('image_url', '') or ''

        clean_name = name.split('(')[0].strip()[:38].ljust(38)
        elapsed = (time.time() - start) / 60
        eta = (elapsed / (i + 1)) * (total - i - 1) if i > 0 else 0
        print(f'[{i+1}/{total}] ({elapsed:.1f}m ETA:{eta:.1f}m) {clean_name} ', end='', flush=True)

        alive, status = is_url_alive(image_url)

        if alive:
            ok_count += 1
            print(f'OK ({status})')
        else:
            broken_count += 1
            status_str = str(status) if status else 'ERR'
            print(f'ROTO ({status_str}) → buscando...', end=' ', flush=True)

            # Log the broken URL
            broken_log.append({
                'id': pid,
                'name': name,
                'broken_url': image_url,
                'status': status,
            })

            # Search for replacement
            new_url = search_image(name, lab)
            if new_url:
                if new_url.startswith('http://'):
                    new_url = 'https://' + new_url[7:]
                try:
                    supabase_patch('products', f'id=eq.{pid}', {'image_url': new_url})
                    fixed_count += 1
                    print('ARREGLADO ✓')
                    broken_log[-1]['new_url'] = new_url
                    broken_log[-1]['action'] = 'fixed'
                except Exception:
                    print('DB ERROR')
                    broken_log[-1]['action'] = 'db_error'
            else:
                # No replacement found — null out so update_images_supabase.py can retry
                try:
                    supabase_patch('products', f'id=eq.{pid}', {'image_url': None})
                    nulled_count += 1
                    print('SIN REEMPLAZO → null')
                    broken_log[-1]['action'] = 'nulled'
                except Exception:
                    print('DB ERROR')
                    broken_log[-1]['action'] = 'db_error'

            time.sleep(random.uniform(1.5, 3.0))

        # Save progress every 10 items
        done_ids.add(pid)
        if (i + 1) % 10 == 0:
            save_progress(done_ids)
            save_broken_log(broken_log)

        # Summary every 100
        if (i + 1) % 100 == 0:
            print(f'\n--- OK: {ok_count} | Rotas: {broken_count} (arregladas: {fixed_count}, nulled: {nulled_count}) ---\n')

    save_progress(done_ids)
    save_broken_log(broken_log)
    total_time = (time.time() - start) / 60

    print()
    print('=' * 60)
    print('  RESULTADO FINAL')
    print('=' * 60)
    print(f'  Tiempo:              {total_time:.1f} minutos')
    print(f'  URLs válidas:        {ok_count}')
    print(f'  URLs rotas:          {broken_count}')
    print(f'  Arregladas:          {fixed_count}')
    print(f'  Sin reemplazo (null): {nulled_count}')
    print(f'  Log guardado en:     {BROKEN_LOG_FILE}')
    print('=' * 60)
    print()
    if nulled_count > 0:
        print(f'  → Ejecuta update_images_supabase.py para los {nulled_count} productos sin reemplazo')

if __name__ == '__main__':
    main()
