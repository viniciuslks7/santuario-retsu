import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, useCursor } from '@react-three/drei'
import { Artifact } from './Artifact'
import { useIdleAnimation, useWeaponModel } from './useWeaponModel'
import { ArtifactAura } from './ArtifactAura'
import { useInspectSpin } from './useInspectSpin'
import { PagodaRoof, WindowWall } from './Landmarks'
import { useShrineStore } from '../../store/useShrineStore'
import {
  ARTIFACT_SEEDS,
  CHOSEN_POSITION,
  CHOSEN_SEED,
  pedestalPosition,
} from '../../lib/artifacts'
import { playWeaponChime, playWeaponDraw } from '../../lib/weaponAudio'

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
        {/* corpo principal — pedra escura, como a fortaleza-mãe no horizonte */}
        <mesh castShadow>
          <boxGeometry args={[2.2, 4.6, 1.8]} />
          <meshStandardMaterial
            color="#241c15"
            roughness={0.8}
            emissive="#d4a017"
            emissiveIntensity={hovered ? 0.3 : 0.08}
          />
        </mesh>
        {/* faixa de pedra a meia altura */}
        <mesh position-y={0.4}>
          <boxGeometry args={[2.34, 0.22, 1.94]} />
          <meshStandardMaterial color="#3a2e22" roughness={0.85} />
        </mesh>
        {/* torres laterais — silhueta de fortaleza */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 1.5, -0.9, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.65, 2.8, 0.8]} />
              <meshStandardMaterial color="#241d18" roughness={0.8} emissive="#d4a017" emissiveIntensity={0.06} />
            </mesh>
            <group position-y={1.4}>
              <PagodaRoof baseW={0.85} tiers={1} tierH={0.5} />
            </group>
          </group>
        ))}
        {/* janelas acesas nas quatro faces (mesmo brilho HDR da fortaleza-mãe) */}
        <group position={[0, -2.1, 0.92]}>
          <WindowWall w={2.2} h={4.2} z={0} cols={2} rows={4} />
        </group>
        <group rotation-y={Math.PI} position={[0, -2.1, -0.92]}>
          <WindowWall w={2.2} h={4.2} z={0} cols={2} rows={4} />
        </group>
        <group rotation-y={Math.PI / 2} position={[1.12, -2.1, 0]}>
          <WindowWall w={1.8} h={4.2} z={0} cols={2} rows={4} />
        </group>
        <group rotation-y={-Math.PI / 2} position={[-1.12, -2.1, 0]}>
          <WindowWall w={1.8} h={4.2} z={0} cols={2} rows={4} />
        </group>
        {/* telhado de pagode coroando o monólito */}
        <group position-y={2.3}>
          <PagodaRoof baseW={2.7} tiers={3} tierH={0.75} />
        </group>
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
  const selected = useShrineStore((s) => s.selectedSibling === CHOSEN_SEED.id)
  // depois da tempestade a lâmina não volta a dormir
  const awakened = useShrineStore((s) => s.stormPhase === 'done')
  useCursor(hovered)
  const { model, glowMaterials, animations } = useWeaponModel(CHOSEN_SEED.id)
  useIdleAnimation(model, animations)
  const spinRef = useInspectSpin(selected)

  useFrame((_, delta) => {
    // Encontrada (hover), em inspeção ou desperta: a pressão espiritual acorda
    const lit = hovered || selected
    const target = lit ? 1.6 : awakened ? 0.8 : 0.1
    for (const m of glowMaterials) {
      m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, target, 6, delta)
    }
  })

  return (
    <group
      position={CHOSEN_POSITION}
      rotation={[0.1, -0.85, -0.34]}
      onClick={(e) => {
        e.stopPropagation()
        playWeaponDraw(CHOSEN_SEED.order)
        select(CHOSEN_SEED.id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        if (!hovered) playWeaponChime(CHOSEN_SEED.order)
        setHovered(CHOSEN_SEED.id)
      }}
      onPointerOut={() => setHovered(null)}
    >
      {/* pivô do giro no meio da lâmina */}
      <group position-y={1.1} ref={spinRef}>
        <primitive object={model} />
      </group>

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

/** Pilar de luz pálida sobre a Sem-Nome — o farol que a tempestade acende.
 *  Cor HDR (>1) pro Bloom estourar de leve; opacidade sobe em fade lento. */
function AwakenedBeacon() {
  const awakened = useShrineStore((s) => s.stormPhase === 'done')
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const beaconColor = useMemo(() => new THREE.Color(1.7, 1.6, 1.4), [])

  useFrame(({ clock }, delta) => {
    const target = awakened ? 0.14 + Math.sin(clock.elapsedTime * 1.3) * 0.035 : 0
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.damp(matRef.current.opacity, target, 1.1, delta)
    }
    if (lightRef.current) {
      lightRef.current.intensity = THREE.MathUtils.damp(
        lightRef.current.intensity,
        awakened ? 3 : 0,
        1.1,
        delta,
      )
    }
  })

  return (
    <group position={CHOSEN_POSITION}>
      <mesh position-y={7} raycast={() => null}>
        <cylinderGeometry args={[0.4, 0.9, 14, 20, 1, true]} />
        <meshBasicMaterial
          ref={matRef}
          color={beaconColor}
          toneMapped={false}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight ref={lightRef} position-y={2.4} color="#e8e2d4" intensity={0} distance={10} decay={2} />
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
      <AwakenedBeacon />

      {/* Cinzas da Chosen montadas fora do ChosenBlade: o grupo dela é rotacionado
          e a queda das cinzas precisa continuar vertical */}
      <group position={CHOSEN_POSITION}>
        <group position-y={1.1}>
          <ArtifactAura id={CHOSEN_SEED.id} color={CHOSEN_SEED.color} />
        </group>
      </group>
    </group>
  )
}
