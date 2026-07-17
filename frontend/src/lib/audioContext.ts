/**
 * AudioContext único compartilhado entre vento e armas — dois contextos
 * gastariam dois threads de áudio à toa. Criado sob demanda: a política de
 * autoplay dos navegadores só libera som depois de um gesto do usuário, então
 * se o contexto nascer suspenso (ex.: num hover), quem chamou decide se
 * agenda mesmo assim ou desiste.
 */
let ctx: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  // hover não é gesto qualificado: o resume pode rejeitar e tudo bem
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

// Mute global — espelha o toggle "som" do Hud. O vento tem o próprio master
// gain (fade suave), mas os one-shots das armas conferem esta flag.
let soundEnabled = false

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled
}

export function isSoundEnabled(): boolean {
  return soundEnabled
}

/** Buffer de ruído branco — base comum do vento e do "shing" das armas. */
export function createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}
