import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useExperienceSettings } from '../../store/useExperienceSettings'
import { useShrineStore } from '../../store/useShrineStore'
import {
  getAshTexture,
  getDropTexture,
  getGlowTexture,
  getSparkTexture,
} from '../../lib/particleTextures'

// Aura elemental de cada artefato — partículas guiadas pelo lore do irmão.
// Mesma receita instanciada da DustParticles: um único instancedMesh por aura,
// coordenadas locais com origem no centro da arma. Hover/inspeção acelera e
// intensifica (mesma linguagem do glow emissivo em Artifact.tsx).

type AuraMode =
  | 'spores' // haruki: esporos da floresta petrificada subindo
  | 'clock' // setsuna: anel que gira em ticks discretos, nunca contínuo
  | 'bloodrise' // lara: gotas que levitam da base rumo à lâmina
  | 'rumble' // iwao: cascalho no pedestal saltando em pulsos sísmicos
  | 'weave' // tsumugi: fios de luz tecendo uma espiral
  | 'sparks' // raizo: faíscas erráticas de descarga estática
  | 'flow' // mizuki: fita d'água orbitando em onda suave
  | 'debris' // ranmaru: escombros do mundo antigo em órbita caótica
  | 'erratic' // kyoya: órbitas largas com reversões imprevisíveis
  | 'ashfall' // chosen: cinzas caindo — quase apagada até ser encontrada

interface AuraConfig {
  mode: AuraMode
  count: number
  size: number
  opacity: number
  /** blending aditivo pra auras luminosas (esporos, faíscas, fios) */
  additive?: boolean
  /** caixa em vez de esfera (cascalho, escombros) */
  boxy?: boolean
  /** sobrescreve a cor do irmão (cinza da Chosen não é o branco da lâmina) */
  tint?: string
}

const AURAS: Record<string, AuraConfig> = {
  haruki: { mode: 'spores', count: 36, size: 0.045, opacity: 0.85, additive: true },
  setsuna: { mode: 'clock', count: 24, size: 0.035, opacity: 0.9, additive: true },
  lara: { mode: 'bloodrise', count: 30, size: 0.042, opacity: 0.9 },
  iwao: { mode: 'rumble', count: 22, size: 0.07, opacity: 1, boxy: true },
  tsumugi: { mode: 'weave', count: 40, size: 0.03, opacity: 0.9, additive: true },
  raizo: { mode: 'sparks', count: 30, size: 0.026, opacity: 1, additive: true },
  mizuki: { mode: 'flow', count: 36, size: 0.04, opacity: 0.85, additive: true },
  ranmaru: { mode: 'debris', count: 18, size: 0.08, opacity: 1, boxy: true },
  kyoya: { mode: 'erratic', count: 28, size: 0.04, opacity: 0.9, additive: true },
  chosen: { mode: 'ashfall', count: 44, size: 0.045, opacity: 0.4, tint: '#a99f90' },
}

interface AuraSeed {
  radius: number
  angle: number
  y0: number
  speed: number
  phase: number
  scale: number
}

/** Hash barato e determinístico pros saltos das faíscas (sem alocar RNG). */
function sparkHash(jump: number, phase: number, n: number) {
  return Math.sin(jump * 12.9898 + phase * 78.233 + n * 37.719)
}

/** Textura casada com o elemento do modo (boxy fica sem — cascalho é 3D). */
function auraTexture(mode: AuraMode): THREE.Texture | null {
  switch (mode) {
    case 'sparks':
    case 'clock':
      return getSparkTexture()
    case 'ashfall':
      return getAshTexture()
    case 'bloodrise':
      return getDropTexture()
    case 'rumble':
    case 'debris':
      return null
    default:
      return getGlowTexture()
  }
}

export function ArtifactAura({ id, color }: { id: string; color: string }) {
  const reducedMotion = useExperienceSettings((s) => s.reducedMotion)
  const cfg = AURAS[id]
  const lit = useShrineStore((s) => s.hoveredSibling === id || s.selectedSibling === id)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  // billboard com pai rotacionado (a Chosen tem rotation no grupo): compensa
  // a rotação de mundo do mesh antes de aplicar a orientação da câmera
  const worldQuat = useMemo(() => new THREE.Quaternion(), [])
  const billQuat = useMemo(() => new THREE.Quaternion(), [])
  // relógio próprio: acelerar via delta evita salto de fase ao entrar/sair do hover
  const timeRef = useRef(0)
  const boostRef = useRef(0)

  const seeds = useMemo<AuraSeed[]>(
    () =>
      Array.from({ length: cfg.count }, () => ({
        radius: THREE.MathUtils.randFloat(0.5, 1.6),
        angle: THREE.MathUtils.randFloat(0, Math.PI * 2),
        y0: THREE.MathUtils.randFloat(0, 2.6),
        speed: THREE.MathUtils.randFloat(0.6, 1.4),
        phase: THREE.MathUtils.randFloat(0, Math.PI * 2),
        scale: THREE.MathUtils.randFloat(0.7, 1.4),
      })),
    [cfg.count],
  )

  useFrame(({ camera }, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    boostRef.current = THREE.MathUtils.damp(boostRef.current, lit ? 1 : 0, 4, delta)
    if (!reducedMotion) timeRef.current += delta * (1 + boostRef.current * 1.4)
    const t = timeRef.current
    if (!cfg.boxy) {
      mesh.getWorldQuaternion(worldQuat)
      billQuat.copy(worldQuat).invert().multiply(camera.quaternion)
    }

    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i]
      let flicker = 1
      dummy.rotation.set(0, 0, 0)

      switch (cfg.mode) {
        case 'spores': {
          const y = ((s.y0 + t * s.speed * 0.35) % 2.6) - 1.1
          const a = s.angle + y * 0.6
          dummy.position.set(Math.cos(a) * s.radius, y, Math.sin(a) * s.radius)
          break
        }
        case 'clock': {
          const tick = Math.floor(t * 2) / 2
          const a = s.angle + tick * 0.9 * s.speed
          dummy.position.set(Math.cos(a) * 1.25, Math.sin(s.phase + tick * 2) * 0.12, Math.sin(a) * 1.25)
          break
        }
        case 'bloodrise': {
          const y = ((s.y0 + t * s.speed * 0.3) % 2.4) - 1.7
          dummy.position.set(Math.cos(s.angle) * s.radius * 0.55, y, Math.sin(s.angle) * s.radius * 0.55)
          break
        }
        case 'rumble': {
          // cascalho no topo do pedestal (~-1.45 relativo à arma), pulso sísmico coletivo
          const pulse = Math.pow(Math.max(0, Math.sin(t * 1.7 + s.phase * 0.15)), 14)
          const r = 0.35 + s.radius * 0.35
          dummy.position.set(Math.cos(s.angle) * r, -1.45 + pulse * (0.25 + s.y0 * 0.15), Math.sin(s.angle) * r)
          dummy.rotation.set(s.phase, s.angle, s.phase * 2)
          break
        }
        case 'weave': {
          const prog = (s.y0 + t * s.speed * 0.25) % 2.2
          const a = s.angle + prog * 3.2
          dummy.position.set(Math.cos(a) * 0.55, prog - 1.1, Math.sin(a) * 0.55)
          break
        }
        case 'sparks': {
          const jump = Math.floor(t * 6 + s.phase)
          dummy.position.set(
            sparkHash(jump, s.phase, 1) * 0.8,
            sparkHash(jump, s.phase, 2) * 1.0,
            sparkHash(jump, s.phase, 3) * 0.8,
          )
          flicker = 0.6 + Math.abs(sparkHash(jump, s.phase, 4)) * 0.8
          break
        }
        case 'flow': {
          const a = s.angle + t * s.speed * 0.7
          dummy.position.set(Math.cos(a) * 0.95, Math.sin(a * 2 + s.phase) * 0.55, Math.sin(a) * 0.95)
          break
        }
        case 'debris': {
          const a = s.angle + t * s.speed * 0.25 + Math.sin(t * 0.6 + s.phase) * 0.5
          const r = s.radius * (0.8 + Math.sin(t * 0.4 + s.phase) * 0.2)
          dummy.position.set(Math.cos(a) * r, Math.sin(t * 0.5 + s.phase) * 0.7, Math.sin(a) * r)
          dummy.rotation.set(t * s.speed + s.phase, t * 0.7 + s.phase, s.phase)
          break
        }
        case 'erratic': {
          const a = s.angle + Math.sin(t * s.speed * 0.9 + s.phase) * 2.6
          const r = s.radius * (0.75 + Math.sin(t * 1.1 + s.phase * 3) * 0.25)
          dummy.position.set(Math.cos(a) * r, Math.sin(t * 1.3 + s.phase * 2) * 0.85, Math.sin(a) * r)
          break
        }
        case 'ashfall': {
          const y = 1.9 - ((s.y0 + t * s.speed * 0.22) % 3.4)
          dummy.position.set(
            Math.cos(s.angle) * s.radius + Math.sin(t * 0.4 + s.phase) * 0.25,
            y,
            Math.sin(s.angle) * s.radius,
          )
          break
        }
      }

      // sprites encaram a câmera; cascalho/escombros (boxy) mantêm a rotação 3D
      if (!cfg.boxy) dummy.quaternion.copy(billQuat)
      dummy.scale.setScalar(cfg.size * s.scale * flicker)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true

    if (matRef.current) {
      matRef.current.opacity = Math.min(1, cfg.opacity * (0.75 + boostRef.current * 0.6))
    }
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, cfg.count]}
      frustumCulled={false}
      raycast={() => null}
    >
      {/* plano 2x2 = mesmo diâmetro da esfera antiga; setScalar continua valendo */}
      {cfg.boxy ? <boxGeometry args={[1, 1, 1]} /> : <planeGeometry args={[2, 2]} />}
      <meshBasicMaterial
        ref={matRef}
        map={auraTexture(cfg.mode)}
        color={cfg.tint ?? color}
        transparent
        opacity={cfg.opacity * 0.75}
        depthWrite={false}
        blending={cfg.additive ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </instancedMesh>
  )
}
