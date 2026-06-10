import { Database, FileSpreadsheet, Upload } from 'lucide-react'
import { useRef } from 'react'
import { exportarWorkbook, importarWorkbook } from '../lib/excel.js'
import { formatKilos, formatReales } from '../lib/formato.js'

const sum = (arr, get) => (arr || []).reduce((s, x) => s + (Number(get(x)) || 0), 0)

export default function Historial({ estado }) {
  const { state, setState, datos } = estado
  const fileInputRef = useRef(null)

  const handleExport = async () => {
    try {
      await exportarWorkbook(state)
    } catch (err) {
      console.error(err)
      alert(`Error al exportar: ${err.message}`)
    }
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (
      !confirm(
        'Importar reemplazará TODOS los datos actuales por los del archivo. ¿Continuar?',
      )
    ) {
      e.target.value = ''
      return
    }
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

  const registros =
    (datos.compras_bruto?.length || 0) +
    (datos.pagos?.length || 0) +
    (datos.banos_completados?.length || 0) +
    (datos.llegadas_mercaderia_por_bloque?.length || 0) +
    (datos.servicios_completados?.length || 0) +
    (datos.pagos_aduana?.length || 0)

  const stats = [
    { label: 'Registros totales', value: String(registros) },
    { label: 'Compras', value: String(datos.compras_bruto?.length || 0) },
    { label: 'Kilos comprados', value: formatKilos(sum(datos.compras_bruto, (c) => c.kilos)) },
    { label: 'Total R$ compras', value: formatReales(sum(datos.compras_bruto, (c) => c.total_reales)) },
  ]

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Respaldo de datos</h2>
            <p className="text-xs text-gray-500">
              Exporta un Excel con todos tus datos o restaura desde uno.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleExport} className="btn-primary">
              <FileSpreadsheet size={16} aria-hidden /> Exportar respaldo
            </button>
            <button type="button" onClick={handleImportClick} className="btn-secondary">
              <Upload size={16} aria-hidden /> Importar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Database size={18} />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Resumen de datos</h2>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-xs text-gray-500">{s.label}</dt>
              <dd className="text-base font-semibold text-gray-900 tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-4 text-xs text-gray-500">
        <p>
          <strong>Almacenamiento:</strong> los datos se guardan automáticamente en este
          dispositivo (localStorage). Limpiar el navegador los borra. Para respaldo,
          usa &ldquo;Exportar respaldo&rdquo;.
        </p>
      </section>
    </div>
  )
}
