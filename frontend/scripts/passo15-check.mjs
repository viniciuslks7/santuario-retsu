// Verifica o Passo 15: meio-dia polido (?tod=0.76), contraluz do Ranmaru
// (?focus=ranmaru) e a recompensa da Sem-Nome desperta (stormPhase 'done'
// via __shrineStore + inspeção da chosen com o adendo no painel de lore).
// Uso: node scripts/passo15-check.mjs <url-base> <dir-de-saida>
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
  await page.goto(`${base}/?tod=0.76`, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 9000))
  await page.screenshot({ path: `${outDir}/noon.png` })
  console.log('screenshot do meio-dia salvo')

  await page.goto(`${base}/?tod=0&focus=ranmaru`, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 9000))
  await page.screenshot({ path: `${outDir}/ranmaru-contraluz.png` })
  console.log('screenshot do contraluz do ranmaru salvo')

  await page.goto(`${base}/?tod=0`, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 9000))
  // desperta a Sem-Nome sem inspecionar as nove lâminas (handle só em dev)
  await page.evaluate(() => window.__shrineStore.setState({ stormPhase: 'done' }))
  await new Promise((r) => setTimeout(r, 4000))
  await page.screenshot({ path: `${outDir}/awakened-beacon.png` })
  console.log('screenshot do farol da desperta salvo')

  await page.evaluate(() => window.__shrineStore.getState().select('chosen'))
  await new Promise((r) => setTimeout(r, 6000))
  await page.screenshot({ path: `${outDir}/awakened-lore.png` })
  // toLowerCase: a classe `uppercase` transforma o texto renderizado e o
  // innerText do Chrome devolve já em maiúsculas
  const hasAddendum = await page.evaluate(() =>
    document.body.innerText.toLowerCase().includes('depois da tempestade'),
  )
  console.log(hasAddendum ? 'adendo da desperta presente no painel' : 'FALHA: adendo ausente')
  if (!hasAddendum) process.exitCode = 1
} finally {
  await browser.close()
}
