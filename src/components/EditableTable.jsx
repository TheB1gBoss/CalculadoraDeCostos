import { Plus, Trash2 } from 'lucide-react'
import { parseNumeroFlexible } from '../lib/formato.js'

export default function EditableTable({
  rows = [],
  onChange,
  columns,
  newRow,
  totals = [],
  emptyText = 'Sin registros.',
}) {
  const setCell = (idx, key, raw, type) => {
    const next = rows.slice()
    const value = type === 'number' ? parseNumeroFlexible(raw) : raw
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
                  className="border-b border-gray-200 px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-ray-border dark:text-slate-400"
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.label}
                </th>
              ))}
              <th aria-label="acciones" className="w-10 border-b border-gray-200 dark:border-ray-border" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-2 py-6 text-center text-xs text-gray-400 dark:text-slate-600">
                  {emptyText}
                </td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr key={idx} className="group">
                {columns.map((c) => (
                  <td key={c.key} className="border-b border-gray-100 px-1 py-1 align-top dark:border-ray-border/60">
                    <input
                      type={c.type === 'date' ? 'date' : 'text'}
                      inputMode={c.type === 'number' ? 'decimal' : undefined}
                      value={row[c.key] ?? ''}
                      placeholder={c.placeholder}
                      onChange={(e) => setCell(idx, c.key, e.target.value, c.type)}
                      className="input"
                    />
                  </td>
                ))}
                <td className="border-b border-gray-100 px-1 py-1 align-middle text-right dark:border-ray-border/60">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="rounded p-1.5 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    aria-label="Eliminar fila"
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
                    <td key={c.key} className="px-2 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300">
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

      <button type="button" onClick={addRow} className="btn-secondary w-full sm:w-auto">
        <Plus size={16} aria-hidden /> Agregar fila
      </button>
    </div>
  )
}
