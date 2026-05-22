'use client'

import { useState } from 'react'
import { QuoteForm } from '@/components/quotes/QuoteForm'
import { QuoteTemplate } from '@/templates/quote-template'
import type { QuoteFormValues } from '@/types/quote'
import { COMPANY, DEFAULT_QUOTE_NUMBER } from '@/lib/constants/company'

const LS_KEY = 'lm_last_quote_number'

function getNextQuoteNumber(): string {
  try {
    const last = localStorage.getItem(LS_KEY)
    if (last) return String(parseInt(last, 10) + 1)
  } catch { /* SSR o incognito */ }
  return DEFAULT_QUOTE_NUMBER
}

function saveQuoteNumber(n: string) {
  try { localStorage.setItem(LS_KEY, n) } catch { /* ignorar */ }
}

type View = 'form' | 'preview'

export function QuotesNewClient() {
  const [view, setView] = useState<View>('form')
  const [formData, setFormData] = useState<QuoteFormValues | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [nextNumber, setNextNumber] = useState<string>(getNextQuoteNumber)

  const handleFormSubmit = (data: QuoteFormValues) => {
    setFormData(data)
    setView('preview')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDownloadPDF = async () => {
    if (!formData) return
    setPdfLoading(true)
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cotizacion-${formData.number}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      // Guardar número usado para que el siguiente sea +1
      saveQuoteNumber(formData.number)
    } catch {
      alert('Error al generar el PDF. Por favor intente de nuevo.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleNewQuote = () => {
    const next = String(parseInt(nextNumber, 10) + 1)
    saveQuoteNumber(nextNumber)
    setNextNumber(next)
    setFormData(null)
    setView('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Vista previa ───────────────────────────────────────────────────────────
  if (view === 'preview' && formData) {
    return (
      <div className="min-h-screen bg-gray-200">
        {/* Barra de acciones */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm print:hidden">
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setView('form')}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Editar
            </button>
            <div className="flex-1" />
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {pdfLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generando PDF…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Documento */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white shadow-lg p-6 sm:p-8">
            <QuoteTemplate data={formData} />
          </div>

          {/* Botón nueva cotización */}
          <div className="mt-4 pb-8">
            <button
              onClick={handleNewQuote}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-4 rounded-xl transition-colors text-base shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Cotización
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-900 text-white px-5 py-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold leading-tight">Cotizador — {COMPANY.name}</h1>
            <p className="text-blue-300 text-xs mt-0.5">
              Completa los datos y presiona Guardar para ver la vista previa
            </p>
          </div>
          <span className="text-blue-300 text-xs hidden sm:block">{COMPANY.phone}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5">
        <QuoteForm
          onSubmit={handleFormSubmit}
          defaultValues={formData ?? { number: nextNumber }}
        />
      </main>
    </div>
  )
}
