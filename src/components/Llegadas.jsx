import { PackageCheck, Plus, Trash2 } from 'lucide-react'
import { formatCLP, formatKilos, parseNumeroFlexible } from '../lib/formato.js'

const CATS = ['MICRO', 'CADENA', 'ORO GF']
const COLORS = { MICRO: '#0066cc', CADENA: '#10b981', 'ORO GF': '#d4af37' }
const DARK_COLORS = { MICRO: '#3fcbe0', CADENA: '#34d399', 'ORO GF': '#e3c05a' }

export default function Llegadas({ estado }) {
  const { mesData, updateMes, indicadores } = estado
  const bloques = mesData.llegadas_mercaderia_por_bloque || []
  const { kilos } = indicadores

  const onChange = (next) => updateMes({ llegadas_mercaderia_por_bloque: next })
  const addBloque = () => onChange([...bloques, { MICRO: 0, CADENA: 0, 'ORO GF': 0 }])
  const removeBloque = (idx) => onChange(bloques.filter((_, i) => i !== idx))
  const updateBloque = (idx, cat, raw) => {
    const next = bloques.slice()
    next[idx] = { ...next[idx], [cat]: parseNumeroFlexible(raw) }
    onChange(next)
  }

  return (
    <div className="space-y-4">

      {/* Banner en vivo — sticky */}
      <div className="sticky top-0 z-20 grid grid-cols-2 gap-3 bg-gray-50 pb-2 pt-0 dark:bg-ray-bg sm:grid-cols-4">
        <LiveCard label="Total kilos" value={formatKilos(kilos.total)} highlight />
        {CATS.map((cat) => (
          <LiveCard key={cat} label={cat} value={formatKilos(kilos[cat])} color={COLORS[cat]} darkColor={DARK_COLORS[cat]} />
        ))}
      </div>

      {/* Bloques de llegada */}
      <section className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <PackageCheck size={16} className="text-brand-500 dark:text-ray-cyan" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Llegadas de mercadería</h2>
          <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-ray-bg dark:text-slate-400">
            {bloques.length} embarques
          </span>
        </div>

        {bloques.length === 0 && (
          <p className="py-4 text-center text-xs text-gray-400 dark:text-slate-600">
            Sin bloques de llegada. Agrega el primer embarque.
          </p>
        )}

        <ul className="space-y-2">
          {bloques.map((b, idx) => (
            <li
              key={idx}
              className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-end gap-3 rounded-xl border border-gray-200 px-3 py-3 dark:border-ray-border"
            >
              <span className="mb-1 text-xs font-bold text-gray-400 dark:text-slate-600">#{idx + 1}</span>
              {CATS.map((cat) => (
                <label key={cat} className="block">
                  <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-400">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS[cat] }} />
                    {cat}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={b[cat] ?? 0}
                    onChange={(e) => updateBloque(idx, cat, e.target.value)}
                    className="input"
                    placeholder="0,000"
                  />
                </label>
              ))}
              <button
                type="button"
                onClick={() => removeBloque(idx)}
                className="mb-1 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                aria-label="Eliminar embarque"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>

        <button type="button" onClick={addBloque} className="btn-secondary mt-3 w-full sm:w-auto">
          <Plus size={16} aria-hidden /> Agregar embarque
        </button>
      </section>

      {/* Precios ponderados */}
      <section className="card p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Precios ponderados de venta</h2>
          <p className="text-xs text-gray-400 dark:text-slate-500">Usado para calcular el indicador de fabricación en Resumen</p>
        </div>
        <PreciosPonderados
          valores={mesData.costos_ponderados_por_kilo || {}}
          onChange={(obj) => updateMes({ costos_ponderados_por_kilo: obj })}
        />
      </section>
    </div>
  )
}

function LiveCard({ label, value, highlight, color, darkColor }) {
  return (
    <div className={[
      'card p-3 text-center',
      highlight ? 'bg-brand-50 border-brand-200 dark:bg-ray-cyan-dim dark:border-ray-cyan/30 dark:shadow-glow-sm' : '',
    ].join(' ')}>
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${highlight ? 'text-brand-600 dark:text-ray-cyan' : 'text-gray-500 dark:text-slate-400'}`}
        style={color && !highlight ? { color } : undefined}
      >
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${highlight ? 'text-brand-700 dark:text-ray-cyan' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  )
}

function PreciosPonderados({ valores, onChange }) {
  const get = (k) => valores[k] ?? valores[k === 'MICRO' ? 'MICROZIRCON' : ''] ?? 0
  const set = (k, raw) => onChange({ ...valores, [k]: parseNumeroFlexible(raw) })

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {CATS.map((cat) => (
        <label key={cat} className="block">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-400">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS[cat] }} />
            {cat}
          </span>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={get(cat)}
              onChange={(e) => set(cat, e.target.value)}
              className="input pr-12"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-slate-500">
              /kg
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">{formatCLP(get(cat))}</p>
        </label>
      ))}
    </div>
  )
}
