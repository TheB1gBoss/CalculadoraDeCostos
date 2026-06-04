/**
 * Rollback: elimina los meses históricos creados y restaura 2026-05
 * al estado original con los resúmenes por mes en compras_bruto.
 */
import { initializeApp } from 'firebase/app'
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore'

const app = initializeApp({
  apiKey: "AIzaSyDd08__avGQdPfMaRKViHk-FkksHV7cmTM",
  projectId: "costos-e-importacion",
  appId: "1:532504241457:web:0b605d14f772fe47dd7c10",
})
const db = getFirestore(app)

// Resúmenes originales (totales calculados del Excel)
const RESUMENES = [
  { fecha: '2025-11-30', detalle: 'Diciembre', kilos: 292.139, total_reales: 207235   },
  { fecha: '2025-12-30', detalle: 'Enero',     kilos: 155.119, total_reales: 106707   },
  { fecha: '2026-01-31', detalle: 'Febrero',   kilos: 180.668, total_reales: 165193   },
  { fecha: '2026-02-28', detalle: 'Marzo',     kilos: 201.789, total_reales: 141031   },
  { fecha: '2026-04-01', detalle: 'Abril',     kilos: 119.349, total_reales: 113964   },
]

const snap   = await getDoc(doc(db, 'calculadora', 'estado'))
const estado = snap.data()

// 1. Restaurar compras_bruto de mayo = resúmenes + compras reales de mayo
const comprasMayo = estado.meses['2026-05'].compras_bruto || []
const soloMayo    = comprasMayo.filter(c => (c.fecha || '').startsWith('2026-05'))
estado.meses['2026-05'] = {
  ...estado.meses['2026-05'],
  compras_bruto: [...RESUMENES, ...soloMayo],
}
console.log(`2026-05 compras restauradas: ${RESUMENES.length} resúmenes + ${soloMayo.length} de mayo = ${RESUMENES.length + soloMayo.length}`)

// 2. Eliminar meses históricos creados por la migración
const BORRAR = ['2025-12','2026-01','2026-02','2026-03','2026-04']
for (const m of BORRAR) {
  if (estado.meses[m]) {
    delete estado.meses[m]
    console.log(`Eliminado: ${m}`)
  }
}

// 3. Asegurar mes activo = mayo
estado.mesActivo = '2026-05'
console.log('mesActivo:', estado.mesActivo)

await setDoc(doc(db, 'calculadora', 'estado'), estado)
console.log('\n✓ Rollback completado.')
process.exit(0)
