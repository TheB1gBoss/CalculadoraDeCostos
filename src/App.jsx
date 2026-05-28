import { useState } from 'react'
import { Coins } from 'lucide-react'
import TabBar from './components/TabBar.jsx'
import MesSelector from './components/MesSelector.jsx'
import Compras from './components/Compras.jsx'
import Costos from './components/Costos.jsx'
import Llegadas from './components/Llegadas.jsx'
import Dashboard from './components/Dashboard.jsx'
import Historial from './components/Historial.jsx'
import { useEstado } from './lib/useEstado.js'

export default function App() {
  const [tab, setTab] = useState('compras')
  const estado = useEstado()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Coins size={20} aria-hidden />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-semibold leading-tight">
              Calculadora Importaciones
            </h1>
            <p className="text-xs text-gray-500">Inversiones Aravena SPA</p>
          </div>
          <div className="hidden w-72 md:block">
            <MesSelector
              mesActivo={estado.mesActivo}
              mesesOrdenados={estado.mesesOrdenados}
              onChange={estado.setMesActivo}
              onCrear={estado.crearMes}
            />
          </div>
        </div>
        <div className="md:hidden mx-auto max-w-5xl px-4 pb-3">
          <MesSelector
            mesActivo={estado.mesActivo}
            mesesOrdenados={estado.mesesOrdenados}
            onChange={estado.setMesActivo}
            onCrear={estado.crearMes}
          />
        </div>
        <div className="hidden md:block">
          <TabBar activo={tab} onChange={setTab} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-6">
        {tab === 'compras'  && <Compras  estado={estado} />}
        {tab === 'costos'   && <Costos   estado={estado} />}
        {tab === 'llegadas' && <Llegadas estado={estado} />}
        {tab === 'resumen'  && <Dashboard estado={estado} />}
        {tab === 'historial'&& <Historial estado={estado} />}
      </main>

      <div className="md:hidden">
        <TabBar activo={tab} onChange={setTab} />
      </div>
    </div>
  )
}
