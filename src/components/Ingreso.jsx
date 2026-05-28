import { useState } from 'react'
import { Banknote, Droplet, Package, PackageCheck, Plus, ShoppingCart, Trash2, Wrench } from 'lucide-react'
import Accordion from './Accordion.jsx'
import { formatCLP, formatKilos, formatNumero, formatReales, parseNumeroFlexible } from '../lib/formato.js'

const today = () => new Date().toISOString().slice(0, 10)

const CATS = ['MICRO', 'CADENA', 'ORO GF']

/* ── Timestamp legible ───────────────────────────────────── */
function fmtTs(ts) {
  if (!ts) return ''
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts))
}

/* ── Componente principal ────────────────────────────────── */
export default function Ingreso({ estado }) {
  const { mesData, updateMes, indicadores } = estado
  const { tipoCambio, costoTotalPorKilo, kilos } = indicadores

  const update = (key, rows) => updateMes({ [key]: rows })
  const addRow = (key, row) => update(key, [...(mesData[key] || []), { ...row, _ts: Date.now() }])
  const delRow = (key, idx) => update(key, (mesData[key] || []).filter((_, i) => i !== idx))

  return (
    <div className="space-y-3">

      {/* Banner en vivo — sticky */}
      <div className="sticky top-0 z-20 grid grid-cols-3 gap-2 bg-gray-50 pb-2 dark:bg-ray-bg">
        <LiveCard label="TC Ponderado"  value={tipoCambio ? formatNumero(tipoCambio, 2) : '—'} sub="CLP/R$" highlight />
        <LiveCard label="Costo / kg"    value={formatCLP(costoTotalPorKilo)} sub="total" />
        <LiveCard label="Kilos"         value={formatKilos(kilos.total)} sub="llegadas" />
      </div>

      {/* 1. BRUTO */}
      <Accordion title="BRUTO" subtitle="Compras de materia prima en R$" icon={ShoppingCart} defaultOpen badge={mesData.compras_bruto?.length || 0}>
        <QuickAdd
          fields={[
            { key: 'fecha',        label: 'Fecha',    type: 'date',   default: today() },
            { key: 'detalle',      label: 'Detalle',  type: 'text',   placeholder: 'Proveedor' },
            { key: 'kilos',        label: 'Kilos',    type: 'number', placeholder: '0,000' },
            { key: 'total_reales', label: 'Total R$', type: 'number', placeholder: '0,00' },
          ]}
          onAdd={(row) => addRow('compras_bruto', row)}
        />
        <EntryList
          rows={mesData.compras_bruto || []}
          onDelete={(i) => delRow('compras_bruto', i)}
          renderRow={(r) => (
            <span className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="font-medium">{r.detalle || '—'}</span>
              <span className="text-gray-400 dark:text-slate-500">{formatKilos(r.kilos)}</span>
              <span className="text-gray-400 dark:text-slate-500">{formatReales(r.total_reales)}</span>
            </span>
          )}
        />
      </Accordion>

      {/* 2. PAGOS */}
      <Accordion title="PAGOS" subtitle="Pagos al exterior — define el tipo de cambio" icon={Banknote} badge={mesData.pagos?.length || 0}>
        <QuickAdd
          fields={[
            { key: 'fecha',    label: 'Fecha',       type: 'date',   default: today() },
            { key: 'reales',   label: 'R$ pagados',  type: 'number', placeholder: '0,00' },
            { key: 'chilenos', label: 'CLP pagados', type: 'number', placeholder: '0' },
          ]}
          onAdd={(row) => addRow('pagos', row)}
        />
        <EntryList
          rows={mesData.pagos || []}
          onDelete={(i) => delRow('pagos', i)}
          renderRow={(r) => (
            <span className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span>{formatReales(r.reales)}</span>
              <span className="text-gray-400 dark:text-slate-500">→</span>
              <span className="font-medium">{formatCLP(r.chilenos)}</span>
              {r.reales > 0 && (
                <span className="text-xs text-brand-500 dark:text-ray-cyan">
                  TC: {formatNumero(r.chilenos / r.reales, 2)}
                </span>
              )}
            </span>
          )}
        />
      </Accordion>

      {/* 3. SERVICIOS */}
      <Accordion title="SERVICIOS" subtitle="Otros servicios en R$" icon={Wrench} badge={mesData.servicios_completados?.length || 0}>
        <QuickAdd
          fields={[
            { key: 'fecha',        label: 'Fecha',    type: 'date',   default: today() },
            { key: 'detalle',      label: 'Detalle',  type: 'text',   placeholder: 'Concepto' },
            { key: 'total_reales', label: 'Total R$', type: 'number', placeholder: '0,00' },
          ]}
          onAdd={(row) => addRow('servicios_completados', row)}
        />
        <EntryList
          rows={mesData.servicios_completados || []}
          onDelete={(i) => delRow('servicios_completados', i)}
          renderRow={(r) => (
            <span className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="font-medium">{r.detalle || '—'}</span>
              <span className="text-gray-400 dark:text-slate-500">{formatReales(r.total_reales)}</span>
            </span>
          )}
        />
      </Accordion>

      {/* 4. ADUANA */}
      <Accordion title="ADUANA" subtitle="Pagos de aduana en CLP" icon={Package} badge={mesData.pagos_aduana?.length || 0}>
        <QuickAdd
          fields={[
            { key: 'fecha',     label: 'Fecha',     type: 'date',   default: today() },
            { key: 'detalle',   label: 'Detalle',   type: 'text',   placeholder: 'T/I, glosa...' },
            { key: 'kilos',     label: 'Kilos',     type: 'number', placeholder: '0,000' },
            { key: 'total_clp', label: 'Total CLP', type: 'number', placeholder: '0' },
          ]}
          onAdd={(row) => addRow('pagos_aduana', row)}
        />
        <EntryList
          rows={mesData.pagos_aduana || []}
          onDelete={(i) => delRow('pagos_aduana', i)}
          renderRow={(r) => (
            <span className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="font-medium">{r.detalle || '—'}</span>
              <span className="text-gray-400 dark:text-slate-500">{formatKilos(r.kilos)}</span>
              <span className="text-gray-400 dark:text-slate-500">{formatCLP(r.total_clp)}</span>
            </span>
          )}
        />
      </Accordion>

      {/* 5. BAÑOS */}
      <Accordion title="BAÑOS" subtitle="Procesamiento de mercadería en R$" icon={Droplet} badge={mesData.banos_completados?.length || 0}>
        <QuickAdd
          fields={[
            { key: 'fecha',     label: 'Fecha',    type: 'date',   default: today() },
            { key: 'detalle',   label: 'Detalle',  type: 'text',   placeholder: 'N° baño' },
            { key: 'kilos',     label: 'Kilos',    type: 'number', placeholder: '0,000' },
            { key: 'total_clp', label: 'Total R$', type: 'number', placeholder: '0,00' },
          ]}
          onAdd={(row) => addRow('banos_completados', row)}
        />
        <EntryList
          rows={mesData.banos_completados || []}
          onDelete={(i) => delRow('banos_completados', i)}
          renderRow={(r) => (
            <span className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="font-medium">{r.detalle || '—'}</span>
              <span className="text-gray-400 dark:text-slate-500">{formatKilos(r.kilos)}</span>
              <span className="text-gray-400 dark:text-slate-500">{formatReales(r.total_clp)}</span>
            </span>
          )}
        />
      </Accordion>

      {/* 6. LLEGADA DE KILOS */}
      <Accordion title="LLEGADA DE KILOS" subtitle="Kilos recibidos por categoría" icon={PackageCheck} badge={mesData.llegadas_mercaderia_por_bloque?.length || 0}>
        <LlegadasAdd
          onAdd={(row) => addRow('llegadas_mercaderia_por_bloque', row)}
        />
        <EntryList
          rows={mesData.llegadas_mercaderia_por_bloque || []}
          onDelete={(i) => delRow('llegadas_mercaderia_por_bloque', i)}
          renderRow={(r) => (
            <span className="flex flex-wrap gap-x-4 gap-y-0.5">
              {CATS.map((c) => (
                <span key={c} className="text-xs">
                  <span className="font-semibold text-gray-600 dark:text-slate-400">{c} </span>
                  <span className="dark:text-white">{formatKilos(r[c])}</span>
                </span>
              ))}
            </span>
          )}
        />
      </Accordion>
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
    onAdd({ MICRO: parseNumeroFlexible(form.MICRO), CADENA: parseNumeroFlexible(form.CADENA), 'ORO GF': parseNumeroFlexible(form['ORO GF']) })
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

/* ── Lista de entradas (solo lectura + eliminar) ─────────── */
function EntryList({ rows, onDelete, renderRow }) {
  if (!rows.length) return null
  return (
    <ul className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 dark:border-ray-border">
      {[...rows].map((row, displayIdx) => {
        const realIdx = rows.length - 1 - displayIdx
        const actualRow = rows[realIdx]
        return (
          <li
            key={realIdx}
            className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2 dark:border-ray-border"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-800 dark:text-slate-200 truncate">
                {renderRow(actualRow)}
              </div>
              {actualRow._ts && (
                <div className="mt-0.5 text-xs text-gray-400 dark:text-slate-600">
                  {fmtTs(actualRow._ts)}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDelete(realIdx)}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              aria-label="Eliminar"
            >
              <Trash2 size={15} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/* ── LiveCard ────────────────────────────────────────────── */
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
