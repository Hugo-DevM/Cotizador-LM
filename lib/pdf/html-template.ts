import { COMPANY, TERMS } from '@/lib/constants/company'
import { formatDateMX } from '@/lib/utils/date'
import { formatMXN } from '@/lib/utils/currency'
import { calculateTotals } from '@/lib/calculations/totals'
import type { QuoteSchemaInput } from '@/lib/schemas/quote'

const C = {
  red: '#c00000',
  redLight: '#ffcccc',
  border: '#000000',
  borderSoft: '#cccccc',
  alt: '#f2f2f2',
  text: '#1e293b',
  muted: '#64748b',
  white: '#ffffff',
  labelBg: '#dce6f1',
} as const

const cell  = `border:1px solid ${C.border}; padding:4px 8px; font-size:9.5pt;`
const cellR = `${cell} text-align:right;`
const soft  = `border:1px solid ${C.borderSoft}; padding:4px 8px; font-size:9.5pt; word-break:break-word; overflow-wrap:break-word;`
const softR = `${soft} text-align:right;`
const softC = `${soft} text-align:center;`
const label = `${cellR} background:${C.labelBg}; font-weight:600;`

const TOTAL_ROWS = 17

export function buildQuoteHTML(data: QuoteSchemaInput): string {
  const totals = calculateTotals(data.items, data.discount, data.shipping)

  const visibleItems = data.items.filter(
    (it) => it.description.trim() || parseFloat(it.quantity) > 0
  )

  // ── 17 filas fijas de productos ──────────────────────────────────────────
  const itemRows = Array.from({ length: TOTAL_ROWS }, (_, i) => {
    const item = visibleItems[i]
    const bg = i % 2 === 0 ? C.white : C.alt
    if (item) {
      const total = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
      return `<tr style="background:${bg};min-height:22px;">
        <td style="${softC}">${item.quantity}</td>
        <td style="${soft}">${item.description}</td>
        <td style="${softR}">$${formatMXN(parseFloat(item.unitPrice) || 0)}</td>
        <td style="${softR}">$${formatMXN(total)}</td>
      </tr>`
    }
    return `<tr style="background:${bg};min-height:22px;">
      <td style="${softC}">&nbsp;</td>
      <td style="${soft}">&nbsp;</td>
      <td style="${softR}">&nbsp;</td>
      <td style="${softR}">&nbsp;</td>
    </tr>`
  }).join('')

  const termsHTML = TERMS.map((t) => `<div style="margin-bottom:3px;">${t}</div>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Cotización ${data.number}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Arial,Helvetica,sans-serif;font-size:9.5pt;background:#fff;color:${C.text};}
    @page{margin:10mm;size:letter portrait;}
    @media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}}
  </style>
</head>
<body>

<!-- ── 1. CABECERA ─────────────────────────────────────────────────────────── -->
<table style="width:100%;border-collapse:collapse;margin-bottom:0;">
  <tr>
    <td style="${cell} vertical-align:top;width:60%;padding:8px;">
      <table style="border-collapse:collapse;width:100%;">
        <tr>
          <td style="width:90px;vertical-align:top;padding-right:10px;">
            <div style="width:85px;height:85px;border:2px dashed #aaa;border-radius:4px;display:flex;align-items:center;justify-content:center;background:#f9f9f9;">
              <span style="font-size:8pt;color:#aaa;text-align:center;line-height:1.3;">LOGO</span>
            </div>
          </td>
          <td style="vertical-align:middle;">
            <div style="font-weight:700;font-size:13pt;margin-bottom:3px;color:${C.red};">${COMPANY.name}</div>
            <div style="font-size:8.5pt;color:${C.muted};margin-bottom:2px;">${COMPANY.address}</div>
            <div style="font-size:8.5pt;color:${C.muted};margin-bottom:2px;">Tel: ${COMPANY.phone}</div>
            <div style="font-size:8.5pt;color:${C.muted};margin-bottom:2px;">${COMPANY.email}</div>
            <div style="font-size:8.5pt;color:${C.muted};">${COMPANY.web}</div>
          </td>
        </tr>
      </table>
    </td>
    <td style="${cell} text-align:center;vertical-align:middle;padding:8px;">
      <div style="font-weight:800;font-size:20pt;letter-spacing:3px;color:${C.red};margin-bottom:10px;">COTIZACION</div>
      <table style="margin:0 auto;border-collapse:collapse;font-size:9pt;">
        <tr>
          <td style="border:1px solid ${C.border};padding:3px 12px;color:${C.muted};font-weight:600;">Fecha</td>
          <td style="border:1px solid ${C.border};padding:3px 12px;font-weight:700;">${formatDateMX(data.date)}</td>
        </tr>
        <tr>
          <td style="border:1px solid ${C.border};padding:3px 12px;color:${C.muted};font-weight:600;">Nº</td>
          <td style="border:1px solid ${C.border};padding:3px 12px;font-weight:700;">${data.number}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ── 2. CLIENTE / EMPRESA ────────────────────────────────────────────────── -->
<table style="width:100%;border-collapse:collapse;margin-bottom:0;">
  <tr>
    <td style="${cell} width:40%;vertical-align:top;padding:6px 8px;">
      <div style="font-size:7.5pt;font-weight:700;color:${C.muted};margin-bottom:2px;letter-spacing:.5px;">CLIENTE</div>
      <div style="font-weight:700;font-size:10.5pt;">${data.clientName || '—'}</div>
    </td>
    <td style="${cell} vertical-align:top;padding:6px 8px;">
      <div style="font-size:7.5pt;font-weight:700;color:${C.muted};margin-bottom:2px;letter-spacing:.5px;">EMPRESA</div>
      <div style="font-weight:700;font-size:10.5pt;">${data.companyName || '—'}</div>
    </td>
  </tr>
</table>

<!-- ── 3. TABLA DE PRODUCTOS (4 columnas, table-layout:fixed) ──────────────── -->
<div style="position:relative;">
  <table style="width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:0;">
    <colgroup>
      <col style="width:42px"/>
      <col/>
      <col style="width:110px"/>
      <col style="width:110px"/>
    </colgroup>
    <thead>
      <tr style="background:${C.red};color:${C.white};">
        <th style="border:1px solid ${C.red};padding:4px 6px;font-size:9.5pt;text-align:center;font-weight:700;">CANT.</th>
        <th style="border:1px solid ${C.red};padding:4px 8px;font-size:9.5pt;text-align:left;font-weight:700;">DESCRIPCIÓN</th>
        <th style="border:1px solid ${C.red};padding:4px 8px;font-size:9.5pt;text-align:right;font-weight:700;">P. UNITARIO</th>
        <th style="border:1px solid ${C.red};padding:4px 8px;font-size:9.5pt;text-align:right;font-weight:700;">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:72pt;font-weight:900;color:rgba(150,150,150,0.30);white-space:nowrap;letter-spacing:6px;pointer-events:none;z-index:2;user-select:none;">PÁGINA 1</div>
</div>

<!-- ── 4. TÉRMINOS + TOTALES ───────────────────────────────────────────────── -->
<table style="width:100%;border-collapse:collapse;margin-bottom:0;">
  <tr>
    <td style="${cell} width:55%;vertical-align:top;padding:8px;" rowspan="6">
      <div style="font-weight:700;margin-bottom:5px;">Términos y Condiciones</div>
      <div style="font-size:8.5pt;line-height:1.7;color:${C.text};">${termsHTML}</div>
    </td>
    <td style="${label}">Total parcial</td>
    <td style="${cellR}">$${formatMXN(totals.subtotal)}</td>
  </tr>
  <tr>
    <td style="${label}">Descuento ($)</td>
    <td style="${cellR}">$${formatMXN(totals.discount)}</td>
  </tr>
  <tr>
    <td style="${label}">NETO</td>
    <td style="${cellR}">$${formatMXN(totals.net)}</td>
  </tr>
  <tr>
    <td style="${label}">Impuestos (IVA 16%)</td>
    <td style="${cellR}">$${formatMXN(totals.iva)}</td>
  </tr>
  <tr>
    <td style="${label}">Envío Delivery</td>
    <td style="${cellR}">$${formatMXN(totals.shipping)}</td>
  </tr>
  <tr>
    <td style="${label} background:${C.redLight};font-size:10.5pt;font-weight:700;">TOTAL NETO</td>
    <td style="${cellR} background:${C.redLight};font-weight:700;font-size:11pt;">$${formatMXN(totals.total)}</td>
  </tr>
</table>

<!-- ── 5. PIE ──────────────────────────────────────────────────────────────── -->
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="${cell} text-align:center;font-style:italic;font-weight:700;font-size:12pt;color:${C.red};padding:12px;">
      ¡Gracias por la Preferencia!!!
    </td>
  </tr>
</table>

</body>
</html>`
}
