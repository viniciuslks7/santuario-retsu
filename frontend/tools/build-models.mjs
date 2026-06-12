// Gera os GLB low-poly das armas do Clã Retsu em public/models/.
// Uso: node tools/build-models.mjs
// Materiais chamados "glow" recebem emissivo da cor do irmão; o app só anima a intensidade.
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

const mat = (name, color, opts = {}) =>
  new THREE.MeshStandardMaterial({ name, color, roughness: 0.6, ...opts })

const glowMat = (emissive) =>
  new THREE.MeshStandardMaterial({
    name: 'glow',
    color: '#15110d',
    emissive,
    emissiveIntensity: 1.2,
    roughness: 0.4,
  })

function add(parent, geometry, material, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(...p)
  m.rotation.set(...r)
  m.scale.set(...s)
  parent.add(m)
  return m
}

const steel = () => mat('steel', '#c8ccd4', { metalness: 0.85, roughness: 0.3 })
const darkIron = () => mat('darkIron', '#3d3f45', { metalness: 0.8, roughness: 0.45 })
const wood = () => mat('wood', '#5a4632', { roughness: 0.85 })

/* 1. Haruki — nodachi selada, coberta de teias */
function buildHaruki() {
  const g = new THREE.Group()
  const saya = mat('saya', '#3b2e21', { roughness: 0.8 })
  const wrap = mat('wrap', '#6b5a3e', { roughness: 0.9 })
  const web = mat('web', '#cfc9ba', { roughness: 1 })
  add(g, new THREE.BoxGeometry(0.15, 2.1, 0.4), saya, { p: [0, 0.1, 0] })
  add(g, new THREE.CylinderGeometry(0.09, 0.13, 0.2, 8), saya, { p: [0, -1.0, 0] })
  for (const y of [-0.55, 0.05, 0.6]) {
    add(g, new THREE.BoxGeometry(0.19, 0.09, 0.44), wrap, { p: [0, y, 0] })
  }
  // selo na boca da bainha: a única luz que escapa
  add(g, new THREE.BoxGeometry(0.18, 0.05, 0.43), glowMat('#7cb342'), { p: [0, 1.13, 0] })
  add(g, new THREE.CylinderGeometry(0.17, 0.17, 0.05, 10), darkIron(), { p: [0, 1.2, 0] })
  add(g, new THREE.CylinderGeometry(0.055, 0.065, 0.64, 8), wrap, { p: [0, 1.55, 0] })
  add(g, new THREE.SphereGeometry(0.075, 6, 5), darkIron(), { p: [0, 1.9, 0] })
  // teias de aranha (esferas achatadas perto da guarda)
  add(g, new THREE.SphereGeometry(0.09, 6, 4), web, { p: [0.1, 1.2, 0.16], s: [1, 0.4, 1] })
  add(g, new THREE.SphereGeometry(0.06, 6, 4), web, { p: [-0.09, 1.05, -0.14], s: [1, 0.5, 1] })
  return g
}

/* 2. Setsuna — katana de iaijutsu, fio que precede o evento */
function buildSetsuna() {
  const g = new THREE.Group()
  add(g, new THREE.BoxGeometry(0.045, 1.7, 0.16), steel(), { p: [0, 0.55, 0] })
  add(g, new THREE.ConeGeometry(0.085, 0.26, 4), steel(), {
    p: [0, 1.5, 0],
    r: [0, Math.PI / 4, 0],
    s: [0.5, 1, 1.95],
  })
  // fio dianteiro brilhante
  add(g, new THREE.BoxGeometry(0.014, 1.7, 0.02), glowMat('#90caf9'), { p: [0, 0.55, 0.085] })
  add(g, new THREE.CylinderGeometry(0.15, 0.15, 0.035, 12), darkIron(), { p: [0, -0.32, 0] })
  add(g, new THREE.CylinderGeometry(0.05, 0.055, 0.55, 8), mat('wrap', '#1f2a3a'), {
    p: [0, -0.62, 0],
  })
  add(g, new THREE.SphereGeometry(0.06, 6, 5), darkIron(), { p: [0, -0.92, 0] })
  return g
}

/* 3. Lara — Minazuki Sanguínea, lâmina com goteira de plasma */
function buildLara() {
  const g = new THREE.Group()
  add(g, new THREE.BoxGeometry(0.055, 1.75, 0.2), steel(), { p: [0, 0.55, 0] })
  add(g, new THREE.ConeGeometry(0.1, 0.3, 4), steel(), {
    p: [0, 1.57, 0],
    r: [0, Math.PI / 4, 0],
    s: [0.5, 1, 1.9],
  })
  // goteira central de sangue vivo
  add(g, new THREE.BoxGeometry(0.06, 1.6, 0.05), glowMat('#d32f2f'), { p: [0, 0.5, 0] })
  // gotas levitando ao redor
  add(g, new THREE.SphereGeometry(0.045, 6, 5), glowMat('#d32f2f'), { p: [0.16, 0.95, 0.1] })
  add(g, new THREE.SphereGeometry(0.03, 6, 5), glowMat('#d32f2f'), { p: [-0.14, 0.55, -0.08] })
  add(g, new THREE.SphereGeometry(0.035, 6, 5), glowMat('#d32f2f'), { p: [0.1, 0.15, -0.12] })
  add(g, new THREE.CylinderGeometry(0.16, 0.16, 0.035, 16), mat('guard', '#5c1010', { metalness: 0.7, roughness: 0.4 }), { p: [0, -0.35, 0] })
  add(g, new THREE.CylinderGeometry(0.05, 0.055, 0.6, 8), mat('wrap', '#2a0a0a'), { p: [0, -0.68, 0] })
  add(g, new THREE.SphereGeometry(0.065, 6, 5), darkIron(), { p: [0, -1.0, 0] })
  return g
}

/* 4. Iwao — Pilar de Ferro, cutelo colossal rebitado */
function buildIwao() {
  const g = new THREE.Group()
  const iron = mat('iron', '#4a4c52', { metalness: 0.75, roughness: 0.5 })
  add(g, new THREE.BoxGeometry(0.2, 2.0, 0.78), iron, { p: [0, 0.45, 0] })
  add(g, new THREE.BoxGeometry(0.26, 2.0, 0.16), darkIron(), { p: [0, 0.45, -0.4] }) // dorso
  add(g, new THREE.BoxGeometry(0.06, 2.0, 0.06), glowMat('#ffb74d'), { p: [0, 0.45, 0.4] }) // fio incandescente
  // rebites
  for (const y of [-0.25, 0.45, 1.15]) {
    add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.24, 8), darkIron(), {
      p: [0, y, -0.32],
      r: [0, 0, Math.PI / 2],
    })
  }
  add(g, new THREE.BoxGeometry(0.3, 0.18, 0.5), darkIron(), { p: [0, -0.62, 0] })
  add(g, new THREE.CylinderGeometry(0.09, 0.1, 0.75, 8), wood(), { p: [0, -1.05, 0] })
  add(g, new THREE.SphereGeometry(0.12, 6, 5), darkIron(), { p: [0, -1.46, 0] })
  return g
}

/* 5. Tsumugi — Fuso da Tecelã, fios de memória */
function buildTsumugi() {
  const g = new THREE.Group()
  const paleWood = mat('paleWood', '#8a7355', { roughness: 0.8 })
  add(g, new THREE.CylinderGeometry(0.035, 0.035, 1.9, 8), paleWood, { p: [0, 0, 0] })
  add(g, new THREE.ConeGeometry(0.42, 0.34, 10), paleWood, { p: [0, -0.42, 0] })
  add(g, new THREE.ConeGeometry(0.42, 0.34, 10), paleWood, { p: [0, -0.76, 0], r: [Math.PI, 0, 0] })
  // fios de luz enrolados
  add(g, new THREE.TorusGeometry(0.16, 0.045, 8, 18), glowMat('#ce93d8'), { p: [0, -0.1, 0], r: [Math.PI / 2, 0, 0] })
  add(g, new THREE.TorusGeometry(0.13, 0.04, 8, 18), glowMat('#ce93d8'), { p: [0, 0.06, 0], r: [Math.PI / 2, 0, 0] })
  add(g, new THREE.TorusGeometry(0.1, 0.035, 8, 18), glowMat('#ce93d8'), { p: [0, 0.2, 0], r: [Math.PI / 2, 0, 0] })
  // fio solto subindo até a ponta
  add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.75, 6), glowMat('#ce93d8'), { p: [0.05, 0.6, 0], r: [0, 0, 0.08] })
  add(g, new THREE.SphereGeometry(0.05, 8, 6), glowMat('#ce93d8'), { p: [0.08, 0.98, 0] })
  return g
}

/* 6. Raizō — Amarelo-Raio, lâmina de relâmpago em ziguezague */
function buildRaizo() {
  const g = new THREE.Group()
  const seg = [
    { y: 0.05, x: 0.0, rz: 0.18 },
    { y: 0.5, x: 0.09, rz: -0.2 },
    { y: 0.95, x: -0.02, rz: 0.22 },
    { y: 1.38, x: 0.08, rz: -0.16 },
  ]
  for (const { y, x, rz } of seg) {
    add(g, new THREE.BoxGeometry(0.07, 0.55, 0.18), glowMat('#fdd835'), { p: [x, y, 0], r: [0, 0, rz] })
  }
  add(g, new THREE.ConeGeometry(0.07, 0.3, 4), glowMat('#fdd835'), { p: [0.02, 1.75, 0], r: [0, Math.PI / 4, 0.12], s: [0.6, 1, 1.6] })
  // faíscas orbitando
  add(g, new THREE.SphereGeometry(0.03, 5, 4), glowMat('#fff59d'), { p: [0.22, 0.7, 0.1] })
  add(g, new THREE.SphereGeometry(0.025, 5, 4), glowMat('#fff59d'), { p: [-0.18, 1.2, -0.08] })
  add(g, new THREE.CylinderGeometry(0.14, 0.14, 0.04, 6), darkIron(), { p: [0, -0.28, 0] })
  add(g, new THREE.CylinderGeometry(0.05, 0.06, 0.55, 8), mat('wrap', '#3a3214'), { p: [0, -0.58, 0] })
  return g
}

/* 7. Mizuki — Cântaro do Oásis, urna com laço d'água */
function buildMizuki() {
  const g = new THREE.Group()
  const ceramic = mat('ceramic', '#9aa7ad', { roughness: 0.35, metalness: 0.1 })
  add(g, new THREE.SphereGeometry(0.42, 14, 10), ceramic, { p: [0, -0.25, 0], s: [1, 0.85, 1] })
  add(g, new THREE.CylinderGeometry(0.16, 0.24, 0.35, 12), ceramic, { p: [0, 0.18, 0] })
  add(g, new THREE.TorusGeometry(0.19, 0.045, 8, 16), ceramic, { p: [0, 0.38, 0], r: [Math.PI / 2, 0, 0] })
  add(g, new THREE.CylinderGeometry(0.3, 0.34, 0.12, 12), ceramic, { p: [0, -0.66, 0] })
  // alças
  add(g, new THREE.TorusGeometry(0.1, 0.03, 6, 12), ceramic, { p: [0.42, -0.1, 0], r: [0, 0, Math.PI / 2] })
  add(g, new THREE.TorusGeometry(0.1, 0.03, 6, 12), ceramic, { p: [-0.42, -0.1, 0], r: [0, 0, Math.PI / 2] })
  // laço d'água viva saindo da boca
  add(g, new THREE.TorusGeometry(0.45, 0.05, 8, 24, Math.PI * 1.5), glowMat('#4dd0e1'), { p: [0, 0.75, 0], r: [0, 0, 0.4] })
  add(g, new THREE.SphereGeometry(0.06, 8, 6), glowMat('#4dd0e1'), { p: [0.34, 1.1, 0] })
  add(g, new THREE.SphereGeometry(0.04, 8, 6), glowMat('#4dd0e1'), { p: [-0.3, 0.5, 0.1] })
  return g
}

/* 8. Ranmaru — Dogma Partido, kanabō cravejado */
function buildRanmaru() {
  const g = new THREE.Group()
  const scorched = mat('scorched', '#33271d', { roughness: 0.9 })
  add(g, new THREE.CylinderGeometry(0.17, 0.08, 2.2, 10), scorched, { p: [0, 0.15, 0] })
  // anéis de cravos na cabeça
  for (let ring = 0; ring < 3; ring++) {
    const y = 0.55 + ring * 0.34
    const radius = 0.17 - ring * 0.012
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + ring * 0.3
      add(g, new THREE.BoxGeometry(0.07, 0.07, 0.16), darkIron(), {
        p: [Math.cos(a) * radius, y, Math.sin(a) * radius],
        r: [0, -a, 0],
      })
    }
  }
  // rachaduras de poder sem âncora
  add(g, new THREE.BoxGeometry(0.03, 0.8, 0.03), glowMat('#ff7043'), { p: [0.13, 0.75, 0.07], r: [0.1, 0, 0.12] })
  add(g, new THREE.BoxGeometry(0.025, 0.5, 0.025), glowMat('#ff7043'), { p: [-0.11, 0.95, -0.08], r: [-0.08, 0, -0.1] })
  add(g, new THREE.TorusGeometry(0.1, 0.025, 6, 12), darkIron(), { p: [0, -0.75, 0], r: [Math.PI / 2, 0, 0] })
  add(g, new THREE.SphereGeometry(0.09, 6, 5), darkIron(), { p: [0, -1.0, 0] })
  return g
}

/* 9. Kyōya — Liturgia Rasgada, kusarigama com corrente */
function buildKyoya() {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.05, 0.06, 1.1, 8), wood(), { p: [0, 0.45, 0] })
  // foice curva (arco de torus achatado)
  add(g, new THREE.TorusGeometry(0.5, 0.05, 8, 20, Math.PI * 0.75), steel(), {
    p: [0.08, 1.05, 0],
    r: [0, 0, -0.4],
    s: [1, 1, 0.45],
  })
  // fio interno da foice
  add(g, new THREE.TorusGeometry(0.44, 0.02, 6, 20, Math.PI * 0.75), glowMat('#ab47bc'), {
    p: [0.08, 1.05, 0],
    r: [0, 0, -0.4],
    s: [1, 1, 0.5],
  })
  // corrente descendo
  for (let i = 0; i < 5; i++) {
    add(g, new THREE.TorusGeometry(0.06, 0.018, 6, 10), darkIron(), {
      p: [0.04 * (i % 2 === 0 ? 1 : -1), -0.25 - i * 0.17, 0],
      r: [i % 2 === 0 ? 0 : Math.PI / 2, 0.3 * i, 0],
    })
  }
  // peso na ponta
  add(g, new THREE.ConeGeometry(0.09, 0.2, 6), darkIron(), { p: [0, -1.18, 0], r: [Math.PI, 0, 0] })
  return g
}

/* 10. Chosen — A Sem-Nome, montante denteado e brutalizado */
function buildChosen() {
  const g = new THREE.Group()
  const ash = mat('ash', '#6e6a66', { metalness: 0.7, roughness: 0.55 })
  // lâmina em três segmentos de largura irregular (parece lascada)
  add(g, new THREE.BoxGeometry(0.13, 0.85, 0.5), ash, { p: [0, 0.1, 0] })
  add(g, new THREE.BoxGeometry(0.13, 0.7, 0.42), ash, { p: [0, 0.85, -0.03] })
  add(g, new THREE.BoxGeometry(0.13, 0.6, 0.34), ash, { p: [0, 1.45, 0.02] })
  add(g, new THREE.ConeGeometry(0.16, 0.3, 4), ash, { p: [0, 1.88, 0], r: [0, Math.PI / 4, 0], s: [0.42, 1, 1.1] })
  // dentes/mordidas na lâmina
  add(g, new THREE.BoxGeometry(0.15, 0.14, 0.14), mat('notch', '#191715'), { p: [0, 0.5, 0.22], r: [0.6, 0, 0] })
  add(g, new THREE.BoxGeometry(0.15, 0.12, 0.12), mat('notch', '#191715'), { p: [0, 1.18, -0.2], r: [-0.5, 0, 0] })
  // núcleo de pressão espiritual quase apagado
  add(g, new THREE.BoxGeometry(0.04, 2.0, 0.04), glowMat('#e0e0e0'), { p: [0, 0.7, 0] })
  add(g, new THREE.BoxGeometry(0.7, 0.14, 0.18), darkIron(), { p: [0, -0.42, 0] })
  add(g, new THREE.CylinderGeometry(0.06, 0.07, 0.6, 8), mat('rags', '#4a3b30', { roughness: 1 }), { p: [0, -0.78, 0] })
  // trapo amarrado na guarda
  add(g, new THREE.BoxGeometry(0.08, 0.4, 0.03), mat('rags', '#4a3b30', { roughness: 1 }), { p: [0.32, -0.6, 0.05], r: [0.15, 0, 0.3] })
  return g
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

function exportGlb(group) {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(group, (result) => resolve(Buffer.from(result)), reject, {
      binary: true,
    })
  })
}

await mkdir(OUT_DIR, { recursive: true })
for (const [id, build] of Object.entries(BUILDERS)) {
  const glb = await exportGlb(build())
  const file = `${OUT_DIR}${id}.glb`
  await writeFile(file, glb)
  console.log(`${id}.glb — ${(glb.length / 1024).toFixed(1)} kB`)
}
console.log('Modelos gerados em public/models/')
