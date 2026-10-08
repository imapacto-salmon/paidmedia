import { useEffect, useState, type ReactNode } from 'react'
import { FIELD_LABELS, PAUTA_STATUS, PLATFORMS, SYNC_STATUS, TEST_STATUS } from '../config'
import { changeText, monthLabel } from '../lib/ads'
import type { Ad, AdField, HistoryEntry, PautaStatus, SyncStatus, TestStatus } from '../types'
import { isUrl, Segmented, timeAgo } from './ui'
import { VariantEditor } from './VariantEditor'
import { IconCopy, IconTrash, IconX } from '../../components/icons'

type Props = {
  original: Ad | null
  initial: Ad
  campaigns: string[]
  adSets: string[]
  history: HistoryEntry[]
  onSave: (draft: Ad) => Promise<'ok' | 'conflict' | 'error'>
  onDelete: () => void
  onDuplicate: (draft: Ad) => void
  onClose: () => void
  conflictWith: Ad | null
  /** Campos que tú y la otra persona cambiaron a la vez. */
  overlap: AdField[]
}

export function AdEditor({ original, initial, campaigns, adSets, history, onSave, onDelete, onDuplicate, onClose, conflictWith, overlap }: Props) {
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof Ad>(k: K, v: Ad[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)

  const close = () => {
    if (dirty && !confirm('Tienes cambios sin guardar. ¿Cerrar de todos modos?')) return
    onClose()
  }

  useEffect(() => {
    // Si hay una vista previa abierta encima, Escape cierra solo esa.
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !document.querySelector('[role=dialog]') && close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const submit = async () => {
    if (!draft.name.trim()) return alert('Ponle nombre al anuncio.')
    setSaving(true)
    const r = await onSave({ ...draft, name: draft.name.trim(), campaign: draft.campaign.trim(), adSet: draft.adSet.trim() })
    setSaving(false)
    if (r === 'ok') onClose()
  }

  const copyText = (s: string) => navigator.clipboard?.writeText(s)

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/70 backdrop-blur-sm" onClick={close}>
      <aside className="flex h-full w-full max-w-2xl flex-col bg-stone-50 shadow-2xl" onClick={(e) => e.stopPropagation()} aria-label="Editar anuncio">
        <header className="flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-5 py-3.5">
          <div className="min-w-0">
            <p className="truncate text-xs text-stone-500">
              {[draft.campaign, draft.adSet].filter(Boolean).join(' › ') || 'Nuevo anuncio'}
            </p>
            <h2 className="truncate text-base font-bold text-stone-900">{draft.name || 'Sin nombre'}</h2>
          </div>
          <button className="btn btn-ghost" onClick={close} aria-label="Cerrar">
            <IconX />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {conflictWith && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <strong>{conflictWith.updatedBy || 'Alguien'}</strong> editó este anuncio {timeAgo(conflictWith.updatedAt)} mientras lo
              tenías abierto y también cambió: <strong>{overlap.map((f) => FIELD_LABELS[f]).join(', ')}</strong>. Aquí ves tu versión de esos
              campos y la suya en todo lo demás. Si guardas, se queda lo que ves.
            </div>
          )}

          <Section title="Estatus">
            <div className="space-y-3">
              <Row label="En pauta">
                <Segmented<PautaStatus> value={draft.status} onChange={(v) => set('status', v)} options={PAUTA_STATUS.map((o) => ({ value: o.value, label: o.label }))} />
              </Row>
              <Row label="Prueba">
                <Segmented<TestStatus> value={draft.test} onChange={(v) => set('test', v)} options={TEST_STATUS.map((o) => ({ value: o.value, label: o.label }))} />
              </Row>
              <Row label="Cambios">
                <Segmented<SyncStatus> value={draft.sync} onChange={(v) => set('sync', v)} options={SYNC_STATUS} />
                <span className="hint block">Si cambias copy, link o keyword se marca solo como “Pendiente de subir”.</span>
              </Row>
            </div>
          </Section>

          <Section title="Ubicación en pauta">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Campaña" value={draft.campaign} onChange={(v) => set('campaign', v)} list="bt-campaigns" />
              <Input label="Conjunto de anuncios" value={draft.adSet} onChange={(v) => set('adSet', v)} list="bt-adsets" />
              <Input label="Anuncio" value={draft.name} onChange={(v) => set('name', v)} required />
              <label className="block">
                <span className="label">Plataforma</span>
                <select className="input" value={draft.platform} onChange={(e) => set('platform', e.target.value)}>
                  {[...new Set([...PLATFORMS, draft.platform])].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
            </div>
            <datalist id="bt-campaigns">
              {campaigns.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <datalist id="bt-adsets">
              {adSets.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Section>

          <Section title="Formatos y vista previa">
            <p className="-mt-1 text-xs text-stone-500">
              Agrega cada formato que corre (Post 1:1, Story 9:16, Búsqueda…) y pega su link de Drive o de Instagram.
            </p>
            <VariantEditor value={draft.variants} onChange={(v) => set('variants', v)} title={draft.name || 'Anuncio'} />
          </Section>

          <Section title="Copy">
            <TextArea
              label="Copy y video actualizado"
              hint="Propuesta nueva. Puedes pegar aquí el link del video."
              value={draft.copyUpdated}
              onChange={(v) => set('copyUpdated', v)}
              onCopy={() => copyText(draft.copyUpdated)}
            />
            <TextArea label="Copy en pauta" value={draft.copy} onChange={(v) => set('copy', v)} onCopy={() => copyText(draft.copy)} />
            {draft.copyUpdated && (
              <button type="button" className="btn btn-secondary text-xs" onClick={() => setDraft((d) => ({ ...d, copy: d.copyUpdated, copyUpdated: '' }))}>
                Pasar el copy actualizado a “Copy en pauta”
              </button>
            )}
          </Section>

          <Section title="Destino y datos">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Link" value={draft.link} onChange={(v) => set('link', v)} placeholder="https://… o Mensaje / Chatbot" />
              <Input label="Keyword (chatbot)" value={draft.keyword} onChange={(v) => set('keyword', v)} />
              <Input label="Presupuesto (diario o total)" value={draft.budget} onChange={(v) => set('budget', v)} placeholder="$150 diario" />
              <label className="block">
                <span className="label">Fecha de lanzamiento</span>
                <input
                  className="input"
                  type="month"
                  value={/^\d{4}-\d{2}$/.test(draft.launch) ? draft.launch : ''}
                  onChange={(e) => set('launch', e.target.value)}
                />
                {draft.launch && !/^\d{4}-\d{2}$/.test(draft.launch) && <span className="hint block">Antes: {monthLabel(draft.launch)}</span>}
              </label>
              <Input label="Creativo (carpeta o archivo)" value={draft.creative} onChange={(v) => set('creative', v)} placeholder="https://drive.google.com/…" />
              <Input label="Ver anuncio (preview)" value={draft.preview} onChange={(v) => set('preview', v)} placeholder="https://fb.me/adspreview/…" />
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              {isUrl(draft.preview) && (
                <a className="font-semibold text-salmon-700 hover:underline" href={draft.preview} target="_blank" rel="noreferrer">
                  Abrir preview ↗
                </a>
              )}
              {isUrl(draft.creative) && (
                <a className="font-semibold text-salmon-700 hover:underline" href={draft.creative} target="_blank" rel="noreferrer">
                  Abrir creativo ↗
                </a>
              )}
            </div>
          </Section>

          <Section title="Notas">
            <textarea
              className="input min-h-20"
              value={draft.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Resultados de la prueba, comentarios para el otro equipo…"
            />
          </Section>

          {original && (
            <Section title="Historial">
              {history.length ? (
                <ol className="space-y-3">
                  {history.map((h, i) => (
                    <li key={i} className="border-l-2 border-salmon-200 pl-3 text-sm">
                      <p className="text-xs text-stone-500">
                        <strong className="text-stone-700">{h.by}</strong>
                        {h.team && ` (${h.team})`} · {timeAgo(h.at)} · {h.action}
                      </p>
                      {h.changes.map((c, j) => (
                        <p key={j} className="text-stone-600">
                          {changeText(c)}
                        </p>
                      ))}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-stone-400">Sin cambios registrados.</p>
              )}
            </Section>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-stone-200 bg-white px-5 py-3">
          {original && (
            <>
              <button className="btn btn-ghost text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={onDelete}>
                <IconTrash width={16} height={16} /> Eliminar
              </button>
              <button className="btn btn-ghost" onClick={() => onDuplicate(draft)}>
                <IconCopy width={16} height={16} /> Duplicar
              </button>
            </>
          )}
          <div className="ml-auto flex gap-2">
            <button className="btn btn-secondary" onClick={close}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={submit} disabled={saving || (!!original && !dirty && !conflictWith)}>
              {saving ? 'Guardando…' : original ? 'Guardar cambios' : 'Agregar anuncio'}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card space-y-3 p-4">
      <h3 className="text-sm font-bold tracking-wide text-stone-500 uppercase">{title}</h3>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  list,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  list?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required && <span className="text-salmon-500"> *</span>}
      </span>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} list={list} />
    </label>
  )
}

function TextArea({
  label,
  hint,
  value,
  onChange,
  onCopy,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  onCopy: () => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-stone-700">{label}</span>
        {value && (
          <button type="button" className="text-xs font-semibold text-salmon-700 hover:underline" onClick={(e) => (e.preventDefault(), onCopy())}>
            Copiar
          </button>
        )}
      </span>
      <textarea className="input min-h-40 leading-relaxed" value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="hint block">{hint}</span>}
    </label>
  )
}
