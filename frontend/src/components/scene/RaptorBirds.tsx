// frontend/src/components/scene/RaptorBirds.tsx
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { createRaptorGeometry } from '../../lib/raptorGeometry'
import { useShrineStore } from '../../store/useShrineStore'

// Aves de rapina circulando sobre o Shrine (centro da cena). Debandam de vez
// no início da tempestade do juramento (stormPhase 'raging') — a fauna foge
// da tormenta — e nunca voltam, mesmo padrão de stormPhase nunca retornar a
// 'idle' na mesma visita.

const CENTER = new THREE.Vector3(0, 0, 0)
const BANK_AMOUNT = 0.35
/** duração da debandada: raio e altura crescem em ease-out até a ave sumir de vista */
const FLEE_SECONDS = 5
const BODY_COLOR = new THREE.Color('#1c140d')

interface RaptorSeed {
  radius: number
  height: number
  /** rad/s — sinal define sentido do círculo (horário/anti-horário) */
  angularSpeed: number
  phase: number
  bob: number
}

const SEEDS: RaptorSeed[] = [
  { radius: 10, height: 11, angularSpeed: 0.22, phase: 0, bob: 0.6 },
  { radius: 13, height: 9.5, angularSpeed: -0.16, phase: 2.4, bob: 0.9 },
  { radius: 8.5, height: 12, angularSpeed: 0.28, phase: 4.6, bob: 0.4 },
]

function Raptor({
  seed,
  geometry,
  fleeStartRef,
}: {
  seed: RaptorSeed
  geometry: THREE.BufferGeometry
  fleeStartRef: React.MutableRefObject<number | null>
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh || !mesh.visible) return
    const t = clock.elapsedTime
    const angle = seed.phase + t * seed.angularSpeed

    let radius = seed.radius
    let height = seed.height + Math.sin(t * seed.bob + seed.phase) * 0.6

    const fleeStart = fleeStartRef.current
    if (fleeStart !== null) {
      const elapsed = t - fleeStart
      if (elapsed > FLEE_SECONDS) {
        mesh.visible = false
        return
      }
      // ease-out: acelera pra fora rápido no início, suaviza perto do fim
      const k = 1 - Math.pow(1 - Math.min(elapsed / FLEE_SECONDS, 1), 3)
      radius += k * 60
      height += k * 40
    }

    const x = CENTER.x + radius * Math.cos(angle)
    const z = CENTER.z + radius * Math.sin(angle)
    mesh.position.set(x, height, z)

    // tangente da trajetória circular = direção de voo; dirSign carrega o
    // sentido do círculo (sinal de angularSpeed)
    const dirSign = Math.sign(seed.angularSpeed) || 1
    target.set(x - Math.sin(angle) * dirSign, height, z + Math.cos(angle) * dirSign)
    mesh.lookAt(target)
    // banking: inclina na curva (raio constante = curvatura constante, então
    // um ângulo fixo já lê bem — sem precisar variar por frame)
    mesh.rotateZ(-dirSign * BANK_AMOUNT)
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial color={BODY_COLOR} roughness={0.9} metalness={0} side={THREE.DoubleSide} />
    </mesh>
  )
}

export function RaptorBirds() {
  const geometry = useMemo(() => createRaptorGeometry(), [])
  const stormPhase = useShrineStore((s) => s.stormPhase)
  const clock = useThree((s) => s.clock)
  const fleeStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (stormPhase === 'raging' && fleeStartRef.current === null) {
      fleeStartRef.current = clock.elapsedTime
    }
  }, [stormPhase, clock])

  return (
    <>
      {SEEDS.map((seed, i) => (
        <Raptor key={i} seed={seed} geometry={geometry} fleeStartRef={fleeStartRef} />
      ))}
    </>
  )
}
