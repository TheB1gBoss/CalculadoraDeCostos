import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import datosIniciales from '../data/datos_iniciales.json'
import { calcularIndicadores, mergeMeses } from './calculos.js'
import { db } from './firebase.js'
import {
  deleteMes as storageDeleteMes,
  loadOrSeed,
  saveAll,
  saveMes as storageSaveMes,
} from './storage.js'

const FIRESTORE_DOC = doc(db, 'calculadora', 'estado')

export function useEstado() {
  const [state, setState] = useState(() => loadOrSeed(datosIniciales))
  const [synced, setSynced] = useState(false)
  const skipNextSave = useRef(false)

  /* ── Cargar desde Firestore al inicio ── */
  useEffect(() => {
    getDoc(FIRESTORE_DOC).then((snap) => {
      if (snap.exists()) {
        const data = snap.data()
        skipNextSave.current = true
        setState(data)
        saveAll(data)
      }
      setSynced(true)
    }).catch(() => setSynced(true))
  }, [])

  /* ── Guardar en localStorage + Firestore cuando cambia el estado ── */
  useEffect(() => {
    if (!synced) return
    saveAll(state)
    if (skipNextSave.current) { skipNextSave.current = false; return }
    setDoc(FIRESTORE_DOC, state).catch(console.error)
  }, [state, synced])

  const mesActivo = state.mesActivo
  const mesData = state.meses[mesActivo] || vacioMes()
  const mesesOrdenados = useMemo(
    () => Object.keys(state.meses || {}).sort(),
    [state.meses],
  )
  // Los costos se calculan SIEMPRE sobre todo el histórico (todos los meses
  // juntos), nunca por mes. La tarifa de precios ponderados se toma del mes
  // activo (config de venta vigente).
  const indicadores = useMemo(() => {
    const merged = mergeMeses(state.meses)
    merged.costos_ponderados_por_kilo =
      mesData.costos_ponderados_por_kilo || merged.costos_ponderados_por_kilo
    return calcularIndicadores(merged)
  }, [state.meses, mesData])

  const setMesActivo = useCallback((key) => {
    setState((s) => ({ ...s, mesActivo: key }))
  }, [])

  const updateMes = useCallback((partial) => {
    setState((s) => {
      const prev = s.meses[s.mesActivo] || vacioMes()
      return storageSaveMes(s, s.mesActivo, { ...prev, ...partial })
    })
  }, [])

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
      return storageSaveMes(s, s.mesActivo, { ...prev, costos_ponderados_por_kilo: obj })
    })
  }, [])

  return {
    state, setState, synced,
    mesActivo, mesData, mesesOrdenados, indicadores,
    setMesActivo, updateMes, crearMes, eliminarMes, setPreciosPonderados,
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
