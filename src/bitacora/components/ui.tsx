import { useEffect, type ReactNode } from 'react'
import { IconX } from '../../components/icons'

/** Selector con aspecto de etiqueta de color (usa el <select> nativo para que funcione bien en celular). */
export function StatusSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'sm',
}: {
  value: T
  options: { value: T; label: string; cls: string; dot: string }[]
  onChange: (v: T) => void
  label: string
  size?: 'sm' | 'md'
}) {
  const current = options.find((o) => o.value === value) ?? options[0]
  return (
    <label
      className={`relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border font-semibold transition hover:brightness-95 ${current.cls} ${
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      }`}
      title={label}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${current.dot}`} />
      <span className="whitespace-nowrap">{current.label}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-60">
        <path d="m6 9 6 6 6-6" />
      </svg>
      <select
        aria-label={label}
        className="absolute inset-0 cursor-pointer opacity-0"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        onClick={(e) => e.stopPropagation()}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: ReactNode
  onClose?: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!onClose) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-stone-900/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-3.5">
          <h2 className="text-base font-bold text-stone-900">{title}</h2>
          {onClose && (
            <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar">
              <IconX />
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-stone-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

/** Muestra texto con saltos de línea y vuelve clicables las URLs. */
export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return (
    <p className={`break-words whitespace-pre-line ${className}`}>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noreferrer" className="text-salmon-700 underline" onClick={(e) => e.stopPropagation()}>
            {p}
          </a>
        ) : (
          p
        ),
      )}
    </p>
  )
}

export const isUrl = (s: string) => /^https?:\/\//.test(s.trim())

export function timeAgo(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const s = (Date.now() - d.getTime()) / 1000
  if (s < 60) return 'hace un momento'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  if (s < 86400 * 7) return `hace ${Math.floor(s / 86400)} d`
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}
