import { useEffect, useRef, useState } from 'react'
import { parseNumeroFlexible } from '../lib/formato.js'

/**
 * Input numérico tolerante a separadores chilenos/brasileños.
 *
 * Mantiene un buffer de texto local mientras el campo está enfocado, de modo
 * que se puedan escribir decimales (coma o punto) sin que el valor se "colapse"
 * a entero en cada tecla. Al perder el foco, normaliza la vista al número
 * parseado. Hacia afuera siempre entrega un Number vía onChange.
 *
 * Props: value (number), onChange (number) => void, y cualquier prop de <input>.
 */
export default function NumberInput({
  value,
  onChange,
  className = 'input',
  selectOnFocus = true,
  ...rest
}) {
  const [text, setText] = useState(() => toText(value))
  const focused = useRef(false)

  // Resincroniza desde el exterior solo si el usuario no está escribiendo.
  useEffect(() => {
    if (!focused.current) setText(toText(value))
  }, [value])

  const handleChange = (e) => {
    const raw = e.target.value
    setText(raw)
    onChange(parseNumeroFlexible(raw))
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={text}
      onFocus={(e) => {
        focused.current = true
        if (selectOnFocus) e.target.select()
      }}
      onBlur={() => {
        focused.current = false
        setText(toText(value)) // normaliza la vista al valor real
      }}
      onChange={handleChange}
      {...rest}
    />
  )
}

/** Number → string limpio (sin ruido de coma flotante, punto decimal). */
function toText(v) {
  if (v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  // toFixed(6) + parseFloat elimina cosas como 23.400000000000002 → 23.4
  return String(parseFloat(n.toFixed(6)))
}
