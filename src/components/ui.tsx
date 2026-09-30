import type { ReactNode } from 'react'
import type { LinkItem } from '../types'
import { newLink } from '../lib/utils'
import { IconLink, IconPlus, IconX } from './icons'

export function Field({
  label,
  hint,
  required,
  children,
  className = '',
}: {
  label: string
  hint?: ReactNode
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label">
        {label}
        {required && <span className="text-salmon-500"> *</span>}
      </span>
      {children}
      {hint && <span className="hint block">{hint}</span>}
    </label>
  )
}

export function LinkList({
  links,
  onChange,
  addLabel = 'Agregar link',
  placeholderLabel = 'Ej. Presentación de la campaña',
}: {
  links: LinkItem[]
  onChange: (links: LinkItem[]) => void
  addLabel?: string
  placeholderLabel?: string
}) {
  const set = (id: string, patch: Partial<LinkItem>) =>
    onChange(links.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  return (
    <div className="space-y-2">
      {links.map((l) => (
        <div key={l.id} className="flex flex-col gap-2 rounded-xl bg-stone-50 p-2 sm:flex-row sm:items-center sm:bg-transparent sm:p-0">
          <div className="flex items-center gap-2 sm:w-2/5">
            <IconLink className="shrink-0 text-stone-400" />
            <input
              className="input"
              placeholder={placeholderLabel}
              value={l.label}
              onChange={(e) => set(l.id, { label: e.target.value })}
            />
          </div>
          <div className="flex flex-1 items-center gap-2">
            <input
              className="input"
              type="url"
              inputMode="url"
              placeholder="https://drive.google.com/…"
              value={l.url}
              onChange={(e) => set(l.id, { url: e.target.value })}
            />
            <button
              type="button"
              className="btn btn-ghost"
              aria-label="Quitar link"
              onClick={() => onChange(links.filter((x) => x.id !== l.id))}
            >
              <IconX />
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-secondary" onClick={() => onChange([...links, newLink()])}>
        <IconPlus /> {addLabel}
      </button>
    </div>
  )
}

export function StepHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h2>
      {subtitle && <p className="mt-1 text-stone-500">{subtitle}</p>}
    </div>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-stone-100 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            o.value === value ? 'bg-white text-salmon-700 shadow-sm' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
