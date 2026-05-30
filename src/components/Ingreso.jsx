import { useState } from 'react'
import { Banknote, Calendar, DollarSign, Droplet, Package, PackageCheck, Plus, ShoppingCart, Wrench } from 'lucide-react'
import Accordion from './Accordion.jsx'
import PreciosPonderados from './PreciosPonderados.jsx'
import { formatearInputNumero, parseNumeroFlexible } from '../lib/formato.js'

const today = () => {
  const d = new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d - off).toISOString().slice(0, 10)
}
const CATS = ['MICRO', 'CADENA', 'ORO GF']

export default function Ingreso({ estado }) {
  const { mesData, updateMes, setPreciosPonderados } = estado

  const addRow = (key, row) =>
    updateMes({ [key]: [...(mesData[key] || []), { ...row, _ts: Date.now() }] })

  return (
    <div className="space-y-3">

      <Accordion title="Precios Ponderados por Kg" icon={DollarSign}>
        <PreciosPonderados
          valores={mesData.costos_ponderados_por_kilo || {}}
          onGuardar={setPreciosPonderados}
        />
      </Accordion>

      <Accordion title="Compras de Bruto" icon={ShoppingCart}>
        <QuickAdd
          fields={[
            { key: 'fecha',        label: 'Fecha',     type: 'date',   default: today() },
            { key: 'detalle',      label: 'Proveedor', type: 'text',   placeholder: 'Nombre del proveedor' },
            { key: 'kilos',        label: 'Kilos',     type: 'number', placeholder: '0,000', prefix: 'kg' },
            { key: 'total_reales', label: 'Total R$',  type: 'number', placeholder: '0,00',  prefix: 'R$' },
          ]}
          onAdd={(row) => addRow('compras_bruto', row)}
        />
      </Accordion>

      <Accordion title="Pagos Realizados" icon={Banknote}>
        <QuickAdd
          fields={[
            { key: 'fecha',    label: 'Fecha',       type: 'date',   default: today() },
            { key: 'reales',   label: 'R$ pagados',  type: 'number', placeholder: '0,00', prefix: 'R$' },
            { key: 'chilenos', label: 'CLP pagados', type: 'number', placeholder: '0',    prefix: '$'  },
          ]}
          onAdd={(row) => addRow('pagos', row)}
        />
      </Accordion>

      <Accordion title="Servicios de Fabricación" icon={Wrench}>
        <QuickAdd
          fields={[
            { key: 'fecha',        label: 'Fecha',    type: 'date',   default: today() },
            { key: 'detalle',      label: 'Detalle',  type: 'text',   placeholder: 'Concepto' },
            { key: 'total_reales', label: 'Total R$', type: 'number', placeholder: '0,00', prefix: 'R$' },
          ]}
          onAdd={(row) => addRow('servicios_completados', row)}
        />
      </Accordion>

      <Accordion title="Pagos a Aduana" icon={Package}>
        <QuickAdd
          fields={[
            { key: 'fecha',     label: 'Fecha',     type: 'date',   default: today() },
            { key: 'kilos',     label: 'Kilos',     type: 'number', placeholder: '0,000', prefix: 'kg' },
            { key: 'total_clp', label: 'Total CLP', type: 'number', placeholder: '0',    prefix: '$'  },
          ]}
          onAdd={(row) => addRow('pagos_aduana', row)}
        />
      </Accordion>

      <Accordion title="Baños Procesados" icon={Droplet}>
        <BanosAdd onAdd={(row) => addRow('banos_completados', row)} />
      </Accordion>

      <Accordion title="Kilos Llegados" icon={PackageCheck}>
        <LlegadasAdd onAdd={(row) => addRow('llegadas_mercaderia_por_bloque', row)} />
      </Accordion>

      <p className="px-2 pt-2 text-center text-xs text-gray-400 dark:text-slate-600">
        Las entradas registradas se ven en la pestaña <span className="font-semibold">Historial</span>.
      </p>
    </div>
  )
}

/* ── QuickAdd: formulario de ingreso ─────────────────────── */
function QuickAdd({ fields, onAdd }) {
  const init = () => Object.fromEntries(fields.map((f) => [f.key, f.default ?? '']))
  const [form, setForm] = useState(init)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleAdd = () => {
    const parsed = Object.fromEntries(
      fields.map((f) => [f.key, f.type === 'number' ? parseNumeroFlexible(form[f.key]) : form[f.key]])
    )
    onAdd(parsed)
    setForm({ ...init(), fecha: today() })
  }

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
      <button type="button" onClick={handleAdd} className="btn-primary w-full">
        <Plus size={16} /> Agregar
      </button>
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
