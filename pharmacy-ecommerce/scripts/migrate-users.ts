/**
 * One-time script: Migrate users from Supabase Auth → Firebase Auth
 *
 * Usage:
 *   1. Export users from Supabase:
 *      Dashboard → Authentication → Users → Export as CSV
 *      OR use: supabase users export --project-ref jvagvjwrjiekaafpjbit > users.csv
 *
 *   2. Set Firebase env vars in .env.local, then run:
 *      npx ts-node --project tsconfig.json scripts/migrate-users.ts
 *
 * After migration:
 *   - Users receive a password reset email automatically
 *   - Set admin claims manually (see bottom of this file)
 */

import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') })

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  })
}

const adminAuth = getAuth()

interface SupabaseUser {
  id: string
  email: string
  created_at: string
  raw_user_meta_data?: string // JSON string with { name, surname }
}

async function migrateUsers(csvPath: string) {
  const csv = fs.readFileSync(csvPath, 'utf-8')
  const users: SupabaseUser[] = parse(csv, { columns: true, skip_empty_lines: true })

  console.log(`\nMigrando ${users.length} usuarios a Firebase Auth...\n`)

  let created = 0
  let skipped = 0
  let errors = 0

  for (const user of users) {
    if (!user.email) continue

    let displayName = ''
    try {
      const meta = user.raw_user_meta_data ? JSON.parse(user.raw_user_meta_data) : {}
      displayName = [meta.name, meta.surname].filter(Boolean).join(' ').trim()
    } catch {}

    try {
      const fbUser = await adminAuth.createUser({
        uid: user.id,          // Preserve Supabase UUID as Firebase UID
        email: user.email,
        displayName: displayName || undefined,
        emailVerified: true,   // Already verified in Supabase
      })

      // Send password reset email so user can set a new password
      await adminAuth.generatePasswordResetLink(user.email)

      console.log(`✓ ${user.email} → ${fbUser.uid}`)
      created++
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists' || err.code === 'auth/uid-already-exists') {
        console.log(`⟳ ${user.email} ya existe`)
        skipped++
      } else {
        console.error(`✗ ${user.email}: ${err.message}`)
        errors++
      }
    }

    // Rate limit: Firebase allows ~1000 imports/minute
    await new Promise((r) => setTimeout(r, 60))
  }

  console.log(`\n✅ Migración completa:`)
  console.log(`   Creados: ${created}`)
  console.log(`   Ya existían: ${skipped}`)
  console.log(`   Errores: ${errors}`)
}

async function setAdminClaim(email: string) {
  const user = await adminAuth.getUserByEmail(email)
  await adminAuth.setCustomUserClaims(user.uid, { role: 'admin' })
  console.log(`✓ Admin claim set para ${email} (uid: ${user.uid})`)
}

// ============================================================
// MAIN
// ============================================================
const csvPath = process.argv[2]

if (process.argv[2] === '--set-admin') {
  // Usage: npx ts-node scripts/migrate-users.ts --set-admin admin@email.com
  const adminEmail = process.argv[3]
  if (!adminEmail) {
    console.error('Usage: npx ts-node scripts/migrate-users.ts --set-admin email@example.com')
    process.exit(1)
  }
  setAdminClaim(adminEmail)
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1) })
} else if (csvPath) {
  migrateUsers(csvPath)
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1) })
} else {
  console.log('Usage:')
  console.log('  Migrate users:  npx ts-node scripts/migrate-users.ts users.csv')
  console.log('  Set admin role: npx ts-node scripts/migrate-users.ts --set-admin admin@email.com')
  process.exit(1)
}
