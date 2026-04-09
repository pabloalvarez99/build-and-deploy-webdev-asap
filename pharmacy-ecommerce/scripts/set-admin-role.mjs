import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { join } from 'path'

const webDir = new URL('../apps/web/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const require = createRequire(join(webDir, 'package.json'))

const envRaw = readFileSync(join(webDir, '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const i = l.indexOf('='); const k = l.slice(0,i).trim(); let v = l.slice(i+1).trim()
      if ((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1)
      return [k, v]
    })
)

const admin = require('firebase-admin')
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert({
  projectId: env.FIREBASE_PROJECT_ID,
  clientEmail: env.FIREBASE_CLIENT_EMAIL,
  privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\n/g, '\n'),
})})

await admin.auth().setCustomUserClaims('1f932f9d-21c5-42eb-a17b-24cfcb2355c3', { role: 'admin' })
console.log('✅ admin@pharmacy.com → role:admin')
