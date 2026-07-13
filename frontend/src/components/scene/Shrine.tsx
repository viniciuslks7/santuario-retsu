import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, useCursor } from '@react-three/drei'
import { Artifact, useIdleAnimation, useWeaponModel } from './Artifact'
import { useShrineStore } from '../../store/useShrineStore'
import {
  ARTIFACT_SEEDS,
  CHOSEN_POSITION,
  CHOSEN_SEED,
  pedestalPosition,
} from '../../lib/artifacts'

/** Monólito central: miniatura da Biblioteca do Fim, levitando sobre runas.
 *  Clicável: abre o lore do clã (GET /api/clan). */
function CentralMonolith() {
  const ref = useRef<THREE.Group>(null)
  const runeRef = useRef<THREE.MeshBasicMaterial>(null)
  const openClan = useShrineStore((s) => s.openClan)
  const hovered = useShrineStore((s) => s.hoveredSibling === '__clan__')
  useCursor(hovered)

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    if (ref.current) {
      ref.current.position.y = 3.6 + Math.sin(t * 0.6) * 0.25
      ref.current.rotation.y = t * 0.08
    }
    if (runeRef.current) {
      const target = hovered ? 1 : 0.55 + Math.sin(t * 1.5) * 0.12
      runeRef.current.opacity = THREE.MathUtils.damp(runeRef.current.opacity, target, 5, delta)
    }
  })

  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        openClan()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        useShrineStore.getState().setHovered('__clan__')
      }}
      onPointerOut={() => useShrineStore.getState().setHovered(null)}
    >
      <group ref={ref}>
        {/* corpo principal */}
        <mesh castShadow>
          <boxGeometry args={[2.2, 5.4, 1.3]} />
          <meshStandardMaterial
            color="#2e2620"
            roughness={0.6}
            emissive="#d4a017"
            emissiveIntensity={hovered ? 0.4 : 0.18}
          />
        </mesh>
        {/* torres laterais — silhueta de fortaleza */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} castShadow position={[sx * 1.35, -0.6, 0]}>
            <boxGeometry args={[0.55, 3.6, 0.7]} />
            <meshStandardMaterial color="#241d18" roughness={0.7} emissive="#d4a017" emissiveIntensity={0.12} />
          </mesh>
        ))}
        {/* coroa de ameias no topo */}
        <mesh castShadow position-y={2.9}>
          <boxGeometry args={[2.5, 0.4, 1.6]} />
          <meshStandardMaterial color="#1f1914" roughness={0.7} />
        </mesh>
        {/* janelas acesas */}
        {[1.0, 0.2, -0.6].map((y) => (
          <mesh key={y} position={[0, y, 0.66]}>
            <boxGeometry args={[0.9, 0.18, 0.04]} />
            <meshBasicMaterial color="#ffcf6b" />
          </mesh>
        ))}
      </group>

      {/* Duplo anel de runas de gravidade no chão sob o monólito */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.46}>
        <ringGeometry args={[1.7, 2.3, 48]} />
        <meshBasicMaterial ref={runeRef} color="#d4a017" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.47}>
        <ringGeometry args={[2.6, 2.75, 48]} />
        <meshBasicMaterial color="#d4a017" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {hovered && (
        <Html center position-y={7.2} className="pointer-events-none select-none">
          <div className="border border-amber-500/60 bg-stone-950/80 px-3 py-1.5 text-center whitespace-nowrap backdrop-blur-sm">
            <p className="text-[10px] tracking-[0.35em] text-amber-200/70 uppercase">A fortaleza</p>
            <p className="font-display text-sm text-stone-100">A Biblioteca do Fim</p>
          </div>
        </Html>
      )}
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
  const { model, glowMaterials, animations } = useWeaponModel(CHOSEN_SEED.id)
  useIdleAnimation(model, animations)

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
