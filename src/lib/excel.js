/**
 * Import / Export Excel (.xlsx) usando SheetJS.
 *
 * Modelo de pool único: el workbook tiene una hoja por tipo de registro
 * (Compras, Pagos, Banos, Llegadas, Servicios, Aduana), una hoja "Pond" con
 * los precios ponderados, una hoja "Resumen" con los KPIs globales y, si
 * existe, "PreciosVenta".
 */

import { calcularIndicadores } from './calculos.js'

// xlsx es pesado (~500 KB). Se carga bajo demanda para no inflar el bundle inicial.
const loadXLSX = () => import('xlsx')

const SHEETS = {
  compras_bruto: 'Compras',
  pagos: 'Pagos',
  banos_completados: 'Banos',
  llegadas_mercaderia_por_bloque: 'Llegadas',
  servicios_completados: 'Servicios',
  pagos_aduana: 'Aduana',
}

const DEFAULT_PRECIOS = { MICRO: 570000, CADENA: 405000, 'ORO GF': 1500000 }

/* ────────────────────────────────────────────────────────────────────────── */
/* Export                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export async function exportarWorkbook(state) {
  const XLSX = await loadXLSX()
  const wb = XLSX.utils.book_new()
  const datos = state.datos || {}

  // Resumen (KPIs globales)
  const ind = calcularIndicadores(datos)
  addSheet(XLSX, wb, 'Resumen', [
    {
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
    },
  ])

  // Una hoja por tipo de registro
  Object.entries(SHEETS).forEach(([campo, nombre]) => {
    addSheet(XLSX, wb, nombre, datos[campo] || [])
  })

  // Precios ponderados
  const cp = datos.costos_ponderados_por_kilo || {}
  addSheet(XLSX, wb, 'Pond', [
    { categoria: 'MICRO', precio_kg: cp.MICRO ?? cp.MICROZIRCON ?? 0 },
    { categoria: 'CADENA', precio_kg: cp.CADENA ?? 0 },
    { categoria: 'ORO GF', precio_kg: cp['ORO GF'] ?? 0 },
  ])

  // Precios venta (referencia comercial)
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
    if (filas.length) addSheet(XLSX, wb, 'PreciosVenta', filas)
  }

  XLSX.writeFile(wb, 'calculadora_respaldo.xlsx')
}

function addSheet(XLSX, wb, name, rows) {
  const data = Array.isArray(rows) && rows.length > 0 ? rows : [{}]
  const ws = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
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
  const XLSX = await loadXLSX()
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })

  const tieneAlguna = Object.values(SHEETS).some((n) => wb.Sheets[n])
  if (!tieneAlguna) {
    throw new Error(
      'El archivo no tiene las hojas esperadas (Compras, Pagos, Banos, ...).',
    )
  }

  const datos = {}
  Object.entries(SHEETS).forEach(([campo, nombre]) => {
    datos[campo] = sheetToRows(XLSX, wb, nombre)
  })

  const pond = sheetToRows(XLSX, wb, 'Pond')
  const costos = pond.reduce((acc, r) => {
    if (r.categoria) acc[r.categoria] = Number(r.precio_kg) || 0
    return acc
  }, {})
  datos.costos_ponderados_por_kilo =
    Object.keys(costos).length > 0
      ? costos
      : prevState?.datos?.costos_ponderados_por_kilo || { ...DEFAULT_PRECIOS }

  return { ...prevState, datos }
}

function sheetToRows(XLSX, wb, name) {
  const ws = wb.Sheets[name.slice(0, 31)]
  if (!ws) return []
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
  return rows.filter((r) =>
    Object.values(r).some((v) => v !== '' && v !== null && v !== undefined),
  )
}
