import { CircleCheck, CircleAlert, CircleX } from 'lucide-react'
import { useState } from 'react'
import { formatCLP, formatPct } from '../lib/formato.js'
import { normalizarPorCategoria } from '../lib/calculos.js'

const CATEGORIAS = [
  { key: 'MICRO', nombre: 'Microzircón', color: 'border-l-brand-500' },
  { key: 'CADENA', nombre: 'Cadena', color: 'border-l-emerald-500' },
  { key: 'ORO GF', nombre: 'Oro GF', color: 'border-l-amber-500' },
]

const MARGEN_DEFAULT = { MICRO: 0.2, CADENA: 0.25, 'ORO GF': 0.5 }

export default function PreciosSugeridos({ estado }) {
  const { indicadores, mesData, state, setPreciosPonderados } = estado
  const costo = indicadores.costoTotalPorKilo
  const preciosPond = normalizarPorCategoria(mesData.costos_ponderados_por_kilo || {})
  const [margenes, setMargenes] = useState(MARGEN_DEFAULT)

  const setMargen = (cat, val) =>
    setMargenes((m) => ({ ...m, [cat]: Number(val) }))

  const aplicarSugeridos = () => {
    const nuevos = CATEGORIAS.reduce((acc, c) => {
      acc[c.key] = Math.round(costo * (1 + margenes[c.key]))
      return acc
    }, {})
    setPreciosPonderados(nuevos)
  }

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Costo de referencia
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{formatCLP(costo)}</p>
        <p className="mt-1 text-xs text-gray-500">
          Costo total por kilo del mes activo (Bruto + Baño + Aduana).
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIAS.map((c) => {
          const precioActual = preciosPond[c.key] || 0
          const margenActual = precioActual > 0 && costo > 0 ? precioActual / costo - 1 : null
          const precioSugerido = Math.round(costo * (1 + margenes[c.key]))
          const bandera = clasificar(margenActual)
          return (
            <article
              key={c.key}
              className={`card border-l-4 ${c.color} p-4`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {c.nombre}
                  </p>
                  <p className="mt-1 text-xl font-bold tracking-tight">
                    {formatCLP(precioActual)}
                  </p>
                  <p className="text-xs text-gray-500">precio ponderado actual</p>
                </div>
                <Bandera tipo={bandera.tipo} margen={margenActual} />
              </div>

              <p className={`mt-2 text-xs font-medium ${bandera.text}`}>{bandera.msg}</p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Margen objetivo</span>
                  <span className="font-semibold text-gray-900">{formatPct(margenes[c.key])}</span>
                </div>
                <input
                  type="range"
                  min="-0.3"
                  max="2"
                  step="0.01"
                  value={margenes[c.key]}
                  onChange={(e) => setMargen(c.key, e.target.value)}
                  className="w-full accent-brand-500"
                  aria-label={`Margen para ${c.nombre}`}
                />
                <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Precio sugerido</span>
                    <span className="font-semibold text-gray-900">{formatCLP(precioSugerido)}</span>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={aplicarSugeridos} className="btn-primary">
          Aplicar precios sugeridos
        </button>
      </div>

      {/* Lista actual de precios venta (referencia) */}
      {state.preciosVenta && Object.keys(state.preciosVenta).length > 0 && (
        <ListaPreciosVenta precios={state.preciosVenta} />
      )}
    </div>
  )
}

function clasificar(margen) {
  if (margen === null || !Number.isFinite(margen))
    return { tipo: 'neutral', text: 'text-gray-500', msg: 'Sin precio definido aún.' }
  if (margen >= 0.2)
    return { tipo: 'ok', text: 'text-emerald-700', msg: `Margen sano (${formatPct(margen)} sobre costo).` }
  if (margen >= 0)
    return { tipo: 'warn', text: 'text-amber-700', msg: `Margen ajustado (${formatPct(margen)} sobre costo).` }
  return { tipo: 'bad', text: 'text-red-700', msg: `Pérdida — el precio cubre solo ${formatPct(1 + margen)} del costo.` }
}

function Bandera({ tipo }) {
  if (tipo === 'ok')
    return <CircleCheck className="text-emerald-500" size={28} aria-label="Buen margen" />
  if (tipo === 'warn')
    return <CircleAlert className="text-amber-500" size={28} aria-label="Margen ajustado" />
  if (tipo === 'bad')
    return <CircleX className="text-red-500" size={28} aria-label="Pérdida" />
  return null
}

function ListaPreciosVenta({ precios }) {
  return (
    <section className="card overflow-hidden">
      <header className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold">Lista actual de precios venta (referencia)</h2>
        <p className="text-xs text-gray-500">Tarifas por tramo de compra, desde la lista comercial.</p>
      </header>
      <div className="space-y-5 p-4">
        {Object.entries(precios).map(([linea, valor]) => (
          <BloquePrecio key={linea} nombre={linea} valor={valor} />
        ))}
      </div>
    </section>
  )
}

function BloquePrecio({ nombre, valor }) {
  const titulo = nombre.replace(/_/g, ' ').toUpperCase()
  // Si "valor" es un objeto plano de tramos (números), renderiza una sola tabla.
  // Si es un objeto de subcategorías (cada una con tramos), renderiza una tabla por subcategoría.
  const esPlano = Object.values(valor).every((v) => typeof v === 'number')

  if (esPlano) {
    return (
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">{titulo}</h3>
        <TablaTramos tramos={valor} />
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">{titulo}</h3>
      <div className="space-y-3">
        {Object.entries(valor).map(([sub, tramos]) => (
          <div key={sub}>
            <p className="text-xs text-gray-500">{sub.replace(/_/g, ' ')}</p>
            <TablaTramos tramos={tramos} />
          </div>
        ))}
      </div>
    </div>
  )
}

function TablaTramos({ tramos }) {
  const labels = {
    desde_30k: 'Desde 30k',
    desde_100k: 'Desde 100k',
    medio_kilo: 'Medio kilo',
    por_kilo: 'Por kilo',
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            {Object.keys(tramos).map((k) => (
              <th key={k} className="px-2 py-1 text-right font-medium">
                {labels[k] || k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {Object.values(tramos).map((v, i) => (
              <td key={i} className="px-2 py-1 text-right font-medium text-gray-900">
                {Number(v).toLocaleString('es-CL')}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
