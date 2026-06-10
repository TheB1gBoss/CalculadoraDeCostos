/**
 * Import / Export Excel (.xlsx) usando SheetJS.
 *
 * Formato del workbook:
 *   - Una hoja "Resumen" con KPIs por mes
 *   - Por cada mes (key 'YYYY-MM'), 6 hojas con sufijo del mes:
 *       Compras YYYY-MM, Pagos YYYY-MM, Banos YYYY-MM,
 *       Llegadas YYYY-MM, Servicios YYYY-MM, Aduana YYYY-MM
 *   - Una hoja "PreciosVenta" (compartida, opcional)
 */

import * as XLSX from 'xlsx'
import { calcularIndicadores } from './calculos.js'
import { formatMes } from './formato.js'

const SHEET_PREFIX = {
  compras_bruto: 'Compras',
  pagos: 'Pagos',
  banos_completados: 'Banos',
  llegadas_mercaderia_por_bloque: 'Llegadas',
  servicios_completados: 'Servicios',
  pagos_aduana: 'Aduana',
}

const sheetName = (prefix, mesKey) => `${prefix} ${mesKey}`.slice(0, 31)

/* ────────────────────────────────────────────────────────────────────────── */
/* Export                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export function exportarWorkbook(state, mesKey = null) {
  const wb = XLSX.utils.book_new()

  const meses = mesKey ? [mesKey] : Object.keys(state.meses || {}).sort()

  // Resumen
  const resumen = meses.map((k) => {
    const ind = calcularIndicadores(state.meses[k])
    return {
      Mes: k,
      Etiqueta: formatMes(k),
      'TC ponderado': round(ind.tipoCambio, 4),
      'Bruto/kg': round(ind.brutoPorKilo),
      'Baño/kg': round(ind.banoPorKilo),
      'Aduana/kg': round(ind.aduanaPorKilo),
      'Costo total/kg': round(ind.costoTotalPorKilo),
      'Kilos MICRO': round(ind.kilos.MICRO, 3),
      'Kilos CADENA': round(ind.kilos.CADENA, 3),
      'Kilos ORO GF': round(ind.kilos['ORO GF'], 3),
      'Kilos total': round(ind.kilos.total, 3),
      'Indicador fabricación': round(ind.indicadorFabricacion),
    }
  })
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen')

  // Hojas por mes
  meses.forEach((k) => {
    const m = state.meses[k]
    if (!m) return
    addSheet(wb, sheetName(SHEET_PREFIX.compras_bruto, k), m.compras_bruto)
    addSheet(wb, sheetName(SHEET_PREFIX.pagos, k), m.pagos)
    addSheet(wb, sheetName(SHEET_PREFIX.banos_completados, k), m.banos_completados)
    addSheet(wb, sheetName(SHEET_PREFIX.llegadas_mercaderia_por_bloque, k), m.llegadas_mercaderia_por_bloque)
    addSheet(wb, sheetName(SHEET_PREFIX.servicios_completados, k), m.servicios_completados)
    addSheet(wb, sheetName(SHEET_PREFIX.pagos_aduana, k), m.pagos_aduana)

    // Precios ponderados como hoja propia
    const cp = m.costos_ponderados_por_kilo || {}
    addSheet(wb, `Pond ${k}`.slice(0, 31), [
      { categoria: 'MICRO', precio_kg: cp.MICRO ?? cp.MICROZIRCON ?? 0 },
      { categoria: 'CADENA', precio_kg: cp.CADENA ?? 0 },
      { categoria: 'ORO GF', precio_kg: cp['ORO GF'] ?? 0 },
    ])
  })

  // Precios venta (compartido)
  if (state.preciosVenta) {
    const filas = []
    Object.entries(state.preciosVenta).forEach(([linea, valor]) => {
      const esPlano = Object.values(valor).every((v) => typeof v === 'number')
      if (esPlano) {
        filas.push({ linea, subcategoria: '', ...valor })
      } else {
        Object.entries(valor).forEach(([sub, tramos]) => {
          filas.push({ linea, subcategoria: sub, ...tramos })
        })
      }
    })
    if (filas.length) addSheet(wb, 'PreciosVenta', filas)
  }

  const fileName = mesKey
    ? `calculadora_${mesKey}.xlsx`
    : `calculadora_todos_los_meses.xlsx`
  XLSX.writeFile(wb, fileName)
}

function addSheet(wb, name, rows) {
  const data = Array.isArray(rows) && rows.length > 0 ? rows : [{}]
  const ws = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, name)
}

function round(n, decimals = 0) {
  if (!Number.isFinite(n)) return 0
  const f = Math.pow(10, decimals)
  return Math.round(n * f) / f
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Import                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export async function importarWorkbook(file, prevState) {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })

  // Detectar meses presentes a partir de los nombres de hoja
  const mesesDetectados = new Set()
  wb.SheetNames.forEach((n) => {
    const m = n.match(/(\d{4}-\d{2})$/)
    if (m) mesesDetectados.add(m[1])
  })

  if (mesesDetectados.size === 0) {
    throw new Error('No se detectaron hojas con formato "YYYY-MM" en el archivo.')
  }

  const nuevosMeses = { ...(prevState?.meses || {}) }

  mesesDetectados.forEach((mesKey) => {
    const get = (prefix) =>
      sheetToRows(wb, sheetName(prefix, mesKey)) || []
    const pond = sheetToRows(wb, `Pond ${mesKey}`.slice(0, 31)) || []
    const costos = pond.reduce((acc, r) => {
      if (r.categoria) acc[r.categoria] = Number(r.precio_kg) || 0
      return acc
    }, {})

    nuevosMeses[mesKey] = {
      compras_bruto: get(SHEET_PREFIX.compras_bruto),
      pagos: get(SHEET_PREFIX.pagos),
      banos_completados: get(SHEET_PREFIX.banos_completados),
      llegadas_mercaderia_por_bloque: get(SHEET_PREFIX.llegadas_mercaderia_por_bloque),
      servicios_completados: get(SHEET_PREFIX.servicios_completados),
      pagos_aduana: get(SHEET_PREFIX.pagos_aduana),
      costos_ponderados_por_kilo:
        Object.keys(costos).length > 0
          ? costos
          : prevState?.meses?.[mesKey]?.costos_ponderados_por_kilo || {
              MICRO: 570000,
              CADENA: 405000,
              'ORO GF': 1500000,
            },
    }
  })

  return {
    ...prevState,
    meses: nuevosMeses,
    mesActivo: prevState?.mesActivo || [...mesesDetectados].sort().pop(),
  }
}

function sheetToRows(wb, name) {
  const ws = wb.Sheets[name]
  if (!ws) return null
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
  // Filtra filas completamente vacías (cuando exportamos un sheet vacío hicimos un [{}])
  return rows.filter((r) => Object.values(r).some((v) => v !== '' && v !== null && v !== undefined))
}
