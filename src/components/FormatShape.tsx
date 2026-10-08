import type { FormatSpec } from '../config/formats'
import { shapeGeometry } from '../lib/shape'

/**
 * Silueta de teléfono o rectángulo display con el área del arte proporcional.
 * Usa las variables de color del tema: en el Brief se ve en salmón y en la Bitácora en grises.
 */
export function FormatShape({
  spec,
  active,
  scale = 1,
  color = 'var(--color-salmon-500, #f26b5b)',
}: {
  spec: Pick<FormatSpec, 'frame' | 'width' | 'height' | 'ratio'>
  active?: boolean
  scale?: number
  color?: string
}) {
  const g = shapeGeometry(spec, scale)
  const phone = spec.frame === 'phone'
  return (
    <div
      className="relative shrink-0"
      style={{
        width: g.outerW,
        height: g.outerH,
        borderRadius: (phone ? 10 : 5) * scale,
        border: `${1.5 * scale}px solid ${active ? 'var(--color-stone-700, #44403c)' : 'var(--color-stone-400, #a8a29e)'}`,
        background: 'var(--color-stone-50, #fafaf9)',
      }}
    >
      {phone ? (
        <span
          className="absolute rounded-full"
          style={{ left: '50%', top: 4 * scale, width: 14 * scale, height: 2.5 * scale, transform: 'translateX(-50%)', background: 'var(--color-stone-400, #a8a29e)' }}
        />
      ) : (
        <span className="absolute flex gap-[2px]" style={{ left: 5 * scale, top: 4 * scale }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="rounded-full" style={{ width: 3 * scale, height: 3 * scale, background: 'var(--color-stone-400, #a8a29e)' }} />
          ))}
        </span>
      )}
      <span
        className="absolute"
        style={{ left: g.screen.x, top: g.screen.y, width: g.screen.w, height: g.screen.h, background: 'var(--color-stone-200, #e7e5e4)', borderRadius: 2 * scale }}
      />
      <span
        className="absolute flex items-center justify-center font-bold transition-colors"
        style={{
          left: g.art.x,
          top: g.art.y,
          width: g.art.w,
          height: g.art.h,
          background: active ? color : 'var(--color-stone-300, #d6d3d1)',
          color: active ? 'var(--color-white, #fff)' : 'var(--color-stone-500, #78716c)',
          fontSize: Math.max(8, 9 * scale),
          borderRadius: 1.5 * scale,
        }}
      >
        {spec.ratio}
      </span>
    </div>
  )
}
