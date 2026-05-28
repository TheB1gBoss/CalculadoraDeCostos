import { useState } from 'react'
import { Banknote, Droplet, Package, PackageCheck, Plus, ShoppingCart, Wrench } from 'lucide-react'
import Accordion from './Accordion.jsx'
import { formatCLP, formatKilos, formatNumero, parseNumeroFlexible } from '../lib/formato.js'

const today = () => new Date().toISOString().slice(0, 10)
const CATS = ['MICRO', 'CADENA', 'ORO GF']

export default function Ingreso({ estado }) {
  const { mesData, updateMes, indicadores } = estado
  const { tipoCambio, costoTotalPorKilo, kilos } = indicadores

  const addRow = (key, row) =>
    updateMes({ [key]: [...(mesData[key] || []), { ...row, _ts: Date.now() }] })

  return (
    <div className="space-y-3">

      {/* Banner en vivo — sticky */}
      <div className="sticky top-0 z-20 grid grid-cols-3 gap-2 bg-gray-50 pb-2 dark:bg-ray-bg">
        <LiveCard label="TC Ponderado" value={tipoCambio ? formatNumero(tipoCambio, 2) : '—'} sub="CLP/R$" highlight />
        <LiveCard label="Costo / kg"   value={formatCLP(costoTotalPorKilo)} sub="total" />
        <LiveCard label="Kilos"        value={formatKilos(kilos.total)} sub="llegadas" />
      </div>

      <Accordion title="Compras de Bruto" icon={ShoppingCart} defaultOpen>
        <QuickAdd
          fields={[
            { key: 'fecha',        label: 'Fecha',    type: 'date',   default: today() },
            { key: 'detalle',      label: 'Detalle',  type: 'text',   placeholder: 'Proveedor' },
            { key: 'kilos',        label: 'Kilos',    type: 'number', placeholder: '0,000' },
            { key: 'total_reales', label: 'Total R$', type: 'number', placeholder: '0,00' },
          ]}
          onAdd={(row) => addRow('compras_bruto', row)}
        />
      </Accordion>

      <Accordion title="Pagos Realizados" icon={Banknote}>
        <QuickAdd
          fields={[
            { key: 'fecha',    label: 'Fecha',       type: 'date',   default: today() },
            { key: 'reales',   label: 'R$ pagados',  type: 'number', placeholder: '0,00' },
            { key: 'chilenos', label: 'CLP pagados', type: 'number', placeholder: '0' },
          ]}
          onAdd={(row) => addRow('pagos', row)}
        />
      </Accordion>

      <Accordion title="Servicios de Fabricación" icon={Wrench}>
        <QuickAdd
          fields={[
            { key: 'fecha',        label: 'Fecha',    type: 'date',   default: today() },
            { key: 'detalle',      label: 'Detalle',  type: 'text',   placeholder: 'Concepto' },
            { key: 'total_reales', label: 'Total R$', type: 'number', placeholder: '0,00' },
          ]}
          onAdd={(row) => addRow('servicios_completados', row)}
        />
      </Accordion>

      <Accordion title="Pagos a Aduana" icon={Package}>
        <QuickAdd
          fields={[
            { key: 'fecha',     label: 'Fecha',     type: 'date',   default: today() },
            { key: 'detalle',   label: 'Detalle',   type: 'text',   placeholder: 'T/I, glosa...' },
            { key: 'kilos',     label: 'Kilos',     type: 'number', placeholder: '0,000' },
            { key: 'total_clp', label: 'Total CLP', type: 'number', placeholder: '0' },
          ]}
          onAdd={(row) => addRow('pagos_aduana', row)}
        />
      </Accordion>

      <Accordion title="Baños Procesados" icon={Droplet}>
        <QuickAdd
          fields={[
            { key: 'fecha',     label: 'Fecha',    type: 'date',   default: today() },
            { key: 'detalle',   label: 'Detalle',  type: 'text',   placeholder: 'N° baño' },
            { key: 'kilos',     label: 'Kilos',    type: 'number', placeholder: '0,000' },
            { key: 'total_clp', label: 'Total R$', type: 'number', placeholder: '0,00' },
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
      <div className="grid gap-2 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="label">{f.label}</span>
            <input
              type={f.type === 'date' ? 'date' : 'text'}
              inputMode={f.type === 'number' ? 'decimal' : undefined}
              value={form[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => set(f.key, e.target.value)}
              className="input"
            />
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
      MICRO:  parseNumeroFlexible(form.MICRO),
      CADENA: parseNumeroFlexible(form.CADENA),
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
            <input
              type="text" inputMode="decimal"
              value={form[cat]} placeholder="0,000"
              onChange={(e) => set(cat, e.target.value)}
              className="input"
            />
          </label>
        ))}
      </div>
      <button type="button" onClick={handleAdd} className="btn-primary w-full">
        <Plus size={16} /> Agregar embarque
      </button>
    </div>
  )
}

function LiveCard({ label, value, sub, highlight }) {
  return (
    <div className={[
      'card p-2.5 text-center',
      highlight ? 'bg-brand-50 border-brand-200 dark:bg-ray-cyan-dim dark:border-ray-cyan/30 dark:shadow-glow-sm' : '',
    ].join(' ')}>
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${highlight ? 'text-brand-600 dark:text-ray-cyan' : 'text-gray-500 dark:text-slate-400'}`}>
        {label}
      </p>
      <p className={`mt-0.5 text-base font-bold leading-tight ${highlight ? 'text-brand-700 dark:text-ray-cyan' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-slate-500">{sub}</p>}
    </div>
  )
}
