import type { Metadata } from 'next'
import { QuotesNewClient } from './QuotesNewClient'

export const metadata: Metadata = {
  title: 'Nueva Cotización — Laptops Master',
  description: 'Genera cotizaciones profesionales de forma rápida',
}

export default function QuotesNewPage() {
  return <QuotesNewClient />
}
