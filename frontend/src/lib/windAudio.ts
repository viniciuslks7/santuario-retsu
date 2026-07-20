/**
 * Vento procedural do deserto via WebAudio — nenhum asset de áudio, só ruído filtrado.
 *
 * Grafo: um buffer de ruído branco em loop alimenta três camadas:
 *  - rumor grave (lowpass ~260Hz) constante, o "peso" do deserto;
 *  - assobio (bandpass) cujo volume e frequência seguem a rajada VISUAL —
 *    a DustParticles escreve a força por frame via setWindGustLevel, então
 *    o vento que estica os grãos é o mesmo que assobia;
 *  - rugido de tempestade (bandpass ~420Hz), mudo por padrão — a SandStorm
 *    escreve a intensidade a cada frame via setWindStormLevel.
 *
 * O AudioContext (compartilhado com as armas) só é criado no primeiro toggle
 * (gesto do usuário) — política de autoplay dos navegadores bloqueia áudio
 * sem interação.
 */
import { createNoiseBuffer, getAudioContext } from './audioContext'

let master: GainNode | null = null
let stormGain: GainNode | null = null
let whistleFilter: BiquadFilterNode | null = null
let whistleGain: GainNode | null = null
// Espelhos dos últimos setWindStormLevel/setWindGustLevel: o grafo só nasce no
// 1º toggle de som, e se a tempestade já estiver rugindo (ou a rajada soprando)
// nesse momento o buildGraph precisa partir do nível atual — sem isso ficariam
// mudos até o próximo frame.
let stormLevel = 0
let gustLevel = 0

const MASTER_VOLUME = 0.35
const STORM_VOLUME = 0.85
// faixa do assobio: rajada 0 → sussurro grave, rajada 1 → assobio alto e agudo
const WHISTLE_GAIN_MIN = 0.04
const WHISTLE_GAIN_SPAN = 0.12
const WHISTLE_FREQ_MIN = 550
const WHISTLE_FREQ_SPAN = 320

function buildGraph(ctx: AudioContext): GainNode {
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  const noise = ctx.createBufferSource()
  noise.buffer = createNoiseBuffer(ctx, 4)
  noise.loop = true

  // camada grave: rumor constante
  const rumble = ctx.createBiquadFilter()
  rumble.type = 'lowpass'
  rumble.frequency.value = 260
  const rumbleGain = ctx.createGain()
  rumbleGain.gain.value = 0.5
  noise.connect(rumble)
  rumble.connect(rumbleGain)
  rumbleGain.connect(master)

  // camada aguda: assobio que as rajadas visuais empurram pra cima e pra baixo
  // (setWindGustLevel aplica o nível atual logo abaixo)
  whistleFilter = ctx.createBiquadFilter()
  whistleFilter.type = 'bandpass'
  whistleFilter.Q.value = 1.4
  whistleGain = ctx.createGain()
  noise.connect(whistleFilter)
  whistleFilter.connect(whistleGain)
  whistleGain.connect(master)
  setWindGustLevel(gustLevel)

  // camada de tempestade: rugido médio que sobe com a intensidade visual.
  // Pendura no master de propósito — usuário mudo = tempestade muda também.
  const storm = ctx.createBiquadFilter()
  storm.type = 'bandpass'
  storm.frequency.value = 420
  storm.Q.value = 0.7
  stormGain = ctx.createGain()
  stormGain.gain.value = stormLevel * STORM_VOLUME
  noise.connect(storm)
  storm.connect(stormGain)
  stormGain.connect(master)

  noise.start()
  return master
}

/** Liga/desliga o vento com fade de ~1s. Cria o grafo na primeira ligada. */
export function setWindEnabled(enabled: boolean) {
  if (!master) {
    if (!enabled) return
    master = buildGraph(getAudioContext())
  }
  const ctx = getAudioContext()
  const gain = master.gain
  gain.cancelScheduledValues(ctx.currentTime)
  gain.setTargetAtTime(enabled ? MASTER_VOLUME : 0, ctx.currentTime, 0.4)
}

/** Intensidade da tempestade [0..1] — chamada por frame pela SandStorm,
 *  por isso escreve o gain direto (sem agendar automation a 60fps). */
export function setWindStormLevel(level: number) {
  stormLevel = level
  if (stormGain) stormGain.gain.value = level * STORM_VOLUME
}

/** Rajada calma [0..1] — chamada por frame pela DustParticles com a mesma
 *  força que estica os grãos: volume e tom do assobio seguem o visual. */
export function setWindGustLevel(level: number) {
  gustLevel = level
  if (whistleGain) whistleGain.gain.value = WHISTLE_GAIN_MIN + level * WHISTLE_GAIN_SPAN
  if (whistleFilter) whistleFilter.frequency.value = WHISTLE_FREQ_MIN + level * WHISTLE_FREQ_SPAN
}
