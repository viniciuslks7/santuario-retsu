// Verifica a tempestade de areia: abre com ?storm=1, espera a intensidade
// subir e tira screenshots (tempestade vs. cena calma) pra inspeção visual.
// Uso: node scripts/storm-check.mjs <url-base> <dir-de-saida>
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
  await page.goto(`${base}/?tod=0&storm=1`, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 9000))
  await page.screenshot({ path: `${outDir}/storm-on.png` })
  console.log('screenshot da tempestade salvo')

  await page.goto(`${base}/?tod=0`, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 9000))
  await page.screenshot({ path: `${outDir}/storm-off.png` })
  console.log('screenshot da cena calma salvo')
} finally {
  await browser.close()
}
