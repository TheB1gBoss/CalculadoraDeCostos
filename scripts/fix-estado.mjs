import { initializeApp } from 'firebase/app'
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore'

const app = initializeApp({
  apiKey: "AIzaSyDd08__avGQdPfMaRKViHk-FkksHV7cmTM",
  projectId: "costos-e-importacion",
  appId: "1:532504241457:web:0b605d14f772fe47dd7c10",
})
const db = getFirestore(app)

const RESUMENES = ['diciembre','enero','febrero','marzo','abril']

const snap  = await getDoc(doc(db, 'calculadora', 'estado'))
const estado = snap.data()

// 1. Restaurar mes activo a mayo
console.log('mesActivo antes:', estado.mesActivo)
estado.mesActivo = '2026-05'
console.log('mesActivo ahora:', estado.mesActivo)

// 2. Limpiar resúmenes de 2026-05
const antes   = estado.meses['2026-05'].compras_bruto || []
const despues = antes.filter(c => !RESUMENES.includes((c.detalle||'').toLowerCase().trim()))
console.log(`\n2026-05 compras: ${antes.length} → ${despues.length}`)
console.log('Eliminando:', antes.filter(c => !despues.includes(c)).map(c => c.detalle))
estado.meses['2026-05'] = { ...estado.meses['2026-05'], compras_bruto: despues }

await setDoc(doc(db, 'calculadora', 'estado'), estado)
console.log('\n✓ Guardado en Firestore.')
process.exit(0)
