import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { formatMes } from '../lib/formato.js'

export default function MesSelector({ mesActivo, mesesOrdenados, onChange, onCrear }) {
  const idx = mesesOrdenados.indexOf(mesActivo)
  const prev = idx > 0 ? mesesOrdenados[idx - 1] : null
  const next = idx >= 0 && idx < mesesOrdenados.length - 1 ? mesesOrdenados[idx + 1] : null

  const handleCrear = () => {
    const k = window.prompt('Nuevo mes (formato AAAA-MM):', siguienteMes(mesActivo))
    if (k && /^\d{4}-\d{2}$/.test(k)) onCrear(k)
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-ray-border dark:bg-[#06101f] dark:shadow-none">
      <button
        type="button"
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-[#101f38]"
        disabled={!prev}
        onClick={() => prev && onChange(prev)}
        aria-label="Mes anterior"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex flex-1 items-center justify-center gap-2">
        <select
          value={mesActivo || ''}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border-0 bg-transparent px-2 py-1 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
        >
          {mesesOrdenados.length === 0 && <option value="">Sin meses</option>}
          {mesesOrdenados.map((k) => (
            <option key={k} value={k}>{formatMes(k)}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleCrear}
          className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 dark:text-ray-cyan dark:hover:bg-ray-cyan-dim"
          aria-label="Crear mes nuevo"
          title="Crear mes nuevo"
        >
          <Plus size={16} />
        </button>
      </div>

      <button
        type="button"
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-[#101f38]"
        disabled={!next}
        onClick={() => next && onChange(next)}
        aria-label="Mes siguiente"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

function siguienteMes(actual) {
  if (!actual) {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  const [y, m] = actual.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
