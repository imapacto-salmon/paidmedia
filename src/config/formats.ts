// ─────────────────────────────────────────────────────────────
// Especificaciones de plataformas, formatos y presets.
// Este archivo es solo datos: edítalo para agregar, quitar o
// corregir formatos sin tocar el resto del código.
// ─────────────────────────────────────────────────────────────

export type PlatformId = 'meta' | 'google' | 'tiktok' | 'chatgpt'

/** Tipo de entregable. */
export type FormatKind = 'imagen' | 'video' | 'carrusel'

export interface Platform {
  id: PlatformId
  name: string
  /** Color de marca para chips y miniaturas. */
  color: string
}

export interface FormatSpec {
  /** Identificador único y estable (se guarda en los borradores; no cambiarlo). */
  id: string
  platform: PlatformId
  /** Subgrupo dentro de la plataforma (ej. "Performance Max", "YouTube"). */
  group?: string
  /** Ubicación / placement. */
  placement: string
  /** Relación de aspecto como texto, ej. "9:16". */
  ratio: string
  width: number
  height: number
  /** Tipos de entregable que admite este formato. */
  kinds: FormatKind[]
  /** Extensiones de archivo permitidas. */
  files: string[]
  /** Silueta en la que se dibuja: teléfono o rectángulo (display). */
  frame: 'phone' | 'display'
  /** Tipos de anuncio de video disponibles (ej. YouTube). */
  videoAdTypes?: string[]
  notes?: string
}

export const PLATFORMS: Platform[] = [
  { id: 'meta', name: 'Meta Ads', color: '#0866FF' },
  { id: 'google', name: 'Google Ads', color: '#EA4335' },
  { id: 'tiktok', name: 'TikTok Ads', color: '#111111' },
  { id: 'chatgpt', name: 'ChatGPT Ads', color: '#10A37F' },
]

const IMG = ['JPG', 'PNG']
const VID = ['MP4', 'MOV']
const YOUTUBE_AD_TYPES = ['Skippable', 'Non-skippable', 'Bumper (6s)', 'Masthead']

export const FORMATS: FormatSpec[] = [
  // ── Meta Ads ────────────────────────────────────────────────
  {
    id: 'meta-feed-1x1',
    platform: 'meta',
    placement: 'Feed cuadrado',
    ratio: '1:1',
    width: 1080,
    height: 1080,
    kinds: ['imagen', 'video', 'carrusel'],
    files: [...IMG, ...VID],
    frame: 'phone',
    notes: 'Carrusel: 2 a 10 tarjetas, todas en 1:1.',
  },
  {
    id: 'meta-feed-4x5',
    platform: 'meta',
    placement: 'Feed vertical',
    ratio: '4:5',
    width: 1080,
    height: 1350,
    kinds: ['imagen', 'video', 'carrusel'],
    files: [...IMG, ...VID],
    frame: 'phone',
    notes: 'Formato recomendado para feed móvil.',
  },
  {
    id: 'meta-stories-9x16',
    platform: 'meta',
    placement: 'Stories / Reels',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    kinds: ['imagen', 'video'],
    files: [...IMG, ...VID],
    frame: 'phone',
    notes: 'Dejar ~14% libre arriba y ~20% abajo (zona segura de la interfaz).',
  },
  {
    id: 'meta-link-191x1',
    platform: 'meta',
    placement: 'Link / Marketplace',
    ratio: '1.91:1',
    width: 1200,
    height: 628,
    kinds: ['imagen'],
    files: IMG,
    frame: 'phone',
  },

  // ── Google Ads – Performance Max ────────────────────────────
  {
    id: 'pmax-horizontal',
    platform: 'google',
    group: 'Performance Max',
    placement: 'Imagen horizontal',
    ratio: '1.91:1',
    width: 1200,
    height: 628,
    kinds: ['imagen'],
    files: IMG,
    frame: 'display',
    notes: 'Máx. 5 MB. Evitar texto superpuesto excesivo.',
  },
  {
    id: 'pmax-cuadrada',
    platform: 'google',
    group: 'Performance Max',
    placement: 'Imagen cuadrada',
    ratio: '1:1',
    width: 1200,
    height: 1200,
    kinds: ['imagen'],
    files: IMG,
    frame: 'display',
  },
  {
    id: 'pmax-vertical',
    platform: 'google',
    group: 'Performance Max',
    placement: 'Imagen vertical',
    ratio: '4:5',
    width: 960,
    height: 1200,
    kinds: ['imagen'],
    files: IMG,
    frame: 'display',
  },
  {
    id: 'pmax-logo-1x1',
    platform: 'google',
    group: 'Performance Max',
    placement: 'Logo cuadrado',
    ratio: '1:1',
    width: 1200,
    height: 1200,
    kinds: ['imagen'],
    files: IMG,
    frame: 'display',
    notes: 'Fondo transparente o blanco.',
  },
  {
    id: 'pmax-logo-4x1',
    platform: 'google',
    group: 'Performance Max',
    placement: 'Logo horizontal',
    ratio: '4:1',
    width: 1200,
    height: 300,
    kinds: ['imagen'],
    files: IMG,
    frame: 'display',
  },

  // ── Google Ads – YouTube ────────────────────────────────────
  {
    id: 'yt-16x9',
    platform: 'google',
    group: 'YouTube',
    placement: 'In-stream horizontal',
    ratio: '16:9',
    width: 1920,
    height: 1080,
    kinds: ['video'],
    files: VID,
    frame: 'display',
    videoAdTypes: YOUTUBE_AD_TYPES,
    notes: 'Bumper = 6s máx. Non-skippable = 15s máx.',
  },
  {
    id: 'yt-shorts-9x16',
    platform: 'google',
    group: 'YouTube',
    placement: 'Shorts',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    kinds: ['video'],
    files: VID,
    frame: 'phone',
    videoAdTypes: YOUTUBE_AD_TYPES,
  },
  {
    id: 'yt-1x1',
    platform: 'google',
    group: 'YouTube',
    placement: 'Cuadrado',
    ratio: '1:1',
    width: 1080,
    height: 1080,
    kinds: ['video'],
    files: VID,
    frame: 'phone',
    videoAdTypes: YOUTUBE_AD_TYPES,
  },
  {
    id: 'yt-infeed-4x3',
    platform: 'google',
    group: 'YouTube',
    placement: 'In-feed',
    ratio: '4:3',
    width: 1440,
    height: 1080,
    kinds: ['video'],
    files: VID,
    frame: 'display',
    videoAdTypes: YOUTUBE_AD_TYPES,
  },
  {
    id: 'yt-infeed-2x3',
    platform: 'google',
    group: 'YouTube',
    placement: 'In-feed vertical',
    ratio: '2:3',
    width: 1080,
    height: 1620,
    kinds: ['video'],
    files: VID,
    frame: 'phone',
    videoAdTypes: YOUTUBE_AD_TYPES,
  },

  // ── TikTok Ads ──────────────────────────────────────────────
  {
    id: 'tiktok-9x16',
    platform: 'tiktok',
    placement: 'In-Feed (principal)',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    kinds: ['video', 'imagen'],
    files: [...VID, ...IMG],
    frame: 'phone',
    notes: 'Formato principal. Zona segura: evitar texto en los 150 px inferiores y laterales.',
  },
  {
    id: 'tiktok-1x1',
    platform: 'tiktok',
    placement: 'In-Feed (opcional)',
    ratio: '1:1',
    width: 1080,
    height: 1080,
    kinds: ['video', 'imagen'],
    files: [...VID, ...IMG],
    frame: 'phone',
  },
  {
    id: 'tiktok-16x9',
    platform: 'tiktok',
    placement: 'In-Feed (opcional)',
    ratio: '16:9',
    width: 1920,
    height: 1080,
    kinds: ['video'],
    files: VID,
    frame: 'phone',
  },

  // ── ChatGPT Ads ─────────────────────────────────────────────
  // TODO: confirmar especificaciones de ChatGPT Ads (medidas, tipos y archivos).
  {
    id: 'chatgpt-placeholder',
    platform: 'chatgpt',
    placement: 'Formato por confirmar',
    ratio: '1:1',
    width: 1080,
    height: 1080,
    kinds: ['imagen'],
    files: IMG,
    frame: 'display',
    notes: 'Especificaciones pendientes de confirmar.',
  },
]

export interface PresetItem {
  formatId: string
  kinds: FormatKind[]
}

export interface Preset {
  id: string
  platform: PlatformId
  label: string
  items: PresetItem[]
}

/** Presets de un clic. Se suman a la selección actual de la pieza. */
export const PRESETS: Preset[] = [
  {
    id: 'meta-basico',
    platform: 'meta',
    label: 'Meta básico (1:1 + 9:16)',
    items: [
      { formatId: 'meta-feed-1x1', kinds: ['imagen'] },
      { formatId: 'meta-stories-9x16', kinds: ['imagen'] },
    ],
  },
  {
    id: 'meta-completo',
    platform: 'meta',
    label: 'Meta completo (1:1 + 4:5 + 9:16)',
    items: [
      { formatId: 'meta-feed-1x1', kinds: ['imagen'] },
      { formatId: 'meta-feed-4x5', kinds: ['imagen'] },
      { formatId: 'meta-stories-9x16', kinds: ['imagen'] },
    ],
  },
  {
    id: 'meta-video',
    platform: 'meta',
    label: 'Meta video (4:5 + 9:16)',
    items: [
      { formatId: 'meta-feed-4x5', kinds: ['video'] },
      { formatId: 'meta-stories-9x16', kinds: ['video'] },
    ],
  },
  {
    id: 'pmax-completo',
    platform: 'google',
    label: 'Performance Max completo',
    items: [
      { formatId: 'pmax-horizontal', kinds: ['imagen'] },
      { formatId: 'pmax-cuadrada', kinds: ['imagen'] },
      { formatId: 'pmax-vertical', kinds: ['imagen'] },
      { formatId: 'pmax-logo-1x1', kinds: ['imagen'] },
      { formatId: 'pmax-logo-4x1', kinds: ['imagen'] },
    ],
  },
  {
    id: 'youtube-basico',
    platform: 'google',
    label: 'YouTube (16:9 + Shorts)',
    items: [
      { formatId: 'yt-16x9', kinds: ['video'] },
      { formatId: 'yt-shorts-9x16', kinds: ['video'] },
    ],
  },
  {
    id: 'tiktok-basico',
    platform: 'tiktok',
    label: 'TikTok básico (9:16 video)',
    items: [{ formatId: 'tiktok-9x16', kinds: ['video'] }],
  },
]

export const KIND_LABELS: Record<FormatKind, string> = {
  imagen: 'Imagen',
  video: 'Video',
  carrusel: 'Carrusel',
}

export const getFormat = (id: string) => FORMATS.find((f) => f.id === id)
export const getPlatform = (id: PlatformId) => PLATFORMS.find((p) => p.id === id)!
