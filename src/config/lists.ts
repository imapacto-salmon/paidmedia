// ─────────────────────────────────────────────────────────────
// Listas editables: solicitantes, clientes, objetivos y prioridades.
// Para agregar o quitar opciones basta con editar estos arreglos.
// ─────────────────────────────────────────────────────────────

/** Personas que solicitan artes al equipo de diseño. */
export const REQUESTERS: string[] = ['Carlos', 'Harumi', 'Emma']

/** Clientes disponibles. La opción "Otro" se agrega automáticamente en la app. */
export const CLIENTS: string[] = [
  'H&R Posadas',
  'RHINO Performance',
  'NALA',
  'LERO LERO',
  'SUNCEPT',
  'Urban Box',
  'Sertres',
  'Flor de la Paz',
]

/** Objetivos de campaña. "Otro" muestra un campo de texto libre. */
export const OBJECTIVES: string[] = ['Reconocimiento', 'Tráfico', 'Leads', 'Ventas/Conversiones', 'Otro']

export type PriorityId = 'normal' | 'alta' | 'urgente'

/** Prioridades y su color (se usa en la app y en el PDF). */
export const PRIORITIES: { id: PriorityId; label: string; color: string; bg: string }[] = [
  { id: 'normal', label: 'Normal', color: '#15803d', bg: '#dcfce7' },
  { id: 'alta', label: 'Alta', color: '#b45309', bg: '#fef3c7' },
  { id: 'urgente', label: 'Urgente', color: '#b91c1c', bg: '#fee2e2' },
]

/** Duraciones de video sugeridas. "Otra" muestra un campo libre. */
export const VIDEO_DURATIONS: string[] = ['6s', '15s', '30s', '60s', 'Otra']
