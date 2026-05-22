export interface QuoteItem {
  quantity: string
  description: string
  unitPrice: string
}

export interface QuoteFormValues {
  number: string
  date: string
  clientName: string
  companyName: string
  items: QuoteItem[]
  discount: number
  shipping: number
}

export interface QuoteTotals {
  subtotal: number
  discount: number
  net: number
  iva: number
  shipping: number
  total: number
}
