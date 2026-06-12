import { OrbitControls } from '@react-three/drei'
import { DesertEnvironment } from './DesertEnvironment'
import { DustParticles } from './DustParticles'
import { Shrine } from './Shrine'

export function Experience() {
  return (
    <>
      <fog attach="fog" args={['#c97f52', 40, 160]} />

      <DesertEnvironment />
      <DustParticles />
      <Shrine />

      <OrbitControls
        makeDefault
        enableDamping
        target={[0, 2.5, 0]}
        minDistance={6}
        maxDistance={55}
        maxPolarAngle={Math.PI / 2 - 0.06}
        enablePan={false}
      />
    </>
  )
}
