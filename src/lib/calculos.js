/**
 * Lógica de cálculo de la Calculadora de Importaciones — Inversiones Aravena SPA
 *
 * Convenciones de unidades (importante):
 *  - compras_bruto[].total_reales       → R$
 *  - pagos[].reales / pagos[].chilenos  → R$ / CLP
 *  - banos_completados[].total_clp      → ¡tratado como R$! (label histórico del JSON)
 *  - pagos_aduana[].total_clp           → CLP (sí está bien)
 *  - servicios_completados[].total_reales → R$
 *
 * Merma estándar al recibir bruto: 5% (factor 0.95).
 */

export const MERMA_FACTOR = 0.95
export const MERMA_LLEGADAS = 0.99

const sum = (arr, get = (x) => x) =>
  (arr || []).reduce((acc, x) => acc + (Number(get(x)) || 0), 0)

const safeDiv = (n, d) => (d > 0 ? n / d : 0)

/* ────────────────────────────────────────────────────────────────────────── */
/* Tipo de cambio ponderado                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * TC_ponderado = sum(pagos_CLP) / sum(pagos_R$)
 * Devuelve 0 si no hay pagos.
 */
export function tipoCambioPonderado(pagos) {
  const totalCLP = sum(pagos, (p) => p.chilenos)
  const totalR$ = sum(pagos, (p) => p.reales)
  return safeDiv(totalCLP, totalR$)
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Componentes del costo por kilo                                            */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * BRUTO (CLP/kg) = (bruto_R$ + servicios_R$) × TC_pond / (kilos_compra × merma)
 *
 * Es el costo de la mercadería "bruta" llegada de Brasil, expresada por kg
 * efectivo (después de merma del 5%).
 */
export function brutoPorKilo(comprasBruto, servicios, tcPonderado) {
  const brutoR$ = sum(comprasBruto, (c) => c.total_reales)
  const servR$ = sum(servicios, (s) => s.total_reales)
  const kilosCompra = sum(comprasBruto, (c) => c.kilos) * MERMA_FACTOR
  const totalCLP = (brutoR$ + servR$) * tcPonderado
  return safeDiv(totalCLP, kilosCompra)
}

/**
 * BAÑO (CLP/kg) = (sum(banos_R$) × TC_pond) / sum(banos_kilos)
 *
 * Nota: banos_completados[].total_clp se trata como R$.
 */
export function banoPorKilo(banos, tcPonderado) {
  let totalR$ = 0, totalKilos = 0
  ;(banos || []).forEach((b) => {
    if (b?.plata_kilos != null || b?.plata_reales != null) {
      // Formato combinado nuevo
      totalR$ += (Number(b?.plata_reales) || 0) + (Number(b?.oro_reales) || 0)
      totalKilos += (Number(b?.plata_kilos) || 0) + (Number(b?.oro_kilos) || 0)
    } else {
      // Formato antiguo (tipo + kilos + total_clp)
      totalR$ += Number(b?.total_clp) || 0
      totalKilos += Number(b?.kilos) || 0
    }
  })
  return safeDiv(totalR$ * tcPonderado, totalKilos)
}

/**
 * BAÑO separado por tipo de metal (oro / plata).
 *
 * Soporta dos formatos:
 *   Nuevo: { fecha, plata_kilos, plata_reales, oro_kilos, oro_reales }
 *   Antiguo: { fecha, tipo, kilos, total_clp }  (compatibilidad histórica)
 */
export function banoPorKiloPorTipo(banos, tcPonderado) {
  const acc = { oro: { r$: 0, kg: 0 }, plata: { r$: 0, kg: 0 } }
  ;(banos || []).forEach((b) => {
    if (b?.plata_kilos != null || b?.plata_reales != null) {
      acc.plata.r$ += Number(b?.plata_reales) || 0
      acc.plata.kg += Number(b?.plata_kilos) || 0
      acc.oro.r$   += Number(b?.oro_reales) || 0
      acc.oro.kg   += Number(b?.oro_kilos) || 0
    } else {
      const tipo = b?.tipo === 'oro' ? 'oro' : 'plata'
      acc[tipo].r$ += Number(b?.total_clp) || 0
      acc[tipo].kg += Number(b?.kilos) || 0
    }
  })
  return {
    oro:   safeDiv(acc.oro.r$ * tcPonderado, acc.oro.kg),
    plata: safeDiv(acc.plata.r$ * tcPonderado, acc.plata.kg),
  }
}

/**
 * ADUANA (CLP/kg) = sum(aduana_CLP) / sum(aduana_kilos)
 */
export function aduanaPorKilo(pagosAduana) {
  const totalCLP = sum(pagosAduana, (p) => p.total_clp)
  const totalKilos = sum(pagosAduana, (p) => p.kilos)
  return safeDiv(totalCLP, totalKilos)
}

/**
 * COSTO_TOTAL (CLP/kg) = BRUTO + BAÑO + ADUANA
 */
export function costoTotalPorKilo({ bruto, bano, aduana }) {
  return (bruto || 0) + (bano || 0) + (aduana || 0)
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Llegadas / kilos por categoría                                            */
/* ────────────────────────────────────────────────────────────────────────── */

export const CATEGORIAS = ['MICRO', 'CADENA', 'ORO GF']

/**
 * Mapeo de cada categoría al tipo de metal cuyo costo de baño le aplica.
 * MICRO y CADENA son plata; ORO GF es oro.
 */
export const CATEGORIA_TIPO = { MICRO: 'plata', CADENA: 'plata', 'ORO GF': 'oro' }

/**
 * El JSON histórico viene con la clave 'MICROZIRCON' en algunos lugares
 * (costos_ponderados_por_kilo) pero 'MICRO' en otros (llegadas).
 * Esta función normaliza cualquier objeto indexado por categoría
 * a las claves canónicas { MICRO, CADENA, 'ORO GF' }.
 */
export function normalizarPorCategoria(obj = {}) {
  return {
    MICRO: Number(obj.MICRO ?? obj.MICROZIRCON ?? 0) || 0,
    CADENA: Number(obj.CADENA ?? 0) || 0,
    'ORO GF': Number(obj['ORO GF'] ?? obj.ORO_GF ?? 0) || 0,
  }
}

/**
 * Agrega kilos por categoría a través de todos los bloques de llegada.
 * Devuelve { MICRO, CADENA, 'ORO GF', total }.
 */
export function kilosPorCategoria(llegadas) {
  const acc = { MICRO: 0, CADENA: 0, 'ORO GF': 0 }
  ;(llegadas || []).forEach((b) => {
    CATEGORIAS.forEach((cat) => {
      acc[cat] += Number(b?.[cat]) || 0
    })
  })
  // 1% merma al recibir llegadas (igual que 5% en bruto)
  CATEGORIAS.forEach((cat) => { acc[cat] = acc[cat] * MERMA_LLEGADAS })
  acc.total = acc.MICRO + acc.CADENA + acc['ORO GF']
  return acc
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Indicador de fabricación                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * INDICADOR = Σ (kilos_cat × precio_pond_cat) − Σ (kilos_cat × costo_cat/kg)
 *
 * Cada categoría usa su propio costo según el tipo de metal (oro/plata),
 * de modo que el oro no contamina el costo de la plata.
 *
 * @param {Object} costoPorCat  ej. { MICRO: 480000, CADENA: 480000, 'ORO GF': 620000 }
 *
 * Positivo  → los precios ponderados cubren el costo real (ganancia).
 * Negativo  → los precios están por debajo del costo (pérdida → subir precios).
 */
export function indicadorFabricacion(kilosCat, preciosPonderados, costoPorCat) {
  const precios = normalizarPorCategoria(preciosPonderados)
  const ventas = CATEGORIAS.reduce(
    (acc, cat) => acc + (kilosCat[cat] || 0) * (precios[cat] || 0),
    0,
  )
  const costo = CATEGORIAS.reduce(
    (acc, cat) => acc + (kilosCat[cat] || 0) * (costoPorCat?.[cat] || 0),
    0,
  )
  return {
    ventasPonderadas: ventas,
    costoTotal: costo,
    indicador: ventas - costo,
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Cálculo agregado del mes                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Toma el estado completo de un mes y devuelve todos los indicadores.
 *
 * @param {Object} mes
 * @param {Array}  mes.compras_bruto
 * @param {Array}  mes.pagos
 * @param {Array}  mes.banos_completados
 * @param {Array}  mes.llegadas_mercaderia_por_bloque
 * @param {Array}  mes.servicios_completados
 * @param {Array}  mes.pagos_aduana
 * @param {Object} mes.costos_ponderados_por_kilo
 */
const unlock = (arr) => (arr || []).filter((r) => !r._locked)

export function calcularIndicadores(mes) {
  const tc = tipoCambioPonderado(unlock(mes.pagos))
  const bruto = brutoPorKilo(unlock(mes.compras_bruto), unlock(mes.servicios_completados), tc)
  const banos = unlock(mes.banos_completados)
  const banoTipo = banoPorKiloPorTipo(banos, tc)
  const banoBlend = banoPorKilo(banos, tc) // promedio mezclado (referencia)
  const aduana = aduanaPorKilo(unlock(mes.pagos_aduana))

  // Costos separados por metal
  const costoOro   = bruto + banoTipo.oro   + aduana
  const costoPlata = bruto + banoTipo.plata + aduana
  const costoPorCat = {
    MICRO:    costoPlata,
    CADENA:   costoPlata,
    'ORO GF': costoOro,
  }

  // Costo "total" mezclado: solo de referencia / fallback
  const total = bruto + banoBlend + aduana

  const kilos = kilosPorCategoria(unlock(mes.llegadas_mercaderia_por_bloque))
  const ind = indicadorFabricacion(
    kilos,
    mes.costos_ponderados_por_kilo || {},
    costoPorCat,
  )

  return {
    tipoCambio: tc,
    brutoPorKilo: bruto,
    banoPorKilo: banoBlend,
    banoOroPorKilo: banoTipo.oro,
    banoPlataPorKilo: banoTipo.plata,
    aduanaPorKilo: aduana,
    costoTotalPorKilo: total,
    costoOroPorKilo: costoOro,
    costoPlataPorKilo: costoPlata,
    costoPorCategoria: costoPorCat,
    kilos,
    ventasPonderadas: ind.ventasPonderadas,
    costoTotalKilos: ind.costoTotal,
    indicadorFabricacion: ind.indicador,
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Variaciones mes a mes                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Devuelve la variación absoluta y porcentual de un campo entre dos meses.
 * Si el valor anterior es 0, el % queda como null.
 */
export function variacion(actual, anterior) {
  const delta = (actual || 0) - (anterior || 0)
  const pct = anterior ? delta / anterior : null
  return { delta, pct }
}

/**
 * Promedio simple de un campo numérico sobre N meses calculados.
 */
export function promedio(valores) {
  const xs = (valores || []).filter((v) => Number.isFinite(v))
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
}
