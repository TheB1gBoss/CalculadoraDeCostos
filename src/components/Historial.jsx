import { AlertTriangle, Calendar, Trash2 } from 'lucide-react'
import { calcularIndicadores } from '../lib/calculos.js'
import { formatCLP, formatKilos, formatMes, formatReales } from '../lib/formato.js'

const CAT_LABEL = {
  compras_bruto:                  'BRUTO',
  pagos:                          'PAGOS',
  servicios_completados:          'SERVICIOS',
  pagos_aduana:                   'ADUANA',
  banos_completados:              'BAÑOS',
  llegadas_mercaderia_por_bloque: 'LLEGADAS',
}

const CAT_COLOR = {
  BRUTO:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  PAGOS:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  SERVICIOS:'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  ADUANA:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  BAÑOS:    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  LLEGADAS: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
}

function fmtTs(ts) {
  if (!ts) return null
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts))
}

function rowSummary(key, r) {
  if (key === 'compras_bruto')
    return `${r.detalle || '—'}  ·  ${formatKilos(r.kilos)}  ·  ${formatReales(r.total_reales)}`
  if (key === 'pagos')
    return `${formatReales(r.reales)} → ${formatCLP(r.chilenos)}`
  if (key === 'servicios_completados')
    return `${r.detalle || '—'}  ·  ${formatReales(r.total_reales)}`
  if (key === 'pagos_aduana')
    return `${r.detalle || '—'}  ·  ${formatKilos(r.kilos)}  ·  ${formatCLP(r.total_clp)}`
  if (key === 'banos_completados')
    return `${r.detalle || '—'}  ·  ${formatKilos(r.kilos)}  ·  ${formatReales(r.total_clp)}`
  if (key === 'llegadas_mercaderia_por_bloque')
    return `MICRO ${formatKilos(r.MICRO)}  CADENA ${formatKilos(r.CADENA)}  ORO GF ${formatKilos(r['ORO GF'])}`
  return ''
}

export default function Historial({ estado }) {
  const { state, mesActivo, mesData, mesesOrdenados, setMesActivo, eliminarMes } = estado

  /* Registro de entradas del mes activo ordenado por timestamp */
  const logEntries = []
  Object.keys(CAT_LABEL).forEach((key) => {
    ;(mesData[key] || []).forEach((r, idx) => {
      logEntries.push({ key, idx, r, ts: r._ts || null })
    })
  })
  logEntries.sort((a, b) => (b.ts || 0) - (a.ts || 0))

  const handleEliminarEntrada = (key, idx) => {
    const next = (mesData[key] || []).filter((_, i) => i !== idx)
    estado.updateMes({ [key]: next })
  }

  const handleEliminar = (key) => {
    if (mesesOrdenados.length <= 1) { alert('No puedes eliminar el último mes guardado.'); return }
    if (confirm(`¿Eliminar el mes ${formatMes(key)}?`)) eliminarMes(key)
  }

  const handleExport = (key) => {
    import('../lib/excel.js').then(({ exportarWorkbook }) => exportarWorkbook(state, key))
  }

  return (
    <div className="space-y-4">

      {/* — Meses guardados — */}
      <section className="card p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Meses guardados</h2>
      </section>

      {mesesOrdenados.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {[...mesesOrdenados].reverse().map((key) => {
            const ind = calcularIndicadores(state.meses[key])
            const activo = key === mesActivo
            const pos = ind.indicadorFabricacion >= 0
            return (
              <li key={key} className={`card relative p-4 ${activo ? 'ring-2 ring-brand-500 dark:ring-ray-cyan' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => setMesActivo(key)} className="flex flex-1 items-start gap-3 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-ray-cyan-dim dark:text-ray-cyan">
                      <Calendar size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatMes(key)}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{activo ? 'Mes activo' : 'Toca para seleccionar'}</p>
                    </div>
                  </button>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => handleExport(key)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#101f38] dark:hover:text-slate-200"
                      title="Exportar">
                      <Download size={16} />
                    </button>
                    <button type="button" onClick={() => handleEliminar(key)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="Eliminar mes">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <KPI label="Costo / kg"    value={formatCLP(ind.costoTotalPorKilo)} />
                  <KPI label="Kilos totales" value={formatKilos(ind.kilos.total)} />
                  <KPI label="Indicador"     value={(pos ? '+' : '') + formatCLP(ind.indicadorFabricacion)} color={pos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} />
                  <KPI label="TC pond."      value={ind.tipoCambio ? ind.tipoCambio.toFixed(2) : '—'} />
                </dl>
              </li>
            )
          })}
        </ul>
      )}

      {/* — Registro de entradas del mes activo — */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Registro de entradas — {formatMes(mesActivo)}
        </h2>

        {logEntries.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-gray-400 dark:text-slate-600">
            <AlertTriangle size={16} />
            <span>Sin entradas registradas en este mes.</span>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {logEntries.map(({ key, idx, r, ts }, i) => {
              const label = CAT_LABEL[key]
              return (
                <li key={i} className="flex items-start gap-2 rounded-xl border border-gray-100 px-3 py-2.5 dark:border-ray-border">
                  <span className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${CAT_COLOR[label]}`}>
                    {label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-slate-200 truncate">
                      {rowSummary(key, r)}
                    </p>
                    {ts ? (
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-600">{fmtTs(ts)}</p>
                    ) : (
                      r.fecha && <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-600">{r.fecha}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEliminarEntrada(key, idx)}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    aria-label="Eliminar entrada"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function KPI({ label, value, color }) {
  return (
    <div>
      <dt className="text-gray-500 dark:text-slate-500">{label}</dt>
      <dd className={`font-semibold ${color || 'text-gray-900 dark:text-white'}`}>{value}</dd>
    </div>
  )
}
