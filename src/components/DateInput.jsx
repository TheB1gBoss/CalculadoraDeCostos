/**
 * Campo de fecha a prueba de zona horaria.
 *
 * Trabaja SIEMPRE con el string ISO 'YYYY-MM-DD' que entrega el input nativo,
 * sin construir nunca un objeto Date. Eso evita el corrimiento de un día que
 * ocurre cuando 'YYYY-MM-DD' se parsea como medianoche UTC y se muestra en un
 * huso negativo (ej. Chile, UTC-3/-4): 10-10 pasaría a verse como 09-10.
 */
export default function DateInput({ value, onChange, className = 'input', ...rest }) {
  // Normaliza: descarta cualquier porción horaria si la hubiera.
  const iso = typeof value === 'string' ? value.slice(0, 10) : ''
  return (
    <input
      type="date"
      value={iso}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      {...rest}
    />
  )
}
