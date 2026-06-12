import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Experience } from './components/scene/Experience'
import { Hud } from './components/ui/Hud'
import { LoreOverlay } from './components/ui/LoreOverlay'
import { fetchSiblingIndex } from './lib/api'
import { useShrineStore } from './store/useShrineStore'

function App() {
  // Índice resumido dos 9 irmãos (nameplates de hover)
  useEffect(() => {
    fetchSiblingIndex()
      .then((siblings) => useShrineStore.getState().setSiblingIndex(siblings))
      .catch((err) => console.warn('Índice de lore indisponível:', err))
  }, [])

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        camera={{ position: [0, 11, 28], fov: 45, near: 0.1, far: 600 }}
        dpr={[1, 2]}
        onPointerMissed={() => useShrineStore.getState().clearSelection()}
      >
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>

      <Hud />
      <LoreOverlay />
    </div>
  )
}

export default App
