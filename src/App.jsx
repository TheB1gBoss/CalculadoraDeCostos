import { useEffect, useRef, useState } from 'react'
import { Coins, Download, Moon, Plus, Sun } from 'lucide-react'
import TabBar from './components/TabBar.jsx'
import MesSelector from './components/MesSelector.jsx'
import Ingreso from './components/Ingreso.jsx'
import Dashboard from './components/Dashboard.jsx'
import Historial from './components/Historial.jsx'
import { useEstado } from './lib/useEstado.js'
import { formatCLP, formatNumero } from './lib/formato.js'

function exportarCSV(state, mesActivo) {
  const mes = state.meses[mesActivo] || {}
  const filas = []

  const seccs = [
    { key: 'compras_bruto',               nombre: 'Compras de Bruto',       cols: ['fecha','detalle','kilos','total_reales'] },
    { key: 'pagos',                        nombre: 'Pagos',                  cols: ['fecha','reales','chilenos'] },
    { key: 'servicios_completados',        nombre: 'Servicios',              cols: ['fecha','detalle','total_reales'] },
    { key: 'pagos_aduana',                 nombre: 'Pagos Aduana',           cols: ['fecha','kilos','total_clp'] },
    { key: 'banos_completados',            nombre: 'Baños',                  cols: ['fecha','plata_kilos','plata_reales','oro_kilos','oro_reales'] },
    { key: 'llegadas_mercaderia_por_bloque', nombre: 'Llegadas',            cols: ['MICRO','CADENA','ORO GF'] },
  ]

  for (const { key, nombre, cols } of seccs) {
    const arr = mes[key] || []
    if (!arr.length) continue
    filas.push([nombre])
    filas.push(cols)
    for (const row of arr) filas.push(cols.map(c => row[c] ?? ''))
    filas.push([])
  }

  const csv = filas.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `costos-${mesActivo}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function NavMes({ estado }) {
  const { mesActivo, mesesOrdenados, setMesActivo, crearMes } = estado
  const [creando, setCreando] = useState(false)
  const inputRef = useRef(null)

  const idx  = mesesOrdenados.indexOf(mesActivo)
  const prev = idx > 0 ? mesesOrdenados[idx - 1] : null
  const next = idx < mesesOrdenados.length - 1 ? mesesOrdenados[idx + 1] : null

  // Sugiere el mes siguiente al último registrado
  const sugerido = (() => {
    if (!mesesOrdenados.length) return ''
    const last = mesesOrdenados[mesesOrdenados.length - 1]
    const [y, m] = last.split('-').map(Number)
    const d = new Date(y, m, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()

  const confirmar = (val) => {
    if (!val || !/^\d{4}-\d{2}$/.test(val)) return
    crearMes(val)
    setMesActivo(val)
    setCreando(false)
  }

  useEffect(() => { if (creando) inputRef.current?.focus() }, [creando])

  const mLabel = (k) => {
    const [y, m] = k.split('-').map(Number)
    return new Intl.DateTimeFormat('es-CL', { month: 'short', year: '2-digit' }).format(new Date(y, m - 1, 1))
  }

  return (
    <div className="border-t border-ray-border/40 dark:border-ray-border">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-3 py-1.5 md:px-6">
        {/* Prev */}
        <button disabled={!prev} onClick={() => prev && setMesActivo(prev)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-ray-border/30 disabled:opacity-20 transition">
          ‹
        </button>

        {/* Chips de meses */}
        <div className="flex flex-1 gap-1 overflow-x-auto scrollbar-none">
          {mesesOrdenados.map((k) => (
            <button key={k} onClick={() => setMesActivo(k)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                k === mesActivo
                  ? 'bg-ray-cyan text-ray-bg'
                  : 'text-slate-500 hover:text-white hover:bg-ray-border/40'
              }`}>
              {mLabel(k)}
            </button>
          ))}
        </div>

        {/* Next */}
        <button disabled={!next} onClick={() => next && setMesActivo(next)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-ray-border/30 disabled:opacity-20 transition">
          ›
        </button>

        {/* Nuevo mes */}
        {creando ? (
          <div className="flex items-center gap-1 ml-1">
            <input
              ref={inputRef}
              type="month"
              defaultValue={sugerido}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmar(e.target.value); if (e.key === 'Escape') setCreando(false) }}
              onBlur={(e) => confirmar(e.target.value)}
              className="rounded-lg border border-ray-border bg-ray-surface px-2 py-1 text-xs text-white focus:outline-none focus:border-ray-cyan w-32"
            />
          </div>
        ) : (
          <button onClick={() => setCreando(true)} title="Nuevo mes"
            className="ml-1 shrink-0 rounded-lg p-1.5 text-slate-500 hover:text-ray-cyan hover:bg-ray-border/30 transition">
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

function IndicadorBar({ indicadores }) {
  const { indicadorFabricacion, costoOroPorKilo, costoPlataPorKilo, tipoCambio } = indicadores
  if (!costoPlataPorKilo && !costoOroPorKilo) return null
  const pos = indicadorFabricacion >= 0

  const SEP = <span className="mx-4 text-slate-600 select-none">◆</span>

  const items = (
    <>
      <span className="inline-flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Indicador</span>
        <span className={`text-sm font-bold tabular-nums ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
          {pos ? '+' : ''}{formatCLP(indicadorFabricacion)}
        </span>
      </span>
      {SEP}
      <span className="inline-flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Costo Plata/kg</span>
        <span className="text-sm font-bold text-white tabular-nums">{formatCLP(costoPlataPorKilo)}</span>
      </span>
      {SEP}
      <span className="inline-flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Costo Oro/kg</span>
        <span className="text-sm font-bold text-amber-300 tabular-nums">{formatCLP(costoOroPorKilo)}</span>
      </span>
      {SEP}
      <span className="inline-flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">T/C</span>
        <span className="text-sm font-bold text-ray-cyan tabular-nums">{formatNumero(tipoCambio, 2)} <span className="text-xs font-normal text-slate-500">CLP/R$</span></span>
      </span>
      {SEP}
    </>
  )

  return (
    <div className={`overflow-hidden border-b ${
      pos ? 'border-emerald-900/60 bg-emerald-950/25' : 'border-red-900/60 bg-red-950/25'
    }`}>
      <div className="animate-ticker inline-flex whitespace-nowrap py-2.5">
        {/* duplicado para loop continuo sin salto */}
        <span className="inline-flex items-center pl-8">{items}</span>
        <span className="inline-flex items-center pl-8">{items}</span>
        <span className="inline-flex items-center pl-8">{items}</span>
        <span className="inline-flex items-center pl-8">{items}</span>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState(() => localStorage.getItem('activeTab') || 'ingreso')

  const handleTabChange = (t) => {
    setTab(t)
    localStorage.setItem('activeTab', t)
  }
  const estado = useEstado()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white dark:border-ray-border dark:bg-ray-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:px-6">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white dark:bg-ray-cyan dark:text-ray-bg dark:shadow-glow-sm">
            <Coins size={20} aria-hidden />
            {/* Indicador de sincronización */}
            <span
              title={estado.synced ? 'Sincronizado con Firestore' : 'Conectando…'}
              className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ray-surface ${estado.synced ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}
            />
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-base font-bold uppercase tracking-widest leading-tight dark:text-white">
              Costos e Importación
            </h1>
          </div>
          <button
            type="button"
            onClick={() => exportarCSV(estado.state, estado.mesActivo)}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-[#101f38] transition"
            aria-label="Exportar CSV"
            title="Exportar mes activo a CSV"
          >
            <Download size={18} />
          </button>
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-[#101f38] transition"
            aria-label="Cambiar tema"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <TabBar activo={tab} onChange={handleTabChange} />
        <NavMes estado={estado} />
        <IndicadorBar indicadores={estado.indicadores} />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 md:px-6 md:py-6">
        {tab === 'ingreso'   && <Ingreso   estado={estado} />}
        {tab === 'resumen'   && <Dashboard estado={estado} />}
        {tab === 'historial' && <Historial estado={estado} />}
      </main>
    </div>
  )
}
