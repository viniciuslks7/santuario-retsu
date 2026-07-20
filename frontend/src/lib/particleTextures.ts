/**
 * Texturas procedurais de partícula desenhadas em canvas — nenhum asset
 * externo, mesma filosofia do áudio (windAudio/weaponAudio). Cada textura é
 * uma máscara branca com alpha (a cor vem do material + instanceColor) e é
 * gerada uma única vez por sessão (cache por chave).
 *
 * RNG com semente fixa: a mesma textura em todo reload — nada de poeira
 * "diferente" entre screenshots de verificação.
 */
import * as THREE from 'three'

const cache = new Map<string, THREE.CanvasTexture>()

/** mulberry32 — RNG determinístico barato. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeTexture(
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const hit = cache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  draw(ctx, width, height)
  const tex = new THREE.CanvasTexture(canvas)
  cache.set(key, tex)
  return tex
}

/** Máscara radial suave por cima do que já foi desenhado (mata borda dura). */
function radialMask(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.65, 'rgba(255,255,255,0.8)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.globalCompositeOperation = 'destination-in'
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'
}

/** Nuvem de poeira: montinho irregular de manchas suaves com falloff radial. */
export function getPuffTexture() {
  return makeTexture('puff', 128, 128, (ctx, w, h) => {
    const rand = rng(7)
    const c = w / 2
    // base tênue pra nuvem ter corpo
    const base = ctx.createRadialGradient(c, c, 0, c, c, c)
    base.addColorStop(0, 'rgba(255,255,255,0.55)')
    base.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = base
    ctx.fillRect(0, 0, w, h)
    // manchas deslocadas quebram a simetria — poeira não é bola
    for (let i = 0; i < 26; i++) {
      const a = rand() * Math.PI * 2
      const d = rand() * c * 0.55
      const x = c + Math.cos(a) * d
      const y = c + Math.sin(a) * d
      const r = c * (0.14 + rand() * 0.24)
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(255,255,255,${0.06 + rand() * 0.13})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }
    radialMask(ctx, w, h)
  })
}

/** Risco de areia: fibras horizontais que somem nas pontas — 4:1 de aspecto. */
export function getStreakTexture() {
  return makeTexture('streak', 128, 32, (ctx, w, h) => {
    const rand = rng(23)
    ctx.filter = 'blur(1.2px)'
    for (let i = 0; i < 9; i++) {
      const y = h * (0.15 + rand() * 0.7)
      const thick = 1 + rand() * 2.4
      ctx.fillStyle = `rgba(255,255,255,${0.35 + rand() * 0.55})`
      ctx.fillRect(w * rand() * 0.25, y, w * (0.55 + rand() * 0.45), thick)
    }
    ctx.filter = 'none'
    // fade nas pontas (eixo do vento)
    const gx = ctx.createLinearGradient(0, 0, w, 0)
    gx.addColorStop(0, 'rgba(255,255,255,0)')
    gx.addColorStop(0.25, 'rgba(255,255,255,1)')
    gx.addColorStop(0.75, 'rgba(255,255,255,1)')
    gx.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = gx
    ctx.fillRect(0, 0, w, h)
    // fade em cima/embaixo
    const gy = ctx.createLinearGradient(0, 0, 0, h)
    gy.addColorStop(0, 'rgba(255,255,255,0)')
    gy.addColorStop(0.5, 'rgba(255,255,255,1)')
    gy.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gy
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  })
}

/** Glow suave com núcleo quente — auras aditivas (esporos, fios, fluxo). */
export function getGlowTexture() {
  return makeTexture('glow', 64, 64, (ctx, w, h) => {
    const c = w / 2
    const g = ctx.createRadialGradient(c, c, 0, c, c, c)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)')
    g.addColorStop(0.6, 'rgba(255,255,255,0.15)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

/** Faísca em estrela: núcleo + dois raios finos cruzados. */
export function getSparkTexture() {
  return makeTexture('spark', 64, 64, (ctx, w, h) => {
    const c = w / 2
    const core = ctx.createRadialGradient(c, c, 0, c, c, c * 0.35)
    core.addColorStop(0, 'rgba(255,255,255,1)')
    core.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = core
    ctx.fillRect(0, 0, w, h)
    // raios: gradiente radial achatado em cada eixo
    for (const rot of [0, Math.PI / 2]) {
      ctx.save()
      ctx.translate(c, c)
      ctx.rotate(rot)
      ctx.scale(1, 0.1)
      const ray = ctx.createRadialGradient(0, 0, 0, 0, 0, c)
      ray.addColorStop(0, 'rgba(255,255,255,0.9)')
      ray.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = ray
      ctx.fillRect(-c, -c * 10, w, h * 10)
      ctx.restore()
    }
  })
}

/** Floco de cinza: polígono irregular de bordas macias, meio translúcido. */
export function getAshTexture() {
  return makeTexture('ash', 64, 64, (ctx, w, h) => {
    const rand = rng(41)
    const c = w / 2
    ctx.filter = 'blur(1.5px)'
    ctx.beginPath()
    const spikes = 9
    for (let i = 0; i <= spikes; i++) {
      const a = (i / spikes) * Math.PI * 2
      const r = c * (0.35 + rand() * 0.4)
      const x = c + Math.cos(a) * r
      const y = c + Math.sin(a) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fill()
    ctx.filter = 'none'
    radialMask(ctx, w, h)
  })
}

/** Gota: lágrima com ponta pra cima e brilho deslocado (bloodrise da Lara). */
export function getDropTexture() {
  return makeTexture('drop', 64, 64, (ctx, w, h) => {
    const c = w / 2
    const cy = h * 0.62
    const r = w * 0.26
    ctx.filter = 'blur(0.8px)'
    ctx.beginPath()
    ctx.moveTo(c, h * 0.08)
    ctx.bezierCurveTo(c + r * 1.1, cy - r * 0.9, c + r, cy + r * 0.7, c, cy + r)
    ctx.bezierCurveTo(c - r, cy + r * 0.7, c - r * 1.1, cy - r * 0.9, c, h * 0.08)
    ctx.closePath()
    const g = ctx.createRadialGradient(c - r * 0.35, cy - r * 0.3, 0, c, cy, r * 1.5)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.55, 'rgba(255,255,255,0.75)')
    g.addColorStop(1, 'rgba(255,255,255,0.35)')
    ctx.fillStyle = g
    ctx.fill()
    ctx.filter = 'none'
  })
}
