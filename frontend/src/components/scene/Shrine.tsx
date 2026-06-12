import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, useCursor } from '@react-three/drei'
import { Artifact, useWeaponModel } from './Artifact'
import { useShrineStore } from '../../store/useShrineStore'
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

/** A Sem-Nome: espada denteada da Chosen, cravada na areia fora do círculo.
 *  Quase apagada à distância — só "acorda" quando alguém a encontra. */
function ChosenBlade() {
  const select = useShrineStore((s) => s.select)
  const setHovered = useShrineStore((s) => s.setHovered)
  const hovered = useShrineStore((s) => s.hoveredSibling === CHOSEN_SEED.id)
  useCursor(hovered)
  const { model, glowMaterials } = useWeaponModel(CHOSEN_SEED.id)

  useFrame((_, delta) => {
    for (const m of glowMaterials) {
      m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, hovered ? 1.6 : 0.1, 6, delta)
    }
  })

  return (
    <group
      position={CHOSEN_POSITION}
      rotation={[0.12, 0.7, -0.5]}
      onClick={(e) => {
        e.stopPropagation()
        select(CHOSEN_SEED.id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(CHOSEN_SEED.id)
      }}
      onPointerOut={() => setHovered(null)}
    >
      <primitive object={model} position-y={1.1} />

      {hovered && (
        <Html center position-y={3.4} className="pointer-events-none select-none">
          <div className="border border-stone-400/60 bg-stone-950/80 px-3 py-1.5 text-center whitespace-nowrap backdrop-blur-sm">
            <p className="text-[10px] tracking-[0.35em] text-stone-400 uppercase">
              sem registro na biblioteca
            </p>
            <p className="font-display text-sm text-stone-100">???</p>
          </div>
        </Html>
      )}
    </group>
  )
}

export function Shrine() {
  return (
    <group>
      {/* Plataforma de pedra do santuário — clique raso (sem arrasto) volta pra visão geral */}
      <mesh
        position-y={0.22}
        receiveShadow
        castShadow
        onClick={(e) => {
          if (e.delta < 4) useShrineStore.getState().clearSelection()
        }}
      >
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
