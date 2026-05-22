import { NextRequest, NextResponse } from 'next/server'
import { QuoteSchema } from '@/lib/schemas/quote'
import { buildQuoteHTML } from '@/lib/pdf/html-template'
import { generateQuotePDF } from '@/lib/pdf/generate-pdf'

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = QuoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const html = buildQuoteHTML(parsed.data)
  const pdfBuf = await generateQuotePDF(html)
  const outBuffer = new Uint8Array(pdfBuf).buffer as ArrayBuffer

  return new NextResponse(outBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cotizacion-${parsed.data.number}.pdf"`,
    },
  })
}
