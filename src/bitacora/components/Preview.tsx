import { useState } from 'react'
import { mediaFor, ratioOf, type Media, type Variant } from '../lib/media'
import { Modal } from './ui'

/** Ícono simple según el tipo de link, para cuando no hay imagen. */
function Placeholder({ media, note }: { media: Media; note?: string }) {
  const label =
    media.kind === 'instagram'
      ? 'Instagram'
      : media.kind === 'drive-folder'
        ? 'Carpeta de Drive'
        : media.kind === 'drive'
          ? 'Drive'
          : media.kind === 'none'
            ? 'Sin link'
            : 'Link'
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-stone-100 p-2 text-center">
      <span className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">{label}</span>
      {note && <span className="text-[10px] leading-tight text-stone-400">{note}</span>}
    </div>
  )
}

/** Miniatura de una variación, con el marco en la proporción de su formato. */
export function Thumb({ variant, height = 96, onOpen }: { variant: Variant; height?: number; onOpen?: () => void }) {
  const media = mediaFor(variant.url)
  const [failed, setFailed] = useState(false)
  const ratio = Math.min(Math.max(ratioOf(variant.format), 0.5), 2)
  const src = media.kind === 'drive' ? media.thumb : media.kind === 'image' ? media.src : null
  const clickable = !!onOpen && media.kind !== 'none'
  return (
    // Mínimo 64 px de ancho para que se lea el nombre del formato en las Stories.
    <figure className="shrink-0" style={{ width: Math.max(64, Math.round(height * ratio)) }}>
      <button
        type="button"
        disabled={!clickable}
        onClick={(e) => {
          e.stopPropagation()
          onOpen?.()
        }}
        className={`block w-full overflow-hidden rounded-lg border border-stone-200 bg-black ${clickable ? 'cursor-zoom-in hover:border-stone-500' : 'cursor-default'}`}
        style={{ height }}
        title={failed ? 'No se pudo cargar la vista previa: comparte el archivo con “Cualquier persona con el enlace”.' : variant.url || variant.format}
      >
        {src && !failed ? (
          <img src={src} alt={variant.format} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setFailed(true)} />
        ) : media.kind === 'video' ? (
          <video src={media.src} muted preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <Placeholder media={media} note={failed ? 'Sin acceso' : undefined} />
        )}
      </button>
      <figcaption className="mt-1 truncate text-[11px] font-medium text-stone-500">{variant.format || 'Sin formato'}</figcaption>
    </figure>
  )
}

/** Tira de miniaturas para la tarjeta. */
export function VariantStrip({ variants, onOpen }: { variants: Variant[]; onOpen: (i: number) => void }) {
  if (!variants.length) return null
  return (
    <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
      {variants.map((v, i) => (
        <Thumb key={i} variant={v} height={88} onOpen={() => onOpen(i)} />
      ))}
    </div>
  )
}

/** Vista grande: Drive con su reproductor (sirve para imágenes y videos), Instagram con su embed. */
export function PreviewModal({ title, variants, index, onIndex, onClose }: { title: string; variants: Variant[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const v = variants[index]
  const media = mediaFor(v.url)
  const tall = ratioOf(v.format) < 0.9
  const frame = `w-full rounded-xl border border-stone-200 bg-black ${tall ? 'h-[70vh]' : 'h-[60vh]'}`
  return (
    <Modal
      wide
      title={
        <span>
          {title} <span className="font-medium text-stone-500">· {v.format || 'Sin formato'}</span>
        </span>
      }
      onClose={onClose}
      footer={
        <>
          {variants.length > 1 && (
            <div className="mr-auto flex flex-wrap gap-1">
              {variants.map((x, i) => (
                <button
                  key={i}
                  onClick={() => onIndex(i)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${i === index ? 'bg-stone-900 text-stone-50' : 'text-stone-500 hover:bg-stone-100'}`}
                >
                  {x.format || `#${i + 1}`}
                </button>
              ))}
            </div>
          )}
          {'open' in media && (
            <a className="btn btn-secondary" href={media.open} target="_blank" rel="noreferrer">
              Abrir original ↗
            </a>
          )}
        </>
      }
    >
      {media.kind === 'drive' || media.kind === 'instagram' ? (
        <iframe src={media.embed} title={v.format} className={frame} allow="autoplay; encrypted-media" allowFullScreen />
      ) : media.kind === 'image' ? (
        <img src={media.src} alt={v.format} className={`${frame} object-contain`} />
      ) : media.kind === 'video' ? (
        <video src={media.src} controls className={frame} />
      ) : (
        <div className="rounded-xl bg-stone-100 p-6 text-center text-sm text-stone-500">
          {media.kind === 'drive-folder'
            ? 'Es una carpeta de Drive: no tiene vista previa. Pega el link de cada archivo para verlo aquí.'
            : media.kind === 'none'
              ? 'Esta variación todavía no tiene link.'
              : 'Este link no tiene vista previa. Ábrelo con el botón de abajo.'}
        </div>
      )}
      {media.kind === 'drive' && (
        <p className="mt-2 text-xs text-stone-500">
          Si no se ve, el archivo no está compartido con “Cualquier persona con el enlace” o el link es de otra cuenta.
        </p>
      )}
    </Modal>
  )
}
