import { Coins, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { MERMA_LLEGADAS, normalizarPorCategoria } from '../lib/calculos.js'
import { formatCLP, formatFecha, formatKilos, formatNumero, parseNumeroFlexible } from '../lib/formato.js'

const CAT_COLORS = {
  MICRO:   { light: '#0066cc', dark: '#00d4ff',  text: 'text-blue-400'    },
  CADENA:  { light: '#10b981', dark: '#34d399',  text: 'text-emerald-400' },
  'ORO GF':{ light: '#f59e0b', dark: '#fbbf24',  text: 'text-amber-400'   },
}

export default function Dashboard({ estado }) {
  const { indicadores, mesData, setPreciosPonderados } = estado
  const {
    tipoCambio, brutoPorKilo, banoPorKilo, aduanaPorKilo,
    costoTotalPorKilo, indicadorFabricacion, ventasPonderadas, costoTotalKilos, kilos,
  } = indicadores

  const hayData = Object.values(mesData || {}).some((v) => Array.isArray(v) && v.length > 0)

  if (!hayData) {
    return (
      <div className="card p-8 text-center">
        <Coins className="mx-auto mb-3 text-ray-cyan opacity-40" size={32} />
        <h2 className="text-lg font-semibold text-white">Sin datos en este mes</h2>
        <p className="mt-1 text-sm text-slate-400">
          Ve a <span className="font-medium text-ray-cyan">Ingreso</span> y registra compras y pagos.
        </p>
      </div>
    )
  }

  const pos = indicadorFabricacion >= 0
  const indCls = pos
    ? 'border-emerald-800 bg-emerald-900/20 text-emerald-400'
    : 'border-red-800 bg-red-900/20 text-red-400'

  const dataPie = [
    { name: 'MICRO',   value: kilos.MICRO    || 0 },
    { name: 'CADENA',  value: kilos.CADENA   || 0 },
    { name: 'ORO GF',  value: kilos['ORO GF']|| 0 },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-4">

      {/* ── Fila superior: Costo/kg + Indicador ── */}
      <div className="grid gap-4 sm:grid-cols-2">

        <article className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Costo total / kg</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-white">{formatCLP(costoTotalPorKilo)}</p>
            </div>
            <div className="rounded-xl bg-ray-cyan-dim p-2 text-ray-cyan"><Coins size={20} /></div>
          </div>
          <ul className="mt-4 divide-y divide-ray-border text-sm">
            <CostoLinea label="Bruto"  valor={brutoPorKilo}  pct={costoTotalPorKilo ? brutoPorKilo  / costoTotalPorKilo : 0} color="bg-blue-500"    />
            <CostoLinea label="Baño"   valor={banoPorKilo}   pct={costoTotalPorKilo ? banoPorKilo   / costoTotalPorKilo : 0} color="bg-cyan-500"    />
            <CostoLinea label="Aduana" valor={aduanaPorKilo} pct={costoTotalPorKilo ? aduanaPorKilo / costoTotalPorKilo : 0} color="bg-orange-500"  />
          </ul>
        </article>

        <article className={`card border p-5 ${indCls}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Indicador de fabricación</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {pos ? '+' : ''}{formatCLP(indicadorFabricacion)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-2">
              {pos ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
          <p className="mt-3 text-sm opacity-70">
            {pos
              ? 'Los precios ponderados cubren el costo real.'
              : 'Precio por debajo del costo. Considera ajustar al alza.'}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs opacity-70">
            <div><dt>Ventas pond.</dt><dd className="font-semibold">{formatCLP(ventasPonderadas)}</dd></div>
            <div><dt>Costo total</dt><dd className="font-semibold">{formatCLP(costoTotalKilos)}</dd></div>
          </dl>
        </article>
      </div>

      {/* ── Precios ponderados ── */}
      <PreciosPonderados valores={mesData.costos_ponderados_por_kilo || {}} onGuardar={setPreciosPonderados} />

      {/* ── Fila: TC + Kilos + Pie ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        <article className="card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tipo de cambio ponderado</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-white">
            {formatNumero(tipoCambio, 2)}
            <span className="text-sm font-normal text-slate-500"> CLP/R$</span>
          </p>
          <p className="mt-2 text-xs text-slate-600">Total CLP pagado ÷ total R$ pagado</p>
        </article>

        <article className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kilos totales</p>
            <Scale size={16} className="text-slate-600" />
          </div>
          <p className="mt-1 text-3xl font-bold tracking-tight text-white">{formatKilos(kilos.total)}</p>
          <ul className="mt-3 space-y-1.5">
            {['MICRO', 'CADENA', 'ORO GF'].map((cat) => (
              <li key={cat} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CAT_COLORS[cat].dark }} />
                  {cat}
                </span>
                <span className={`font-medium ${CAT_COLORS[cat].text}`}>{formatKilos(kilos[cat])}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-slate-600">Con merma del 1% aplicada</p>
        </article>

        <article className="card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Distribución por categoría</p>
          <div className="h-48">
            {dataPie.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-600">Sin llegadas</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataPie} dataKey="value" nameKey="name" innerRadius={40} outerRadius={68} paddingAngle={2}>
                    {dataPie.map((d) => (
                      <Cell key={d.name} fill={CAT_COLORS[d.name].dark} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [formatKilos(v), '']}
                    contentStyle={{ borderRadius: 10, background: '#0b1628', border: '1px solid #152338', fontSize: 12, color: '#e2e8f0' }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} verticalAlign="bottom" height={24} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </div>

      {/* ── Tabla detalle de llegadas ── */}
      <LlegadasTable llegadas={mesData.llegadas_mercaderia_por_bloque || []} />

    </div>
  )
}

/* ── Linea de costo con barra proporcional ── */
function CostoLinea({ label, valor, pct, color }) {
  return (
    <li className="py-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-white">{formatCLP(valor)}</span>
      </div>
      <div className="h-1 rounded-full bg-ray-border overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
      </div>
    </li>
  )
}

/* ── Tabla de llegadas detallada ── */
function LlegadasTable({ llegadas }) {
  if (!llegadas.length) return null

  const totRaw = { MICRO: 0, CADENA: 0, 'ORO GF': 0 }
  llegadas.forEach((b) => {
    totRaw.MICRO    += Number(b.MICRO)      || 0
    totRaw.CADENA   += Number(b.CADENA)     || 0
    totRaw['ORO GF']+= Number(b['ORO GF']) || 0
  })
  const totMerma = {
    MICRO:    totRaw.MICRO    * MERMA_LLEGADAS,
    CADENA:   totRaw.CADENA   * MERMA_LLEGADAS,
    'ORO GF': totRaw['ORO GF']* MERMA_LLEGADAS,
  }
  const totalRaw   = totRaw.MICRO   + totRaw.CADENA   + totRaw['ORO GF']
  const totalMerma = totMerma.MICRO + totMerma.CADENA + totMerma['ORO GF']

  return (
    <article className="card overflow-hidden p-0">
      <div className="flex items-center justify-between px-5 py-3 border-b border-ray-border">
        <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-400">Detalle de llegadas</h3>
        <span className="text-[10px] text-slate-500">{llegadas.length} {llegadas.length === 1 ? 'envío' : 'envíos'}</span>
      </div>

      {/* Header tabla */}
      <div className="grid grid-cols-[100px_1fr_1fr_1fr_80px] gap-x-2 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <span>Fecha</span>
        <span className="text-center text-blue-500">MICRO</span>
        <span className="text-center text-emerald-500">CADENA</span>
        <span className="text-center text-amber-500">ORO GF</span>
        <span className="text-right">Total</span>
      </div>

      {/* Filas */}
      <div className="divide-y divide-ray-border/50">
        {llegadas.map((b, i) => {
          const rowTotal = (b.MICRO || 0) + (b.CADENA || 0) + (b['ORO GF'] || 0)
          return (
            <div key={i} className="grid grid-cols-[100px_1fr_1fr_1fr_80px] items-center gap-x-2 px-5 py-2.5 hover:bg-ray-border/20 transition-colors">
              <span className="font-mono text-xs text-slate-400">{b.fecha ? formatFecha(b.fecha) : '—'}</span>
              <span className="text-center text-sm font-medium text-blue-300">{formatKilos(b.MICRO)}</span>
              <span className="text-center text-sm font-medium text-emerald-300">{formatKilos(b.CADENA)}</span>
              <span className="text-center text-sm font-medium text-amber-300">{formatKilos(b['ORO GF'])}</span>
              <span className="text-right text-sm font-semibold text-white">{formatKilos(rowTotal)}</span>
            </div>
          )
        })}
      </div>

      {/* Fila totales brutos */}
      <div className="grid grid-cols-[100px_1fr_1fr_1fr_80px] items-center gap-x-2 border-t border-ray-border px-5 py-2.5 bg-ray-border/20">
        <span className="text-[10px] font-bold uppercase text-slate-500">Subtotal</span>
        <span className="text-center text-sm text-slate-300">{formatKilos(totRaw.MICRO)}</span>
        <span className="text-center text-sm text-slate-300">{formatKilos(totRaw.CADENA)}</span>
        <span className="text-center text-sm text-slate-300">{formatKilos(totRaw['ORO GF'])}</span>
        <span className="text-right text-sm font-semibold text-slate-300">{formatKilos(totalRaw)}</span>
      </div>

      {/* Fila totales con merma */}
      <div className="grid grid-cols-[100px_1fr_1fr_1fr_80px] items-center gap-x-2 border-t border-yellow-500/30 px-5 py-2.5 bg-yellow-900/10">
        <span className="text-[10px] font-bold uppercase text-yellow-500">Con merma</span>
        <span className="text-center text-sm font-medium text-blue-300">{formatKilos(totMerma.MICRO)}</span>
        <span className="text-center text-sm font-medium text-emerald-300">{formatKilos(totMerma.CADENA)}</span>
        <span className="text-center text-sm font-medium text-amber-300">{formatKilos(totMerma['ORO GF'])}</span>
        <span className="text-right text-sm font-bold text-yellow-300">{formatKilos(totalMerma)}</span>
      </div>
      <p className="px-5 pb-3 text-[10px] text-slate-600">* 1% de merma aplicado al total acumulado de llegadas</p>
    </article>
  )
}

/* ── Precios ponderados ── */
function PreciosPonderados({ valores, onGuardar }) {
  const fmt = (v) => (v ? Math.round(v).toLocaleString('es-CL') : '')
  const fromValores = (v) => {
    const n = normalizarPorCategoria(v)
    return { MICRO: fmt(n.MICRO), CADENA: fmt(n.CADENA), 'ORO GF': fmt(n['ORO GF']) }
  }
  const [form, setForm] = useState(() => fromValores(valores))
  const [guardado, setGuardado] = useState(false)
  const editing = useRef(false)

  useEffect(() => {
    if (!editing.current) setForm(fromValores(valores))
  }, [valores])

  const set = (k, v) => { editing.current = true; setForm((p) => ({ ...p, [k]: v })); setGuardado(false) }

  const handleGuardar = () => {
    editing.current = false
    onGuardar({
      MICRO:    parseNumeroFlexible(form.MICRO),
      CADENA:   parseNumeroFlexible(form.CADENA),
      'ORO GF': parseNumeroFlexible(form['ORO GF']),
    })
    setGuardado(true)
  }

  return (
    <article className="card p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Precios ponderados por kg</p>
      <div className="grid grid-cols-3 gap-3">
        {['MICRO', 'CADENA', 'ORO GF'].map((cat) => (
          <label key={cat} className="block">
            <span className="label">{cat}</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-ray-cyan select-none">$</span>
              <input type="text" inputMode="numeric" value={form[cat]}
                onChange={(e) => set(cat, e.target.value)} className="input pl-6" />
            </div>
          </label>
        ))}
      </div>
      <button type="button" onClick={handleGuardar}
        className={`mt-3 w-full rounded-xl px-4 py-2 text-sm font-medium transition ${guardado ? 'bg-emerald-500 text-white' : 'btn-primary'}`}>
        {guardado ? '✓ Guardado' : 'Guardar precios'}
      </button>
    </article>
  )
}
