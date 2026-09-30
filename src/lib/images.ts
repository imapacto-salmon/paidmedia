import type { InspirationImage } from '../types'
import { uid } from './utils'

const MAX_SIDE = 1600
const QUALITY = 0.8

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`No se pudo leer ${file.name}`))
    }
    img.src = url
  })

/** Redimensiona a máx. 1600px de lado y convierte a JPG (calidad 0.8). */
export async function compressImage(file: File): Promise<InspirationImage> {
  const img = await loadImage(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.round(img.naturalWidth * scale)
  const height = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  // Fondo blanco para PNG con transparencia (JPG no la soporta).
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  return {
    id: uid(),
    name: file.name,
    dataUrl: canvas.toDataURL('image/jpeg', QUALITY),
    width,
    height,
  }
}

// ── Almacenamiento de imágenes en IndexedDB ─────────────────
// Las imágenes pesan demasiado para localStorage (~5 MB), así que el
// borrador guarda solo su id y los datos van a IndexedDB.

const DB_NAME = 'brief-artes'
const STORE = 'images'

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const req = fn(t.objectStore(STORE))
    t.oncomplete = () => resolve(req ? req.result : undefined)
    t.onerror = () => reject(t.error)
  })
}

export async function saveImages(images: InspirationImage[]) {
  try {
    await tx('readwrite', (s) => {
      images.forEach((img) => s.put(img, img.id))
    })
  } catch {
    /* modo privado o almacenamiento bloqueado: se ignora */
  }
}

export async function loadImages(ids: string[]): Promise<Map<string, InspirationImage>> {
  const map = new Map<string, InspirationImage>()
  try {
    const all = (await tx<InspirationImage[]>('readonly', (s) => s.getAll())) ?? []
    all.forEach((img) => ids.includes(img.id) && map.set(img.id, img))
  } catch {
    /* ignorar */
  }
  return map
}

/** Borra las imágenes que ya no usa ninguna pieza. */
export async function pruneImages(keep: string[]) {
  try {
    const keys = ((await tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys())) ?? []) as string[]
    const remove = keys.filter((k) => !keep.includes(k))
    if (remove.length) await tx('readwrite', (s) => remove.forEach((k) => s.delete(k)))
  } catch {
    /* ignorar */
  }
}
