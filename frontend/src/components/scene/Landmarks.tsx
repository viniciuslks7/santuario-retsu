import { useStoneTexture } from '../../lib/useStoneTexture'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, useCursor } from '@react-three/drei'
import { duneHeight } from '../../lib/dunes'
import { useShrineStore } from '../../store/useShrineStore'
import { useExperienceSettings } from '../../store/useExperienceSettings'
import { BRONZE, DARK_STONE, WOOD, DesertDetails, OasisWater, StoneInstances, StoneLantern } from './WorldDetails'

const FORT_TRIM = '#3a2e22'
// Cor HDR (componentes > 1) das janelas: brilham além do fog e disparam o Bloom.
const WINDOW_GLOW = new THREE.Color(2.1, 1.2, 0.45)

/** Four genuinely curved roof slopes, with swept eaves and a ridge silhouette. */
function RoofTier({ width, height }: { width: number; height: number }) {
  const geometry = useMemo(() => {
    const vertices: number[] = [], uv: number[] = [], indices: number[] = []
    const divisions = 12
    for (let face = 0; face < 4; face++) {
      const angle = face * Math.PI / 2
      for (let row = 0; row <= divisions; row++) {
        const t = row / divisions
        const half = width * (.1 + .57 * t)
        const y = height * (1 - Math.pow(t, .55)) + Math.pow(t, 10) * height * .18
        for (let col = 0; col <= divisions; col++) {
          const u = col / divisions * 2 - 1
          const x = u * half, z = half
          vertices.push(x * Math.cos(angle) + z * Math.sin(angle), y + Math.pow(Math.abs(u), 7) * t * height * .14, z * Math.cos(angle) - x * Math.sin(angle))
          uv.push(col / divisions * 4, t * 3)
          if (row < divisions && col < divisions) {
            const a = face * (divisions + 1) ** 2 + row * (divisions + 1) + col
            indices.push(a, a + divisions + 1, a + 1, a + 1, a + divisions + 1, a + divisions + 2)
          }
        }
      }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return geo
  }, [width, height])
  useEffect(() => () => geometry.dispose(), [geometry])
  const tiles = useStoneTexture()
  const trim = useMemo(() => Array.from({ length: 4 }, (_, i) => {
    const a = i * Math.PI / 2
    return { position: [Math.sin(a) * width * .61, height * .16, Math.cos(a) * width * .61] as [number, number, number], scale: [width * 1.23, height * .07, width * .025] as [number, number, number], rotation: [0, a, 0] as [number, number, number] }
  }), [width, height])
  return <group><mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color="#354442" roughness={.67} metalness={.24} bumpMap={tiles} bumpScale={.045} side={THREE.DoubleSide} /></mesh><StoneInstances pieces={trim} color={BRONZE} /></group>
}

export function PagodaRoof({ baseW, tiers = 3, tierH }: { baseW: number; tiers?: number; tierH: number }) {
  return <group>
    {Array.from({ length: tiers }, (_, i) => <group key={i} position-y={i * tierH * .9}><RoofTier width={baseW * (1 - i * .19)} height={tierH} /></group>)}
    <mesh position-y={tiers * tierH + tierH * .18} castShadow><coneGeometry args={[baseW * .035, tierH * 1.1, 8]} /><meshStandardMaterial color={BRONZE} metalness={.8} roughness={.35} /></mesh>
    {[0, 1, 2].map((i) => <mesh key={i} position-y={tiers * tierH + i * tierH * .19}><torusGeometry args={[baseW * (.045 - i * .009), baseW * .009, 6, 12]} /><meshStandardMaterial color={BRONZE} metalness={.8} roughness={.35} /></mesh>)}
  </group>
}

/** A whole wall of glowing openings is one batch rather than one mesh per window. */
export function WindowWall({ w, h, z, cols, rows }: { w: number; h: number; z: number; cols: number; rows: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const transforms = useMemo(() => {
    const result: THREE.Matrix4[] = []
    const object = new THREE.Object3D()
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      if ((c + r) % 3 === 0) continue
      object.position.set((c / Math.max(1, cols - 1) - .5) * w * .68, r / Math.max(1, rows - 1) * h * .78 + h * .1, z)
      object.scale.set(w * .055, h * .055, .08)
      object.updateMatrix()
      result.push(object.matrix.clone())
    }
    return result
  }, [w, h, z, cols, rows])
  useEffect(() => {
    if (!ref.current) return
    transforms.forEach((matrix, i) => ref.current!.setMatrixAt(i, matrix))
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [transforms])
  return <instancedMesh ref={ref} args={[undefined, undefined, transforms.length]}><boxGeometry /><meshBasicMaterial color={WINDOW_GLOW} toneMapped={false} /></instancedMesh>
}

/** Torre: corpo de pedra + janelas nas quatro faces + telhado de pagode. */
function CastleTower({ h, w, tiers, lit = true }: { h: number; w: number; tiers: number; lit?: boolean }) {
  const stone = useStoneTexture()
  const framing = useMemo(() => {
    const pieces = []
    for (const x of [-1, 1]) for (const z of [-1, 1]) pieces.push({ position: [x * w * .48, h * .5, z * w * .48] as [number, number, number], scale: [w * .055, h, w * .055] as [number, number, number] })
    for (let floor = 1; floor <= 4; floor++) {
      for (const z of [-1, 1]) pieces.push({ position: [0, floor * h / 4 - .12, z * w * .51] as [number, number, number], scale: [w * 1.1, h * .025, w * .05] as [number, number, number] })
      for (const x of [-1, 1]) pieces.push({ position: [x * w * .51, floor * h / 4 - .12, 0] as [number, number, number], scale: [w * .05, h * .025, w * 1.1] as [number, number, number] })
    }
    return pieces
  }, [w, h])
  return (
    <group>
      <StoneInstances pieces={framing} color="#968263" />
      <mesh castShadow receiveShadow position-y={h / 2}>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color="#41473d" bumpMap={stone} bumpScale={.14} roughness={.9} emissive="#caa675" emissiveIntensity={lit ? .035 : .01} />
      </mesh>
      {/* faixa de pedra a meia altura */}
      <mesh position-y={h * 0.55}>
        <boxGeometry args={[w * 1.06, h * 0.06, w * 1.06]} />
        <meshStandardMaterial color={FORT_TRIM} roughness={0.85} />
      </mesh>
      {/* janelas nas quatro faces — leem de qualquer ângulo de órbita */}
      <group position={[0, 0, w / 2 + 0.05]}>
        <WindowWall w={w} h={h} z={0} cols={3} rows={5} />
      </group>
      <group rotation-y={Math.PI / 2} position={[w / 2 + 0.05, 0, 0]}>
        <WindowWall w={w} h={h} z={0} cols={3} rows={5} />
      </group>
      <group rotation-y={Math.PI} position={[0, 0, -w / 2 - 0.05]}>
        <WindowWall w={w} h={h} z={0} cols={3} rows={5} />
      </group>
      <group rotation-y={-Math.PI / 2} position={[-w / 2 - 0.05, 0, 0]}>
        <WindowWall w={w} h={h} z={0} cols={3} rows={5} />
      </group>
      <group position-y={h}>
        <PagodaRoof baseW={w * 1.15} tiers={tiers} tierH={w * 0.3} />
      </group>
    </group>
  )
}

/** A Biblioteca do Fim: fortaleza-pagode ciclópica levitando sobre uma ilha
 *  rochosa invertida e runas de gravidade que giram. Recortada no horizonte. */
function LibraryOfTheEnd() {
  const ref = useRef<THREE.Group>(null)
  const runesRef = useRef<THREE.Group>(null)
  const openClan = useShrineStore((s) => s.openClan)
  const hovered = useShrineStore((s) => s.hoveredSibling === '__library__')
  useCursor(hovered)
  useFrame(({ clock }, delta) => {
    const t = useExperienceSettings.getState().reducedMotion ? 0 : clock.elapsedTime
    // flutua baixo, de modo que o corpo das torres assente no horizonte
    if (ref.current) ref.current.position.y = 15 + Math.sin(t * 0.15) * 0.7
    if (runesRef.current && !useExperienceSettings.getState().reducedMotion) runesRef.current.rotation.y += delta * 0.08
  })

  return (
    <group
      position={[46, 0, -118]}
      rotation-y={-0.5}
      onClick={(e) => {
        e.stopPropagation()
        openClan()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        useShrineStore.getState().setHovered('__library__')
      }}
      onPointerOut={() => useShrineStore.getState().setHovered(null)}
    >
      {hovered && (
        <Html center position-y={26} className="pointer-events-none select-none">
          <div className="border border-amber-500/60 bg-stone-950/80 px-3 py-1.5 text-center whitespace-nowrap backdrop-blur-sm">
            <p className="text-[10px] tracking-[0.35em] text-amber-200/70 uppercase">A fortaleza do clã</p>
            <p className="font-display text-sm text-stone-100">A Biblioteca do Fim</p>
          </div>
        </Html>
      )}
      <group ref={ref} position-y={15}>
        {/* ── ilha rochosa invertida, compacta, sob a fortaleza ── */}
        <mesh position-y={-7} castShadow>
          <cylinderGeometry args={[15, 9, 7, 8]} />
          <meshStandardMaterial color="#241d16" roughness={0.95} flatShading />
        </mesh>
        <mesh position-y={-13} rotation={[Math.PI, .4, 0]}>
          <coneGeometry args={[9, 12, 6]} />
          <meshStandardMaterial color="#1d1711" roughness={1} flatShading />
        </mesh>
        {/* três fragmentos curtos pendurados na ponta */}
        {[0, 2.4, 4.2].map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 5, -17, Math.sin(a) * 5]} rotation-x={Math.PI}>
            <coneGeometry args={[1.4, 5 + i, 5]} />
            <meshStandardMaterial color="#1d1711" roughness={1} flatShading />
          </mesh>
        ))}

        {/* ── muralha-base e pátio ── */}
        <mesh position-y={1} castShadow receiveShadow>
          <boxGeometry args={[30, 4, 24]} />
          <meshStandardMaterial color="#2a221b" roughness={0.88} />
        </mesh>
        {/* ameias na borda da muralha */}
        {Array.from({ length: 12 }, (_, i) => {
          const x = (i / 11 - 0.5) * 28
          return (
            <mesh key={i} position={[x, 3.6, 12]} castShadow>
              <boxGeometry args={[1.4, 1.4, 1.4]} />
              <meshStandardMaterial color={FORT_TRIM} roughness={0.85} />
            </mesh>
          )
        })}

        {/* ── torre-mestra central, com muitas águas ── */}
        <group position={[0, 3, 0]}>
          <CastleTower h={13} w={9} tiers={3} />
        </group>
        {/* ── torres flanqueando, alturas variadas ── */}
        <group position={[-13, 3, 3]}>
          <CastleTower h={9} w={6} tiers={2} />
        </group>
        <group position={[13, 3, -2]}>
          <CastleTower h={11} w={6.5} tiers={2} />
        </group>
        <group position={[9, 3, 9]}>
          <CastleTower h={8} w={4.5} tiers={2} lit={false} />
        </group>
        <group position={[-10, 3, -8]}>
          <CastleTower h={10} w={5} tiers={2} />
        </group>

        {/* ── ponte suspensa ligando duas torres ── */}
        <mesh position={[-6.5, 9.5, 1.5]} rotation-z={0.05} castShadow>
          <boxGeometry args={[13, 0.7, 2.2]} />
          <meshStandardMaterial color={FORT_TRIM} roughness={0.85} />
        </mesh>

        {/* ── poucos fragmentos orbitando, presos pela gravidade rúnica ── */}
        {Array.from({ length: 3 }, (_, i) => {
          const a = (i / 3) * Math.PI * 2
          const r = 19 + i * 2
          return (
            <mesh key={i} position={[Math.cos(a) * r, 8 + i * 4, Math.sin(a) * r]} rotation={[a, a * 2, 0]}>
              <dodecahedronGeometry args={[1.1]} />
              <meshStandardMaterial color="#2a221b" roughness={0.95} emissive="#d4a017" emissiveIntensity={0.12} flatShading />
            </mesh>
          )
        })}
      </group>

      {/* ── runas de gravidade girando sob a fortaleza ── */}
      <group ref={runesRef} position-y={8}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} position-y={-i * 3}>
            <ringGeometry args={[17 - i * 3, 19 - i * 3, 64, 1, 0, Math.PI * 1.6]} />
            <meshBasicMaterial color="#d4a017" transparent opacity={0.55 - i * 0.13} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

interface Ruin {
  pos: [number, number, number]
  rot: number
  kind: 'torii' | 'pillar' | 'stub'
  scale: number
}

/** Distribui ruínas determinísticas num anel ao redor do santuário, sempre
 *  fora do círculo de pedestais e assentadas na altura da duna. */
function useRuins(): Ruin[] {
  return useMemo(() => {
    const out: Ruin[] = []
    const kinds: Ruin['kind'][] = ['torii', 'pillar', 'stub', 'pillar', 'stub', 'torii', 'stub', 'pillar', 'stub']
    let seed = 1337
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < kinds.length; i++) {
      const angle = (i / kinds.length) * Math.PI * 2 + rnd() * 0.6
      const radius = 22 + rnd() * 22
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      out.push({
        pos: [x, duneHeight(x, z), z],
        rot: rnd() * Math.PI,
        kind: kinds[i],
        scale: 0.8 + rnd() * 0.9,
      })
    }
    return out
  }, [])
}

function Torii({ scale }: { scale: number }) {
  const m = <meshStandardMaterial color="#3a2a22" roughness={0.95} />
  return (
    <group scale={scale}>
      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 2, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.4, 4, 7]} />
          {m}
        </mesh>
      ))}
      <mesh position={[0, 4.1, 0]} rotation-z={0.04} castShadow>
        <boxGeometry args={[4.6, 0.5, 0.6]} />
        {m}
      </mesh>
      <mesh position={[0, 3.4, 0]} castShadow>
        <boxGeometry args={[3.6, 0.3, 0.4]} />
        {m}
      </mesh>
    </group>
  )
}

function BrokenPillar({ scale }: { scale: number }) {
  const m = <meshStandardMaterial color="#8a7355" roughness={0.95} />
  return (
    <group scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.6, 2]} />
        {m}
      </mesh>
      <mesh position={[0.1, 2.1, 0]} rotation-z={0.06} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 3.2, 9]} />
        {m}
      </mesh>
      {/* topo lascado, caído ao lado */}
      <mesh position={[1.4, 0.4, 0.6]} rotation={[0.4, 0.8, 1.3]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.3, 9]} />
        {m}
      </mesh>
    </group>
  )
}

function Stub({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.5, 0]} rotation-z={0.18} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.7, 1.6, 8]} />
        <meshStandardMaterial color="#6e5c45" roughness={1} />
      </mesh>
    </group>
  )
}

/** Costelas de um colosso morto, meio enterradas na duna — arcos decrescentes. */
function Ribcage({ scale = 1 }: { scale?: number }) {
  const bone = <meshStandardMaterial color="#b3a58c" roughness={0.9} flatShading />
  return (
    <group scale={scale}>
      {Array.from({ length: 6 }, (_, i) => {
        const s = 1 - i * 0.11
        return (
          <mesh key={i} position={[0, -0.6, i * 2.1]} rotation={[0, 0, 0.12 * (i % 2 === 0 ? 1 : -1)]} castShadow>
            <torusGeometry args={[4.4 * s, 0.32 * s, 7, 20, Math.PI * 0.92]} />
            {bone}
          </mesh>
        )
      })}
      {/* espinha ligando os arcos */}
      <mesh position={[0, 3.4, 5.2]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.35, 0.42, 12.5, 8]} />
        {bone}
      </mesh>
      {/* crânio tombado à frente */}
      <mesh position={[1.2, -0.2, -3.4]} rotation={[0.4, 0.9, 0.2]} castShadow>
        <dodecahedronGeometry args={[1.5]} />
        {bone}
      </mesh>
    </group>
  )
}

/** Árvore petrificada: tronco torto + galhos nus, tudo flatShading. */
function PetrifiedTree({ scale = 1, bend = 0.2 }: { scale?: number; bend?: number }) {
  const barkMat = <meshStandardMaterial color="#3d332b" roughness={1} flatShading />
  return (
    <group scale={scale}>
      <mesh position={[0, 1.6, 0]} rotation-z={bend} castShadow>
        <cylinderGeometry args={[0.16, 0.34, 3.4, 6]} />
        {barkMat}
      </mesh>
      <mesh position={[0.5, 3.0, 0.1]} rotation-z={bend + 0.7} castShadow>
        <cylinderGeometry args={[0.05, 0.12, 1.7, 5]} />
        {barkMat}
      </mesh>
      <mesh position={[-0.35, 3.2, -0.1]} rotation={[0.2, 0, bend - 0.85]} castShadow>
        <cylinderGeometry args={[0.04, 0.1, 1.4, 5]} />
        {barkMat}
      </mesh>
      <mesh position={[0.15, 3.9, 0.25]} rotation={[0.5, 0, bend + 0.25]} castShadow>
        <cylinderGeometry args={[0.03, 0.07, 1.1, 5]} />
        {barkMat}
      </mesh>
    </group>
  )
}

/** Atalaia arruinada no horizonte oposto à Biblioteca — contrapeso da composição. */
function RuinedWatchtower() {
  return (
    <group position={[-72, 0, -108]} rotation-y={0.35}>
      <mesh position-y={7} castShadow>
        <cylinderGeometry args={[3.2, 4.4, 16, 9]} />
        <meshStandardMaterial color="#2f261d" roughness={0.9} flatShading />
      </mesh>
      {/* topo rasgado: dentes irregulares */}
      {[0, 1.4, 2.8, 4.4].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 2.6, 15.5 + (i % 2), Math.sin(a) * 2.6]} rotation-y={a} castShadow>
          <boxGeometry args={[1.6, 2.4 + (i % 2) * 1.2, 1.1]} />
          <meshStandardMaterial color="#2a221a" roughness={0.9} flatShading />
        </mesh>
      ))}
      {/* única janela ainda acesa — alguém vigia */}
      <mesh position={[1.2, 11, 2.9]}>
        <boxGeometry args={[0.7, 0.9, 0.3]} />
        <meshBasicMaterial color={WINDOW_GLOW} toneMapped={false} fog={false} />
      </mesh>
      {/* escombros na base */}
      {[[3.8, 0.6, 1.2], [-3.2, 0.4, 2.6], [1.6, 0.5, -4.0]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[x, z, x * z]} castShadow>
          <dodecahedronGeometry args={[1.1 + (i % 2) * 0.5]} />
          <meshStandardMaterial color="#2f261d" roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

export function Landmarks() {
  const ruins = useRuins()
  return (
    <group>
      <LibraryOfTheEnd />
      <DesertDetails />
      <VisitablePlaces />
      <RuinedWatchtower />
      {/* colosso caído a sudoeste, fora do anel de ruínas */}
      <group position={[-40, duneHeight(-40, -26), -26]} rotation-y={1.15}>
        <Ribcage scale={1.15} />
      </group>
      {/* floresta petrificada do Leste — o passeio do Haruki */}
      {(
        [
          [52, -38, 1.4, 0.24], [57, -30, 1.0, -0.18], [48, -25, 0.8, 0.4],
          [63, -40, 1.25, 0.1], [55, -48, 0.9, -0.32], [44, -33, 0.7, 0.18],
        ] as const
      ).map(([x, z, s, bend], i) => (
        <group key={i} position={[x, duneHeight(x, z) - 0.15, z]} rotation-y={i * 1.3}>
          <PetrifiedTree scale={s} bend={bend} />
        </group>
      ))}
      {ruins.map((r, i) => (
        <group key={i} position={r.pos} rotation-y={r.rot}>
          {r.kind === 'torii' && <Torii scale={r.scale} />}
          {r.kind === 'pillar' && <BrokenPillar scale={r.scale} />}
          {r.kind === 'stub' && <Stub scale={r.scale} />}
        </group>
      ))}
    </group>
  )
}

function MonumentGate() {
  const beam = useMemo(() => {
    const outline = new THREE.Shape()
    outline.moveTo(-5.7, .3)
    outline.quadraticCurveTo(0, -.55, 5.7, .3)
    outline.lineTo(5.9, .86)
    outline.quadraticCurveTo(0, .05, -5.9, .86)
    outline.closePath()
    return new THREE.ExtrudeGeometry(outline, { depth: .7, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .04, bevelThickness: .04 })
  }, [])
  useEffect(() => () => beam.dispose(), [beam])
  const rope = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(-3.6, 6.3, .45), new THREE.Vector3(0, 5.65, .55), new THREE.Vector3(3.6, 6.3, .45)]), [])
  return <group>
    {[-1, 1].map((sign) => <group key={sign} position-x={sign * 3.7} rotation-z={sign * .035}>
      <mesh position-y={.38} castShadow receiveShadow><cylinderGeometry args={[.74, .9, .76, 8]} /><meshStandardMaterial color={DARK_STONE} roughness={.9} /></mesh>
      <mesh position-y={4.15} castShadow><cylinderGeometry args={[.37, .49, 7.8, 12]} /><meshStandardMaterial color="#853e2d" roughness={.76} /></mesh>
      {[.8, 1.04, 6.5, 7.8].map((y) => <mesh key={y} position-y={y}><cylinderGeometry args={[.51, .51, .13, 12]} /><meshStandardMaterial color={y < 2 ? '#343b36' : BRONZE} metalness={.45} roughness={.5} /></mesh>)}
      <StoneLantern position={[sign * 1.75, 0, 1]} scale={1.1} />
    </group>)}
    <mesh geometry={beam} position={[0, 8.1, -.35]} castShadow><meshStandardMaterial color="#273934" roughness={.68} metalness={.15} /></mesh>
    <mesh position-y={7.8} castShadow><boxGeometry args={[9.7, .32, .55]} /><meshStandardMaterial color={WOOD} roughness={.8} /></mesh>
    <mesh position-y={6.55} castShadow><boxGeometry args={[9.15, .4, .43]} /><meshStandardMaterial color={WOOD} roughness={.8} /></mesh>
    <mesh position={[0, 7.2, .06]} castShadow><boxGeometry args={[.72, 1.65, .38]} /><meshStandardMaterial color={DARK_STONE} roughness={.8} /></mesh>
    {[0, 1, 2].map((i) => <mesh key={i} position={[0, 7.65 - i * .39, .27]} rotation-z={Math.PI / 4}><boxGeometry args={[.17, .17, .025]} /><meshStandardMaterial color={BRONZE} metalness={.75} roughness={.35} /></mesh>)}
    <mesh castShadow><tubeGeometry args={[rope, 28, .065, 6, false]} /><meshStandardMaterial color="#b8a27d" roughness={1} /></mesh>
    {[-2.7, -.9, .9, 2.7].map((x, i) => <group key={x} position={[x, 5.85 + Math.abs(x) * .11, .6]} rotation-z={i % 2 ? -.12 : .12}>
      <mesh position-y={-.17} rotation-z={.4}><planeGeometry args={[.18, .4]} /><meshStandardMaterial color="#d6cbae" side={THREE.DoubleSide} roughness={.9} /></mesh>
      <mesh position={[.1, -.45, .01]} rotation-z={-.3}><planeGeometry args={[.17, .38]} /><meshStandardMaterial color="#d6cbae" side={THREE.DoubleSide} roughness={.9} /></mesh>
    </group>)}
  </group>
}

function ArchivePavilion() {
  const texture = useStoneTexture()
  const shelves = useMemo(() => {
    const pieces = []
    for (let shelf = 0; shelf < 3; shelf++) for (let column = 0; column < 12; column++) {
      if ((column + shelf * 3) % 7 === 0) continue
      pieces.push({ position: [-2.8 + column * .47, 1.3 + shelf * 1.04, -1.9] as [number, number, number], scale: [.29, .5 + (column % 3) * .1, .42] as [number, number, number], rotation: [0, 0, column % 5 === 0 ? .14 : 0] as [number, number, number], color: ['#a28d65', '#7c493c', '#576956', '#cab68b'][column % 4] })
    }
    return pieces
  }, [])
  const beams = useMemo(() => {
    const pieces = []
    for (const x of [-3.6, 0, 3.6]) for (const z of [-2.5, 2.5]) pieces.push({ position: [x, 2.7, z] as [number, number, number], scale: [.26, 5.1, .26] as [number, number, number] })
    for (const y of [1, 2, 3, 4]) pieces.push({ position: [0, y, -1.95] as [number, number, number], scale: [6.7, .12, .9] as [number, number, number] })
    for (const x of [-3.35, 0, 3.35]) pieces.push({ position: [x, 2.5, -1.95] as [number, number, number], scale: [.14, 3.5, .85] as [number, number, number] })
    for (const z of [-2.5, 2.5]) pieces.push({ position: [0, 4.8, z] as [number, number, number], scale: [7.9, .3, .32] as [number, number, number] })
    return pieces
  }, [])
  return <group rotation-y={.28}>
    <mesh position-y={.15} castShadow receiveShadow><boxGeometry args={[8.4, .6, 6.4]} /><meshStandardMaterial color="#666959" bumpMap={texture} bumpScale={.1} roughness={.95} /></mesh>
    {[0, 1, 2].map((i) => <mesh key={i} position={[0, .08 - i * .15, 3.4 + i * .45]} receiveShadow><boxGeometry args={[4.8 + i * .3, .2, .7]} /><meshStandardMaterial color="#85816b" roughness={.95} /></mesh>)}
    <StoneInstances pieces={beams} color="#4a3d2e" />
    <StoneInstances pieces={shelves} />
    <mesh position={[0, 2.6, -2.49]}><boxGeometry args={[7.1, 4.4, .14]} /><meshStandardMaterial color="#333e37" bumpMap={texture} bumpScale={.04} roughness={.95} /></mesh>
    <group position-y={5.05}><PagodaRoof baseW={7.7} tiers={1} tierH={2.15} /></group>
    <mesh position={[0, 1.15, .9]} castShadow><boxGeometry args={[3.6, .21, 1.6]} /><meshStandardMaterial color="#5a4532" roughness={.8} /></mesh>
    {[-1.4, 1.4].map((x) => <mesh key={x} position={[x, .78, .9]}><boxGeometry args={[.2, .75, 1.2]} /><meshStandardMaterial color="#493e2f" roughness={.85} /></mesh>)}
    <mesh position={[0, 1.265, .9]} rotation-x={-Math.PI / 2}><planeGeometry args={[2.25, 1]} /><meshStandardMaterial color="#d8c99d" roughness={1} side={THREE.DoubleSide} /></mesh>
    {[-1, 1].map((x) => <mesh key={x} position={[x * 1.16, 1.32, .9]} rotation-x={Math.PI / 2}><cylinderGeometry args={[.09, .09, 1.12, 10]} /><meshStandardMaterial color="#796547" roughness={.8} /></mesh>)}
    {[-1, 1].map((x) => <StoneLantern key={x} position={[x * 4.7, 0, 2.1]} />)}
    <mesh position={[0, 4, .2]}><sphereGeometry args={[.33, 12, 10]} /><meshStandardMaterial color="#ffd391" emissive="#ffaf44" emissiveIntensity={1.1} /></mesh>
  </group>
}

function OasisGarden() {
  const bank = useMemo(() => Array.from({ length: 38 }, (_, i) => {
    const a = i / 38 * Math.PI * 2
    return { position: [Math.cos(a) * 5.3, .18 + Math.sin(i * 2) * .11, Math.sin(a) * 3.7] as [number, number, number], scale: [.63 + (i % 3) * .1, .44, .64] as [number, number, number], rotation: [.1, a, i * .4] as [number, number, number], color: ['#65705c', '#81866a', '#a49a77'][i % 3] }
  }), [])
  const leaves = useMemo(() => Array.from({ length: 24 }, (_, i) => {
    const a = i * 2.4, r = .7 + (i % 5) * .45
    return { position: [-3 + Math.cos(a) * r, 5.3 + Math.sin(i * 1.7) * .45 + (i % 3) * .35, -1.9 + Math.sin(a) * r * .65] as [number, number, number], scale: [1.18, .45, .95] as [number, number, number], rotation: [0, a, .12] as [number, number, number], color: ['#67794d', '#85945b', '#455c42', '#9b9b62'][i % 4] }
  }), [])
  const branches = useMemo(() => [
    [[-3, -.2, -2], [-3.4, 2, -2], [-2.8, 3.8, -2], [-3.1, 5.6, -2]],
    [[-3.15, 2.3, -2], [-4.2, 3.5, -2], [-4.9, 4.5, -2.5]],
    [[-2.9, 3.5, -2], [-1.6, 4.3, -1.8], [-.7, 4.9, -1.5]],
    [[-3, 3.3, -2], [-3.3, 4.6, -.9], [-4, 5.1, -.3]],
  ].map((points) => new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)))), [])
  return <group>
    <mesh position-y={-.22} scale={[1.45, 1, 1]}><cylinderGeometry args={[3.8, 4, .7, 48]} /><meshStandardMaterial color="#555f46" roughness={1} /></mesh>
    <group position-y={.17}><OasisWater /></group>
    <StoneInstances pieces={bank} kind="rock" />
    {branches.map((curve, i) => <mesh key={i} castShadow><tubeGeometry args={[curve, 16, i === 0 ? .23 : .105, 7, false]} /><meshStandardMaterial color="#585343" roughness={1} /></mesh>)}
    <StoneInstances pieces={leaves} kind="rock" />
    {Array.from({ length: 11 }, (_, i) => <mesh key={i} position={[1.8, .6 + Math.sin(i / 10 * Math.PI) * .55, -3 + i * .6]} receiveShadow castShadow><boxGeometry args={[1.5, .13, .51]} /><meshStandardMaterial color="#796c4e" roughness={.9} /></mesh>)}
    <StoneLantern position={[5.8, -.1, 1.2]} />
  </group>
}

function VisitablePlaces() {
  const hovered = useShrineStore((s) => s.hoveredSibling)
  const places = [
    { id: 'gate' as const, x: 0, z: 22, title: 'Portão do Último Juramento', eyebrow: 'O limiar', height: 9.5, object: <MonumentGate /> },
    { id: 'archive' as const, x: -29, z: -19, title: 'Arquivo dos Nomes Perdidos', eyebrow: 'Memória do clã', height: 8, object: <ArchivePavilion /> },
    { id: 'oasis' as const, x: 30, z: 9, title: 'Oásis da Última Primavera', eyebrow: 'Um lugar para lembrar', height: 7, object: <OasisGarden /> },
  ]
  useCursor(places.some((place) => hovered === `__${place.id}__`))
  return <group>{places.map((place) => <group key={place.id} position={[place.x, duneHeight(place.x, place.z), place.z]}
    onClick={(event) => { if (event.delta > 4) return; event.stopPropagation(); useShrineStore.getState().visitLandmark(place.id) }}
    onPointerOver={(event) => { event.stopPropagation(); useShrineStore.getState().setHovered(`__${place.id}__`) }}
    onPointerOut={() => useShrineStore.getState().setHovered(null)}>
    {place.object}
    {hovered === `__${place.id}__` && <Html center position-y={place.height} className="pointer-events-none select-none"><div className="border border-amber-300/30 bg-stone-950/85 px-4 py-2 text-center whitespace-nowrap backdrop-blur-sm"><p className="text-[9px] tracking-[.28em] text-amber-200/70 uppercase">{place.eyebrow}</p><p className="font-display text-sm text-stone-100">{place.title}</p></div></Html>}
  </group>)}</group>
}
