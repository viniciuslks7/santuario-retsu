/**
 * Vento procedural do deserto via WebAudio — nenhum asset de áudio, só ruído filtrado.
 *
 * Grafo: um buffer de ruído branco em loop alimenta duas camadas:
 *  - rumor grave (lowpass ~260Hz) constante, o "peso" do deserto;
 *  - assobio (bandpass ~700Hz) cujo volume e frequência oscilam com dois LFOs
 *    em frequências desalinhadas (0.05Hz e 0.17Hz) → rajadas orgânicas sem
 *    período perceptível.
 *
 * O AudioContext só é criado no primeiro toggle (gesto do usuário) — política
 * de autoplay dos navegadores bloqueia áudio sem interação.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null

const MASTER_VOLUME = 0.35

function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

function buildGraph(ctx: AudioContext): GainNode {
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  const noise = ctx.createBufferSource()
  noise.buffer = makeNoiseBuffer(ctx)
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

  noise.start()
  lfoSlow.start()
  lfoFast.start()
  return master
}

/** Liga/desliga o vento com fade de ~1s. Cria o grafo na primeira ligada. */
export function setWindEnabled(enabled: boolean) {
  if (!ctx) {
    if (!enabled) return
    ctx = new AudioContext()
    master = buildGraph(ctx)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  const gain = master!.gain
  gain.cancelScheduledValues(ctx.currentTime)
  gain.setTargetAtTime(enabled ? MASTER_VOLUME : 0, ctx.currentTime, 0.4)
}
