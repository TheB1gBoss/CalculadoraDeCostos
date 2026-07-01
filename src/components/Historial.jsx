import { Calendar, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatCLP, formatFecha, formatKilos, formatMes, formatReales, formatearInputNumero, formatearNumeroParaInput } from '../lib/formato.js'
import { parseNumeroFlexible } from '../lib/formato.js'
import { MERMA_LLEGADAS } from '../lib/calculos.js'

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

/* Campos editables por categoría */
const EDIT_FIELDS = {
  compras_bruto: [
    { key: 'fecha',        label: 'Fecha',      type: 'date'   },
    { key: 'detalle',      label: 'Proveedor',  type: 'text'   },
    { key: 'kilos',        label: 'Kilos',      type: 'number', prefix: 'kg' },
    { key: 'total_reales', label: 'Total R$',   type: 'number', prefix: 'R$' },
  ],
  pagos: [
    { key: 'fecha',    label: 'Fecha',       type: 'date'   },
    { key: 'reales',   label: 'R$ pagados',  type: 'number', prefix: 'R$' },
    { key: 'chilenos', label: 'CLP pagados', type: 'number', prefix: '$'  },
  ],
  servicios_completados: [
    { key: 'fecha',        label: 'Fecha',    type: 'date'   },
    { key: 'detalle',      label: 'Detalle',  type: 'text'   },
    { key: 'total_reales', label: 'Total R$', type: 'number', prefix: 'R$' },
  ],
  pagos_aduana: [
    { key: 'fecha',     label: 'Fecha',     type: 'date'   },
    { key: 'kilos',     label: 'Kilos',     type: 'number', prefix: 'kg' },
    { key: 'total_clp', label: 'Total CLP', type: 'number', prefix: '$'  },
  ],
  banos_completados: [
    { key: 'fecha',         label: 'Fecha',           type: 'date'             },
    { key: 'plata_kilos',   label: 'Plata — Kilos',   type: 'number', prefix: 'kg' },
    { key: 'plata_reales',  label: 'Plata — R$',      type: 'number', prefix: 'R$' },
    { key: 'oro_kilos',     label: 'Oro — Kilos',     type: 'number', prefix: 'kg' },
    { key: 'oro_reales',    label: 'Oro — R$',        type: 'number', prefix: 'R$' },
  ],
  llegadas_mercaderia_por_bloque: [
    { key: 'fecha',   label: 'Fecha',  type: 'date'   },
    { key: 'MICRO',   label: 'MICRO',  type: 'number', prefix: 'kg' },
    { key: 'CADENA',  label: 'CADENA', type: 'number', prefix: 'kg' },
    { key: 'ORO GF',  label: 'ORO GF', type: 'number', prefix: 'kg' },
  ],
}

/* ── Formulario de edición inline ── */
function EditForm({ skey, form, onChange, onConfirm, onUndo }) {
  const fields = EDIT_FIELDS[skey] || []
  return (
    <div className="rounded-xl border border-ray-cyan/20 bg-ray-cyan-dim/10 p-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className={`block ${f.type === 'date' ? 'sm:col-span-2' : ''}`}>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{f.label}</span>
            {f.type === 'date' ? (
              <div className="relative mt-1">
                <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ray-cyan" />
                <input
                  type="date"
                  value={form[f.key] || ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  className="input pl-9 font-semibold tracking-wide text-sm"
                />
              </div>
            ) : f.type === 'tipo' ? (
              <div className="mt-1 grid grid-cols-2 gap-2">
                {[{ val: 'plata', label: 'Plata' }, { val: 'oro', label: 'Oro' }].map((opt) => {
                  const active = (form[f.key] || 'plata') === opt.val
                  const isOro = opt.val === 'oro'
                  return (
                    <button key={opt.val} type="button" onClick={() => onChange(f.key, opt.val)}
                      className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                        active
                          ? (isOro ? 'bg-amber-500/20 border-amber-400 text-amber-200' : 'bg-slate-400/20 border-slate-300 text-white')
                          : 'border-ray-border text-slate-500'
                      }`}>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="relative mt-1">
                {f.prefix && (
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ray-cyan select-none">
                    {f.prefix}
                  </span>
                )}
                <input
                  type="text"
                  inputMode={f.type === 'number' ? 'decimal' : undefined}
                  value={form[f.key] ?? ''}
                  onChange={(e) => onChange(f.key, f.type === 'number' ? formatearInputNumero(e.target.value) : e.target.value)}
                  className={`input text-sm ${f.prefix ? 'pl-9' : ''}`}
                />
              </div>
            )}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onConfirm}
          className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition">
          ✓ Confirmar
        </button>
        <button type="button" onClick={onUndo}
          className="flex-1 rounded-xl bg-ray-border py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition">
          ✕ Deshacer
        </button>
      </div>
    </div>
  )
}

/* ── Helpers numéricos ── */
const num = (v) => (typeof v === 'number' ? v : parseFloat(v) || 0)
const sumKey = (rows, k) => rows.reduce((a, r) => a + num(r[k]), 0)
const dash = <span className="text-slate-600">—</span>

// Normaliza baños en formato antiguo (tipo/kilos/total_clp) al esquema nuevo
function normBano(r) {
  const esNuevo = r.plata_kilos != null || r.plata_reales != null
  return {
    plata_kilos:  esNuevo ? num(r.plata_kilos)  : (r.tipo !== 'oro' ? num(r.kilos)     : 0),
    plata_reales: esNuevo ? num(r.plata_reales) : (r.tipo !== 'oro' ? num(r.total_clp) : 0),
    oro_kilos:    esNuevo ? num(r.oro_kilos)    : (r.tipo === 'oro' ? num(r.kilos)     : 0),
    oro_reales:   esNuevo ? num(r.oro_reales)   : (r.tipo === 'oro' ? num(r.total_clp) : 0),
  }
}

/* ── Columnas por categoría (tabla compacta) ──
   cell: contenido por fila · foot: total de la columna       */
const COLUMNS = {
  compras_bruto: [
    { label: 'Fecha',     align: 'left',  cell: (r) => formatFecha(r.fecha) },
    { label: 'Proveedor', align: 'left',  strong: true, grow: true, cell: (r) => r.detalle || dash },
    { label: 'Kg',        align: 'right', cell: (r) => (r.kilos > 0 ? formatKilos(r.kilos) : dash),
      foot: (rows) => formatKilos(sumKey(rows, 'kilos')) },
    { label: 'Total R$',  align: 'right', accent: true, cell: (r) => (r.total_reales > 0 ? formatReales(r.total_reales) : dash),
      foot: (rows) => formatReales(sumKey(rows, 'total_reales')) },
  ],
  pagos: [
    { label: 'Fecha', align: 'left',  cell: (r) => formatFecha(r.fecha) },
    { label: 'R$',    align: 'right', cell: (r) => (r.reales > 0 ? formatReales(r.reales) : dash),
      foot: (rows) => formatReales(sumKey(rows, 'reales')) },
    { label: 'CLP',   align: 'right', accent: true, cell: (r) => (r.chilenos > 0 ? formatCLP(r.chilenos) : dash),
      foot: (rows) => formatCLP(sumKey(rows, 'chilenos')) },
    { label: 'TC',    align: 'right', cell: (r) => (r.reales ? (r.chilenos / r.reales).toFixed(2) : dash) },
  ],
  servicios_completados: [
    { label: 'Fecha',    align: 'left',  cell: (r) => formatFecha(r.fecha) },
    { label: 'Detalle',  align: 'left',  strong: true, grow: true, cell: (r) => r.detalle || dash },
    { label: 'Total R$', align: 'right', accent: true, cell: (r) => (r.total_reales > 0 ? formatReales(r.total_reales) : dash),
      foot: (rows) => formatReales(sumKey(rows, 'total_reales')) },
  ],
  pagos_aduana: [
    { label: 'Fecha',     align: 'left',  cell: (r) => formatFecha(r.fecha) },
    { label: 'Kg',        align: 'right', cell: (r) => (r.kilos > 0 ? formatKilos(r.kilos) : dash),
      foot: (rows) => formatKilos(sumKey(rows, 'kilos')) },
    { label: 'Total CLP', align: 'right', accent: true, cell: (r) => (r.total_clp > 0 ? formatCLP(r.total_clp) : dash),
      foot: (rows) => formatCLP(sumKey(rows, 'total_clp')) },
  ],
  banos_completados: [
    { label: 'Fecha', align: 'left', cell: (r) => formatFecha(r.fecha) },
    { group: 'Plata', label: 'Kilos', align: 'right',
      cell: (r) => { const k = normBano(r).plata_kilos; return k > 0 ? formatKilos(k) : dash },
      foot: (rows) => formatKilos(rows.reduce((a, r) => a + normBano(r).plata_kilos, 0)) },
    { group: 'Plata', label: 'Reales', align: 'right',
      cell: (r) => { const v = normBano(r).plata_reales; return v > 0 ? formatReales(v) : dash },
      foot: (rows) => formatReales(rows.reduce((a, r) => a + normBano(r).plata_reales, 0)) },
    { group: 'Oro', label: 'Kilos', align: 'right',
      cell: (r) => { const k = normBano(r).oro_kilos; return k > 0 ? formatKilos(k) : dash },
      foot: (rows) => formatKilos(rows.reduce((a, r) => a + normBano(r).oro_kilos, 0)) },
    { group: 'Oro', label: 'Reales', align: 'right', accent: true,
      cell: (r) => { const v = normBano(r).oro_reales; return v > 0 ? formatReales(v) : dash },
      foot: (rows) => formatReales(rows.reduce((a, r) => a + normBano(r).oro_reales, 0)) },
  ],
  llegadas_mercaderia_por_bloque: [
    { label: 'Fecha',  align: 'left',  cell: (r) => formatFecha(r.fecha) },
    { label: 'MICRO',  align: 'right', cell: (r) => ((r.MICRO || 0) > 0 ? formatKilos(r.MICRO) : dash),
      foot: (rows) => formatKilos(sumKey(rows, 'MICRO')) },
    { label: 'CADENA', align: 'right', cell: (r) => ((r.CADENA || 0) > 0 ? formatKilos(r.CADENA) : dash),
      foot: (rows) => formatKilos(sumKey(rows, 'CADENA')) },
    { label: 'ORO GF', align: 'right', cell: (r) => ((r['ORO GF'] || 0) > 0 ? formatKilos(r['ORO GF']) : dash),
      foot: (rows) => formatKilos(sumKey(rows, 'ORO GF')) },
    { label: 'Total −1%', align: 'right', accent: true,
      cell: (r) => formatKilos((num(r.MICRO) + num(r.CADENA) + num(r['ORO GF'])) * MERMA_LLEGADAS),
      foot: (rows) => formatKilos((sumKey(rows, 'MICRO') + sumKey(rows, 'CADENA') + sumKey(rows, 'ORO GF')) * MERMA_LLEGADAS) },
  ],
}

/* Total resumen para la cabecera de cada categoría */
function resumenTotal(key, rows) {
  switch (key) {
    case 'compras_bruto':         return formatReales(sumKey(rows, 'total_reales'))
    case 'pagos':                 return formatCLP(sumKey(rows, 'chilenos'))
    case 'servicios_completados': return formatReales(sumKey(rows, 'total_reales'))
    case 'pagos_aduana':          return formatCLP(sumKey(rows, 'total_clp'))
    case 'banos_completados':     return formatReales(rows.reduce((a, r) => { const b = normBano(r); return a + b.plata_reales + b.oro_reales }, 0))
    case 'llegadas_mercaderia_por_bloque': return formatKilos(sumKey(rows, 'MICRO') + sumKey(rows, 'CADENA') + sumKey(rows, 'ORO GF'))
    default: return null
  }
}

/* ── Sección por categoría (tabla compacta, colapsable) ── */
function SeccionCategoria({ seccion, entradas, editing, editForm, onEditStart, onEditChange, onEditConfirm, onEditUndo, onDelete }) {
  const { key, label, accent } = seccion
  const ac = AC[accent]
  const cols = COLUMNS[key] || []
  const hasFoot = cols.some((c) => c.foot)
  const hasGroups = cols.some((c) => c.group)
  const div = 'border-r border-ray-border/40' // separador vertical entre columnas
  // Ordenar por fecha ascendente; guardar índice original para edición/borrado
  const entradasConIdx = entradas.map((r, idx) => ({ r, idx }))
  entradasConIdx.sort((a, b) => (a.r.fecha || '') < (b.r.fecha || '') ? -1 : (a.r.fecha || '') > (b.r.fecha || '') ? 1 : 0)
  const count = entradas.length
  const [open, setOpen] = useState(false)

  return (
    <article className={`card overflow-hidden border-l-4 ${ac.border} p-0`}>
      <button
        type="button"
        onClick={() => count > 0 && setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors ${count > 0 ? 'hover:bg-ray-border/30' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2 w-2 shrink-0 rounded-full ${ac.dot}`} />
          <h3 className={`truncate text-xs font-bold uppercase tracking-wide ${ac.head}`}>{label}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {count > 0 && (
            <span className="text-xs font-semibold tabular-nums text-slate-300">{resumenTotal(key, entradas)}</span>
          )}
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${count > 0 ? ac.badge : 'bg-ray-border text-slate-600'}`}>
            {count === 0 ? 'Sin registros' : count}
          </span>
          {count > 0 && (
            <ChevronDown size={14} className={`shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          )}
        </div>
      </button>

      {open && count > 0 && (
        <div className="overflow-x-auto border-t border-ray-border/50">
          <table className="w-full text-xs">
            <thead>
              {hasGroups ? (
                <>
                  <tr className="text-[9px] uppercase tracking-wider text-slate-500">
                    {(() => {
                      const out = []
                      for (let i = 0; i < cols.length; i++) {
                        const c = cols[i]
                        if (!c.group) {
                          out.push(
                            <th key={i} rowSpan={2}
                              className={`px-2.5 py-2 align-bottom font-bold ${c.align === 'right' ? 'text-right' : 'text-left'} ${div} ${c.grow ? 'w-full' : 'whitespace-nowrap'}`}>
                              {c.label}
                            </th>
                          )
                        } else if (i === 0 || cols[i - 1].group !== c.group) {
                          let span = 1
                          while (i + span < cols.length && cols[i + span].group === c.group) span++
                          out.push(
                            <th key={`g${i}`} colSpan={span} className={`px-2.5 py-1.5 text-center font-bold ${div}`}>
                              {c.group}
                            </th>
                          )
                          i += span - 1
                        }
                      }
                      return out
                    })()}
                    <th rowSpan={2} className="w-px px-2 py-2" aria-label="Acciones" />
                  </tr>
                  <tr className="text-[9px] uppercase tracking-wider text-slate-500">
                    {cols.map((c, i) => (c.group ? (
                      <th key={i} className={`px-2.5 py-1.5 font-semibold ${c.align === 'right' ? 'text-right' : 'text-left'} ${div} whitespace-nowrap`}>
                        {c.label}
                      </th>
                    ) : null))}
                  </tr>
                </>
              ) : (
                <tr className="text-[9px] uppercase tracking-wider text-slate-500">
                  {cols.map((c, i) => (
                    <th key={i} className={`px-2.5 py-2 font-bold ${c.align === 'right' ? 'text-right' : 'text-left'} ${div} ${c.grow ? 'w-full' : 'whitespace-nowrap'}`}>
                      {c.label}
                    </th>
                  ))}
                  <th className="w-px px-2 py-2" aria-label="Acciones" />
                </tr>
              )}
            </thead>
            <tbody>
              {entradasConIdx.map(({ r, idx }) => {
                const isEditing = editing?.key === key && editing?.idx === idx
                if (isEditing) {
                  return (
                    <tr key={idx}>
                      <td colSpan={cols.length + 1} className="p-2">
                        <EditForm skey={key} form={editForm} onChange={onEditChange} onConfirm={onEditConfirm} onUndo={onEditUndo} />
                      </td>
                    </tr>
                  )
                }
                return (
                  <tr key={idx} className="border-t border-ray-border/40 hover:bg-ray-border/20 transition-colors">
                    {cols.map((c, i) => (
                      <td key={i} className={`px-2.5 py-2 align-top tabular-nums ${div} ${c.align === 'right' ? 'text-right' : 'text-left'} ${
                        c.strong ? 'font-medium text-slate-100' : c.accent ? `font-semibold ${ac.head}` : 'text-slate-400'
                      } ${c.grow ? 'break-words' : 'whitespace-nowrap'}`}>
                        {c.cell(r)}
                      </td>
                    ))}
                    <td className="px-1.5 py-1.5 align-top">
                      <div className="flex items-center gap-0.5">
                        <button type="button" onClick={() => onEditStart(key, idx, r)} aria-label="Editar"
                          className="rounded-md p-1 text-slate-600 hover:bg-ray-border hover:text-ray-cyan transition-colors">
                          <Pencil size={12} />
                        </button>
                        <button type="button" onClick={() => onDelete(key, idx, r)} aria-label="Eliminar"
                          className="rounded-md p-1 text-slate-600 hover:bg-red-900/20 hover:text-red-400 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {hasFoot && (
              <tfoot>
                <tr className="border-t-2 border-ray-border/70 bg-ray-border/10">
                  {cols.map((c, i) => (
                    <td key={i} className={`px-2.5 py-2 align-top tabular-nums ${div} ${c.align === 'right' ? 'text-right' : 'text-left'} ${
                      i === 0 ? 'text-[10px] font-bold uppercase tracking-wide text-slate-500' : `font-bold ${ac.head}`
                    } ${c.grow ? '' : 'whitespace-nowrap'}`}>
                      {i === 0 ? 'Total' : (c.foot ? c.foot(entradas) : '')}
                    </td>
                  ))}
                  <td className="px-1.5" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </article>
  )
}

/* ── Selector de mes ── */
function MesSelector({ mesesOrdenados, mesActivo, setMesActivo }) {
  if (mesesOrdenados.length <= 1) return null
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {[...mesesOrdenados].reverse().map((key) => (
        <button key={key} type="button" onClick={() => setMesActivo(key)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            key === mesActivo
              ? 'bg-ray-cyan text-ray-bg'
              : 'bg-ray-surface border border-ray-border text-slate-400 hover:text-white'
          }`}>
          {formatMes(key)}
        </button>
      ))}
    </div>
  )
}

/* ── Componente principal ── */
export default function Historial({ estado }) {
  const { mesActivo, mesData, mesesOrdenados, setMesActivo } = estado
  const [editing, setEditing] = useState(null) // { key, idx }
  const [editForm, setEditForm] = useState({})
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleEditStart = (key, idx, r) => {
    if (!confirm('¿Confirmas que quieres editar esta entrada?')) return
    const form = {}
    const fields = EDIT_FIELDS[key] || []
    // Para baños en formato antiguo, migrar al nuevo esquema combinado
    const esAntiguo = key === 'banos_completados' && r.plata_kilos == null && r.plata_reales == null
    const rNorm = esAntiguo && key === 'banos_completados'
      ? {
          fecha: r.fecha,
          plata_kilos:  r.tipo !== 'oro' ? r.kilos     : 0,
          plata_reales: r.tipo !== 'oro' ? r.total_clp : 0,
          oro_kilos:    r.tipo === 'oro' ? r.kilos     : 0,
          oro_reales:   r.tipo === 'oro' ? r.total_clp : 0,
        }
      : r
    fields.forEach((f) => {
      if (f.type === 'number') form[f.key] = formatearNumeroParaInput(rNorm[f.key])
      else form[f.key] = rNorm[f.key] !== undefined ? String(rNorm[f.key]) : ''
    })
    setEditing({ key, idx })
    setEditForm(form)
  }

  const handleEditChange = (fieldKey, value) => {
    setEditForm((prev) => ({ ...prev, [fieldKey]: value }))
  }

  const handleEditConfirm = () => {
    if (!editing) return
    const { key, idx } = editing
    const fields = EDIT_FIELDS[key] || []
    const arr = (mesData[key] || []).map((r, i) => {
      if (i !== idx) return r
      const updated = { ...r }
      // Para baños en formato antiguo, eliminar claves obsoletas al actualizar
      if (key === 'banos_completados') {
        delete updated.tipo; delete updated.kilos; delete updated.total_clp
      }
      fields.forEach((f) => {
        updated[f.key] = f.type === 'number'
          ? parseNumeroFlexible(String(editForm[f.key] ?? ''))
          : editForm[f.key]
      })
      return updated
    })
    estado.updateMes({ [key]: arr })
    setEditing(null)
    setEditForm({})
    showToast('✓ Guardado — si cambió la fecha, la entrada se reordenó en la lista')
  }

  const handleEditUndo = () => {
    setEditing(null)
    setEditForm({})
  }

  const handleDelete = (key, idx, r) => {
    const label = r?.detalle || r?.fecha || 'esta entrada'
    if (!confirm(`¿Eliminar "${label}"? Esta acción no se puede deshacer.`)) return
    const next = (mesData[key] || []).filter((_, i) => i !== idx)
    estado.updateMes({ [key]: next })
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}
      <div className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-slate-500">
          Registros
        </h2>
        {SECCIONES.map((sec) => (
          <SeccionCategoria
            key={sec.key}
            seccion={sec}
            entradas={mesData[sec.key] || []}
            editing={editing}
            editForm={editForm}
            onEditStart={handleEditStart}
            onEditChange={handleEditChange}
            onEditConfirm={handleEditConfirm}
            onEditUndo={handleEditUndo}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}
