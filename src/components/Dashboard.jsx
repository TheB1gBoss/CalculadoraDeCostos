import { AlertTriangle, Coins, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCLP, formatKilos, formatNumero } from '../lib/formato.js'
import { parseNumeroFlexible } from '../lib/formato.js'
import { normalizarPorCategoria } from '../lib/calculos.js'

const COLORS = { MICRO: '#0066cc', CADENA: '#10b981', 'ORO GF': '#f59e0b' }
const DARK_COLORS = { MICRO: '#00d4ff', CADENA: '#34d399', 'ORO GF': '#fbbf24' }

export default function Dashboard({ estado }) {
  const { indicadores, mesData, setPreciosPonderados } = estado
  const {
    tipoCambio, brutoPorKilo, banoPorKilo, aduanaPorKilo,
    costoTotalPorKilo, indicadorFabricacion, ventasPonderadas, costoTotalKilos, kilos,
  } = indicadores

  const hayData = (mesData?.compras_bruto?.length || 0) > 0 || (mesData?.pagos?.length || 0) > 0

  if (!hayData) {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 text-amber-500" size={32} />
        <h2 className="text-lg font-semibold dark:text-white">Aún no hay datos en este mes</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Anda a <span className="font-medium">Compras</span> y registra compras y pagos.
        </p>
      </div>
    )
  }

  const pos = indicadorFabricacion >= 0
  const indCls = pos
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800'
    : 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800'

  const dataPie = [
    { name: 'MICRO',  value: kilos.MICRO  || 0 },
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
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Costo total / kg
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight dark:text-white">
                {formatCLP(costoTotalPorKilo)}
              </p>
            </div>
            <div className="rounded-xl bg-brand-50 p-2 text-brand-600 dark:bg-ray-cyan-dim dark:text-ray-cyan">
              <Coins size={20} />
            </div>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm">
            <Linea label="Bruto"  valor={brutoPorKilo} />
            <Linea label="Baño"   valor={banoPorKilo} />
            <Linea label="Aduana" valor={aduanaPorKilo} />
          </ul>
        </article>

        {/* Indicador de fabricación */}
        <article className={`card border ${indCls} p-5`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                Indicador de fabricación
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {pos ? '+' : ''}{formatCLP(indicadorFabricacion)}
              </p>
            </div>
            <div className="rounded-xl bg-white/70 p-2 dark:bg-white/10">
              {pos ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
          <p className="mt-3 text-sm opacity-80">
            {pos
              ? 'Los precios ponderados cubren el costo del bruto. Margen sano.'
              : 'Estás bajo el costo real. Considera ajustar precios al alza.'}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs opacity-80">
            <div><dt>Ventas pond.</dt><dd className="font-semibold">{formatCLP(ventasPonderadas)}</dd></div>
            <div><dt>Costo total</dt><dd className="font-semibold">{formatCLP(costoTotalKilos)}</dd></div>
          </dl>
        </article>
      </section>

      {/* Precios ponderados editables */}
      <PreciosPonderados
        valores={mesData.costos_ponderados_por_kilo || {}}
        onGuardar={setPreciosPonderados}
      />

      <section className="grid gap-4 lg:grid-cols-3">

        {/* TC ponderado */}
        <article className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
            Tipo de cambio ponderado
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight dark:text-white">
            {formatNumero(tipoCambio, 2)}
            <span className="text-base font-medium text-gray-500 dark:text-slate-400"> CLP/R$</span>
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">
            Total CLP pagado ÷ total R$ pagado.
          </p>
        </article>

        {/* Total kilos */}
        <article className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Kilos totales
            </p>
            <Scale size={18} className="text-gray-400 dark:text-slate-500" />
          </div>
          <p className="mt-1 text-3xl font-bold tracking-tight dark:text-white">
            {formatKilos(kilos.total)}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            <KiloLinea label="MICRO"  valor={kilos.MICRO}       color={COLORS.MICRO} />
            <KiloLinea label="CADENA" valor={kilos.CADENA}      color={COLORS.CADENA} />
            <KiloLinea label="ORO GF" valor={kilos['ORO GF']}  color={COLORS['ORO GF']} />
          </ul>
        </article>

        {/* Distribución dona */}
        <article className="card p-5 lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
            Distribución por categoría
          </p>
          <div className="mt-2 h-48">
            {dataPie.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-slate-600">
                Sin llegadas registradas
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataPie} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {dataPie.map((d) => (
                      <Cell key={d.name} fill={COLORS[d.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatKilos(v)}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} verticalAlign="bottom" height={24} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}

function Linea({ label, valor }) {
  return (
    <li className="flex items-center justify-between text-gray-600 dark:text-slate-400">
      <span>{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{formatCLP(valor)}</span>
    </li>
  )
}

function PreciosPonderados({ valores, onGuardar }) {
  const norm = normalizarPorCategoria(valores)
  const fmt = (v) => (v ? Math.round(v).toLocaleString('es-CL') : '')
  const [form, setForm] = useState({
    MICRO:    fmt(norm.MICRO),
    CADENA:   fmt(norm.CADENA),
    'ORO GF': fmt(norm['ORO GF']),
  })
  const [guardado, setGuardado] = useState(false)

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setGuardado(false) }

  const handleGuardar = () => {
    onGuardar({
      MICRO:    parseNumeroFlexible(form.MICRO),
      CADENA:   parseNumeroFlexible(form.CADENA),
      'ORO GF': parseNumeroFlexible(form['ORO GF']),
    })
    setGuardado(true)
  }

  return (
    <article className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-3">
        Precios ponderados por kg
      </p>
      <div className="grid grid-cols-3 gap-3">
        {['MICRO', 'CADENA', 'ORO GF'].map((cat) => (
          <label key={cat} className="block">
            <span className="label">{cat}</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-ray-cyan select-none">$</span>
              <input
                type="text" inputMode="numeric"
                value={form[cat]}
                onChange={(e) => set(cat, e.target.value)}
                className="input pl-6"
              />
            </div>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={handleGuardar}
        className={`mt-3 w-full rounded-xl px-4 py-2 text-sm font-medium transition ${
          guardado
            ? 'bg-emerald-500 text-white'
            : 'btn-primary'
        }`}
      >
        {guardado ? '✓ Guardado' : 'Guardar precios'}
      </button>
    </article>
  )
}

function KiloLinea({ label, valor, color }) {
  return (
    <li className="flex items-center justify-between text-gray-600 dark:text-slate-400">
      <span className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="font-medium text-gray-900 dark:text-white">{formatKilos(valor)}</span>
    </li>
  )
}
