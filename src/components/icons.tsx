import type { SVGProps } from 'react'
import type { PlatformId } from '../config/formats'

type P = SVGProps<SVGSVGElement>

const base = (props: P) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
})

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </svg>
)
export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
)
export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)
export const IconUpload = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
)
export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
)
export const IconLink = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
)
export const IconLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)
export const IconRight = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)
export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </svg>
)
export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)
export const IconSparkles = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
  </svg>
)
export const IconRefresh = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
  </svg>
)

/** Logos simplificados de cada plataforma. */
export function PlatformLogo({ id, size = 20 }: { id: PlatformId; size?: number }) {
  switch (id) {
    case 'meta':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Meta">
          <path
            d="M2.5 14.5c0-4 2-7.5 4.6-7.5 2.2 0 3.6 2 4.9 4.2 1.3-2.2 2.7-4.2 4.9-4.2 2.6 0 4.6 3.5 4.6 7.5 0 2.2-1 3.5-2.6 3.5-2 0-3.3-2.3-4.8-4.9L12 11.2l-2.1 1.9C8.4 15.7 7.1 18 5.1 18c-1.6 0-2.6-1.3-2.6-3.5z"
            fill="none"
            stroke="#0866FF"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'google':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Google">
          <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" fill="#4285F4" />
          <path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853" />
          <path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z" fill="#FBBC05" />
          <path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z" fill="#EA4335" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-label="TikTok">
          <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" fill="none" stroke="#25F4EE" strokeWidth="2.6" transform="translate(-0.8 -0.6)" strokeLinecap="round" />
          <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" fill="none" stroke="#FE2C55" strokeWidth="2.6" transform="translate(0.8 0.6)" strokeLinecap="round" />
          <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.4 2 4 4.5 4.3" fill="none" stroke="#111" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'chatgpt':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-label="ChatGPT">
          <g fill="none" stroke="#10A37F" strokeWidth="1.8">
            {[0, 60, 120, 180, 240, 300].map((r) => (
              <ellipse key={r} cx="12" cy="8" rx="3.2" ry="5" transform={`rotate(${r} 12 12)`} />
            ))}
          </g>
        </svg>
      )
  }
}
