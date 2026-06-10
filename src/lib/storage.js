/**
 * Persistencia en localStorage.
 *
 * Estructura:
 *   calculadora.v1 = {
 *     meses: {
 *       '2026-05': { ...estadoDelMes },
 *       '2026-04': { ...estadoDelMes },
 *       ...
 *     },
 *     mesActivo: '2026-05',
 *     preciosVenta: { ... },         // lista actual de precios venta
 *     precioPonderadoBase: { ... },  // costos ponderados por categoría
 *   }
 */

const STORAGE_KEY = 'calculadora.v1'

function safeRead() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function safeWrite(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('[storage] no se pudo escribir en localStorage:', err)
  }
}

/** Lee todo el estado persistido. Devuelve null si no hay nada. */
export function loadAll() {
  return safeRead()
}

/** Guarda el estado completo. */
export function saveAll(state) {
  safeWrite(state)
}

/** Reemplaza/actualiza un mes específico. */
export function saveMes(state, mesKey, mesData) {
  const next = {
    ...state,
    meses: { ...(state?.meses || {}), [mesKey]: mesData },
    mesActivo: mesKey,
  }
  safeWrite(next)
  return next
}

/** Borra un mes. */
export function deleteMes(state, mesKey) {
  const meses = { ...(state?.meses || {}) }
  delete meses[mesKey]
  const next = { ...state, meses }
  if (next.mesActivo === mesKey) {
    next.mesActivo = Object.keys(meses).sort().pop() || null
  }
  safeWrite(next)
  return next
}

/** Borra TODO. Útil para "reset" en dev. */
export function clearAll() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}

/**
 * Construye el estado inicial a partir de datos_iniciales.json.
 * Asigna todos los datos al mes activo (por defecto, mayo 2026).
 */
export function seedFromInitial(datos, mesKey = '2026-05') {
  const mes = {
    compras_bruto: datos.compras_bruto || [],
    pagos: datos.pagos || [],
    banos_completados: datos.banos_completados || [],
    llegadas_mercaderia_por_bloque: datos.llegadas_mercaderia_por_bloque || [],
    servicios_completados: datos.servicios_completados || [],
    pagos_aduana: datos.pagos_aduana || [],
    costos_ponderados_por_kilo:
      datos.costos_ponderados_por_kilo || {
        MICRO: 570000,
        CADENA: 405000,
        'ORO GF': 1500000,
      },
  }
  return {
    meses: { [mesKey]: mes },
    mesActivo: mesKey,
    preciosVenta: datos.precios_venta || {},
    historicoJoyas: datos.historico_costos_joyas || [],
  }
}

/** Lee el estado o lo crea desde los datos iniciales si no existe aún. */
export function loadOrSeed(datos, mesKey = '2026-05') {
  const existing = loadAll()
  if (existing && existing.meses && Object.keys(existing.meses).length) {
    return existing
  }
  const seeded = seedFromInitial(datos, mesKey)
  saveAll(seeded)
  return seeded
}
