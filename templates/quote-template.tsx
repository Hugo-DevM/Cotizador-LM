import type { QuoteFormValues } from '@/types/quote'
import { COMPANY, TERMS } from '@/lib/constants/company'
import { formatDateMX } from '@/lib/utils/date'
import { mxn } from '@/lib/utils/currency'
import { calculateTotals, rowTotal } from '@/lib/calculations/totals'

interface QuoteTemplateProps {
  data: QuoteFormValues
}

const TOTAL_ROWS = 17

const cell  = 'border border-black px-2 py-1'
const cellR = `${cell} text-right`
const soft  = 'border border-gray-300 px-2 py-1 break-words'
const softR = `${soft} text-right`
const softC = `${soft} text-center`
const lbl   = `${cellR} bg-blue-100 font-semibold`

export function QuoteTemplate({ data }: QuoteTemplateProps) {
  const totals = calculateTotals(data.items, data.discount, data.shipping)
  const visibleItems = data.items.filter(
    (it) => it.description.trim() || parseFloat(it.quantity) > 0
  )
  const rows = Array.from({ length: TOTAL_ROWS }, (_, i) => ({
    item: visibleItems[i] ?? null,
    alt: i % 2 !== 0,
  }))

  return (
    <div className="w-full font-sans text-xs">

      {/* ── 1. Cabecera ── */}
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className={`${cell} w-[60%] align-top p-2`}>
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 border-2 border-dashed border-gray-400 rounded flex items-center justify-center flex-shrink-0 bg-gray-50">
                  <span className="text-[9px] text-gray-400 text-center leading-tight">LOGO</span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-bold text-red-700 mb-1">{COMPANY.name}</p>
                  <p className="text-gray-500">{COMPANY.address}</p>
                  <p className="text-gray-500">Tel: {COMPANY.phone}</p>
                  <p className="text-gray-500">{COMPANY.email}</p>
                  <p className="text-gray-500">{COMPANY.web}</p>
                </div>
              </div>
            </td>
            <td className={`${cell} text-center align-middle p-3`}>
              <p className="text-2xl font-black tracking-widest text-red-700 mb-3">COTIZACION</p>
              <table className="mx-auto border-collapse">
                <tbody>
                  <tr>
                    <td className="border border-black px-3 py-1 text-gray-500 font-semibold">Fecha</td>
                    <td className="border border-black px-3 py-1 font-bold">{formatDateMX(data.date)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-1 text-gray-500 font-semibold">Nº</td>
                    <td className="border border-black px-3 py-1 font-bold">{data.number}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── 2. Cliente / Empresa ── */}
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className={`${cell} w-[40%] py-1.5`}>
              <p className="text-[9px] font-bold text-gray-400 tracking-wider mb-0.5">CLIENTE</p>
              <p className="font-bold text-sm">{data.clientName || '—'}</p>
            </td>
            <td className={`${cell} py-1.5`}>
              <p className="text-[9px] font-bold text-gray-400 tracking-wider mb-0.5">EMPRESA</p>
              <p className="font-bold text-sm">{data.companyName || '—'}</p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── 3. Tabla de productos (4 columnas, table-fixed) ── */}
      <table className="w-full border-collapse table-fixed">
        <colgroup>
          <col style={{ width: '42px' }} />
          <col />
          <col style={{ width: '110px' }} />
          <col style={{ width: '110px' }} />
        </colgroup>
        <thead>
          <tr className="bg-red-700 text-white">
            <th className="border border-red-700 p-1.5 text-center font-bold">CANT.</th>
            <th className="border border-red-700 p-1.5 text-left font-bold">DESCRIPCIÓN</th>
            <th className="border border-red-700 p-1.5 text-right font-bold">P. UNITARIO</th>
            <th className="border border-red-700 p-1.5 text-right font-bold">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ item, alt }, i) => (
            <tr key={i} className={alt ? 'bg-gray-100' : 'bg-white'} style={{ minHeight: '22px' }}>
              <td className={softC}>{item?.quantity ?? '\u00a0'}</td>
              <td className={soft}>{item?.description ?? '\u00a0'}</td>
              <td className={softR}>{item ? mxn(parseFloat(item.unitPrice) || 0) : '\u00a0'}</td>
              <td className={softR}>{item ? mxn(rowTotal(item)) : '\u00a0'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── 4. Términos + Totales ── */}
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className={`${cell} w-[55%] align-top p-2`} rowSpan={6}>
              <p className="font-bold mb-1.5">Términos y Condiciones</p>
              <div className="leading-relaxed space-y-0.5">
                {TERMS.map((t, i) => <p key={i}>{t}</p>)}
              </div>
            </td>
            <td className={lbl}>Total parcial</td>
            <td className={cellR}>{mxn(totals.subtotal)}</td>
          </tr>
          <tr>
            <td className={lbl}>Descuento ($)</td>
            <td className={cellR}>{mxn(totals.discount)}</td>
          </tr>
          <tr>
            <td className={lbl}>NETO</td>
            <td className={cellR}>{mxn(totals.net)}</td>
          </tr>
          <tr>
            <td className={lbl}>Impuestos (IVA 16%)</td>
            <td className={cellR}>{mxn(totals.iva)}</td>
          </tr>
          <tr>
            <td className={lbl}>Envío Delivery</td>
            <td className={cellR}>{mxn(totals.shipping)}</td>
          </tr>
          <tr>
            <td className={`${cellR} bg-red-200 font-bold text-sm`}>TOTAL NETO</td>
            <td className={`${cellR} bg-red-200 font-bold text-sm`}>{mxn(totals.total)}</td>
          </tr>
        </tbody>
      </table>

      {/* ── 5. Pie ── */}
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className={`${cell} text-center italic font-bold text-red-700 text-sm p-3`}>
              ¡Gracias por la Preferencia!!!
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  )
}
