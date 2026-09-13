import { Component, Suspense, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { Experience } from './Experience'
import { useShrineStore } from '../../store/useShrineStore'
import { useExperienceSettings } from '../../store/useExperienceSettings'

function SceneFallback({ onJournal }: { onJournal?: () => void }) {
  return <div className="scene-status"><span className="clan-seal" aria-hidden="true">烈</span><h2>O deserto aguarda.</h2><p>Não foi possível iniciar a cena 3D. Recarregue a página ou tente um navegador com aceleração gráfica ativada.</p><button className="explore-button" onClick={() => window.location.reload()}>Tentar novamente ↗</button>{onJournal && <button className="text-action mt-4" onClick={onJournal}>Ler as crônicas sem 3D</button>}</div>
}

class SceneBoundary extends Component<{ children: ReactNode; onJournal: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { useShrineStore.getState().setAnimating(false) }
  render() { return this.state.failed ? <SceneFallback onJournal={this.props.onJournal} /> : this.props.children }
}

function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady])
  return null
}

function LoadingScene() {
  const progress = useProgress((s) => s.progress)
  return <div className="scene-status scene-loading" role="status"><span className="clan-seal" aria-hidden="true">烈</span><h2>O deserto está despertando.</h2><p>Preparando as lâminas e suas histórias…</p><div className="loading-track" aria-hidden="true"><span style={{ width: `${Math.max(progress, 5)}%` }} /></div></div>
}


export default function SceneStage({ onJournal }: { onJournal: () => void }) {
  const quality = useExperienceSettings((s) => s.quality)
  const [ready, setReady] = useState(false)
  const [contextLost, setContextLost] = useState(false)
  const [visible, setVisible] = useState(!document.hidden)
  const onReady = useCallback(() => setReady(true), [])
  const [supported] = useState(() => {
    try {
      const context = document.createElement('canvas').getContext('webgl2')
      context?.getExtension('WEBGL_lose_context')?.loseContext()
      return Boolean(context)
    } catch { return false }
  })
  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return <SceneBoundary onJournal={onJournal}>
    {!supported || contextLost ? <SceneFallback onJournal={onJournal} /> : <Canvas
      shadows={quality === 'cinematic'} frameloop={visible ? 'always' : 'never'}
      camera={{ position: [0, 11, 28], fov: 45, near: 0.1, far: 600 }}
      dpr={quality === 'cinematic' ? [1, 1.5] : 1}
      fallback={<p>O navegador precisa de WebGL 2 para exibir a cena.</p>}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault()
          useShrineStore.getState().setAnimating(false)
          setContextLost(true)
        }, { once: true })
      }}
      onPointerMissed={() => useShrineStore.getState().clearSelection()}>
      <Suspense fallback={null}><Experience /><SceneReady onReady={onReady} /></Suspense>
    </Canvas>}
    {!ready && supported && !contextLost && <LoadingScene />}
  </SceneBoundary>
}
