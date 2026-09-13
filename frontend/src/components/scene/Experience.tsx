import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { CameraRig } from './CameraRig'
import { DesertEnvironment } from './DesertEnvironment'
import { DustParticles } from './DustParticles'
import { Landmarks } from './Landmarks'
import { RaptorBirds } from './RaptorBirds'
import { SandBursts } from './SandBursts'
import { SandStorm } from './SandStorm'
import { Shrine } from './Shrine'
import { FOG_FAR, FOG_NEAR } from '../../lib/storm'
import { useExperienceSettings } from '../../store/useExperienceSettings'
import { useShrineStore } from '../../store/useShrineStore'

export function Experience() {
  const cinematic = useExperienceSettings((s) => s.quality === 'cinematic')
  const reducedMotion = useExperienceSettings((s) => s.reducedMotion)
  const autoTour = useExperienceSettings((s) => s.autoTour)
  const overview = useShrineStore((s) => s.currentView === 'overview' && !s.isAnimating)

  return (
    <>
      <fog attach="fog" args={['#c97f52', FOG_NEAR, FOG_FAR]} />

      <CameraRig />
      <DesertEnvironment />
      <Landmarks />
      {!reducedMotion && <DustParticles key={cinematic ? 'cinematic' : 'balanced'} count={cinematic ? 260 : 90} />}
      {/* montada depois do DesertEnvironment: o useFrame dela roda depois e
          fecha o fog por cima da cor do ciclo dia/noite */}
      <SandStorm />
      <SandBursts />
      <Shrine />
      {!reducedMotion && <RaptorBirds />}

      <OrbitControls
        makeDefault
        autoRotate={autoTour && overview && !reducedMotion}
        autoRotateSpeed={0.45}
        onStart={() => useExperienceSettings.getState().setAutoTour(false)}
        enableDamping={!reducedMotion}
        dampingFactor={0.07}
        rotateSpeed={0.65}
        zoomSpeed={0.8}
        target={[0, 2.5, 0]}
        minDistance={6}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2 - 0.06}
        enablePan={false}
      />

      {/* O modo leve evita os passes de tela cheia em dispositivos móveis. */}
      {cinematic && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.38} luminanceThreshold={1.2} luminanceSmoothing={0.3} />
          <Noise opacity={reducedMotion ? 0 : 0.012} />
          <Vignette eskil={false} offset={0.28} darkness={0.46} />
        </EffectComposer>
      )}
    </>
  )
}
