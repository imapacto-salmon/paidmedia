import { useState } from 'react'
import { FORMAT_PRESETS, mediaFor, parseVariants, serializeVariants, type Variant } from '../lib/media'
import { PreviewModal, Thumb } from './Preview'
import { IconPlus, IconX } from '../../components/icons'

/** Lista editable de formatos (Post 1:1, Story 9:16…) con su link de Drive o Instagram y vista previa. */
export function VariantEditor({ value, onChange, title }: { value: string; onChange: (v: string) => void; title: string }) {
  const list = parseVariants(value)
  const [preview, setPreview] = useState<number | null>(null)
  const commit = (next: Variant[]) => onChange(serializeVariants(next))
  const set = (i: number, patch: Partial<Variant>) => commit(list.map((v, j) => (j === i ? { ...v, ...patch } : v)))
  const add = (format: string) => commit([...list, { format, url: '' }])
  const used = new Set(list.map((v) => v.format))

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

      <div className="flex flex-wrap gap-1.5">
        {FORMAT_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => add(p.label)}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
              used.has(p.label) ? 'border-stone-200 text-stone-400 hover:text-stone-700' : 'border-stone-400 text-stone-800 hover:bg-stone-100'
            }`}
          >
            <IconPlus width={12} height={12} /> {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => add('Otro')}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-stone-300 px-2.5 py-1 text-xs font-semibold text-stone-500 hover:text-stone-800"
        >
          <IconPlus width={12} height={12} /> Otro
        </button>
      </div>

      {preview !== null && list[preview] && (
        <PreviewModal title={title} variants={list} index={preview} onIndex={setPreview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
