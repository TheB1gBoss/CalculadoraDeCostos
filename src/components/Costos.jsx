import { Droplet, Package, Wrench } from 'lucide-react'
import EditableTable from './EditableTable.jsx'
import { formatCLP, formatKilos, formatReales } from '../lib/formato.js'

export default function Costos({ estado }) {
  const { mesData, updateMes, indicadores } = estado
  const setField = (key) => (rows) => updateMes({ [key]: rows })

  const { brutoPorKilo, banoPorKilo, aduanaPorKilo, costoTotalPorKilo } = indicadores

  return (
    <div className="space-y-4">

      {/* Banner en vivo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <LiveCard label="Bruto / kg"  value={formatCLP(brutoPorKilo)}    sub="materia prima" />
        <LiveCard label="Baño / kg"   value={formatCLP(banoPorKilo)}     sub="procesamiento" />
        <LiveCard label="Aduana / kg" value={formatCLP(aduanaPorKilo)}   sub="derechos" />
        <LiveCard label="TOTAL / kg"  value={formatCLP(costoTotalPorKilo)} sub="costo real" highlight />
      </div>

      {/* Baños completados */}
      <section className="card p-4">
        <SectionHeader icon={Droplet} title="Baños completados" subtitle="valores en R$" count={mesData.banos_completados?.length} />
        <EditableTable
          rows={mesData.banos_completados || []}
          onChange={setField('banos_completados')}
          newRow={() => ({ fecha: '', detalle: '', kilos: 0, total_clp: 0 })}
          columns={[
            { key: 'fecha',     label: 'Fecha',    type: 'date',   width: '140px' },
            { key: 'detalle',   label: 'Detalle',  type: 'text',   placeholder: 'N° baño' },
            { key: 'kilos',     label: 'Kilos',    type: 'number', placeholder: '0,000', width: '110px' },
            { key: 'total_clp', label: 'Total R$', type: 'number', placeholder: '0,00',  width: '140px' },
          ]}
          totals={[
            { key: 'kilos',     format: formatKilos  },
            { key: 'total_clp', format: formatReales },
          ]}
          emptyText="Sin baños este mes."
        />
      </section>

      {/* Servicios completados */}
      <section className="card p-4">
        <SectionHeader icon={Wrench} title="Servicios completados" subtitle="otros servicios en R$" count={mesData.servicios_completados?.length} />
        <EditableTable
          rows={mesData.servicios_completados || []}
          onChange={setField('servicios_completados')}
          newRow={() => ({ fecha: '', detalle: '', total_reales: 0 })}
          columns={[
            { key: 'fecha',        label: 'Fecha',    type: 'date', width: '140px' },
            { key: 'detalle',      label: 'Detalle',  type: 'text', placeholder: 'Concepto' },
            { key: 'total_reales', label: 'Total R$', type: 'number', placeholder: '0,00' },
          ]}
          totals={[{ key: 'total_reales', format: formatReales }]}
          emptyText="Sin servicios este mes."
        />
      </section>

      {/* Pagos de aduana */}
      <section className="card p-4">
        <SectionHeader icon={Package} title="Pagos de aduana" subtitle="derechos en CLP" count={mesData.pagos_aduana?.length} />
        <EditableTable
          rows={mesData.pagos_aduana || []}
          onChange={setField('pagos_aduana')}
          newRow={() => ({ fecha: '', detalle: '', kilos: 0, total_clp: 0 })}
          columns={[
            { key: 'fecha',     label: 'Fecha',     type: 'date',   width: '140px' },
            { key: 'detalle',   label: 'Detalle',   type: 'text',   placeholder: 'T/I, glosa...' },
            { key: 'kilos',     label: 'Kilos',     type: 'number', placeholder: '0,000', width: '110px' },
            { key: 'total_clp', label: 'Total CLP', type: 'number', placeholder: '0',     width: '140px' },
          ]}
          totals={[
            { key: 'kilos',     format: formatKilos },
            { key: 'total_clp', format: formatCLP },
          ]}
          emptyText="Sin pagos de aduana este mes."
        />
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
        : '',
    ].join(' ')}>
      <p className={`text-xs font-medium uppercase tracking-wide ${highlight ? 'text-brand-600 dark:text-ray-cyan' : 'text-gray-500 dark:text-slate-400'}`}>
        {label}
      </p>
      <p className={`mt-1 text-lg font-bold leading-tight ${highlight ? 'text-brand-700 dark:text-ray-cyan' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 dark:text-slate-500">{sub}</p>}
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
