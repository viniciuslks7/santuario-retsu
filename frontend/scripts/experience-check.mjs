import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const base = process.env.RETSU_URL || 'http://127.0.0.1:5173/'
await mkdir('artifacts/review', { recursive: true })
const out = await mkdtemp(path.resolve('artifacts/review/run-'))
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const errors = []
const badResponses = []
const requests = []
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const ready = async (page) => {
  await page.waitForSelector('canvas', { timeout: 60000 })
  await page.waitForFunction(() => !document.querySelector('.scene-loading'), { timeout: 60000 })
}
const loreReady = async (page, name) => {
  await page.waitForFunction((text) => document.querySelector('.lore-panel')?.getAttribute('aria-hidden') === 'false' && document.querySelector('.lore-panel h2')?.textContent.includes(text), { timeout: 30000 }, name)
}
try {
  const page = await browser.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => requests.push(request.url()))
  page.on('response', (response) => { if (response.status() >= 400 && response.url().startsWith(base)) badResponses.push([response.status(), response.url()]) })
  await page.setViewport({ width: 1600, height: 900 })
  await page.goto(base, { waitUntil: 'load' })
  await ready(page)
  assert.equal(await page.$$eval('.artifact-card', (els) => els.length), 9)
  assert.equal(await page.$$eval('aside[inert]', (els) => els.length), 3)
  await wait(1800)
  await page.screenshot({ path: path.join(out, 'desktop.png') })
  await page.click('.intro .explore-button')
  await page.waitForSelector('.expedition-card')
  await page.click('.artifact-card')
  await loreReady(page, 'Haruki')
  await page.screenshot({ path: path.join(out, 'inspection.png') })
  const client = await page.createCDPSession()
  await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: out })
  await page.waitForSelector('.lore-panel button[title]')
  const exportButton = await page.$('.lore-panel button[title]')
  await exportButton.scrollIntoView()
  await exportButton.click()
  for (let i = 0; i < 40; i++) { if ((await readdir(out)).includes('retsu-haruki.stl')) break; await wait(200) }
  const stl = await readFile(path.join(out, 'retsu-haruki.stl'))
  assert.equal(stl.length, 84 + stl.readUInt32LE(80) * 50)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.querySelector('main').dataset.inspecting === 'false')
  await page.click('[aria-label="Configurações da experiência"]')
  await page.select('#time-of-day', 'night')
  await wait(700)
  await page.screenshot({ path: path.join(out, 'night.png') })
  await page.select('#quality', 'balanced')
  await page.select('#time-of-day', 'sunset')
  await page.click('.check-label input')
  await page.click('[aria-label="Fechar opções"]')
  const names = ['Haruki', 'Setsuna', 'Lara', 'Iwao', 'Tsumugi', 'Raiz', 'Mizuki', 'Ranmaru', 'Ky']
  for (let i = 0; i < 9; i++) {
    await page.evaluate((index) => document.querySelectorAll('.artifact-card')[index].click(), i)
    await loreReady(page, names[i])
  }
  await page.waitForFunction(() => document.querySelector('.discovery-count strong')?.textContent === '09')
  await page.waitForSelector('.storm-notice button', { timeout: 25000 })
  await page.click('.storm-notice button')
  await loreReady(page, 'Chosen')
  await page.keyboard.press('Escape')
  await page.click('.dock-tabs button:nth-child(2)')
  for (let i = 0; i < 3; i++) {
    await page.evaluate((index) => document.querySelectorAll('.place-card')[index].click(), i)
    await page.waitForFunction(() => document.querySelector('.location-panel')?.getAttribute('aria-hidden') === 'false')
    assert.ok(await page.$('.location-content h2'))
    await page.screenshot({ path: path.join(out, `place-${i}.png`) })
  }
  await page.click('[aria-label="Abrir diário e crônicas"]')
  await page.waitForSelector('dialog[open]')
  assert.equal(await page.$$eval('.chapter-nav button', (els) => els.length), 4)
  await page.click('.chapter-nav button:nth-child(2)')
  await page.screenshot({ path: path.join(out, 'journal.png') })
  await page.click('.journal-tabs button:nth-child(2)')
  assert.equal(await page.$eval('.journal-progress strong', (el) => el.textContent), '13')
  await page.click('.journal-tabs button:nth-child(3)')
  assert.ok(await page.$$eval('.glossary dt', (els) => els.length >= 8))
  await page.keyboard.press('Escape')
  assert.equal(await page.$('dialog[open]'), null)
  await page.reload({ waitUntil: 'load' })
  await ready(page)
  assert.equal(await page.$eval('.discovery-count strong', (el) => el.textContent), '09')
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await page.reload({ waitUntil: 'load' })
  await ready(page)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await page.screenshot({ path: path.join(out, 'mobile.png') })
  await page.click('.artifact-card')
  await loreReady(page, 'Haruki')
  await wait(2000)
  const geometry = await page.evaluate(() => {
    const panel = document.querySelector('.lore-panel').getBoundingClientRect()
    const canvas = document.querySelector('canvas').getBoundingClientRect()
    const dock = document.querySelector('.discovery-dock').getBoundingClientRect()
    return { separated: panel.top >= canvas.bottom - 2, aboveDock: panel.bottom <= dock.top + 6, panelHeight: panel.height }
  })
  await wait(2000)
  await page.screenshot({ path: path.join(out, 'mobile-inspection.png') })
  assert.ok(geometry.separated && geometry.aboveDock && geometry.panelHeight > 180, JSON.stringify(geometry))
  await page.click('[aria-label="Abrir diário e crônicas"]')
  await page.waitForSelector('dialog[open]')
  await page.screenshot({ path: path.join(out, 'mobile-journal.png') })
  await page.keyboard.press('Escape')
  await page.goto(`${base}?focus=invalid`, { waitUntil: 'load' })
  await ready(page)
  assert.equal(await page.$eval('main', (el) => el.dataset.inspecting), 'false')
  await page.goto(`${base}?place=oasis`, { waitUntil: 'load' })
  await ready(page)
  await page.waitForFunction(() => document.querySelector('.location-panel')?.getAttribute('aria-hidden') === 'false')
  const fallback = await browser.newPage()
  await fallback.evaluateOnNewDocument(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === 'webgl2' || type === 'webgl' ? null : original.call(this, type, ...args)
    }
  })
  await fallback.goto(base, { waitUntil: 'load' })
  await fallback.waitForFunction(() => document.querySelector('.scene-status')?.textContent.includes('Não foi possível'))
  assert.equal(await fallback.$('.scene-loading'), null)
  await fallback.click('.scene-status .text-action')
  await fallback.waitForSelector('dialog[open]')
  await fallback.close()
  assert.deepEqual(errors, [])
  assert.deepEqual(badResponses, [])
  assert.equal(requests.some((url) => new URL(url).pathname.startsWith('/api/')), false)
  console.log('PASS: static assets, catalogue, STL, nine blades + secret, 3 destinations, 4 chapters, glossary, saved progress, mobile layout, deep-links and WebGL fallback reader.')
  console.log('Screenshots:', out)
} finally { await browser.close() }
