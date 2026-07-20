// Verifica o jato de areia do clique: clica na areia e fotografa o burst.
// Uso: node scripts/burst-check.mjs <url> <saida.png>
import puppeteer from 'puppeteer-core'

const [url, out] = process.argv.slice(2)

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--window-size=1600,900'],
})

try {
  const page = await browser.newPage()
  page.on('pageerror', (err) => console.error('[pageerror]', err.message))
  await page.setViewport({ width: 1600, height: 900 })
  await page.goto(url, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 6000))
  // clique raso na areia (fora do círculo do santuário)
  await page.mouse.click(380, 750)
  // ~0.35s depois o burst está no auge (vida total 1.1s)
  await new Promise((r) => setTimeout(r, 350))
  await page.screenshot({ path: out })
  console.log('screenshot:', out)
} finally {
  await browser.close()
}
