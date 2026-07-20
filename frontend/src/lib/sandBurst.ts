/**
 * Jato de areia no clique do deserto — ponte entre o onClick do chão
 * (DesertEnvironment) e o componente visual (SandBursts). Fila simples em
 * módulo: quem clica empurra, o componente drena por frame. Sem store — o
 * burst é efêmero e não interessa a mais ninguém.
 */
import type * as THREE from 'three'
import { createNoiseBuffer, getAudioContext, isSoundEnabled } from './audioContext'

export interface BurstSpawn {
  x: number
  y: number
  z: number
}

const pending: BurstSpawn[] = []

export function emitSandBurst(point: THREE.Vector3) {
  pending.push({ x: point.x, y: point.y, z: point.z })
  playSandPuffSound()
}

/** Esvazia a fila (chamado pelo SandBursts a cada frame). */
export function drainSandBursts(): BurstSpawn[] {
  return pending.length ? pending.splice(0, pending.length) : pending
}

let noiseBuffer: AudioBuffer | null = null

/** "Puf" de areia: ruído lowpass afundando — clique É gesto, agenda direto. */
function playSandPuffSound() {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!noiseBuffer) noiseBuffer = createNoiseBuffer(ctx, 0.5)
  const now = ctx.currentTime

  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.Q.value = 0.8
  lp.frequency.setValueAtTime(650, now)
  lp.frequency.exponentialRampToValueAtTime(160, now + 0.3)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.14, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32)
  src.connect(lp)
  lp.connect(gain)
  gain.connect(ctx.destination)
  src.start(now)
  src.stop(now + 0.35)
}
