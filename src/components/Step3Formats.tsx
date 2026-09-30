import { useState } from 'react'
import {
  FORMATS,
  KIND_LABELS,
  PLATFORMS,
  PRESETS,
  type FormatKind,
  type FormatSpec,
  type Preset,
} from '../config/formats'
import { VIDEO_DURATIONS } from '../config/lists'
import type { BriefApi } from '../state/useBrief'
import type { Piece, SelectedFormat } from '../types'
import { newSelectedFormat, pieceCounts, pieceFormulaText } from '../lib/utils'
import { StepHeader } from './ui'
import { FormatShape } from './FormatShape'
import { IconCheck, IconCopy, IconSparkles, IconX, PlatformLogo } from './icons'

export function Step3Formats({ api, goTo }: { api: BriefApi; goTo: (s: number) => void }) {
  const { brief, setBrief } = api
  const [activeId, setActiveId] = useState(brief.pieces[0]?.id)
  const piece = brief.pieces.find((p) => p.id === activeId) ?? brief.pieces[0]
  const [applied, setApplied] = useState(false)

  if (!brief.pieces.length || !brief.platforms.length) {
    return (
      <div>
        <StepHeader title="Formatos" />
        <div className="card p-8 text-center text-stone-600">
          {!brief.platforms.length ? (
            <>
              Primero elige al menos una plataforma en{' '}
              <button className="font-semibold text-salmon-600 underline" onClick={() => goTo(0)}>
                Datos generales
              </button>
              .
            </>
          ) : (
            <>
              Primero agrega al menos una pieza en{' '}
              <button className="font-semibold text-salmon-600 underline" onClick={() => goTo(1)}>
                Piezas
              </button>
              .
            </>
          )}
        </div>
      </div>
    )
  }

  const setFormats = (fn: (f: SelectedFormat[]) => SelectedFormat[]) =>
    api.updatePiece(piece.id, (p) => ({ formats: fn(p.formats) }))

  const toggleFormat = (spec: FormatSpec) =>
    setFormats((fs) =>
      fs.some((f) => f.formatId === spec.id) ? fs.filter((f) => f.formatId !== spec.id) : [...fs, newSelectedFormat(spec.id)],
    )

  const patchFormat = (id: string, patch: Partial<SelectedFormat>) =>
    setFormats((fs) => fs.map((f) => (f.formatId === id ? { ...f, ...patch } : f)))

  const applyPreset = (preset: Preset) =>
    setFormats((fs) => {
      const next = [...fs]
      for (const item of preset.items) {
        const existing = next.find((f) => f.formatId === item.formatId)
        if (existing) existing.kinds = Array.from(new Set([...existing.kinds, ...item.kinds]))
        else next.push(newSelectedFormat(item.formatId, item.kinds))
      }
      return next.map((f) => ({ ...f }))
    })

  const applyToAll = () => {
    setBrief((b) => ({
      ...b,
      pieces: b.pieces.map((p) => (p.id === piece.id ? p : { ...p, formats: structuredClone(piece.formats) })),
    }))
    setApplied(true)
    setTimeout(() => setApplied(false), 2000)
  }

  const presets = PRESETS.filter((p) => brief.platforms.includes(p.platform))
  const platforms = PLATFORMS.filter((p) => brief.platforms.includes(p.id))

  return (
    <div>
      <StepHeader
        title="Formatos"
        subtitle="Elige en qué tamaños se adapta CADA versión de la pieza. Toca una tarjeta para seleccionarla."
      />

      {/* Selector de pieza */}
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {brief.pieces.map((p, i) => (
          <PieceTab key={p.id} piece={p} index={i} active={p.id === piece.id} onClick={() => setActiveId(p.id)} api={api} />
        ))}
      </div>

      <div className="card p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-stone-900">{piece.name || 'Pieza sin nombre'}</h3>
            <p className="text-sm text-stone-500">{pieceFormulaText(piece, brief)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {brief.pieces.length > 1 && (
              <button type="button" className="btn btn-secondary" onClick={applyToAll} disabled={!piece.formats.length}>
                {applied ? <IconCheck /> : <IconCopy />}
                {applied ? 'Aplicado' : 'Aplicar mismos formatos a todas las piezas'}
              </button>
            )}
            {piece.formats.length > 0 && (
              <button type="button" className="btn btn-ghost" onClick={() => setFormats(() => [])}>
                <IconX /> Limpiar
              </button>
            )}
          </div>
        </div>

        {presets.length > 0 && (
          <div className="mb-6 rounded-2xl bg-salmon-50/70 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-salmon-700 uppercase">
              <IconSparkles width={14} height={14} /> Presets de un clic
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button key={p.id} type="button" className="chip chip-off" onClick={() => applyPreset(p)}>
                  <PlatformLogo id={p.platform} size={14} /> {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {platforms.map((pl) => {
            const specs = FORMATS.filter((f) => f.platform === pl.id)
            const groups = Array.from(new Set(specs.map((s) => s.group ?? '')))
            return (
              <section key={pl.id}>
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-stone-800">
                  <PlatformLogo id={pl.id} size={20} /> {pl.name}
                </h4>
                {groups.map((g) => (
                  <div key={g} className="mb-4">
                    {g && <div className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">{g}</div>}
                    <div className="grid grid-cols-1 items-start gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
                      {specs
                        .filter((s) => (s.group ?? '') === g)
                        .map((spec) => (
                          <FormatCard
                            key={spec.id}
                            spec={spec}
                            selected={piece.formats.find((f) => f.formatId === spec.id)}
                            onToggle={() => toggleFormat(spec)}
                            onPatch={(patch) => patchFormat(spec.id, patch)}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PieceTab({
  piece,
  index,
  active,
  onClick,
  api,
}: {
  piece: Piece
  index: number
  active: boolean
  onClick: () => void
  api: BriefApi
}) {
  const c = pieceCounts(piece, api.brief)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-left transition ${
        active ? 'border-salmon-500 bg-white shadow-sm' : 'border-transparent bg-stone-100 hover:bg-stone-200/70'
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          active ? 'bg-salmon-500 text-white' : 'bg-white text-stone-600'
        }`}
      >
        {index + 1}
      </span>
      <span className="max-w-40 truncate text-sm font-semibold text-stone-800">{piece.name || 'Sin nombre'}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
          c.formatSlots ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}
      >
        {c.formatSlots ? `${c.formatSlots} fmt` : 'sin formatos'}
      </span>
    </button>
  )
}

function FormatCard({
  spec,
  selected,
  onToggle,
  onPatch,
}: {
  spec: FormatSpec
  selected?: SelectedFormat
  onToggle: () => void
  onPatch: (p: Partial<SelectedFormat>) => void
}) {
  const on = !!selected
  const toggleKind = (k: FormatKind) => {
    if (!selected) return
    const kinds = selected.kinds.includes(k) ? selected.kinds.filter((x) => x !== k) : [...selected.kinds, k]
    if (!kinds.length) onToggle()
    else onPatch({ kinds })
  }
  const hasVideo = selected?.kinds.includes('video')

  return (
    <div
      className={`relative rounded-2xl border-2 transition ${
        on ? 'border-salmon-500 bg-salmon-50/60 shadow-sm' : 'border-stone-200 bg-white hover:border-salmon-200'
      }`}
    >
      <button type="button" onClick={onToggle} className="flex w-full cursor-pointer items-center gap-4 p-3 text-left">
        <FormatShape spec={spec} active={on} />
        <div className="min-w-0 flex-1">
          <div className="text-lg leading-tight font-bold text-stone-900">{spec.ratio}</div>
          <div className="text-sm font-medium text-stone-700">{spec.placement}</div>
          <div className="mt-0.5 font-mono text-xs text-stone-500">
            {spec.width}×{spec.height} px
          </div>
          <div className="mt-1 text-xs text-stone-500">{spec.files.join(' · ')}</div>
        </div>
        <span
          className={`absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
            on ? 'border-salmon-500 bg-salmon-500 text-white' : 'border-stone-300 bg-white text-transparent'
          }`}
        >
          <IconCheck width={14} height={14} strokeWidth={3} />
        </span>
      </button>

      {spec.notes && !on && <p className="px-3 pb-3 text-xs text-stone-500">{spec.notes}</p>}

      {on && selected && (
        <div className="space-y-3 border-t border-salmon-200/70 px-3 pt-2.5 pb-3">
          {spec.kinds.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-stone-500">Tipo:</span>
              {spec.kinds.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleKind(k)}
                  className={`chip px-2.5 py-1 text-xs ${selected.kinds.includes(k) ? 'chip-on' : 'chip-off'}`}
                >
                  {selected.kinds.includes(k) && <IconCheck width={12} height={12} strokeWidth={3} />}
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          )}
          {spec.kinds.length === 1 && (
            <div className="text-xs text-stone-500">
              Tipo: <span className="font-semibold text-stone-700">{KIND_LABELS[spec.kinds[0]]}</span>
            </div>
          )}

          {hasVideo && (
            <div className="space-y-2 rounded-xl bg-white p-2.5">
              {spec.videoAdTypes && (
                <label className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 font-medium text-stone-500">Anuncio</span>
                  <select
                    className="input py-1 text-xs"
                    value={selected.adType}
                    onChange={(e) =>
                      onPatch({ adType: e.target.value, ...(e.target.value.startsWith('Bumper') ? { duration: '6s' } : {}) })
                    }
                  >
                    {spec.videoAdTypes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="flex items-center gap-2 text-xs">
                <span className="w-16 shrink-0 font-medium text-stone-500">Duración</span>
                <div className="flex flex-wrap gap-1">
                  {VIDEO_DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onPatch({ duration: d })}
                      className={`cursor-pointer rounded-md border px-2 py-0.5 font-semibold ${
                        selected.duration === d
                          ? 'border-salmon-500 bg-salmon-500 text-white'
                          : 'border-stone-300 text-stone-600 hover:border-salmon-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              {selected.duration === 'Otra' && (
                <input
                  className="input py-1 text-xs"
                  placeholder="Ej. 20s"
                  value={selected.customDuration}
                  onChange={(e) => onPatch({ customDuration: e.target.value })}
                />
              )}
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-stone-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-salmon-500"
                  checked={selected.subtitles}
                  onChange={(e) => onPatch({ subtitles: e.target.checked })}
                />
                Lleva subtítulos
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
