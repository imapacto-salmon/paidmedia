import { PAUTA_STATUS, TEST_STATUS } from '../config'
import { monthLabel } from '../lib/ads'
import type { Ad, PautaStatus, TestStatus } from '../types'
import { isUrl, StatusSelect, timeAgo } from './ui'
import { IconCheck, IconLink } from '../../components/icons'

export function AdCard({
  ad,
  onOpen,
  onQuick,
}: {
  ad: Ad
  onOpen: () => void
  onQuick: (patch: Partial<Pick<Ad, 'status' | 'test' | 'sync'>>) => void
}) {
  const copy = (ad.copyUpdated || ad.copy).trim().replace(/\n\s*\n+/g, '\n')
  const off = ad.status === 'desactivado'
  return (
    <article
      className={`card cursor-pointer p-4 transition hover:border-salmon-300 hover:shadow ${off ? 'opacity-70' : ''}`}
      onClick={onOpen}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-stone-900">{ad.name || 'Sin nombre'}</h4>
          <p className="mt-0.5 text-xs text-stone-500">
            {ad.platform}
            {ad.launch && ` · ${monthLabel(ad.launch)}`}
            {ad.budget && ` · ${ad.budget}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusSelect<PautaStatus> label="Estatus en pauta" value={ad.status} options={PAUTA_STATUS} onChange={(v) => onQuick({ status: v })} />
          <StatusSelect<TestStatus> label="Estatus de prueba" value={ad.test} options={TEST_STATUS} onChange={(v) => onQuick({ test: v })} />
        </div>
      </div>

      {copy ? (
        <p className="mt-3 line-clamp-3 text-sm whitespace-pre-line text-stone-600">
          {ad.copyUpdated && <span className="mr-1 rounded bg-salmon-50 px-1.5 py-0.5 text-[11px] font-semibold text-salmon-700">Actualizado</span>}
          {copy}
        </p>
      ) : (
        <p className="mt-3 text-sm text-stone-400 italic">Sin copy</p>
      )}

      {ad.keyword && (
        <p className="mt-2 text-xs text-stone-500">
          <span className="font-semibold text-stone-600">Keyword:</span> “{ad.keyword}”
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        {ad.preview && (
          <a href={ad.preview} target="_blank" rel="noreferrer" className="font-semibold text-salmon-700 hover:underline" onClick={(e) => e.stopPropagation()}>
            Ver anuncio ↗
          </a>
        )}
        {ad.link &&
          (isUrl(ad.link) ? (
            <a href={ad.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-stone-500 hover:text-salmon-700" onClick={(e) => e.stopPropagation()}>
              <IconLink width={12} height={12} /> {ad.link.replace(/^https?:\/\//, '').slice(0, 40)}
            </a>
          ) : (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">Destino: {ad.link}</span>
          ))}
        {ad.creative && isUrl(ad.creative) && (
          <a href={ad.creative} target="_blank" rel="noreferrer" className="text-stone-500 hover:text-salmon-700" onClick={(e) => e.stopPropagation()}>
            Creativo ↗
          </a>
        )}
        {ad.notes && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">Tiene notas</span>}
        <span className="ml-auto text-stone-400">
          {ad.updatedBy && `${ad.updatedBy} · `}
          {timeAgo(ad.updatedAt)}
        </span>
      </div>

      {ad.sync === 'pendiente' && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>
            <strong>Pendiente de subir:</strong> hay cambios de copy o link que aún no están en la plataforma.
          </span>
          <button
            className="btn btn-secondary px-2.5 py-1 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              onQuick({ sync: 'al_dia' })
            }}
          >
            <IconCheck width={14} height={14} /> Ya está en pauta
          </button>
        </div>
      )}
    </article>
  )
}
