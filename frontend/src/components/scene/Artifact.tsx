import { useRef } from 'react'
import type { ReactElement } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float, useCursor } from '@react-three/drei'
import type { ArtifactSeed, ArtifactShape } from '../../lib/artifacts'
import { useShrineStore } from '../../store/useShrineStore'

/** Geometria placeholder por tipo de arma — substituível por GLTF depois. */
const SHAPE_GEOMETRY: Record<ArtifactShape, ReactElement> = {
  nodachi: <boxGeometry args={[0.16, 2.6, 0.42]} />,
  katana: <boxGeometry args={[0.12, 2.2, 0.32]} />,
  greatblade: <boxGeometry args={[0.32, 2.9, 0.9]} />,
  spindle: <octahedronGeometry args={[0.7, 0]} />,
  urn: <cylinderGeometry args={[0.34, 0.5, 0.95, 14]} />,
  club: <cylinderGeometry args={[0.3, 0.16, 2.2, 8]} />,
  sickle: <torusGeometry args={[0.55, 0.13, 8, 18]} />,
}

interface ArtifactProps {
  seed: ArtifactSeed
  position: [number, number, number]
}

/** Pedestal de pedra + arma placeholder flutuando. Hover acende o brilho
 *  emissivo e amplia a arma; clique dispara a inspeção (CameraRig + overlay). */
export function Artifact({ seed, position }: ArtifactProps) {
  const select = useShrineStore((s) => s.select)
  const setHovered = useShrineStore((s) => s.setHovered)
  const hovered = useShrineStore((s) => s.hoveredSibling === seed.id)
  useCursor(hovered)

  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const weaponRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = THREE.MathUtils.damp(
        materialRef.current.emissiveIntensity,
        hovered ? 2.4 : 0.9,
        6,
        delta,
      )
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
        <mesh ref={weaponRef} position-y={3} castShadow>
          {SHAPE_GEOMETRY[seed.shape]}
          <meshStandardMaterial
            ref={materialRef}
            color="#3a332c"
            roughness={0.35}
            metalness={0.7}
            emissive={seed.color}
            emissiveIntensity={0.9}
          />
        </mesh>
      </Float>

      {/* Luz pontual fraca pra arma "banhar" o pedestal com sua cor */}
      <pointLight position-y={3} color={seed.color} intensity={2.5} distance={5} decay={2} />
    </group>
  )
}
