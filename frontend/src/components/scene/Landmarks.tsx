import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { duneHeight } from '../../lib/dunes'

const FORT_STONE = '#2a221b'
const FORT_TRIM = '#3a2e22'
// Cor HDR (componentes > 1) das janelas: brilham além do fog e disparam o Bloom.
const WINDOW_GLOW = new THREE.Color(4.2, 2.4, 0.9)

/** Telhado de pagode: águas empilhadas (frustos de 4 lados) + pináculo dourado. */
function PagodaRoof({ baseW, tiers = 3, tierH }: { baseW: number; tiers?: number; tierH: number }) {
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
function WindowWall({ w, h, z, cols, rows }: { w: number; h: number; z: number; cols: number; rows: number }) {
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
        <PagodaRoof baseW={w * 1.15} tiers={tiers} tierH={w * 0.42} />
      </group>
    </group>
  )
}

/** A Biblioteca do Fim: fortaleza-pagode ciclópica levitando sobre uma ilha
 *  rochosa invertida e runas de gravidade que giram. Recortada no horizonte. */
function LibraryOfTheEnd() {
  const ref = useRef<THREE.Group>(null)
  const runesRef = useRef<THREE.Group>(null)
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    // flutua baixo, de modo que o corpo das torres assente no horizonte
    if (ref.current) ref.current.position.y = -7 + Math.sin(t * 0.15) * 0.7
    if (runesRef.current) runesRef.current.rotation.y += delta * 0.08
  })

  return (
    <group position={[40, 0, -100]} rotation-y={-0.5} scale={1.15}>
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
          <CastleTower h={22} w={11} tiers={4} />
        </group>
        {/* ── torres flanqueando, alturas variadas ── */}
        <group position={[-13, 3, 3]}>
          <CastleTower h={16} w={6.5} tiers={3} />
        </group>
        <group position={[13, 3, -2]}>
          <CastleTower h={19} w={7.5} tiers={3} />
        </group>
        <group position={[9, 3, 9]}>
          <CastleTower h={15} w={5} tiers={3} lit={false} />
        </group>
        <group position={[-10, 3, -8]}>
          <CastleTower h={17} w={5.5} tiers={3} />
        </group>

        {/* ── ponte suspensa ligando duas torres ── */}
        <mesh position={[-6.5, 16, 1.5]} rotation-z={0.05} castShadow>
          <boxGeometry args={[13, 0.8, 2.4]} />
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

export function Landmarks() {
  const ruins = useRuins()
  return (
    <group>
      <LibraryOfTheEnd />
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
