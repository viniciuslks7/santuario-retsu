import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, useCursor } from '@react-three/drei'
import { duneHeight } from '../../lib/dunes'
import { useShrineStore } from '../../store/useShrineStore'

const FORT_STONE = '#2a221b'
const FORT_TRIM = '#3a2e22'
// Cor HDR (componentes > 1) das janelas: brilham além do fog e disparam o Bloom.
const WINDOW_GLOW = new THREE.Color(4.2, 2.4, 0.9)

/** Telhado de pagode: águas empilhadas (frustos de 4 lados) + pináculo dourado. */
export function PagodaRoof({ baseW, tiers = 3, tierH }: { baseW: number; tiers?: number; tierH: number }) {
  return (
    <group>
      {Array.from({ length: tiers }, (_, i) => {
        const w = baseW * (1 - i * 0.2)
        return (
          <group key={i} position-y={i * tierH}>
            {/* beiral saliente */}
            <mesh castShadow position-y={-tierH * 0.08}>
              <boxGeometry args={[w * 1.25, 0.18 * tierH, w * 1.25]} />
              <meshStandardMaterial color={FORT_TRIM} roughness={0.85} />
            </mesh>
            {/* água do telhado (pirâmide de 4 faces) */}
            <mesh castShadow position-y={tierH * 0.42} rotation-y={Math.PI / 4}>
              <cylinderGeometry args={[w * 0.18, w * 0.66, tierH * 0.8, 4]} />
              <meshStandardMaterial color={FORT_STONE} roughness={0.8} />
            </mesh>
          </group>
        )
      })}
      <mesh position-y={tiers * tierH} castShadow>
        <coneGeometry args={[baseW * 0.06, tierH * 1.4, 6]} />
        <meshStandardMaterial color="#caa23a" emissive="#d4a017" emissiveIntensity={0.6} metalness={1} roughness={0.3} />
      </mesh>
    </group>
  )
}

/** Janelas acesas numa face (grade), levemente salientes. */
export function WindowWall({ w, h, z, cols, rows }: { w: number; h: number; z: number; cols: number; rows: number }) {
  const out = []
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = (c / (cols - 1) - 0.5) * w * 0.74
      const y = (r / (rows - 1)) * h * 0.78 + h * 0.1
      if ((c + r) % 3 === 0) continue // algumas apagadas
      out.push(
        <mesh key={`${c}-${r}`} position={[x, y, z]}>
          <boxGeometry args={[w * 0.07, h * 0.06, 0.3]} />
          {/* HDR (>1) + toneMapped false → estoura no Bloom e atravessa a névoa */}
          <meshBasicMaterial color={WINDOW_GLOW} toneMapped={false} fog={false} />
        </mesh>,
      )
    }
  }
  return <>{out}</>
}

/** Torre: corpo de pedra + janelas nas quatro faces + telhado de pagode. */
function CastleTower({ h, w, tiers, lit = true }: { h: number; w: number; tiers: number; lit?: boolean }) {
  return (
    <group>
      <mesh castShadow receiveShadow position-y={h / 2}>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color="#241c15" roughness={0.8} emissive="#d4a017" emissiveIntensity={lit ? 0.16 : 0.05} />
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
    const t = clock.elapsedTime
    // flutua baixo, de modo que o corpo das torres assente no horizonte
    if (ref.current) ref.current.position.y = -4 + Math.sin(t * 0.15) * 0.7
    if (runesRef.current) runesRef.current.rotation.y += delta * 0.08
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
      <group ref={ref}>
        {/* ── ilha rochosa invertida, compacta, sob a fortaleza ── */}
        <mesh position-y={-7} castShadow>
          <cylinderGeometry args={[15, 9, 7, 8]} />
          <meshStandardMaterial color="#241d16" roughness={0.95} flatShading />
        </mesh>
        <mesh position-y={-13} rotation-y={0.4}>
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
      <group ref={runesRef} position-y={-2}>
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
