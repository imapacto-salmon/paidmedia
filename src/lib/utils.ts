import { getFormat, type FormatKind } from '../config/formats'
import type { Brief, CopyInfo, LinkItem, Piece, SelectedFormat } from '../types'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const emptyCopy = (): CopyInfo => ({
  mode: null,
  headline: '',
  support: '',
  cta: '',
  legals: '',
  ideas: '',
})

export const newLink = (): LinkItem => ({ id: uid(), label: '', url: '' })

export const newPiece = (n: number): Piece => ({
  id: uid(),
  name: `Pieza ${n}`,
  description: '',
  versions: 1,
  copy: emptyCopy(),
  internalNotes: '',
  images: [],
  links: [],
  formats: [],
})

export const newSelectedFormat = (formatId: string, kinds?: FormatKind[]): SelectedFormat => {
  const spec = getFormat(formatId)
  return {
    formatId,
    kinds: kinds ?? [spec?.kinds[0] ?? 'imagen'],
    duration: '15s',
    customDuration: '',
    subtitles: true,
    adType: spec?.videoAdTypes?.[0] ?? '',
  }
}

export const emptyBrief = (): Brief => ({
  requester: '',
  client: '',
  clientOther: '',
  campaign: '',
  objective: '',
  objectiveOther: '',
  neededBy: '',
  launchDate: '',
  priority: 'normal',
  platforms: [],
  context: '',
  links: [],
  pieces: [],
})

export const clientName = (b: Brief) => (b.client === 'Otro' ? b.clientOther.trim() || 'Otro' : b.client)
export const objectiveName = (b: Brief) =>
  b.objective === 'Otro' ? b.objectiveOther.trim() || 'Otro' : b.objective

export const todayISO = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const formatDate = (iso: string) => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const videoDuration = (sf: SelectedFormat) =>
  sf.duration === 'Otra' ? sf.customDuration.trim() || 'por definir' : sf.duration

/** Solo formatos cuya plataforma sigue activa (por si se desmarcó en el Paso 1). */
export const activeFormats = (piece: Piece, brief: Brief) =>
  piece.formats.filter((sf) => {
    const spec = getFormat(sf.formatId)
    return spec && brief.platforms.includes(spec.platform) && sf.kinds.length > 0
  })

export interface Counts {
  images: number
  videos: number
  carousels: number
  total: number
  /** Número de combinaciones formato × tipo. */
  formatSlots: number
}

export const pieceCounts = (piece: Piece, brief: Brief): Counts => {
  const c: Counts = { images: 0, videos: 0, carousels: 0, total: 0, formatSlots: 0 }
  for (const sf of activeFormats(piece, brief)) {
    for (const k of sf.kinds) {
      c.formatSlots++
      if (k === 'imagen') c.images += piece.versions
      if (k === 'video') c.videos += piece.versions
      if (k === 'carrusel') c.carousels += piece.versions
    }
  }
  c.total = c.images + c.videos + c.carousels
  return c
}

export const briefCounts = (brief: Brief): Counts =>
  brief.pieces.reduce<Counts>(
    (acc, p) => {
      const c = pieceCounts(p, brief)
      return {
        images: acc.images + c.images,
        videos: acc.videos + c.videos,
        carousels: acc.carousels + c.carousels,
        total: acc.total + c.total,
        formatSlots: acc.formatSlots + c.formatSlots,
      }
    },
    { images: 0, videos: 0, carousels: 0, total: 0, formatSlots: 0 },
  )

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export const countsText = (c: Counts) => {
  const parts: string[] = []
  if (c.images) parts.push(plural(c.images, 'imagen', 'imágenes'))
  if (c.videos) parts.push(plural(c.videos, 'video', 'videos'))
  if (c.carousels) parts.push(plural(c.carousels, 'carrusel', 'carruseles'))
  return parts.length ? parts.join(' + ') : '0 entregables'
}

/** "3 piezas × 2 versiones × 2 formatos = 12 imágenes + 3 videos" */
export const formulaText = (brief: Brief) => {
  const pieces = brief.pieces
  const total = briefCounts(brief)
  if (!pieces.length) return 'Aún no hay piezas'
  const versions = new Set(pieces.map((p) => p.versions))
  const slots = new Set(pieces.map((p) => pieceCounts(p, brief).formatSlots))
  const left = [plural(pieces.length, 'pieza', 'piezas')]
  left.push(versions.size === 1 ? plural(pieces[0].versions, 'versión', 'versiones') : 'versiones variables')
  if (slots.size === 1) left.push(plural([...slots][0], 'formato', 'formatos'))
  else left.push('formatos variables')
  return `${left.join(' × ')} = ${countsText(total)}`
}

export const pieceFormulaText = (piece: Piece, brief: Brief) => {
  const c = pieceCounts(piece, brief)
  return `${plural(piece.versions, 'versión', 'versiones')} × ${plural(c.formatSlots, 'formato', 'formatos')} = ${countsText(c)}`
}

export const versionLetters = (n: number) => 'ABCD'.slice(0, n).split('')

export const safeFilePart = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'y')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'SinNombre'

export const pdfFileName = (brief: Brief) =>
  `IS_Brief_${safeFilePart(clientName(brief))}_${safeFilePart(brief.campaign)}_${todayISO()}.pdf`

export interface Issue {
  level: 'error' | 'warning'
  message: string
  step: number
}

export const validate = (brief: Brief): Issue[] => {
  const issues: Issue[] = []
  if (!brief.requester) issues.push({ level: 'error', step: 0, message: 'Falta elegir al solicitante.' })
  if (!clientName(brief) || (brief.client === 'Otro' && !brief.clientOther.trim()))
    issues.push({ level: 'error', step: 0, message: 'Falta el cliente.' })
  if (!brief.campaign.trim()) issues.push({ level: 'error', step: 0, message: 'Falta el nombre de la campaña.' })
  if (!brief.platforms.length) issues.push({ level: 'error', step: 0, message: 'Elige al menos una plataforma.' })
  if (!brief.neededBy) issues.push({ level: 'warning', step: 0, message: 'No indicaste la fecha en que se necesitan los artes.' })
  if (!brief.objective) issues.push({ level: 'warning', step: 0, message: 'No indicaste el objetivo de la campaña.' })
  if (!brief.pieces.length) issues.push({ level: 'error', step: 1, message: 'Agrega al menos una pieza.' })
  brief.pieces.forEach((p, i) => {
    const name = p.name.trim() || `Pieza ${i + 1}`
    if (!activeFormats(p, brief).length)
      issues.push({ level: 'error', step: 2, message: `“${name}” no tiene ningún formato seleccionado.` })
    if (!p.copy.mode)
      issues.push({ level: 'warning', step: 1, message: `“${name}” no tiene copy ni estado de copy.` })
    else if (p.copy.mode === 'listo' && !p.copy.headline.trim() && !p.copy.support.trim())
      issues.push({ level: 'warning', step: 1, message: `“${name}” dice “Ya tengo copy” pero el titular y el texto están vacíos.` })
    if (!p.description.trim())
      issues.push({ level: 'warning', step: 1, message: `“${name}” no tiene descripción de la promoción/mensaje.` })
  })
  return issues
}

export const normalizeUrl = (url: string) => {
  const u = url.trim()
  if (!u) return ''
  return /^https?:\/\//i.test(u) ? u : `https://${u}`
}

export const filledLinks = (links: LinkItem[]) => links.filter((l) => l.url.trim())
