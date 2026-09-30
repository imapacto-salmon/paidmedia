import { useCallback, useEffect, useRef, useState } from 'react'
import type { Brief, InspirationImage, Piece } from '../types'
import { emptyBrief } from '../lib/utils'
import { loadImages, pruneImages, saveImages } from '../lib/images'

const KEY = 'is-brief-artes:v1'
const STEP_KEY = 'is-brief-artes:step'

type StoredPiece = Omit<Piece, 'images'> & { images: Omit<InspirationImage, 'dataUrl'>[] }

function readDraft(): Brief | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Brief
    return { ...emptyBrief(), ...parsed }
  } catch {
    return null
  }
}

function writeDraft(brief: Brief) {
  // Sin el contenido de las imágenes: esas viven en IndexedDB.
  const light = {
    ...brief,
    pieces: brief.pieces.map<StoredPiece>((p) => ({
      ...p,
      images: p.images.map(({ dataUrl: _omit, ...rest }) => rest),
    })),
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(light))
    return true
  } catch {
    return false
  }
}

export function readStep() {
  try {
    return Number(localStorage.getItem(STEP_KEY)) || 0
  } catch {
    return 0
  }
}

export function writeStep(step: number) {
  try {
    localStorage.setItem(STEP_KEY, String(step))
  } catch {
    /* ignorar */
  }
}

export function useBrief() {
  const [brief, setBrief] = useState<Brief>(() => readDraft() ?? emptyBrief())
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const storedImageIds = useRef(new Set<string>())

  // Recupera las imágenes guardadas en IndexedDB al abrir la app.
  useEffect(() => {
    const ids = brief.pieces.flatMap((p) => p.images.map((i) => i.id))
    if (!ids.length) {
      setHydrated(true)
      return
    }
    loadImages(ids).then((map) => {
      map.forEach((_, id) => storedImageIds.current.add(id))
      setBrief((b) => ({
        ...b,
        pieces: b.pieces.map((p) => ({
          ...p,
          images: p.images.map((i) => map.get(i.id) ?? i).filter((i) => i.dataUrl),
        })),
      }))
      setHydrated(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Autoguardado (con un pequeño retraso para no escribir en cada tecla).
  useEffect(() => {
    if (!hydrated) return
    const t = setTimeout(() => {
      if (writeDraft(brief)) setSavedAt(new Date())
      const all = brief.pieces.flatMap((p) => p.images)
      const fresh = all.filter((i) => !storedImageIds.current.has(i.id))
      if (fresh.length) {
        saveImages(fresh)
        fresh.forEach((i) => storedImageIds.current.add(i.id))
      }
      const ids = all.map((i) => i.id)
      if (storedImageIds.current.size > ids.length) {
        pruneImages(ids)
        storedImageIds.current = new Set(ids)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [brief, hydrated])

  const update = useCallback((patch: Partial<Brief>) => setBrief((b) => ({ ...b, ...patch })), [])

  const updatePiece = useCallback(
    (id: string, patch: Partial<Piece> | ((p: Piece) => Partial<Piece>)) =>
      setBrief((b) => ({
        ...b,
        pieces: b.pieces.map((p) => (p.id === id ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p)),
      })),
    [],
  )

  const reset = useCallback(() => {
    setBrief(emptyBrief())
    writeStep(0)
  }, [])

  return { brief, setBrief, update, updatePiece, reset, savedAt }
}

export type BriefApi = ReturnType<typeof useBrief>
