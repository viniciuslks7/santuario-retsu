import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useShrineStore } from '../../store/useShrineStore'
import { setWindStormLevel } from '../../lib/windAudio'
import { FOG_FAR, FOG_NEAR, stormIntensity } from '../../lib/storm'
import { getPuffTexture, getStreakTexture } from '../../lib/particleTextures'

// A tempestade do juramento: quando as nove lâminas são inspecionadas, o
// deserto se levanta por ~16s e desperta a espada da Chosen. Enquanto ruge,
// fecha o fog, arrasta riscos de areia pela cena e empurra o rugido no áudio.
// A intensidade sai daqui via lib/storm.ts (a DustParticles lê por frame).

const COUNT = 550
const BOUNDS = 80
const STORM_SECONDS = 16

// nuvens baixas de areia rolando rente ao chão — a "parede" da tempestade
const HAZE_COUNT = 16

const FOG_STORM_NEAR = 8
const FOG_STORM_FAR = 62
const STORM_TINT = new THREE.Color('#c08a56')

// tons de areia arrancada — mais claros que a poeira calma (areia no ar pega sol)
const STREAK_DARK = new THREE.Color('#b97f4e')
const STREAK_LIGHT = new THREE.Color('#f3d8ae')

interface StreakSeed {
  x: number
  y: number
  z: number
  speed: number
  length: number
  yaw: number
  phase: number
  scale: number
}

interface HazeSeed {
  x: number
  y: number
  z: number
  speed: number
  phase: number
  scale: number
  roll: number
}

export function SandStorm() {
  const stormPhase = useShrineStore((s) => s.stormPhase)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const hazeRef = useRef<THREE.InstancedMesh>(null)
  const hazeMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const windTimeRef = useRef(0)
  const ragingForRef = useRef(0)

  // ?storm=1 força a tempestade sem inspecionar as nove lâminas — deep-link de
  // verificação, mesma ideia do ?tod/?focus.
  const forced = useMemo(
    () => new URLSearchParams(window.location.search).get('storm') === '1',
    [],
  )

  // forçada também vira 'raging' no store — sem isso os banners do Hud não
  // aparecem no deep-link de QA (o timer de endStorm já ignora o modo forçado)
  useEffect(() => {
    if (forced) useShrineStore.setState({ stormPhase: 'raging' })
  }, [forced])

  const seeds = useMemo<StreakSeed[]>(
    () =>
      Array.from({ length: COUNT }, () => ({
        x: THREE.MathUtils.randFloatSpread(BOUNDS * 2),
        y: THREE.MathUtils.randFloat(0.4, 12),
        z: THREE.MathUtils.randFloatSpread(BOUNDS * 2),
        speed: THREE.MathUtils.randFloat(0.7, 1.4),
        length: THREE.MathUtils.randFloat(4, 11),
        yaw: THREE.MathUtils.randFloat(-0.16, 0.16),
        phase: THREE.MathUtils.randFloat(0, Math.PI * 2),
        scale: THREE.MathUtils.randFloat(0.05, 0.16),
      })),
    [],
  )

  const hazeSeeds = useMemo<HazeSeed[]>(
    () =>
      Array.from({ length: HAZE_COUNT }, () => ({
        x: THREE.MathUtils.randFloatSpread(BOUNDS * 2),
        y: THREE.MathUtils.randFloat(0.8, 3.2),
        z: THREE.MathUtils.randFloatSpread(BOUNDS * 2),
        speed: THREE.MathUtils.randFloat(0.5, 1.1),
        phase: THREE.MathUtils.randFloat(0, Math.PI * 2),
        scale: THREE.MathUtils.randFloat(7, 15),
        roll: THREE.MathUtils.randFloat(-0.4, 0.4),
      })),
    [],
  )

  // cor por instância definida uma vez — variação de tom é o que tira a cara
  // de "clone" das partículas
  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const c = new THREE.Color()
    for (let i = 0; i < seeds.length; i++) {
      mesh.setColorAt(i, c.lerpColors(STREAK_DARK, STREAK_LIGHT, Math.random()))
    }
    mesh.instanceColor!.needsUpdate = true
    const haze = hazeRef.current
    if (!haze) return
    for (let i = 0; i < hazeSeeds.length; i++) {
      haze.setColorAt(i, c.lerpColors(STREAK_DARK, STREAK_LIGHT, Math.random()))
    }
    haze.instanceColor!.needsUpdate = true
  }, [seeds, hazeSeeds])

  useFrame(({ clock, scene, camera }, delta) => {
    const raging = forced || stormPhase === 'raging'

    // sobe rápido (a rajada chega), assenta devagar (a areia demora a baixar)
    stormIntensity.value = THREE.MathUtils.damp(
      stormIntensity.value,
      raging ? 1 : 0,
      raging ? 0.9 : 0.35,
      delta,
    )
    const k = stormIntensity.value

    if (stormPhase === 'raging' && !forced) {
      ragingForRef.current += delta
      if (ragingForRef.current > STORM_SECONDS) useShrineStore.getState().endStorm()
    }

    setWindStormLevel(k)

    // DesertEnvironment escreve a cor do ciclo dia/noite antes (ordem de
    // montagem em Experience); a tempestade fecha a visibilidade por cima.
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = THREE.MathUtils.lerp(FOG_NEAR, FOG_STORM_NEAR, k)
      scene.fog.far = THREE.MathUtils.lerp(FOG_FAR, FOG_STORM_FAR, k)
      scene.fog.color.lerp(STORM_TINT, k * 0.85)
    }

    const mesh = meshRef.current
    const haze = hazeRef.current
    if (!mesh || !haze) return
    mesh.visible = k > 0.015
    haze.visible = mesh.visible
    if (matRef.current) matRef.current.opacity = 0.55 * k
    if (hazeMatRef.current) hazeMatRef.current.opacity = 0.16 * k
    if (!mesh.visible) return

    // tempo de vento acumulado: a velocidade muda com k sem teleportar riscos
    windTimeRef.current += delta * (6 + k * 26)
    const wt = windTimeRef.current
    const t = clock.elapsedTime

    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i]
      const x = ((s.x + wt * s.speed + BOUNDS) % (BOUNDS * 2)) - BOUNDS
      const y = s.y + Math.sin(t * 1.8 + s.phase) * 0.5
      const z = s.z + Math.sin(t * 0.7 + s.phase) * 1.2
      dummy.position.set(x, y, z)
      // billboard + leve rolagem: a textura de risco encara a câmera e o
      // stretch em X mantém a leitura de vento
      dummy.quaternion.copy(camera.quaternion)
      dummy.rotateZ(s.yaw + Math.sin(s.phase) * 0.05)
      // esticado no eixo do vento: risco, não bolinha
      dummy.scale.set(s.scale * s.length * (0.4 + k), s.scale * 2.2, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true

    // nuvens baixas: rolam mais devagar que os riscos e "fervem" de leve
    for (let i = 0; i < hazeSeeds.length; i++) {
      const s = hazeSeeds[i]
      const x = ((s.x + wt * s.speed * 0.35 + BOUNDS) % (BOUNDS * 2)) - BOUNDS
      const y = s.y + Math.sin(t * 0.5 + s.phase) * 0.4
      const z = s.z + Math.sin(t * 0.3 + s.phase) * 1.5
      dummy.position.set(x, y, z)
      dummy.quaternion.copy(camera.quaternion)
      dummy.rotateZ(s.roll + t * 0.03 * (i % 2 === 0 ? 1 : -1))
      const puffScale = s.scale * (0.85 + Math.sin(t * 0.4 + s.phase) * 0.15)
      dummy.scale.set(puffScale * 1.6, puffScale, 1)
      dummy.updateMatrix()
      haze.setMatrixAt(i, dummy.matrix)
    }
    haze.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, COUNT]}
        frustumCulled={false}
        visible={false}
        raycast={() => null}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={matRef}
          map={getStreakTexture()}
          color="#ffffff"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={hazeRef}
        args={[undefined, undefined, HAZE_COUNT]}
        frustumCulled={false}
        visible={false}
        raycast={() => null}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={hazeMatRef}
          map={getPuffTexture()}
          color="#ffffff"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </instancedMesh>
    </>
  )
}
