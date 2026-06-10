import { useCallback, useEffect, useMemo, useState } from 'react'
import datosIniciales from '../data/datos_iniciales.json'
import { calcularIndicadores } from './calculos.js'
import { bucketVacio, loadOrSeed, saveAll } from './storage.js'

/**
 * Hook central. Modelo de POOL ÚNICO: todos los registros viven juntos y los
 * costos se calculan siempre sobre todo el pool. No hay concepto de "mes": la
 * fecha de cada fila es solo un dato, nunca un filtro.
 */
export function useEstado() {
  const [state, setState] = useState(() => loadOrSeed(datosIniciales))

  useEffect(() => {
    saveAll(state)
  }, [state])

  const datos = state.datos || bucketVacio()

  const indicadores = useMemo(() => calcularIndicadores(datos), [datos])

  const tieneDatos =
    (datos.compras_bruto?.length || 0) > 0 || (datos.pagos?.length || 0) > 0

  /** Mergea un partial en el pool y persiste. */
  const updateDatos = useCallback((partial) => {
    setState((s) => ({ ...s, datos: { ...s.datos, ...partial } }))
  }, [])

  const setPreciosPonderados = useCallback((obj) => {
    setState((s) => ({
      ...s,
      datos: { ...s.datos, costos_ponderados_por_kilo: obj },
    }))
  }, [])

  return {
    state,
    setState,
    datos,
    indicadores,
    tieneDatos,
    updateDatos,
    setPreciosPonderados,
  }
}
