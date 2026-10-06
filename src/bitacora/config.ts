import type { AdField, PautaStatus, SyncStatus, TestStatus } from './types'

/** Equipo de la agencia. El otro equipo es el cliente (su nombre sale del título de la hoja). */
export const AGENCY = 'Impacto Salmón'

/** Cliente que se muestra mientras no hay una hoja conectada. */
export const DEFAULT_CLIENT = 'Rhino Performance'

/** Logo de cada cliente (en /public/logos, en blanco sobre transparente). La llave es el nombre en minúsculas. */
export const CLIENT_LOGOS: Record<string, string> = {
  'rhino performance': 'logos/rhino-performance.png',
}

export const clientLogo = (client: string) => CLIENT_LOGOS[client.trim().toLowerCase()]

export const PLATFORMS = ['Meta', 'Google', 'TikTok', 'ChatGPT']

// Etiquetas en escala de grises (en la Bitácora `stone` está invertida: stone-900 es casi blanco).
// Lo que está “prendido” (Activo, Probado · funciona) va en blanco; el punto da la lectura rápida.
const ON = 'bg-stone-900 text-stone-50 border-stone-900'
const OUTLINE = 'bg-stone-100 text-stone-800 border-stone-400'
const QUIET = 'bg-stone-100 text-stone-600 border-stone-200'
const OFF = 'bg-transparent text-stone-500 border-stone-200'

export const PAUTA_STATUS: { value: PautaStatus; label: string; cls: string; dot: string }[] = [
  { value: 'activo', label: 'Activo', cls: ON, dot: 'bg-emerald-500' },
  { value: 'por_lanzar', label: 'Por lanzar', cls: OUTLINE, dot: 'bg-stone-700' },
  { value: 'pausado', label: 'Pausado', cls: QUIET, dot: 'bg-amber-500' },
  { value: 'desactivado', label: 'Desactivado', cls: OFF, dot: 'bg-stone-400' },
]

export const TEST_STATUS: { value: TestStatus; label: string; cls: string; dot: string }[] = [
  { value: 'sin_probar', label: 'Sin probar', cls: OFF, dot: 'bg-stone-400' },
  { value: 'en_prueba', label: 'En prueba', cls: OUTLINE, dot: 'bg-stone-700' },
  { value: 'ganador', label: 'Probado · funciona', cls: ON, dot: 'bg-emerald-500' },
  { value: 'no_funciono', label: 'Probado · no funcionó', cls: QUIET, dot: 'bg-rose-500' },
]

export const SYNC_STATUS: { value: SyncStatus; label: string }[] = [
  { value: 'al_dia', label: 'Ya está en pauta' },
  { value: 'pendiente', label: 'Pendiente de subir' },
]

/** Si cambia alguno de estos campos, el anuncio queda “pendiente de subir” a la plataforma. */
export const CONTENT_FIELDS: AdField[] = ['copyUpdated', 'copy', 'link', 'keyword', 'creative']

export const FIELD_LABELS: Record<AdField, string> = {
  platform: 'Plataforma',
  campaign: 'Campaña',
  adSet: 'Conjunto de anuncios',
  name: 'Anuncio',
  creative: 'Creativo',
  copyUpdated: 'Copy y video actualizado',
  copy: 'Copy en pauta',
  link: 'Link',
  budget: 'Presupuesto',
  keyword: 'Keyword (chatbot)',
  launch: 'Fecha de lanzamiento',
  preview: 'Ver anuncio',
  status: 'Estatus en pauta',
  test: 'Estatus de prueba',
  sync: 'Cambios',
  notes: 'Notas',
}

export const labelOf = (field: AdField, value: string) => {
  const list = field === 'status' ? PAUTA_STATUS : field === 'test' ? TEST_STATUS : field === 'sync' ? SYNC_STATUS : null
  return list?.find((o) => o.value === value)?.label ?? value
}
