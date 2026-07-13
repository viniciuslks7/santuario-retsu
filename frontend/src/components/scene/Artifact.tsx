import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float, Html, useAnimations, useCursor, useGLTF } from '@react-three/drei'
import { useInspectSpin } from './useInspectSpin'
import type { ArtifactSeed } from '../../lib/artifacts'
import { ARTIFACT_SEEDS, CHOSEN_SEED } from '../../lib/artifacts'
import { useShrineStore } from '../../store/useShrineStore'

/** Carrega o GLB da arma e clona materiais por instância.
 *  Materiais chamados "glow" (definidos em tools/build-models.mjs) já trazem
 *  a cor emissiva do irmão; aqui só animamos a intensidade. Devolve também os
 *  AnimationClips embutidos no GLB (clip "idle") pra tocar com useAnimations. */
export function useWeaponModel(id: string) {
  const { scene, animations } = useGLTF(`/models/${id}.glb`)
  const built = useMemo(() => {
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
  return { ...built, animations }
}

/** Toca o clip idle embutido no GLB sobre o modelo clonado (mixer por instância). */
export function useIdleAnimation(model: THREE.Object3D, animations: THREE.AnimationClip[]) {
  const { actions } = useAnimations(animations, model)
  useEffect(() => {
    const idle = actions.idle
    if (!idle) return
    idle.reset().setLoop(THREE.LoopRepeat, Infinity).play()
    return () => void idle.stop()
  }, [actions])
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
        {/* pivô do giro na altura da arma, senão o pitch orbita em vez de inclinar */}
        <group position-y={3.2} ref={spinRef}>
          <primitive ref={weaponRef} object={model} />
        </group>
      </Float>

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
