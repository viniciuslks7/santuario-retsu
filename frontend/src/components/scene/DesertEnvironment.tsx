import { useMemo } from 'react'
import * as THREE from 'three'
import { Environment, Lightformer, Sky } from '@react-three/drei'
import { duneHeight } from '../../lib/dunes'
import { useShrineStore } from '../../store/useShrineStore'

/** Posição do sol baixo no horizonte — compartilhada entre Sky, luz e o disco solar. */
const SUN_DIRECTION = new THREE.Vector3(-0.55, 0.08, -0.82).normalize()

const sunDiscColor = new THREE.Color(3.2, 2.2, 1.2)

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

      {/* Disco solar no horizonte — cor HDR acima de 1 pra estourar no Bloom */}
      <mesh position={SUN_DIRECTION.clone().multiplyScalar(220).setY(14).toArray()}>
        <sphereGeometry args={[12, 24, 24]} />
        <meshBasicMaterial color={sunDiscColor} toneMapped={false} />
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

      {/* Clique raso na areia (sem arrasto de órbita) volta pra visão geral */}
      <mesh
        geometry={dunes}
        rotation-x={-Math.PI / 2}
        receiveShadow
        onClick={(e) => {
          if (e.delta < 4) useShrineStore.getState().clearSelection()
        }}
      >
        <meshStandardMaterial color="#c2884e" roughness={1} metalness={0} />
      </mesh>
    </>
  )
}
