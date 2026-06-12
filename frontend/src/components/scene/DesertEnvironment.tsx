import { useMemo } from 'react'
import * as THREE from 'three'
import { Sky } from '@react-three/drei'

/** Posição do sol baixo no horizonte — compartilhada entre Sky, luz e o disco solar. */
export const SUN_DIRECTION = new THREE.Vector3(-0.55, 0.08, -0.82).normalize()

function useDuneGeometry() {
  return useMemo(() => {
    const geo = new THREE.PlaneGeometry(320, 320, 140, 140)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // Camadas de senoides defasadas imitam dunas varridas pelo vento
      const h =
        Math.sin(x * 0.05 + y * 0.02) * Math.cos(y * 0.04) * 2.6 +
        Math.sin(x * 0.13 - y * 0.09) * 0.9 +
        Math.cos(x * 0.31 + y * 0.27) * 0.25
      // Achata o centro pra abrigar o santuário
      const flatten = THREE.MathUtils.smoothstep(Math.hypot(x, y), 13, 30)
      pos.setZ(i, h * flatten)
    }
    geo.computeVertexNormals()
    return geo
  }, [])
}

export function DesertEnvironment() {
  const dunes = useDuneGeometry()
  const sunPos = SUN_DIRECTION.clone().multiplyScalar(180)

  return (
    <>
      <Sky
        distance={4000}
        sunPosition={sunPos.toArray()}
        turbidity={9}
        rayleigh={5}
        mieCoefficient={0.02}
        mieDirectionalG={0.97}
      />

      {/* Disco solar visível no horizonte — alvo do Bloom no Passo 5 */}
      <mesh position={SUN_DIRECTION.clone().multiplyScalar(220).setY(14).toArray()}>
        <sphereGeometry args={[12, 24, 24]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
      </mesh>

      {/* Sol poente: luz quente, rasante, com sombras longas */}
      <directionalLight
        position={SUN_DIRECTION.clone().multiplyScalar(70).setY(12).toArray()}
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
      <hemisphereLight args={['#ffb38a', '#4a3322', 0.55]} />
      <ambientLight intensity={0.12} />

      <mesh geometry={dunes} rotation-x={-Math.PI / 2} receiveShadow>
        <meshStandardMaterial color="#c2884e" roughness={1} metalness={0} />
      </mesh>
    </>
  )
}
