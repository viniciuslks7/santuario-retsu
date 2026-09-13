import { useStoneTexture } from '../../lib/useStoneTexture'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { duneHeight } from '../../lib/dunes'
import { useExperienceSettings } from '../../store/useExperienceSettings'

export const STONE = '#655e50'
export const DARK_STONE = '#373a35'
export const BRONZE = '#b59659'
export const WOOD = '#743c2c'

type Piece = { position: [number, number, number]; scale: [number, number, number]; rotation?: [number, number, number]; color?: string }

/** Static decoration batches keep hundreds of masonry pieces to one draw call. */
export function StoneInstances({ pieces, color = STONE, kind = 'box' }: { pieces: Piece[]; color?: string; kind?: 'box' | 'rock' }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!ref.current) return
    const object = new THREE.Object3D()
    const tint = new THREE.Color()
    pieces.forEach((piece, i) => {
      object.position.set(...piece.position)
      object.scale.set(...piece.scale)
      object.rotation.set(...(piece.rotation ?? [0, 0, 0]))
      object.updateMatrix()
      ref.current!.setMatrixAt(i, object.matrix)
      ref.current!.setColorAt(i, tint.set(piece.color ?? color))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [pieces, color])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pieces.length]} castShadow receiveShadow>
      {kind === 'rock' ? <dodecahedronGeometry args={[1, 0]} /> : <boxGeometry />}
      <meshStandardMaterial roughness={.93} flatShading={kind === 'rock'} />
    </instancedMesh>
  )
}

/** Stone tōrō: broad plinth, narrow stem, luminous chamber and flared cap. */
export function StoneLantern({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position-y={.14} castShadow receiveShadow><boxGeometry args={[.9, .28, .9]} /><meshStandardMaterial color={STONE} roughness={.93} /></mesh>
      <mesh position-y={.67} castShadow><cylinderGeometry args={[.18, .27, .85, 8]} /><meshStandardMaterial color={DARK_STONE} roughness={.9} /></mesh>
      <mesh position-y={1.16} castShadow><cylinderGeometry args={[.48, .29, .23, 4]} /><meshStandardMaterial color={STONE} roughness={.9} /></mesh>
      <mesh position-y={1.48}><boxGeometry args={[.48, .5, .48]} /><meshStandardMaterial color="#ffcb75" emissive="#ffae42" emissiveIntensity={1.8} /></mesh>
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => <mesh key={`${x}-${z}`} position={[x * .25, 1.5, z * .25]}><boxGeometry args={[.065, .65, .065]} /><meshStandardMaterial color={DARK_STONE} /></mesh>))}
      <mesh position-y={1.88} rotation-y={Math.PI / 4} castShadow><cylinderGeometry args={[.15, .62, .32, 4]} /><meshStandardMaterial color={DARK_STONE} roughness={.9} /></mesh>
      <mesh position-y={2.15}><sphereGeometry args={[.13, 8, 6]} /><meshStandardMaterial color={BRONZE} metalness={.65} roughness={.45} /></mesh>
    </group>
  )
}

export function ShrineCourt() {
  const texture = useStoneTexture()
  const masonry = useMemo(() => {
    const pieces: Piece[] = []
    // Segmented outer coping and an inner, weathered procession path.
    for (let row = 0; row < 3; row++) for (let i = 0; i < 64; i++) {
      const a = i / 64 * Math.PI * 2 + row * .025
      const r = 12.7 + row * .52
      pieces.push({ position: [Math.sin(a) * r, .34 - row * .16, Math.cos(a) * r], scale: [1.2, .22, .48], rotation: [0, a, 0], color: i % 7 === 0 ? '#9c8b70' : '#746e5e' })
    }
    for (let i = 0; i < 45; i++) {
      const a = i / 45 * Math.PI * 2
      pieces.push({ position: [Math.sin(a) * 6.2, .46, Math.cos(a) * 6.2], scale: [.67, .08, 1.35], rotation: [0, a + .03, 0], color: i % 3 === 0 ? '#918371' : '#777463' })
    }
    for (let arm = 0; arm < 9; arm++) {
      const a = arm / 9 * Math.PI * 2 + Math.PI / 2
      for (let step = 0; step < 6; step++) {
        const r = 3.6 + step * .66
        pieces.push({ position: [Math.cos(a) * r, .48, Math.sin(a) * r], scale: [.035, .018, .43], rotation: [0, -a + Math.PI / 2, 0], color: BRONZE })
      }
    }
    return pieces
  }, [])
  return (
    <group>
      <mesh position-y={.16} castShadow receiveShadow><cylinderGeometry args={[12.8, 13.5, .5, 72]} /><meshStandardMaterial color={DARK_STONE} bumpMap={texture} bumpScale={.12} roughness={.97} /></mesh>
      <mesh position-y={.414} rotation-x={-Math.PI / 2} receiveShadow><circleGeometry args={[12.66, 72]} /><meshStandardMaterial color="#777563" bumpMap={texture} bumpScale={.08} roughness={.92} /></mesh>
      <StoneInstances pieces={masonry} />
      {[3.15, 3.3, 7.3, 11.65].map((r, i) => <mesh key={r} rotation-x={-Math.PI / 2} position-y={.47}><ringGeometry args={[r, r + (i === 0 ? .12 : .028), 96]} /><meshStandardMaterial color={BRONZE} metalness={.65} roughness={.48} /></mesh>)}
      {/* The nine gaps preserve the sightlines and each weapon's original radius. */}
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i + .5) / 9 * Math.PI * 2 + Math.PI / 2
        return <StoneLantern key={i} position={[Math.cos(a) * 12, .46, Math.sin(a) * 12]} scale={.8} />
      })}
      <mesh position-y={.55} castShadow><cylinderGeometry args={[2.75, 3.1, .22, 12]} /><meshStandardMaterial color={DARK_STONE} bumpMap={texture} bumpScale={.08} roughness={.92} /></mesh>
    </group>
  )
}

export function DesertDetails() {
  const cinematic = useExperienceSettings((s) => s.quality === 'cinematic')
  const rocks = useMemo(() => {
    let state = 7627
    const random = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296)
    const pieces: Piece[] = []
    for (let i = 0; i < (cinematic ? 320 : 150); i++) {
      const a = random() * Math.PI * 2
      const r = 15 + Math.pow(random(), 1.4) * 95
      const x = Math.cos(a) * r, z = Math.sin(a) * r
      if (Math.hypot(x - 30, z - 9) < 8 || Math.hypot(x + 29, z + 19) < 7 || (Math.abs(x) < 4 && z > 12 && z < 34)) continue
      const size = .15 + random() * (r > 45 ? 2.5 : .9)
      pieces.push({ position: [x, duneHeight(x, z) + size * .17, z], scale: [size * 1.5, size * .55, size], rotation: [random(), random() * 6, random()], color: ['#776653', '#897a64', '#a19075', '#615b4e'][i % 4] })
    }
    return pieces
  }, [cinematic])
  const paths = useMemo(() => {
    const pieces: Piece[] = []
    const destinations = [[0, 30], [-29, -19], [30, 9]]
    for (const [endX, endZ] of destinations) {
      const length = Math.hypot(endX, endZ)
      const a = Math.atan2(endX, endZ)
      for (let d = 14; d < length; d += 1.05) {
        const x = Math.sin(a) * d, z = Math.cos(a) * d
        for (let lane = -1; lane <= 1; lane++) {
          const px = x + Math.cos(a) * lane * .85, pz = z - Math.sin(a) * lane * .85
          pieces.push({ position: [px, duneHeight(px, pz) + .025, pz], scale: [.78, .14, .9], rotation: [.025 * Math.sin(d), a + Math.sin(d * 3) * .055, 0], color: Math.floor(d) % 3 === 0 ? '#a09074' : '#7d7967' })
        }
      }
    }
    return pieces
  }, [])
  return <group><HorizonRidges /><StoneInstances pieces={rocks} kind="rock" /><StoneInstances pieces={paths} /></group>
}

/** A continuous distant basin gives the world depth from every orbit angle. */
function HorizonRidges() {
  const geometry = useMemo(() => {
    const vertices: number[] = [], colors: number[] = [], indices: number[] = []
    const segments = 160, rows = 10
    const low = new THREE.Color('#99866b'), high = new THREE.Color('#c2aa83'), color = new THREE.Color()
    for (let row = 0; row <= rows; row++) for (let i = 0; i <= segments; i++) {
      const a = i / segments * Math.PI * 2
      const t = row / rows, radius = 132 + t * 95
      const x = Math.cos(a) * radius, z = Math.sin(a) * radius
      const envelope = Math.sin(t * Math.PI) ** 1.7
      const ridge = 10 + Math.sin(a * 5 + 1) ** 2 * 16 + Math.sin(a * 13 + t * 5) * 4
      const h = duneHeight(x, z) + envelope * ridge
      vertices.push(x, h - .15, z)
      color.copy(low).lerp(high, .25 + t * .4 + Math.sin(a * 17 + t * 25) * .1)
      color.toArray(colors, colors.length)
      if (row < rows && i < segments) {
        const p = row * (segments + 1) + i
        indices.push(p, p + 1, p + segments + 1, p + 1, p + segments + 2, p + segments + 1)
      }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return geo
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors roughness={1} side={THREE.DoubleSide} /></mesh>
}

/** Locally generated ripples: no reflection render target or external textures. */
export function OasisWater() {
  const ref = useRef<THREE.ShaderMaterial>(null)
  const reducedMotion = useExperienceSettings((s) => s.reducedMotion)
  useFrame(({ clock }) => { if (ref.current && !reducedMotion) ref.current.uniforms.time.value = clock.elapsedTime })
  const uniforms = useMemo(() => ({ time: { value: 0 } }), [])
  return (
    <mesh rotation-x={-Math.PI / 2} scale={[1.45, 1, 1]}>
      <circleGeometry args={[3.5, 64]} />
      <shaderMaterial ref={ref} uniforms={uniforms} transparent vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`uniform float time; varying vec2 vUv; void main(){vec2 p=vUv-.5;float r=length(p);float wave=sin(r*125.-time*1.2+sin(p.x*28.)*.7)*.5+.5;float glint=pow(wave,14.)*.23;vec3 col=mix(vec3(.035,.19,.19),vec3(.19,.46,.40),smoothstep(.05,.49,r)); col+=vec3(.48,.62,.52)*glint; gl_FragColor=vec4(col,.94);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n}`} />
    </mesh>
  )
}
