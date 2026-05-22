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

async function fetchPDFBlob(formData: QuoteFormValues): Promise<Blob> {
  const res = await fetch('/api/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.blob()
}

type View = 'form' | 'preview'

export function QuotesNewClient() {
  const [view, setView] = useState<View>('form')
  const [formData, setFormData] = useState<QuoteFormValues | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [waLoading, setWaLoading] = useState(false)
  const [nextNumber, setNextNumber] = useState<string>(getNextQuoteNumber)
  const [showWaInput, setShowWaInput] = useState(false)
  const [waPhone, setWaPhone] = useState('')

  const handleFormSubmit = (data: QuoteFormValues) => {
    setFormData(data)
    setView('preview')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDownloadPDF = async () => {
    if (!formData) return
    setPdfLoading(true)
    try {
      const blob = await fetchPDFBlob(formData)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cotizacion-${formData.number}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      saveQuoteNumber(formData.number)
    } catch {
      alert('Error al generar el PDF. Por favor intente de nuevo.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleWhatsApp = async () => {
    if (!formData) return
    setWaLoading(true)
    try {
      const blob = await fetchPDFBlob(formData)
      const file = new File([blob], `cotizacion-${formData.number}.pdf`, { type: 'application/pdf' })

      // Web Share API con archivo (móvil: abre contactos nativamente)
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Cotización ${formData.number}`,
          text: `Cotización N° ${formData.number} — ${COMPANY.name}`,
        })
        saveQuoteNumber(formData.number)
      } else {
        // Fallback desktop: input de número
        setShowWaInput(true)
      }
    } catch (e) {
      // El usuario canceló el share — no mostrar error
      if (e instanceof Error && e.name !== 'AbortError') {
        alert('No se pudo compartir el PDF.')
      }
    } finally {
      setWaLoading(false)
    }
  }

  const handleSendWaLink = () => {
    const phone = waPhone.replace(/\D/g, '')
    if (!phone) return
    const msg = encodeURIComponent(`Cotización N° ${formData?.number} — ${COMPANY.name}`)
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
    setShowWaInput(false)
    setWaPhone('')
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

            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              disabled={waLoading}
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {waLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.126 1.532 5.862L.057 23.486a.5.5 0 00.609.61l5.748-1.505A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 01-5.101-1.402l-.361-.214-3.781.99.998-3.688-.235-.375A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
              )}
              WhatsApp
            </button>

            {/* Descargar PDF */}
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
                  Generando…
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

          {/* Fallback: input número WhatsApp (desktop) */}
          {showWaInput && (
            <div className="max-w-4xl mx-auto px-4 pb-3 flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">Número WhatsApp:</span>
              <input
                type="tel"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendWaLink()}
                placeholder="52 322 117 7653"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                autoFocus
              />
              <button
                onClick={handleSendWaLink}
                className="bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                Enviar
              </button>
              <button
                onClick={() => { setShowWaInput(false); setWaPhone('') }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none px-1"
              >
                ×
              </button>
            </div>
          )}
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
