import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Artifact } from './Artifact'
import {
  ARTIFACT_SEEDS,
  CHOSEN_POSITION,
  CHOSEN_SEED,
  pedestalPosition,
} from '../../lib/artifacts'

/** Monólito central: miniatura da Biblioteca do Fim, levitando sobre runas. */
function CentralMonolith() {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.position.y = 3.6 + Math.sin(t * 0.6) * 0.25
    ref.current.rotation.y = t * 0.08
  })
  return (
    <group>
      <group ref={ref}>
        <mesh castShadow>
          <boxGeometry args={[2.2, 5.4, 1.3]} />
          <meshStandardMaterial
            color="#2e2620"
            roughness={0.6}
            emissive="#d4a017"
            emissiveIntensity={0.18}
          />
        </mesh>
      </group>
      {/* Anel de runas no chão sob o monólito */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.46}>
        <ringGeometry args={[1.7, 2.3, 48]} />
        <meshBasicMaterial color="#d4a017" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/** A Sem-Nome: espada denteada da Chosen, cravada na areia fora do círculo. */
function ChosenBlade() {
  return (
    <group position={CHOSEN_POSITION} rotation={[0.12, 0.7, -0.5]}>
      <mesh position-y={1.4} castShadow>
        <boxGeometry args={[0.24, 3, 0.55]} />
        <meshStandardMaterial
          color="#1f1d1b"
          roughness={0.55}
          metalness={0.8}
          emissive={CHOSEN_SEED.color}
          emissiveIntensity={0.15}
        />
      </mesh>
      <mesh position-y={2.6} castShadow>
        <boxGeometry args={[0.9, 0.18, 0.22]} />
        <meshStandardMaterial color="#2a241e" roughness={0.7} metalness={0.6} />
      </mesh>
    </group>
  )
}

export function Shrine() {
  return (
    <group>
      {/* Plataforma de pedra do santuário */}
      <mesh position-y={0.22} receiveShadow castShadow>
        <cylinderGeometry args={[12.5, 13.2, 0.45, 48]} />
        <meshStandardMaterial color="#8a6d4d" roughness={0.95} />
      </mesh>

      <CentralMonolith />

      {ARTIFACT_SEEDS.map((seed) => (
        <Artifact key={seed.id} seed={seed} position={pedestalPosition(seed.order)} />
      ))}

      <ChosenBlade />
    </group>
  )
}
