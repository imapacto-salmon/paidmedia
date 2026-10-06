import { useMemo, useState } from 'react'
import { AGENCY, FIELD_LABELS } from '../config'
import { parseTsv, rowsToAds } from '../lib/ads'
import { shareLink, type Connection } from '../lib/api'
import type { Ad, Who } from '../types'
import { Modal } from './ui'
import { Segmented } from '../../components/ui'

export function WhoDialog({ who, client, onSave, onClose }: { who: Who | null; client: string; onSave: (w: Who) => void; onClose?: () => void }) {
  const teams = [AGENCY, client || 'Cliente']
  const [name, setName] = useState(who?.name ?? '')
  const [team, setTeam] = useState(who?.team && teams.includes(who.team) ? who.team : teams[0])
  return (
    <Modal
      title="¿Quién eres?"
      onClose={onClose}
      footer={
        <button className="btn btn-primary" disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), team })}>
          Entrar
        </button>
      }
    >
      <p className="mb-4 text-sm text-stone-500">Tu nombre aparece en el historial de cada cambio. Solo se pide una vez en este navegador.</p>
      <label className="block">
        <span className="label">Nombre</span>
        <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Harumi" onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSave({ name: name.trim(), team })} />
      </label>
      <div className="mt-4">
        <span className="label">Equipo</span>
        <Segmented value={team} onChange={setTeam} options={teams.map((t) => ({ value: t, label: t }))} />
      </div>
    </Modal>
  )
}

export function ConnectDialog({ conn, onSave, onClose }: { conn: Connection | null; onSave: (c: Connection | null) => void; onClose: () => void }) {
  const [url, setUrl] = useState(conn?.url ?? '')
  const [key, setKey] = useState(conn?.key ?? '')
  const [copied, setCopied] = useState(false)
  const valid = /^https:\/\/script\.google\.com\/.+\/exec$/.test(url.trim())
  return (
    <Modal
      title="Conectar con Google Sheets"
      onClose={onClose}
      footer={
        <>
          {conn && (
            <button className="btn btn-ghost mr-auto" onClick={() => confirm('¿Desconectar? Verás la bitácora local de este navegador.') && onSave(null)}>
              Desconectar
            </button>
          )}
          <button className="btn btn-primary" disabled={!valid} onClick={() => onSave({ url: url.trim(), key: key.trim() })}>
            Conectar
          </button>
        </>
      }
    >
      <p className="mb-4 text-sm text-stone-500">
        Con la hoja conectada, Impacto Salmón y el cliente ven y editan la misma bitácora. Los pasos para crear la hoja están en el README
        (sección “Bitácora de Pauta”).
      </p>
      <label className="block">
        <span className="label">URL de la app web de Apps Script</span>
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" />
        {url && !valid && <span className="hint block text-rose-600">Debe empezar con https://script.google.com/ y terminar en /exec</span>}
      </label>
      <label className="mt-3 block">
        <span className="label">Clave (opcional)</span>
        <input className="input" value={key} onChange={(e) => setKey(e.target.value)} placeholder="La propiedad KEY del script, si la definiste" />
      </label>
      {conn && (
        <div className="mt-5 rounded-xl bg-salmon-50 p-3 text-sm">
          <p className="font-semibold text-salmon-900">Link para compartir con el cliente</p>
          <p className="mt-1 text-salmon-800">Quien lo abra queda conectado a esta misma hoja.</p>
          <button
            className="btn btn-secondary mt-2 text-xs"
            onClick={() => {
              navigator.clipboard?.writeText(shareLink(conn))
              setCopied(true)
            }}
          >
            {copied ? '¡Copiado!' : 'Copiar link'}
          </button>
        </div>
      )}
    </Modal>
  )
}

export function ImportDialog({ who, onImport, onClose }: { who: string; onImport: (ads: Ad[]) => Promise<void>; onClose: () => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const result = useMemo(() => (text.trim() ? rowsToAds(parseTsv(text), who) : null), [text, who])
  const mapped = result?.columns.filter(Boolean) ?? []
  return (
    <Modal
      wide
      title="Importar desde Excel o Google Sheets"
      onClose={onClose}
      footer={
        <button
          className="btn btn-primary"
          disabled={!result?.ads.length || busy}
          onClick={async () => {
            setBusy(true)
            try {
              await onImport(result!.ads)
              onClose()
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Importando…' : `Importar ${result?.ads.length ?? 0} anuncios`}
        </button>
      }
    >
      <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-stone-600">
        <li>En la hoja, selecciona las filas <strong>incluyendo los encabezados</strong> (Campaña, Conjunto de anuncios, Anuncio, Copy…).</li>
        <li>Copia (Ctrl/Cmd + C) y pega aquí abajo.</li>
        <li>Si la campaña o el conjunto vienen vacíos, se toma el de la fila de arriba. “DESACTIVADO” en Link marca el anuncio como desactivado.</li>
      </ol>
      <textarea
        className="input min-h-40 font-mono text-xs"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Pega aquí las filas…"
      />
      {result && (
        <div className="mt-3 text-sm">
          <p className={result.headerFound ? 'text-stone-600' : 'text-amber-700'}>
            {result.headerFound
              ? `Columnas reconocidas: ${mapped.map((f) => FIELD_LABELS[f!]).join(', ')}.`
              : 'No encontré la fila de encabezados; uso el orden de la plantilla de pauta.'}
          </p>
          {result.ads.length > 0 && (
            <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-stone-100 text-stone-600">
                  <tr>
                    <th className="px-2 py-1.5">Campaña</th>
                    <th className="px-2 py-1.5">Conjunto</th>
                    <th className="px-2 py-1.5">Anuncio</th>
                    <th className="px-2 py-1.5">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {result.ads.map((a) => (
                    <tr key={a.id} className="border-t border-stone-100">
                      <td className="px-2 py-1">{a.campaign}</td>
                      <td className="px-2 py-1">{a.adSet}</td>
                      <td className="px-2 py-1 font-medium">{a.name}</td>
                      <td className="px-2 py-1">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
