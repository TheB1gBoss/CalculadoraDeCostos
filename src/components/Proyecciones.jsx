import { AlertTriangle, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { calcularIndicadores, mergeMeses, variacion } from '../lib/calculos.js'
import { formatCLP, formatMes, formatPct } from '../lib/formato.js'

/** 'YYYY-MM-DD...' → 'YYYY-MM'. Descarta fechas corruptas (año < 2000). */
function mesDe(fecha) {
  if (typeof fecha !== 'string') return null
  const m = fecha.match(/^(\d{4})-(\d{2})/)
  if (!m || Number(m[1]) < 2000) return null
  return `${m[1]}-${m[2]}`
}

const CAMPOS_CON_FECHA = [
  'compras_bruto',
  'pagos',
  'banos_completados',
  'servicios_completados',
  'pagos_aduana',
]

export default function Proyecciones({ estado }) {
  const { state } = estado

  // Serie ACUMULADA: cada mes usa todos los registros con fecha <= ese mes.
  // Así el costo nunca "se reinicia" por mes; refleja el promedio histórico
  // tal como crece a medida que entran nuevas compras.
  const serie = useMemo(() => {
    const datos = mergeMeses(state.meses)
    const mesesSet = new Set()
    CAMPOS_CON_FECHA.forEach((campo) => {
      datos[campo].forEach((r) => {
        const mm = mesDe(r.fecha)
        if (mm) mesesSet.add(mm)
      })
    })
    const mesesSerie = [...mesesSet].sort()

    return mesesSerie.map((M) => {
      const hasta = (arr) => arr.filter((r) => mesDe(r.fecha) <= M)
      const parcial = {
        compras_bruto: hasta(datos.compras_bruto),
        pagos: hasta(datos.pagos),
        banos_completados: hasta(datos.banos_completados),
        servicios_completados: hasta(datos.servicios_completados),
        pagos_aduana: hasta(datos.pagos_aduana),
        llegadas_mercaderia_por_bloque: [],
        costos_ponderados_por_kilo: datos.costos_ponderados_por_kilo,
      }
      const ind = calcularIndicadores(parcial)
      return {
        mes: M,
        mesLabel: formatMes(M).replace(/ \d{4}$/, ''),
        ...ind,
      }
    })
  }, [state.meses])

  if (serie.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-gray-500">
        Sin registros con fecha válida para construir la evolución histórica.
      </div>
    )
  }

  const actual = serie[serie.length - 1]
  const anterior = serie.length > 1 ? serie[serie.length - 2] : null

  const filas = [
    { key: 'costoTotalPorKilo', label: 'Costo total / kg' },
    { key: 'brutoPorKilo', label: 'Bruto / kg' },
    { key: 'banoPorKilo', label: 'Baño / kg' },
    { key: 'aduanaPorKilo', label: 'Aduana / kg' },
    { key: 'tipoCambio', label: 'TC ponderado', format: (v) => v.toFixed(2) },
  ]

  const alertas = []
  if (anterior) {
    filas.forEach((f) => {
      if (f.key === 'tipoCambio') return
      const v = variacion(actual[f.key], anterior[f.key])
      if (v.pct !== null && Math.abs(v.pct) >= 0.1) {
        alertas.push({ label: f.label, pct: v.pct, dir: v.pct > 0 ? 'subió' : 'bajó' })
      }
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Evolución <span className="font-medium text-gray-700">acumulada</span> del
        costo por kilo. Cada mes considera todas las compras, pagos y baños
        registrados hasta esa fecha (promedio histórico, no el mes aislado).
      </p>

      {/* Alertas */}
      {alertas.length > 0 && (
        <ul className="space-y-2">
          {alertas.map((a) => {
            const malo = a.pct > 0 // un costo que sube es malo
            const color = malo
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            return (
              <li
                key={a.label}
                className={`flex items-center gap-3 rounded-xl border ${color} px-3 py-2 text-sm`}
              >
                <AlertTriangle size={16} aria-hidden />
                <span>
                  El costo acumulado de <strong>{a.label}</strong> {a.dir}{' '}
                  {formatPct(Math.abs(a.pct))} al incorporar {formatMes(actual.mes)}.
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Tabla comparativa: últimos dos cortes acumulados */}
      <section className="card overflow-hidden">
        <header className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold">
            Acumulado a {formatMes(actual.mes)}
            {anterior ? ` vs ${formatMes(anterior.mes)}` : ''}
          </h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Indicador
                </th>
                <th scope="col" className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Antes
                </th>
                <th scope="col" className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Ahora
                </th>
                <th scope="col" className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Δ
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const fmt = f.format || formatCLP
                const va = anterior ? anterior[f.key] : null
                const vb = actual[f.key]
                const v = variacion(vb, va)
                const dir = v.pct === null ? 'flat' : v.pct > 0.001 ? 'up' : v.pct < -0.001 ? 'down' : 'flat'
                // En costos, subir es malo (rojo) y bajar es bueno (verde).
                const colorClass =
                  dir === 'flat'
                    ? 'text-gray-500'
                    : dir === 'down'
                      ? 'text-emerald-600'
                      : 'text-red-600'
                const Icon = dir === 'flat' ? Minus : dir === 'up' ? TrendingUp : TrendingDown
                return (
                  <tr key={f.key} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-gray-700">{f.label}</td>
                    <td className="px-4 py-2 text-right text-gray-500 tabular-nums">
                      {anterior ? fmt(va) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-gray-900 tabular-nums">
                      {fmt(vb)}
                    </td>
                    <td className={`px-4 py-2 text-right font-medium ${colorClass}`}>
                      <span className="inline-flex items-center justify-end gap-1">
                        <Icon size={14} aria-hidden />
                        {v.pct === null ? '—' : formatPct(v.pct)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Gráfico de evolución acumulada */}
      <section className="card p-4">
        <h2 className="text-sm font-semibold">Evolución del costo por kilo (acumulado)</h2>
        <div className="mt-3 h-72">
          {serie.length < 2 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Se necesitan registros en al menos 2 meses para graficar.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mesLabel" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={48}
                />
                <Tooltip
                  formatter={(v) => formatCLP(v)}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="costoTotalPorKilo" name="Total" stroke="#0066cc" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="brutoPorKilo" name="Bruto" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="banoPorKilo" name="Baño" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="aduanaPorKilo" name="Aduana" stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  )
}
