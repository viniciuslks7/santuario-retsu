import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer, Sky, Stars } from '@react-three/drei'
import type { Sky as SkyImpl } from 'three-stdlib'
import { duneHeight } from '../../lib/dunes'
import { emitSandBurst } from '../../lib/sandBurst'
import { useShrineStore } from '../../store/useShrineStore'

// ── Ciclo dia/noite ──────────────────────────────────────────────────────────
// O sol viaja num arco fixo de azimute (o mesmo do pôr do sol original) e o
// ciclo começa exatamente no pôr do sol — a identidade da cena — rumo à noite.
// Tudo é mutado imperativamente no useFrame (idioma R3F): zero re-render.

/** Segundos por dia completo (pôr do sol → noite → dia → pôr do sol). */
const DAY_LENGTH = 240

/** Azimute do arco solar (direção xz do pôr do sol original, normalizada). */
const SUN_AXIS = new THREE.Vector3(-0.55, 0, -0.82).normalize()

/** Elevação máxima do sol ao meio-dia (radianos). */
const MAX_ELEVATION = 0.9

/** Fase inicial: elevação ~0.08 (pôr do sol original) descendo pra noite. */
const PHASE0 = Math.PI - Math.asin(0.08 / MAX_ELEVATION)

/** Direção do sol pra fração do dia [0..1) — escreve em `out` (sem alocar). */
function sunDirectionAt(frac: number, out: THREE.Vector3) {
  const theta = MAX_ELEVATION * Math.sin(Math.PI * 2 * frac + PHASE0)
  const c = Math.cos(theta)
  return out.set(SUN_AXIS.x * c, Math.sin(theta), SUN_AXIS.z * c)
}

/** Lua fixa no céu oposto ao pôr do sol — só aparece quando a noite fecha. */
const MOON_DIRECTION = new THREE.Vector3(0.55, 0.5, 0.82).normalize()

const PALETTE = {
  sunWarm: new THREE.Color('#ff9a5a'),
  sunDay: new THREE.Color('#fff2dd'),
  hemiSkySunset: new THREE.Color('#ffb38a'),
  hemiSkyDay: new THREE.Color('#cfd8e8'),
  hemiSkyNight: new THREE.Color('#232c45'),
  hemiGroundSunset: new THREE.Color('#4a3322'),
  hemiGroundDay: new THREE.Color('#6a5a48'),
  hemiGroundNight: new THREE.Color('#141821'),
  fogSunset: new THREE.Color('#c97f52'),
  fogDay: new THREE.Color('#d9b08c'),
  fogNight: new THREE.Color('#141824'),
  // cores HDR (>1) pros discos estourarem no Bloom — o diurno mais contido:
  // com o sol a pino o Bloom forte lavava o terço superior da tela de branco
  discWarm: new THREE.Color(3.2, 2.2, 1.2),
  discDay: new THREE.Color(2.4, 2.3, 2.1),
}

function useDuneGeometry() {
  return useMemo(() => {
    const geo = new THREE.PlaneGeometry(320, 320, 140, 140)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // O plano vira o chão rodando -90° em X, então y do plano = -z do mundo
      pos.setZ(i, duneHeight(x, -y))
    }
    geo.computeVertexNormals()
    return geo
  }, [])
}

export function DesertEnvironment() {
  const dunes = useDuneGeometry()

  const skyRef = useRef<SkyImpl>(null)
  const sunLightRef = useRef<THREE.DirectionalLight>(null)
  const moonLightRef = useRef<THREE.DirectionalLight>(null)
  const hemiRef = useRef<THREE.HemisphereLight>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const sunDiscRef = useRef<THREE.Mesh>(null)
  const moonDiscRef = useRef<THREE.Mesh>(null)
  const starsRef = useRef<THREE.Group>(null)
  const sunDir = useMemo(() => new THREE.Vector3(), [])
  const fogScratch = useMemo(() => new THREE.Color(), [])

  // ?tod=0..1 congela a hora do dia (0 = pôr do sol, 0.25 = noite, 0.75 = dia)
  // — deep-link de verificação, mesma ideia do ?focus.
  const todOverride = useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get('tod')
    if (raw === null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? THREE.MathUtils.clamp(n, 0, 1) : null
  }, [])

  useFrame(({ clock, scene }) => {
    const frac = todOverride ?? (clock.elapsedTime / DAY_LENGTH) % 1
    sunDirectionAt(frac, sunDir)
    const y = sunDir.y
    const day = THREE.MathUtils.smoothstep(y, -0.04, 0.25) // 0 noite → 1 dia
    const night = 1 - THREE.MathUtils.smoothstep(y, -0.12, 0) // 1 noite fechada
    const gold = 1 - THREE.MathUtils.smoothstep(y, 0.08, 0.5) // 1 hora dourada

    if (skyRef.current) {
      const uniforms = skyRef.current.material.uniforms
      uniforms.sunPosition.value.copy(sunDir).multiplyScalar(180)
      // O céu é tunado pro poente (turbidity 9 / rayleigh 5) — com o sol alto
      // esses valores viram leite. Rumo ao meio-dia o ar limpa e azula; na hora
      // dourada e à noite `noon` volta a 0 e a identidade da cena permanece.
      const noon = day * (1 - gold)
      uniforms.turbidity.value = THREE.MathUtils.lerp(9, 3.5, noon)
      uniforms.rayleigh.value = THREE.MathUtils.lerp(5, 1.4, noon)
      uniforms.mieCoefficient.value = THREE.MathUtils.lerp(0.02, 0.006, noon)
    }

    const sun = sunLightRef.current
    if (sun) {
      sun.position.copy(sunDir).multiplyScalar(70)
      sun.intensity = 2.4 * day
      sun.color.lerpColors(PALETTE.sunWarm, PALETTE.sunDay, 1 - gold)
    }
    if (moonLightRef.current) moonLightRef.current.intensity = 0.5 * night

    const hemi = hemiRef.current
    if (hemi) {
      hemi.color.lerpColors(PALETTE.hemiSkySunset, PALETTE.hemiSkyDay, 1 - gold)
      hemi.color.lerp(PALETTE.hemiSkyNight, night)
      hemi.groundColor.lerpColors(PALETTE.hemiGroundSunset, PALETTE.hemiGroundDay, 1 - gold)
      hemi.groundColor.lerp(PALETTE.hemiGroundNight, night)
      hemi.intensity = THREE.MathUtils.lerp(0.55 + 0.2 * (1 - gold), 0.2, night)
    }
    if (ambientRef.current) ambientRef.current.intensity = 0.12 - 0.07 * night

    if (scene.fog instanceof THREE.Fog) {
      fogScratch.lerpColors(PALETTE.fogSunset, PALETTE.fogDay, 1 - gold)
      fogScratch.lerp(PALETTE.fogNight, night)
      scene.fog.color.copy(fogScratch)
    }

    const disc = sunDiscRef.current
    if (disc) {
      disc.position.copy(sunDir).multiplyScalar(220)
      disc.visible = y > -0.06
      ;(disc.material as THREE.MeshBasicMaterial).color.lerpColors(
        PALETTE.discWarm,
        PALETTE.discDay,
        1 - gold,
      )
    }
    const moon = moonDiscRef.current
    if (moon) {
      const mat = moon.material as THREE.MeshBasicMaterial
      mat.opacity = 0.1 + 0.9 * night
      moon.visible = night > 0.02
    }
    // céu já está escuro nesse limiar — o pop das estrelas fica invisível
    if (starsRef.current) starsRef.current.visible = y < -0.02
  })

  return (
    <>
      <Sky
        ref={skyRef}
        distance={4000}
        sunPosition={SUN_AXIS.clone().setY(0.08).normalize().multiplyScalar(180).toArray()}
        turbidity={9}
        rayleigh={5}
        mieCoefficient={0.02}
        mieDirectionalG={0.97}
      />

      {/* Estrelas só visíveis com o sol bem abaixo do horizonte */}
      <group ref={starsRef} visible={false}>
        <Stars radius={280} depth={60} count={2500} factor={5} saturation={0} fade speed={0.6} />
      </group>

      {/* Disco solar — cor HDR acima de 1 pra estourar no Bloom */}
      <mesh ref={sunDiscRef}>
        <sphereGeometry args={[12, 24, 24]} />
        <meshBasicMaterial color={PALETTE.discWarm} toneMapped={false} />
      </mesh>

      {/* A lua morta, pálida, oposta ao poente */}
      <mesh ref={moonDiscRef} position={MOON_DIRECTION.clone().multiplyScalar(260).toArray()} visible={false}>
        <sphereGeometry args={[9, 24, 24]} />
        <meshBasicMaterial color={new THREE.Color(1.3, 1.4, 1.6)} toneMapped={false} transparent opacity={0} />
      </mesh>

      {/* Sol: luz quente e rasante no poente, branca e alta ao meio-dia */}
      <directionalLight
        ref={sunLightRef}
        position={[-38.5, 5.6, -57.4]}
        intensity={2.4}
        color="#ff9a5a"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-far={200}
        shadow-bias={-0.0004}
      />
      {/* Luar azulado, sem sombra (só o sol projeta) */}
      <directionalLight
        ref={moonLightRef}
        position={MOON_DIRECTION.clone().multiplyScalar(70).toArray()}
        intensity={0}
        color="#8fa3c8"
      />
      <hemisphereLight ref={hemiRef} args={['#ffb38a', '#4a3322', 0.55]} />
      <ambientLight ref={ambientRef} intensity={0.12} />

      {/* Envmap procedural local (sem fetch): dá reflexo ao metal das armas,
          que sem environment renderiza quase preto. */}
      <Environment resolution={64} frames={1}>
        <color attach="background" args={['#241b14']} />
        {/* céu quente acima */}
        <Lightformer form="rect" intensity={0.9} color="#ffb38a" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        {/* sol poente rasante */}
        <Lightformer form="circle" intensity={3} color="#ffd9a0" position={[-6, 1.5, -9]} scale={[3.5, 3.5, 1]} />
        {/* rebatida fria do lado oposto, pra aresta de metal ler */}
        <Lightformer form="rect" intensity={0.5} color="#7a8aa0" position={[7, 2, 6]} rotation-y={-Math.PI / 3} scale={[8, 4, 1]} />
      </Environment>

      {/* Clique raso na areia (sem arrasto de órbita) volta pra visão geral
          e levanta um jato de poeira no ponto tocado */}
      <mesh
        geometry={dunes}
        rotation-x={-Math.PI / 2}
        receiveShadow
        onClick={(e) => {
          if (e.delta < 4) {
            useShrineStore.getState().clearSelection()
            emitSandBurst(e.point)
          }
        }}
      >
        <meshStandardMaterial color="#c2884e" roughness={1} metalness={0} />
      </mesh>
    </>
  )
}
