import { useEffect, useState } from 'react'
import { Coins, Moon, Sun } from 'lucide-react'
import TabBar from './components/TabBar.jsx'
import MesSelector from './components/MesSelector.jsx'
import Ingreso from './components/Ingreso.jsx'
import Dashboard from './components/Dashboard.jsx'
import Historial from './components/Historial.jsx'
import { useEstado } from './lib/useEstado.js'

export default function App() {
  const [tab, setTab] = useState('ingreso')
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
            <p className="text-xs text-gray-500 dark:text-slate-400">Inversiones Aravena SPA</p>
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
        <TabBar activo={tab} onChange={setTab} />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 md:px-6 md:py-6">
        <div className="mb-4">
          <MesSelector
            mesActivo={estado.mesActivo}
            mesesOrdenados={estado.mesesOrdenados}
            onChange={estado.setMesActivo}
            onCrear={estado.crearMes}
          />
        </div>
        {tab === 'ingreso'   && <Ingreso   estado={estado} />}
        {tab === 'resumen'   && <Dashboard estado={estado} />}
        {tab === 'historial' && <Historial estado={estado} />}
      </main>
    </div>
  )
}
