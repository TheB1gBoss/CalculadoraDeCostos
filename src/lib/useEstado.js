import { useCallback, useEffect, useMemo, useState } from 'react'
import datosIniciales from '../data/datos_iniciales.json'
import { calcularIndicadores, mergeMeses } from './calculos.js'
import {
  deleteMes as storageDeleteMes,
  loadOrSeed,
  saveAll,
  saveMes as storageSaveMes,
} from './storage.js'

/**
 * Hook central. Devuelve el estado completo, la lista de meses, el mes activo,
 * los indicadores calculados y los setters para mutar el estado.
 */
export function useEstado() {
  const [state, setState] = useState(() => loadOrSeed(datosIniciales))

  useEffect(() => {
    saveAll(state)
  }, [state])

  const mesActivo = state.mesActivo
  const mesData = state.meses[mesActivo] || vacioMes()
  const mesesOrdenados = useMemo(
    () => Object.keys(state.meses || {}).sort(),
    [state.meses],
  )

  // Los costos del negocio se calculan SIEMPRE sobre todo el histórico (todos
  // los meses juntos). Los precios ponderados (config de venta) se toman del
  // mes activo, que es la tarifa vigente.
  const datosGlobales = useMemo(() => {
    const merged = mergeMeses(state.meses)
    merged.costos_ponderados_por_kilo =
      mesData.costos_ponderados_por_kilo || merged.costos_ponderados_por_kilo
    return merged
  }, [state.meses, mesData])

  const indicadores = useMemo(
    () => calcularIndicadores(datosGlobales),
    [datosGlobales],
  )

  const tieneDatos =
    datosGlobales.compras_bruto.length > 0 || datosGlobales.pagos.length > 0

  const setMesActivo = useCallback((key) => {
    setState((s) => ({ ...s, mesActivo: key }))
  }, [])

  const updateMes = useCallback(
    (partial) => {
      setState((s) => {
        const prev = s.meses[s.mesActivo] || vacioMes()
        return storageSaveMes(s, s.mesActivo, { ...prev, ...partial })
      })
    },
    [],
  )

  /** Crea un mes vacío nuevo (lo selecciona también). */
  const crearMes = useCallback((key) => {
    setState((s) => {
      if (s.meses[key]) return { ...s, mesActivo: key }
      return storageSaveMes(s, key, vacioMes(s.meses[s.mesActivo]?.costos_ponderados_por_kilo))
    })
  }, [])

  const eliminarMes = useCallback((key) => {
    setState((s) => storageDeleteMes(s, key))
  }, [])

  const setPreciosPonderados = useCallback((obj) => {
    setState((s) => {
      const prev = s.meses[s.mesActivo] || vacioMes()
      return storageSaveMes(s, s.mesActivo, {
        ...prev,
        costos_ponderados_por_kilo: obj,
      })
    })
  }, [])

  return {
    state,
    setState,
    mesActivo,
    mesData,
    mesesOrdenados,
    datosGlobales,
    tieneDatos,
    indicadores,
    setMesActivo,
    updateMes,
    crearMes,
    eliminarMes,
    setPreciosPonderados,
  }
}

function vacioMes(costosBase) {
  return {
    compras_bruto: [],
    pagos: [],
    banos_completados: [],
    llegadas_mercaderia_por_bloque: [],
    servicios_completados: [],
    pagos_aduana: [],
    costos_ponderados_por_kilo:
      costosBase || { MICRO: 570000, CADENA: 405000, 'ORO GF': 1500000 },
  }
}
