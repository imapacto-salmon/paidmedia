import { CLIENTS, OBJECTIVES, PRIORITIES, REQUESTERS } from '../config/lists'
import { PLATFORMS } from '../config/formats'
import type { BriefApi } from '../state/useBrief'
import { Field, LinkList, StepHeader } from './ui'
import { IconCheck, PlatformLogo } from './icons'

export function Step1General({ api }: { api: BriefApi }) {
  const { brief, update } = api
  const togglePlatform = (id: (typeof PLATFORMS)[number]['id']) =>
    update({
      platforms: brief.platforms.includes(id) ? brief.platforms.filter((p) => p !== id) : [...brief.platforms, id],
    })

  return (
    <div>
      <StepHeader title="Datos generales" subtitle="Quién pide, para qué cliente y cuándo se necesita." />

      <div className="card space-y-6 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <span className="label">
              Solicitante <span className="text-salmon-500">*</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {REQUESTERS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`chip ${brief.requester === r ? 'chip-on' : 'chip-off'}`}
                  onClick={() => update({ requester: r })}
                >
                  {brief.requester === r && <IconCheck width={14} height={14} />}
                  {r}
                </button>
              ))}
            </div>
          </div>

          <Field label="Cliente" required>
            <select className="input" value={brief.client} onChange={(e) => update({ client: e.target.value })}>
              <option value="">Selecciona un cliente…</option>
              {CLIENTS.map((c) => (
                <option key={c}>{c}</option>
              ))}
              <option value="Otro">Otro…</option>
            </select>
            {brief.client === 'Otro' && (
              <input
                className="input mt-2"
                placeholder="Nombre del cliente"
                value={brief.clientOther}
                onChange={(e) => update({ clientOther: e.target.value })}
                autoFocus
              />
            )}
          </Field>

          <Field label="Nombre de la campaña" required>
            <input
              className="input"
              placeholder="Ej. Buen Fin 2026"
              value={brief.campaign}
              onChange={(e) => update({ campaign: e.target.value })}
            />
          </Field>

          <Field label="Objetivo">
            <select className="input" value={brief.objective} onChange={(e) => update({ objective: e.target.value })}>
              <option value="">Selecciona un objetivo…</option>
              {OBJECTIVES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            {brief.objective === 'Otro' && (
              <input
                className="input mt-2"
                placeholder="Describe el objetivo"
                value={brief.objectiveOther}
                onChange={(e) => update({ objectiveOther: e.target.value })}
              />
            )}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="¿Para cuándo se necesitan los artes?">
            <input
              type="date"
              className="input"
              value={brief.neededBy}
              onChange={(e) => update({ neededBy: e.target.value })}
            />
          </Field>
          <Field label="Fecha de lanzamiento">
            <input
              type="date"
              className="input"
              value={brief.launchDate}
              onChange={(e) => update({ launchDate: e.target.value })}
            />
          </Field>
          <div>
            <span className="label">Prioridad</span>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => {
                const on = brief.priority === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => update({ priority: p.id })}
                    className="chip flex-1 justify-center"
                    style={
                      on
                        ? { borderColor: p.color, background: p.bg, color: p.color }
                        : { borderColor: '#d6d3d1', color: '#57534e' }
                    }
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div>
          <span className="label">
            Plataformas donde correrá <span className="text-salmon-500">*</span>
          </span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PLATFORMS.map((p) => {
              const on = brief.platforms.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 transition ${
                    on ? 'border-salmon-500 bg-salmon-50' : 'border-stone-200 bg-white hover:border-salmon-200'
                  }`}
                >
                  {on && (
                    <span className="absolute top-2 right-2 rounded-full bg-salmon-500 p-0.5 text-white">
                      <IconCheck width={12} height={12} strokeWidth={3} />
                    </span>
                  )}
                  <PlatformLogo id={p.id} size={30} />
                  <span className="text-sm font-semibold text-stone-700">{p.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <Field label="Contexto general" hint="Qué se vende, a quién, tono de la marca, qué ha funcionado antes…">
          <textarea
            className="input min-h-28"
            placeholder="Ej. Campaña de fin de año enfocada en membresías. Público 25–40 años…"
            value={brief.context}
            onChange={(e) => update({ context: e.target.value })}
          />
        </Field>

        <div>
          <span className="label">Links generales</span>
          <p className="hint mb-2 mt-0">Presentaciones, carpetas de Drive, Figma, manual de marca…</p>
          <LinkList links={brief.links} onChange={(links) => update({ links })} />
        </div>
      </div>
    </div>
  )
}
