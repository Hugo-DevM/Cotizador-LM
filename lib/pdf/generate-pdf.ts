import puppeteer from 'puppeteer'

export async function generateQuotePDF(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 816, height: 1056 })
    await page.setContent(html, { waitUntil: 'domcontentloaded' })

    // Escalar contenido para llenar hoja Carta completa (1056px - márgenes ~76px = 980px)
    const contentHeight = await page.evaluate(() => document.body.scrollHeight)
    const letterContentHeight = 940

    if (contentHeight > 0 && contentHeight < letterContentHeight) {
      const scale = letterContentHeight / contentHeight
      await page.evaluate((s) => {
        document.body.style.zoom = String(s)
        document.body.style.transformOrigin = 'top left'
      }, scale)
    }

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
