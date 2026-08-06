import { Factory, Scale, ShoppingCart, TrendingDown, TrendingUp } from 'lucide-react'
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { calcularIndicadores, MERMA_FACTOR, normalizarPorCategoria, variacion } from '../lib/calculos.js'
import { formatCLP, formatFecha, formatKilos, formatNumero, formatPct, formatReales } from '../lib/formato.js'

const CAT_COLORS = {
  MICRO:    { dark: '#3fcbe0', text: 'text-blue-400'    },
  CADENA:   { dark: '#34d399', text: 'text-emerald-400' },
  'ORO GF': { dark: '#e3c05a', text: 'text-amber-400'   },
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

  // ── Períodos históricos por fecha de las entradas ──────────────
  // Agrupa compras y pagos por año-mes según su campo fecha
  const periodos = (() => {
    const map = {}
    for (const c of mesData.compras_bruto || []) {
      const k = (c.fecha || '').slice(0, 7)
      if (!k) continue
      if (!map[k]) map[k] = { key: k, compras: [], pagos: [] }
      map[k].compras.push(c)
    }
    for (const p of mesData.pagos || []) {
      const k = (p.fecha || '').slice(0, 7)
      if (!k) continue
      if (!map[k]) map[k] = { key: k, compras: [], pagos: [] }
      map[k].pagos.push(p)
    }
    return Object.values(map)
      .sort((a, b) => a.key < b.key ? -1 : 1)
      .map(({ key, compras, pagos }) => {
        const r$     = compras.reduce((s, c) => s + (c.total_reales || 0), 0)
        const kg     = compras.reduce((s, c) => s + (c.kilos || 0), 0)
        const clp    = pagos.reduce((s, p) => s + (p.chilenos || 0), 0)
        const reales = pagos.reduce((s, p) => s + (p.reales || 0), 0)
        return {
          key, label: mesLabel(key),
          rPorKg:  kg > 0     ? r$ / kg         : 0,
          tc:      reales > 0 ? clp / reales     : 0,
          kg, r$, nCompras: compras.length, nPagos: pagos.length,
        }
      })
  })()

  // Serie de TC por pago + promedio ponderado acumulado (progreso histórico)
  const tcSerie = (() => {
    const rows = (mesData.pagos || [])
      .filter((p) => p.reales > 0 && p.chilenos > 0 && p.fecha)
      .map((p) => ({ fecha: p.fecha, tc: p.chilenos / p.reales, reales: p.reales, chilenos: p.chilenos }))
      .sort((a, b) => a.fecha < b.fecha ? -1 : 1)
    let accCLP = 0, accR = 0
    return rows.map((r) => {
      accCLP += r.chilenos
      accR += r.reales
      return { fecha: r.fecha, tc: r.tc, prom: accR > 0 ? accCLP / accR : 0 }
    })
  })()

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
  const historialRkg = periodos.filter(p => p.kg > 0)

  const dataPie = ['MICRO', 'CADENA', 'ORO GF']
    .map((cat) => ({ name: cat, value: kilos[cat] || 0 }))
    .filter((d) => d.value > 0)

  const pos = indicadorFabricacion >= 0

  return (
    <div className="space-y-3">

      {/* ── 1. Indicador de fabricación ── */}
      <article className={`card overflow-hidden border ${pos ? 'border-emerald-700/30' : 'border-red-800/30'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ray-border/40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Indicador de fabricación</p>
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${pos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {pos ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
            {pos ? 'Positivo' : 'Negativo'}
          </div>
        </div>
        {/* Valor principal */}
        <div className="px-5 py-5">
          <p className={`text-4xl font-bold tracking-tight tabular-nums ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
            {pos ? '+' : ''}{formatCLP(indicadorFabricacion)}
          </p>
        </div>
        {/* Stats row con divisores verticales */}
        {(ventasPonderadas > 0 || costoTotalKilos > 0) && (
          <div className="grid grid-cols-2 divide-x divide-ray-border/40 border-t border-ray-border/40">
            <div className="px-5 py-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-1">Ventas ponderadas</p>
              <p className="text-sm font-semibold text-slate-200 tabular-nums">{formatCLP(ventasPonderadas)}</p>
            </div>
            <div className="px-5 py-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-1">Costo real</p>
              <p className="text-sm font-semibold text-slate-200 tabular-nums">{formatCLP(costoTotalKilos)}</p>
            </div>
          </div>
        )}
      </article>

      {/* ── 2. Kilos en fabricación ── */}
      {kgCompradosNetos > 0 && (
        <article className="card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-ray-border/40">
            <div className="flex items-center gap-2">
              <Factory size={13} className="text-slate-500"/>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kilos en fabricación</p>
            </div>
            <p className={`text-sm font-bold tabular-nums ${kgEnFabricacion > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {kgEnFabricacion > 0 ? formatKilos(kgEnFabricacion) : 'Completo'}
            </p>
          </div>
          {/* Barra de progreso */}
          <div className="px-5 py-4 border-b border-ray-border/40">
            <div className="flex justify-between text-[10px] mb-2">
              <span className="text-slate-500 font-medium">Progreso de llegada</span>
              <span className="font-bold text-slate-300 tabular-nums">{formatNumero(pctLlegado * 100, 1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-ray-border overflow-hidden">
              <div className="h-full rounded-full bg-ray-cyan transition-all" style={{ width: `${pctLlegado * 100}%` }}/>
            </div>
          </div>
          {/* Stats con divisores verticales */}
          <div className="grid grid-cols-3 divide-x divide-ray-border/40">
            {[
              { label: 'Comprado neto', val: kgCompradosNetos, color: 'text-slate-300' },
              { label: 'Llegado',       val: kgLlegadosBrutos, color: 'text-ray-cyan'  },
              { label: 'Pendiente',     val: kgEnFabricacion,  color: kgEnFabricacion > 0 ? 'text-amber-400' : 'text-emerald-400' },
            ].map(({ label, val, color }) => (
              <div key={label} className="px-3 py-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-1">{label}</p>
                <p className={`text-xs font-bold tabular-nums ${color}`}>{formatKilos(val)}</p>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* ── 3. TC ponderado + gráfico ── */}
      <article className="card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ray-border/40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tipo de cambio</p>
          <span className="text-[10px] text-slate-600">{tcSerie.length > 0 ? `${tcSerie.length} pagos` : ''}</span>
        </div>
        {/* Valor principal */}
        <div className="px-5 py-5 border-b border-ray-border/40">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold tabular-nums text-white">{tipoCambio > 0 ? formatNumero(tipoCambio, 2) : '—'}</span>
            <span className="mb-0.5 text-sm text-slate-500 font-medium">CLP/R$ ponderado</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-600">Σ CLP pagados ÷ Σ R$ pagados</p>
        </div>
        {/* Gráfico (solo si hay ≥2 datos) */}
        {tcSerie.length >= 2 && (
          <div className="px-4 pt-4 pb-5">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tcSerie} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262d37"/>
                  <XAxis dataKey="fecha" tick={{ fontSize: 9, fill: '#475569' }} tickFormatter={(v) => v?.slice(5)} interval="preserveStartEnd"/>
                  <YAxis tick={{ fontSize: 9, fill: '#475569' }} tickFormatter={(v) => formatNumero(v, 0)} domain={['auto','auto']}/>
                  <Tooltip contentStyle={{ borderRadius: 10, background: '#13181f', border: '1px solid #262d37', fontSize: 11, color: '#e2e8f0' }}
                    formatter={(v, name) => [formatNumero(v, 2) + ' CLP/R$', name]} labelFormatter={(v) => v}/>
                  <Legend verticalAlign="top" height={22} iconType="plainline"
                    wrapperStyle={{ fontSize: 10, color: '#94a3b8' }}/>
                  {tipoCambio > 0 && <ReferenceLine y={tipoCambio} stroke="#3fcbe0" strokeDasharray="4 4"
                    label={{ value: 'pond.', fill: '#3fcbe0', fontSize: 8, position: 'insideTopRight' }}/>}
                  <Line type="monotone" dataKey="tc" name="TC por pago" stroke="#3fcbe0" strokeWidth={2}
                    dot={{ r: 2.5, fill: '#3fcbe0', strokeWidth: 0 }} activeDot={{ r: 4 }}/>
                  <Line type="monotone" dataKey="prom" name="Promedio histórico" stroke="#e3c05a" strokeWidth={2.5}
                    dot={false} activeDot={{ r: 4 }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </article>

      {/* ── 4. Compras análisis R$/kg (tabla) ── */}
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

      {/* ── 5. Costo por kg de metal (Plata + Oro fusionados) ── */}
      <article className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-ray-border/40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Costo por kg de metal</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-ray-border/40">
          {/* Plata */}
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Plata</p>
            <p className="text-xl font-bold tabular-nums text-slate-200 mb-4">{costoPlataPorKilo > 0 ? formatCLP(costoPlataPorKilo) : '—'}</p>
            <div className="space-y-3">
              {[
                { label: 'Bruto',  val: brutoPorKilo,     color: '#94a3b8', total: costoPlataPorKilo },
                { label: 'Baño',   val: banoPlataPorKilo, color: '#cbd5e1', total: costoPlataPorKilo },
                { label: 'Aduana', val: aduanaPorKilo,    color: '#475569', total: costoPlataPorKilo },
              ].map(({ label, val, color, total }) => {
                const pct = total > 0 ? (val / total) * 100 : 0
                return (
                  <div key={label}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[10px] text-slate-500">{label}</span>
                      <span className="text-xs font-semibold text-white tabular-nums">{val > 0 ? formatCLP(val) : '—'}</span>
                    </div>
                    <div className="h-1 rounded-full bg-ray-border overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* Oro */}
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Oro</p>
            <p className="text-xl font-bold tabular-nums text-amber-300 mb-4">{costoOroPorKilo > 0 ? formatCLP(costoOroPorKilo) : '—'}</p>
            <div className="space-y-3">
              {[
                { label: 'Bruto',  val: brutoPorKilo,   color: '#8a6a22', total: costoOroPorKilo },
                { label: 'Baño',   val: banoOroPorKilo, color: '#e3c05a', total: costoOroPorKilo },
                { label: 'Aduana', val: aduanaPorKilo,  color: '#78716c', total: costoOroPorKilo },
              ].map(({ label, val, color, total }) => {
                const pct = total > 0 ? (val / total) * 100 : 0
                return (
                  <div key={label}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[10px] text-slate-500">{label}</span>
                      <span className="text-xs font-semibold text-white tabular-nums">{val > 0 ? formatCLP(val) : '—'}</span>
                    </div>
                    <div className="h-1 rounded-full bg-ray-border overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </article>

      {/* ── 6. Alerta baño oro faltante ── */}
      {banoOroPorKilo === 0 && (kilos['ORO GF'] || 0) > 0 && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/15 px-4 py-3 text-xs text-amber-300">
          ⚠ Tienes kilos de <span className="font-semibold">ORO GF</span> sin baño de oro registrado.
          Edita los baños en Historial para separar correctamente los costos de oro y plata.
        </div>
      )}

      {/* ── 7. Rentabilidad por categoría ── */}
      <article className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ray-border/40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Rentabilidad por categoría</p>
          <span className={`text-sm font-bold tabular-nums ${gananciaTotalGeneral >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {gananciaTotalGeneral >= 0 ? '+' : ''}{formatCLP(gananciaTotalGeneral)}
          </span>
        </div>
        {/* Encabezado de columnas */}
        <div className="grid grid-cols-4 divide-x divide-ray-border/40 border-b border-ray-border/40 bg-ray-border/10">
          {['Categoría','Precio venta','Costo / kg','Margen'].map((h) => (
            <div key={h} className="px-3 py-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{h}</p>
            </div>
          ))}
        </div>
        {/* Filas */}
        <div className="divide-y divide-ray-border/40">
          {margenes.map(({ cat, precio, costoCat, margen, margenPct, kilosCat, gananciaTotal, ok }) => (
            <div key={cat} className="grid grid-cols-4 divide-x divide-ray-border/40">
              <div className="px-3 py-3 flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CAT_COLORS[cat].dark }}/>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">{cat}</p>
                  {kilosCat > 0 && <p className="text-[9px] text-slate-600 tabular-nums">{formatKilos(kilosCat)}</p>}
                </div>
              </div>
              <div className="px-3 py-3 text-center">
                <p className="text-xs font-semibold text-slate-200 tabular-nums">{precio > 0 ? formatCLP(precio) : '—'}</p>
              </div>
              <div className="px-3 py-3 text-center">
                <p className="text-xs font-semibold text-slate-400 tabular-nums">{costoCat > 0 ? formatCLP(costoCat) : '—'}</p>
              </div>
              <div className="px-3 py-3 text-center">
                <p className={`text-xs font-bold tabular-nums ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {ok ? '+' : ''}{margen !== 0 ? formatCLP(margen) : '—'}
                </p>
                <p className={`text-[9px] tabular-nums ${ok ? 'text-emerald-600' : 'text-red-600'}`}>{formatPct(margenPct)}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Footer con barra visual por cat */}
        <div className="border-t border-ray-border/40 px-5 py-3 space-y-2">
          {margenes.filter(m => m.kilosCat > 0).map(({ cat, margenPct, ok }) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="w-14 text-[10px] text-slate-500 shrink-0">{cat}</span>
              <div className="flex-1 h-1 rounded-full bg-ray-border overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(Math.abs(margenPct)*100,100)}%`, background: ok ? CAT_COLORS[cat].dark : '#ef4444' }}/>
              </div>
              <span className={`w-10 text-right text-[10px] font-semibold tabular-nums shrink-0 ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{formatPct(margenPct)}</span>
            </div>
          ))}
        </div>
      </article>

      {/* ── 8. Kilos llegados + distribución ── */}
      <article className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ray-border/40">
          <div className="flex items-center gap-2">
            <Scale size={13} className="text-slate-500"/>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kilos llegados</p>
          </div>
          <p className="text-sm font-bold text-white tabular-nums">{kilos.total > 0 ? formatKilos(kilos.total) : '—'}</p>
        </div>
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-ray-border/40">
          {/* Barras por categoría */}
          <div className="px-5 py-4 space-y-3">
            {['MICRO','CADENA','ORO GF'].filter(cat => (kilos[cat]||0) > 0).map(cat => {
              const pct = kilos.total > 0 ? (kilos[cat]/kilos.total)*100 : 0
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: CAT_COLORS[cat].dark }}/>
                      {cat}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] text-slate-600 tabular-nums">{formatNumero(pct,1)}%</span>
                      <span className={`text-xs font-semibold tabular-nums ${CAT_COLORS[cat].text}`}>{formatKilos(kilos[cat])}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-ray-border overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CAT_COLORS[cat].dark }}/>
                  </div>
                </div>
              )
            })}
            <p className="text-[10px] text-slate-600 pt-1">Con 1% de merma aplicada</p>
          </div>
          {/* Pie chart */}
          <div className="px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Distribución</p>
            <div className="h-36">
              {dataPie.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-600">Sin llegadas</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dataPie} dataKey="value" nameKey="name" innerRadius={38} outerRadius={56} paddingAngle={3}>
                      {dataPie.map(d => <Cell key={d.name} fill={CAT_COLORS[d.name].dark}/>)}
                    </Pie>
                    <Tooltip formatter={(v) => [formatKilos(v),'']}
                      contentStyle={{ borderRadius:10, background:'#13181f', border:'1px solid #262d37', fontSize:11, color:'#e2e8f0' }}/>
                    <Legend iconSize={7} wrapperStyle={{ fontSize:10 }} verticalAlign="bottom" height={24}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* ── 9. Variación vs período anterior ── */}
      {periodos.length >= 2 && (() => {
        const actual = periodos[periodos.length - 1]
        const prev   = periodos[periodos.length - 2]
        return (
          <article className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-ray-border/40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Variación {prev.label} → {actual.label}
              </p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-ray-border/40 border-b border-ray-border/40 bg-ray-border/10">
              {['Métrica','Último período','Cambio'].map(h => (
                <div key={h} className="px-4 py-2 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{h}</p>
                </div>
              ))}
            </div>
            <div className="divide-y divide-ray-border/40">
              {[
                { label: 'TC ponderado', a: actual.tc,     p: prev.tc,     fmt: (v) => v > 0 ? formatNumero(v,2)+' CLP/R$' : '—' },
                { label: 'R$/kg compras', a: actual.rPorKg, p: prev.rPorKg, fmt: (v) => v > 0 ? formatNumero(v,2)+' R$/kg' : '—'  },
                { label: 'Kg comprados',  a: actual.kg,     p: prev.kg,     fmt: (v) => v > 0 ? formatKilos(v) : '—'              },
              ].map(({ label, a, p, fmt }) => {
                const { delta, pct } = variacion(a, p)
                const sube = delta >= 0
                return (
                  <div key={label} className="grid grid-cols-3 divide-x divide-ray-border/40">
                    <div className="px-4 py-3"><p className="text-xs text-slate-400 font-medium">{label}</p></div>
                    <div className="px-4 py-3 text-center"><p className="text-xs font-semibold text-white tabular-nums">{fmt(a)}</p></div>
                    <div className="px-4 py-3 text-center">
                      {delta !== 0 && <p className={`text-xs font-bold tabular-nums ${sube ? 'text-emerald-400' : 'text-red-400'}`}>
                        {sube ? '▲' : '▼'} {formatNumero(Math.abs(delta), a === actual.kg ? 3 : 2)}
                      </p>}
                      {pct !== null && <p className="text-[9px] text-slate-600 mt-0.5">{formatPct(Math.abs(pct))}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </article>
        )
      })()}

    </div>
  )
}

/* ── Precio de compra por proveedor ── */
function ComprasAnalisis({ compras, ponderado, min, max, totalR$, totalKg, historial, mesActivo }) {
  const fmtRkg  = (v) => v > 0 ? formatNumero(v, 2) : '—'

  // Agrupar por proveedor (detalle) con R$/kg ponderado del grupo
  const gruposMap = {}
  compras.forEach((c) => {
    const key = (c.detalle || '—').trim()
    if (!gruposMap[key]) gruposMap[key] = { nombre: key, kg: 0, r: 0 }
    gruposMap[key].kg += c.kilos || 0
    gruposMap[key].r  += c.total_reales || 0
  })
  const grupos = Object.values(gruposMap)
    .map((g) => ({ ...g, rPorKg: g.kg > 0 ? g.r / g.kg : 0 }))
    .filter((g) => g.rPorKg > 0)
    .sort((a, b) => a.rPorKg - b.rPorKg)

  const gMin    = grupos[0] || null
  const gMax    = grupos[grupos.length - 1] || null
  const gSpread = gMax && gMin ? gMax.rPorKg - gMin.rPorKg : 0

  return (
    <article className="card overflow-hidden">
      {/* Header compacto */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Precio de compra por proveedor</p>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums text-white">{fmtRkg(ponderado)}</span>
            <span className="text-xs font-medium text-slate-500">R$/kg pond.</span>
          </div>
          <p className="text-[10px] text-slate-600 text-right">
            {compras.length} {compras.length === 1 ? 'compra' : 'compras'}
            {totalKg > 0 && <><br />{formatKilos(totalKg)}</>}
          </p>
        </div>
      </div>

      {/* Min / Max destacados */}
      {grupos.length > 1 && gMin && gMax && (
        <div className="grid grid-cols-2 gap-2 px-4 pb-3">
          <div className="rounded-xl bg-emerald-900/20 border border-emerald-700/25 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">Menor precio</p>
            <p className="text-base font-bold tabular-nums text-emerald-400">{fmtRkg(gMin.rPorKg)}</p>
            <p className="text-[10px] text-slate-500 truncate">{gMin.nombre}</p>
          </div>
          <div className="rounded-xl bg-red-900/20 border border-red-700/25 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-red-600 mb-0.5">Mayor precio</p>
            <p className="text-base font-bold tabular-nums text-red-400">{fmtRkg(gMax.rPorKg)}</p>
            <p className="text-[10px] text-slate-500 truncate">{gMax.nombre}</p>
          </div>
        </div>
      )}

      {/* Barras: todos si ≤8, si no top-3 baratos + top-3 caros */}
      {(() => {
        const MAX_VISIBLE = 8
        const mostrar = grupos.length <= MAX_VISIBLE
          ? grupos
          : [...grupos.slice(0, 3), null, ...grupos.slice(-3)]
        const ocultos = grupos.length > MAX_VISIBLE ? grupos.length - 6 : 0
        return (
          <div className="border-t border-ray-border/40 px-4 py-3 space-y-1.5">
            {mostrar.map((g, i) => {
              if (g === null) return (
                <div key="sep" className="flex items-center gap-2 py-0.5">
                  <span className="w-20 shrink-0" />
                  <span className="flex-1 text-center text-[10px] text-slate-600">
                    · · · {ocultos} proveedores más · · ·
                  </span>
                  <span className="w-14 shrink-0" />
                </div>
              )
              const isMin    = grupos.indexOf(g) === 0
              const isMax    = grupos.indexOf(g) === grupos.length - 1
              const barPct   = gSpread > 0 ? Math.max(6, ((g.rPorKg - gMin.rPorKg) / gSpread) * 100) : 100
              const color    = isMin ? '#34d399' : isMax ? '#f87171' : '#1e3a5a'
              const valColor = isMin ? 'text-emerald-400' : isMax ? 'text-red-400' : 'text-slate-400'
              return (
                <div key={g.nombre + i} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 truncate text-[11px] text-slate-300">{g.nombre}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-ray-border overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: color }} />
                  </div>
                  <span className={`w-14 shrink-0 text-right text-[11px] tabular-nums font-semibold ${valColor}`}>
                    {fmtRkg(g.rPorKg)}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Footer totales */}
      <div className="flex items-center justify-between border-t border-ray-border/40 px-4 py-2.5">
        <span className="text-[10px] text-slate-600">{totalR$ > 0 ? formatReales(totalR$) : '—'} · {totalKg > 0 ? formatKilos(totalKg) : '—'}</span>
        <span className="text-[11px] font-bold text-ray-cyan tabular-nums">{fmtRkg(ponderado)} R$/kg</span>
      </div>

      {/* Evolución mensual */}
      {historial.length >= 2 && (
        <div className="border-t border-ray-border/40 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Evolución mensual R$/kg</p>
          <div className="space-y-1.5">
            {historial.map(({ key, label, rPorKg }) => {
              const esActivo = key === mesActivo
              const maxH     = Math.max(...historial.map((h) => h.rPorKg))
              const pct      = maxH > 0 ? (rPorKg / maxH) * 100 : 0
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-12 shrink-0 text-right text-[10px] font-medium ${esActivo ? 'text-ray-cyan' : 'text-slate-500'}`}>
                    {label}
                  </span>
                  <div className="flex-1 h-1 rounded-full bg-ray-border overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: esActivo ? '#3fcbe0' : '#1e3a5a' }} />
                  </div>
                  <span className={`w-14 shrink-0 text-right text-[10px] tabular-nums ${esActivo ? 'text-ray-cyan font-semibold' : 'text-slate-500'}`}>
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

