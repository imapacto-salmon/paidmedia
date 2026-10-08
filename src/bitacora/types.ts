export type PautaStatus = 'activo' | 'pausado' | 'desactivado' | 'por_lanzar'
export type TestStatus = 'sin_probar' | 'en_prueba' | 'ganador' | 'no_funciono'
/** Si los cambios de copy/link ya se subieron al administrador de anuncios. */
export type SyncStatus = 'al_dia' | 'pendiente'

export type Ad = {
  id: string
  platform: string
  campaign: string
  adSet: string
  name: string
  /** Link o nombre del creativo (imagen/video). */
  creative: string
  /** Variaciones por formato con su link (ver lib/media.ts), una por línea: “Post 1:1 | https://…”. */
  variants: string
  /** Copy y video actualizado (propuesta nueva). */
  copyUpdated: string
  /** Copy que está en pauta. */
  copy: string
  /** URL de destino o tipo de destino (Mensaje, Chatbot, Catálogo…). */
  link: string
  budget: string
  keyword: string
  /** AAAA-MM cuando se puede; si no, el texto tal cual. */
  launch: string
  preview: string
  status: PautaStatus
  test: TestStatus
  sync: SyncStatus
  notes: string
  order: number
  createdBy: string
  updatedAt: string
  updatedBy: string
}

/** Campos que se pueden editar y aparecen en el historial. */
export type AdField = Exclude<keyof Ad, 'id' | 'order' | 'createdBy' | 'updatedAt' | 'updatedBy'>

export type Change = { field: AdField; from: string; to: string }

export type HistoryAction = 'crear' | 'editar' | 'eliminar' | 'importar'

export type HistoryEntry = {
  at: string
  by: string
  team: string
  adId: string
  adName: string
  action: HistoryAction
  changes: Change[]
}

export type Who = { name: string; team: string }

export type Snapshot = { title: string; ads: Ad[]; history: HistoryEntry[] }

export type SaveResult = { ok: true; ad: Ad } | { ok: false; conflict: Ad | null }
