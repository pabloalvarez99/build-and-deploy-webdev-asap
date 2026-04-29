#!/usr/bin/env bash
# SessionStart hook: detect recent file activity, suggest relevant vault refs.
# Output → stdout as additionalContext for Claude (token-cheap pointer, not full reference).

set -euo pipefail
cd "$(dirname "$0")/../.." 2>/dev/null || exit 0

VAULT="C:/Users/Administrator/Documents/obsidian-mind"

# Files modified in working tree + last 5 commits (uncached, tiny git op)
files=$(
  { git diff --name-only HEAD 2>/dev/null
    git diff --name-only --cached 2>/dev/null
    git log -5 --name-only --pretty=format: 2>/dev/null
  } | sort -u
)

[ -z "$files" ] && exit 0

hints=""
add() { hints="$hints\n- $1"; }

echo "$files" | grep -q '^pharmacy-ecommerce/apps/web/src/app/api/'   && add "Tocando \`/api/*\` → leer \`$VAULT/reference/tu-farmacia-api-routes.md\`"
echo "$files" | grep -qE 'prisma/|schema\.prisma|/lib/db\.ts'         && add "Tocando DB/schema → leer \`$VAULT/reference/tu-farmacia-db.md\`"
echo "$files" | grep -q '^pharmacy-ecommerce/apps/web/src/app/.*page' && add "Tocando páginas → leer \`$VAULT/reference/tu-farmacia-pages.md\`"
echo "$files" | grep -qE '\.env|vercel\.json|next\.config|package\.json' && add "Tocando env/build → leer \`$VAULT/reference/tu-farmacia-env-deploy.md\`"
echo "$files" | grep -qE '\.css$|tailwind\.config|/components/'       && add "Tocando UI → leer \`$VAULT/reference/tu-farmacia-ui.md\`"
echo "$files" | grep -qE 'middleware\.ts|firebase|api-helpers'        && add "Tocando auth → revisar \`$VAULT/brain/Gotchas.md\` (sección Cloud SQL/firebase-admin)"

[ -z "$hints" ] && exit 0

printf "Vault hints (archivos cambiados recientemente):%b\n" "$hints"
