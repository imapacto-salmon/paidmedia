import type { Ad, HistoryEntry, SaveResult, Snapshot } from '../types'

/**
 * Dónde viven los datos:
 * - remote: una Google Sheet con el script de `apps-script/Code.gs` publicado como app web.
 *   Todos los que abren el link ven y editan la misma información.
 * - local: solo en este navegador (para probar o si aún no se conecta la hoja).
 */
export interface Backend {
  kind: 'remote' | 'local'
  load(): Promise<Snapshot>
  /** `base` es el `updatedAt` que tenía el anuncio al empezar a editarlo (para detectar choques). */
  save(ad: Ad, base: string | undefined, entry: HistoryEntry): Promise<SaveResult>
  remove(id: string, entry: HistoryEntry): Promise<void>
  bulk(ads: Ad[], entry: HistoryEntry): Promise<Ad[]>
}

export type Connection = { url: string; key: string }

const CONN_KEY = 'bitacora:connection:v1'

export function readConnection(): Connection | null {
  try {
    // Un link compartido trae la conexión en el hash: #api=<url>&k=<clave>
    const hash = new URLSearchParams(location.hash.slice(1))
    const api = hash.get('api')
    if (api) {
      const conn = { url: api, key: hash.get('k') ?? '' }
      writeConnection(conn)
      history.replaceState(null, '', location.pathname + location.search)
      return conn
    }
    const raw = localStorage.getItem(CONN_KEY)
    return raw ? (JSON.parse(raw) as Connection) : null
  } catch {
    return null
  }
}

export function writeConnection(conn: Connection | null) {
  try {
    if (conn) localStorage.setItem(CONN_KEY, JSON.stringify(conn))
    else localStorage.removeItem(CONN_KEY)
  } catch {
    /* sin almacenamiento: la conexión dura solo esta visita */
  }
}

export const shareLink = (conn: Connection) =>
  `${location.origin}${location.pathname}#api=${encodeURIComponent(conn.url)}${conn.key ? `&k=${encodeURIComponent(conn.key)}` : ''}`

// ---------- Google Sheets (Apps Script) ----------

export function remoteBackend(conn: Connection): Backend {
  // Apps Script no acepta peticiones con preflight, por eso se manda text/plain.
  const call = async <T>(body: Record<string, unknown>): Promise<T> => {
    const res = await fetch(conn.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...body, key: conn.key }),
    })
    if (!res.ok) throw new Error(`La hoja respondió ${res.status}`)
    let data: { ok: boolean; error?: string } & T
    try {
      data = await res.json()
    } catch {
      throw new Error('La hoja no respondió con datos. Revisa que el script esté publicado para “Cualquier persona”.')
    }
    if (!data.ok && data.error) throw new Error(data.error)
    return data
  }
  return {
    kind: 'remote',
    load: () => call<Snapshot>({ action: 'list' }),
    async save(ad, base, entry) {
      const r = await call<{ ok: boolean; ad?: Ad; conflict?: Ad | null }>({ action: 'save', ad, base: base ?? null, entry })
      return r.ok && r.ad ? { ok: true, ad: r.ad } : { ok: false, conflict: r.conflict ?? null }
    },
    async remove(id, entry) {
      await call({ action: 'delete', id, entry })
    },
    async bulk(ads, entry) {
      return (await call<{ ads: Ad[] }>({ action: 'bulk', ads, entry })).ads
    },
  }
}

// ---------- Solo en este navegador ----------

const LOCAL_KEY = 'bitacora:local:v1'

export function localBackend(): Backend {
  const read = (): Snapshot => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      if (raw) return JSON.parse(raw) as Snapshot
    } catch {
      /* vacío */
    }
    return { title: '', ads: [], history: [] }
  }
  const write = (s: Snapshot) => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(s))
    } catch {
      throw new Error('No se pudo guardar en este navegador (almacenamiento lleno o bloqueado).')
    }
  }
  const stamp = (ad: Ad, by: string): Ad => ({ ...ad, updatedAt: new Date().toISOString(), updatedBy: by })
  return {
    kind: 'local',
    load: async () => read(),
    async save(ad, base, entry) {
      const s = read()
      const current = s.ads.find((a) => a.id === ad.id)
      if (current && base !== undefined && current.updatedAt !== base) return { ok: false, conflict: current }
      const saved = stamp(ad, entry.by)
      s.ads = current ? s.ads.map((a) => (a.id === ad.id ? saved : a)) : [...s.ads, saved]
      s.history = [{ ...entry, at: saved.updatedAt }, ...s.history]
      write(s)
      return { ok: true, ad: saved }
    },
    async remove(id, entry) {
      const s = read()
      s.ads = s.ads.filter((a) => a.id !== id)
      s.history = [{ ...entry, at: new Date().toISOString() }, ...s.history]
      write(s)
    },
    async bulk(ads, entry) {
      const s = read()
      const saved = ads.map((a) => stamp(a, entry.by))
      s.ads = [...s.ads, ...saved]
      s.history = [{ ...entry, at: new Date().toISOString() }, ...s.history]
      write(s)
      return saved
    },
  }
}
