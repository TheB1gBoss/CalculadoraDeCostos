import { useEffect, useRef, useState } from 'react'
import { normalizarPorCategoria } from '../lib/calculos.js'
import { parseNumeroFlexible } from '../lib/formato.js'

export default function PreciosPonderados({ valores, onGuardar }) {
  const fmt = (v) => (v ? Math.round(v).toLocaleString('es-CL') : '')
  const fromValores = (v) => {
    const n = normalizarPorCategoria(v)
    return { MICRO: fmt(n.MICRO), CADENA: fmt(n.CADENA), 'ORO GF': fmt(n['ORO GF']) }
  }
  const [form, setForm] = useState(() => fromValores(valores))
  const [guardado, setGuardado] = useState(false)
  const editing = useRef(false)

  useEffect(() => {
    if (!editing.current) setForm(fromValores(valores))
  }, [valores])

  const set = (k, v) => { editing.current = true; setForm((p) => ({ ...p, [k]: v })); setGuardado(false) }

  const handleGuardar = () => {
    editing.current = false
    onGuardar({
      MICRO:    parseNumeroFlexible(form.MICRO),
      CADENA:   parseNumeroFlexible(form.CADENA),
      'ORO GF': parseNumeroFlexible(form['ORO GF']),
    })
    setGuardado(true)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {['MICRO', 'CADENA', 'ORO GF'].map((cat) => (
          <label key={cat} className="block">
            <span className="label">{cat}</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-ray-cyan select-none">$</span>
              <input type="text" inputMode="numeric" value={form[cat]}
                onChange={(e) => set(cat, e.target.value)} className="input pl-6" />
            </div>
          </label>
        ))}
      </div>
      <button type="button" onClick={handleGuardar}
        className={`w-full rounded-xl px-4 py-2 text-sm font-medium transition ${guardado ? 'bg-emerald-500 text-white' : 'btn-primary'}`}>
        {guardado ? '✓ Guardado' : 'Guardar precios'}
      </button>
    </div>
  )
}
