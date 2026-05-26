# 📊 Calculadora Importaciones 2.0 — Inversiones Aravena SPA

> Especificación completa del proyecto. Léeme primero antes de programar.

---

## 🎯 Contexto del negocio

Inversiones Aravena SPA importa joyería desde Brasil (oro/plata sin procesar, "bruto") y la procesa en Chile (baños) para venderla. El cálculo del costo real por kilo es complejo porque involucra:

- Múltiples compras de bruto en reales (R$)
- Pagos al exterior con tipo de cambio que varía cada vez
- Baños/procesamiento en CLP
- Pagos de aduana
- Distribución de mercadería en 3 categorías: **MICRO** (microzircon), **CADENA**, **ORO GF**

La calculadora reemplaza un Excel con fórmulas enlazadas (hoja IMPORTACION del libro `INVERSIONES ARAVENA SPA 2026.xlsx`).

---

## 🧮 Lógica de cálculo (FUNDAMENTAL)

### Fórmula maestra

```
COSTO_POR_KILO_TOTAL = BRUTO + BAÑO + ADUANA
```

### Componentes

**1. BRUTO (CLP por kilo)**
```
BRUTO = (suma_pagos_CLP + servicios_completados_CLP) / kilos_totales_compra
```
- `suma_pagos_CLP`: total chileno pagado al exterior por las compras
- `servicios_completados_CLP`: servicios facturados en R$ × tipo_cambio_ponderado
- `kilos_totales_compra`: suma de kilos comprados × 0.95 (merma estándar 5%)

**2. BAÑO (CLP por kilo)**
```
BAÑO = costo_total_baños_CLP / kilos_total_baños
```
Costo promedio de procesamiento (baño electrolítico).

**3. ADUANA (CLP por kilo)**
```
ADUANA = costo_total_aduana_CLP / kilos_total_aduana
```

### Tipo de cambio ponderado

Cada pago al exterior tiene su propio tipo de cambio (CLP/R$). Se calcula el ponderado:
```
TC_ponderado = total_CLP_pagado / total_R$_pagado
```

### Costos ponderados por categoría

Cada categoría tiene un costo base (configurable):
- MICROZIRCON: $570.000/kg (referencia actual)
- CADENA: $405.000/kg
- ORO GF: $1.500.000/kg

### Indicador de fabricación (CLAVE del negocio)

Mide si las ventas a precio ponderado cubren el costo del bruto:
```
INDICADOR = Σ (kilos_categoría × precio_ponderado_categoría) − (kilos_total × costo_bruto_real)
```
- **Positivo** = ganancia, los precios están bien
- **Negativo** = pérdida, hay que ajustar precios al alza

---

## 🏗️ Arquitectura propuesta

### Stack
- **React + Vite** (rápido, simple, SPA)
- **Tailwind CSS** para estilos (mobile-first)
- **Recharts** para gráficos
- **localStorage** para persistir datos (sin backend, todo cliente)
- **xlsx** (SheetJS) para importar/exportar Excel
- **lucide-react** para íconos

### Estructura de archivos sugerida

```
calculadora-importaciones/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   ├── TabBar.jsx
│   │   ├── EntradaDatos.jsx       # Pestaña 1: registro mensual
│   │   ├── Dashboard.jsx           # Pestaña 2: indicadores del mes
│   │   ├── Proyecciones.jsx        # Pestaña 3: comparativas
│   │   ├── PreciosSugeridos.jsx    # Pestaña 4: precios venta
│   │   ├── Historial.jsx           # Pestaña 5: meses guardados
│   │   └── forms/
│   │       ├── ComprasBrutoForm.jsx
│   │       ├── PagosForm.jsx
│   │       ├── BanosForm.jsx
│   │       ├── LlegadasForm.jsx
│   │       └── ServiciosForm.jsx
│   ├── lib/
│   │   ├── calculos.js             # toda la lógica de cálculo
│   │   ├── storage.js              # localStorage helpers
│   │   ├── excel.js                # importar/exportar xlsx
│   │   └── formato.js              # formato CLP, R$, kilos
│   └── data/
│       └── datos_iniciales.json    # cargar al primer arranque
├── index.html
├── package.json
└── vite.config.js
```

---

## 🎨 Diseño de UI (pestañas)

### Pestaña 1: 📥 Entrada de datos
Selector de mes arriba (default: mes actual).
5 acordeones colapsables:
1. **Compras de bruto** — tabla editable: fecha, detalle, kilos, total R$
2. **Pagos al exterior** — fecha, R$, CLP (calcula ponderación auto)
3. **Baños completados** — fecha, número, kilos, total CLP
4. **Llegadas de mercadería** — bloques por embarque: kilos por categoría (Micro/Cadena/Oro GF)
5. **Servicios y aduana** — fecha, detalle, R$ o CLP

Botón "Guardar mes" al final.

### Pestaña 2: 📊 Dashboard
Cards grandes con los KPIs del mes seleccionado:
- 💰 Costo total por kilo (con desglose: Bruto + Baño + Aduana)
- 📈 Indicador de fabricación (verde si +, rojo si –)
- 💱 Tipo de cambio ponderado
- ⚖️ Kilos totales (Micro / Cadena / Oro GF) — gráfico de dona

### Pestaña 3: 📈 Proyecciones
- Tabla comparativa: mes actual vs mes anterior (Δ% en cada componente)
- Alertas automáticas tipo: "⚠️ El costo de baño subió 15% vs el mes pasado"
- Gráfico de líneas: evolución del costo por kilo en los últimos meses
- Predicción simple del próximo mes (promedio últimos 3 meses)

### Pestaña 4: 💰 Precios sugeridos
- Por categoría: costo + margen objetivo (slider) = precio recomendado
- Comparación con lista actual de precios venta (NACIONAL SL925, ITALIANA, GF 18K)
- Banderas: 🟢 buen margen, 🟡 margen ajustado, 🔴 estás perdiendo

### Pestaña 5: 💾 Historial
- Lista de todos los meses guardados
- Exportar mes individual o todos a Excel
- Importar Excel (para sincronizar con el libro original)

---

## 📦 Datos iniciales (cargar al primer arranque)

El archivo `datos_iniciales.json` (adjunto) contiene:
- Compras de bruto desde diciembre 2025 hasta mayo 2026
- Pagos al exterior del período
- Baños completados
- Llegadas de mercadería (9 bloques)
- Servicios completados y aduana
- Precios ponderados por categoría
- Histórico de costos de joyas (5 meses)
- Lista actual de precios venta

**Valores de referencia actuales (del Excel):**
| Indicador | Valor |
|-----------|-------|
| Tipo de cambio | 181 CLP/R$ |
| Costo total por kilo | $496.922 |
| - Bruto | $166.524 |
| - Baño | $302.786 |
| - Aduana | $27.613 |
| Indicador de fabricación | +$4.283.228 |
| Kilos MICRO | 319,95 |
| Kilos CADENA | 369,73 |
| Kilos ORO GF | 14,84 |
| **Total kilos** | **704,53** |

---

## 🚀 Instrucciones de implementación

### Setup inicial
```bash
npm create vite@latest calculadora-importaciones -- --template react
cd calculadora-importaciones
npm install
npm install -D tailwindcss postcss autoprefixer
npm install recharts lucide-react xlsx
npx tailwindcss init -p
```

### Configurar Tailwind
En `tailwind.config.js`, content: `["./index.html", "./src/**/*.{js,jsx}"]`
En `src/index.css`: las 3 directivas `@tailwind`.

### Orden de desarrollo recomendado
1. ✅ **`lib/calculos.js`** primero — todas las fórmulas puras, testeable
2. ✅ **`lib/storage.js`** — guardar/leer localStorage
3. ✅ **`data/datos_iniciales.json`** — copiar del paquete
4. ✅ **Dashboard** (pestaña 2) — mostrar los KPIs con datos iniciales
5. ✅ **Entrada de datos** (pestaña 1) — formularios CRUD
6. ✅ **Historial** (pestaña 5) — selector de mes + persistencia
7. ✅ **Proyecciones** (pestaña 3) — comparativas mes a mes
8. ✅ **Precios sugeridos** (pestaña 4) — margen sobre costo
9. ✅ **Export/import Excel** — última feature

### Diseño visual
- **Mobile-first**: prueba siempre en pantalla angosta primero
- **Colores**: paleta sobria. Sugerencia:
  - Fondo: gris muy claro (`#f8f9fa`) o blanco
  - Acentos: azul `#0066cc` o índigo
  - Verde para positivo (`#10b981`), rojo para negativo (`#ef4444`)
  - Amarillo para alertas (`#f59e0b`)
- **Tipografía**: Inter o system fonts
- **Cards** con `rounded-2xl shadow-sm border` (estilo moderno)
- **Iconos** de lucide-react (Coins, TrendingUp, AlertTriangle, etc.)

### Para GitHub Pages (despliegue)
En `vite.config.js`:
```js
export default {
  base: '/nombre-del-repo/',
  plugins: [react()]
}
```
Luego: `npm run build` y publicar la carpeta `dist/` en la rama `gh-pages`.

---

## ⚠️ Reglas importantes

1. **Nunca hardcodear valores monetarios** — siempre desde el JSON o el state
2. **Todas las fórmulas en `lib/calculos.js`** — separadas de UI para que sean testeables
3. **Validar inputs**: si el usuario escribe texto en un campo numérico, no romper
4. **Formato CLP**: `$496.922` (punto como separador de miles, sin decimales)
5. **Formato R$**: `R$ 1.234,56` (estándar brasileño)
6. **Formato kilos**: 3 decimales (`172,400 kg`)
7. **Fechas**: formato chileno `dd/mm/aaaa` en UI, ISO en storage
8. **Locale**: `es-CL` en `Intl.NumberFormat` y `Intl.DateTimeFormat`

---

## 🔮 Roadmap (futuras versiones)

**v1** (esta): solo IMPORTACION
**v2**: agregar VENTAS PERSONALES (las vendedoras: Valentina, Cris, Benjamin, Amanda)
**v3**: agregar VENTAS PRESENCIALES (caja de tienda)
**v4**: integración con WhatsApp para notificaciones
**v5**: app móvil nativa (React Native o Capacitor)

---

## 📞 Datos del proyecto

- **Dueño**: Diego Aravena Vera
- **Empresa**: Inversiones Aravena SPA
- **Repositorio GitHub**: (nuevo, en cuenta personal)
- **Fuente de datos**: `INVERSIONES ARAVENA SPA 2026.xlsx` (OneDrive personal)
