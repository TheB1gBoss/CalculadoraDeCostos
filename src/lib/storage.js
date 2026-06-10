/**
 * Persistencia en localStorage.
 *
 * Modelo de datos (pool ÚNICO, sin meses):
 *   calculadora.v1 = {
 *     datos: {
 *       compras_bruto: [...],
 *       pagos: [...],
 *       banos_completados: [...],
 *       llegadas_mercaderia_por_bloque: [...],
 *       servicios_completados: [...],
 *       pagos_aduana: [...],
 *       costos_ponderados_por_kilo: { MICRO, CADENA, 'ORO GF' },
 *     },
 *     preciosVenta: { ... },      // lista comercial de referencia
 *     historicoJoyas: [ ... ],    // referencia
 *   }
 *
 * La fecha de cada registro es solo un dato de la fila: NUNCA divide ni filtra
 * los cálculos. Todos los costos se calculan sobre todo el pool junto.
 */

import { mergeMeses } from './calculos.js'

const STORAGE_KEY = 'calculadora.v1'

const DEFAULT_PRECIOS = { MICRO: 570000, CADENA: 405000, 'ORO GF': 1500000 }

const CAMPOS_CON_FECHA = [
  'compras_bruto',
  'pagos',
  'banos_completados',
  'servicios_completados',
  'pagos_aduana',
]

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

/** Borra TODO. Útil para "reset" en dev. */
export function clearAll() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}

/** Bucket de datos vacío. */
export function bucketVacio(precios) {
  return {
    compras_bruto: [],
    pagos: [],
    banos_completados: [],
    llegadas_mercaderia_por_bloque: [],
    servicios_completados: [],
    pagos_aduana: [],
    costos_ponderados_por_kilo: precios || { ...DEFAULT_PRECIOS },
  }
}

/** Construye el estado inicial (pool único) a partir de datos_iniciales.json. */
export function seedFromInitial(datos) {
  return {
    datos: {
      compras_bruto: datos.compras_bruto || [],
      pagos: datos.pagos || [],
      banos_completados: datos.banos_completados || [],
      llegadas_mercaderia_por_bloque: datos.llegadas_mercaderia_por_bloque || [],
      servicios_completados: datos.servicios_completados || [],
      pagos_aduana: datos.pagos_aduana || [],
      costos_ponderados_por_kilo:
        datos.costos_ponderados_por_kilo || { ...DEFAULT_PRECIOS },
    },
    preciosVenta: datos.precios_venta || {},
    historicoJoyas: datos.historico_costos_joyas || [],
  }
}

/**
 * Migra el modelo antiguo basado en `meses` a un único pool `datos`,
 * uniendo TODOS los meses en uno solo (no se pierde nada).
 */
function consolidarMeses(state) {
  const merged = mergeMeses(state.meses || {})
  const activo = state.meses?.[state.mesActivo]
  merged.costos_ponderados_por_kilo =
    activo?.costos_ponderados_por_kilo ||
    Object.values(state.meses || {})
      .map((m) => m?.costos_ponderados_por_kilo)
      .find((c) => c && Object.keys(c).length) ||
    { ...DEFAULT_PRECIOS }
  return {
    datos: merged,
    preciosVenta: state.preciosVenta || {},
    historicoJoyas: state.historicoJoyas || [],
  }
}

/**
 * Repara fechas corruptas heredadas del Excel (años < 2000, típicamente
 * '1900-01-01') reasignándolas a 2026. Devuelve { bucket, cambiado }.
 */
function repararFechas(bucket) {
  let cambiado = false
  const out = { ...bucket }
  CAMPOS_CON_FECHA.forEach((campo) => {
    const arr = bucket?.[campo]
    if (!Array.isArray(arr)) return
    let toco = false
    const fixed = arr.map((r) => {
      const m =
        typeof r?.fecha === 'string' && r.fecha.match(/^(\d{4})(-\d{2}-\d{2})/)
      if (m && Number(m[1]) < 2000) {
        toco = true
        return { ...r, fecha: `2026${m[2]}` }
      }
      return r
    })
    if (toco) {
      out[campo] = fixed
      cambiado = true
    }
  })
  return { bucket: out, cambiado }
}

/** Lee el estado o lo crea desde los datos iniciales si no existe aún. */
export function loadOrSeed(datosIniciales) {
  const existing = loadAll()
  let state
  if (existing && existing.datos) {
    state = existing
  } else if (existing && existing.meses && Object.keys(existing.meses).length) {
    state = consolidarMeses(existing)
  } else {
    state = seedFromInitial(datosIniciales)
  }
  const { bucket, cambiado } = repararFechas(state.datos)
  const next = cambiado ? { ...state, datos: bucket } : state
  saveAll(next)
  return next
}
