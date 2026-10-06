import { AGENCY, clientLogo } from '../config'

const base = import.meta.env.BASE_URL

/** Logo de un equipo; si el cliente no tiene logo configurado, se muestra su nombre. */
export function TeamLogo({ team, className }: { team: string; className: string }) {
  const src = team === AGENCY ? 'logos/impacto-salmon.png' : clientLogo(team)
  return src ? (
    <img src={`${base}${src}`} alt={team} className={className} />
  ) : (
    <span className="text-sm font-bold tracking-wider text-stone-900 uppercase">{team}</span>
  )
}

/** Impacto Salmón × cliente. */
export function Logos({ client }: { client: string }) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <TeamLogo team={AGENCY} className="h-10 sm:h-11" />
      <span className="text-sm text-stone-400">×</span>
      <TeamLogo team={client} className="h-5 sm:h-6" />
    </div>
  )
}
