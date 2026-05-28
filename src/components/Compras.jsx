import { Banknote, ShoppingCart } from 'lucide-react'
import EditableTable from './EditableTable.jsx'
import { formatCLP, formatKilos, formatNumero, formatReales } from '../lib/formato.js'

export default function Compras({ estado }) {
  const { mesData, updateMes, indicadores } = estado
  const setField = (key) => (rows) => updateMes({ [key]: rows })

  const tc = indicadores.tipoCambio
  const totalKilos    = (mesData.compras_bruto || []).reduce((s, c) => s + (Number(c.kilos) || 0), 0)
  const totalR$       = (mesData.compras_bruto || []).reduce((s, c) => s + (Number(c.total_reales) || 0), 0)
  const totalR$Pagos  = (mesData.pagos || []).reduce((s, p) => s + (Number(p.reales) || 0), 0)
  const totalCLPPagos = (mesData.pagos || []).reduce((s, p) => s + (Number(p.chilenos) || 0), 0)

  return (
    <div className="space-y-4">

      {/* Banner en vivo */}
      <div className="grid grid-cols-3 gap-3">
        <LiveCard label="TC Ponderado"    value={tc ? formatNumero(tc, 2) : '—'} sub="CLP / R$" highlight />
        <LiveCard label="Kilos comprados" value={formatKilos(totalKilos)}         sub="en bruto" />
        <LiveCard label="Total R$"        value={formatReales(totalR$)}           sub={tc ? `≈ ${formatCLP(totalR$ * tc)}` : '—'} />
      </div>

      {/* Compras de bruto */}
      <section className="card p-4">
        <SectionHeader icon={ShoppingCart} title="Compras de bruto" count={mesData.compras_bruto?.length} />
        <EditableTable
          rows={mesData.compras_bruto || []}
          onChange={setField('compras_bruto')}
          newRow={() => ({ fecha: '', detalle: '', kilos: 0, total_reales: 0 })}
          columns={[
            { key: 'fecha',        label: 'Fecha',    type: 'date',   width: '140px' },
            { key: 'detalle',      label: 'Detalle',  type: 'text',   placeholder: 'Proveedor / descripción' },
            { key: 'kilos',        label: 'Kilos',    type: 'number', placeholder: '0,000', width: '110px' },
            { key: 'total_reales', label: 'Total R$', type: 'number', placeholder: '0,00',  width: '140px' },
          ]}
          totals={[
            { key: 'kilos',        format: formatKilos  },
            { key: 'total_reales', format: formatReales },
          ]}
          emptyText="Sin compras de bruto este mes."
        />
      </section>

      {/* Pagos al exterior */}
      <section className="card p-4">
        <SectionHeader icon={Banknote} title="Pagos al exterior" subtitle="define el tipo de cambio" count={mesData.pagos?.length} />
        <EditableTable
          rows={mesData.pagos || []}
          onChange={setField('pagos')}
          newRow={() => ({ fecha: '', reales: 0, chilenos: 0 })}
          columns={[
            { key: 'fecha',    label: 'Fecha',       type: 'date',   width: '140px' },
            { key: 'reales',   label: 'R$ pagados',  type: 'number', placeholder: '0,00' },
            { key: 'chilenos', label: 'CLP pagados', type: 'number', placeholder: '0' },
          ]}
          totals={[
            { key: 'reales',   format: formatReales },
            { key: 'chilenos', format: formatCLP },
          ]}
          emptyText="Sin pagos al exterior este mes."
        />
        {(mesData.pagos?.length || 0) > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-ray-bg dark:text-slate-400">
            <Stat label="Total R$"  value={formatReales(totalR$Pagos)} />
            <Stat label="Total CLP" value={formatCLP(totalCLPPagos)} />
            <Stat label="TC pond."  value={tc ? `${formatNumero(tc, 2)} CLP/R$` : '—'} bold />
          </div>
        )}
      </section>
    </div>
  )
}

function LiveCard({ label, value, sub, highlight }) {
  return (
    <div className={[
      'card p-3 text-center transition',
      highlight
        ? 'bg-brand-50 border-brand-200 dark:bg-ray-cyan-dim dark:border-ray-cyan/30 dark:shadow-glow-sm'
        : 'dark:bg-ray-surface',
    ].join(' ')}>
      <p className={`text-xs font-medium uppercase tracking-wide ${highlight ? 'text-brand-600 dark:text-ray-cyan' : 'text-gray-500 dark:text-slate-400'}`}>
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${highlight ? 'text-brand-700 dark:text-ray-cyan' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
      {sub && <p className={`text-xs ${highlight ? 'text-brand-500 dark:text-ray-cyan/70' : 'text-gray-400 dark:text-slate-500'}`}>{sub}</p>}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, subtitle, count }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon size={16} className="text-brand-500 dark:text-ray-cyan" />
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
      {subtitle && <span className="hidden text-xs text-gray-400 dark:text-slate-500 sm:inline">— {subtitle}</span>}
      {count !== undefined && (
        <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-ray-bg dark:text-slate-400">
          {count || 0}
        </span>
      )}
    </div>
  )
}

function Stat({ label, value, bold }) {
  return (
    <div>
      <span className="text-gray-400 dark:text-slate-500">{label}: </span>
      <span className={bold ? 'font-bold text-brand-600 dark:text-ray-cyan' : 'font-semibold dark:text-slate-200'}>{value}</span>
    </div>
  )
}
