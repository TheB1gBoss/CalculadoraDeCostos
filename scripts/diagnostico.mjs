import { initializeApp } from 'firebase/app'
import { doc, getDoc, getFirestore } from 'firebase/firestore'

const app = initializeApp({
  apiKey: "AIzaSyDd08__avGQdPfMaRKViHk-FkksHV7cmTM",
  projectId: "costos-e-importacion",
  appId: "1:532504241457:web:0b605d14f772fe47dd7c10",
})
const db = getFirestore(app)

const snap = await getDoc(doc(db, 'calculadora', 'estado'))
const estado = snap.data()

console.log('mesActivo:', estado.mesActivo)
for (const [mes, data] of Object.entries(estado.meses).sort()) {
  console.log(`\n── ${mes} ──`)
  console.log('  compras_bruto:  ', (data.compras_bruto||[]).length, 'entradas')
  console.log('  pagos:          ', (data.pagos||[]).length, 'entradas')
  console.log('  banos:          ', (data.banos_completados||[]).length, 'entradas')
  console.log('  llegadas:       ', (data.llegadas_mercaderia_por_bloque||[]).length, 'entradas')
  console.log('  pagos_aduana:   ', (data.pagos_aduana||[]).length, 'entradas')
  if ((data.compras_bruto||[]).length) {
    const detalles = data.compras_bruto.map(c=>c.detalle).join(', ')
    console.log('  proveedores:    ', detalles.slice(0,120))
  }
}
process.exit(0)
