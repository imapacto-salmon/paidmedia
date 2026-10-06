import type { AdField, PautaStatus, SyncStatus, TestStatus } from './types'

/** Equipo de la agencia. El otro equipo es el cliente (su nombre sale del título de la hoja). */
export const AGENCY = 'Impacto Salmón'

export const PLATFORMS = ['Meta', 'Google', 'TikTok', 'ChatGPT']

export const PAUTA_STATUS: { value: PautaStatus; label: string; cls: string; dot: string }[] = [
  { value: 'activo', label: 'Activo', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'por_lanzar', label: 'Por lanzar', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  { value: 'pausado', label: 'Pausado', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { value: 'desactivado', label: 'Desactivado', cls: 'bg-stone-100 text-stone-500 border-stone-200', dot: 'bg-stone-400' },
]

export const TEST_STATUS: { value: TestStatus; label: string; cls: string; dot: string }[] = [
  { value: 'sin_probar', label: 'Sin probar', cls: 'bg-stone-100 text-stone-600 border-stone-200', dot: 'bg-stone-400' },
  { value: 'en_prueba', label: 'En prueba', cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  { value: 'ganador', label: 'Probado · funciona', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'no_funciono', label: 'Probado · no funcionó', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
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
