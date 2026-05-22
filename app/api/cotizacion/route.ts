import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'

interface ItemInput {
  cantidad: string
  descripcion: string
  precioUnitario: string
}

interface CotizacionPayload {
  numero: string
  fecha: string
  cliente: string
  empresa: string
  items: ItemInput[]
  descuento: number
  envio: number
}

function setNum(ws: XLSX.WorkSheet, addr: string, v: number, f?: string) {
  ws[addr] = f ? { v, t: 'n', f } : { v, t: 'n' }
}

function setStr(ws: XLSX.WorkSheet, addr: string, v: string) {
  if (v) {
    ws[addr] = { v, t: 's' }
  } else {
    delete ws[addr]
  }
}

export async function POST(req: NextRequest) {
  const body: CotizacionPayload = await req.json()
  console.log('[cotizacion] body recibido:', JSON.stringify(body, null, 2))

  const tplPath = path.join(process.cwd(), 'public', 'COTIZADOR_TEMPLATE.xlsx')
  const wb = XLSX.read(fs.readFileSync(tplPath), { type: 'buffer' })
  const ws = wb.Sheets['ProForma']

  // Fecha → Excel date serial (days since Dec 30 1899)
  const d = new Date(body.fecha + 'T12:00:00')
  const epoch = new Date(1899, 11, 30)
  const serial = Math.floor((d.getTime() - epoch.getTime()) / 86400000)
  ws['H7'] = { v: serial, t: 'n', z: 'DD/MM/YYYY' }

  // Numero
  setNum(ws, 'H9', parseInt(body.numero) || 0)

  // Cliente / Empresa
  setStr(ws, 'C14', body.cliente)
  setStr(ws, 'F14', body.empresa)

  // Items — rows 20‥36 (17 filas disponibles)
  const MAX = 17
  let totalParcial = 0

  for (let i = 0; i < MAX; i++) {
    const row = 20 + i
    const item = body.items[i]
    if (item) {
      const qty = parseFloat(item.cantidad) || 0
      const price = parseFloat(item.precioUnitario) || 0
      const total = qty * price
      totalParcial += total
      setNum(ws, `C${row}`, qty)
      setStr(ws, `D${row}`, item.descripcion)
      setNum(ws, `G${row}`, price)
      setNum(ws, `H${row}`, total, `(C${row}*G${row})`)
    } else {
      delete ws[`C${row}`]
      delete ws[`D${row}`]
      delete ws[`G${row}`]
      setNum(ws, `H${row}`, 0, `(C${row}*G${row})`)
    }
  }

  // Totales
  const desc = body.descuento || 0
  const neto = totalParcial - desc
  const iva = neto * 0.16
  const env = body.envio || 0
  const totalNeto = neto + iva + env

  setNum(ws, 'H38', totalParcial, 'SUM(H20:H36)')
  setNum(ws, 'H39', desc)
  setNum(ws, 'H40', neto, '(H38-H39)')
  setNum(ws, 'H41', iva, 'H40*16%')
  setNum(ws, 'H42', env)
  setNum(ws, 'H43', totalNeto, '(H40+H41+H42)')

  const uint8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array
  // Copia exacta para evitar problemas con el pool de memoria
  const outBuffer = new Uint8Array(uint8).buffer as ArrayBuffer

  return new NextResponse(outBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="cotizacion-${body.numero}.xlsx"`,
    },
  })
}
