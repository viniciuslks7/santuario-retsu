// Gera os GLB das armas do Clã Retsu em public/models/ — agora com geometria
// rica E uma animação "idle" embutida em cada arquivo (AnimationClip exportado
// no próprio GLB, tocado por useAnimations no app).
//
// Uso: node tools/build-models.mjs
//
// Convenções:
//  - material "glow"  → emissivo da cor do irmão; o app anima a intensidade.
//  - nós nomeados (spin/orbit/core/sway…) são alvos das KeyframeTracks.
//  - lâminas usam ExtrudeGeometry (silhueta 2D + bevel) p/ um corpo coeso.
import * as THREE from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// GLTFExporter usa FileReader pra montar o GLB binário; Node não tem.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf
      this.onloadend?.({ target: this })
    })
  }
}

const OUT_DIR = fileURLToPath(new URL('../public/models/', import.meta.url))
const IDLE = 6 // período base da animação idle, em segundos

// ── Materiais ─────────────────────────────────────────────────────────────
const mat = (name, color, opts = {}) =>
  new THREE.MeshStandardMaterial({ name, color, roughness: 0.6, ...opts })

const glowMat = (emissive) =>
  new THREE.MeshStandardMaterial({
    name: 'glow',
    color: '#15110d',
    emissive,
    emissiveIntensity: 1.2,
    roughness: 0.4,
    metalness: 0.1,
  })

const steel = () => mat('steel', '#c8ccd4', { metalness: 0.9, roughness: 0.22 })
const polishedSteel = () => mat('steelHi', '#e6e9ef', { metalness: 0.95, roughness: 0.12 })
const darkIron = () => mat('darkIron', '#3d3f45', { metalness: 0.8, roughness: 0.45 })
const blackIron = () => mat('blackIron', '#202227', { metalness: 0.85, roughness: 0.5 })
const gold = () => mat('gold', '#caa23a', { metalness: 1, roughness: 0.3 })
const wood = () => mat('wood', '#5a4632', { roughness: 0.85 })

// ── Helpers de montagem ────────────────────────────────────────────────────
function add(parent, geometry, material, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], name } = {}) {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(...p)
  m.rotation.set(...r)
  m.scale.set(...s)
  if (name) m.name = name
  parent.add(m)
  return m
}

function group(parent, { p = [0, 0, 0], r = [0, 0, 0], name } = {}) {
  const g = new THREE.Group()
  g.position.set(...p)
  g.rotation.set(...r)
  if (name) g.name = name
  parent.add(g)
  return g
}

/** Perfil revolucionado (cabo, urna, eixo). profile = [[raio, y], …]. */
function lathe(profile, material, { segments = 18, p = [0, 0, 0], r = [0, 0, 0], name } = {}) {
  const pts = profile.map(([radius, y]) => new THREE.Vector2(radius, y))
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, segments), material)
  m.position.set(...p)
  m.rotation.set(...r)
  if (name) m.name = name
  return m
}

/** Lâmina sólida a partir de uma silhueta 2D (XY) extrudada com bisel. */
function extrudeBlade(shape, thickness, material, { bevel = 0.014, segments = 2, p = [0, 0, 0], r = [0, 0, 0], name } = {}) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: segments,
    steps: 1,
  })
  geo.center()
  const m = new THREE.Mesh(geo, material)
  m.position.set(...p)
  m.rotation.set(...r)
  if (name) m.name = name
  return m
}

/** Silhueta de lâmina reta com ponta simétrica (katana/montante estilizado). */
function bladeShape(len, w, tipFrac = 0.18) {
  const s = new THREE.Shape()
  const t = len * (1 - tipFrac)
  s.moveTo(-w / 2, 0)
  s.lineTo(w / 2, 0)
  s.lineTo(w / 2, t)
  s.lineTo(0, len)
  s.lineTo(-w / 2, t)
  s.closePath()
  return s
}

/** Silhueta denteada e irregular — a lâmina brutalizada da Chosen. */
function jaggedBladeShape(len, w) {
  const s = new THREE.Shape()
  const steps = 9
  s.moveTo(-w / 2, 0)
  s.lineTo(w / 2, 0)
  for (let i = 1; i <= steps; i++) {
    const y = (i / steps) * len * 0.84
    // dentes fundos e irregulares na gume (vale quase até o eixo da lâmina)
    const jut = i % 2 === 0 ? w * (0.5 + (i % 4 === 0 ? 0.1 : 0)) : w * 0.12
    s.lineTo(jut, y)
  }
  // ponta quebrada: degrau diagonal em vez de ponta limpa
  s.lineTo(w * 0.3, len * 0.9)
  s.lineTo(w * 0.05, len * 0.86)
  s.lineTo(-w * 0.18, len)
  for (let i = steps; i >= 1; i--) {
    const y = (i / steps) * len * 0.84
    const sp = -w / 2 - (i % 3 === 0 ? 0.08 : 0) // dorso lascado
    s.lineTo(sp, y)
  }
  s.closePath()
  return s
}

/** Punho enrolado (tsuka-ito): losangos alternados ao longo do cabo. */
function wrappedHandle(parent, { y = 0, length = 0.62, radius = 0.055, mat: wm, p = [0, 0, 0] }) {
  const g = group(parent, { p })
  add(g, new THREE.CylinderGeometry(radius, radius * 1.05, length, 12), wm, { p: [0, y, 0] })
  const wraps = Math.round(length / 0.082)
  for (let i = 0; i < wraps; i++) {
    const wy = y - length / 2 + 0.05 + i * (length / wraps)
    add(g, new THREE.BoxGeometry(radius * 2.4, 0.028, radius * 2.4), blackIron(), {
      p: [0, wy, 0],
      r: [0, 0, i % 2 === 0 ? 0.5 : -0.5],
    })
  }
  return g
}

/** Telhado de pagode (várias águas empilhadas) — usado nas torres da fortaleza
 *  e como motivo, mas mantido aqui só por completude; armas não usam. */

// ── Helpers de animação (KeyframeTracks → AnimationClip embutido) ────────────
/** Rotação contínua em torno de um eixo, em passos de 120° (slerp exato). */
function spinTrack(name, period = IDLE, axis = new THREE.Vector3(0, 1, 0)) {
  const times = [0, period / 3, (2 * period) / 3, period]
  const values = []
  const q = new THREE.Quaternion()
  for (let i = 0; i < 4; i++) {
    q.setFromAxisAngle(axis, (i / 3) * Math.PI * 2)
    values.push(q.x, q.y, q.z, q.w)
  }
  return new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, values)
}

/** Órbita: posição local percorrendo um círculo no plano XZ (poligonal suave). */
function orbitTrack(name, { radius, period = IDLE, phase = 0, y = 0, n = 24 }) {
  const times = [], values = []
  for (let i = 0; i <= n; i++) {
    times.push((i / n) * period)
    const a = phase + (i / n) * Math.PI * 2
    values.push(Math.cos(a) * radius, y, Math.sin(a) * radius)
  }
  return new THREE.VectorKeyframeTrack(`${name}.position`, times, values)
}

/** Flutuação vertical senoidal (bob). */
function bobTrack(name, { base = [0, 0, 0], amp = 0.06, period = IDLE, phase = 0, n = 16 }) {
  const times = [], values = []
  for (let i = 0; i <= n; i++) {
    times.push((i / n) * period)
    const y = base[1] + Math.sin(phase + (i / n) * Math.PI * 2) * amp
    values.push(base[0], y, base[2])
  }
  return new THREE.VectorKeyframeTrack(`${name}.position`, times, values)
}

/** Pulsação de escala uniforme. */
function pulseTrack(name, { base = 1, amp = 0.12, period = IDLE, phase = 0, n = 16 }) {
  const times = [], values = []
  for (let i = 0; i <= n; i++) {
    times.push((i / n) * period)
    const s = base + Math.sin(phase + (i / n) * Math.PI * 2) * amp
    values.push(s, s, s)
  }
  return new THREE.VectorKeyframeTrack(`${name}.scale`, times, values)
}

/** Balanço: pequena oscilação angular em torno de um eixo, sobre uma base. */
function swayTrack(name, { axis = new THREE.Vector3(0, 0, 1), amp = 0.08, period = IDLE, phase = 0, baseEuler = [0, 0, 0], n = 16 }) {
  const base = new THREE.Quaternion().setFromEuler(new THREE.Euler(...baseEuler))
  const q = new THREE.Quaternion(), d = new THREE.Quaternion()
  const times = [], values = []
  for (let i = 0; i <= n; i++) {
    times.push((i / n) * period)
    d.setFromAxisAngle(axis, Math.sin(phase + (i / n) * Math.PI * 2) * amp)
    q.copy(base).multiply(d)
    values.push(q.x, q.y, q.z, q.w)
  }
  return new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, values)
}

// ════════════════════════════════════════════════════════════════════════════
// ARMAS  — cada builder devolve { group, tracks }
// ════════════════════════════════════════════════════════════════════════════

// 1. Haruki — nodachi selada, longa e coberta de teias
function buildHaruki() {
  const g = new THREE.Group()
  const saya = mat('saya', '#3b2e21', { roughness: 0.78 })
  const wrap = mat('wrap', '#6b5a3e', { roughness: 0.9 })
  const web = mat('web', '#cfc9ba', { roughness: 1 })
  add(g, new THREE.BoxGeometry(0.16, 2.4, 0.42), saya, { p: [0, 0.05, 0] })
  g.add(lathe([[0, -1.3], [0.085, -1.22], [0.11, -1.08], [0.085, -1.0]], saya, { segments: 12 }))
  for (const y of [-0.7, -0.2, 0.3, 0.85]) {
    add(g, new THREE.BoxGeometry(0.2, 0.1, 0.45), wrap, { p: [0, y, 0] })
    add(g, new THREE.BoxGeometry(0.21, 0.024, 0.46), blackIron(), { p: [0, y - 0.07, 0] })
  }
  // selo (ofuda) — núcleo que respira
  const seal = group(g, { p: [0, 1.18, 0], name: 'core' })
  add(seal, new THREE.BoxGeometry(0.19, 0.32, 0.44), mat('paper', '#d9cdb0', { roughness: 1 }))
  add(seal, new THREE.BoxGeometry(0.045, 0.3, 0.45), glowMat('#7cb342'))
  add(g, new THREE.CylinderGeometry(0.16, 0.18, 0.05, 12), gold(), { p: [0, 1.4, 0] })
  g.add(lathe([[0.05, 0], [0.21, 0.01], [0.22, 0.05], [0.05, 0.06]], darkIron(), { segments: 16, p: [0, 1.46, 0] }))
  wrappedHandle(g, { y: 1.85, length: 0.66, radius: 0.058, mat: wrap })
  add(g, new THREE.SphereGeometry(0.08, 12, 8), gold(), { p: [0, 2.22, 0], s: [1, 0.7, 1] })
  // teias que balançam
  const webs = group(g, { p: [0, 1.45, 0], name: 'sway' })
  for (const [x, y, z, sc] of [[0.13, 0.05, 0.18, 1], [-0.12, -0.13, -0.16, 0.7], [0.1, 0.17, 0.16, 0.5]]) {
    add(webs, new THREE.SphereGeometry(0.1 * sc, 7, 4), web, { p: [x, y, z], s: [1, 0.25, 1] })
  }
  return {
    group: g,
    tracks: [
      pulseTrack('core', { base: 1, amp: 0.06, period: 3 }),
      swayTrack('sway', { axis: new THREE.Vector3(0, 0, 1), amp: 0.06, period: 5 }),
    ],
  }
}

// 2. Setsuna — katana de iaijutsu, com anel temporal girando
function buildSetsuna() {
  const g = new THREE.Group()
  const blade = extrudeBlade(bladeShape(1.7, 0.17), 0.05, steel(), { p: [0, 0.6, 0] })
  g.add(blade)
  add(g, new THREE.BoxGeometry(0.016, 1.55, 0.022), glowMat('#90caf9'), { p: [0.075, 0.58, 0] }) // hi (sulco)
  add(g, new THREE.CylinderGeometry(0.1, 0.11, 0.1, 12), gold(), { p: [0, -0.28, 0] })
  g.add(lathe([[0.05, 0], [0.16, 0.005], [0.165, 0.03], [0.05, 0.035]], blackIron(), { segments: 20, p: [0, -0.36, 0] }))
  add(g, new THREE.TorusGeometry(0.155, 0.012, 8, 24), gold(), { p: [0, -0.345, 0], r: [Math.PI / 2, 0, 0] })
  wrappedHandle(g, { y: -0.68, length: 0.6, radius: 0.05, mat: mat('wrap', '#1f2a3a') })
  add(g, new THREE.SphereGeometry(0.06, 12, 8), darkIron(), { p: [0, -1.0, 0], s: [1, 0.7, 1] })
  // anel temporal girando à frente da ponta
  const ring = group(g, { p: [0, 1.35, 0.12], r: [0.5, 0, 0], name: 'spin' })
  add(ring, new THREE.TorusGeometry(0.2, 0.012, 8, 32), glowMat('#bbdefb'))
  add(ring, new THREE.TorusGeometry(0.13, 0.008, 6, 24), glowMat('#e3f2fd'))
  return { group: g, tracks: [spinTrack('spin', 7, new THREE.Vector3(0, 0, 1))] }
}

// 3. Lara — Minazuki Sanguínea, gotas de sangue orbitando
function buildLara() {
  const g = new THREE.Group()
  g.add(extrudeBlade(bladeShape(1.75, 0.2), 0.055, polishedSteel(), { p: [0, 0.6, 0] }))
  add(g, new THREE.BoxGeometry(0.07, 1.5, 0.05), glowMat('#d32f2f'), { p: [0, 0.55, 0], name: 'core' }) // goteira viva
  // guarda meia-lua
  add(g, new THREE.TorusGeometry(0.16, 0.03, 10, 24, Math.PI * 1.3), mat('guard', '#5c1010', { metalness: 0.8, roughness: 0.35 }), { p: [0, -0.34, 0], r: [Math.PI / 2, 0, 0.4] })
  add(g, new THREE.CylinderGeometry(0.06, 0.07, 0.08, 12), gold(), { p: [0, -0.28, 0] })
  wrappedHandle(g, { y: -0.66, length: 0.62, radius: 0.052, mat: mat('wrap', '#2a0a0a') })
  add(g, new THREE.SphereGeometry(0.07, 12, 8), mat('guard', '#5c1010', { metalness: 0.8 }), { p: [0, -1.0, 0] })
  add(g, new THREE.SphereGeometry(0.04, 8, 6), glowMat('#ff5252'), { p: [0, -1.0, 0.07] })
  // gotas orbitando a lâmina em alturas diferentes
  const tracks = [pulseTrack('core', { base: 1, amp: 0.1, period: 2.4 })]
  const drops = [
    { y: 0.45, r: 0.22, ph: 0, sz: 0.05, per: 5 },
    { y: 0.95, r: 0.26, ph: 2.1, sz: 0.04, per: 6 },
    { y: 1.35, r: 0.2, ph: 4.0, sz: 0.032, per: 4.5 },
    { y: 0.7, r: 0.3, ph: 1.0, sz: 0.03, per: 7 },
  ]
  drops.forEach((d, i) => {
    const name = `orbit${i}`
    const node = group(g, { name })
    add(node, new THREE.SphereGeometry(d.sz, 8, 6), glowMat('#d32f2f'))
    node.position.set(Math.cos(d.ph) * d.r, d.y, Math.sin(d.ph) * d.r)
    tracks.push(orbitTrack(name, { radius: d.r, period: d.per, phase: d.ph, y: d.y }))
  })
  return { group: g, tracks }
}

// 4. Iwao — Pilar de Ferro, cutelo colossal sísmico (fio incandescente pulsa)
function buildIwao() {
  const g = new THREE.Group()
  const iron = mat('iron', '#4a4c52', { metalness: 0.78, roughness: 0.5 })
  add(g, new THREE.BoxGeometry(0.22, 2.0, 0.8), iron, { p: [0, 0.5, 0] })
  add(g, new THREE.BoxGeometry(0.24, 0.5, 0.95), iron, { p: [0, 1.3, 0] })
  add(g, new THREE.BoxGeometry(0.3, 2.0, 0.18), darkIron(), { p: [0, 0.5, -0.42] })
  add(g, new THREE.BoxGeometry(0.075, 2.4, 0.075), glowMat('#ffb74d'), { p: [0, 0.65, 0.43], name: 'core' })
  for (const y of [0.0, 0.55, 1.1]) {
    add(g, new THREE.BoxGeometry(0.24, 0.32, 0.5), darkIron(), { p: [0.0, y, -0.12] })
    for (const z of [-0.18, 0.12]) {
      add(g, new THREE.CylinderGeometry(0.045, 0.045, 0.26, 8), blackIron(), { p: [0, y, z], r: [0, 0, Math.PI / 2] })
    }
  }
  add(g, new THREE.BoxGeometry(0.34, 0.2, 0.55), darkIron(), { p: [0, -0.62, 0] })
  add(g, new THREE.CylinderGeometry(0.1, 0.11, 0.85, 10), wood(), { p: [0, -1.1, 0] })
  for (const y of [-0.85, -1.1, -1.35]) {
    add(g, new THREE.TorusGeometry(0.11, 0.022, 6, 12), blackIron(), { p: [0, y, 0], r: [Math.PI / 2, 0, 0] })
  }
  add(g, new THREE.SphereGeometry(0.14, 8, 6), darkIron(), { p: [0, -1.56, 0] })
  return { group: g, tracks: [pulseTrack('core', { base: 1, amp: 0.18, period: 3.5 })] }
}

// 5. Tsumugi — Fuso da Tecelã, anéis de luz girando + contas em espiral
function buildTsumugi() {
  const g = new THREE.Group()
  const paleWood = mat('paleWood', '#8a7355', { roughness: 0.8 })
  g.add(lathe(
    [[0.02, -0.95], [0.03, -0.5], [0.42, -0.55], [0.05, -0.2], [0.05, 0.6], [0.42, 0.62], [0.03, 0.66], [0.02, 1.0]],
    paleWood, { segments: 20 },
  ))
  // anéis de fio girando
  const coil = group(g, { name: 'spin' })
  for (const [y, rad] of [[-0.2, 0.17], [-0.05, 0.14], [0.1, 0.11], [0.25, 0.085], [0.4, 0.06]]) {
    add(coil, new THREE.TorusGeometry(rad, 0.02, 8, 22), glowMat('#ce93d8'), { p: [0, y, 0], r: [Math.PI / 2, 0, 0] })
  }
  // contas em espiral subindo (orbitam num nó próprio)
  const tracks = [spinTrack('spin', 8)]
  for (let i = 0; i < 4; i++) {
    const name = `bead${i}`
    const node = group(g, { name })
    add(node, new THREE.SphereGeometry(0.026, 8, 6), glowMat('#f3d6ff'))
    const y = 0.45 + i * 0.13
    node.position.set(0.08, y, 0)
    tracks.push(orbitTrack(name, { radius: 0.08, period: 5 + i, phase: i * 1.4, y }))
  }
  add(g, new THREE.SphereGeometry(0.05, 12, 8), glowMat('#ce93d8'), { p: [0, 1.02, 0], name: 'tip' })
  tracks.push(bobTrack('tip', { base: [0, 1.02, 0], amp: 0.04, period: 4 }))
  return { group: g, tracks }
}

// 6. Raizō — Amarelo-Raio, segmentos crepitando + faíscas orbitando
function buildRaizo() {
  const g = new THREE.Group()
  const segs = [
    { y: 0.05, x: 0.0, rz: 0.2 }, { y: 0.5, x: 0.1, rz: -0.24 },
    { y: 0.95, x: -0.03, rz: 0.26 }, { y: 1.38, x: 0.09, rz: -0.18 },
  ]
  const bolt = group(g, { name: 'sway' })
  for (const { y, x, rz } of segs) {
    add(bolt, new THREE.BoxGeometry(0.08, 0.58, 0.19), glowMat('#fdd835'), { p: [x, y, 0], r: [0, 0, rz] })
    add(bolt, new THREE.BoxGeometry(0.03, 0.58, 0.06), glowMat('#fffde7'), { p: [x, y, 0.08], r: [0, 0, rz] })
  }
  add(bolt, new THREE.ConeGeometry(0.08, 0.34, 4), glowMat('#fff59d'), { p: [0.02, 1.78, 0], r: [0, Math.PI / 4, 0.12], s: [0.6, 1, 1.6] })
  add(g, new THREE.TorusGeometry(0.15, 0.025, 8, 20), darkIron(), { p: [0, -0.28, 0], r: [Math.PI / 2, 0, 0] })
  wrappedHandle(g, { y: -0.6, length: 0.56, radius: 0.05, mat: mat('wrap', '#3a3214') })
  add(g, new THREE.SphereGeometry(0.06, 10, 6), gold(), { p: [0, -0.9, 0] })
  const tracks = [swayTrack('sway', { axis: new THREE.Vector3(0, 0, 1), amp: 0.05, period: 1.6 })]
  for (let i = 0; i < 4; i++) {
    const name = `spark${i}`
    const node = group(g, { name })
    add(node, new THREE.SphereGeometry(0.022 + (i % 2) * 0.008, 5, 4), glowMat('#fff59d'))
    const y = 0.4 + i * 0.32, r = 0.22 - (i % 2) * 0.04
    node.position.set(r, y, 0)
    tracks.push(orbitTrack(name, { radius: r, period: 2.2 + i * 0.5, phase: i * 1.7, y }))
  }
  return { group: g, tracks }
}

// 7. Mizuki — Cântaro do Oásis, laço d'água girando + gotas
function buildMizuki() {
  const g = new THREE.Group()
  const ceramic = mat('ceramic', '#9aa7ad', { roughness: 0.3, metalness: 0.12 })
  const glaze = mat('glaze', '#b6c4c9', { roughness: 0.15, metalness: 0.2 })
  g.add(lathe(
    [[0, -0.66], [0.34, -0.6], [0.46, -0.3], [0.42, 0.05], [0.24, 0.22], [0.17, 0.32], [0.2, 0.4], [0.16, 0.46], [0, 0.48]],
    glaze, { segments: 30 },
  ))
  add(g, new THREE.TorusGeometry(0.43, 0.02, 8, 30), gold(), { p: [0, -0.12, 0], r: [Math.PI / 2, 0, 0] })
  for (const sx of [1, -1]) {
    add(g, new THREE.TorusGeometry(0.11, 0.03, 8, 14), ceramic, { p: [0.42 * sx, -0.12, 0], r: [0, 0, Math.PI / 2] })
  }
  // laço d'água viva girando acima da boca
  const water = group(g, { p: [0, 0.85, 0], name: 'spin' })
  add(water, new THREE.TorusGeometry(0.42, 0.05, 12, 28), glowMat('#4dd0e1'), { r: [0.5, 0, 0] })
  add(water, new THREE.TorusGeometry(0.28, 0.035, 10, 24), glowMat('#80deea'), { r: [0.5, 0.6, 0] })
  const tracks = [spinTrack('spin', 9)]
  for (let i = 0; i < 3; i++) {
    const name = `drop${i}`
    const node = group(g, { name })
    add(node, new THREE.SphereGeometry(0.05 - i * 0.008, 10, 8), glowMat('#80deea'))
    const y = 1.15 + i * 0.05, r = 0.32 + i * 0.06
    node.position.set(r, y, 0)
    tracks.push(orbitTrack(name, { radius: r, period: 6 + i, phase: i * 2.0, y }))
  }
  return { group: g, tracks }
}

// 8. Ranmaru — Dogma Partido, kanabō cravejado (fendas de poder pulsam)
function buildRanmaru() {
  const g = new THREE.Group()
  const scorched = mat('scorched', '#33271d', { roughness: 0.9 })
  g.add(lathe([[0.07, -1.05], [0.1, -0.4], [0.16, 0.3], [0.19, 0.95], [0.14, 1.25], [0, 1.32]], scorched, { segments: 14 }))
  for (let ring = 0; ring < 4; ring++) {
    const y = 0.4 + ring * 0.26
    const radius = 0.18 - ring * 0.014
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + ring * 0.3
      add(g, new THREE.ConeGeometry(0.05, 0.13, 4), darkIron(), { p: [Math.cos(a) * radius, y, Math.sin(a) * radius], r: [Math.PI / 2, 0, -a] })
    }
  }
  const cracks = group(g, { name: 'core' })
  add(cracks, new THREE.BoxGeometry(0.035, 0.85, 0.035), glowMat('#ff7043'), { p: [0.14, 0.75, 0.08], r: [0.1, 0, 0.12] })
  add(cracks, new THREE.BoxGeometry(0.028, 0.55, 0.028), glowMat('#ff7043'), { p: [-0.12, 0.95, -0.09], r: [-0.08, 0, -0.1] })
  add(cracks, new THREE.BoxGeometry(0.022, 0.4, 0.022), glowMat('#ffab91'), { p: [0.05, 0.5, -0.15], r: [0, 0.2, 0.05] })
  wrappedHandle(g, { y: -0.78, length: 0.5, radius: 0.07, mat: mat('rawhide', '#241b13') })
  add(g, new THREE.SphereGeometry(0.1, 8, 6), darkIron(), { p: [0, -1.08, 0] })
  return {
    group: g,
    tracks: [
      pulseTrack('core', { base: 1, amp: 0.14, period: 2.0 }),
      swayTrack('core', { axis: new THREE.Vector3(0, 1, 0), amp: 0.05, period: 4 }),
    ],
  }
}

// 9. Kyōya — Liturgia Rasgada, kusarigama com corrente balançando
function buildKyoya() {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.05, 0.06, 1.15, 10), wood(), { p: [0, 0.45, 0] })
  add(g, new THREE.TorusGeometry(0.06, 0.012, 6, 12), darkIron(), { p: [0, 0.95, 0], r: [Math.PI / 2, 0, 0] })
  add(g, new THREE.TorusGeometry(0.52, 0.055, 10, 26, Math.PI * 0.8), steel(), { p: [0.08, 1.08, 0], r: [0, 0, -0.4], s: [1, 1, 0.45] })
  add(g, new THREE.TorusGeometry(0.46, 0.02, 8, 26, Math.PI * 0.8), glowMat('#ab47bc'), { p: [0.08, 1.08, 0], r: [0, 0, -0.4], s: [1, 1, 0.5] })
  add(g, new THREE.ConeGeometry(0.06, 0.2, 6), steel(), { p: [-0.34, 1.45, 0], r: [0, 0, 1.2] })
  // corrente pendurada que balança a partir do topo do cabo
  const chain = group(g, { p: [0, 0.95, 0], name: 'sway' })
  for (let i = 0; i < 8; i++) {
    add(chain, new THREE.TorusGeometry(0.055, 0.016, 6, 12), darkIron(), {
      p: [0.04 * (i % 2 === 0 ? 1 : -1), -0.15 - i * 0.16, 0],
      r: [i % 2 === 0 ? 0 : Math.PI / 2, 0.3 * i, 0],
    })
  }
  add(chain, new THREE.ConeGeometry(0.1, 0.24, 6), darkIron(), { p: [0, -1.5, 0], r: [Math.PI, 0, 0] })
  add(chain, new THREE.SphereGeometry(0.06, 8, 6), blackIron(), { p: [0, -1.35, 0] })
  return { group: g, tracks: [swayTrack('sway', { axis: new THREE.Vector3(0, 0, 1), amp: 0.12, period: 4.5 })] }
}

// 10. Chosen — A Sem-Nome, montante denteado e COESO (lâmina extrudada)
function buildChosen() {
  const g = new THREE.Group()
  const ash = mat('ash', '#8a8682', { metalness: 0.85, roughness: 0.42 })
  const rust = mat('rust', '#5a4034', { metalness: 0.4, roughness: 0.85 })
  // lâmina sólida denteada, mais grossa
  const blade = extrudeBlade(jaggedBladeShape(2.3, 0.5), 0.16, ash, { p: [0, 1.0, 0] })
  g.add(blade)
  // goteira escura ao longo do eixo (contraste com o aço claro)
  add(g, new THREE.BoxGeometry(0.09, 1.9, 0.19), blackIron(), { p: [-0.08, 0.92, 0] })
  // faixas de ferrugem incrustadas, atravessando a lâmina (leem nas duas faces)
  for (const y of [0.55, 1.25, 1.9]) {
    add(g, new THREE.BoxGeometry(0.2, 0.16, 0.2), rust, { p: [0.03, y, 0], r: [0, 0, 0.3] })
  }
  // rebites toscos cravados na lâmina perto da guarda
  for (const [x, y] of [[0.12, 0.15], [-0.1, 0.32], [0.02, 0.02]]) {
    add(g, new THREE.SphereGeometry(0.035, 6, 5), darkIron(), { p: [x, y, 0.09] })
  }
  // núcleo de pressão espiritual percorrendo a lâmina — atravessa as duas
  // faces (mais fundo que a espessura) pra ler como costura incandescente
  add(g, new THREE.BoxGeometry(0.05, 2.15, 0.24), glowMat('#e0e0e0'), { p: [0.06, 1.0, 0], name: 'core' })
  // guarda tosca de ferro batido
  add(g, new THREE.BoxGeometry(0.74, 0.16, 0.22), darkIron(), { p: [0, -0.18, 0] })
  add(g, new THREE.BoxGeometry(0.22, 0.12, 0.28), blackIron(), { p: [0, -0.18, 0] })
  wrappedHandle(g, { y: -0.6, length: 0.66, radius: 0.072, mat: mat('rags', '#4a3b30', { roughness: 1 }) })
  add(g, new THREE.SphereGeometry(0.09, 8, 6), darkIron(), { p: [0, -0.98, 0] })
  // trapos amarrados que balançam na guarda
  const rags = group(g, { p: [0, -0.2, 0], name: 'sway' })
  add(rags, new THREE.BoxGeometry(0.08, 0.42, 0.03), mat('rags', '#3f3228', { roughness: 1 }), { p: [0.34, -0.2, 0.05], r: [0.15, 0, 0.3] })
  add(rags, new THREE.BoxGeometry(0.06, 0.32, 0.025), mat('rags', '#4a3b30', { roughness: 1 }), { p: [-0.3, -0.16, -0.04], r: [-0.1, 0, -0.25] })
  return {
    group: g,
    tracks: [
      pulseTrack('core', { base: 1, amp: 0.08, period: 4 }),
      swayTrack('sway', { axis: new THREE.Vector3(0, 0, 1), amp: 0.07, period: 5 }),
    ],
  }
}

const BUILDERS = {
  haruki: buildHaruki,
  setsuna: buildSetsuna,
  lara: buildLara,
  iwao: buildIwao,
  tsumugi: buildTsumugi,
  raizo: buildRaizo,
  mizuki: buildMizuki,
  ranmaru: buildRanmaru,
  kyoya: buildKyoya,
  chosen: buildChosen,
}

function exportGlb(group, animations) {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(
      group,
      (result) => resolve(Buffer.from(result)),
      reject,
      { binary: true, animations, trs: true, onlyVisible: false },
    )
  })
}

await mkdir(OUT_DIR, { recursive: true })
for (const [id, build] of Object.entries(BUILDERS)) {
  const { group: grp, tracks } = build()
  const clip = new THREE.AnimationClip('idle', IDLE, tracks)
  let meshes = 0
  grp.traverse((o) => o.isMesh && meshes++)
  const glb = await exportGlb(grp, [clip])
  await writeFile(`${OUT_DIR}${id}.glb`, glb)
  console.log(`${id}.glb — ${(glb.length / 1024).toFixed(1)} kB · ${meshes} peças · ${tracks.length} tracks`)
}
console.log('Modelos gerados em public/models/ (com animação idle embutida)')
