import { useState, type ReactNode } from 'react'
import { getFormat, getPlatform, KIND_LABELS } from '../config/formats'
import { PRIORITIES } from '../config/lists'
import type { BriefApi } from '../state/useBrief'
import type { LinkItem, Piece } from '../types'
import {
  activeFormats,
  briefCounts,
  clientName,
  countsText,
  filledLinks,
  formatDate,
  formulaText,
  normalizeUrl,
  objectiveName,
  pdfFileName,
  pieceCounts,
  validate,
  versionLetters,
  videoDuration,
} from '../lib/utils'
import { downloadBriefPdf } from '../pdf/generate'
import { StepHeader } from './ui'
import { FormatShape } from './FormatShape'
import { IconAlert, IconDownload, PlatformLogo } from './icons'

export function Step4Summary({ api, goTo }: { api: BriefApi; goTo: (s: number) => void }) {
  const { brief } = api
  const issues = validate(brief)
  const errors = issues.filter((i) => i.level === 'error')
  const warnings = issues.filter((i) => i.level === 'warning')
  const total = briefCounts(brief)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const priority = PRIORITIES.find((p) => p.id === brief.priority)!

  const download = async () => {
    setBusy(true)
    setError('')
    try {
      await downloadBriefPdf(brief)
    } catch (e) {
      console.error(e)
      setError('No se pudo generar el PDF. Intenta de nuevo o quita alguna imagen muy pesada.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <StepHeader title="Resumen y PDF" subtitle="Revisa el brief tal como lo verá el equipo de diseño." />

      <div className="mb-5 rounded-2xl bg-gradient-to-br from-salmon-500 to-salmon-600 p-5 text-white shadow-md sm:p-6">
        <div className="text-sm font-medium text-white/80">Entregables totales</div>
        <div className="mt-1 text-3xl font-bold tracking-tight">
          {total.total} archivos <span className="text-xl font-semibold text-white/90">· {countsText(total)}</span>
        </div>
        <div className="mt-1 text-sm text-white/85">{formulaText(brief)}</div>
      </div>

      {issues.length > 0 && (
        <div className="mb-5 space-y-2">
          {[...errors, ...warnings].map((i, n) => (
            <div
              key={n}
              className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${
                i.level === 'error' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'
              }`}
            >
              <IconAlert className="mt-0.5 shrink-0" width={16} height={16} />
              <span className="flex-1">
                <strong>{i.level === 'error' ? 'Falta: ' : 'Aviso: '}</strong>
                {i.message}
              </span>
              <button className="shrink-0 cursor-pointer font-semibold underline" onClick={() => goTo(i.step)}>
                Corregir
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card mb-5 flex flex-col items-stretch gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-sm text-stone-500">
          <div className="font-medium text-stone-700">Archivo</div>
          <div className="truncate font-mono text-xs">{pdfFileName(brief)}</div>
        </div>
        <button className="btn btn-primary px-6 py-3 text-base" disabled={errors.length > 0 || busy} onClick={download}>
          <IconDownload /> {busy ? 'Generando PDF…' : 'Descargar brief (PDF)'}
        </button>
      </div>
      {errors.length > 0 && (
        <p className="-mt-3 mb-5 text-right text-xs text-red-700">Corrige los puntos marcados como “Falta” para descargar.</p>
      )}
      {error && <p className="-mt-3 mb-5 text-right text-sm text-red-700">{error}</p>}

      {/* Vista previa */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b-2 border-salmon-500 px-5 py-3">
          <span className="font-bold text-salmon-700">Impacto Salmón — Brief de Artes</span>
          <span className="text-xs text-stone-500">Vista previa</span>
        </div>
        <div className="space-y-8 p-5 sm:p-7">
          <section>
            <div className="text-xs font-bold tracking-wider text-salmon-500 uppercase">Brief de artes</div>
            <h3 className="text-2xl font-bold text-stone-900">{brief.campaign || 'Campaña sin nombre'}</h3>
            <div className="text-stone-500">{clientName(brief) || 'Cliente sin definir'}</div>

            <dl className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-stone-200 sm:grid-cols-3">
              {(
                [
                  ['Solicitante', brief.requester || '—'],
                  ['Fecha requerida', formatDate(brief.neededBy)],
                  ['Lanzamiento', formatDate(brief.launchDate)],
                  [
                    'Prioridad',
                    <span className="rounded-md px-1.5 py-0.5 text-xs font-bold" style={{ background: priority.bg, color: priority.color }}>
                      {priority.label.toUpperCase()}
                    </span>,
                  ],
                  ['Objetivo', objectiveName(brief) || '—'],
                  [
                    'Plataformas',
                    <span className="flex flex-wrap gap-1.5">
                      {brief.platforms.map((p) => (
                        <span key={p} className="inline-flex items-center gap-1">
                          <PlatformLogo id={p} size={14} /> {getPlatform(p).name}
                        </span>
                      ))}
                      {!brief.platforms.length && '—'}
                    </span>,
                  ],
                ] as [string, ReactNode][]
              ).map(([k, v]) => (
                <div key={k} className="border-stone-200 p-3 [&:not(:nth-last-child(-n+2))]:border-b sm:[&:not(:nth-last-child(-n+3))]:border-b">
                  <dt className="text-[11px] tracking-wide text-stone-500 uppercase">{k}</dt>
                  <dd className="text-sm font-semibold text-stone-800">{v}</dd>
                </div>
              ))}
            </dl>

            {brief.context.trim() && (
              <div className="mt-4">
                <h4 className="mb-1 text-sm font-bold">Contexto</h4>
                <p className="text-sm whitespace-pre-line text-stone-700">{brief.context}</p>
              </div>
            )}
            <PreviewLinks links={brief.links} title="Links" />

            <h4 className="mt-5 mb-2 text-sm font-bold">Entregables</h4>
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-stone-50 text-[11px] text-stone-500 uppercase">
                  <tr>
                    <th className="p-2 text-left">Pieza</th>
                    <th className="p-2">Versiones</th>
                    <th className="p-2">Formatos</th>
                    <th className="p-2">Imágenes</th>
                    <th className="p-2">Videos</th>
                    <th className="p-2">Carruseles</th>
                    <th className="p-2">Total</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {brief.pieces.map((p, i) => {
                    const c = pieceCounts(p, brief)
                    return (
                      <tr key={p.id} className="border-t border-stone-200">
                        <td className="p-2 text-left font-semibold">
                          {i + 1}. {p.name}
                        </td>
                        <td className="p-2">{p.versions}</td>
                        <td className="p-2">× {c.formatSlots}</td>
                        <td className="p-2">{c.images}</td>
                        <td className="p-2">{c.videos}</td>
                        <td className="p-2">{c.carousels}</td>
                        <td className="p-2 font-bold">{c.total}</td>
                      </tr>
                    )
                  })}
                  <tr className="border-t border-stone-200 bg-salmon-50 font-bold">
                    <td className="p-2 text-left">Total</td>
                    <td />
                    <td />
                    <td className="p-2">{total.images}</td>
                    <td className="p-2">{total.videos}</td>
                    <td className="p-2">{total.carousels}</td>
                    <td className="p-2 text-salmon-700">{total.total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {brief.pieces.map((p, i) => (
            <PiecePreview key={p.id} piece={p} index={i} api={api} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewLinks({ links, title }: { links: LinkItem[]; title: string }) {
  const list = filledLinks(links)
  if (!list.length) return null
  return (
    <div className="mt-4">
      <h4 className="mb-1 text-sm font-bold">{title}</h4>
      <ul className="space-y-0.5 text-sm">
        {list.map((l) => (
          <li key={l.id} className="truncate">
            {l.label && <span className="font-semibold">{l.label}: </span>}
            <a href={normalizeUrl(l.url)} target="_blank" rel="noreferrer" className="text-blue-600 underline">
              {l.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PiecePreview({ piece, index, api }: { piece: Piece; index: number; api: BriefApi }) {
  const { brief } = api
  const formats = activeFormats(piece, brief)
  const c = pieceCounts(piece, brief)
  const copy = piece.copy
  return (
    <section className="border-t-2 border-dashed border-stone-200 pt-7">
      <div className="text-xs font-bold tracking-wider text-salmon-500 uppercase">
        Pieza {index + 1} de {brief.pieces.length}
      </div>
      <h3 className="text-xl font-bold text-stone-900">{piece.name}</h3>
      {piece.description && <p className="mt-1 text-sm whitespace-pre-line text-stone-700">{piece.description}</p>}

      <div className="mt-3 flex items-center justify-between rounded-lg border-l-4 border-salmon-500 bg-salmon-50 px-4 py-3">
        <div>
          <div className="font-bold text-salmon-700">Versiones de diseño distintas: {piece.versions}</div>
          <div className="text-xs text-stone-500">
            {piece.versions > 1 ? `Versiones ${versionLetters(piece.versions).join(', ')} · ` : ''}
            {countsText(c)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-salmon-700">{c.total}</div>
          <div className="text-[11px] text-stone-500">archivos</div>
        </div>
      </div>

      <h4 className="mt-5 mb-2 text-sm font-bold">Formatos ({c.formatSlots})</h4>
      {formats.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {formats.map((sf) => {
            const spec = getFormat(sf.formatId)!
            const pl = getPlatform(spec.platform)
            return (
              <div key={sf.formatId} className="flex items-center gap-3 rounded-xl border border-stone-200 p-2.5">
                <FormatShape spec={spec} active scale={0.8} />
                <div className="min-w-0 text-sm">
                  <div className="text-[10px] font-bold uppercase" style={{ color: pl.color }}>
                    {pl.name}
                    {spec.group && ` · ${spec.group}`}
                  </div>
                  <div className="font-bold">
                    {spec.ratio} <span className="font-normal text-stone-600">{spec.placement}</span>
                  </div>
                  <div className="font-mono text-xs text-stone-500">
                    {spec.width}×{spec.height} px
                  </div>
                  <div className="text-xs font-semibold text-salmon-700">{sf.kinds.map((k) => KIND_LABELS[k]).join(' + ')}</div>
                  {sf.kinds.includes('video') && (
                    <div className="text-xs text-stone-600">
                      {sf.adType && `${sf.adType} · `}
                      {videoDuration(sf)} · {sf.subtitles ? 'con subtítulos' : 'sin subtítulos'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Sin formatos seleccionados.</p>
      )}

      <h4 className="mt-5 mb-2 text-sm font-bold">Copy</h4>
      {copy.mode === 'listo' && (
        <div className="rounded-xl border-2 border-salmon-400 p-3 text-sm">
          <div className="mb-1 text-[11px] font-bold tracking-wide text-salmon-700 uppercase">Texto que va en el arte</div>
          {copy.headline && <div className="text-base font-bold">{copy.headline}</div>}
          {copy.support && <p className="whitespace-pre-line">{copy.support}</p>}
          {copy.cta && (
            <div className="mt-1">
              CTA: <span className="font-semibold">{copy.cta}</span>
            </div>
          )}
          {copy.legals && (
            <div className="mt-2 border-t border-stone-200 pt-2 text-xs">
              <span className="font-bold text-salmon-700 uppercase">Legales visibles: </span>
              {copy.legals}
            </div>
          )}
        </div>
      )}
      {copy.mode === 'equipo' && (
        <div className="rounded-xl border border-stone-200 p-3 text-sm">
          <span className="font-semibold">Lo propone el equipo.</span> {copy.ideas && `Ideas / tono: ${copy.ideas}`}
        </div>
      )}
      {copy.mode === 'pendiente' && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Copy pendiente — llega después.</div>
      )}
      {!copy.mode && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Copy sin definir.</div>}

      {piece.internalNotes && (
        <div className="mt-2 rounded-xl border border-dashed border-stone-400 bg-stone-100 p-3 text-sm">
          <div className="mb-1 text-[11px] font-bold tracking-wide text-stone-600 uppercase">
            Notas internas para diseño — no van en el arte
          </div>
          <p className="whitespace-pre-line">{piece.internalNotes}</p>
        </div>
      )}

      {piece.images.length > 0 && (
        <>
          <h4 className="mt-5 mb-2 text-sm font-bold">Imágenes de inspiración</h4>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {piece.images.map((img) => (
              <img key={img.id} src={img.dataUrl} alt={img.name} className="aspect-square w-full rounded-lg border border-stone-200 object-cover" />
            ))}
          </div>
        </>
      )}
      <PreviewLinks links={piece.links} title="Links de referencia" />
    </section>
  )
}
