import type { FormatSpec } from '../config/formats'

export interface ShapeGeometry {
  outerW: number
  outerH: number
  /** Área de pantalla disponible (dentro del marco). */
  screen: { x: number; y: number; w: number; h: number }
  /** Rectángulo del arte, proporcional a la relación de aspecto. */
  art: { x: number; y: number; w: number; h: number }
}

/**
 * Calcula la silueta (teléfono o rectángulo display) y el área del arte
 * proporcional a su relación de aspecto. Se usa igual en la app y en el PDF.
 */
export function shapeGeometry(spec: Pick<FormatSpec, 'frame' | 'width' | 'height'>, scale = 1): ShapeGeometry {
  const phone = spec.frame === 'phone'
  const outerW = (phone ? 56 : 104) * scale
  const outerH = (phone ? 112 : 78) * scale
  const pad = (phone ? 4 : 5) * scale
  const top = (phone ? 10 : 12) * scale
  const bottom = (phone ? 10 : 5) * scale
  const screen = { x: pad, y: top, w: outerW - pad * 2, h: outerH - top - bottom }
  const inset = 3 * scale
  const k = Math.min((screen.w - inset * 2) / spec.width, (screen.h - inset * 2) / spec.height)
  const w = spec.width * k
  const h = spec.height * k
  return {
    outerW,
    outerH,
    screen,
    art: { x: screen.x + (screen.w - w) / 2, y: screen.y + (screen.h - h) / 2, w, h },
  }
}
