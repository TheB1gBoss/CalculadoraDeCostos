import { useEffect, useState } from 'react'
import { Coins, Moon, Sun } from 'lucide-react'
import TabBar from './components/TabBar.jsx'
import MesSelector from './components/MesSelector.jsx'
import Ingreso from './components/Ingreso.jsx'
import Dashboard from './components/Dashboard.jsx'
import Historial from './components/Historial.jsx'
import { useEstado } from './lib/useEstado.js'
import { formatCLP, formatNumero } from './lib/formato.js'

function IndicadorBar({ indicadores }) {
  const { indicadorFabricacion, costoTotalPorKilo, tipoCambio } = indicadores
  if (!costoTotalPorKilo) return null
  const pos = indicadorFabricacion >= 0
  return (
    <div className={`flex items-center justify-center gap-3 border-b px-4 py-1.5 text-xs ${
      pos
        ? 'border-emerald-900 bg-emerald-950/40'
        : 'border-red-900 bg-red-950/40'
    }`}>
      <span className="text-slate-500">Indicador</span>
      <span className={`font-bold tabular-nums ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
        {pos ? '+' : ''}{formatCLP(indicadorFabricacion)}
      </span>
      <span className="text-slate-700">·</span>
      <span className="text-slate-500">Costo/kg</span>
      <span className="font-semibold text-white tabular-nums">{formatCLP(costoTotalPorKilo)}</span>
      <span className="text-slate-700">·</span>
      <span className="text-slate-500">TC</span>
      <span className="font-semibold text-white tabular-nums">{formatNumero(tipoCambio, 2)}</span>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white dark:bg-ray-cyan dark:text-ray-bg dark:shadow-glow-sm">
            <Coins size={20} aria-hidden />
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-base font-bold uppercase tracking-widest leading-tight dark:text-white">
              Costos e Importación
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="ml-1 rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-[#101f38] transition"
            aria-label="Cambiar tema"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <TabBar activo={tab} onChange={handleTabChange} />
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
