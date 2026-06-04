/**
 * Migración: reemplaza compras_bruto resumidas por mes con datos reales por proveedor.
 * Ejecutar: node scripts/migrar-compras.mjs
 */
import { initializeApp } from 'firebase/app'
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDd08__avGQdPfMaRKViHk-FkksHV7cmTM",
  authDomain: "costos-e-importacion.firebaseapp.com",
  projectId: "costos-e-importacion",
  storageBucket: "costos-e-importacion.firebasestorage.app",
  messagingSenderId: "532504241457",
  appId: "1:532504241457:web:0b605d14f772fe47dd7c10",
}

const app = initializeApp(firebaseConfig)
const db  = getFirestore(app)

// ── Datos reales por mes ──────────────────────────────────────────────────────
// Correcciones aplicadas:
//   Stella → Ring | Alargue/Cadena/Broches/Sellos → Art Sul
//   Vera Lucas → Vera Luccas | Marlucci → Marluci
//   Estrela → Estrella | Dinho/Ds Joyas → Diño
//   Omitido: pago 17-ene R$5.338 / $554.000 (TC=104 anómalo)
const COMPRAS_POR_MES = {
  '2025-12': [
    { fecha: '2025-12-01', detalle: 'Total de bruto', kilos: 172.4,  total_reales: 141104 },
    { fecha: '2025-12-02', detalle: 'Vera Luccas',  kilos: 5.18,   total_reales: 2931   },
    { fecha: '2025-12-03', detalle: 'Art Sul',         kilos: 2.03,   total_reales: 472    },
    { fecha: '2025-12-04', detalle: 'Art Sul',         kilos: 1.105,  total_reales: 466    },
    { fecha: '2025-12-04', detalle: 'Art Sul',         kilos: 2.84,   total_reales: 2418   },
    { fecha: '2025-12-04', detalle: 'Ring',            kilos: 51.5,   total_reales: 17973  },
    { fecha: '2025-12-04', detalle: 'Ystand',          kilos: 9.5,    total_reales: 5015   },
    { fecha: '2025-12-04', detalle: 'Ring',            kilos: 4.88,   total_reales: 1859   },
    { fecha: '2025-12-04', detalle: 'Medusa',          kilos: 6.1,    total_reales: 3907   },
    { fecha: '2025-12-10', detalle: 'Ring',            kilos: 10.43,  total_reales: 2925   },
    { fecha: '2025-12-11', detalle: 'Art Sul',         kilos: 2.144,  total_reales: 498    },
    { fecha: '2025-12-11', detalle: 'Art Sul',         kilos: 7.3,    total_reales: 11031  },
    { fecha: '2025-12-11', detalle: 'Art Sul',         kilos: 1.63,   total_reales: 824    },
    { fecha: '2025-12-12', detalle: 'Ystand',          kilos: 12.67,  total_reales: 15036  },
    { fecha: '2025-12-15', detalle: 'Marluci',         kilos: 2.43,   total_reales: 776    },
  ],
  '2026-01': [
    { fecha: '2026-01-13', detalle: 'Fernando',   kilos: 23.5,   total_reales: 6009  },
    { fecha: '2026-01-13', detalle: 'Medusa',     kilos: 15.95,  total_reales: 13028 },
    { fecha: '2026-01-15', detalle: 'Tucano',     kilos: 14,     total_reales: 12275 },
    { fecha: '2026-01-15', detalle: 'Ring',       kilos: 20.295, total_reales: 4558  },
    { fecha: '2026-01-17', detalle: 'Diño',       kilos: 5.4,    total_reales: 9338  },
    { fecha: '2026-01-17', detalle: 'Linda',      kilos: 15.46,  total_reales: 18014 },
    { fecha: '2026-01-21', detalle: 'Ystand',     kilos: 38,     total_reales: 20668 },
    { fecha: '2026-01-22', detalle: 'Medusa',     kilos: 3.3,    total_reales: 8977  },
    { fecha: '2026-01-15', detalle: 'Marluci',    kilos: 1.995,  total_reales: 752   },
    { fecha: '2026-01-27', detalle: 'Marluci',    kilos: 4.569,  total_reales: 1839  },
    { fecha: '2026-01-28', detalle: 'Art Sul',    kilos: 0.15,   total_reales: 73    },
    { fecha: '2026-01-28', detalle: 'Estrella',   kilos: 1,      total_reales: 522   },
    { fecha: '2026-01-26', detalle: 'Medusa',     kilos: 2.5,    total_reales: 1440  },
    { fecha: '2026-01-27', detalle: 'Medusa',     kilos: 6,      total_reales: 5880  },
    { fecha: '2026-01-28', detalle: 'Vera Luccas',kilos: 3,      total_reales: 3334  },
  ],
  '2026-02': [
    { fecha: '2026-02-02', detalle: 'Marluci',     kilos: 3.25,  total_reales: 1386  },
    { fecha: '2026-02-04', detalle: 'Sanchez',     kilos: 5.73,  total_reales: 9962  },
    { fecha: '2026-02-04', detalle: 'Rolisola',    kilos: 18.78, total_reales: 22866 },
    { fecha: '2026-02-06', detalle: 'Ello Max',    kilos: 1.268, total_reales: 330   },
    { fecha: '2026-02-07', detalle: 'Diño',        kilos: 0.93,  total_reales: 1513  },
    { fecha: '2026-02-10', detalle: 'Rolisola',    kilos: 7.11,  total_reales: 7624  },
    { fecha: '2026-02-11', detalle: 'Ello Max',    kilos: 23.7,  total_reales: 12146 },
    { fecha: '2026-02-13', detalle: 'Ystand',      kilos: 20,    total_reales: 11683 },
    { fecha: '2026-02-13', detalle: 'Linda',       kilos: 31.68, total_reales: 36274 },
    { fecha: '2026-02-13', detalle: 'Tucano',      kilos: 5.6,   total_reales: 6480  },
    { fecha: '2026-02-18', detalle: 'Marluci',     kilos: 1.86,  total_reales: 662   },
    { fecha: '2026-02-19', detalle: 'Metal Sul',   kilos: 7.95,  total_reales: 9498  },
    { fecha: '2026-02-24', detalle: 'Ello Max',    kilos: 2.07,  total_reales: 539   },
    { fecha: '2026-02-24', detalle: 'Marluci',     kilos: 5.9,   total_reales: 3120  },
    { fecha: '2026-02-24', detalle: 'Ystand',      kilos: 1.05,  total_reales: 150   },
    { fecha: '2026-02-25', detalle: 'Metal Sul',   kilos: 13.2,  total_reales: 13473 },
    { fecha: '2026-02-27', detalle: 'Vera Luccas', kilos: 30.59, total_reales: 27487 },
  ],
  '2026-03': [
    { fecha: '2026-03-04', detalle: 'Marluci',     kilos: 2.36,   total_reales: 821   },
    { fecha: '2026-03-06', detalle: 'Metal Sul',   kilos: 9.86,   total_reales: 12658 },
    { fecha: '2026-03-09', detalle: 'Ring',        kilos: 40.295, total_reales: 11213 },
    { fecha: '2026-03-09', detalle: 'Tucano',      kilos: 15.2,   total_reales: 16360 },
    { fecha: '2026-03-09', detalle: 'Medusa',      kilos: 28.73,  total_reales: 16870 },
    { fecha: '2026-03-09', detalle: 'Ystand',      kilos: 11.775, total_reales: 6114  },
    { fecha: '2026-03-13', detalle: 'Marluci',     kilos: 17.325, total_reales: 7372  },
    { fecha: '2026-03-13', detalle: 'Medusa',      kilos: 1.618,  total_reales: 130   },
    { fecha: '2026-03-13', detalle: 'Medusa',      kilos: 9.28,   total_reales: 7200  },
    { fecha: '2026-03-17', detalle: 'Ello Max',    kilos: 3.27,   total_reales: 1088  },
    { fecha: '2026-03-20', detalle: 'Roal',        kilos: 21.03,  total_reales: 7308  },
    { fecha: '2026-03-22', detalle: 'Vera Luccas', kilos: 3.34,   total_reales: 5067  },
    { fecha: '2026-03-23', detalle: 'Ystand',      kilos: 17,     total_reales: 8826  },
    { fecha: '2026-03-24', detalle: 'Metal Sul',   kilos: 9,      total_reales: 8907  },
    { fecha: '2026-03-31', detalle: 'Metal Sul',   kilos: 1.006,  total_reales: 1412  },
    { fecha: '2026-03-31', detalle: 'Diño',        kilos: 10.7,   total_reales: 29685 },
  ],
  '2026-04': [
    { fecha: '2026-04-02', detalle: 'Marluci',    kilos: 4.93,  total_reales: 1782  },
    { fecha: '2026-04-14', detalle: 'New Estilo', kilos: 12.2,  total_reales: 15400 },
    { fecha: '2026-04-14', detalle: 'Linda',      kilos: 19.1,  total_reales: 21502 },
    { fecha: '2026-04-14', detalle: 'Jota',       kilos: 16,    total_reales: 17104 },
    { fecha: '2026-04-14', detalle: 'Ring',       kilos: 4.675, total_reales: 3057  },
    { fecha: '2026-04-14', detalle: 'Ystand',     kilos: 3.53,  total_reales: 2558  },
    { fecha: '2026-04-17', detalle: 'Rolisola',   kilos: 47.7,  total_reales: 46546 },
    { fecha: '2026-04-23', detalle: 'Ello Max',   kilos: 1.764, total_reales: 759   },
    { fecha: '2026-04-24', detalle: 'Estrella',   kilos: 0.1,   total_reales: 52    },
    { fecha: '2026-04-24', detalle: 'Ystand',     kilos: 7.4,   total_reales: 4230  },
    { fecha: '2026-04-28', detalle: 'Art Sul',    kilos: 0.1,   total_reales: 49    },
    { fecha: '2026-04-30', detalle: 'Metal Sul',  kilos: 1.85,  total_reales: 925   },
  ],
}

// ── Pagos reales por mes ─────────────────────────────────────────────────────
const PAGOS_POR_MES = {
  '2025-12': [
    { fecha: '2025-12-01', reales: 141104, chilenos: 26104260 },
    { fecha: '2025-12-04', reales: 5015,   chilenos: 897789   },
    { fecha: '2025-12-04', reales: 3907,   chilenos: 698001   },
    { fecha: '2025-12-04', reales: 19832,  chilenos: 3508567  },
    { fecha: '2025-12-06', reales: 45900,  chilenos: 7990000  },
    { fecha: '2025-12-08', reales: 15036,  chilenos: 2706480  },
    { fecha: '2025-12-12', reales: 33912,  chilenos: 5762779  },
    { fecha: '2025-12-16', reales: 10000,  chilenos: 1704237  },
    { fecha: '2025-12-16', reales: 10000,  chilenos: 1704237  },
    { fecha: '2025-12-16', reales: 10000,  chilenos: 1704237  },
    { fecha: '2025-12-16', reales: 9355,   chilenos: 1578576  },
    { fecha: '2025-12-17', reales: 4782,   chilenos: 801271   },
    { fecha: '2025-12-18', reales: 5218,   chilenos: 885567   },
    { fecha: '2025-12-29', reales: 23788,  chilenos: 3994727  },
  ],
  '2026-01': [
    { fecha: '2026-01-13', reales: 6009,  chilenos: 1050000  },
    { fecha: '2026-01-13', reales: 13028, chilenos: 2214777  },
    { fecha: '2026-01-15', reales: 12275, chilenos: 2086784  },
    { fecha: '2026-01-15', reales: 4558,  chilenos: 774816   },
    { fecha: '2026-01-17', reales: 4000,  chilenos: 700000   },
    // omitido: 17-ene R$5.338/$554.000 (TC=104 anómalo)
    { fecha: '2026-01-17', reales: 18014, chilenos: 3080400  },
    { fecha: '2026-01-20', reales: 8977,  chilenos: 1535067  },
    { fecha: '2026-01-20', reales: 10000, chilenos: 1710000  },
    { fecha: '2026-01-22', reales: 41633, chilenos: 7045320  },
    { fecha: '2026-01-26', reales: 74360, chilenos: 13020500 },
    { fecha: '2026-01-28', reales: 3334,  chilenos: 566780   },
    { fecha: '2026-01-30', reales: 9962,  chilenos: 1713910  },
  ],
  '2026-02': [
    { fecha: '2026-02-01', reales: 10000, chilenos: 1730000  },
    { fecha: '2026-02-02', reales: 5571,  chilenos: 958212   },
    { fecha: '2026-02-02', reales: 4428,  chilenos: 761600   },
    { fecha: '2026-02-04', reales: 22866, chilenos: 3926935  },
    { fecha: '2026-02-07', reales: 1513,  chilenos: 260000   },
    { fecha: '2026-02-09', reales: 9900,  chilenos: 1683000  },
    { fecha: '2026-02-10', reales: 72800, chilenos: 12250000 },
    { fecha: '2026-02-10', reales: 12145, chilenos: 2078418  },
    { fecha: '2026-02-10', reales: 7624,  chilenos: 1311100  },
    { fecha: '2026-02-11', reales: 42946, chilenos: 7198994  },
    { fecha: '2026-02-13', reales: 36274, chilenos: 6195980  },
    { fecha: '2026-02-13', reales: 6480,  chilenos: 1101524  },
    { fecha: '2026-02-13', reales: 9800,  chilenos: 1666000  },
    { fecha: '2026-02-27', reales: 27487, chilenos: 4741942  },
  ],
  '2026-03': [
    { fecha: '2026-03-06', reales: 61021,  chilenos: 11221099 },
    { fecha: '2026-03-09', reales: 11213,  chilenos: 1973463  },
    { fecha: '2026-03-09', reales: 16360,  chilenos: 2879360  },
    { fecha: '2026-03-09', reales: 16870,  chilenos: 3036546  },
    { fecha: '2026-03-09', reales: 6114,   chilenos: 1100520  },
    { fecha: '2026-03-10', reales: 144200, chilenos: 24775000 },
    { fecha: '2026-03-16', reales: 67188,  chilenos: 11914125 },
    { fecha: '2026-03-20', reales: 8826,   chilenos: 1571999  },
    { fecha: '2026-03-22', reales: 5067,   chilenos: 901691   },
    { fecha: '2026-03-25', reales: 2153,   chilenos: 378655   },
    { fecha: '2026-03-31', reales: 29685,  chilenos: 5324240  },
    { fecha: '2026-03-31', reales: 10096,  chilenos: 1823858  },
  ],
}

async function migrar() {
  console.log('Leyendo estado actual de Firestore...')
  const ref  = doc(db, 'calculadora', 'estado')
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    console.error('No existe documento en Firestore.')
    process.exit(1)
  }

  const estado = snap.data()
  console.log('Meses actuales:', Object.keys(estado.meses || {}).sort().join(', '))

  const mesVacio = () => ({
    compras_bruto: [],
    pagos: [],
    banos_completados: [],
    llegadas_mercaderia_por_bloque: [],
    servicios_completados: [],
    pagos_aduana: [],
    costos_ponderados_por_kilo: { MICRO: 570000, CADENA: 405000, 'ORO GF': 1500000 },
  })

  // Crear o actualizar compras_bruto en cada mes
  for (const [mes, compras] of Object.entries(COMPRAS_POR_MES)) {
    const base = estado.meses[mes] || mesVacio()
    console.log(`  compras ${mes}: ${(base.compras_bruto||[]).length} → ${compras.length} ${!estado.meses[mes] ? '(nuevo)' : ''}`)
    estado.meses[mes] = { ...base, compras_bruto: compras }
  }

  // Actualizar pagos en cada mes
  for (const [mes, pagos] of Object.entries(PAGOS_POR_MES)) {
    const base = estado.meses[mes] || mesVacio()
    console.log(`  pagos   ${mes}: ${(base.pagos||[]).length} → ${pagos.length}`)
    estado.meses[mes] = { ...estado.meses[mes], pagos }
  }

  console.log('Guardando en Firestore...')
  await setDoc(ref, estado)
  console.log('✓ Migración completada.')
  process.exit(0)
}

migrar().catch((err) => { console.error('Error:', err); process.exit(1) })
