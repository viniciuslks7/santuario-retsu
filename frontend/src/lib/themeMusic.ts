/**
 * Tema musical procedural por irmão — WebAudio puro, nenhum asset, mesma
 * filosofia do vento e das armas. Ao inspecionar um artefato, um motivo curto
 * entra em loop com escala/timbre/ritmo casados com o elemento do irmão;
 * ao sair da inspeção o tema faz fade e para.
 *
 * O motor é um só: cada tema é dados (escala, padrão, forma de onda, estilo
 * de envelope). O agendador roda em setTimeout por passo — jitter de alguns
 * ms é aceitável pra motivo ambiente, e cada nota é agendada no relógio do
 * AudioContext com pequeno lookahead.
 *
 * Mute: cada passo confere isSoundEnabled — o loop continua girando mudo e
 * volta a soar quando o toggle do Hud religa.
 */
import { getAudioContext, isSoundEnabled } from './audioContext'

interface ThemeDef {
  /** raiz em Hz */
  root: number
  /** escala em semitons a partir da raiz */
  scale: number[]
  /** graus da escala (índices, oitava sobe passando do fim); null = pausa */
  pattern: (number | null)[]
  /** segundos por passo */
  step: number
  wave: OscillatorType
  /** pluck = decai rápido; pad = sustenta; stac = curtíssimo; bell = sino com parcial */
  style: 'pluck' | 'pad' | 'stac' | 'bell'
  /** pico de ganho por nota */
  gain: number
  /** lowpass opcional (Hz) — doma sawtooth/square */
  filter?: number
  /** portamento (s): a nota desliza da anterior — a água da Mizuki */
  glide?: number
}

// Cada tema traduz o lore em som:
//  haruki   floresta  — pentatônica maior, arpejo calmo de flauta
//  setsuna  tempo     — tique-taque em quinta, nunca contínuo
//  lara     sangue    — menor harmônica grave, pad tenso
//  iwao     terra     — pulsos graves espaçados, quase tambor
//  tsumugi  tecelã    — semicolcheias entrelaçadas subindo e descendo
//  raizo    raio      — staccato errático com saltos largos
//  mizuki   água      — notas que escorrem uma na outra (glide)
//  ranmaru  ruína     — frígio grave, segunda menor esfregada
//  kyoya    caos      — saltos de oitava imprevisíveis
//  chosen   a décima  — sino puro e espaçado, quase silêncio
const THEMES: Record<string, ThemeDef> = {
  haruki: {
    root: 220, scale: [0, 2, 4, 7, 9],
    pattern: [0, 2, 4, 7, 4, 2, 5, null],
    step: 0.42, wave: 'sine', style: 'pluck', gain: 0.055,
  },
  setsuna: {
    root: 440, scale: [0, 7],
    pattern: [0, null, 1, null, 0, null, 1, null],
    step: 0.5, wave: 'triangle', style: 'stac', gain: 0.05,
  },
  lara: {
    root: 110, scale: [0, 2, 3, 5, 7, 8, 11],
    pattern: [0, null, 3, null, 5, null, 4, 3],
    step: 0.6, wave: 'sawtooth', style: 'pad', gain: 0.035, filter: 900,
  },
  iwao: {
    root: 82.4, scale: [0, 3, 5, 7, 10],
    pattern: [0, null, null, 0, null, 2, null, null],
    step: 0.5, wave: 'sine', style: 'stac', gain: 0.1,
  },
  tsumugi: {
    root: 330, scale: [0, 2, 3, 7, 8],
    pattern: [0, 2, 4, 7, 4, 2, 0, 2, 4, 7, 9, 7, 4, 2, 0, null],
    step: 0.16, wave: 'triangle', style: 'pluck', gain: 0.04,
  },
  raizo: {
    root: 293.7, scale: [0, 3, 5, 6, 7, 10],
    pattern: [0, null, 7, 2, null, 9, null, 4, 11, null, 0, null, 6, null, 2, null],
    step: 0.22, wave: 'square', style: 'stac', gain: 0.03, filter: 2400,
  },
  mizuki: {
    root: 261.6, scale: [0, 2, 3, 5, 7, 9, 10],
    pattern: [0, 2, 4, 5, 4, 2, 1, 0],
    step: 0.5, wave: 'sine', style: 'pad', gain: 0.05, glide: 0.3,
  },
  ranmaru: {
    root: 98, scale: [0, 1, 3, 5, 7, 8, 10],
    pattern: [0, 1, null, 0, 3, null, 1, null],
    step: 0.55, wave: 'sawtooth', style: 'pad', gain: 0.03, filter: 700,
  },
  kyoya: {
    root: 246.9, scale: [0, 3, 5, 7, 10],
    pattern: [0, 9, 2, 7, null, 11, 4, null, 7, 0, 9, null, 2, 11, null, 4],
    step: 0.26, wave: 'triangle', style: 'pluck', gain: 0.04,
  },
  chosen: {
    root: 523.25, scale: [0, 4, 7, 11],
    pattern: [0, null, null, null, 2, null, null, null, 1, null, null, null, 3, null, null, null],
    step: 0.7, wave: 'sine', style: 'bell', gain: 0.045,
  },
}

/** Grau da escala → Hz (índice além do fim sobe de oitava). */
function degreeFreq(def: ThemeDef, degree: number) {
  const n = def.scale.length
  const oct = Math.floor(degree / n)
  const semitone = def.scale[degree % n] + 12 * oct
  return def.root * Math.pow(2, semitone / 12)
}

interface ThemeRun {
  id: string
  master: GainNode
  timer: number
  stepIndex: number
  lastFreq: number
}

let current: ThemeRun | null = null

function playStep(ctx: AudioContext, def: ThemeDef, run: ThemeRun) {
  const degree = def.pattern[run.stepIndex]
  if (degree === null) return
  const freq = degreeFreq(def, degree)
  const when = ctx.currentTime + 0.05

  const osc = ctx.createOscillator()
  osc.type = def.wave
  if (def.glide && run.lastFreq > 0) {
    osc.frequency.setValueAtTime(run.lastFreq, when)
    osc.frequency.exponentialRampToValueAtTime(freq, when + def.glide)
  } else {
    osc.frequency.value = freq
  }
  run.lastFreq = freq

  const gain = ctx.createGain()
  let end: number
  switch (def.style) {
    case 'pluck':
      gain.gain.setValueAtTime(def.gain, when)
      gain.gain.exponentialRampToValueAtTime(0.0001, when + def.step * 2.2)
      end = when + def.step * 2.2
      break
    case 'stac':
      gain.gain.setValueAtTime(def.gain, when)
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.16)
      end = when + 0.16
      break
    case 'pad':
      gain.gain.setValueAtTime(0.0001, when)
      gain.gain.exponentialRampToValueAtTime(def.gain, when + def.step * 0.5)
      gain.gain.exponentialRampToValueAtTime(0.0001, when + def.step * 1.9)
      end = when + def.step * 1.9
      break
    case 'bell':
      gain.gain.setValueAtTime(def.gain, when)
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 1.8)
      end = when + 1.8
      break
  }

  osc.connect(gain)
  if (def.filter) {
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = def.filter
    gain.connect(lp)
    lp.connect(run.master)
  } else {
    gain.connect(run.master)
  }
  osc.start(when)
  osc.stop(end + 0.05)

  // sinos ganham o parcial inarmônico das armas (2.76x) — mesmo metal batido
  if (def.style === 'bell') {
    const p = ctx.createOscillator()
    p.frequency.value = freq * 2.76
    const pg = ctx.createGain()
    pg.gain.setValueAtTime(def.gain * 0.3, when)
    pg.gain.exponentialRampToValueAtTime(0.0001, when + 0.5)
    p.connect(pg)
    pg.connect(run.master)
    p.start(when)
    p.stop(when + 0.55)
  }
}

/** Inicia (ou troca) o tema do irmão selecionado, com fade-in. */
export function startTheme(id: string) {
  const def = THEMES[id]
  if (!def) return
  if (current?.id === id) return
  stopTheme()

  const ctx = getAudioContext()
  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, ctx.currentTime)
  master.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.2)
  master.connect(ctx.destination)

  const run: ThemeRun = { id, master, timer: 0, stepIndex: 0, lastFreq: 0 }
  current = run

  const tick = () => {
    if (current !== run) return
    if (isSoundEnabled() && ctx.state === 'running') playStep(ctx, def, run)
    run.stepIndex = (run.stepIndex + 1) % def.pattern.length
    run.timer = window.setTimeout(tick, def.step * 1000)
  }
  tick()
}

/** Fade-out e para o tema atual (idempotente). */
export function stopTheme() {
  if (!current) return
  const { master, timer } = current
  current = null
  clearTimeout(timer)
  const ctx = getAudioContext()
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime)
  master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
  window.setTimeout(() => master.disconnect(), 800)
}
