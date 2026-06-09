import {
  AlertTriangle,
  Coins,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { formatCLP, formatKilos, formatNumero, formatPct } from '../lib/formato.js'

const COLORS = {
  MICRO: '#0066cc',
  CADENA: '#10b981',
  'ORO GF': '#f59e0b',
}

const COSTO_COLORS = {
  bruto: '#0066cc',
  bano: '#f59e0b',
  aduana: '#6366f1',
}

export default function Dashboard({ estado }) {
  const { indicadores, mesData } = estado
  const {
    tipoCambio,
    brutoPorKilo,
    banoPorKilo,
    aduanaPorKilo,
    costoTotalPorKilo,
    indicadorFabricacion,
    ventasPonderadas,
    costoTotalKilos,
    kilos,
  } = indicadores

  const hayData = (mesData?.compras_bruto?.length || 0) > 0 || (mesData?.pagos?.length || 0) > 0

  if (!hayData) {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 text-amber-500" size={32} />
        <h2 className="text-lg font-semibold">Aún no hay datos en este mes</h2>
        <p className="mt-1 text-sm text-gray-500">
          Anda a la pestaña <span className="font-medium">Entrada</span> y registra
          compras, pagos y baños.
        </p>
      </div>
    )
  }

  const indPositivo = indicadorFabricacion >= 0
  const indColor = indPositivo
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : 'text-red-600 bg-red-50 border-red-200'
  // Margen sobre ventas: más estable que el indicador absoluto para decidir.
  const margenPct = ventasPonderadas > 0 ? indicadorFabricacion / ventasPonderadas : null

  const dataPie = [
    { name: 'MICRO', value: kilos.MICRO || 0 },
    { name: 'CADENA', value: kilos.CADENA || 0 },
    { name: 'ORO GF', value: kilos['ORO GF'] || 0 },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2">
        {/* Costo por kilo */}
        <article className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Costo total / kg
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {formatCLP(costoTotalPorKilo)}
              </p>
            </div>
            <div className="rounded-xl bg-brand-50 p-2 text-brand-600">
              <Coins size={20} />
            </div>
          </div>
          <CostoBar
            bruto={brutoPorKilo}
            bano={banoPorKilo}
            aduana={aduanaPorKilo}
            total={costoTotalPorKilo}
          />
          <ul className="mt-3 space-y-1.5 text-sm">
            <Linea label="Bruto" valor={brutoPorKilo} color={COSTO_COLORS.bruto} total={costoTotalPorKilo} />
            <Linea label="Baño" valor={banoPorKilo} color={COSTO_COLORS.bano} total={costoTotalPorKilo} />
            <Linea label="Aduana" valor={aduanaPorKilo} color={COSTO_COLORS.aduana} total={costoTotalPorKilo} />
          </ul>
        </article>

        {/* Indicador de fabricación */}
        <article className={`card border ${indColor} p-5`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                Indicador de fabricación
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {indPositivo ? '+' : ''}
                {formatCLP(indicadorFabricacion)}
              </p>
              {margenPct !== null && (
                <p className="mt-0.5 text-sm font-semibold opacity-80">
                  {indPositivo ? '+' : ''}
                  {formatPct(margenPct)} sobre ventas
                </p>
              )}
            </div>
            <div className="rounded-xl bg-white/70 p-2">
              {indPositivo ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
          <p className="mt-3 text-sm opacity-80">
            {indPositivo
              ? 'Los precios ponderados cubren el costo del bruto. Margen sano.'
              : 'Estás bajo el costo real. Considera ajustar precios al alza.'}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs opacity-80">
            <div>
              <dt>Ventas pond.</dt>
              <dd className="font-semibold">{formatCLP(ventasPonderadas)}</dd>
            </div>
            <div>
              <dt>Costo total</dt>
              <dd className="font-semibold">{formatCLP(costoTotalKilos)}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {/* TC ponderado */}
        <article className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Tipo de cambio ponderado
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {formatNumero(tipoCambio, 2)}
            <span className="text-base font-medium text-gray-500"> CLP/R$</span>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Calculado como total CLP pagado ÷ total R$ pagado.
          </p>
        </article>

        {/* Total kilos */}
        <article className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Kilos totales
            </p>
            <Scale size={18} className="text-gray-400" />
          </div>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {formatKilos(kilos.total)}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            <KiloLinea label="MICRO" valor={kilos.MICRO} color={COLORS.MICRO} />
            <KiloLinea label="CADENA" valor={kilos.CADENA} color={COLORS.CADENA} />
            <KiloLinea label="ORO GF" valor={kilos['ORO GF']} color={COLORS['ORO GF']} />
          </ul>
        </article>

        {/* Distribución dona */}
        <article className="card p-5 lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Distribución por categoría
          </p>
          <div className="mt-2 h-48">
            {dataPie.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Sin llegadas registradas
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {dataPie.map((d) => (
                      <Cell key={d.name} fill={COLORS[d.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatKilos(v)}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e5e7eb',
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                    verticalAlign="bottom"
                    height={24}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}

function CostoBar({ bruto, bano, aduana, total }) {
  if (!(total > 0)) return null
  const segmentos = [
    { key: 'bruto', valor: bruto },
    { key: 'bano', valor: bano },
    { key: 'aduana', valor: aduana },
  ].filter((s) => s.valor > 0)
  return (
    <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-gray-100">
      {segmentos.map((s) => (
        <div
          key={s.key}
          style={{ width: `${(s.valor / total) * 100}%`, background: COSTO_COLORS[s.key] }}
          title={`${formatPct(s.valor / total)}`}
        />
      ))}
    </div>
  )
}

function Linea({ label, valor, color, total }) {
  const pct = total > 0 ? valor / total : null
  return (
    <li className="flex items-center justify-between text-gray-600">
      <span className="flex items-center gap-2">
        {color && (
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: color }}
          />
        )}
        {label}
        {pct !== null && (
          <span className="text-xs text-gray-400">{formatPct(pct)}</span>
        )}
      </span>
      <span className="font-medium text-gray-900 tabular-nums">{formatCLP(valor)}</span>
    </li>
  )
}

function KiloLinea({ label, valor, color }) {
  return (
    <li className="flex items-center justify-between text-gray-600">
      <span className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: color }}
        />
        {label}
      </span>
      <span className="font-medium text-gray-900">{formatKilos(valor)}</span>
    </li>
  )
}
