import type { BriefApi } from '../state/useBrief'
import type { CopyMode, Piece } from '../types'
import { newPiece, uid } from '../lib/utils'
import { Field, LinkList, Segmented, StepHeader } from './ui'
import { ImageDrop } from './ImageDrop'
import { IconCopy, IconPlus, IconTrash } from './icons'

const COPY_MODES: { value: Exclude<CopyMode, null>; title: string; desc: string }[] = [
  { value: 'listo', title: 'Ya tengo copy', desc: 'Titular, texto, CTA y legales' },
  { value: 'equipo', title: 'Que lo proponga el equipo', desc: 'Diseño/redacción lo propone' },
  { value: 'pendiente', title: 'Pendiente', desc: 'El copy llega después' },
]

export function Step2Pieces({ api }: { api: BriefApi }) {
  const { brief, setBrief } = api

  const add = () => setBrief((b) => ({ ...b, pieces: [...b.pieces, newPiece(b.pieces.length + 1)] }))
  const remove = (id: string) => {
    const p = brief.pieces.find((x) => x.id === id)
    if (p && (p.description || p.images.length) && !confirm(`¿Eliminar “${p.name}”?`)) return
    setBrief((b) => ({ ...b, pieces: b.pieces.filter((x) => x.id !== id) }))
  }
  const duplicate = (id: string) =>
    setBrief((b) => {
      const i = b.pieces.findIndex((x) => x.id === id)
      const src = b.pieces[i]
      const copy: Piece = {
        ...structuredClone(src),
        id: uid(),
        name: `${src.name} (copia)`,
        images: src.images.map((img) => ({ ...img, id: uid() })),
        links: src.links.map((l) => ({ ...l, id: uid() })),
      }
      const pieces = [...b.pieces]
      pieces.splice(i + 1, 0, copy)
      return { ...b, pieces }
    })

  return (
    <div>
      <StepHeader
        title="Piezas"
        subtitle="Una pieza = una promoción o mensaje distinto (ej. “Promo 3 meses 50%”)."
      />

      <div className="space-y-5">
        {brief.pieces.map((p, i) => (
          <PieceCard
            key={p.id}
            index={i}
            piece={p}
            api={api}
            onRemove={() => remove(p.id)}
            onDuplicate={() => duplicate(p.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-salmon-300 bg-salmon-50/50 py-5 font-semibold text-salmon-600 transition hover:bg-salmon-50"
      >
        <IconPlus /> Agregar pieza
      </button>
    </div>
  )
}

function PieceCard({
  piece,
  index,
  api,
  onRemove,
  onDuplicate,
}: {
  piece: Piece
  index: number
  api: BriefApi
  onRemove: () => void
  onDuplicate: () => void
}) {
  const set = (patch: Partial<Piece>) => api.updatePiece(piece.id, patch)
  const setCopy = (patch: Partial<Piece['copy']>) => api.updatePiece(piece.id, (p) => ({ copy: { ...p.copy, ...patch } }))

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-stone-100 bg-salmon-50/60 px-5 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-salmon-500 text-sm font-bold text-white">
          {index + 1}
        </span>
        <input
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-stone-900 outline-none placeholder:text-stone-400"
          value={piece.name}
          placeholder="Nombre de la pieza"
          onChange={(e) => set({ name: e.target.value })}
          aria-label="Nombre de la pieza"
        />
        <button type="button" className="btn btn-ghost" onClick={onDuplicate} title="Duplicar pieza">
          <IconCopy /> <span className="hidden sm:inline">Duplicar</span>
        </button>
        <button type="button" className="btn btn-ghost hover:text-red-600" onClick={onRemove} title="Eliminar pieza">
          <IconTrash />
        </button>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <Field label="Descripción de la promoción / mensaje">
          <textarea
            className="input min-h-20"
            placeholder="Ej. 3 meses al 50% en membresía anual. Vigencia del 1 al 30 de noviembre."
            value={piece.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </Field>

        <div>
          <span className="label">Versiones de diseño distintas</span>
          <Segmented
            options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
            value={piece.versions}
            onChange={(versions) => set({ versions })}
          />
          <p className="hint">
            <strong>Versiones = diseños diferentes</strong> (A, B, C…). Los formatos (1:1, 9:16…) se eligen en el
            siguiente paso.
          </p>
        </div>

        <div>
          <span className="label">Copy</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {COPY_MODES.map((m) => {
              const on = piece.copy.mode === m.value
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setCopy({ mode: m.value })}
                  className={`cursor-pointer rounded-xl border-2 px-3 py-2.5 text-left transition ${
                    on ? 'border-salmon-500 bg-salmon-50' : 'border-stone-200 hover:border-salmon-200'
                  }`}
                >
                  <div className={`text-sm font-semibold ${on ? 'text-salmon-700' : 'text-stone-700'}`}>{m.title}</div>
                  <div className="text-xs text-stone-500">{m.desc}</div>
                </button>
              )
            })}
          </div>

          {piece.copy.mode === 'listo' && (
            <div className="mt-4 grid gap-4 rounded-2xl bg-stone-50 p-4 sm:grid-cols-2">
              <Field label="Titular">
                <input className="input" value={piece.copy.headline} onChange={(e) => setCopy({ headline: e.target.value })} />
              </Field>
              <Field label="CTA (botón / llamado a la acción)">
                <input
                  className="input"
                  placeholder="Ej. Inscríbete hoy"
                  value={piece.copy.cta}
                  onChange={(e) => setCopy({ cta: e.target.value })}
                />
              </Field>
              <Field label="Texto de apoyo" className="sm:col-span-2">
                <textarea className="input min-h-16" value={piece.copy.support} onChange={(e) => setCopy({ support: e.target.value })} />
              </Field>
              <Field label="Legales visibles en el arte" hint="Este texto SÍ aparece en el diseño." className="sm:col-span-2">
                <textarea
                  className="input min-h-14"
                  placeholder="Ej. Aplican restricciones. Vigencia al 30/11/2026."
                  value={piece.copy.legals}
                  onChange={(e) => setCopy({ legals: e.target.value })}
                />
              </Field>
            </div>
          )}
          {piece.copy.mode === 'equipo' && (
            <div className="mt-4 rounded-2xl bg-stone-50 p-4">
              <Field label="Ideas o tono (opcional)">
                <textarea
                  className="input min-h-16"
                  placeholder="Ej. Cercano, con humor. Resaltar el 50%."
                  value={piece.copy.ideas}
                  onChange={(e) => setCopy({ ideas: e.target.value })}
                />
              </Field>
            </div>
          )}
          {piece.copy.mode === 'pendiente' && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Diseño trabajará con textos de relleno hasta que llegue el copy.
            </p>
          )}
        </div>

        <Field label="Notas internas para diseño" hint="NO van en el arte. Indicaciones, referencias de estilo, qué evitar…">
          <textarea
            className="input min-h-16 border-dashed"
            placeholder="Ej. Usar fotos del shooting de octubre. Evitar el color verde."
            value={piece.internalNotes}
            onChange={(e) => set({ internalNotes: e.target.value })}
          />
        </Field>

        <div>
          <span className="label">Imágenes de inspiración</span>
          <ImageDrop
            images={piece.images}
            onAdd={(imgs) => api.updatePiece(piece.id, (p) => ({ images: [...p.images, ...imgs] }))}
            onRemove={(id) => api.updatePiece(piece.id, (p) => ({ images: p.images.filter((x) => x.id !== id) }))}
          />
        </div>

        <div>
          <span className="label">Links de referencia de esta pieza</span>
          <LinkList
            links={piece.links}
            onChange={(links) => set({ links })}
            addLabel="Agregar link de referencia"
            placeholderLabel="Ej. Referencia en Pinterest"
          />
        </div>
      </div>
    </div>
  )
}
