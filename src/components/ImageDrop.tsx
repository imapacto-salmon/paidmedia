import { useRef, useState } from 'react'
import type { InspirationImage } from '../types'
import { compressImage } from '../lib/images'
import { IconUpload, IconX } from './icons'

export function ImageDrop({
  images,
  onAdd,
  onRemove,
}: {
  images: InspirationImage[]
  onAdd: (imgs: InspirationImage[]) => void
  onRemove: (id: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(0)
  const [error, setError] = useState('')

  const handle = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!list.length) return
    setError('')
    setBusy(list.length)
    const done: InspirationImage[] = []
    for (const f of list) {
      try {
        done.push(await compressImage(f))
      } catch (e) {
        setError((e as Error).message)
      }
      setBusy((b) => b - 1)
    }
    onAdd(done)
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          handle(e.dataTransfer.files)
        }}
        onPaste={(e) => handle(e.clipboardData.files)}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
          over ? 'border-salmon-400 bg-salmon-50' : 'border-stone-300 bg-stone-50 hover:border-salmon-300'
        }`}
      >
        <IconUpload className="text-salmon-500" width={22} height={22} />
        <span className="text-sm font-medium text-stone-700">
          {busy ? `Comprimiendo ${busy} imagen(es)…` : 'Arrastra imágenes aquí o haz clic para elegir'}
        </span>
        <span className="text-xs text-stone-500">Se comprimen automáticamente (máx. 1600 px, JPG)</span>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) handle(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
              <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Quitar imagen"
                onClick={() => onRemove(img.id)}
                className="absolute top-1 right-1 cursor-pointer rounded-full bg-black/60 p-1 text-white opacity-90 transition hover:bg-black/80"
              >
                <IconX width={14} height={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
