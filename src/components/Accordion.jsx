import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Accordion({
  title,
  subtitle,
  icon: Icon,
  defaultOpen = false,
  badge,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
        aria-expanded={open}
      >
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon size={18} />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        {badge !== undefined && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {badge}
          </span>
        )}
        <ChevronDown
          size={18}
          className={`text-gray-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t border-gray-100 p-4">{children}</div>}
    </section>
  )
}
