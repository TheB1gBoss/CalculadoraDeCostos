import { AlertTriangle, Calendar, Download, FileSpreadsheet, Trash2, Upload } from 'lucide-react'
import { useRef } from 'react'
import { calcularIndicadores } from '../lib/calculos.js'
import { exportarWorkbook, importarWorkbook } from '../lib/excel.js'
import { formatCLP, formatKilos, formatMes } from '../lib/formato.js'

export default function Historial({ estado }) {
  const { state, setState, mesActivo, mesesOrdenados, setMesActivo, eliminarMes } = estado
  const fileInputRef = useRef(null)

  const handleEliminar = (key) => {
    if (mesesOrdenados.length <= 1) { alert('No puedes eliminar el último mes guardado.'); return }
    if (confirm(`¿Eliminar el mes ${formatMes(key)}? Esta acción no se puede deshacer.`)) eliminarMes(key)
  }

  const handleExport      = (key) => exportarWorkbook(state, key)
  const handleExportAll   = () => exportarWorkbook(state, null)
  const handleImportClick = () => fileInputRef.current?.click()

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const nuevoState = await importarWorkbook(file, state)
      setState(nuevoState)
      alert('Importación completada.')
    } catch (err) {
      console.error(err)
      alert(`Error al importar: ${err.message}`)
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Importar / Exportar</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">Excel (.xlsx) compatible con el libro original</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleExportAll} className="btn-primary">
              <FileSpreadsheet size={16} /> Exportar todos los meses
            </button>
            <button type="button" onClick={handleImportClick} className="btn-secondary">
              <Upload size={16} /> Importar Excel
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportFile} className="hidden" />
          </div>
        </div>
      </section>

      {mesesOrdenados.length === 0 ? (
        <section className="card p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 text-amber-500" size={28} />
          <p className="text-sm text-gray-500 dark:text-slate-400">Sin meses guardados.</p>
        </section>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {[...mesesOrdenados].reverse().map((key) => {
            const ind = calcularIndicadores(state.meses[key])
            const activo = key === mesActivo
            const pos = ind.indicadorFabricacion >= 0
            return (
              <li key={key} className={`card relative p-4 ${activo ? 'ring-2 ring-brand-500 dark:ring-ray-cyan' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => setMesActivo(key)} className="flex flex-1 items-start gap-3 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-ray-cyan-dim dark:text-ray-cyan">
                      <Calendar size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatMes(key)}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{activo ? 'Mes activo' : 'Tocar para seleccionar'}</p>
                    </div>
                  </button>
                  <div className="flex gap-1">
                    <button
                      type="button" onClick={() => handleExport(key)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#101f38] dark:hover:text-slate-200"
                      title="Exportar este mes"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      type="button" onClick={() => handleEliminar(key)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="Eliminar mes"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <KPI label="Costo / kg"   value={formatCLP(ind.costoTotalPorKilo)} />
                  <KPI label="Kilos totales" value={formatKilos(ind.kilos.total)} />
                  <KPI label="Indicador"    value={(pos ? '+' : '') + formatCLP(ind.indicadorFabricacion)} color={pos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} />
                  <KPI label="TC pond."     value={ind.tipoCambio ? ind.tipoCambio.toFixed(2) : '—'} />
                </dl>
              </li>
            )
          })}
        </ul>
      )}

      <section className="card p-4 text-xs text-gray-500 dark:text-slate-500">
        <p>
          <strong className="dark:text-slate-400">Almacenamiento:</strong> los datos se guardan en este dispositivo (localStorage).
          Para respaldo usa &ldquo;Exportar todos los meses&rdquo;.
        </p>
      </section>
    </div>
  )
}

function KPI({ label, value, color }) {
  return (
    <div>
      <dt className="text-gray-500 dark:text-slate-500">{label}</dt>
      <dd className={`font-semibold ${color || 'text-gray-900 dark:text-white'}`}>{value}</dd>
    </div>
  )
}
