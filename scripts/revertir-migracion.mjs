/**
 * Consolida todos los datos de los meses separados de vuelta a 2026-05
 * para que los cálculos usen todos los datos juntos.
 */
import { initializeApp } from 'firebase/app'
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore'

const app = initializeApp({
  apiKey: "AIzaSyDd08__avGQdPfMaRKViHk-FkksHV7cmTM",
  projectId: "costos-e-importacion",
  appId: "1:532504241457:web:0b605d14f772fe47dd7c10",
})
const db = getFirestore(app)

const snap   = await getDoc(doc(db, 'calculadora', 'estado'))
const estado = snap.data()

// Juntar todas las compras y pagos de todos los meses en uno solo
const todasCompras = []
const todosPagos   = []

const MESES_SEPARADOS = ['2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-06']

for (const [key, mes] of Object.entries(estado.meses)) {
  if (key === '2026-05') continue
  todasCompras.push(...(mes.compras_bruto || []))
  todosPagos.push(...(mes.pagos || []))
  console.log(`Consolidando ${key}: ${(mes.compras_bruto||[]).length} compras, ${(mes.pagos||[]).length} pagos`)
}

// Las compras y pagos que ya estaban en mayo
const comprasMayo = estado.meses['2026-05']?.compras_bruto || []
const pagosMayo   = estado.meses['2026-05']?.pagos || []

// Combinar todo, ordenado por fecha
const comprasTotal = [...todasCompras, ...comprasMayo]
  .sort((a, b) => (a.fecha || '') < (b.fecha || '') ? -1 : 1)
const pagosTotal = [...todosPagos, ...pagosMayo]
  .sort((a, b) => (a.fecha || '') < (b.fecha || '') ? -1 : 1)

// Construir estado consolidado
const nuevoEstado = {
  ...estado,
  mesActivo: '2026-05',
  meses: {
    '2026-05': {
      ...estado.meses['2026-05'],
      compras_bruto: comprasTotal,
      pagos: pagosTotal,
    }
  }
}

// Eliminar los meses separados
for (const k of MESES_SEPARADOS) delete nuevoEstado.meses[k]

console.log(`\n2026-05 consolidado:`)
console.log('  compras_bruto:', comprasTotal.length)
console.log('  pagos:        ', pagosTotal.length)
console.log('  baños:        ', (nuevoEstado.meses['2026-05'].banos_completados||[]).length)
console.log('  llegadas:     ', (nuevoEstado.meses['2026-05'].llegadas_mercaderia_por_bloque||[]).length)
console.log('  pagos_aduana: ', (nuevoEstado.meses['2026-05'].pagos_aduana||[]).length)

await setDoc(doc(db, 'calculadora', 'estado'), nuevoEstado)
console.log('\n✓ Todo consolidado en 2026-05.')
process.exit(0)
