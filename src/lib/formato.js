const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const realesFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const kilosFormatter = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const pctFormatter = new Intl.NumberFormat('es-CL', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const fechaFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export const formatCLP = (n) => clpFormatter.format(Math.round(Number(n) || 0))

export const formatReales = (n) => realesFormatter.format(Number(n) || 0)

export const formatKilos = (n) => `${kilosFormatter.format(Number(n) || 0)} kg`

export const formatNumero = (n, dec = 2) =>
  new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(Number(n) || 0)

export const formatPct = (n) => {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return pctFormatter.format(n)
}

/** ISO 'YYYY-MM-DD' → 'dd/mm/aaaa'. Si la fecha es inválida, devuelve el original. */
export function formatFecha(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return fechaFormatter.format(d)
}

/** 'YYYY-MM' → 'MMMM YYYY' (ej. '2026-05' → 'Mayo 2026'). */
const mesFormatter = new Intl.DateTimeFormat('es-CL', {
  month: 'long',
  year: 'numeric',
})
export function formatMes(yyyyMm) {
  if (!yyyyMm) return ''
  const [y, m] = yyyyMm.split('-').map(Number)
  if (!y || !m) return yyyyMm
  const d = new Date(y, m - 1, 1)
  const txt = mesFormatter.format(d)
  return txt.charAt(0).toUpperCase() + txt.slice(1)
}

/** 'YYYY-MM' del mes actual */
export function mesActualISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Convierte un número almacenado (float JS) al formato de input chileno para
 * pre-poblar un campo editable: 54.05 → "54,05" ; 100711.23 → "100.711,23"
 */
export function formatearNumeroParaInput(n) {
  if (n == null || n === '') return ''
  const num = Number(n)
  if (!Number.isFinite(num)) return ''
  if (num === 0) return ''
  return num.toLocaleString('es-CL', { maximumFractionDigits: 3, minimumFractionDigits: 0 })
}

/**
 * Formatea un string de input numérico en tiempo real con separadores de miles (puntos)
 * y decimal (coma): "100711" → "100.711", "100711,88" → "100.711,88"
 */
export function formatearInputNumero(raw) {
  if (raw === '' || raw == null) return ''
  const s = String(raw)
  // Separar parte decimal (todo después de la última coma)
  const commaIdx = s.lastIndexOf(',')
  let intStr, decStr
  if (commaIdx >= 0) {
    intStr = s.slice(0, commaIdx).replace(/\D/g, '')
    decStr = ',' + s.slice(commaIdx + 1).replace(/\D/g, '')
  } else {
    intStr = s.replace(/[^\d]/g, '')
    decStr = ''
  }
  // Agregar puntos cada 3 dígitos en la parte entera
  if (intStr.length > 3) {
    intStr = intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }
  return intStr + decStr
}

/** Parsea un input numérico tolerante a separadores chilenos ('1.234,56' o '1234.56'). */
export function parseNumeroFlexible(input) {
  if (typeof input === 'number') return input
  if (!input) return 0
  const s = String(input).trim()
  if (!s) return 0
  // Estilo chileno con coma decimal: "1.234,56" → quitar puntos, cambiar coma
  if (s.includes(',') && s.lastIndexOf(',') > s.lastIndexOf('.')) {
    const n = Number(s.replace(/\./g, '').replace(',', '.'))
    return Number.isFinite(n) ? n : 0
  }
  // Punto como separador de miles: "550.000" o "1.500.000"
  if (s.includes('.') && /\.\d{3}(\.|$)/.test(s)) {
    const n = Number(s.replace(/\./g, ''))
    return Number.isFinite(n) ? n : 0
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}
