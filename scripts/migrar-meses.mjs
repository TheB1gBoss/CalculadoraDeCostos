/**
 * Migra todos los datos de 2026-05 a sus meses reales según fecha.
 * Compras y pagos se asignan al mes de su campo fecha.
 * Baños, llegadas y aduana quedan en 2026-05 (mes de procesamiento).
 */
import { initializeApp } from 'firebase/app'
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore'

const app = initializeApp({
  apiKey: "AIzaSyDd08__avGQdPfMaRKViHk-FkksHV7cmTM",
  projectId: "costos-e-importacion",
  appId: "1:532504241457:web:0b605d14f772fe47dd7c10",
})
const db = getFirestore(app)

const mesKey = (fecha) => fecha?.slice(0, 7) // 'YYYY-MM-DD' → 'YYYY-MM'

const snap   = await getDoc(doc(db, 'calculadora', 'estado'))
const estado = snap.data()
const mayo   = estado.meses['2026-05']

// Agrupar compras por mes
const comprasPorMes = {}
for (const c of mayo.compras_bruto || []) {
  const k = mesKey(c.fecha) || '2026-05'
  if (!comprasPorMes[k]) comprasPorMes[k] = []
  comprasPorMes[k].push(c)
}

// Agrupar pagos por mes
const pagosPorMes = {}
for (const p of mayo.pagos || []) {
  const k = mesKey(p.fecha) || '2026-05'
  if (!pagosPorMes[k]) pagosPorMes[k] = []
  pagosPorMes[k].push(p)
}

console.log('=== Distribución compras ===')
for (const [k, v] of Object.entries(comprasPorMes).sort())
  console.log(k, '→', v.length, 'entradas, R$', v.reduce((s,c)=>s+(c.total_reales||0),0).toFixed(2))

console.log('\n=== Distribución pagos ===')
for (const [k, v] of Object.entries(pagosPorMes).sort())
  console.log(k, '→', v.length, 'pagos, R$', v.reduce((s,p)=>s+(p.reales||0),0).toFixed(2))

// Construir estado nuevo
const nuevoEstado = { ...estado, meses: { ...estado.meses } }

// Borrar meses históricos si existían
for (const k of ['2025-12','2026-01','2026-02','2026-03','2026-04','2026-06'])
  delete nuevoEstado.meses[k]

// Crear cada mes con sus compras y pagos
const todosMeses = new Set([...Object.keys(comprasPorMes), ...Object.keys(pagosPorMes)])
for (const k of todosMeses) {
  const esMayo = k === '2026-05'
  nuevoEstado.meses[k] = {
    compras_bruto:                   comprasPorMes[k] || [],
    pagos:                           pagosPorMes[k]   || [],
    // Baños, llegadas y aduana quedan en mayo (son datos de procesamiento del período)
    banos_completados:               esMayo ? (mayo.banos_completados || [])               : [],
    llegadas_mercaderia_por_bloque:  esMayo ? (mayo.llegadas_mercaderia_por_bloque || [])  : [],
    servicios_completados:           esMayo ? (mayo.servicios_completados || [])           : [],
    pagos_aduana:                    esMayo ? (mayo.pagos_aduana || [])                    : [],
    costos_ponderados_por_kilo:      mayo.costos_ponderados_por_kilo,
  }
}

// Mes activo = junio (mes más reciente)
nuevoEstado.mesActivo = '2026-06'

console.log('\n=== Meses resultantes ===')
for (const [k, v] of Object.entries(nuevoEstado.meses).sort())
  console.log(k, '— compras:', v.compras_bruto.length, '| pagos:', v.pagos.length, '| baños:', v.banos_completados.length, '| llegadas:', v.llegadas_mercaderia_por_bloque.length)

console.log('\nmesActivo:', nuevoEstado.mesActivo)

await setDoc(doc(db, 'calculadora', 'estado'), nuevoEstado)
console.log('\n✓ Migración completada.')
process.exit(0)
