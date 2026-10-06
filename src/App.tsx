import { useEffect, useState } from 'react'
import { useBrief, readStep, writeStep } from './state/useBrief'
import { briefCounts, clientName, countsText, formulaText, validate } from './lib/utils'
import { Step1General } from './components/Step1General'
import { Step2Pieces } from './components/Step2Pieces'
import { Step3Formats } from './components/Step3Formats'
import { Step4Summary } from './components/Step4Summary'
import { IconCheck, IconLeft, IconRefresh, IconRight } from './components/icons'

const STEPS = ['Datos generales', 'Piezas', 'Formatos', 'Resumen y PDF']

export default function App() {
  const api = useBrief()
  const { brief, savedAt } = api
  const [step, setStep] = useState(() => Math.min(readStep(), STEPS.length - 1))

  useEffect(() => {
    writeStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const issues = validate(brief)
  const stepHasError = (i: number) => issues.some((x) => x.level === 'error' && x.step === i)
  const total = briefCounts(brief)

  const reset = () => {
    if (confirm('¿Empezar una solicitud nueva? Se borrará el borrador actual.')) {
      api.reset()
      setStep(0)
    }
  }

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 pt-3 pb-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-8 w-8" />
              <div className="min-w-0">
                <h1 className="text-[15px] leading-tight font-bold text-stone-900">Brief de Artes</h1>
                <p className="truncate text-xs text-stone-500">
                  Impacto Salmón
                  {clientName(brief) && ` · ${clientName(brief)}`}
                  {brief.campaign && ` · ${brief.campaign}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <a className="btn btn-ghost text-xs" href={`${import.meta.env.BASE_URL}bitacora/`} title="Bitácora de Pauta">
                Bitácora
              </a>
              <span className="hidden text-xs text-stone-400 sm:inline">
                {savedAt ? `Borrador guardado ${savedAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : ''}
              </span>
              <button className="btn btn-ghost text-xs" onClick={reset} title="Nueva solicitud">
                <IconRefresh width={15} height={15} /> <span className="hidden sm:inline">Nueva</span>
              </button>
            </div>
          </div>

          {/* Barra de progreso */}
          <nav className="mt-3 grid grid-cols-4 gap-1.5" aria-label="Pasos">
            {STEPS.map((label, i) => {
              const done = i < step
              const current = i === step
              return (
                <button key={label} onClick={() => setStep(i)} className="group cursor-pointer text-left">
                  <div className={`h-1.5 rounded-full transition ${done || current ? 'bg-salmon-500' : 'bg-stone-200 group-hover:bg-salmon-200'}`} />
                  <div
                    className={`mt-1.5 flex items-center gap-1 text-[11px] font-semibold sm:text-xs ${
                      current ? 'text-salmon-700' : done ? 'text-stone-600' : 'text-stone-400'
                    }`}
                  >
                    {done && !stepHasError(i) ? (
                      <IconCheck width={12} height={12} strokeWidth={3} className="shrink-0" />
                    ) : (
                      <span className="shrink-0">{i + 1}.</span>
                    )}
                    <span className="truncate">{label}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Conteo total siempre visible */}
        <div className="border-t border-salmon-100 bg-salmon-50">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-1.5 text-xs sm:text-sm">
            <span className="truncate text-salmon-900">{formulaText(brief)}</span>
            <span className="shrink-0 rounded-full bg-salmon-500 px-2.5 py-0.5 text-xs font-bold text-white">
              {total.total} {total.total === 1 ? 'archivo' : 'archivos'}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {step === 0 && <Step1General api={api} />}
        {step === 1 && <Step2Pieces api={api} />}
        {step === 2 && <Step3Formats api={api} goTo={setStep} />}
        {step === 3 && <Step4Summary api={api} goTo={setStep} />}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <button className="btn btn-secondary" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <IconLeft /> Atrás
          </button>
          <span className="hidden text-sm text-stone-500 sm:block">{countsText(total)}</span>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
              {STEPS[step + 1]} <IconRight />
            </button>
          ) : (
            <span className="text-sm font-medium text-stone-500">Paso final</span>
          )}
        </div>
      </footer>
    </div>
  )
}
