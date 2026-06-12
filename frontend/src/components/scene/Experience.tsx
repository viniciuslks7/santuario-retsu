import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { CameraRig } from './CameraRig'
import { DesertEnvironment } from './DesertEnvironment'
import { DustParticles } from './DustParticles'
import { Shrine } from './Shrine'

export function Experience() {
  return (
    <>
      <fog attach="fog" args={['#c97f52', 40, 160]} />

      <CameraRig />
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

      {/* Cinematografia: brilho nas armas/sol, grão de filme e vinheta */}
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.85} luminanceThreshold={1} luminanceSmoothing={0.25} />
        <Noise opacity={0.04} />
        <Vignette eskil={false} offset={0.22} darkness={0.78} />
      </EffectComposer>
    </>
  )
}
