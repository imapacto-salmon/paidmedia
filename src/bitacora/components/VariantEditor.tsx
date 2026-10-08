import { useState } from 'react'
import { FORMAT_PRESETS, mediaFor, parseVariants, serializeVariants, type Variant } from '../lib/media'
import { PreviewModal, Thumb } from './Preview'
import { IconPlus, IconX } from '../../components/icons'
import { FormatShape } from '../../components/FormatShape'

/** Lista editable de formatos (Post 1:1, Story 9:16…) con su link de Drive o Instagram y vista previa. */
export function VariantEditor({ value, onChange, title }: { value: string; onChange: (v: string) => void; title: string }) {
  const list = parseVariants(value)
  const [preview, setPreview] = useState<number | null>(null)
  const commit = (next: Variant[]) => onChange(serializeVariants(next))
  const set = (i: number, patch: Partial<Variant>) => commit(list.map((v, j) => (j === i ? { ...v, ...patch } : v)))
  const add = (format: string) => commit([...list, { format, url: '' }])

  return (
    <div className="space-y-3">
      {list.map((v, i) => {
        const media = mediaFor(v.url)
        return (
          <div key={i} className="flex gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
            <Thumb variant={v} height={72} onOpen={() => setPreview(i)} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex gap-2">
                <input
                  className="input py-1.5"
                  value={v.format}
                  onChange={(e) => set(i, { format: e.target.value })}
                  list="bt-formats"
                  placeholder="Formato"
                  aria-label="Formato"
                />
                <button type="button" className="btn btn-ghost" aria-label="Quitar formato" onClick={() => commit(list.filter((_, j) => j !== i))}>
                  <IconX />
                </button>
              </div>
              <input
                className="input py-1.5"
                value={v.url}
                onChange={(e) => set(i, { url: e.target.value })}
                placeholder="Link de Drive o de Instagram"
                aria-label={`Link de ${v.format || 'la variación'}`}
                inputMode="url"
              />
              {v.url && (
                <p className="text-[11px] text-stone-500">
                  {media.kind === 'drive'
                    ? 'Drive · vista previa lista (si no se ve, compártelo con “cualquier persona con el enlace”)'
                    : media.kind === 'instagram'
                      ? 'Instagram · se ve el post completo al abrir la vista previa'
                      : media.kind === 'drive-folder'
                        ? 'Es una carpeta: pega el link del archivo para ver la vista previa'
                        : media.kind === 'image' || media.kind === 'video'
                          ? 'Archivo directo · vista previa lista'
                          : 'Este link no tiene vista previa, pero queda guardado'}
                </p>
              )}
            </div>
          </div>
        )
      })}

      <datalist id="bt-formats">
        {FORMAT_PRESETS.map((p) => (
          <option key={p.label} value={p.label} />
        ))}
      </datalist>

      {/* Tarjetas de formato, igual que en el Brief: picar una agrega esa variación. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {FORMAT_PRESETS.map((p) => {
          const count = list.filter((v) => v.format === p.label).length
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => add(p.label)}
              title={`Agregar ${p.label}`}
              className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-left transition hover:border-stone-500 ${
                count ? 'border-stone-600 bg-stone-100' : 'border-stone-200 bg-stone-50'
              }`}
            >
              <FormatShape spec={{ ...p, frame: 'phone' }} active={count > 0} scale={0.6} />
              <span className="min-w-0">
                <span className="block text-base leading-tight font-bold text-stone-900">{p.ratio}</span>
                <span className="block truncate text-xs font-medium text-stone-700">{p.placement}</span>
                <span className="block font-mono text-[10px] text-stone-500">
                  {p.width}×{p.height} px
                </span>
                {p.note && <span className="block truncate text-[10px] text-stone-500">{p.note}</span>}
              </span>
              <span
                className={`absolute top-2 right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
                  count ? 'bg-stone-900 text-stone-50' : 'border border-stone-300 text-stone-500'
                }`}
              >
                {count || <IconPlus width={11} height={11} />}
              </span>
            </button>
          )
        })}
      </div>
      <button type="button" onClick={() => add('Otro')} className="text-xs font-semibold text-stone-500 hover:text-stone-800">
        + Otro formato
      </button>

      {preview !== null && list[preview] && (
        <PreviewModal title={title} variants={list} index={preview} onIndex={setPreview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
