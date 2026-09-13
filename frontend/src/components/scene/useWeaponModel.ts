import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useAnimations, useGLTF } from '@react-three/drei'
import { ARTIFACT_SEEDS, CHOSEN_SEED } from '../../lib/artifacts'
import { useExperienceSettings } from '../../store/useExperienceSettings'
import { assetUrl } from '../../lib/assetUrl'

// Hooks compartilhados por Artifact e ChosenBlade. Vivem num .ts próprio
// pra Artifact.tsx só exportar componentes (exigência do fast refresh).

/** Carrega o GLB da arma e clona materiais por instância.
 *  Materiais chamados "glow" (definidos em tools/build-models.mjs) já trazem
 *  a cor emissiva do irmão; aqui só animamos a intensidade. Devolve também os
 *  AnimationClips embutidos no GLB (clip "idle") pra tocar com useAnimations. */
export function useWeaponModel(id: string) {
  const { scene, animations } = useGLTF(assetUrl(`models/${id}.glb`))
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
  const reducedMotion = useExperienceSettings((s) => s.reducedMotion)
  useEffect(() => {
    const idle = actions.idle
    if (!idle) return
    if (reducedMotion) { idle.stop(); return }
    idle.reset().setLoop(THREE.LoopRepeat, Infinity).play()
    return () => void idle.stop()
  }, [actions, reducedMotion])
}

for (const seed of [...ARTIFACT_SEEDS, CHOSEN_SEED]) {
  useGLTF.preload(assetUrl(`models/${seed.id}.glb`))
}
