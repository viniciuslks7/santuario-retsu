// frontend/scripts/raptor-check.mjs
// Verifica as aves de rapina: screenshot circulando calmas e, com ?storm=1,
// screenshot depois da debandada (FLEE_SECONDS + folga).
// Uso: node scripts/raptor-check.mjs <url-base> <dir-de-saida>
import puppeteer from 'puppeteer-core'

const [base, outDir] = process.argv.slice(2)

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

  // 'load' em vez de 'networkidle0': HMR do Vite nunca deixa o idle fechar
  await page.goto(`${base}/?tod=0`, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 4000))
  await page.screenshot({ path: `${outDir}/raptors-circling.png` })
  console.log('screenshot das aves circulando salvo')

  await page.goto(`${base}/?tod=0&storm=1`, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 7000))
  await page.screenshot({ path: `${outDir}/raptors-fled.png` })
  console.log('screenshot pós-debandada salvo')
} finally {
  await browser.close()
}
