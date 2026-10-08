/**
 * Variaciones de formato de un anuncio (Post 1:1, Story 9:16…) y vista previa de sus links.
 *
 * Se guardan en el campo `variants` del anuncio como texto, una por línea:
 *   Post 1:1 | https://drive.google.com/file/d/…/view
 * Así la columna “Formatos” de la hoja se puede leer y editar a mano.
 */

export type Variant = { format: string; url: string }

/** Formatos que se cargan casi siempre. `ratio` es ancho / alto, solo para dibujar el marco de la vista previa. */
export const FORMAT_PRESETS: { label: string; ratio: number }[] = [
  { label: 'Post 1:1', ratio: 1 },
  { label: 'Story 9:16', ratio: 9 / 16 },
  { label: 'Búsqueda', ratio: 1 },
  { label: 'Carrusel 1:1', ratio: 1 },
  { label: 'Feed 4:5', ratio: 4 / 5 },
  { label: 'Video', ratio: 9 / 16 },
  { label: 'Publicación IG / Colaboración', ratio: 4 / 5 },
]

export const ratioOf = (format: string) => {
  const preset = FORMAT_PRESETS.find((p) => p.label.toLowerCase() === format.trim().toLowerCase())
  if (preset) return preset.ratio
  const m = format.match(/(\d+(?:\.\d+)?)\s*[:x]\s*(\d+(?:\.\d+)?)/)
  return m ? Number(m[1]) / Number(m[2]) : 1
}

const SEP = ' | '

export function parseVariants(raw: string | undefined): Variant[] {
  if (!raw) return []
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf('|')
      if (i < 0) return /^https?:\/\//.test(line) ? { format: '', url: line } : { format: line, url: '' }
      return { format: line.slice(0, i).trim(), url: line.slice(i + 1).trim() }
    })
}

export const serializeVariants = (list: Variant[]) =>
  list
    .filter((v) => v.format.trim() || v.url.trim())
    .map((v) => `${v.format.trim()}${SEP}${v.url.trim()}`)
    .join('\n')

/**
 * Variaciones para mostrar en la tarjeta. Si el anuncio todavía no tiene formatos pero su
 * “Creativo” es un link con vista previa, se muestra ese.
 */
export function adVariants(ad: { variants?: string; creative: string }): Variant[] {
  const list = parseVariants(ad.variants)
  if (list.length) return list
  const m = mediaFor(ad.creative)
  return m.kind === 'none' || m.kind === 'link' ? [] : [{ format: 'Creativo', url: ad.creative.trim() }]
}

/** Resumen corto para el historial: “Post 1:1, Story 9:16”. */
export const variantsSummary = (raw: string) =>
  parseVariants(raw)
    .map((v) => v.format || 'Sin formato')
    .join(', ')

// ---------- Vista previa ----------

export type Media =
  | { kind: 'drive'; id: string; thumb: string; embed: string; open: string }
  | { kind: 'drive-folder'; open: string }
  | { kind: 'instagram'; embed: string; open: string }
  | { kind: 'image'; src: string; open: string }
  | { kind: 'video'; src: string; open: string }
  | { kind: 'link'; open: string }
  | { kind: 'none' }

/** Saca el ID de un archivo de Drive de sus distintos formatos de link. */
export function driveFileId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([\w-]{10,})/,
    /drive\.google\.com\/(?:open|uc|thumbnail)\?(?:.*&)?id=([\w-]{10,})/,
    /docs\.google\.com\/(?:presentation|document|spreadsheets)\/d\/([\w-]{10,})/,
    /drive\.usercontent\.google\.com\/(?:download|u\/\d+\/uc)\?(?:.*&)?id=([\w-]{10,})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function mediaFor(raw: string): Media {
  const url = raw.trim()
  if (!/^https?:\/\//.test(url)) return { kind: 'none' }
  if (/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//.test(url)) return { kind: 'drive-folder', open: url }
  const id = driveFileId(url)
  if (id)
    return {
      kind: 'drive',
      id,
      // El thumbnail sirve para imágenes y videos, siempre que el archivo esté compartido con “cualquier persona con el enlace”.
      thumb: `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
      embed: `https://drive.google.com/file/d/${id}/preview`,
      open: url,
    }
  const ig = url.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/)
  if (ig) return { kind: 'instagram', embed: `https://www.instagram.com/${ig[1]}/${ig[2]}/embed/captioned/`, open: url }
  if (/\.(png|jpe?g|gif|webp|avif)(\?|#|$)/i.test(url)) return { kind: 'image', src: url, open: url }
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(url)) return { kind: 'video', src: url, open: url }
  return { kind: 'link', open: url }
}
