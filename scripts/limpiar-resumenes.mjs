/**
 * Elimina de 2026-05 las entradas de compras_bruto que eran resúmenes por mes
 * (detalle = "Diciembre", "Enero", "Febrero", "Marzo", "Abril").
 */
import { initializeApp } from 'firebase/app'
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore'

const app = initializeApp({
  apiKey: "AIzaSyDd08__avGQdPfMaRKViHk-FkksHV7cmTM",
  authDomain: "costos-e-importacion.firebaseapp.com",
  projectId: "costos-e-importacion",
  storageBucket: "costos-e-importacion.firebasestorage.app",
  messagingSenderId: "532504241457",
  appId: "1:532504241457:web:0b605d14f772fe47dd7c10",
})
const db = getFirestore(app)

const RESUMENES = ['diciembre','enero','febrero','marzo','abril']

async function limpiar() {
  const ref  = doc(db, 'calculadora', 'estado')
  const snap = await getDoc(ref)
  const estado = snap.data()

  const mes = '2026-05'
  const antes = estado.meses[mes].compras_bruto || []
  const despues = antes.filter(
    (c) => !RESUMENES.includes((c.detalle || '').toLowerCase().trim())
  )

  console.log(`2026-05 compras_bruto: ${antes.length} → ${despues.length}`)
  console.log('Eliminadas:', antes.filter(c => !despues.includes(c)).map(c => c.detalle))

  estado.meses[mes] = { ...estado.meses[mes], compras_bruto: despues }
  await setDoc(ref, estado)
  console.log('✓ Listo.')
  process.exit(0)
}

limpiar().catch((err) => { console.error(err); process.exit(1) })
