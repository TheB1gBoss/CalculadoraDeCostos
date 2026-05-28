import { useState } from 'react'
import { Banknote, Calendar, Droplet, Package, PackageCheck, Plus, ShoppingCart, Wrench } from 'lucide-react'
import Accordion from './Accordion.jsx'
import { parseNumeroFlexible } from '../lib/formato.js'

const today = () => new Date().toISOString().slice(0, 10)
const CATS = ['MICRO', 'CADENA', 'ORO GF']

export default function Ingreso({ estado }) {
  const { mesData, updateMes } = estado

  const addRow = (key, row) =>
    updateMes({ [key]: [...(mesData[key] || []), { ...row, _ts: Date.now() }] })

  return (
    <div className="space-y-3">

      <Accordion title="Compras de Bruto" icon={ShoppingCart} defaultOpen>
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
        <QuickAdd
          fields={[
            { key: 'fecha',     label: 'Fecha',     type: 'date',   default: today() },
            { key: 'kilos',     label: 'Kilos',     type: 'number', placeholder: '0,000', prefix: 'kg' },
            { key: 'total_clp', label: 'Total CLP', type: 'number', placeholder: '0',    prefix: '$'  },
          ]}
          onAdd={(row) => addRow('banos_completados', row)}
        />
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
              /* ── Date: centrado ── */
              <div className="relative">
                <input
                  type="date"
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="input text-center font-semibold tracking-wide cursor-pointer"
                />
                <Calendar size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ray-cyan" />
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
                  onChange={(e) => set(f.key, e.target.value)}
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
                onChange={(e) => set(cat, e.target.value)}
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
