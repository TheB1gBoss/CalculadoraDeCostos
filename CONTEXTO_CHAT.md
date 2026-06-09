# CalculadoraDeCostos — Contexto para nuevo chat

## Qué es
PWA de gestión de costos de importación para **Inversiones Aravena SPA** (joyería, importa plata/oro desde Brasil).
- URL producción: `https://theb1gboss.github.io/CalculadoraDeCostos/`
- Repo: `theb1gboss/calculadoradecostos`
- Rama de desarrollo: `claude/ecstatic-wright-2nhUl`

## Stack
- React 18 + Vite 5 + Tailwind CSS 3 (`darkMode: 'class'`)
- Firebase Firestore (persistencia principal) + localStorage (caché offline)
- PWA vía `vite-plugin-pwa`, deploy en rama `gh-pages`

## Paleta Tailwind custom
```
ray-bg:      #050b18
ray-surface: #0b1628
ray-border:  #152338
ray-cyan:    #00d4ff
```

## Estructura de datos en Firestore
Documento único: `calculadora/estado`
```js
{
  mesActivo: 'YYYY-MM',
  meses: {
    'YYYY-MM': {
      compras_bruto:                  [{ fecha, detalle, kilos, total_reales, _ts }],
      pagos:                          [{ fecha, reales, chilenos, _ts }],
      banos_completados:              [{ fecha, plata_kilos, plata_reales, oro_kilos, oro_reales, _ts }],
      llegadas_mercaderia_por_bloque: [{ MICRO, CADENA, 'ORO GF', _ts }],
      servicios_completados:          [{ fecha, detalle, total_reales, _ts }],
      pagos_aduana:                   [{ fecha, kilos, total_clp, _ts }],
      costos_ponderados_por_kilo:     { MICRO, CADENA, 'ORO GF' }  // precios de venta CLP/kg
    }
  }
}
```
`_ts: Date.now()` se agrega a cada entrada nueva (usado por card "Último ingreso").

## Regla crítica de negocio
**TODOS los cálculos usan todos los datos juntos, sin separar por mes.**
El `mesActivo` es solo organizacional. Toda la data real vive en `'2026-05'`.
Separar datos por mes rompe los cálculos — no hacerlo nunca.

## Lógica de cálculo (src/lib/calculos.js)
```
TC ponderado     = Σ(pagos CLP) / Σ(pagos R$)
Bruto/kg         = (compras_R$ + servicios_R$) × TC / (kilos × 0.95)   ← merma 5%
Baño/kg plata    = Σ(plata_reales × TC) / Σ(plata_kilos)
Baño/kg oro      = Σ(oro_reales × TC) / Σ(oro_kilos)
Aduana/kg        = Σ(aduana_CLP) / Σ(aduana_kilos)
Costo plata/kg   = Bruto + Baño_plata + Aduana
Costo oro/kg     = Bruto + Baño_oro + Aduana
Categorías:        MICRO → plata, CADENA → plata, ORO GF → oro
Llegadas          = kilos × 0.99   ← merma 1%
Indicador         = Σ(kilos_cat × precio_ponderado_cat) − Σ(kilos_cat × costo_cat/kg)
                    positivo = ganancia, negativo = precios bajos → subir precios
```
**Ojo:** `banos_completados[].total_clp` se trata como R$ (no CLP). Error histórico de nombre, no se puede cambiar.

## Archivos clave
| Archivo | Rol |
|---|---|
| `src/App.jsx` | Layout, header (sync indicator dot, botón CSV export), tab routing |
| `src/lib/useEstado.js` | Hook central: carga Firestore, persiste, expone todo el estado |
| `src/lib/calculos.js` | Toda la matemática de costos |
| `src/lib/storage.js` | localStorage, helpers `saveMes`, `loadOrSeed` |
| `src/lib/firebase.js` | Init Firebase |
| `src/lib/formato.js` | `formatCLP`, `formatReales`, `formatKilos`, `formatNumero`, `formatPct`, `formatFecha`, `formatMes` |
| `src/components/Ingreso.jsx` | Formularios con `QuickAdd`, autocomplete proveedores, card "Último ingreso" |
| `src/components/Dashboard.jsx` | Resumen visual: indicadores, costos, baños, llegadas, márgenes, variación |
| `src/components/Historial.jsx` | Tablas editables de todos los registros |
| `src/components/TabBar.jsx` | Tabs: Ingreso / Resumen / Historial |
| `src/components/MesSelector.jsx` | Selector simple prev/next + dropdown de meses |

## Lo que retorna useEstado()
```js
{
  state,            // estado completo Firestore (todos los meses)
  setState,
  synced,           // false mientras carga → dot ámbar parpadeante en header
  mesActivo,        // string 'YYYY-MM'
  mesData,          // state.meses[mesActivo]
  mesesOrdenados,   // array de keys ordenadas
  indicadores,      // resultado de calcularIndicadores(mesData)
  setMesActivo,
  updateMes,        // mergea partial en mes activo y persiste
  crearMes,
  eliminarMes,
  setPreciosPonderados,
}
```

## Convención de deploy
```bash
npm run build
# copiar /dist a worktree de gh-pages y pushear a origin gh-pages
# El SW cachea agresivamente → usuarios necesitan Ctrl+Shift+R para ver cambios
```

## Firebase config (hardcodeada)
```js
apiKey:    "AIzaSyDd08__avGQdPfMaRKViHk-FkksHV7cmTM"
projectId: "costos-e-importacion"
appId:     "1:532504241457:web:0b605d14f772fe47dd7c10"
```

## Cosas que NO existen (fueron intentadas y eliminadas)
- Navegador de meses en el header
- Secciones "Evolución histórica" y "Proyección" en Dashboard
- Botones "Duplicar mes" / "Nuevo mes" en MesSelector
- Card "Estado de pagos"
