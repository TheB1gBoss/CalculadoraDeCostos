import {
  Banknote,
  Boxes,
  Droplet,
  PackageCheck,
  Plus,
  ShoppingCart,
  Trash2,
  Wrench,
} from 'lucide-react'
import Accordion from './Accordion.jsx'
import EditableTable from './EditableTable.jsx'
import NumberInput from './NumberInput.jsx'
import {
  formatCLP,
  formatKilos,
  formatNumero,
  formatReales,
} from '../lib/formato.js'

export default function EntradaDatos({ estado }) {
  const { mesData, updateMes } = estado

  const setField = (key) => (rows) => updateMes({ [key]: rows })

  return (
    <div className="space-y-3">
      {/* 1. Compras de bruto */}
      <Accordion
        title="Compras de bruto"
        subtitle="Compras de oro/plata en Brasil"
        icon={ShoppingCart}
        defaultOpen
        badge={`${mesData.compras_bruto?.length || 0}`}
      >
        <EditableTable
          rows={mesData.compras_bruto || []}
          onChange={setField('compras_bruto')}
          newRow={() => ({ fecha: '', detalle: '', kilos: 0, total_reales: 0 })}
          columns={[
            { key: 'fecha', label: 'Fecha', type: 'date', width: '140px' },
            { key: 'detalle', label: 'Detalle', type: 'text', placeholder: 'Proveedor / mes' },
            { key: 'kilos', label: 'Kilos', type: 'number', placeholder: '0,000', width: '110px' },
            { key: 'total_reales', label: 'Total R$', type: 'number', placeholder: '0,00', width: '140px' },
          ]}
          totals={[
            { key: 'kilos', format: formatKilos },
            { key: 'total_reales', format: formatReales },
          ]}
          emptyText="Sin compras de bruto este mes."
        />
      </Accordion>

      {/* 2. Pagos al exterior */}
      <Accordion
        title="Pagos al exterior"
        subtitle="Cada pago define el TC ponderado del mes"
        icon={Banknote}
        badge={`${mesData.pagos?.length || 0}`}
      >
        <EditableTable
          rows={mesData.pagos || []}
          onChange={setField('pagos')}
          newRow={() => ({ fecha: '', reales: 0, chilenos: 0 })}
          columns={[
            { key: 'fecha', label: 'Fecha', type: 'date', width: '140px' },
            { key: 'reales', label: 'R$ pagados', type: 'number', placeholder: '0,00' },
            { key: 'chilenos', label: 'CLP pagados', type: 'number', placeholder: '0' },
          ]}
          totals={[
            { key: 'reales', format: formatReales },
            { key: 'chilenos', format: formatCLP },
          ]}
          emptyText="Sin pagos al exterior este mes."
        />
        <PagosResumen pagos={mesData.pagos || []} />
      </Accordion>

      {/* 3. Baños completados */}
      <Accordion
        title="Baños completados"
        subtitle="Procesamiento (valores en R$, se convierten a CLP)"
        icon={Droplet}
        badge={`${mesData.banos_completados?.length || 0}`}
      >
        <EditableTable
          rows={mesData.banos_completados || []}
          onChange={setField('banos_completados')}
          newRow={() => ({ fecha: '', detalle: '', kilos: 0, total_clp: 0 })}
          columns={[
            { key: 'fecha', label: 'Fecha', type: 'date', width: '140px' },
            { key: 'detalle', label: 'Detalle', type: 'text', placeholder: 'N° baño' },
            { key: 'kilos', label: 'Kilos', type: 'number', placeholder: '0,000' },
            { key: 'total_clp', label: 'Total R$', type: 'number', placeholder: '0,00' },
          ]}
          totals={[
            { key: 'kilos', format: formatKilos },
            { key: 'total_clp', format: formatReales },
          ]}
          emptyText="Sin baños este mes."
        />
      </Accordion>

      {/* 4. Llegadas de mercadería */}
      <Accordion
        title="Llegadas de mercadería"
        subtitle="Bloques por embarque — kilos por categoría"
        icon={PackageCheck}
        badge={`${mesData.llegadas_mercaderia_por_bloque?.length || 0}`}
      >
        <Llegadas
          bloques={mesData.llegadas_mercaderia_por_bloque || []}
          onChange={setField('llegadas_mercaderia_por_bloque')}
        />
      </Accordion>

      {/* 5. Servicios y aduana */}
      <Accordion
        title="Servicios y aduana"
        subtitle="Servicios en R$ + pagos de aduana en CLP"
        icon={Wrench}
        badge={`${(mesData.servicios_completados?.length || 0) + (mesData.pagos_aduana?.length || 0)}`}
      >
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Servicios completados (R$)
            </h3>
            <EditableTable
              rows={mesData.servicios_completados || []}
              onChange={setField('servicios_completados')}
              newRow={() => ({ fecha: '', detalle: '', total_reales: 0 })}
              columns={[
                { key: 'fecha', label: 'Fecha', type: 'date', width: '140px' },
                { key: 'detalle', label: 'Detalle', type: 'text', placeholder: 'Concepto' },
                { key: 'total_reales', label: 'Total R$', type: 'number', placeholder: '0,00' },
              ]}
              totals={[{ key: 'total_reales', format: formatReales }]}
              emptyText="Sin servicios este mes."
            />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pagos de aduana (CLP)
            </h3>
            <EditableTable
              rows={mesData.pagos_aduana || []}
              onChange={setField('pagos_aduana')}
              newRow={() => ({ fecha: '', detalle: '', kilos: 0, total_clp: 0 })}
              columns={[
                { key: 'fecha', label: 'Fecha', type: 'date', width: '140px' },
                { key: 'detalle', label: 'Detalle', type: 'text', placeholder: 'T/I, glosa...' },
                { key: 'kilos', label: 'Kilos', type: 'number', placeholder: '0,000' },
                { key: 'total_clp', label: 'Total CLP', type: 'number', placeholder: '0' },
              ]}
              totals={[
                { key: 'kilos', format: formatKilos },
                { key: 'total_clp', format: formatCLP },
              ]}
              emptyText="Sin pagos de aduana este mes."
            />
          </div>
        </div>
      </Accordion>

      {/* 6. Precios ponderados por categoría (config) */}
      <Accordion
        title="Precios ponderados por categoría"
        subtitle="Valor de venta usado en el indicador de fabricación"
        icon={Boxes}
      >
        <PreciosPonderados
          valores={mesData.costos_ponderados_por_kilo || {}}
          onChange={(obj) => updateMes({ costos_ponderados_por_kilo: obj })}
        />
      </Accordion>
    </div>
  )
}

function PagosResumen({ pagos }) {
  const totalR$ = pagos.reduce((s, p) => s + (Number(p.reales) || 0), 0)
  const totalCLP = pagos.reduce((s, p) => s + (Number(p.chilenos) || 0), 0)
  const tc = totalR$ > 0 ? totalCLP / totalR$ : 0
  return (
    <div className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700">
      <span className="font-semibold">TC ponderado:</span>{' '}
      {tc ? `${formatNumero(tc, 2)} CLP/R$` : '—'}
    </div>
  )
}

function Llegadas({ bloques, onChange }) {
  const addBloque = () =>
    onChange([...bloques, { MICRO: 0, CADENA: 0, 'ORO GF': 0 }])

  const updateBloque = (idx, key, value) => {
    const next = bloques.slice()
    next[idx] = { ...next[idx], [key]: value }
    onChange(next)
  }

  const removeBloque = (idx) => onChange(bloques.filter((_, i) => i !== idx))

  const totales = bloques.reduce(
    (acc, b) => {
      acc.MICRO += Number(b.MICRO) || 0
      acc.CADENA += Number(b.CADENA) || 0
      acc['ORO GF'] += Number(b['ORO GF']) || 0
      return acc
    },
    { MICRO: 0, CADENA: 0, 'ORO GF': 0 },
  )

  return (
    <div className="space-y-3">
      {bloques.length === 0 && (
        <p className="text-center text-xs text-gray-400">
          Sin bloques de llegada todavía.
        </p>
      )}
      <ul className="space-y-2">
        {bloques.map((b, idx) => (
          <li
            key={idx}
            className="grid grid-cols-[28px_1fr_1fr_1fr_32px] items-center gap-2 rounded-xl border border-gray-200 px-2 py-2"
          >
            <span className="text-center text-xs font-semibold text-gray-500">
              #{idx + 1}
            </span>
            {['MICRO', 'CADENA', 'ORO GF'].map((cat) => (
              <label key={cat} className="block">
                <span className="block text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  {cat}
                </span>
                <NumberInput
                  value={b[cat] ?? 0}
                  onChange={(value) => updateBloque(idx, cat, value)}
                  className="input text-right tabular-nums"
                />
              </label>
            ))}
            <button
              type="button"
              onClick={() => removeBloque(idx)}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
              aria-label="Eliminar bloque"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs">
        <span className="font-semibold text-gray-700">Totales:</span>
        <span>MICRO {formatKilos(totales.MICRO)}</span>
        <span>CADENA {formatKilos(totales.CADENA)}</span>
        <span>ORO GF {formatKilos(totales['ORO GF'])}</span>
      </div>

      <button type="button" onClick={addBloque} className="btn-secondary w-full sm:w-auto">
        <Plus size={16} aria-hidden /> Agregar bloque
      </button>
    </div>
  )
}

function PreciosPonderados({ valores, onChange }) {
  // 'MICROZIRCON' es la clave histórica del Excel para MICRO.
  const get = (k) =>
    Number(valores[k] ?? (k === 'MICRO' ? valores.MICROZIRCON : 0)) || 0
  const set = (k, value) => {
    // Normaliza a las claves canónicas y descarta la histórica MICROZIRCON.
    const { MICROZIRCON, ...rest } = valores
    onChange({ ...rest, [k]: value })
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {['MICRO', 'CADENA', 'ORO GF'].map((cat) => (
        <label key={cat} className="block">
          <span className="label">{cat}</span>
          <div className="relative">
            <NumberInput
              value={get(cat)}
              onChange={(value) => set(cat, value)}
              className="input pr-12 text-right tabular-nums"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              /kg
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">{formatCLP(get(cat))}</p>
        </label>
      ))}
    </div>
  )
}
