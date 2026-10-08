import { CONTENT_FIELDS, FIELD_LABELS, labelOf, PAUTA_STATUS, TEST_STATUS } from '../config'
import type { Ad, AdField, Change, PautaStatus } from '../types'
import { variantsSummary } from './media'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const newAd = (patch: Partial<Ad> = {}): Ad => ({
  id: uid(),
  platform: 'Meta',
  campaign: '',
  adSet: '',
  name: '',
  creative: '',
  variants: '',
  copyUpdated: '',
  copy: '',
  link: '',
  budget: '',
  keyword: '',
  launch: '',
  preview: '',
  status: 'por_lanzar',
  test: 'sin_probar',
  sync: 'al_dia',
  notes: '',
  order: Date.now(),
  createdBy: '',
  updatedAt: '',
  updatedBy: '',
  ...patch,
})

const EDITABLE = Object.keys(FIELD_LABELS) as AdField[]

export function diff(before: Ad | null, after: Ad): Change[] {
  return EDITABLE.filter((f) => (before?.[f] ?? '') !== after[f]).map((f) => ({
    field: f,
    from: String(before?.[f] ?? ''),
    to: String(after[f]),
  }))
}

export const touchesContent = (changes: Change[]) => changes.some((c) => CONTENT_FIELDS.includes(c.field))

/** Texto corto de un cambio para el historial. */
export function changeText(c: Change) {
  const label = FIELD_LABELS[c.field]
  if (c.field === 'launch') return `${label}: ${monthLabel(c.from) || '—'} → ${monthLabel(c.to) || '—'}`
  if (c.field === 'variants') {
    const [a, b] = [variantsSummary(c.from), variantsSummary(c.to)]
    return a === b ? `${label}: cambió algún link (${b})` : `${label}: ${a || '—'} → ${b || '—'}`
  }
  const short = (s: string) => {
    const v = labelOf(c.field, s).replace(/\s+/g, ' ').trim()
    return v ? (v.length > 60 ? `${v.slice(0, 60)}…` : v) : '—'
  }
  return `${label}: ${short(c.from)} → ${short(c.to)}`
}

// ---------- Fechas ----------

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** "Junio 2025" → "2025-06". Si no se reconoce, regresa el texto tal cual. */
export function parseMonth(raw: string) {
  const s = raw.trim()
  if (/^\d{4}-\d{2}$/.test(s)) return s
  const m = s.toLowerCase().match(/^([a-záéíóú]+)\.?\s*(?:de\s+)?(\d{4})$/)
  if (m) {
    const i = MONTHS.findIndex((name) => name.startsWith(m[1].slice(0, 3)))
    if (i >= 0) return `${m[2]}-${String(i + 1).padStart(2, '0')}`
  }
  return s
}

export function monthLabel(v: string) {
  const m = v.match(/^(\d{4})-(\d{2})$/)
  if (!m) return v
  const name = MONTHS[Number(m[2]) - 1] ?? ''
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${m[1]}`
}

// ---------- Importar desde Excel / Google Sheets ----------

/** Lee texto copiado de una hoja (TSV con celdas entre comillas que pueden tener saltos de línea). */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let i = 0
  const src = text.replace(/\r\n?/g, '\n')
  while (i < src.length) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        quoted = false
      } else cell += ch
    } else if (ch === '"' && cell === '') quoted = true
    else if (ch === '\t') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
    i++
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/** Encabezados reconocidos (en orden de prioridad: el primero que coincide gana). */
const HEADER_RULES: [AdField, (h: string) => boolean][] = [
  ['copyUpdated', (h) => h.startsWith('copy') && h.includes('actualizado')],
  ['copy', (h) => h.startsWith('copy')],
  ['platform', (h) => h.startsWith('plataforma')],
  ['campaign', (h) => h.startsWith('campana')],
  ['adSet', (h) => h.startsWith('conjunto')],
  ['name', (h) => h === 'anuncio' || h === 'nombre del anuncio'],
  ['creative', (h) => h.startsWith('creativo')],
  ['variants', (h) => h.startsWith('formatos') || h.startsWith('variaciones')],
  ['link', (h) => h === 'link' || h.startsWith('url') || h.startsWith('destino')],
  ['budget', (h) => h.startsWith('presupuesto')],
  ['keyword', (h) => h.startsWith('keyword')],
  ['launch', (h) => h.startsWith('fecha')],
  ['preview', (h) => h.startsWith('ver anuncio') || h.startsWith('preview')],
  ['status', (h) => h.startsWith('estatus en pauta') || h === 'estatus'],
  ['test', (h) => h.includes('prueba')],
  ['notes', (h) => h.startsWith('notas') || h.startsWith('comentarios')],
]

/** Orden de columnas de la plantilla de pauta (la primera columna va vacía). */
const DEFAULT_ORDER: (AdField | null)[] = [
  null, 'campaign', 'adSet', 'name', 'creative', 'copyUpdated', 'copy', 'link', 'budget', 'keyword', 'launch', 'preview',
]

const EMPTY = new Set(['na', 'n/a', '-', '—'])

const matchStatus = (raw: string): PautaStatus | null => {
  const n = norm(raw)
  return PAUTA_STATUS.find((o) => norm(o.label) === n || o.value === n)?.value ?? null
}

export type ImportResult = { ads: Ad[]; columns: (AdField | null)[]; headerFound: boolean }

/**
 * Convierte filas de la hoja en anuncios.
 * - Si la campaña o el conjunto vienen vacíos, se toman de la fila de arriba (celdas combinadas).
 * - "NA" se toma como vacío.
 * - Un link "DESACTIVADO" marca el anuncio como desactivado.
 */
export function rowsToAds(rows: string[][], who: string): ImportResult {
  const headerIdx = rows.findIndex((r) => r.some((c) => norm(c) === 'anuncio'))
  let columns: (AdField | null)[] = DEFAULT_ORDER
  if (headerIdx >= 0) {
    const used = new Set<AdField>()
    columns = rows[headerIdx].map((h) => {
      const n = norm(h)
      const hit = n ? HEADER_RULES.find(([f, test]) => !used.has(f) && test(n)) : undefined
      if (hit) used.add(hit[0])
      return hit?.[0] ?? null
    })
  }
  const body = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows
  const base = Date.now()
  let campaign = ''
  let adSet = ''
  const ads: Ad[] = []
  body.forEach((r, i) => {
    const get = (f: AdField) => {
      const idx = columns.indexOf(f)
      const v = idx >= 0 ? (r[idx] ?? '').trim() : ''
      return EMPTY.has(v.toLowerCase()) ? '' : v
    }
    if (get('campaign')) {
      campaign = get('campaign')
      adSet = ''
    }
    if (get('adSet')) adSet = get('adSet')
    const name = get('name')
    if (!name) return
    let link = get('link')
    let status: PautaStatus = matchStatus(get('status')) ?? 'activo'
    if (norm(link) === 'desactivado') {
      link = ''
      status = 'desactivado'
    }
    const test = TEST_STATUS.find((o) => norm(o.label) === norm(get('test')))?.value ?? 'sin_probar'
    ads.push(
      newAd({
        platform: get('platform') || 'Meta',
        campaign,
        adSet,
        name: name.replace(/\s+/g, ' '),
        creative: get('creative'),
        variants: get('variants'),
        copyUpdated: get('copyUpdated'),
        copy: get('copy'),
        link,
        budget: get('budget'),
        keyword: get('keyword'),
        launch: parseMonth(get('launch')),
        preview: get('preview'),
        status,
        test,
        notes: get('notes'),
        order: base + i,
        createdBy: who,
      }),
    )
  })
  return { ads, columns, headerFound: headerIdx >= 0 }
}

// ---------- Exportar ----------

const EXPORT_FIELDS: AdField[] = [
  'platform', 'campaign', 'adSet', 'name', 'status', 'test', 'sync', 'creative', 'variants', 'copyUpdated', 'copy', 'link', 'budget',
  'keyword', 'launch', 'preview', 'notes',
]

export function toCsv(ads: Ad[]) {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const head = [...EXPORT_FIELDS.map((f) => FIELD_LABELS[f]), 'Última edición', 'Editado por']
  const lines = ads.map((a) =>
    [
      ...EXPORT_FIELDS.map((f) => (f === 'launch' ? monthLabel(a.launch) : labelOf(f, String(a[f])))),
      a.updatedAt ? new Date(a.updatedAt).toLocaleString('es-MX') : '',
      a.updatedBy,
    ]
      .map(esc)
      .join(','),
  )
  return '﻿' + [head.map(esc).join(','), ...lines].join('\n')
}

export function download(name: string, content: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Ordena por campaña → conjunto → orden, respetando el orden en que aparece cada grupo. */
export function groupAds(ads: Ad[]) {
  const sorted = [...ads].sort((a, b) => a.order - b.order)
  const campaigns = new Map<string, Map<string, Ad[]>>()
  for (const ad of sorted) {
    const c = campaigns.get(ad.campaign) ?? new Map<string, Ad[]>()
    campaigns.set(ad.campaign, c)
    const s = c.get(ad.adSet) ?? []
    c.set(ad.adSet, s)
    s.push(ad)
  }
  return campaigns
}
