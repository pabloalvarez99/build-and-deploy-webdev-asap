/**
 * One-time migration: Supabase Auth → Firebase Auth
 * Run from pharmacy-ecommerce/: node scripts/run-migration.mjs
 */

import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { join } from 'path'

// Use apps/web node_modules (has firebase-admin)
const webDir = new URL('../apps/web/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const require = createRequire(join(webDir, 'package.json'))

// Load .env.local
const envRaw = readFileSync(join(webDir, '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const i = l.indexOf('=')
      const key = l.slice(0, i).trim()
      let val = l.slice(i + 1).trim()
      // Strip surrounding quotes (single or double)
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      return [key, val]
    })
)

// Init Firebase Admin
const admin = require('firebase-admin')
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}
const auth = admin.auth()

// Users from Supabase CSV export
const users = [
  { uid: 'd2c551a9-c336-422d-a7c1-36d3730f15d5', email: 'adanardiles5@gmail.com', displayName: 'Adan Ardiles' },
  { uid: '1f932f9d-21c5-42eb-a17b-24cfcb2355c3', email: 'admin@pharmacy.com',     displayName: 'Admin' },
  { uid: '34cef7ed-c965-41c7-a532-9b3d02103d59', email: 'gloriapelu56@gmail.com', displayName: 'Gloria Cortes' },
]

console.log(`\nMigrando ${users.length} usuarios a Firebase Auth...\n`)
let created = 0, skipped = 0, errors = 0

for (const user of users) {
  try {
    const fbUser = await auth.createUser({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || undefined,
      emailVerified: true,
    })
    console.log(`✓ Creado: ${user.email} (${fbUser.uid})`)
    created++
  } catch (err) {
    if (err.code === 'auth/email-already-exists' || err.code === 'auth/uid-already-exists') {
      console.log(`⟳ Ya existe: ${user.email}`)
      skipped++
    } else {
      console.error(`✗ Error ${user.email}: ${err.message}`)
      errors++
    }
  }
}

console.log(`\n✅ Resultado:`)
console.log(`   Creados:     ${created}`)
console.log(`   Ya existían: ${skipped}`)
console.log(`   Errores:     ${errors}`)
console.log(`\n⚠️  Los usuarios migrados NO tienen contraseña.`)
console.log(`   Deben usar "Olvidé mi contraseña" en: https://tu-farmacia.cl/auth/forgot-password`)
