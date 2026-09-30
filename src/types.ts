import type { FormatKind, PlatformId } from './config/formats'
import type { PriorityId } from './config/lists'

export interface LinkItem {
  id: string
  label: string
  url: string
}

export interface InspirationImage {
  id: string
  name: string
  /** JPG comprimido como data URL. */
  dataUrl: string
  width: number
  height: number
}

export type CopyMode = 'listo' | 'equipo' | 'pendiente' | null

export interface CopyInfo {
  mode: CopyMode
  headline: string
  support: string
  cta: string
  legals: string
  /** Ideas / tono cuando lo propone el equipo. */
  ideas: string
}

export interface SelectedFormat {
  formatId: string
  kinds: FormatKind[]
  /** Solo si incluye video. */
  duration: string
  customDuration: string
  subtitles: boolean
  adType: string
}

export interface Piece {
  id: string
  name: string
  description: string
  versions: number
  copy: CopyInfo
  internalNotes: string
  images: InspirationImage[]
  links: LinkItem[]
  formats: SelectedFormat[]
}

export interface Brief {
  requester: string
  client: string
  clientOther: string
  campaign: string
  objective: string
  objectiveOther: string
  neededBy: string
  launchDate: string
  priority: PriorityId
  platforms: PlatformId[]
  context: string
  links: LinkItem[]
  pieces: Piece[]
}
