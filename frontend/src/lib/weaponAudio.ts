/**
 * Sons das armas via WebAudio procedural — nenhum asset, mesma filosofia do
 * vento. Cada irmão tem a própria nota (escala pentatônica menor a partir da
 * `order`), então passear o mouse pelo círculo toca um pequeno motivo.
 *
 *  - hover: "ting" curto — senoide + parcial inarmônico (2.76x, timbre de
 *    metal batido, não de flauta);
 *  - inspeção: "shing" de lâmina — ruído bandpass varrendo pra cima, coroado
 *    pelo ting da arma.
 *
 * Autoplay: hover não é gesto de usuário, então o ting só toca com o contexto
 * já rodando (1º clique em qualquer lugar destrava). O clique de inspeção É
 * gesto, então o shing agenda sempre — o resume acontece em milissegundos.
 *
 * Mute: tudo aqui respeita o toggle "som" do Hud (isSoundEnabled) — som de
 * arma com a UI dizendo "mudo" seria hostil.
 */
import { createNoiseBuffer, getAudioContext, isSoundEnabled } from './audioContext'

const PENTATONIC = [0, 3, 5, 7, 10]

/** Nota do irmão: pentatônica menor sobre lá4, subindo de oitava a cada volta. */
function weaponFreq(order: number) {
  const step = order - 1
  const semitone =
    PENTATONIC[step % PENTATONIC.length] + 12 * Math.floor(step / PENTATONIC.length)
  return 440 * Math.pow(2, semitone / 12)
}

let noiseBuffer: AudioBuffer | null = null

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer) noiseBuffer = createNoiseBuffer(ctx, 1)
  return noiseBuffer
}

/** Um golpe de sino: senoide com decay exponencial. */
function chimeAt(ctx: AudioContext, when: number, freq: number, gainPeak: number, decay: number) {
  const osc = ctx.createOscillator()
  osc.frequency.value = freq
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(gainPeak, when)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + decay)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(when)
  osc.stop(when + decay + 0.05)
}

let lastChimeOrder = -1
let lastChimeTime = -1

/** Hover: ting metálico na nota do irmão. O throttle é POR ARMA: atravessar
 *  os submeshes do mesmo pedestal (out→over em sequência) não repica a nota,
 *  mas varrer o círculo toca cada arma na hora — é o motivo pentatônico. */
export function playWeaponChime(order: number) {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (ctx.state !== 'running') return
  const now = ctx.currentTime
  if (order === lastChimeOrder && now - lastChimeTime < 0.6) return
  lastChimeOrder = order
  lastChimeTime = now
  const freq = weaponFreq(order)
  chimeAt(ctx, now, freq, 0.07, 0.4)
  chimeAt(ctx, now, freq * 2.76, 0.022, 0.16)
}

/** Clique de inspeção: a lâmina "sai da bainha". */
export function playWeaponDraw(order: number) {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  const now = ctx.currentTime

  const noise = ctx.createBufferSource()
  noise.buffer = getNoiseBuffer(ctx)
  const sweep = ctx.createBiquadFilter()
  sweep.type = 'bandpass'
  sweep.Q.value = 2.2
  sweep.frequency.setValueAtTime(500, now)
  sweep.frequency.exponentialRampToValueAtTime(3400, now + 0.32)
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.11, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42)
  noise.connect(sweep)
  sweep.connect(noiseGain)
  noiseGain.connect(ctx.destination)
  noise.start(now)
  noise.stop(now + 0.45)

  // o ting da arma coroa o fim da varredura
  const freq = weaponFreq(order)
  chimeAt(ctx, now + 0.14, freq, 0.09, 0.7)
  chimeAt(ctx, now + 0.14, freq * 2.76, 0.03, 0.25)
}
