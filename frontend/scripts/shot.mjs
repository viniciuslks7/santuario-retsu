// Tira screenshot da cena com Chrome local e despeja o estado do santuário.
// Uso: node scripts/shot.mjs <url> <saida.png> [esperaMs]
import puppeteer from 'puppeteer-core'

const [url, out, waitMs = '5000'] = process.argv.slice(2)

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--window-size=1600,900'],
})

try {
  const page = await browser.newPage()
  page.on('pageerror', (err) => console.error('[pageerror]', err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('[console.error]', msg.text())
  })
  await page.setViewport({ width: 1600, height: 900 })
  // 'load' em vez de 'networkidle0': o HMR do Vite mantém requests pingando
  // e o idle nunca fecha — a espera fixa abaixo já cobre o carregamento dos GLB
  await page.goto(url, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, Number(waitMs)))
  const state = await page.evaluate(() => globalThis.__shrineDebug?.())
  console.log('estado:', JSON.stringify(state))
  await page.screenshot({ path: out })
  console.log('screenshot:', out)
} finally {
  await browser.close()
}
