import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMes } from '../lib/formato.js'

export default function MesSelector({ mesActivo, mesesOrdenados, onChange, onCrear }) {
  const idx  = mesesOrdenados.indexOf(mesActivo)
  const prev = idx > 0 ? mesesOrdenados[idx - 1] : null
  const next = idx >= 0 && idx < mesesOrdenados.length - 1 ? mesesOrdenados[idx + 1] : null

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-ray-border dark:bg-[#0c0f14] dark:shadow-none">
      <button
        type="button"
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-[#1a1f29]"
        disabled={!prev}
        onClick={() => prev && onChange(prev)}
        aria-label="Mes anterior"
      >
        <ChevronLeft size={18} />
      </button>

      <select
        value={mesActivo || ''}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-lg border-0 bg-transparent px-2 py-1 text-center text-sm font-semibold text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
      >
        {mesesOrdenados.length === 0 && <option value="">Sin meses</option>}
        {mesesOrdenados.map((k) => (
          <option key={k} value={k}>{formatMes(k)}</option>
        ))}
      </select>

      <button
        type="button"
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-[#1a1f29]"
        disabled={!next}
        onClick={() => next && onChange(next)}
        aria-label="Mes siguiente"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
