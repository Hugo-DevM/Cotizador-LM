import type { QuoteItem, QuoteTotals } from '@/types/quote'
import { IVA_RATE } from '@/lib/constants/company'

export function calculateSubtotal(items: QuoteItem[]): number {
  return items.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
    0
  )
}

export function calculateDiscount(subtotal: number, discount: number): number {
  return Math.min(discount, subtotal)
}

export function calculateTax(net: number, rate = IVA_RATE): number {
  return Math.max(0, net) * rate
}

export function calculateGrandTotal(net: number, iva: number, shipping: number): number {
  return Math.max(0, net) + iva + shipping
}

export function calculateTotals(
  items: QuoteItem[],
  discount: number,
  shipping: number
): QuoteTotals {
  const subtotal = calculateSubtotal(items)
  const disc = Math.max(0, discount || 0)
  const net = subtotal - disc
  const iva = calculateTax(net)
  const ship = Math.max(0, shipping || 0)
  const total = calculateGrandTotal(net, iva, ship)
  return { subtotal, discount: disc, net, iva, shipping: ship, total }
}

export function rowTotal(item: QuoteItem): number {
  return (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
}
