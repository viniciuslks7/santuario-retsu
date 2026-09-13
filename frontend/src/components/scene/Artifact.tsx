import { useStoneTexture } from '../../lib/useStoneTexture'
import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float, Html, useCursor } from '@react-three/drei'
import { useInspectSpin } from './useInspectSpin'
import { useIdleAnimation, useWeaponModel } from './useWeaponModel'
import { ArtifactAura } from './ArtifactAura'
import type { ArtifactSeed } from '../../lib/artifacts'
import { playWeaponChime, playWeaponDraw } from '../../lib/weaponAudio'
import { useShrineStore } from '../../store/useShrineStore'
import { useExperienceSettings } from '../../store/useExperienceSettings'
import { BRONZE, DARK_STONE } from './WorldDetails'

interface ArtifactProps {
  seed: ArtifactSeed
  position: [number, number, number]
}

/** Pedestal de pedra + arma GLB flutuando. Hover intensifica o brilho
 *  emissivo e amplia a arma; clique dispara a inspeção (CameraRig + overlay). */
export function Artifact({ seed, position }: ArtifactProps) {
  const reducedMotion = useExperienceSettings((s) => s.reducedMotion)
  const texture = useStoneTexture()
  const select = useShrineStore((s) => s.select)
  const setHovered = useShrineStore((s) => s.setHovered)
  const hovered = useShrineStore((s) => s.hoveredSibling === seed.id)
  const selected = useShrineStore((s) => s.selectedSibling === seed.id)
  const summary = useShrineStore((s) => s.siblingIndex[seed.id])
  useCursor(hovered)

  const { model, glowMaterials, animations } = useWeaponModel(seed.id)
  useIdleAnimation(model, animations)
  const weaponRef = useRef<THREE.Group>(null)
  const spinRef = useInspectSpin(selected)

  useFrame((_, delta) => {
    // Em inspeção a arma também acende — o close não fica apagado
    const lit = hovered || selected
    for (const m of glowMaterials) {
      m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, lit ? 3.2 : 1.2, 6, delta)
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
        playWeaponDraw(seed.order)
        select(seed.id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        // só na entrada real: atravessar os meshes do pedestal re-dispara o evento
        if (!hovered) playWeaponChime(seed.order)
        setHovered(seed.id)
      }}
      onPointerOut={() => setHovered(null)}
    >
      <group rotation-y={Math.atan2(position[0], position[2])}>
        <mesh position-y={.55} castShadow receiveShadow><cylinderGeometry args={[1.02, 1.15, .25, 8]} /><meshStandardMaterial color="#575e50" roughness={.95} bumpMap={texture} bumpScale={.07} /></mesh>
        <mesh position-y={1.03} castShadow receiveShadow><cylinderGeometry args={[.59, .83, .83, 8]} /><meshStandardMaterial color={DARK_STONE} roughness={.85} bumpMap={texture} bumpScale={.085} /></mesh>
        <mesh position-y={1.45}><cylinderGeometry args={[.74, .61, .15, 8]} /><meshStandardMaterial color={BRONZE} metalness={.65} roughness={.48} /></mesh>
        <mesh position-y={1.63} castShadow><cylinderGeometry args={[.91, .75, .22, 8]} /><meshStandardMaterial color="#596153" roughness={.8} bumpMap={texture} bumpScale={.06} /></mesh>
        <mesh position-y={1.76} rotation-x={-Math.PI / 2}><ringGeometry args={[.5, .72, 8]} /><meshStandardMaterial color={seed.color} emissive={seed.color} emissiveIntensity={selected || hovered ? 1.6 : .45} metalness={.3} roughness={.5} /></mesh>
        {[-1, 1].map((x) => <mesh key={x} position={[x * .44, 1.02, .54]} rotation-z={x * -.12}><boxGeometry args={[.035, .65, .035]} /><meshStandardMaterial color={BRONZE} metalness={.6} roughness={.45} /></mesh>)}
        <mesh position={[0, 1.04, .64]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[.2, .2, .025]} /><meshStandardMaterial color={seed.color} emissive={seed.color} emissiveIntensity={.5} metalness={.5} roughness={.45} /></mesh>
        {Array.from({ length: seed.order }, (_, i) => <mesh key={i} position={[(i - (seed.order - 1) / 2) * .062, .78, .72]}><boxGeometry args={[.023, .09, .018]} /><meshStandardMaterial color={BRONZE} roughness={.6} metalness={.4} /></mesh>)}
      </group>

      <Float speed={reducedMotion ? 0 : 1.8} rotationIntensity={reducedMotion ? 0 : 0.24} floatIntensity={reducedMotion ? 0 : 1} floatingRange={[-0.15, 0.4]}>
        {/* pivô do giro na altura da arma, senão o pitch orbita em vez de inclinar */}
        <group position-y={3.2} ref={spinRef}>
          <primitive ref={weaponRef} object={model} />
        </group>
      </Float>

      {/* Aura elemental do irmão, na altura da arma (fora do Float: tem movimento próprio) */}
      <group position-y={3.2}>
        <ArtifactAura id={seed.id} color={seed.color} />
      </group>

      {/* Luz pontual fraca pra arma "banhar" o pedestal com sua cor */}
      <pointLight position-y={3} color={seed.color} intensity={2.5} distance={5} decay={2} />

      {/* Nameplate de hover (dados do índice da API) */}
      {hovered && summary && (
        <Html center position-y={5.1} className="pointer-events-none select-none">
          <div
            className="border bg-stone-950/80 px-3 py-1.5 text-center whitespace-nowrap backdrop-blur-sm"
            style={{ borderColor: seed.color }}
          >
            <p className="text-[10px] tracking-[0.35em] text-stone-400 uppercase">
              {summary.epithet}
            </p>
            <p className="font-display text-sm text-stone-100">{summary.name}</p>
          </div>
        </Html>
      )}
    </group>
  )
}
