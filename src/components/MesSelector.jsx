import { useState } from 'react'
import { ChevronLeft, ChevronRight, Copy, Plus } from 'lucide-react'
import { formatMes } from '../lib/formato.js'

export default function MesSelector({ mesActivo, mesesOrdenados, onChange, onCrear }) {
  const [creando, setCreando] = useState(false)
  const [nuevoMes, setNuevoMes] = useState('')

  const idx  = mesesOrdenados.indexOf(mesActivo)
  const prev = idx > 0 ? mesesOrdenados[idx - 1] : null
  const next = idx >= 0 && idx < mesesOrdenados.length - 1 ? mesesOrdenados[idx + 1] : null

  const confirmarNuevo = () => {
    if (!nuevoMes || !/^\d{4}-\d{2}$/.test(nuevoMes)) return
    onCrear(nuevoMes)
    onChange(nuevoMes)
    setNuevoMes('')
    setCreando(false)
  }

  const duplicarSiguiente = () => {
    if (!mesActivo) return
    const [y, m] = mesActivo.split('-').map(Number)
    const d = new Date(y, m, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    onCrear(key)
    onChange(key)
  }

  return (
    <div className="space-y-2">
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
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-[#101f38]"
          disabled={!next}
          onClick={() => next && onChange(next)}
          aria-label="Mes siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Botones de gestión de meses */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={duplicarSiguiente}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ray-border/60 px-3 py-2 text-[11px] font-semibold text-slate-400 hover:bg-ray-border/20 transition"
          title="Crear mes siguiente copiando precios del mes actual"
        >
          <Copy size={12} /> Duplicar al siguiente
        </button>
        <button
          type="button"
          onClick={() => setCreando((v) => !v)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ray-border/60 px-3 py-2 text-[11px] font-semibold text-slate-400 hover:bg-ray-border/20 transition"
        >
          <Plus size={12} /> Nuevo mes
        </button>
      </div>

      {/* Selector de mes personalizado */}
      {creando && (
        <div className="flex gap-2">
          <input
            type="month"
            value={nuevoMes}
            onChange={(e) => setNuevoMes(e.target.value)}
            className="input flex-1 text-sm"
          />
          <button
            type="button"
            onClick={confirmarNuevo}
            disabled={!nuevoMes}
            className="rounded-xl bg-ray-cyan px-4 py-2 text-xs font-bold text-ray-bg disabled:opacity-40"
          >
            Crear
          </button>
          <button
            type="button"
            onClick={() => setCreando(false)}
            className="rounded-xl border border-ray-border/60 px-3 py-2 text-xs text-slate-400 hover:bg-ray-border/20 transition"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
