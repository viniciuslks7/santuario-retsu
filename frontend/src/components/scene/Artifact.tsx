import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float, useCursor, useGLTF } from '@react-three/drei'
import type { ArtifactSeed } from '../../lib/artifacts'
import { ARTIFACT_SEEDS, CHOSEN_SEED } from '../../lib/artifacts'
import { useShrineStore } from '../../store/useShrineStore'

/** Carrega o GLB da arma e clona materiais por instância.
 *  Materiais chamados "glow" (definidos em tools/build-models.mjs) já trazem
 *  a cor emissiva do irmão; aqui só animamos a intensidade. */
export function useWeaponModel(id: string) {
  const { scene } = useGLTF(`/models/${id}.glb`)
  return useMemo(() => {
    const model = scene.clone(true)
    const glowMaterials: THREE.MeshStandardMaterial[] = []
    model.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      obj.castShadow = true
      const cloned = (obj.material as THREE.MeshStandardMaterial).clone()
      obj.material = cloned
      if (cloned.name === 'glow') glowMaterials.push(cloned)
    })
    return { model, glowMaterials }
  }, [scene])
}

for (const seed of [...ARTIFACT_SEEDS, CHOSEN_SEED]) {
  useGLTF.preload(`/models/${seed.id}.glb`)
}

interface ArtifactProps {
  seed: ArtifactSeed
  position: [number, number, number]
}

/** Pedestal de pedra + arma GLB flutuando. Hover intensifica o brilho
 *  emissivo e amplia a arma; clique dispara a inspeção (CameraRig + overlay). */
export function Artifact({ seed, position }: ArtifactProps) {
  const select = useShrineStore((s) => s.select)
  const setHovered = useShrineStore((s) => s.setHovered)
  const hovered = useShrineStore((s) => s.hoveredSibling === seed.id)
  useCursor(hovered)

  const { model, glowMaterials } = useWeaponModel(seed.id)
  const weaponRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    for (const m of glowMaterials) {
      m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, hovered ? 3.2 : 1.2, 6, delta)
    }
    if (weaponRef.current) {
      const s = THREE.MathUtils.damp(weaponRef.current.scale.x, hovered ? 1.14 : 1, 6, delta)
      weaponRef.current.scale.setScalar(s)
    }
  })

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        select(seed.id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(seed.id)
      }}
      onPointerOut={() => setHovered(null)}
    >
      <mesh position-y={0.8} castShadow receiveShadow>
        <cylinderGeometry args={[0.62, 0.78, 1.6, 10]} />
        <meshStandardMaterial color="#6b573f" roughness={0.9} />
      </mesh>
      <mesh position-y={1.68}>
        <cylinderGeometry args={[0.74, 0.74, 0.14, 10]} />
        <meshStandardMaterial color="#55432f" roughness={0.9} />
      </mesh>

      <Float speed={2.2} rotationIntensity={0.45} floatIntensity={0.7} floatingRange={[0, 0.35]}>
        <primitive ref={weaponRef} object={model} position-y={3.2} />
      </Float>

      {/* Luz pontual fraca pra arma "banhar" o pedestal com sua cor */}
      <pointLight position-y={3} color={seed.color} intensity={2.5} distance={5} decay={2} />
    </group>
  )
}
