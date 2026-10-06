import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_CLIENT, PAUTA_STATUS, TEST_STATUS } from './config'
import { changeText, diff, download, groupAds, newAd, parseTsv, rowsToAds, toCsv, uid } from './lib/ads'
import { readWho, useBitacora, writeWho } from './state/useBitacora'
import type { Ad, AdField, PautaStatus, TestStatus, Who } from './types'
import { AdCard } from './components/AdCard'
import { AdEditor } from './components/AdEditor'
import { ConnectDialog, ImportDialog, WhoDialog } from './components/Dialogs'
import { Modal, timeAgo } from './components/ui'
import { Logos } from './components/Logos'
import { IconDownload, IconPlus, IconRefresh, IconUpload } from '../components/icons'
import seedRhino from './seed/rhino.tsv?raw'

type EditorState = { initial: Ad; base: Ad | null; conflictWith: Ad | null; overlap?: AdField[]; rev?: number }
type Filters = { q: string; campaign: string; status: PautaStatus | ''; test: TestStatus | ''; pending: boolean }

const emptyFilters: Filters = { q: '', campaign: '', status: '', test: '', pending: false }

export default function App() {
  const [who, setWho] = useState<Who | null>(() => readWho())
  const api = useBitacora(who)
  const { data } = api
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [dialog, setDialog] = useState<'who' | 'connect' | 'import' | 'activity' | null>(null)
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const client = data?.title.replace(/^bit[aá]cora( de pauta)?\s*[-·:]?\s*/i, '').trim() || DEFAULT_CLIENT
  const ads = data?.ads ?? []

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    return ads.filter(
      (a) =>
        (!filters.campaign || a.campaign === filters.campaign) &&
        (!filters.status || a.status === filters.status) &&
        (!filters.test || a.test === filters.test) &&
        (!filters.pending || a.sync === 'pendiente') &&
        (!q || [a.name, a.campaign, a.adSet, a.copy, a.copyUpdated, a.keyword, a.notes].some((v) => v.toLowerCase().includes(q))),
    )
  }, [ads, filters])

  const groups = useMemo(() => groupAds(filtered), [filtered])
  const campaigns = useMemo(() => [...new Set(ads.map((a) => a.campaign).filter(Boolean))], [ads])
  const adSets = useMemo(() => [...new Set(ads.map((a) => a.adSet).filter(Boolean))], [ads])
  const count = (fn: (a: Ad) => boolean) => ads.filter(fn).length
  const filtering = JSON.stringify(filters) !== JSON.stringify(emptyFilters)

  const fail = (e: unknown) => setToast(e instanceof Error ? e.message : 'No se pudo guardar.')

  const quick = async (ad: Ad, patch: Partial<Ad>) => {
    try {
      const r = await api.save({ ...ad, ...patch }, ad)
      if (r.ok === false) setToast(`${r.conflict?.updatedBy || 'Alguien'} acaba de editar “${ad.name}”. Ya ves su versión; vuelve a intentarlo.`)
    } catch (e) {
      fail(e)
    }
  }

  const saveEditor = async (draft: Ad): Promise<'ok' | 'conflict' | 'error'> => {
    if (!editor) return 'error'
    try {
      const r = await api.save(draft, editor.base)
      if (r.ok === false) {
        if (!r.conflict) {
          setToast('Alguien eliminó este anuncio mientras lo editabas.')
          return 'error'
        }
        // Alguien guardó antes: se combinan sus cambios con los tuyos campo por campo.
        const theirs = r.conflict
        const mine = diff(editor.initial, draft).map((c) => c.field)
        const merged: Ad = { ...theirs }
        for (const f of mine) (merged as Record<AdField, unknown>)[f] = draft[f]
        const overlap = mine.filter((f) => theirs[f] !== editor.initial[f] && theirs[f] !== draft[f])
        if (!overlap.length) {
          const again = await api.save(merged, theirs)
          if (again.ok) {
            setToast(`${theirs.updatedBy || 'Alguien'} también editó este anuncio; se combinaron los cambios.`)
            return 'ok'
          }
        }
        setEditor({ initial: merged, base: theirs, conflictWith: theirs, overlap, rev: (editor.rev ?? 0) + 1 })
        return 'conflict'
      }
      setToast(editor.base ? 'Cambios guardados.' : 'Anuncio agregado.')
      return 'ok'
    } catch (e) {
      fail(e)
      return 'error'
    }
  }

  const openNew = (patch: Partial<Ad> = {}) =>
    setEditor({ initial: newAd({ createdBy: who?.name ?? '', ...patch }), base: null, conflictWith: null })

  const importAds = async (list: Ad[]) => {
    try {
      await api.bulk(list)
      setToast(`${list.length} anuncios importados.`)
    } catch (e) {
      fail(e)
      throw e
    }
  }

  if (!who) return <WhoDialog who={null} client={client} onSave={(w) => (writeWho(w), setWho(w))} />

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-black/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Logos client={client} />
            <div className="hidden min-w-0 border-l border-stone-200 pl-4 md:block">
              <h1 className="text-xs leading-tight font-bold tracking-[0.2em] text-stone-900 uppercase">Bitácora de Pauta</h1>
              <p className="truncate text-xs text-stone-500">Control de artes en pauta activa</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${
                api.backend.kind === 'remote' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
              onClick={() => setDialog('connect')}
              title={api.backend.kind === 'remote' ? 'Conectada a Google Sheets' : 'Solo en este navegador'}
            >
              <span className={`h-2 w-2 rounded-full ${api.backend.kind === 'remote' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {api.backend.kind === 'remote' ? 'Compartida' : 'Modo local'}
            </button>
            <button className="btn btn-ghost text-xs" onClick={() => api.refresh()} title="Actualizar">
              <IconRefresh width={15} height={15} className={api.loading ? 'animate-spin' : ''} />
            </button>
            <button className="btn btn-ghost text-xs" onClick={() => setDialog('who')} title="Cambiar de usuario">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-salmon-100 text-[11px] font-bold text-salmon-700">
                {who.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-28 truncate sm:inline">{who.name}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-5 text-xs font-bold tracking-[0.2em] text-stone-500 uppercase md:hidden">Bitácora de Pauta · artes en pauta activa</h1>
        {api.backend.kind === 'local' && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p>
              <strong>Modo local:</strong> lo que agregues solo se guarda en este navegador. Conecta la Google Sheet para que el cliente vea y
              edite lo mismo.
            </p>
            <button className="btn btn-secondary text-xs" onClick={() => setDialog('connect')}>
              Conectar hoja
            </button>
          </div>
        )}
        {api.error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {api.error}{' '}
            <button className="font-semibold underline" onClick={() => api.refresh()}>
              Reintentar
            </button>
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Anuncios" value={ads.length} onClick={() => setFilters(emptyFilters)} active={!filtering} />
          <Stat label="Activos" value={count((a) => a.status === 'activo')} onClick={() => setFilters({ ...emptyFilters, status: 'activo' })} active={filters.status === 'activo'} />
          <Stat label="Probados · funciona" value={count((a) => a.test === 'ganador')} onClick={() => setFilters({ ...emptyFilters, test: 'ganador' })} active={filters.test === 'ganador'} />
          <Stat
            label="Pendientes de subir"
            value={count((a) => a.sync === 'pendiente')}
            onClick={() => setFilters({ ...emptyFilters, pending: true })}
            active={filters.pending}
            warn
          />
        </div>

        {/* Acciones */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className="btn btn-primary" onClick={() => openNew({ campaign: filters.campaign })}>
            <IconPlus /> Anuncio
          </button>
          <button className="btn btn-secondary" onClick={() => setDialog('import')} title="Pegar filas desde Excel o Sheets">
            <IconUpload width={16} height={16} /> Importar
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => download(`Bitacora_${client || 'pauta'}_${new Date().toISOString().slice(0, 10)}.csv`, toCsv(filtered))}
            disabled={!filtered.length}
          >
            <IconDownload width={16} height={16} /> CSV
          </button>
          <button className="btn btn-ghost ml-auto" onClick={() => setDialog('activity')}>
            Actividad reciente
          </button>
        </div>

        {/* Filtros */}
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input className="input" placeholder="Buscar anuncio, copy, keyword…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          <select className="input" value={filters.campaign} onChange={(e) => setFilters({ ...filters, campaign: e.target.value })} aria-label="Campaña">
            <option value="">Todas las campañas</option>
            {campaigns.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as PautaStatus | '' })} aria-label="Estatus en pauta">
            <option value="">Cualquier estatus en pauta</option>
            {PAUTA_STATUS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select className="input" value={filters.test} onChange={(e) => setFilters({ ...filters, test: e.target.value as TestStatus | '' })} aria-label="Estatus de prueba">
            <option value="">Cualquier estatus de prueba</option>
            {TEST_STATUS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {filtering && (
          <p className="mt-3 text-sm text-stone-500">
            Mostrando {filtered.length} de {ads.length}.{' '}
            <button className="font-semibold text-salmon-700 hover:underline" onClick={() => setFilters(emptyFilters)}>
              Quitar filtros
            </button>
          </p>
        )}

        {/* Lista */}
        {!data && api.loading && <p className="mt-10 text-center text-stone-400">Cargando bitácora…</p>}
        {data && !ads.length && (
          <div className="card mt-6 p-8 text-center">
            <h2 className="text-lg font-bold text-stone-900">La bitácora está vacía</h2>
            <p className="mt-1 text-sm text-stone-500">Pega los anuncios desde tu hoja de pauta o agrégalos uno por uno.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button className="btn btn-primary" onClick={() => setDialog('import')}>
                <IconUpload width={16} height={16} /> Importar desde Excel / Sheets
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => importAds(rowsToAds(parseTsv(seedRhino), who.name).ads).catch(() => {})}
              >
                Cargar pauta de Rhino Performance
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-8">
          {[...groups].map(([campaign, sets]) => (
            <section key={campaign}>
              <h2 className="mb-3 flex items-baseline gap-2 border-b border-stone-200 pb-2 text-sm font-bold tracking-[0.12em] break-all text-stone-900 uppercase">
                {campaign || 'Sin campaña'}
                <span className="text-sm font-medium text-stone-400">{[...sets.values()].reduce((n, l) => n + l.length, 0)}</span>
              </h2>
              <div className="space-y-5">
                {[...sets].map(([adSet, list]) => {
                  const budget = list.find((a) => a.budget)?.budget
                  return (
                    <div key={adSet} className="border-l-2 border-salmon-200 pl-3 sm:pl-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-stone-600">
                          {adSet || 'Sin conjunto'}
                          {budget && <span className="ml-2 font-normal text-stone-400">Presupuesto {budget}</span>}
                        </h3>
                        <button
                          className="text-xs font-semibold text-salmon-700 hover:underline"
                          onClick={() => openNew({ campaign, adSet, platform: list[0].platform, order: list[list.length - 1].order + 0.5 })}
                        >
                          + Anuncio aquí
                        </button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {list.map((ad) => (
                          <AdCard
                            key={ad.id}
                            ad={ad}
                            onOpen={() => setEditor({ initial: ad, base: ad, conflictWith: null })}
                            onQuick={(patch) => quick(ad, patch)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        {api.syncedAt && api.backend.kind === 'remote' && (
          <p className="mt-10 text-center text-xs text-stone-400">Actualizada {timeAgo(api.syncedAt.toISOString())} · se refresca sola cada minuto</p>
        )}
        <p className="mt-4 text-center text-xs">
          <a className="text-stone-400 hover:text-salmon-700" href={import.meta.env.BASE_URL}>
            Ir a Brief de Artes →
          </a>
        </p>
      </main>

      {editor && (
        <AdEditor
          key={`${editor.initial.id}-${editor.rev ?? 0}`}
          original={editor.base}
          initial={editor.initial}
          conflictWith={editor.conflictWith}
          overlap={editor.overlap ?? []}
          campaigns={campaigns}
          adSets={adSets}
          history={(data?.history ?? []).filter((h) => h.adId === editor.initial.id)}
          onSave={saveEditor}
          onClose={() => setEditor(null)}
          onDuplicate={(d) =>
            setEditor({ initial: { ...d, id: uid(), name: `${d.name} (copia)`, order: d.order + 0.5, createdBy: who.name, updatedAt: '', updatedBy: '' }, base: null, conflictWith: null })
          }
          onDelete={async () => {
            if (!editor.base || !confirm(`¿Eliminar “${editor.base.name}” de la bitácora? Queda registrado en el historial.`)) return
            try {
              await api.remove(editor.base)
              setEditor(null)
              setToast('Anuncio eliminado.')
            } catch (e) {
              fail(e)
            }
          }}
        />
      )}

      {dialog === 'who' && <WhoDialog who={who} client={client} onClose={() => setDialog(null)} onSave={(w) => (writeWho(w), setWho(w), setDialog(null))} />}
      {dialog === 'connect' && <ConnectDialog conn={api.conn} onClose={() => setDialog(null)} onSave={(c) => (api.connect(c), setDialog(null))} />}
      {dialog === 'import' && <ImportDialog who={who.name} onImport={importAds} onClose={() => setDialog(null)} />}
      {dialog === 'activity' && (
        <Modal title="Actividad reciente" onClose={() => setDialog(null)} wide>
          {data?.history.length ? (
            <ol className="space-y-3">
              {data.history.slice(0, 80).map((h, i) => (
                <li key={i} className="border-l-2 border-salmon-200 pl-3 text-sm">
                  <p className="text-xs text-stone-500">
                    <strong className="text-stone-700">{h.by}</strong>
                    {h.team && ` (${h.team})`} · {timeAgo(h.at)}
                  </p>
                  <p className="font-medium text-stone-800">
                    {h.action === 'crear' ? 'Agregó' : h.action === 'eliminar' ? 'Eliminó' : h.action === 'importar' ? 'Importó' : 'Editó'} “{h.adName}”
                  </p>
                  {h.action === 'editar' &&
                    h.changes.map((c, j) => (
                      <p key={j} className="text-stone-600">
                        {changeText(c)}
                      </p>
                    ))}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-stone-400">Todavía no hay cambios.</p>
          )}
        </Modal>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4" role="status">
          <div className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm text-white shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, onClick, active, warn }: { label: string; value: number; onClick: () => void; active: boolean; warn?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`card cursor-pointer p-3 text-left transition hover:border-salmon-300 ${active ? 'border-salmon-400 ring-2 ring-salmon-100' : ''}`}
    >
      <p className={`text-3xl font-bold tabular-nums ${warn && value ? 'text-amber-600' : 'text-stone-900'}`}>{value}</p>
      <p className="text-[11px] font-semibold tracking-wider text-stone-500 uppercase">{label}</p>
    </button>
  )
}

