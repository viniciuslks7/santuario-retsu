import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useExperienceSettings } from '../../store/useExperienceSettings'
import { BRONZE, DARK_STONE } from './WorldDetails'

/** A light cloth mesh pinned along its top edge; no physics engine needed. */
export function WindBanner({ position, phase }: { position: [number, number, number]; phase: number }) {
  const reducedMotion = useExperienceSettings((s) => s.reducedMotion)
  const time = useRef(phase)
  const cloth = useMemo(() => new THREE.PlaneGeometry(1.15, 3.1, 6, 12).translate(0, -1.55, 0), [])
  useEffect(() => () => cloth.dispose(), [cloth])
  useFrame((_, delta) => {
    if (reducedMotion) return
    time.current += Math.min(delta, .05)
    const vertices = cloth.attributes.position
    for (let i = 0; i < vertices.count; i++) {
      const loose = -vertices.getY(i) / 3.1
      vertices.setZ(i, loose * (.22 + Math.sin(time.current * 2.4 - loose * 4 + vertices.getX(i) * 1.7) * .3))
    }
    vertices.needsUpdate = true
    cloth.computeVertexNormals()
  })
  return <group position={position} rotation-y={phase}>
    <mesh position-y={.15}><cylinderGeometry args={[.45, .6, .3, 6]} /><meshStandardMaterial color={DARK_STONE} /></mesh>
    <mesh position-y={3.15}><cylinderGeometry args={[.055, .09, 6.2, 6]} /><meshStandardMaterial color={BRONZE} metalness={.65} roughness={.5} /></mesh>
    <mesh position-y={5.8} rotation-z={Math.PI / 2}><cylinderGeometry args={[.045, .045, 1.5, 6]} /><meshStandardMaterial color={BRONZE} /></mesh>
    <mesh position-y={6.4}><octahedronGeometry args={[.19]} /><meshStandardMaterial color="#e7c891" metalness={.6} roughness={.4} /></mesh>
    <mesh geometry={cloth} position={[0, 5.78, .08]}><meshStandardMaterial color="#9a533b" side={THREE.DoubleSide} roughness={.9} /></mesh>
  </group>
}
