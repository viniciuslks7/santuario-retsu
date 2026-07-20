import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Experience } from './components/scene/Experience'
import { Hud } from './components/ui/Hud'
import { LoreOverlay } from './components/ui/LoreOverlay'
import { ClanOverlay } from './components/ui/ClanOverlay'
import { fetchSiblingIndex } from './lib/api'
import { startTheme, stopTheme } from './lib/themeMusic'
import { useShrineStore } from './store/useShrineStore'

function App() {
  // Índice resumido dos 9 irmãos (nameplates de hover)
  useEffect(() => {
    fetchSiblingIndex()
      .then((siblings) => useShrineStore.getState().setSiblingIndex(siblings))
      .catch((err) => console.warn('Índice de lore indisponível:', err))
  }, [])

  // Tema musical do irmão inspecionado: entra ao selecionar, some ao sair
  useEffect(() => {
    const unsub = useShrineStore.subscribe((state, prev) => {
      if (state.selectedSibling === prev.selectedSibling) return
      if (state.selectedSibling) startTheme(state.selectedSibling)
      else stopTheme()
    })
    return () => {
      unsub()
      stopTheme()
    }
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
      <ClanOverlay />
    </div>
  )
}

export default App
