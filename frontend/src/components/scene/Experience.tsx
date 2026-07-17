import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { CameraRig } from './CameraRig'
import { DesertEnvironment } from './DesertEnvironment'
import { DustParticles } from './DustParticles'
import { Landmarks } from './Landmarks'
import { SandStorm } from './SandStorm'
import { Shrine } from './Shrine'
import { FOG_FAR, FOG_NEAR } from '../../lib/storm'

export function Experience() {
  return (
    <>
      <fog attach="fog" args={['#c97f52', FOG_NEAR, FOG_FAR]} />

      <CameraRig />
      <DesertEnvironment />
      <Landmarks />
      <DustParticles />
      {/* montada depois do DesertEnvironment: o useFrame dela roda depois e
          fecha o fog por cima da cor do ciclo dia/noite */}
      <SandStorm />
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
