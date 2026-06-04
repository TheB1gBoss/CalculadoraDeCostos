import { Factory, Scale, ShoppingCart, TrendingDown, TrendingUp } from 'lucide-react'
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { calcularIndicadores, MERMA_FACTOR, normalizarPorCategoria, variacion } from '../lib/calculos.js'
import { formatCLP, formatFecha, formatKilos, formatNumero, formatPct, formatReales } from '../lib/formato.js'

const CAT_COLORS = {
  MICRO:    { dark: '#00d4ff', text: 'text-blue-400'    },
  CADENA:   { dark: '#34d399', text: 'text-emerald-400' },
  'ORO GF': { dark: '#fbbf24', text: 'text-amber-400'   },
}

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
    tipoCambio, brutoPorKilo, banoOroPorKilo, banoPlataPorKilo, aduanaPorKilo,
    costoTotalPorKilo, costoOroPorKilo, costoPlataPorKilo, costoPorCategoria,
    indicadorFabricacion, ventasPonderadas, costoTotalKilos, kilos,
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

  const historial = mesesOrdenados.map((key) => ({ key, ind: calcularIndicadores(state.meses[key]) }))
  const currentIdx = mesesOrdenados.indexOf(mesActivo)
  const prevInd = currentIdx > 0 ? historial[currentIdx - 1].ind : null

  const tcSerie = mesesOrdenados.flatMap((key) =>
    (state.meses[key]?.pagos || [])
      .filter((p) => p.reales > 0 && p.chilenos > 0 && p.fecha)
      .map((p) => ({ fecha: p.fecha, tc: p.chilenos / p.reales }))
  ).sort((a, b) => a.fecha < b.fecha ? -1 : 1)

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

  const precios = normalizarPorCategoria(mesData.costos_ponderados_por_kilo || {})
  const margenes = ['MICRO', 'CADENA', 'ORO GF'].map((cat) => {
    const precio    = precios[cat] || 0
    const costoCat  = costoPorCategoria?.[cat] || 0
    const margen    = precio - costoCat
    const margenPct = costoCat ? margen / costoCat : 0
    const kilosCat  = kilos[cat] || 0
    const gananciaTotal = margen * kilosCat
    return { cat, precio, costoCat, margen, margenPct, kilosCat, gananciaTotal, ok: margen >= 0 }
  })
  const gananciaTotalGeneral = margenes.reduce((s, m) => s + m.gananciaTotal, 0)

  /* Kilos en fabricación */
  const totalComprasKg   = (mesData.compras_bruto || []).reduce((s, c) => s + (c.kilos || 0), 0)
  const kgCompradosNetos = totalComprasKg * MERMA_FACTOR
  const kgLlegadosBrutos = (mesData.llegadas_mercaderia_por_bloque || [])
    .reduce((s, b) => s + (b.MICRO || 0) + (b.CADENA || 0) + (b['ORO GF'] || 0), 0)
  const kgEnFabricacion  = Math.max(0, kgCompradosNetos - kgLlegadosBrutos)
  const pctLlegado       = kgCompradosNetos > 0 ? Math.min(kgLlegadosBrutos / kgCompradosNetos, 1) : 0

  /* Análisis compras brutas */
  const comprasActivas    = (mesData.compras_bruto || []).filter((c) => (c.kilos || 0) > 0 || (c.total_reales || 0) > 0)
  const comprasAnalisis   = comprasActivas
    .map((c) => ({ ...c, rPorKg: c.kilos > 0 ? c.total_reales / c.kilos : 0 }))
    .sort((a, b) => (a.fecha || '') < (b.fecha || '') ? -1 : 1)
  const totalComprasR$    = comprasActivas.reduce((s, c) => s + (c.total_reales || 0), 0)
  const totalComprasKgAll = comprasActivas.reduce((s, c) => s + (c.kilos || 0), 0)
  const rPorKgPonderado   = totalComprasKgAll > 0 ? totalComprasR$ / totalComprasKgAll : 0
  const rPorKgMin = comprasAnalisis.length > 1 ? Math.min(...comprasAnalisis.map((c) => c.rPorKg).filter(Boolean)) : 0
  const rPorKgMax = comprasAnalisis.length > 1 ? Math.max(...comprasAnalisis.map((c) => c.rPorKg).filter(Boolean)) : 0
  const historialRkg = mesesOrdenados.map((key) => {
    const cs = state.meses[key]?.compras_bruto || []
    const r  = cs.reduce((s, c) => s + (c.total_reales || 0), 0)
    const kg = cs.reduce((s, c) => s + (c.kilos || 0), 0)
    return { key, label: mesLabel(key), rPorKg: kg > 0 ? r / kg : 0, r, kg }
  }).filter((h) => h.kg > 0)

  const dataPie = ['MICRO', 'CADENA', 'ORO GF']
    .map((cat) => ({ name: cat, value: kilos[cat] || 0 }))
    .filter((d) => d.value > 0)

  const pos = indicadorFabricacion >= 0

  return (
    <div className="space-y-3">

      {/* ── 1. Indicador hero ── */}
      <article className={`card p-5 border ${pos
        ? 'border-emerald-700/40 bg-emerald-900/10'
        : 'border-red-800/40 bg-red-900/10'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Indicador de fabricación</p>
            <p className={`mt-2 text-4xl font-bold tracking-tight tabular-nums ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
              {pos ? '+' : ''}{formatCLP(indicadorFabricacion)}
            </p>
            {(ventasPonderadas > 0 || costoTotalKilos > 0) && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="text-slate-500">Ventas ponderadas <span className="font-semibold text-slate-300">{formatCLP(ventasPonderadas)}</span></span>
                <span className="text-slate-500">Costo real <span className="font-semibold text-slate-300">{formatCLP(costoTotalKilos)}</span></span>
              </div>
            )}
          </div>
          <div className={`shrink-0 rounded-2xl p-3 ${pos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {pos ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
          </div>
        </div>
      </article>

      {/* ── 2. Kilos en fabricación ── */}
      {kgCompradosNetos > 0 && (
        <article className="card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kilos en fabricación</p>
              <p className="mt-1.5 text-3xl font-bold tracking-tight tabular-nums text-white">
                {kgEnFabricacion > 0 ? formatKilos(kgEnFabricacion) : '—'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {kgEnFabricacion > 0 ? 'pendientes de llegada' : 'Todo llegó'}
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-ray-border/60 p-3 text-slate-500">
              <Factory size={20} />
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
              <span>Progreso de llegada</span>
              <span className="font-semibold text-slate-400">{formatNumero(pctLlegado * 100, 1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-ray-border overflow-hidden">
              <div className="h-full rounded-full bg-ray-cyan transition-all" style={{ width: `${pctLlegado * 100}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Comprado neto', val: kgCompradosNetos, color: 'text-slate-300' },
              { label: 'Llegado',       val: kgLlegadosBrutos, color: 'text-ray-cyan'  },
              { label: 'Pendiente',     val: kgEnFabricacion,  color: kgEnFabricacion > 0 ? 'text-amber-400' : 'text-emerald-400' },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-xl bg-ray-border/30 px-2 py-2.5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-600 mb-1">{label}</p>
                <p className={`text-xs font-bold tabular-nums ${color}`}>{formatKilos(val)}</p>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[10px] text-slate-600">Bruto neto (−5% merma) comparado con llegadas brutas acumuladas</p>
        </article>
      )}

      {/* ── 3. Costo Plata / Oro ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <CostoCard
          titulo="Plata / kg" acento="text-slate-200"
          total={costoPlataPorKilo}
          filas={[
            { label: 'Bruto',      val: brutoPorKilo,     color: '#94a3b8' },
            { label: 'Baño plata', val: banoPlataPorKilo, color: '#cbd5e1' },
            { label: 'Aduana',     val: aduanaPorKilo,    color: '#475569' },
          ]}
        />
        <CostoCard
          titulo="Oro / kg" acento="text-amber-300"
          total={costoOroPorKilo}
          filas={[
            { label: 'Bruto',    val: brutoPorKilo,   color: '#92400e' },
            { label: 'Baño oro', val: banoOroPorKilo, color: '#fbbf24' },
            { label: 'Aduana',   val: aduanaPorKilo,  color: '#78716c' },
          ]}
        />
      </div>

      {/* ── 4. Compras análisis R$ ── */}
      {comprasAnalisis.length > 0 && (
        <ComprasAnalisis
          compras={comprasAnalisis}
          ponderado={rPorKgPonderado}
          min={rPorKgMin}
          max={rPorKgMax}
          totalR$={totalComprasR$}
          totalKg={totalComprasKgAll}
          historial={historialRkg}
          mesActivo={mesActivo}
        />
      )}

      {/* ── 5. Alerta baño oro faltante ── */}
      {banoOroPorKilo === 0 && (kilos['ORO GF'] || 0) > 0 && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/15 px-4 py-3 text-xs text-amber-300">
          ⚠ Tienes kilos de <span className="font-semibold">ORO GF</span> sin baño de oro registrado.
          Edita los baños en Historial para separar correctamente los costos de oro y plata.
        </div>
      )}

      {/* ── 6. Rentabilidad por categoría ── */}
      <article className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Rentabilidad por categoría</p>
          <span className={`text-sm font-bold tabular-nums ${gananciaTotalGeneral >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {gananciaTotalGeneral >= 0 ? '+' : ''}{formatCLP(gananciaTotalGeneral)}
          </span>
        </div>
        <div className="divide-y divide-ray-border/40">
          {margenes.map(({ cat, precio, costoCat, margen, margenPct, kilosCat, gananciaTotal, ok }) => (
            <div key={cat} className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: CAT_COLORS[cat].dark }} />
                  <span className="text-sm font-bold text-white">{cat}</span>
                  {kilosCat > 0 && <span className="text-xs text-slate-500">{formatKilos(kilosCat)}</span>}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>{formatPct(margenPct)}</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2.5 text-xs">
                <span className="text-slate-500">Precio <span className="font-semibold text-slate-200">{precio > 0 ? formatCLP(precio) : '—'}</span></span>
                <span className="text-slate-700">·</span>
                <span className="text-slate-500">Costo <span className="font-semibold text-slate-400">{costoCat > 0 ? formatCLP(costoCat) : '—'}</span></span>
                <span className="text-slate-700">·</span>
                <span className="text-slate-500">Margen <span className={`font-bold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {ok ? '+' : ''}{margen !== 0 ? formatCLP(margen) + '/kg' : '—'}
                </span></span>
              </div>
              <div className="h-1.5 rounded-full bg-ray-border overflow-hidden">
                <div className="h-full rounded-full"
                  style={{ width: `${Math.min(Math.abs(margenPct) * 100, 100)}%`, background: ok ? CAT_COLORS[cat].dark : '#ef4444' }} />
              </div>
              {gananciaTotal !== 0 && (
                <p className={`mt-1.5 text-[11px] ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
                  {ok ? '+' : ''}{formatCLP(gananciaTotal)} total generado
                </p>
              )}
            </div>
          ))}
        </div>
      </article>

      {/* ── 7. TC ponderado + gráfico (una sola card) ── */}
      <article className="card overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tipo de cambio ponderado</p>
          <div className="flex items-end gap-2.5 mt-1.5">
            <span className="text-3xl font-bold text-white tabular-nums">
              {tipoCambio > 0 ? formatNumero(tipoCambio, 2) : '—'}
            </span>
            <span className="mb-0.5 text-sm font-medium text-slate-500">CLP/R$</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600">Σ CLP pagados ÷ Σ R$ pagados</p>
        </div>
        {tcSerie.length >= 2 && (
          <div className="px-4 pb-5">
            <p className="text-[10px] text-slate-600 mb-3 px-1">{tcSerie.length} pagos registrados</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tcSerie} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#152338" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 9, fill: '#475569' }} tickFormatter={(v) => v?.slice(5)} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: '#475569' }} tickFormatter={(v) => formatNumero(v, 0)} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, background: '#0b1628', border: '1px solid #152338', fontSize: 11, color: '#e2e8f0' }}
                    formatter={(v) => [formatNumero(v, 2) + ' CLP/R$', 'TC']}
                    labelFormatter={(v) => v}
                  />
                  {tipoCambio > 0 && <ReferenceLine y={tipoCambio} stroke="#00d4ff" strokeDasharray="4 4"
                    label={{ value: 'ponderado', fill: '#00d4ff', fontSize: 8, position: 'insideTopRight' }} />}
                  <Line type="monotone" dataKey="tc" stroke="#00d4ff" strokeWidth={2}
                    dot={{ r: 2.5, fill: '#00d4ff', strokeWidth: 0 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </article>

      {/* ── 8. Variación vs mes anterior ── */}
      {prevInd && (
        <article className="card overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Variación vs {mesLabel(mesesOrdenados[currentIdx - 1])}
            </p>
          </div>
          <div className="divide-y divide-ray-border/40">
            {[
              { label: 'Tipo de cambio', actual: tipoCambio,           prev: prevInd.tipoCambio,           fmt: (v) => formatNumero(v, 2) + ' CLP/R$' },
              { label: 'Costo / kg',     actual: costoTotalPorKilo,    prev: prevInd.costoTotalPorKilo,    fmt: formatCLP  },
              { label: 'Indicador',      actual: indicadorFabricacion, prev: prevInd.indicadorFabricacion, fmt: formatCLP  },
              { label: 'Kilos totales',  actual: kilos.total,          prev: prevInd.kilos.total,          fmt: formatKilos },
            ].map(({ label, actual, prev: p, fmt }) => {
              const { delta, pct } = variacion(actual, p)
              const sube = delta >= 0
              return (
                <div key={label} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm font-semibold text-white tabular-nums mt-0.5">{fmt(actual)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold tabular-nums ${sube ? 'text-emerald-400' : 'text-red-400'}`}>
                      {sube ? '▲' : '▼'} {fmt(Math.abs(delta))}
                    </p>
                    {pct !== null && <p className="text-[10px] text-slate-600 mt-0.5">{formatPct(Math.abs(pct))}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </article>
      )}

      {/* ── 9. Evolución histórica ── */}
      {historial.length >= 2 && (
        <article className="card overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Evolución histórica</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[380px]">
              <thead>
                <tr className="border-b border-ray-border/60">
                  <th className="text-left py-2 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-600">Mes</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">TC</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">Costo/kg</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">Kilos</th>
                  <th className="text-right py-2 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-600">Indicador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ray-border/30">
                {historial.map(({ key, ind }) => {
                  const esActivo = key === mesActivo
                  const indPos   = ind.indicadorFabricacion >= 0
                  return (
                    <tr key={key} className={esActivo ? 'bg-ray-cyan/5' : 'hover:bg-ray-border/10 transition-colors'}>
                      <td className={`py-2.5 px-5 font-semibold ${esActivo ? 'text-ray-cyan' : 'text-slate-400'}`}>
                        {mesLabel(key)}{esActivo && <span className="ml-1.5 text-[8px]">●</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">{formatNumero(ind.tipoCambio, 2)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">{formatCLP(ind.costoTotalPorKilo)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">{formatKilos(ind.kilos.total)}</td>
                      <td className={`py-2.5 px-5 text-right tabular-nums font-bold ${indPos ? 'text-emerald-400' : 'text-red-400'}`}>
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

      {/* ── 10. Proyección próximos 3 meses ── */}
      {n >= 2 && (
        <article className="card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Proyección — próximos 3 meses</p>
          <p className="text-[10px] text-slate-600 mb-4">Tendencia lineal de {n} meses históricos</p>
          <div className="space-y-2">
            {proyecciones.map(({ key, tc, costo }, i) => (
              <div key={key} className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                i === 0 ? 'bg-ray-cyan/5 border border-ray-cyan/10' : 'bg-ray-border/20'
              }`}>
                <span className={`text-sm font-semibold ${i === 0 ? 'text-ray-cyan' : 'text-slate-400'}`}>
                  {mesLabel(key)}
                </span>
                <div className="flex gap-5 text-right">
                  <div>
                    <p className="text-[10px] text-slate-600">TC est.</p>
                    <p className={`text-sm font-semibold tabular-nums ${i === 0 ? 'text-white' : 'text-slate-500'}`}>
                      {tc ? formatNumero(tc, 2) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600">Costo/kg</p>
                    <p className={`text-sm font-semibold tabular-nums ${i === 0 ? 'text-white' : 'text-slate-500'}`}>
                      {costo ? formatCLP(costo) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* ── 11. Kilos llegados + distribución ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kilos llegados</p>
            <Scale size={14} className="text-slate-600" />
          </div>
          <p className="text-3xl font-bold text-white tabular-nums mb-4">
            {kilos.total > 0 ? formatKilos(kilos.total) : '—'}
          </p>
          <div className="space-y-3">
            {['MICRO', 'CADENA', 'ORO GF'].filter((cat) => (kilos[cat] || 0) > 0).map((cat) => {
              const pct = kilos.total > 0 ? (kilos[cat] / kilos.total) * 100 : 0
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: CAT_COLORS[cat].dark }} />
                      {cat}
                    </span>
                    <span className={`text-xs font-semibold tabular-nums ${CAT_COLORS[cat].text}`}>{formatKilos(kilos[cat])}</span>
                  </div>
                  <div className="h-1 rounded-full bg-ray-border overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CAT_COLORS[cat].dark }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[10px] text-slate-600">Con 1% de merma aplicada</p>
        </article>

        <article className="card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Distribución</p>
          <div className="h-44">
            {dataPie.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-600">Sin llegadas</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataPie} dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} paddingAngle={3}>
                    {dataPie.map((d) => <Cell key={d.name} fill={CAT_COLORS[d.name].dark} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [formatKilos(v), '']}
                    contentStyle={{ borderRadius: 10, background: '#0b1628', border: '1px solid #152338', fontSize: 11, color: '#e2e8f0' }} />
                  <Legend iconSize={7} wrapperStyle={{ fontSize: 10 }} verticalAlign="bottom" height={24} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </div>

    </div>
  )
}

/* ── Compras brutas en R$/kg ── */
function ComprasAnalisis({ compras, ponderado, min, max, totalR$, totalKg, historial, mesActivo }) {
  const fmtRkg = (v) => v > 0 ? formatNumero(v, 2) : '—'
  const spread = max - min

  return (
    <article className="card overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Compras brutas — costo ponderado</p>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold tracking-tight tabular-nums text-white">{fmtRkg(ponderado)}</span>
          <span className="mb-1 text-base text-slate-400 font-medium">R$/kg</span>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          {compras.length} {compras.length === 1 ? 'compra' : 'compras'}
          {totalR$ > 0 && <> · {formatReales(totalR$)}</>}
          {totalKg > 0 && <> · {formatKilos(totalKg)}</>}
        </p>
      </div>

      <div className="divide-y divide-ray-border/40">
        {compras.map((c, i) => {
          const isMin    = compras.length > 1 && Math.abs(c.rPorKg - min) < 0.01
          const isMax    = compras.length > 1 && Math.abs(c.rPorKg - max) < 0.01
          const barPct   = spread > 0 ? ((c.rPorKg - min) / spread) * 100 : 100
          const dotColor = isMin ? '#34d399' : isMax ? '#f87171' : '#475569'
          const rColor   = isMin ? 'text-emerald-400' : isMax ? 'text-red-400' : 'text-white'
          return (
            <div key={i} className="px-5 py-3">
              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dotColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 leading-snug">{c.detalle || '—'}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {c.fecha && <span>{formatFecha(c.fecha)}</span>}
                    {c.kilos > 0 && <span> · {formatKilos(c.kilos)}</span>}
                    {c.total_reales > 0 && <span> · {formatReales(c.total_reales)}</span>}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-base font-bold tabular-nums ${rColor}`}>{fmtRkg(c.rPorKg)}</p>
                  <p className="text-[10px] text-slate-600">R$/kg</p>
                </div>
              </div>
              {compras.length > 1 && (
                <div className="mt-2.5 ml-4 h-0.5 rounded-full bg-ray-border overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: dotColor }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {compras.length > 1 && spread > 0 && (
        <div className="flex items-center justify-between border-t border-ray-border/40 px-5 py-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            mín {fmtRkg(min)} R$/kg
          </span>
          <span className="text-slate-700">Δ {formatNumero(spread, 2)}</span>
          <span className="flex items-center gap-1.5">
            máx {fmtRkg(max)} R$/kg
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          </span>
        </div>
      )}

      {historial.length >= 2 && (
        <div className="border-t border-ray-border/40 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Evolución R$/kg por mes</p>
          <div className="space-y-2">
            {historial.map(({ key, label, rPorKg }) => {
              const esActivo = key === mesActivo
              const maxH     = Math.max(...historial.map((h) => h.rPorKg))
              const pct      = maxH > 0 ? (rPorKg / maxH) * 100 : 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={`w-14 shrink-0 text-right text-[10px] font-medium ${esActivo ? 'text-ray-cyan' : 'text-slate-500'}`}>
                    {label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-ray-border overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: esActivo ? '#00d4ff' : '#1e3a5a' }} />
                  </div>
                  <span className={`w-16 shrink-0 text-right text-[10px] tabular-nums ${esActivo ? 'text-ray-cyan font-semibold' : 'text-slate-500'}`}>
                    {formatNumero(rPorKg, 2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </article>
  )
}

/* ── Costo por kg (Plata o Oro) ── */
function CostoCard({ titulo, acento, total, filas }) {
  return (
    <article className="card p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Costo {titulo}</p>
      <p className={`text-2xl font-bold mb-5 tabular-nums ${acento}`}>{total > 0 ? formatCLP(total) : '—'}</p>
      <div className="space-y-3.5">
        {filas.map(({ label, val, color }) => {
          const pct = total > 0 ? (val / total) * 100 : 0
          return (
            <div key={label}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs text-slate-500">{label}</span>
                <div className="flex items-baseline gap-2">
                  {pct > 0 && <span className="text-[10px] text-slate-600 tabular-nums">{formatNumero(pct, 1)}%</span>}
                  <span className="text-sm font-semibold text-white tabular-nums">{val > 0 ? formatCLP(val) : '—'}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-ray-border overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}
