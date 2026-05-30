import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatCLP, formatFecha, formatKilos, formatMes, formatReales, formatearInputNumero } from '../lib/formato.js'
import { parseNumeroFlexible } from '../lib/formato.js'

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
    { key: 'fecha',     label: 'Fecha',         type: 'date'   },
    { key: 'tipo',      label: 'Tipo de metal', type: 'tipo'   },
    { key: 'kilos',     label: 'Kilos',         type: 'number', prefix: 'kg' },
    { key: 'total_clp', label: 'Total R$',      type: 'number', prefix: 'R$' },
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
          <label key={f.key} className="block">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{f.label}</span>
            {f.type === 'tipo' ? (
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
                  type={f.type === 'date' ? 'date' : 'text'}
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

/* ── Chip de fecha ── */
function DateChip({ fecha }) {
  if (!fecha) return null
  return (
    <span className="shrink-0 rounded-md bg-ray-border px-2 py-0.5 font-mono text-[10px] text-slate-400">
      {formatFecha(fecha)}
    </span>
  )
}

/* ── Botones de acción ── */
function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button type="button" onClick={onEdit}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-slate-500 hover:bg-ray-border hover:text-ray-cyan transition-colors">
        <Pencil size={10} /> Editar
      </button>
      <button type="button" onClick={onDelete}
        className="rounded-lg p-1.5 text-slate-600 hover:bg-red-900/20 hover:text-red-400 transition-colors"
        aria-label="Eliminar">
        <Trash2 size={13} />
      </button>
    </div>
  )
}

/* ── Contenido de cada fila (sin botones) ── */
function RowContent({ skey, r }) {
  if (skey === 'compras_bruto') return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 px-1">
      <DateChip fecha={r.fecha} />
      <span className="flex-1 truncate text-sm text-slate-200">{r.detalle || '—'}</span>
      <span className="text-xs text-slate-400">{formatKilos(r.kilos)}</span>
      <span className="font-medium text-sm text-blue-300">{formatReales(r.total_reales)}</span>
    </div>
  )
  if (skey === 'pagos') {
    const tc = r.reales ? (r.chilenos / r.reales).toFixed(2) : '—'
    return (
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 px-1">
        <DateChip fecha={r.fecha} />
        <span className="font-medium text-sm text-emerald-300">{formatReales(r.reales)}</span>
        <span className="text-slate-600 text-xs">→</span>
        <span className="font-medium text-sm text-white">{formatCLP(r.chilenos)}</span>
        <span className="ml-auto text-xs text-slate-500">TC {tc}</span>
      </div>
    )
  }
  if (skey === 'servicios_completados') return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 px-1">
      <DateChip fecha={r.fecha} />
      <span className="flex-1 truncate text-sm text-slate-200">{r.detalle || '—'}</span>
      <span className="font-medium text-sm text-purple-300">{formatReales(r.total_reales)}</span>
    </div>
  )
  if (skey === 'pagos_aduana') return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 px-1">
      <DateChip fecha={r.fecha} />
      <span className="flex-1 truncate text-sm text-slate-200">{r.detalle || '—'}</span>
      <span className="text-xs text-slate-400">{formatKilos(r.kilos)}</span>
      <span className="font-medium text-sm text-orange-300">{formatCLP(r.total_clp)}</span>
    </div>
  )
  if (skey === 'banos_completados') {
    const esOro = r.tipo === 'oro'
    return (
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 px-1">
        <DateChip fecha={r.fecha} />
        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
          esOro ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-400/15 text-slate-300'
        }`}>{esOro ? 'ORO' : 'PLATA'}</span>
        <span className="flex-1 truncate text-sm text-slate-200">{r.detalle || ''}</span>
        <span className="text-xs text-slate-400">{formatKilos(r.kilos)}</span>
        <span className="font-medium text-sm text-cyan-300">{formatReales(r.total_clp)}</span>
      </div>
    )
  }
  if (skey === 'llegadas_mercaderia_por_bloque') {
    const total = (r.MICRO || 0) + (r.CADENA || 0) + (r['ORO GF'] || 0)
    return (
      <div className="flex-1 min-w-0 px-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <DateChip fecha={r.fecha} />
          <span className="ml-auto text-xs text-slate-400">{formatKilos(total)} bruto</span>
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
  return null
}

/* ── Sección por categoría (colapsable) ── */
function SeccionCategoria({ seccion, entradas, editing, editForm, onEditStart, onEditChange, onEditConfirm, onEditUndo, onDelete }) {
  const { key, label, accent } = seccion
  const ac = AC[accent]
  const count = entradas.length
  const [open, setOpen] = useState(false)

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
            <ChevronDown size={14} className={`shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          )}
        </div>
      </button>

      {open && count > 0 && (
        <div className="space-y-1 px-2 pb-2 border-t border-ray-border/50 pt-1">
          {entradas.map((r, idx) => {
            const isEditing = editing?.key === key && editing?.idx === idx
            if (isEditing) {
              return (
                <div key={idx} className="px-1 py-1">
                  <EditForm
                    skey={key}
                    form={editForm}
                    onChange={onEditChange}
                    onConfirm={onEditConfirm}
                    onUndo={onEditUndo}
                  />
                </div>
              )
            }
            return (
              <div key={idx} className="flex items-start gap-1 rounded-xl py-1.5 hover:bg-ray-border/30 transition-colors">
                <RowContent skey={key} r={r} />
                <RowActions
                  onEdit={() => onEditStart(key, idx, r)}
                  onDelete={() => onDelete(key, idx, r)}
                />
              </div>
            )
          })}
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

  const handleEditStart = (key, idx, r) => {
    if (!confirm('¿Confirmas que quieres editar esta entrada?')) return
    const form = {}
    const fields = EDIT_FIELDS[key] || []
    fields.forEach((f) => {
      if (f.type === 'tipo') form[f.key] = r[f.key] === 'oro' ? 'oro' : 'plata'
      else if (f.type === 'number') form[f.key] = r[f.key] != null ? formatearInputNumero(String(r[f.key])) : ''
      else form[f.key] = r[f.key] !== undefined ? String(r[f.key]) : ''
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
      <MesSelector mesesOrdenados={mesesOrdenados} mesActivo={mesActivo} setMesActivo={setMesActivo} />

      <div className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-slate-500">
          Registros — {formatMes(mesActivo)}
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
