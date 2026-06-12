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
import { calcularIndicadores, promedio, variacion } from '../lib/calculos.js'
import { formatCLP, formatMes, formatPct } from '../lib/formato.js'

export default function Proyecciones({ estado }) {
  const { state, mesActivo, mesesOrdenados } = estado

  const serie = useMemo(
    () =>
      mesesOrdenados.map((key) => {
        const ind = calcularIndicadores(state.meses[key])
        return {
          mes: key,
          mesLabel: formatMes(key).replace(/ \d{4}$/, ''),
          ...ind,
        }
      }),
    [mesesOrdenados, state.meses],
  )

  const idxActual = serie.findIndex((s) => s.mes === mesActivo)
  const actual = serie[idxActual]
  const anterior = idxActual > 0 ? serie[idxActual - 1] : null

  if (!actual) {
    return (
      <div className="card p-8 text-center text-sm text-gray-500">
        Selecciona un mes para ver proyecciones.
      </div>
    )
  }

  const filas = [
    { key: 'costoTotalPorKilo', label: 'Costo total / kg' },
    { key: 'brutoPorKilo', label: 'Bruto / kg' },
    { key: 'banoPorKilo', label: 'Baño / kg' },
    { key: 'aduanaPorKilo', label: 'Aduana / kg' },
    { key: 'tipoCambio', label: 'TC ponderado', format: (v) => v.toFixed(2) },
    { key: 'indicadorFabricacion', label: 'Indicador fabricación' },
  ]

  const alertas = []
  if (anterior) {
    filas.forEach((f) => {
      const v = variacion(actual[f.key], anterior[f.key])
      if (v.pct !== null && Math.abs(v.pct) >= 0.1 && f.key !== 'tipoCambio') {
        alertas.push({
          label: f.label,
          pct: v.pct,
          delta: v.delta,
          dir: v.pct > 0 ? 'sube' : 'baja',
        })
      }
    })
  }

  // Predicción: promedio últimos 3 meses calculados (los anteriores al actual)
  const ultimos3 = serie.slice(Math.max(0, idxActual - 2), idxActual + 1)
  const prediccion = {
    costoTotalPorKilo: promedio(ultimos3.map((s) => s.costoTotalPorKilo)),
    brutoPorKilo: promedio(ultimos3.map((s) => s.brutoPorKilo)),
    banoPorKilo: promedio(ultimos3.map((s) => s.banoPorKilo)),
    aduanaPorKilo: promedio(ultimos3.map((s) => s.aduanaPorKilo)),
  }

  return (
    <div className="space-y-4">
      {/* Alertas */}
      {alertas.length > 0 && (
        <ul className="space-y-2">
          {alertas.map((a) => {
            const subio = a.pct > 0
            const malo = subio && a.label !== 'Indicador fabricación' // subir el indicador es bueno
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
                  <strong>{a.label}</strong> {a.dir} {formatPct(Math.abs(a.pct))} vs el
                  mes anterior.
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Tabla comparativa */}
      <section className="card overflow-hidden">
        <header className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold">
            {formatMes(actual.mes)} vs {anterior ? formatMes(anterior.mes) : 'sin mes anterior'}
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
                  Anterior
                </th>
                <th scope="col" className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Actual
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
                const isInd = f.key === 'indicadorFabricacion'
                const positiveIsGood = isInd ? true : false
                const colorClass =
                  dir === 'flat'
                    ? 'text-gray-500'
                    : (dir === 'up') === positiveIsGood
                      ? 'text-emerald-600'
                      : 'text-red-600'
                const Icon = dir === 'flat' ? Minus : dir === 'up' ? TrendingUp : TrendingDown
                return (
                  <tr key={f.key} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-gray-700">{f.label}</td>
                    <td className="px-4 py-2 text-right text-gray-500">
                      {anterior ? fmt(va) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-gray-900">
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

      {/* Predicción próximo mes */}
      <section className="card p-5">
        <h2 className="text-sm font-semibold">Predicción próximo mes</h2>
        <p className="text-xs text-gray-500">Promedio simple de los últimos {ultimos3.length} {ultimos3.length === 1 ? 'mes' : 'meses'}.</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Costo total / kg', prediccion.costoTotalPorKilo],
            ['Bruto / kg', prediccion.brutoPorKilo],
            ['Baño / kg', prediccion.banoPorKilo],
            ['Aduana / kg', prediccion.aduanaPorKilo],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="text-base font-semibold text-gray-900">{formatCLP(value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Gráfico de evolución */}
      <section className="card p-4">
        <h2 className="text-sm font-semibold">Evolución del costo por kilo</h2>
        <div className="mt-3 h-72">
          {serie.length < 2 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Se necesitan al menos 2 meses para graficar.
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
                <Line
                  type="monotone"
                  dataKey="costoTotalPorKilo"
                  name="Total"
                  stroke="#0066cc"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="brutoPorKilo"
                  name="Bruto"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="banoPorKilo"
                  name="Baño"
                  stroke="#d4af37"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="aduanaPorKilo"
                  name="Aduana"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  )
}
