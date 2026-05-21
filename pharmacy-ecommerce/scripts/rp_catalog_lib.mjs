// Shared helpers: env + DB connection + heuristics for rp_catalog scripts.

import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { join } from 'path'

export const webDir = new URL('../apps/web/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const require = createRequire(join(webDir, 'package.json'))

// .env.local loader (mismo patrón que fix_broken_images.mjs)
const envRaw = readFileSync(join(webDir, '.env.local'), 'utf-8')
export const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const i = l.indexOf('=')
      const key = l.slice(0, i).trim()
      let val = l.slice(i + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1)
      val = val.replace(/\\n$/g, '').replace(/\\r$/g, '')
      return [key, val]
    })
)

const { Connector, IpAddressTypes, AuthTypes } = require('@google-cloud/cloud-sql-connector')
const { GoogleAuth } = require('google-auth-library')
const pg = require('pg')

function parseEnvJson(val) {
  if (!val) throw new Error('GOOGLE_SERVICE_ACCOUNT not set')
  try { return JSON.parse(val) } catch {}
  const first = val.indexOf('{'); const last = val.lastIndexOf('}')
  if (first >= 0 && last > first) {
    try { return JSON.parse(val.slice(first, last + 1)) } catch {}
  }
  try { return JSON.parse(JSON.parse('"' + val + '"')) }
  catch (e) { throw new Error('Cannot parse GOOGLE_SERVICE_ACCOUNT: ' + e.message) }
}

export async function connectDb({ max = 8 } = {}) {
  const credentials = parseEnvJson(env.GOOGLE_SERVICE_ACCOUNT)
  const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/cloud-platform'] })
  const connector = new Connector({ auth })
  const clientOpts = await connector.getOptions({
    instanceConnectionName: env.CLOUD_SQL_INSTANCE.trim(),
    ipType: IpAddressTypes.PUBLIC,
    authType: AuthTypes.PASSWORD,
  })
  return new pg.Pool({
    ...clientOpts,
    user: env.DB_USER.trim(),
    password: env.DB_PASSWORD.trim(),
    database: env.DB_NAME.trim(),
    max,
  })
}

// ─── Heuristics ────────────────────────────────────────────────────────────────
// Forma farmacéutica / presentación detectada por sufijos comunes en desc abreviadas.
const FORM_PATTERNS = [
  [/\bCOMP(?:RIMIDOS?)?\b|\bCOMPR\b|\bTAB(?:LETAS?)?\b/i, 'comprimido'],
  [/\bCAP(?:S(?:ULAS?)?)?\b/i, 'cápsula'],
  [/\bJBE\b|\bJARABE\b/i, 'jarabe'],
  [/\bGTS\b|\bGOTAS\b/i, 'gotas'],
  [/\bSUSP(?:ENSION)?\b/i, 'suspensión'],
  [/\bCREMA\b|\bCRM\b/i, 'crema'],
  [/\bUNG(?:UENTO)?\b/i, 'ungüento'],
  [/\bGEL\b/i, 'gel'],
  [/\bLOC(?:ION)?\b/i, 'loción'],
  [/\bSOL(?:UCION)?\b/i, 'solución'],
  [/\bSPRAY\b|\bSP\b/i, 'spray'],
  [/\bSHAMPOO\b|\bSH\b\.?/i, 'shampoo'],
  [/\bAMP(?:OLLAS?)?\b/i, 'ampolla'],
  [/\bSUPOS(?:ITORIOS?)?\b/i, 'supositorio'],
  [/\bOVULOS?\b/i, 'óvulo'],
  [/\bPOLVO\b/i, 'polvo'],
  [/\bSACHET\b/i, 'sachet'],
  [/\bAEROSOL\b/i, 'aerosol'],
  [/\bINY(?:ECTABLE)?\b/i, 'inyectable'],
  [/\bPARCHE\b/i, 'parche'],
  [/\bENJUAGUE\b|\bCOLUTORIO\b/i, 'enjuague bucal'],
  [/\bPASTA\b/i, 'pasta'],
  [/\bMASC(?:ARILLA)?\b/i, 'mascarilla'],
  [/\bACONDICIONADOR\b|\bACO\b\.?/i, 'acondicionador'],
  [/\bPERFUME\b|\bEDP\b|\bEDT\b|\bED\/COLOGNE\b|\bCOLONIA\b/i, 'perfume'],
]

// Tipo de producto a nivel macro
const TYPE_PATTERNS = [
  [/\b(EDP|EDT|ED\/COLOGNE|PERFUME|COLONIA|EAU DE)\b/i, 'perfume'],
  [/\b(SHAMPOO|ACONDIC|MASC\.|CREMA|GEL|LOCION|MAQUILLAJE|LABIAL|RUBOR|SOMBRA|POLVO COMPACTO|RIMMEL|RIMEL|BASE|CORRECTOR|ESMALTE)\b/i, 'cosmético'],
  [/\b(PASTA|CEPILLO|ENJUAGUE|HILO DENTAL|COLUTORIO)\b/i, 'higiene-dental'],
  [/\b(PA[NÑ]AL|TOALLA|TAMPON|PROTECTOR DIA|COPA MENS)\b/i, 'higiene-personal'],
  [/\b(BIBERON|MAMADERA|CHUPETE|F[OÓ]RMULA INFANT|LECHE INFANT|CEREALES|NESTUM)\b/i, 'infantil'],
  [/\b(VITAMIN|MULTIVIT|CALCIO|MAGNESIO|ZINC|HIERRO|OMEGA|COLAGENO|PROTEINA|PROBIOTIC|MELATONIN|GLUCOSAMIN)\b/i, 'suplemento'],
  [/\b(JBE|JARABE|COMP|CAPS|GTS|AMP|INY|SUSP|TAB|SUPOS|OVULO|PARCHE|AEROSOL)\b/i, 'medicamento'],
]

const UNIT_RE = /(\d+(?:[.,]\d+)?)\s?(ML|MG|G|GR|MCG|UI|CC|L|%)\b/i
const COUNT_RE = /\b(\d{1,4})\s?(COMP|CAPS|TAB|AMP|SUPOS|OVULOS?|SOBRES?|SACHETS?|UND|UNID|PARCHES?)\b/i

export function inferForm(desc) {
  for (const [re, label] of FORM_PATTERNS) if (re.test(desc)) return label
  return null
}

export function inferType(desc) {
  for (const [re, label] of TYPE_PATTERNS) if (re.test(desc)) return label
  return 'otros'
}

export function inferDose(desc) {
  const m = desc.match(UNIT_RE)
  if (!m) return null
  return `${m[1].replace(',', '.')}${m[2].toUpperCase()}`
}

export function inferPresentation(desc) {
  // Captura "30 COMP", "100 ML", "10 AMP", etc.
  const c = desc.match(COUNT_RE)
  if (c) return `${c[1]} ${c[2].toUpperCase()}`
  const u = desc.match(/(\d+(?:[.,]\d+)?\s?(ML|CC|L|G|GR))\b/i)
  if (u) return u[1].toUpperCase().replace(/\s+/g, '')
  return null
}

// Laboratorios chilenos comunes (extraibles desde tokens tipo "E.LAB", "LAB", marca).
const LAB_TOKENS = [
  ['SAVAL', 'Saval'], ['CHILE', null], ['MAVER', 'Maver'], ['ANDROMACO', 'Andrómaco'],
  ['BAGO', 'Bagó'], ['BAGÓ', 'Bagó'], ['PASTEUR', 'Pasteur'], ['MINTLAB', 'MintLab'],
  ['LCH', 'Lab. Chile'], ['LAB.CHILE', 'Lab. Chile'], ['PFIZER', 'Pfizer'],
  ['ROCHE', 'Roche'], ['BAYER', 'Bayer'], ['GSK', 'GSK'], ['NOVARTIS', 'Novartis'],
  ['SANOFI', 'Sanofi'], ['ABBOTT', 'Abbott'], ['MSD', 'MSD'], ['ASTRAZENECA', 'AstraZeneca'],
  ['TEVA', 'Teva'], ['RECALCINE', 'Recalcine'], ['SANITAS', 'Sanitas'],
  ['ROYAL PHARMA', 'Royal Pharma'], ['ROEMMERS', 'Roemmers'],
  ['JOHNSON', 'Johnson & Johnson'], ['ARDEN', 'Elizabeth Arden'],
  ['LANCOME', 'Lancôme'], ['LOREAL', "L'Oréal"], ['NIVEA', 'Nivea'],
  ['EUCERIN', 'Eucerin'], ['VICHY', 'Vichy'], ['LA ROCHE', 'La Roche-Posay'],
  ['NEUTROGENA', 'Neutrogena'], ['ISDIN', 'ISDIN'], ['AVENE', 'Avène'],
]

export function inferLaboratory(desc) {
  const up = desc.toUpperCase()
  for (const [token, label] of LAB_TOKENS) {
    if (label && up.includes(token)) return label
  }
  // Patrón "E.ARDEN" / "E.LAB X" → marca al final
  const tail = up.match(/E\.([A-ZÁÉÍÓÚÑ\s]{2,20})$/)
  if (tail) return tail[1].trim().replace(/\s+/g, ' ').toLowerCase().replace(/\b./g, c => c.toUpperCase())
  return null
}

// Principio activo: usar lib drug-info existente si está disponible al runtime.
// Aquí solo dejamos el slot; el caller decide enrichment vía drug-info.ts.
