import { useState, useMemo } from 'react'
import { Banknote, Calendar, DollarSign, Droplet, Package, PackageCheck, Plus, ShoppingCart, Wrench } from 'lucide-react'
import Accordion from './Accordion.jsx'
import PreciosPonderados from './PreciosPonderados.jsx'
import { formatearInputNumero, parseNumeroFlexible, formatFecha, formatKilos, formatCLP, formatReales } from '../lib/formato.js'

const today = () => {
  const d = new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d - off).toISOString().slice(0, 10)
}
const CATS = ['MICRO', 'CADENA', 'ORO GF']

/* ── Definición de secciones registrables ────────────────────
   Una sola fuente de verdad: pill, formulario, colores y el
   resumen del "último ingreso" de cada categoría.            */
function buildSecciones(proveedoresHistoricos) {
  return [
    {
      key: 'compras_bruto',
      short: 'Compras',
      label: 'Compras de bruto',
      sub: 'Oro/plata en Brasil',
      icon: ShoppingCart,
      color: 'text-ray-cyan', dot: 'bg-ray-cyan', border: 'border-ray-cyan/20',
      pillOn: 'border-ray-cyan/60 bg-ray-cyan/10 text-ray-cyan',
      addLabel: 'Agregar compra',
      form: {
        type: 'quick',
        fields: [
          { key: 'fecha',        label: 'Fecha',     type: 'date',   default: today() },
          { key: 'detalle',      label: 'Proveedor', type: 'text',   placeholder: 'Nombre del proveedor', suggestions: proveedoresHistoricos },
          { key: 'kilos',        label: 'Kilos',     type: 'number', placeholder: '0,000', prefix: 'kg' },
          { key: 'total_reales', label: 'Total R$',  type: 'number', placeholder: '0,00',  prefix: 'R$' },
        ],
      },
      detalle: (r) => [
        r.detalle || null,
        r.kilos > 0 ? formatKilos(r.kilos) : null,
        r.total_reales > 0 ? formatReales(r.total_reales) : null,
      ].filter(Boolean),
    },
    {
      key: 'pagos',
      short: 'Pagos',
      label: 'Pagos realizados',
      sub: 'Define el T/C ponderado',
      icon: Banknote,
      color: 'text-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-700/30',
      pillOn: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300',
      addLabel: 'Agregar pago',
      form: {
        type: 'quick',
        fields: [
          { key: 'fecha',    label: 'Fecha',       type: 'date',   default: today() },
          { key: 'reales',   label: 'R$ pagados',  type: 'number', placeholder: '0,00', prefix: 'R$' },
          { key: 'chilenos', label: 'CLP pagados', type: 'number', placeholder: '0',    prefix: '$'  },
        ],
      },
      detalle: (r) => [
        r.reales > 0 ? formatReales(r.reales) : null,
        r.chilenos > 0 ? formatCLP(r.chilenos) : null,
      ].filter(Boolean),
    },
    {
      key: 'servicios_completados',
      short: 'Servicios',
      label: 'Servicios de fabricación',
      sub: 'Montaje y servicios en R$',
      icon: Wrench,
      color: 'text-violet-400', dot: 'bg-violet-400', border: 'border-violet-700/30',
      pillOn: 'border-violet-500/60 bg-violet-500/10 text-violet-300',
      addLabel: 'Agregar servicio',
      form: {
        type: 'quick',
        fields: [
          { key: 'fecha',        label: 'Fecha',    type: 'date',   default: today() },
          { key: 'detalle',      label: 'Detalle',  type: 'text',   placeholder: 'Concepto' },
          { key: 'total_reales', label: 'Total R$', type: 'number', placeholder: '0,00', prefix: 'R$' },
        ],
      },
      detalle: (r) => [
        r.detalle || null,
        r.total_reales > 0 ? formatReales(r.total_reales) : null,
      ].filter(Boolean),
    },
    {
      key: 'pagos_aduana',
      short: 'Aduana',
      label: 'Pagos a aduana',
      sub: 'T/I y glosas en CLP',
      icon: Package,
      color: 'text-amber-400', dot: 'bg-amber-400', border: 'border-amber-700/30',
      pillOn: 'border-amber-500/60 bg-amber-500/10 text-amber-300',
      addLabel: 'Agregar pago aduana',
      form: {
        type: 'quick',
        fields: [
          { key: 'fecha',     label: 'Fecha',     type: 'date',   default: today() },
          { key: 'kilos',     label: 'Kilos',     type: 'number', placeholder: '0,000', prefix: 'kg' },
          { key: 'total_clp', label: 'Total CLP', type: 'number', placeholder: '0',    prefix: '$'  },
        ],
      },
      detalle: (r) => [
        r.kilos > 0 ? formatKilos(r.kilos) : null,
        r.total_clp > 0 ? formatCLP(r.total_clp) : null,
      ].filter(Boolean),
    },
    {
      key: 'banos_completados',
      short: 'Baños',
      label: 'Baños procesados',
      sub: 'Plata y oro (kg · R$)',
      icon: Droplet,
      color: 'text-blue-400', dot: 'bg-blue-400', border: 'border-blue-700/30',
      pillOn: 'border-blue-500/60 bg-blue-500/10 text-blue-300',
      addLabel: 'Agregar baños',
      form: { type: 'banos' },
      detalle: (r) => [
        (r.plata_kilos || 0) > 0 ? `Plata ${formatKilos(r.plata_kilos)}` : null,
        (r.oro_kilos || 0) > 0 ? `Oro ${formatKilos(r.oro_kilos)}` : null,
      ].filter(Boolean),
    },
    {
      key: 'llegadas_mercaderia_por_bloque',
      short: 'Llegadas',
      label: 'Kilos llegados',
      sub: 'Embarque por categoría',
      icon: PackageCheck,
      color: 'text-teal-400', dot: 'bg-teal-400', border: 'border-teal-700/30',
      pillOn: 'border-teal-500/60 bg-teal-500/10 text-teal-300',
      addLabel: 'Agregar embarque',
      form: { type: 'llegadas' },
      detalle: (r) => [
        (r.MICRO || 0) > 0 ? `MICRO ${formatKilos(r.MICRO)}` : null,
        (r.CADENA || 0) > 0 ? `CADENA ${formatKilos(r.CADENA)}` : null,
        (r['ORO GF'] || 0) > 0 ? `ORO GF ${formatKilos(r['ORO GF'])}` : null,
      ].filter(Boolean),
    },
  ]
}

export default function Ingreso({ estado }) {
  const { mesData, updateMes, setPreciosPonderados, state } = estado

  // Extrae proveedores únicos de todos los meses
  const proveedoresHistoricos = useMemo(() => {
    const nombres = new Set()
    Object.values(state?.meses || {}).forEach(mes => {
      (mes.compras_bruto || []).forEach(c => {
        if (c.detalle?.trim()) nombres.add(c.detalle.trim())
      })
    })
    return [...nombres].sort()
  }, [state?.meses])

  const secciones = useMemo(() => buildSecciones(proveedoresHistoricos), [proveedoresHistoricos])

  const [selKey, setSelKey] = useState(secciones[0].key)
  const sel = secciones.find(s => s.key === selKey) || secciones[0]

  const addRow = (key, row) =>
    updateMes({ [key]: [...(mesData[key] || []), { ...row, _ts: Date.now() }] })

  // Último registro de la categoría seleccionada
  const ultimoSeccion = ultimoDe(mesData[sel.key] || [])

  // Último registro real entre TODAS las categorías del mes
  const ultimoGlobal = useMemo(() => {
    let best = null
    for (const s of secciones) {
      for (const r of mesData[s.key] || []) {
        if (!best || (r._ts || 0) > (best.item._ts || 0)) best = { sec: s, item: r }
      }
    }
    return best
  }, [secciones, mesData])

  return (
    <div className="space-y-4">

      {/* Precios ponderados — configuración, arriba de Registrar */}
      <Accordion title="Precios Ponderados" icon={DollarSign}>
        <PreciosPonderados
          valores={mesData.costos_ponderados_por_kilo || {}}
          onGuardar={setPreciosPonderados}
        />
      </Accordion>

      {/* REGISTRAR — pills horizontales desplazables */}
      <div>
        <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Registrar</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto scrollbar-none px-1 pb-1">
          {secciones.map((s) => {
            const active = s.key === selKey
            const n = (mesData[s.key] || []).length
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSelKey(s.key)}
                className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                  active ? s.pillOn : 'border-ray-border text-slate-400 hover:text-white hover:bg-ray-border/30'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                {s.short}
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                  active ? 'bg-ray-bg/50' : 'bg-ray-border/50 text-slate-500'
                }`}>
                  {n}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Formulario activo de la sección seleccionada */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-ray-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-ray-cyan-dim dark:text-ray-cyan">
              <sel.icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{sel.label}</p>
              <p className="truncate text-xs text-gray-500 dark:text-slate-400">{sel.sub}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-lg border border-ray-cyan/25 bg-ray-cyan/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ray-cyan">
            {(mesData[sel.key] || []).length} reg.
          </span>
        </div>

        <div className="p-4">
          {/* key fuerza el remount del formulario al cambiar de sección (resetea estado) */}
          {sel.form.type === 'quick' && (
            <QuickAdd
              key={sel.key}
              fields={sel.form.fields}
              addLabel={sel.addLabel}
              onAdd={(row) => addRow(sel.key, row)}
            />
          )}
          {sel.form.type === 'banos' && (
            <BanosAdd key={sel.key} onAdd={(row) => addRow(sel.key, row)} />
          )}
          {sel.form.type === 'llegadas' && (
            <LlegadasAdd key={sel.key} onAdd={(row) => addRow(sel.key, row)} />
          )}
        </div>
      </section>

      {/* Últimos ingresos — al final: categoría seleccionada + global */}
      <UltimoCard
        header={`Último en ${sel.short}`}
        seccion={sel}
        item={ultimoSeccion}
      />
      {ultimoGlobal && (
        <UltimoCard
          header="Último ingreso general"
          seccion={ultimoGlobal.sec}
          item={ultimoGlobal.item}
        />
      )}

      <p className="px-2 pt-1 text-center text-xs text-gray-400 dark:text-slate-600">
        Las entradas registradas se ven en la pestaña <span className="font-semibold">Historial</span>.
      </p>
    </div>
  )
}

/* ── Último registro de una lista (por timestamp, con fallback al último) ── */
function ultimoDe(rows) {
  let item = null
  for (const r of rows) {
    if (!item || (r._ts || 0) >= (item._ts || 0)) item = r
  }
  return item
}

/* ── UltimoCard: tarjeta resumen de un registro ── */
function UltimoCard({ header, seccion, item }) {
  const Icon = seccion.icon

  if (!item) {
    return (
      <article className="card overflow-hidden border border-ray-border/60">
        <div className="flex items-center justify-between px-5 py-3 border-b border-ray-border/40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{header}</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ray-border/30 text-slate-500">
            <Icon size={16} />
          </div>
          <p className="text-sm text-slate-500">
            Aún no hay registros en <span className="font-semibold text-slate-400">{seccion.label}</span>.
          </p>
        </div>
      </article>
    )
  }

  const detalles = seccion.detalle(item)
  const fecha = item.fecha ? formatFecha(item.fecha) : null

  return (
    <article className={`card overflow-hidden border ${seccion.border}`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-ray-border/40">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Último ingreso</p>
        {fecha && <p className="text-[10px] tabular-nums text-slate-500">{fecha}</p>}
      </div>
      <div className="flex items-start gap-3 px-5 py-3.5">
        <div className={`mt-0.5 shrink-0 h-2 w-2 rounded-full ${seccion.dot}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${seccion.color}`}>{seccion.label}</p>
          {detalles.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
              {detalles.map((d, i) => (
                <span key={i} className="text-xs text-slate-400 tabular-nums">{d}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

/* ── ProveedorInput: texto con autocomplete de proveedores ── */
function ProveedorInput({ value, placeholder, suggestions, onChange }) {
  const [open, setOpen] = useState(false)
  const filtered = value.length >= 1
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="input"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-xl border border-ray-border bg-ray-surface shadow-xl max-h-48 overflow-y-auto">
          {filtered.slice(0, 8).map(s => (
            <li key={s}
              onMouseDown={() => { onChange(s); setOpen(false) }}
              className="px-3 py-2 text-sm text-slate-300 cursor-pointer hover:bg-ray-border/40 first:rounded-t-xl last:rounded-b-xl"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── QuickAdd: formulario de ingreso ─────────────────────── */
function QuickAdd({ fields, onAdd, addLabel = 'Agregar' }) {
  const init = () => Object.fromEntries(fields.map((f) => [f.key, f.default ?? '']))
  const [form, setForm] = useState(init)
  const [error, setError] = useState(null)
  const [pendiente, setPendiente] = useState(null)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleAdd = () => {
    const parsed = Object.fromEntries(
      fields.map((f) => [f.key, f.type === 'number' ? parseNumeroFlexible(form[f.key]) : form[f.key]])
    )
    const textoVacio = fields.filter(f => f.type === 'text').some(f => !parsed[f.key]?.trim())
    const hayNumero  = fields.filter(f => f.type === 'number').some(f => (parsed[f.key] || 0) > 0)
    if (textoVacio || (fields.some(f => f.type === 'number') && !hayNumero)) {
      setError('Completá todos los campos requeridos.')
      return
    }
    setError(null)
    setPendiente(parsed)
  }

  const confirmar = () => {
    if (!pendiente) return
    onAdd(pendiente)
    setPendiente(null)
    setForm({ ...init(), fecha: today() })
  }

  const cancelar = () => setPendiente(null)

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="label">{f.label}</span>

            {f.type === 'date' ? (
              /* ── Date: input nativo visible (confiable en iOS) ── */
              <div className="relative">
                <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ray-cyan" />
                <input
                  type="date"
                  value={form[f.key] || ''}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="input pl-9 font-semibold tracking-wide"
                />
              </div>
            ) : f.type === 'tipo' ? (
              /* ── Toggle Oro / Plata ── */
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'plata', label: 'Plata', cls: 'text-slate-200 border-slate-400', on: 'bg-slate-400/20 border-slate-300 text-white' },
                  { val: 'oro',   label: 'Oro',   cls: 'text-amber-300 border-amber-700', on: 'bg-amber-500/20 border-amber-400 text-amber-200' },
                ].map((opt) => {
                  const active = (form[f.key] || 'plata') === opt.val
                  return (
                    <button key={opt.val} type="button" onClick={() => set(f.key, opt.val)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${active ? opt.on : `border-ray-border text-slate-500`}`}>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            ) : f.prefix ? (
              /* ── Número con prefijo (R$, $, kg) ── */
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ray-cyan dark:text-ray-cyan select-none">
                  {f.prefix}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form[f.key]}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.key, formatearInputNumero(e.target.value))}
                  className="input pl-9"
                />
              </div>
            ) : f.suggestions?.length > 0 ? (
              /* ── Texto con autocomplete ── */
              <ProveedorInput
                value={form[f.key]}
                placeholder={f.placeholder}
                suggestions={f.suggestions}
                onChange={(v) => set(f.key, v)}
              />
            ) : (
              /* ── Texto normal ── */
              <input
                type="text"
                value={form[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => set(f.key, e.target.value)}
                className="input"
              />
            )}
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
      {!pendiente ? (
        <button type="button" onClick={handleAdd} className="btn-primary w-full">
          <Plus size={16} /> {addLabel}
        </button>
      ) : (
        <div className="rounded-xl border border-ray-border/60 bg-ray-border/10 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Confirmar registro</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {fields.map(f => (
              <span key={f.key} className="text-xs text-slate-300 tabular-nums">
                <span className="text-slate-500">{f.label}: </span>
                {f.type === 'number'
                  ? (f.prefix === 'R$' ? `R$ ${pendiente[f.key]}` : f.prefix === '$' ? `$${pendiente[f.key].toLocaleString('es-CL')}` : `${pendiente[f.key]} kg`)
                  : pendiente[f.key]}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={confirmar} className="btn-primary flex-1 py-2">✓ Confirmar</button>
            <button type="button" onClick={cancelar} className="flex-1 rounded-xl border border-ray-border/60 py-2 text-sm text-slate-400 hover:bg-ray-border/20 transition">✕ Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Formulario especial para baños (Plata + Oro simultáneo) ── */
function BanosAdd({ onAdd }) {
  const init = () => ({ fecha: today(), plata_kilos: '', plata_r$: '', oro_kilos: '', oro_r$: '' })
  const [form, setForm] = useState(init)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleAdd = () => {
    const fecha = form.fecha
    const pk = parseNumeroFlexible(form.plata_kilos)
    const pr = parseNumeroFlexible(form['plata_r$'])
    const ok = parseNumeroFlexible(form.oro_kilos)
    const or = parseNumeroFlexible(form['oro_r$'])
    if (pk > 0 || pr > 0 || ok > 0 || or > 0) {
      onAdd({ fecha, plata_kilos: pk, plata_reales: pr, oro_kilos: ok, oro_reales: or })
    }
    setForm(init())
  }

  const metalRows = [
    { tipo: 'plata', label: 'Plata', kilosKey: 'plata_kilos', rKey: 'plata_r$',
      cls: 'border-slate-400/40 bg-slate-400/5', headCls: 'text-slate-300' },
    { tipo: 'oro',   label: 'Oro',   kilosKey: 'oro_kilos',   rKey: 'oro_r$',
      cls: 'border-amber-500/40 bg-amber-500/5', headCls: 'text-amber-300' },
  ]

  return (
    <div className="space-y-3">
      <div className="relative">
        <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ray-cyan" />
        <input
          type="date"
          value={form.fecha || ''}
          onChange={(e) => set('fecha', e.target.value)}
          className="input pl-9 font-semibold tracking-wide"
        />
      </div>
      {metalRows.map(({ tipo, label, kilosKey, rKey, cls, headCls }) => (
        <div key={tipo} className={`rounded-xl border p-3 space-y-2 ${cls}`}>
          <span className={`text-xs font-bold uppercase tracking-widest ${headCls}`}>{label}</span>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="label">Kilos</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ray-cyan select-none">kg</span>
                <input type="text" inputMode="decimal" value={form[kilosKey]} placeholder="0,000"
                  onChange={(e) => set(kilosKey, formatearInputNumero(e.target.value))} className="input pl-9" />
              </div>
            </label>
            <label className="block">
              <span className="label">Total R$</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ray-cyan select-none">R$</span>
                <input type="text" inputMode="decimal" value={form[rKey]} placeholder="0,00"
                  onChange={(e) => set(rKey, formatearInputNumero(e.target.value))} className="input pl-9" />
              </div>
            </label>
          </div>
        </div>
      ))}
      <button type="button" onClick={handleAdd} className="btn-primary w-full">
        <Plus size={16} /> Agregar baños
      </button>
    </div>
  )
}

/* ── Formulario especial para llegadas ──────────────────── */
function LlegadasAdd({ onAdd }) {
  const init = () => ({ MICRO: '', CADENA: '', 'ORO GF': '' })
  const [form, setForm] = useState(init)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const handleAdd = () => {
    onAdd({
      MICRO:    parseNumeroFlexible(form.MICRO),
      CADENA:   parseNumeroFlexible(form.CADENA),
      'ORO GF': parseNumeroFlexible(form['ORO GF']),
    })
    setForm(init())
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {CATS.map((cat) => (
          <label key={cat} className="block">
            <span className="label">{cat}</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-ray-cyan dark:text-ray-cyan select-none">
                kg
              </span>
              <input
                type="text" inputMode="decimal"
                value={form[cat]} placeholder="0,000"
                onChange={(e) => set(cat, formatearInputNumero(e.target.value))}
                className="input pl-7"
              />
            </div>
          </label>
        ))}
      </div>
      <button type="button" onClick={handleAdd} className="btn-primary w-full">
        <Plus size={16} /> Agregar embarque
      </button>
    </div>
  )
}
