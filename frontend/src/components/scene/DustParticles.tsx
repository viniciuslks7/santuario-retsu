import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { stormIntensity } from '../../lib/storm'

const BOUNDS = 70

// tons de areia: do queimado ao iluminado — cor por instância mata a cara de clone
const DUST_DARK = new THREE.Color('#c07d45')
const DUST_LIGHT = new THREE.Color('#f4d6ac')

interface DustSeed {
  x: number
  y: number
  z: number
  speed: number
  bob: number
  phase: number
  scale: number
  /** quanto o grão vira "risco" quando o vento aperta */
  stretch: number
}

/** Poeira do deserto: um único instancedMesh deslizando lentamente com o vento.
 *  Cada grão tem cor, tamanho e esticamento próprios; a rajada alonga os grãos
 *  no eixo do vento e a tempestade (stormIntensity) acelera tudo. */
export function DustParticles({ count = 350 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  // tempo de vento acumulado: rajadas mudam a velocidade sem teleportar a poeira
  const windTimeRef = useRef(0)

  const seeds = useMemo<DustSeed[]>(
    () =>
      Array.from({ length: count }, () => ({
        x: THREE.MathUtils.randFloatSpread(BOUNDS * 2),
        // Math.pow adensa perto do chão — poeira de verdade não flutua uniforme
        y: 0.3 + Math.pow(THREE.MathUtils.randFloat(0, 1), 1.7) * 14.7,
        z: THREE.MathUtils.randFloatSpread(BOUNDS * 2),
        speed: THREE.MathUtils.randFloat(0.4, 1.6),
        bob: THREE.MathUtils.randFloat(0.2, 0.7),
        phase: THREE.MathUtils.randFloat(0, Math.PI * 2),
        scale: THREE.MathUtils.randFloat(0.025, 0.14),
        stretch: THREE.MathUtils.randFloat(1.5, 4.5),
      })),
    [count],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const c = new THREE.Color()
    for (let i = 0; i < seeds.length; i++) {
      mesh.setColorAt(i, c.lerpColors(DUST_DARK, DUST_LIGHT, Math.random()))
    }
    mesh.instanceColor!.needsUpdate = true
  }, [seeds])

  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = clock.elapsedTime
    const storm = stormIntensity.value
    // O vento respira: duas senoides dessincronizadas viram rajadas e calmarias
    const gust = 0.55 + 0.45 * Math.sin(t * 0.22) + 0.25 * Math.sin(t * 0.53 + 1.7)
    // um clamp só: velocidade da poeira e esticamento visual derivam da mesma força
    const gustStrength = THREE.MathUtils.clamp(gust, 0.15, 1.25)
    const gustNorm = gustStrength / 1.25
    windTimeRef.current += delta * gustStrength * (1 + storm * 3.5)
    const wt = windTimeRef.current
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i]
      // Vento no eixo X com wrap-around dentro dos limites
      const x = ((s.x + wt * s.speed * 2 + BOUNDS) % (BOUNDS * 2)) - BOUNDS
      const y = s.y + Math.sin(t * s.bob + s.phase) * 0.9 + Math.sin(t * 2.3 + s.phase * 2) * 0.12
      const z = s.z + Math.sin(t * 0.12 + s.phase) * 2
      dummy.position.set(x, y, z)
      // rajada forte (ou tempestade) alonga o grão no eixo do vento — vira risco
      dummy.scale.set(s.scale * (1 + s.stretch * (gustNorm * 0.5 + storm * 2.5)), s.scale, s.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (matRef.current) matRef.current.opacity = 0.4 + storm * 0.2
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial ref={matRef} color="#ffffff" transparent opacity={0.4} depthWrite={false} />
    </instancedMesh>
  )
}
