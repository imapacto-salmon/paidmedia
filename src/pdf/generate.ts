import { createElement } from 'react'
import type { Brief } from '../types'
import { pdfFileName } from '../lib/utils'

/** Genera y descarga el PDF. La librería se carga solo al usarla. */
export async function downloadBriefPdf(brief: Brief) {
  const [{ pdf }, { BriefDocument }] = await Promise.all([import('@react-pdf/renderer'), import('./BriefDocument')])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(createElement(BriefDocument, { brief }) as any).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = pdfFileName(brief)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
