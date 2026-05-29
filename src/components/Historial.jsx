import { Calendar, ChevronDown, Lock, Trash2, Unlock } from 'lucide-react'
import { useState } from 'react'
import { calcularIndicadores } from '../lib/calculos.js'
import { formatCLP, formatFecha, formatKilos, formatMes, formatReales } from '../lib/formato.js'

const SECCIONES = [
  { key: 'compras_bruto',                   label: 'Compras de Bruto',          accent: 'blue'    },
  { key: 'pagos',                            label: 'Pagos Realizados',           accent: 'emerald' },
  { key: 'servicios_completados',            label: 'Servicios de Fabricación',   accent: 'purple'  },
  { key: 'pagos_aduana',                     label: 'Pagos a Aduana',             accent: 'orange'  },
  { key: 'banos_completados',               label: 'Baños Procesados',            accent: 'cyan'    },
  { key: 'llegadas_mercaderia_por_bloque',  label: 'Kilos Llegados',              accent: 'yellow'  },
]

const AC = {
  blue:    { border: 'border-l-blue-500',    dot: 'bg-blue-500',    head: 'text-blue-400',    badge: 'bg-blue-500/10 text-blue-300'     },
  emerald: { border: 'border-l-emerald-500', dot: 'bg-emerald-500', head: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300'},
  purple:  { border: 'border-l-purple-500',  dot: 'bg-purple-500',  head: 'text-purple-400',  badge: 'bg-purple-500/10 text-purple-300'  },
  orange:  { border: 'border-l-orange-500',  dot: 'bg-orange-500',  head: 'text-orange-400',  badge: 'bg-orange-500/10 text-orange-300'  },
  cyan:    { border: 'border-l-cyan-500',    dot: 'bg-cyan-500',    head: 'text-cyan-400',    badge: 'bg-cyan-500/10 text-cyan-300'      },
  yellow:  { border: 'border-l-yellow-500',  dot: 'bg-yellow-500',  head: 'text-yellow-400',  badge: 'bg-yellow-500/10 text-yellow-300'  },
}

/* ── Chips de fecha ── */
function DateChip({ fecha }) {
  if (!fecha) return null
  return (
    <span className="shrink-0 rounded-md bg-ray-border px-2 py-0.5 font-mono text-[10px] text-slate-400">
      {formatFecha(fecha)}
    </span>
  )
}

/* ── Botones de acción ── */
function RowActions({ locked, onLock, onDelete }) {
  return (
    <div className="flex shrink-0 gap-0.5">
      <button type="button" onClick={onLock}
        className={`rounded-lg p-1.5 transition-colors ${
          locked
            ? 'text-amber-400 hover:bg-amber-900/20'
            : 'text-slate-500 hover:bg-ray-border hover:text-slate-300'
        }`} aria-label={locked ? 'Desbloquear' : 'Bloquear'}>
        {locked ? <Lock size={13} /> : <Unlock size={13} />}
      </button>
      <button type="button" onClick={onDelete}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-900/20 hover:text-red-400"
        aria-label="Eliminar">
        <Trash2 size={13} />
      </button>
    </div>
  )
}

/* ── Rows por categoría ── */
function RowCompras({ r, locked, onLock, onDelete }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors ${locked ? 'bg-amber-900/10 opacity-60' : 'hover:bg-ray-border/40'}`}>
      <DateChip fecha={r.fecha} />
      <span className="flex-1 truncate text-sm text-slate-200">{r.detalle || '—'}</span>
      <span className="shrink-0 text-xs text-slate-400">{formatKilos(r.kilos)}</span>
      <span className="shrink-0 font-medium text-sm text-blue-300">{formatReales(r.total_reales)}</span>
      <RowActions locked={locked} onLock={onLock} onDelete={onDelete} />
    </div>
  )
}

function RowPagos({ r, locked, onLock, onDelete }) {
  const tc = r.reales ? (r.chilenos / r.reales).toFixed(2) : '—'
  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors ${locked ? 'bg-amber-900/10 opacity-60' : 'hover:bg-ray-border/40'}`}>
      <DateChip fecha={r.fecha} />
      <span className="font-medium text-sm text-emerald-300">{formatReales(r.reales)}</span>
      <span className="text-slate-600 text-xs">→</span>
      <span className="font-medium text-sm text-white">{formatCLP(r.chilenos)}</span>
      <span className="ml-auto shrink-0 text-xs text-slate-500">TC {tc}</span>
      <RowActions locked={locked} onLock={onLock} onDelete={onDelete} />
    </div>
  )
}

function RowServicios({ r, locked, onLock, onDelete }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors ${locked ? 'bg-amber-900/10 opacity-60' : 'hover:bg-ray-border/40'}`}>
      <DateChip fecha={r.fecha} />
      <span className="flex-1 truncate text-sm text-slate-200">{r.detalle || '—'}</span>
      <span className="shrink-0 font-medium text-sm text-purple-300">{formatReales(r.total_reales)}</span>
      <RowActions locked={locked} onLock={onLock} onDelete={onDelete} />
    </div>
  )
}

function RowAduana({ r, locked, onLock, onDelete }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors ${locked ? 'bg-amber-900/10 opacity-60' : 'hover:bg-ray-border/40'}`}>
      <DateChip fecha={r.fecha} />
      <span className="flex-1 truncate text-sm text-slate-200">{r.detalle || '—'}</span>
      <span className="shrink-0 text-xs text-slate-400">{formatKilos(r.kilos)}</span>
      <span className="shrink-0 font-medium text-sm text-orange-300">{formatCLP(r.total_clp)}</span>
      <RowActions locked={locked} onLock={onLock} onDelete={onDelete} />
    </div>
  )
}

function RowBanos({ r, locked, onLock, onDelete }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors ${locked ? 'bg-amber-900/10 opacity-60' : 'hover:bg-ray-border/40'}`}>
      <DateChip fecha={r.fecha} />
      <span className="flex-1 truncate text-sm text-slate-200">{r.detalle || '—'}</span>
      <span className="shrink-0 text-xs text-slate-400">{formatKilos(r.kilos)}</span>
      <span className="shrink-0 font-medium text-sm text-cyan-300">{formatReales(r.total_clp)}</span>
      <RowActions locked={locked} onLock={onLock} onDelete={onDelete} />
    </div>
  )
}

function RowLlegadas({ r, locked, onLock, onDelete }) {
  const total = (r.MICRO || 0) + (r.CADENA || 0) + (r['ORO GF'] || 0)
  return (
    <div className={`rounded-xl px-3 py-2.5 transition-colors ${locked ? 'bg-amber-900/10 opacity-60' : 'hover:bg-ray-border/40'}`}>
      <div className="flex items-center gap-2.5 mb-2">
        <DateChip fecha={r.fecha} />
        <span className="ml-auto text-xs text-slate-400">{formatKilos(total)} bruto</span>
        <RowActions locked={locked} onLock={onLock} onDelete={onDelete} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[['MICRO', r.MICRO, 'text-blue-400'], ['CADENA', r.CADENA, 'text-emerald-400'], ['ORO GF', r['ORO GF'], 'text-amber-400']].map(([cat, val, color]) => (
          <div key={cat} className="rounded-lg bg-ray-border/60 px-2 py-1.5 text-center">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{cat}</div>
            <div className={`text-sm font-semibold ${color}`}>{formatKilos(val)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Sección por categoría (colapsable) ── */
function SeccionCategoria({ seccion, entradas, onLock, onDelete }) {
  const { key, label, accent } = seccion
  const ac = AC[accent]
  const count = entradas.length
  const [open, setOpen] = useState(false)

  const renderRow = (r, idx) => {
    const props = { r, key: idx, locked: !!r._locked,
      onLock: () => onLock(key, idx), onDelete: () => onDelete(key, idx) }
    if (key === 'compras_bruto')                  return <RowCompras   {...props} />
    if (key === 'pagos')                           return <RowPagos     {...props} />
    if (key === 'servicios_completados')           return <RowServicios {...props} />
    if (key === 'pagos_aduana')                    return <RowAduana    {...props} />
    if (key === 'banos_completados')              return <RowBanos     {...props} />
    if (key === 'llegadas_mercaderia_por_bloque') return <RowLlegadas  {...props} />
    return null
  }

  return (
    <article className={`card overflow-hidden border-l-4 ${ac.border} p-0`}>
      <button
        type="button"
        onClick={() => count > 0 && setOpen((o) => !o)}
        className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${count > 0 ? 'hover:bg-ray-border/30' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${ac.dot}`} />
          <h3 className={`text-xs font-bold uppercase tracking-wide ${ac.head}`}>{label}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${count > 0 ? ac.badge : 'bg-ray-border text-slate-600'}`}>
            {count === 0 ? 'Sin registros' : `${count} ${count === 1 ? 'entrada' : 'entradas'}`}
          </span>
          {count > 0 && (
            <ChevronDown
              size={14}
              className={`shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>

      {open && count > 0 && (
        <div className="space-y-0.5 px-2 pb-2 border-t border-ray-border/50">
          {entradas.map((r, idx) => renderRow(r, idx))}
        </div>
      )}
    </article>
  )
}

/* ── Componente principal ── */
export default function Historial({ estado }) {
  const { mesActivo, mesData, mesesOrdenados, setMesActivo, eliminarMes, state } = estado

  const handleDelete = (key, idx) => {
    const next = (mesData[key] || []).filter((_, i) => i !== idx)
    estado.updateMes({ [key]: next })
  }

  const handleLock = (key, idx) => {
    const next = (mesData[key] || []).map((r, i) => i === idx ? { ...r, _locked: !r._locked } : r)
    estado.updateMes({ [key]: next })
  }

  const handleEliminarMes = (key) => {
    if (mesesOrdenados.length <= 1) { alert('No puedes eliminar el último mes guardado.'); return }
    if (confirm(`¿Eliminar el mes ${formatMes(key)}?`)) eliminarMes(key)
  }

  return (
    <div className="space-y-4">

      {/* ── Selector de meses ── */}
      {mesesOrdenados.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {[...mesesOrdenados].reverse().map((key) => {
            const ind = calcularIndicadores(state.meses[key])
            const activo = key === mesActivo
            const pos = ind.indicadorFabricacion >= 0
            return (
              <li key={key} className={`card relative p-4 ${activo ? 'ring-2 ring-ray-cyan' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => setMesActivo(key)} className="flex flex-1 items-start gap-3 text-left">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ray-cyan-dim text-ray-cyan">
                      <Calendar size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{formatMes(key)}</p>
                      <p className="text-xs text-slate-400">{activo ? 'Mes activo' : 'Toca para activar'}</p>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleEliminarMes(key)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-900/20 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <KPI label="Costo / kg"    value={formatCLP(ind.costoTotalPorKilo)} />
                  <KPI label="Kilos totales" value={formatKilos(ind.kilos.total)} />
                  <KPI label="Indicador" value={(pos ? '+' : '') + formatCLP(ind.indicadorFabricacion)}
                    color={pos ? 'text-emerald-400' : 'text-red-400'} />
                  <KPI label="TC pond." value={ind.tipoCambio ? ind.tipoCambio.toFixed(2) : '—'} />
                </dl>
              </li>
            )
          })}
        </ul>
      )}

      {/* ── Secciones del mes activo ── */}
      <div className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-slate-500">
          Registros — {formatMes(mesActivo)}
        </h2>
        {SECCIONES.map((sec) => (
          <SeccionCategoria
            key={sec.key}
            seccion={sec}
            entradas={mesData[sec.key] || []}
            onLock={handleLock}
            onDelete={handleDelete}
          />
        ))}
      </div>

    </div>
  )
}

function KPI({ label, value, color }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-semibold ${color || 'text-white'}`}>{value}</dd>
    </div>
  )
}
