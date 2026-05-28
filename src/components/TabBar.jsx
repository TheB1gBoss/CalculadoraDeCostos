import { BarChart3, ClipboardList, History } from 'lucide-react'

export const TABS = [
  { id: 'ingreso',   label: 'Ingreso',   icon: ClipboardList },
  { id: 'historial', label: 'Historial', icon: History },
  { id: 'resumen',   label: 'Resumen',   icon: BarChart3 },
]

export default function TabBar({ activo, onChange }) {
  return (
    <nav
      className="border-b border-gray-200 bg-white dark:border-ray-border dark:bg-ray-surface"
      aria-label="Navegación principal"
    >
      <ul className="mx-auto flex max-w-5xl items-center justify-around gap-1 px-2 py-1 md:justify-start md:gap-2 md:px-6 md:py-2">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = activo === t.id
          return (
            <li key={t.id} className="flex-1 md:flex-initial">
              <button
                type="button"
                onClick={() => onChange(t.id)}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex w-full flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-xs font-medium transition md:flex-row md:gap-2 md:px-4 md:py-2 md:text-sm',
                  active
                    ? 'bg-brand-50 text-brand-600 dark:bg-ray-cyan-dim dark:text-ray-cyan'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-[#101f38] dark:hover:text-slate-200',
                ].join(' ')}
              >
                <Icon size={20} aria-hidden />
                <span>{t.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
