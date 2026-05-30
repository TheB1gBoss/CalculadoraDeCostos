import { Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { calcularIndicadores, MERMA_LLEGADAS, normalizarPorCategoria, variacion } from '../lib/calculos.js'
import { formatCLP, formatFecha, formatKilos, formatNumero, formatPct } from '../lib/formato.js'

const CAT_COLORS = {
  MICRO:    { dark: '#00d4ff', text: 'text-blue-400'    },
  CADENA:   { dark: '#34d399', text: 'text-emerald-400' },
  'ORO GF': { dark: '#fbbf24', text: 'text-amber-400'   },
}

/* ── Regresión lineal simple ── */
function linReg(vals) {
  const n = vals.length
  if (n < 2) return null
  const sx = n * (n - 1) / 2
  const sx2 = vals.reduce((s, _, i) => s + i * i, 0)
  const sy = vals.reduce((s, v) => s + v, 0)
  const sxy = vals.reduce((s, v, i) => s + i * v, 0)
  const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx)
  const intercept = (sy - slope * sx) / n
  return (x) => Math.max(0, slope * x + intercept)
}

function nextMonthKey(yyyyMm, offset) {
  const [y, m] = yyyyMm.split('-').map(Number)
  const d = new Date(y, m - 1 + offset, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function mesLabel(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number)
  return new Intl.DateTimeFormat('es-CL', { month: 'short', year: '2-digit' }).format(new Date(y, m - 1, 1))
}

export default function Dashboard({ estado }) {
  const { indicadores, mesData, mesesOrdenados, mesActivo, state } = estado
  const {
    tipoCambio, brutoPorKilo, banoPorKilo, banoOroPorKilo, banoPlataPorKilo, aduanaPorKilo,
    costoTotalPorKilo, costoOroPorKilo, costoPlataPorKilo, costoPorCategoria,
    indicadorFabricacion, kilos,
  } = indicadores

  const hayData = Object.values(mesData || {}).some((v) => Array.isArray(v) && v.length > 0)

  if (!hayData) {
    return (
      <div className="card p-8 text-center">
        <p className="text-lg font-semibold text-white">Sin datos en este mes</p>
        <p className="mt-1 text-sm text-slate-400">Ve a <span className="font-medium text-ray-cyan">Ingreso</span> y registra compras y pagos.</p>
      </div>
    )
  }

  /* ── Historial de meses calculado ── */
  const historial = mesesOrdenados.map((key) => ({ key, ind: calcularIndicadores(state.meses[key]) }))
  const currentIdx = mesesOrdenados.indexOf(mesActivo)
  const prevInd = currentIdx > 0 ? historial[currentIdx - 1].ind : null

  /* ── Proyección por regresión ── */
  const tcVals    = historial.map((h) => h.ind.tipoCambio)
  const costoVals = historial.map((h) => h.ind.costoTotalPorKilo)
  const tcFn      = linReg(tcVals)
  const costoFn   = linReg(costoVals)
  const n         = historial.length
  const lastKey   = mesesOrdenados[mesesOrdenados.length - 1]
  const proyecciones = [1, 2, 3].map((off) => ({
    key:   nextMonthKey(lastKey, off),
    tc:    tcFn    ? tcFn(n - 1 + off)    : null,
    costo: costoFn ? costoFn(n - 1 + off) : null,
  }))

  /* ── Rentabilidad por categoría (cada una con su costo según metal) ── */
  const precios = normalizarPorCategoria(mesData.costos_ponderados_por_kilo || {})
  const margenes = ['MICRO', 'CADENA', 'ORO GF'].map((cat) => {
    const precio = precios[cat] || 0
    const costoCat = costoPorCategoria?.[cat] || 0
    const margen = precio - costoCat
    const margenPct = costoCat ? margen / costoCat : 0
    const kilosCat = kilos[cat] || 0
    const gananciaTotal = margen * kilosCat
    return { cat, precio, costoCat, margen, margenPct, kilosCat, gananciaTotal, ok: margen >= 0 }
  })

  /* ── Pie chart ── */
  const dataPie = ['MICRO', 'CADENA', 'ORO GF']
    .map((cat) => ({ name: cat, value: kilos[cat] || 0 }))
    .filter((d) => d.value > 0)

  const pos = indicadorFabricacion >= 0

  return (
    <div className="space-y-4">

      {/* ── 1. Indicador de fabricación (solo número) ── */}
      <article className={`card border p-5 ${pos
        ? 'border-emerald-800 bg-emerald-900/20 text-emerald-400'
        : 'border-red-800 bg-red-900/20 text-red-400'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Indicador de fabricación</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">
              {pos ? '+' : ''}{formatCLP(indicadorFabricacion)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            {pos ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
        </div>
      </article>

      {/* ── 2. Costo por kg separado Oro / Plata ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <CostoCard
          titulo="Costo Plata / kg" acento="text-slate-200"
          total={costoPlataPorKilo}
          filas={[
            { label: 'Bruto',  val: brutoPorKilo },
            { label: 'Baño plata', val: banoPlataPorKilo },
            { label: 'Aduana', val: aduanaPorKilo },
          ]}
        />
        <CostoCard
          titulo="Costo Oro / kg" acento="text-amber-300"
          total={costoOroPorKilo}
          filas={[
            { label: 'Bruto',  val: brutoPorKilo },
            { label: 'Baño oro', val: banoOroPorKilo },
            { label: 'Aduana', val: aduanaPorKilo },
          ]}
        />
      </div>

      {banoOroPorKilo === 0 && (kilos['ORO GF'] || 0) > 0 && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/15 px-4 py-3 text-xs text-amber-300">
          ⚠ Tienes kilos de <span className="font-semibold">ORO GF</span> pero ningún baño marcado como <span className="font-semibold">Oro</span>.
          Ve a <span className="font-semibold">Historial → Baños Procesados</span> y edita cada baño de oro para marcarlo, así su costo no se mezcla con la plata.
        </div>
      )}

      {/* ── 3. Rentabilidad por categoría ── */}
      <article className="card p-5">
        <p className="text-lg font-bold text-white mb-1">Rentabilidad por Categoría</p>
        <p className="mb-4 text-xs text-slate-500">
          Cada categoría usa su costo real según el metal (oro/plata).
          <span className="mx-2 text-slate-700">·</span>
          Ganancia total: <span className={`font-semibold ${margenes.reduce((s,m)=>s+m.gananciaTotal,0)>=0?'text-emerald-400':'text-red-400'}`}>
            {formatCLP(margenes.reduce((s,m)=>s+m.gananciaTotal,0))}
          </span>
        </p>
        <div className="space-y-4">
          {margenes.map(({ cat, precio, costoCat, margen, margenPct, kilosCat, gananciaTotal, ok }) => (
            <div key={cat}>
              {/* Cabecera de categoría */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CAT_COLORS[cat].dark }} />
                  <span className="font-bold text-white">{cat}</span>
                  <span className="text-xs text-slate-500">{formatKilos(kilosCat)}</span>
                  <span className="text-[10px] text-slate-600">· equilibrio {formatCLP(costoCat)}</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>{formatPct(margenPct)}</span>
              </div>
              {/* Detalle numérico */}
              <div className="grid grid-cols-3 gap-2 mb-2 text-center">
                <div className="rounded-lg bg-ray-border/40 px-2 py-1.5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Precio/kg</p>
                  <p className="text-sm font-semibold text-white">{formatCLP(precio)}</p>
                </div>
                <div className="rounded-lg bg-ray-border/40 px-2 py-1.5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Margen/kg</p>
                  <p className={`text-sm font-bold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                    {ok ? '+' : ''}{formatCLP(margen)}
                  </p>
                </div>
                <div className={`rounded-lg px-2 py-1.5 ${ok ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Total generado</p>
                  <p className={`text-sm font-bold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                    {ok ? '+' : ''}{formatCLP(gananciaTotal)}
                  </p>
                </div>
              </div>
              {/* Barra */}
              <div className="h-1.5 rounded-full bg-ray-border overflow-hidden">
                <div className="h-full rounded-full"
                  style={{
                    width: `${Math.min(Math.abs(margenPct) * 100, 100)}%`,
                    background: ok ? CAT_COLORS[cat].dark : '#ef4444',
                  }} />
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* ── 4. Variación vs mes anterior ── */}
      {prevInd && (
        <article className="card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Variación vs {mesLabel(mesesOrdenados[currentIdx - 1])}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tipo de cambio', actual: tipoCambio, prev: prevInd.tipoCambio, fmt: (v) => formatNumero(v, 2) },
              { label: 'Costo / kg',     actual: costoTotalPorKilo, prev: prevInd.costoTotalPorKilo, fmt: formatCLP },
              { label: 'Indicador',      actual: indicadorFabricacion, prev: prevInd.indicadorFabricacion, fmt: formatCLP },
              { label: 'Kilos totales',  actual: kilos.total, prev: prevInd.kilos.total, fmt: formatKilos },
            ].map(({ label, actual, prev: p, fmt }) => {
              const { delta, pct } = variacion(actual, p)
              const sube = delta >= 0
              return (
                <div key={label} className="rounded-xl bg-ray-border/30 p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-bold text-white mt-0.5">{fmt(actual)}</p>
                  <p className={`text-xs mt-1 font-medium ${sube ? 'text-emerald-400' : 'text-red-400'}`}>
                    {sube ? '▲' : '▼'} {fmt(Math.abs(delta))}
                    {pct !== null && <span className="ml-1 opacity-70">({formatPct(Math.abs(pct))})</span>}
                  </p>
                </div>
              )
            })}
          </div>
        </article>
      )}

      {/* ── 5. Evolución histórica ── */}
      {historial.length >= 2 && (
        <article className="card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Evolución histórica</p>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-xs min-w-[420px]">
              <thead>
                <tr className="text-slate-500 border-b border-ray-border">
                  <th className="text-left pb-2 pl-2">Mes</th>
                  <th className="text-right pb-2">TC</th>
                  <th className="text-right pb-2">Costo/kg</th>
                  <th className="text-right pb-2">Kilos</th>
                  <th className="text-right pb-2 pr-2">Indicador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ray-border/40">
                {historial.map(({ key, ind }) => {
                  const esActivo = key === mesActivo
                  const indPos = ind.indicadorFabricacion >= 0
                  return (
                    <tr key={key} className={esActivo ? 'bg-ray-cyan/5' : ''}>
                      <td className={`py-2 pl-2 font-medium ${esActivo ? 'text-ray-cyan' : 'text-slate-300'}`}>
                        {mesLabel(key)}{esActivo && ' ●'}
                      </td>
                      <td className="py-2 text-right text-slate-300">{formatNumero(ind.tipoCambio, 2)}</td>
                      <td className="py-2 text-right text-slate-300">{formatCLP(ind.costoTotalPorKilo)}</td>
                      <td className="py-2 text-right text-slate-300">{formatKilos(ind.kilos.total)}</td>
                      <td className={`py-2 pr-2 text-right font-semibold ${indPos ? 'text-emerald-400' : 'text-red-400'}`}>
                        {indPos ? '+' : ''}{formatCLP(ind.indicadorFabricacion)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* ── 6. Proyección próximos 3 meses ── */}
      {n >= 2 && (
        <article className="card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Proyección — próximos 3 meses</p>
          <p className="text-[10px] text-slate-600 mb-3">Basada en tendencia lineal de {n} {n === 1 ? 'mes' : 'meses'} históricos</p>
          <div className="space-y-2">
            {proyecciones.map(({ key, tc, costo }, i) => (
              <div key={key} className="flex items-center justify-between rounded-xl bg-ray-border/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i === 0 ? 'bg-ray-cyan/20 text-ray-cyan' : 'bg-ray-border text-slate-500'
                  }`}>{i + 1}</span>
                  <span className={`text-sm font-semibold ${i === 0 ? 'text-ray-cyan' : 'text-slate-300'}`}>
                    {mesLabel(key)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-right">
                  <div>
                    <p className="text-slate-500">TC est.</p>
                    <p className="font-medium text-white">{tc ? formatNumero(tc, 2) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Costo/kg est.</p>
                    <p className="font-medium text-white">{costo ? formatCLP(costo) : '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* ── 7. Tipo de cambio + Kilos + Pie ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tipo de cambio ponderado</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-white">
            {formatNumero(tipoCambio, 2)}
            <span className="text-sm font-normal text-slate-500"> CLP/R$</span>
          </p>
          <p className="mt-2 text-xs text-slate-600">Σ CLP pagado ÷ Σ R$ pagado</p>
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
                    {dataPie.map((d) => <Cell key={d.name} fill={CAT_COLORS[d.name].dark} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [formatKilos(v), '']}
                    contentStyle={{ borderRadius: 10, background: '#0b1628', border: '1px solid #152338', fontSize: 12, color: '#e2e8f0' }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} verticalAlign="bottom" height={24} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </div>

      {/* ── 8. Tabla detalle de llegadas ── */}
      <LlegadasTable llegadas={mesData.llegadas_mercaderia_por_bloque || []} />

    </div>
  )
}

/* ── Tarjeta de costo por kg (Oro o Plata) ── */
function CostoCard({ titulo, acento, total, filas }) {
  return (
    <article className="card p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{titulo}</p>
      <p className={`text-3xl font-bold mb-4 ${acento}`}>{formatCLP(total)}</p>
      <ul className="divide-y divide-ray-border">
        {filas.map(({ label, val }) => (
          <li key={label} className="py-2">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-400">{label}</span>
              <span className="font-medium text-white">{formatCLP(val)}</span>
            </div>
            <div className="h-1 rounded-full bg-ray-border overflow-hidden">
              <div className="h-full rounded-full bg-ray-cyan/70"
                style={{ width: `${total ? Math.min(val / total * 100, 100) : 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}

/* ── Tabla llegadas ── */
function LlegadasTable({ llegadas }) {
  if (!llegadas.length) return null
  const totRaw = { MICRO: 0, CADENA: 0, 'ORO GF': 0 }
  llegadas.forEach((b) => {
    totRaw.MICRO    += Number(b.MICRO)      || 0
    totRaw.CADENA   += Number(b.CADENA)     || 0
    totRaw['ORO GF']+= Number(b['ORO GF']) || 0
  })
  const totMerma = { MICRO: totRaw.MICRO * MERMA_LLEGADAS, CADENA: totRaw.CADENA * MERMA_LLEGADAS, 'ORO GF': totRaw['ORO GF'] * MERMA_LLEGADAS }
  const totalRaw = totRaw.MICRO + totRaw.CADENA + totRaw['ORO GF']
  const totalMerma = totMerma.MICRO + totMerma.CADENA + totMerma['ORO GF']

  return (
    <article className="card overflow-hidden p-0">
      <div className="flex items-center justify-between px-5 py-3 border-b border-ray-border">
        <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-400">Detalle de llegadas</h3>
        <span className="text-[10px] text-slate-500">{llegadas.length} {llegadas.length === 1 ? 'envío' : 'envíos'}</span>
      </div>
      <div className="grid grid-cols-[90px_1fr_1fr_1fr_72px] gap-x-2 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <span>Fecha</span><span className="text-center text-blue-500">MICRO</span>
        <span className="text-center text-emerald-500">CADENA</span>
        <span className="text-center text-amber-500">ORO GF</span>
        <span className="text-right">Total</span>
      </div>
      <div className="divide-y divide-ray-border/50">
        {llegadas.map((b, i) => {
          const rowTotal = (b.MICRO || 0) + (b.CADENA || 0) + (b['ORO GF'] || 0)
          return (
            <div key={i} className="grid grid-cols-[90px_1fr_1fr_1fr_72px] items-center gap-x-2 px-5 py-2.5 hover:bg-ray-border/20 transition-colors">
              <span className="font-mono text-xs text-slate-400">{b.fecha ? formatFecha(b.fecha) : '—'}</span>
              <span className="text-center text-sm font-medium text-blue-300">{formatKilos(b.MICRO)}</span>
              <span className="text-center text-sm font-medium text-emerald-300">{formatKilos(b.CADENA)}</span>
              <span className="text-center text-sm font-medium text-amber-300">{formatKilos(b['ORO GF'])}</span>
              <span className="text-right text-sm font-semibold text-white">{formatKilos(rowTotal)}</span>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-[90px_1fr_1fr_1fr_72px] items-center gap-x-2 border-t border-ray-border px-5 py-2.5 bg-ray-border/20">
        <span className="text-[10px] font-bold uppercase text-slate-500">Subtotal</span>
        <span className="text-center text-sm text-slate-300">{formatKilos(totRaw.MICRO)}</span>
        <span className="text-center text-sm text-slate-300">{formatKilos(totRaw.CADENA)}</span>
        <span className="text-center text-sm text-slate-300">{formatKilos(totRaw['ORO GF'])}</span>
        <span className="text-right text-sm font-semibold text-slate-300">{formatKilos(totalRaw)}</span>
      </div>
      <div className="grid grid-cols-[90px_1fr_1fr_1fr_72px] items-center gap-x-2 border-t border-yellow-500/30 px-5 py-2.5 bg-yellow-900/10">
        <span className="text-[10px] font-bold uppercase text-yellow-500">Con merma</span>
        <span className="text-center text-sm font-medium text-blue-300">{formatKilos(totMerma.MICRO)}</span>
        <span className="text-center text-sm font-medium text-emerald-300">{formatKilos(totMerma.CADENA)}</span>
        <span className="text-center text-sm font-medium text-amber-300">{formatKilos(totMerma['ORO GF'])}</span>
        <span className="text-right text-sm font-bold text-yellow-300">{formatKilos(totalMerma)}</span>
      </div>
      <p className="px-5 pb-3 text-[10px] text-slate-600">* 1% merma aplicada al total acumulado</p>
    </article>
  )
}
