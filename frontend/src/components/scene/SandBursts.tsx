import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { drainSandBursts } from '../../lib/sandBurst'
import { getPuffTexture } from '../../lib/particleTextures'

// Clicar na areia levanta um jato de poeira no ponto do clique — o deserto
// responde ao toque. Pool fixo de bursts (round-robin) num único
// instancedMesh: POOL x PART instâncias, custo constante, zero alocação por
// clique além do drain.

const POOL = 6
const PART = 16
const LIFE = 1.1
const GRAVITY = 4.2

const SAND_DARK = new THREE.Color('#b5814a')
const SAND_LIGHT = new THREE.Color('#f0d3a6')

interface BurstSlot {
  age: number
  origin: THREE.Vector3
}

interface GrainSeed {
  /** direção horizontal do arremesso */
  dx: number
  dz: number
  /** alcance horizontal e impulso vertical */
  reach: number
  up: number
  scale: number
  phase: number
}

export function SandBursts() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const slots = useMemo<BurstSlot[]>(
    () => Array.from({ length: POOL }, () => ({ age: Infinity, origin: new THREE.Vector3() })),
    [],
  )
  const nextSlotRef = useRef(0)

  const seeds = useMemo<GrainSeed[]>(
    () =>
      Array.from({ length: POOL * PART }, () => {
        const a = THREE.MathUtils.randFloat(0, Math.PI * 2)
        return {
          dx: Math.cos(a),
          dz: Math.sin(a),
          reach: THREE.MathUtils.randFloat(0.4, 1.8),
          up: THREE.MathUtils.randFloat(2.2, 4.6),
          scale: THREE.MathUtils.randFloat(0.25, 0.7),
          phase: THREE.MathUtils.randFloat(0, Math.PI * 2),
        }
      }),
    [],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const c = new THREE.Color()
    for (let i = 0; i < POOL * PART; i++) {
      mesh.setColorAt(i, c.lerpColors(SAND_DARK, SAND_LIGHT, Math.random()))
    }
    mesh.instanceColor!.needsUpdate = true
  }, [])

  useFrame(({ camera }, delta) => {
    const mesh = meshRef.current
    if (!mesh) return

    for (const spawn of drainSandBursts()) {
      const slot = slots[nextSlotRef.current]
      nextSlotRef.current = (nextSlotRef.current + 1) % POOL
      slot.age = 0
      slot.origin.set(spawn.x, spawn.y, spawn.z)
    }

    dummy.quaternion.copy(camera.quaternion)
    let anyAlive = false

    for (let b = 0; b < POOL; b++) {
      const slot = slots[b]
      slot.age += delta
      const alive = slot.age < LIFE
      if (alive) anyAlive = true
      const p = slot.age / LIFE

      for (let i = 0; i < PART; i++) {
        const s = seeds[b * PART + i]
        const idx = b * PART + i
        if (!alive) {
          dummy.scale.setScalar(0)
        } else {
          // sobe rápido, a gravidade puxa; espalha horizontal desacelerando
          const spread = 1 - Math.pow(1 - p, 2)
          const y = s.up * slot.age - GRAVITY * slot.age * slot.age
          dummy.position.set(
            slot.origin.x + s.dx * s.reach * spread,
            slot.origin.y + Math.max(0.05, y),
            slot.origin.z + s.dz * s.reach * spread,
          )
          // incha no início, esvai no fim (não há alpha por instância —
          // o fade é feito no tamanho)
          const grow = Math.min(1, p * 4)
          const fade = 1 - Math.pow(p, 3)
          dummy.scale.setScalar(s.scale * grow * fade)
        }
        dummy.updateMatrix()
        mesh.setMatrixAt(idx, dummy.matrix)
      }
    }

    mesh.visible = anyAlive
    if (anyAlive) mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, POOL * PART]}
      frustumCulled={false}
      visible={false}
      raycast={() => null}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={getPuffTexture()}
        color="#ffffff"
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
