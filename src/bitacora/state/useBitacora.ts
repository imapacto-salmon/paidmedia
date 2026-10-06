import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { localBackend, readConnection, remoteBackend, writeConnection, type Connection } from '../lib/api'
import { diff, touchesContent } from '../lib/ads'
import type { Ad, HistoryAction, HistoryEntry, SaveResult, Snapshot, Who } from '../types'

const WHO_KEY = 'bitacora:who:v1'
const POLL_MS = 45_000

export function readWho(): Who | null {
  try {
    const raw = localStorage.getItem(WHO_KEY)
    return raw ? (JSON.parse(raw) as Who) : null
  } catch {
    return null
  }
}

export function writeWho(who: Who) {
  try {
    localStorage.setItem(WHO_KEY, JSON.stringify(who))
  } catch {
    /* sin almacenamiento */
  }
}

export function useBitacora(who: Who | null) {
  const [conn, setConn] = useState<Connection | null>(() => readConnection())
  const backend = useMemo(() => (conn ? remoteBackend(conn) : localBackend()), [conn])
  const [data, setData] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncedAt, setSyncedAt] = useState<Date | null>(null)
  const busy = useRef(0)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const snap = await backend.load()
      // Si hay un guardado en curso, no se pisa el cambio optimista.
      if (busy.current === 0) setData(snap)
      setError('')
      setSyncedAt(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la bitácora.')
    } finally {
      setLoading(false)
    }
  }, [backend])

  useEffect(() => {
    setData(null)
    refresh()
  }, [refresh])

  // Se actualiza sola cada cierto tiempo y al regresar a la pestaña.
  useEffect(() => {
    if (backend.kind !== 'remote') return
    const tick = () => document.visibilityState === 'visible' && refresh()
    const t = setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [backend, refresh])

  const entry = (ad: Ad, action: HistoryAction, changes: HistoryEntry['changes']): HistoryEntry => ({
    at: new Date().toISOString(),
    by: who?.name ?? 'Sin nombre',
    team: who?.team ?? '',
    adId: ad.id,
    adName: ad.name,
    action,
    changes,
  })

  const track = async <T>(fn: () => Promise<T>) => {
    busy.current++
    try {
      return await fn()
    } finally {
      busy.current--
    }
  }

  /**
   * Guarda un anuncio. `before` es la versión con la que se empezó a editar
   * (null si es nuevo). Si cambió copy/link/keyword y nadie tocó “Cambios”, queda pendiente de subir.
   */
  const save = useCallback(
    async (next: Ad, before: Ad | null): Promise<SaveResult | { ok: 'same' }> => {
      let ad = next
      const pre = diff(before, ad)
      if (before && touchesContent(pre) && !pre.some((c) => c.field === 'sync')) ad = { ...ad, sync: 'pendiente' }
      const changes = diff(before, ad)
      if (before && !changes.length) return { ok: 'same' }
      const prev = data
      setData((d) => d && { ...d, ads: before ? d.ads.map((a) => (a.id === ad.id ? ad : a)) : [...d.ads, ad] })
      try {
        const e = entry(ad, before ? 'editar' : 'crear', changes)
        const res = await track(() => backend.save(ad, before?.updatedAt, e))
        if (res.ok) {
          setData(
            (d) =>
              d && {
                ...d,
                ads: d.ads.map((a) => (a.id === ad.id ? res.ad : a)),
                history: [{ ...e, at: res.ad.updatedAt }, ...d.history],
              },
          )
        } else {
          setData(prev)
          await refresh()
        }
        return res
      } catch (e) {
        setData(prev)
        throw e
      }
    },
    [backend, data, who],
  )

  const remove = useCallback(
    async (ad: Ad) => {
      const prev = data
      const e = entry(ad, 'eliminar', [])
      setData((d) => d && { ...d, ads: d.ads.filter((a) => a.id !== ad.id), history: [e, ...d.history] })
      try {
        await track(() => backend.remove(ad.id, e))
      } catch (e) {
        setData(prev)
        throw e
      }
    },
    [backend, data, who],
  )

  const bulk = useCallback(
    async (ads: Ad[]) => {
      const e: HistoryEntry = {
        ...entry(ads[0], 'importar', []),
        adId: '',
        adName: `${ads.length} anuncios importados`,
      }
      const saved = await track(() => backend.bulk(ads, e))
      setData((d) => d && { ...d, ads: [...d.ads, ...saved] })
      await refresh()
    },
    [backend, who],
  )

  const connect = useCallback((c: Connection | null) => {
    writeConnection(c)
    setConn(c)
  }, [])

  return { backend, conn, connect, data, loading, error, syncedAt, refresh, save, remove, bulk }
}

export type BitacoraApi = ReturnType<typeof useBitacora>
