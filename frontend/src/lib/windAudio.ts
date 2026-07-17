/**
 * Vento procedural do deserto via WebAudio — nenhum asset de áudio, só ruído filtrado.
 *
 * Grafo: um buffer de ruído branco em loop alimenta três camadas:
 *  - rumor grave (lowpass ~260Hz) constante, o "peso" do deserto;
 *  - assobio (bandpass ~700Hz) cujo volume e frequência oscilam com dois LFOs
 *    em frequências desalinhadas (0.05Hz e 0.17Hz) → rajadas orgânicas sem
 *    período perceptível;
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
// Espelho do último setWindStormLevel: o grafo só nasce no 1º toggle de som,
// e se a tempestade já estiver rugindo nesse momento o buildGraph precisa
// partir do nível atual — sem isso ela ficaria muda até o próximo frame.
let stormLevel = 0

const MASTER_VOLUME = 0.35
const STORM_VOLUME = 0.85

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

  // camada aguda: assobio que as rajadas empurram pra cima e pra baixo
  const whistle = ctx.createBiquadFilter()
  whistle.type = 'bandpass'
  whistle.frequency.value = 700
  whistle.Q.value = 1.4
  const whistleGain = ctx.createGain()
  whistleGain.gain.value = 0.1
  noise.connect(whistle)
  whistle.connect(whistleGain)
  whistleGain.connect(master)

  const lfoSlow = ctx.createOscillator()
  lfoSlow.frequency.value = 0.05
  const freqDepth = ctx.createGain()
  freqDepth.gain.value = 320
  lfoSlow.connect(freqDepth)
  freqDepth.connect(whistle.frequency)

  const lfoFast = ctx.createOscillator()
  lfoFast.frequency.value = 0.17
  const gainDepth = ctx.createGain()
  gainDepth.gain.value = 0.06
  lfoFast.connect(gainDepth)
  gainDepth.connect(whistleGain.gain)

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
  lfoSlow.start()
  lfoFast.start()
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
