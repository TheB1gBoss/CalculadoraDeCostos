import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUB = resolve(__dirname, '..', 'public')

// Emblema compartido: moneda de oro con tendencia cian al alza.
const emblem = (cx, cy, r) => `
  <g>
    <!-- moneda oro -->
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#gold)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#7d5f18" stroke-width="${r * 0.05}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.82}" fill="none" stroke="#f6e6ad" stroke-opacity="0.55" stroke-width="${r * 0.03}"/>
    <!-- brillo superior -->
    <ellipse cx="${cx - r * 0.28}" cy="${cy - r * 0.42}" rx="${r * 0.42}" ry="${r * 0.22}" fill="#fff6da" opacity="0.30"/>
    <!-- tendencia al alza (cian) -->
    <g stroke="#3fcbe0" stroke-width="${r * 0.16}" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#glow)">
      <path d="M ${cx - r * 0.6} ${cy + r * 0.42}
               L ${cx - r * 0.12} ${cy - r * 0.08}
               L ${cx + r * 0.18} ${cy + r * 0.22}
               L ${cx + r * 0.62} ${cy - r * 0.46}"/>
      <path d="M ${cx + r * 0.26} ${cy - r * 0.46} L ${cx + r * 0.62} ${cy - r * 0.46} L ${cx + r * 0.62} ${cy - r * 0.10}"/>
    </g>
  </g>`

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#171d27"/>
      <stop offset="1" stop-color="#0a0d12"/>
    </linearGradient>
    <radialGradient id="bgGlow" cx="28%" cy="22%" r="75%">
      <stop offset="0" stop-color="#3fcbe0" stop-opacity="0.28"/>
      <stop offset="0.55" stop-color="#3fcbe0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gold" cx="38%" cy="32%" r="75%">
      <stop offset="0" stop-color="#f3dc8e"/>
      <stop offset="0.5" stop-color="#d4af37"/>
      <stop offset="1" stop-color="#a9811d"/>
    </radialGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#3fcbe0" flood-opacity="0.7"/>
    </filter>
  </defs>`

// Variante "any": squircle con esquinas transparentes.
const squircle = (S) => {
  const r = S * 0.225
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    ${defs}
    <rect x="0" y="0" width="${S}" height="${S}" rx="${r}" ry="${r}" fill="url(#bg)"/>
    <rect x="0" y="0" width="${S}" height="${S}" rx="${r}" ry="${r}" fill="url(#bgGlow)"/>
    <rect x="1.5" y="1.5" width="${S - 3}" height="${S - 3}" rx="${r - 1}" ry="${r - 1}"
          fill="none" stroke="#3fcbe0" stroke-opacity="0.18" stroke-width="3"/>
    ${emblem(S / 2, S * 0.52, S * 0.3)}
  </svg>`
}

// Variante "maskable"/apple: fondo a sangre completa, contenido en zona segura.
const fullbleed = (S) => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    ${defs}
    <rect x="0" y="0" width="${S}" height="${S}" fill="url(#bg)"/>
    <rect x="0" y="0" width="${S}" height="${S}" fill="url(#bgGlow)"/>
    ${emblem(S / 2, S * 0.52, S * 0.26)}
  </svg>`

const out = async (svg, name) => {
  await sharp(Buffer.from(svg)).png().toFile(resolve(PUB, name))
  console.log('✓', name)
}

await out(squircle(512), 'icon-512.png')
await out(squircle(192), 'icon-192.png')
await out(fullbleed(512), 'icon-maskable-512.png')
await out(fullbleed(180), 'apple-touch-icon.png')
console.log('Iconos generados en /public')
