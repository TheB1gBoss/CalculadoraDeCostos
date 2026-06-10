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
  const totalR$ = sum(banos, (b) => b.total_clp)
  const totalKilos = sum(banos, (b) => b.kilos)
  return safeDiv(totalR$ * tcPonderado, totalKilos)
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
  acc.total = acc.MICRO + acc.CADENA + acc['ORO GF']
  return acc
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Indicador de fabricación                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * INDICADOR = Σ (kilos_cat × precio_pond_cat) − (kilos_total × costo_total/kg)
 *
 * Positivo  → los precios ponderados cubren el costo real (ganancia).
 * Negativo  → los precios están por debajo del costo (pérdida → subir precios).
 */
export function indicadorFabricacion(kilosCat, preciosPonderados, costoTotal) {
  const precios = normalizarPorCategoria(preciosPonderados)
  const ventas = CATEGORIAS.reduce(
    (acc, cat) => acc + (kilosCat[cat] || 0) * (precios[cat] || 0),
    0,
  )
  const costo = (kilosCat.total || 0) * (costoTotal || 0)
  return {
    ventasPonderadas: ventas,
    costoTotal: costo,
    indicador: ventas - costo,
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Agregado histórico                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

const CAMPOS_LISTA = [
  'compras_bruto',
  'pagos',
  'banos_completados',
  'llegadas_mercaderia_por_bloque',
  'servicios_completados',
  'pagos_aduana',
]

/**
 * Une TODOS los meses en un único dataset agregado.
 *
 * Regla de negocio: los costos se calculan siempre sobre todo el histórico,
 * nunca por mes. El "mes activo" es solo organizativo para la entrada de datos.
 * Esta función concatena las listas de todos los meses; los precios ponderados
 * (config de venta) NO se agregan aquí y se resuelven aparte.
 */
export function mergeMeses(meses = {}) {
  const out = {
    compras_bruto: [],
    pagos: [],
    banos_completados: [],
    llegadas_mercaderia_por_bloque: [],
    servicios_completados: [],
    pagos_aduana: [],
    costos_ponderados_por_kilo: {},
  }
  Object.values(meses || {}).forEach((mes) => {
    if (!mes) return
    CAMPOS_LISTA.forEach((campo) => {
      if (Array.isArray(mes[campo])) out[campo].push(...mes[campo])
    })
  })
  return out
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
export function calcularIndicadores(mes) {
  const tc = tipoCambioPonderado(mes.pagos)
  const bruto = brutoPorKilo(mes.compras_bruto, mes.servicios_completados, tc)
  const bano = banoPorKilo(mes.banos_completados, tc)
  const aduana = aduanaPorKilo(mes.pagos_aduana)
  const total = costoTotalPorKilo({ bruto, bano, aduana })
  const kilos = kilosPorCategoria(mes.llegadas_mercaderia_por_bloque)
  const ind = indicadorFabricacion(
    kilos,
    mes.costos_ponderados_por_kilo || {},
    total,
  )

  return {
    tipoCambio: tc,
    brutoPorKilo: bruto,
    banoPorKilo: bano,
    aduanaPorKilo: aduana,
    costoTotalPorKilo: total,
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
