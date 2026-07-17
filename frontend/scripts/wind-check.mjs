// Verifica o toggle do vento: clica no botão do Hud e confere que o
// AudioContext foi criado e está rodando. Uso: node scripts/wind-check.mjs <url>
import puppeteer from 'puppeteer-core'

const [url] = process.argv.slice(2)

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
  // espiona o construtor pra enxergar o estado do contexto sem expor nada no app
  await page.evaluateOnNewDocument(() => {
    const Original = globalThis.AudioContext
    globalThis.AudioContext = class extends Original {
      constructor(...args) {
        super(...args)
        globalThis.__windCtx = this
      }
    }
  })
  await page.setViewport({ width: 1600, height: 900 })
  // 'load' em vez de 'networkidle0': HMR do Vite nunca deixa o idle fechar
  await page.goto(url, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 6000))

  const findButton = async () => {
    const handle = await page.evaluateHandle(() =>
      [...document.querySelectorAll('button')].find((b) => b.textContent.includes('som')),
    )
    return handle.asElement()
  }

  const button = await findButton()
  if (!button) throw new Error('botão do vento não encontrado')
  console.log('antes do clique:', await button.evaluate((b) => b.textContent.trim()))

  await button.click()
  await new Promise((r) => setTimeout(r, 1500))
  console.log('depois do clique:', await (await findButton()).evaluate((b) => b.textContent.trim()))
  console.log(
    'AudioContext:',
    await page.evaluate(() => globalThis.__windCtx?.state ?? 'não criado'),
  )

  await (await findButton()).click()
  await new Promise((r) => setTimeout(r, 500))
  console.log('após mutar:', await (await findButton()).evaluate((b) => b.textContent.trim()))
} finally {
  await browser.close()
}
