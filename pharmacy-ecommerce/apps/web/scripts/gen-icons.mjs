// Generates PWA/TWA icons from inline SVG (cian gradient + medical cross).
// Run: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'public');
mkdirSync(outDir, { recursive: true });

const CYAN_FROM = '#0891b2';
const CYAN_TO = '#06b6d4';

function brandSvg({ size, radiusPct = 0.167, crossPct = 0.583 }) {
  const r = Math.round(size * radiusPct);
  const cross = Math.round(size * crossPct);
  const offset = Math.round((size - cross) / 2);
  const armW = Math.round(cross * 0.143);
  const armOff = Math.round((cross - armW) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${CYAN_FROM}"/>
        <stop offset="100%" stop-color="${CYAN_TO}"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#g)"/>
    <g transform="translate(${offset},${offset})">
      <rect x="${armOff}" y="0" width="${armW}" height="${cross}" rx="${Math.round(armW / 2)}" fill="#fff"/>
      <rect x="0" y="${armOff}" width="${cross}" height="${armW}" rx="${Math.round(armW / 2)}" fill="#fff"/>
    </g>
  </svg>`;
}

// Maskable: shrink content to ~80% safe zone (Android masks corners).
function maskableSvg(size) {
  const inner = Math.round(size * 0.8);
  const pad = Math.round((size - inner) / 2);
  const cross = Math.round(inner * 0.583);
  const crossOff = pad + Math.round((inner - cross) / 2);
  const armW = Math.round(cross * 0.143);
  const armOff = Math.round((cross - armW) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${CYAN_FROM}"/>
        <stop offset="100%" stop-color="${CYAN_TO}"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/>
    <g transform="translate(${crossOff},${crossOff})">
      <rect x="${armOff}" y="0" width="${armW}" height="${cross}" rx="${Math.round(armW / 2)}" fill="#fff"/>
      <rect x="0" y="${armOff}" width="${cross}" height="${armW}" rx="${Math.round(armW / 2)}" fill="#fff"/>
    </g>
  </svg>`;
}

// Monochrome notification icon: white silhouette on transparent.
function notifSvg(size) {
  const cross = Math.round(size * 0.7);
  const offset = Math.round((size - cross) / 2);
  const armW = Math.round(cross * 0.22);
  const armOff = Math.round((cross - armW) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${offset},${offset})">
      <rect x="${armOff}" y="0" width="${armW}" height="${cross}" rx="${Math.round(armW / 2)}" fill="#fff"/>
      <rect x="0" y="${armOff}" width="${cross}" height="${armW}" rx="${Math.round(armW / 2)}" fill="#fff"/>
    </g>
  </svg>`;
}

const targets = [
  { name: 'icon-192.png',           svg: brandSvg({ size: 192 }) },
  { name: 'icon-512.png',           svg: brandSvg({ size: 512 }) },
  { name: 'icon-512-maskable.png',  svg: maskableSvg(512) },
  { name: 'notification-icon.png',  svg: notifSvg(96) },
  { name: 'apple-icon-180.png',     svg: brandSvg({ size: 180 }) },
];

for (const t of targets) {
  const out = resolve(outDir, t.name);
  await sharp(Buffer.from(t.svg)).png({ compressionLevel: 9 }).toFile(out);
  console.log('wrote', t.name);
}
