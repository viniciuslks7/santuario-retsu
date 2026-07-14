import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const BOUNDS = 70

interface DustSeed {
  x: number
  y: number
  z: number
  speed: number
  bob: number
  phase: number
  scale: number
}

/** Poeira do deserto: um único instancedMesh deslizando lentamente com o vento. */
export function DustParticles({ count = 350 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  // tempo de vento acumulado: rajadas mudam a velocidade sem teleportar a poeira
  const windTimeRef = useRef(0)

  const seeds = useMemo<DustSeed[]>(
    () =>
      Array.from({ length: count }, () => ({
        x: THREE.MathUtils.randFloatSpread(BOUNDS * 2),
        y: THREE.MathUtils.randFloat(0.3, 15),
        z: THREE.MathUtils.randFloatSpread(BOUNDS * 2),
        speed: THREE.MathUtils.randFloat(0.4, 1.6),
        bob: THREE.MathUtils.randFloat(0.2, 0.7),
        phase: THREE.MathUtils.randFloat(0, Math.PI * 2),
        scale: THREE.MathUtils.randFloat(0.035, 0.12),
      })),
    [count],
  )

  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = clock.elapsedTime
    // O vento respira: duas senoides dessincronizadas viram rajadas e calmarias
    const gust = 0.55 + 0.45 * Math.sin(t * 0.22) + 0.25 * Math.sin(t * 0.53 + 1.7)
    windTimeRef.current += delta * THREE.MathUtils.clamp(gust, 0.15, 1.25)
    const wt = windTimeRef.current
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i]
      // Vento no eixo X com wrap-around dentro dos limites
      const x = ((s.x + wt * s.speed * 2 + BOUNDS) % (BOUNDS * 2)) - BOUNDS
      const y = s.y + Math.sin(t * s.bob + s.phase) * 0.9
      const z = s.z + Math.sin(t * 0.12 + s.phase) * 2
      dummy.position.set(x, y, z)
      dummy.scale.setScalar(s.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#e8b88a" transparent opacity={0.4} depthWrite={false} />
    </instancedMesh>
  )
}
