import { Plus, Trash2 } from 'lucide-react'
import DateInput from './DateInput.jsx'
import NumberInput from './NumberInput.jsx'

/**
 * Tabla editable inline. Genérica, controlada por `rows`.
 *
 * Props:
 *  - rows        Array<Record>
 *  - onChange    (rows) => void
 *  - columns     [{ key, label, type: 'text' | 'number' | 'date', placeholder?, width? }]
 *  - newRow      () => Record    fábrica de fila vacía
 *  - totals      [{ key, format(value) }]   resumen al pie (suma sobre numéricos)
 *  - emptyText   string
 */
export default function EditableTable({
  rows = [],
  onChange,
  columns,
  newRow,
  totals = [],
  emptyText = 'Sin registros.',
}) {
  const setCell = (idx, key, value) => {
    const next = rows.slice()
    next[idx] = { ...next[idx], [key]: value }
    onChange(next)
  }

  const addRow = () => onChange([...rows, newRow()])
  const removeRow = (idx) => onChange(rows.filter((_, i) => i !== idx))

  const totalsRow = totals.length
    ? totals.reduce((acc, t) => {
        acc[t.key] = rows.reduce((s, r) => s + (Number(r[t.key]) || 0), 0)
        return acc
      }, {})
    : null

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full min-w-[520px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className="border-b border-gray-200 px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.label}
                </th>
              ))}
              <th aria-label="acciones" className="w-10 border-b border-gray-200" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-2 py-6 text-center text-xs text-gray-400"
                >
                  {emptyText}
                </td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr key={idx} className="group">
                {columns.map((c) =>
                  c.type === 'number' ? (
                    <td
                      key={c.key}
                      className="border-b border-gray-100 px-1 py-1 align-top"
                    >
                      <NumberInput
                        value={row[c.key] ?? 0}
                        placeholder={c.placeholder}
                        onChange={(value) => setCell(idx, c.key, value)}
                        className="input text-right tabular-nums"
                      />
                    </td>
                  ) : c.type === 'date' ? (
                    <td
                      key={c.key}
                      className="border-b border-gray-100 px-1 py-1 align-top"
                    >
                      <DateInput
                        value={row[c.key] ?? ''}
                        onChange={(value) => setCell(idx, c.key, value)}
                      />
                    </td>
                  ) : (
                    <td
                      key={c.key}
                      className="border-b border-gray-100 px-1 py-1 align-top"
                    >
                      <input
                        type="text"
                        value={row[c.key] ?? ''}
                        placeholder={c.placeholder}
                        onChange={(e) => setCell(idx, c.key, e.target.value)}
                        className="input"
                      />
                    </td>
                  ),
                )}
                <td className="border-b border-gray-100 px-1 py-1 align-middle text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="rounded p-1.5 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    aria-label="Eliminar fila"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {totalsRow && (
            <tfoot>
              <tr>
                {columns.map((c, i) => {
                  const t = totals.find((x) => x.key === c.key)
                  return (
                    <td
                      key={c.key}
                      className="px-2 py-2 text-xs font-semibold text-gray-700"
                    >
                      {i === 0 && !t ? 'Total' : t ? t.format(totalsRow[t.key]) : ''}
                    </td>
                  )
                })}
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="btn-secondary w-full sm:w-auto"
      >
        <Plus size={16} aria-hidden /> Agregar fila
      </button>
    </div>
  )
}
