import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { Hud } from './components/ui/Hud'
import { LoreOverlay } from './components/ui/LoreOverlay'
import { ClanOverlay } from './components/ui/ClanOverlay'
import { LocationOverlay } from './components/ui/LocationOverlay'
import { Journal } from './components/ui/Journal'
import { fetchSiblingIndex } from './lib/api'
import { startTheme, stopTheme } from './lib/themeMusic'
import { isSoundEnabled } from './lib/audioContext'
import { useExperienceSettings } from './store/useExperienceSettings'
import { useShrineStore } from './store/useShrineStore'

const SceneStage = lazy(() => import('./components/scene/SceneStage'))

function App() {
  const reducedMotion = useExperienceSettings((s) => s.reducedMotion)
  const inspecting = useShrineStore((s) => s.currentView === 'inspecting')
  const [journalOpen, setJournalOpen] = useState(false)
  const [readingExpanded, setReadingExpanded] = useState(false)
  const openJournal = useCallback(() => setJournalOpen(true), [])
  useEffect(() => {
    fetchSiblingIndex().then((siblings) => useShrineStore.getState().setSiblingIndex(siblings)).catch((err) => console.warn('Índice indisponível:', err))
  }, [])
  useEffect(() => {
    const unsub = useShrineStore.subscribe((state, prev) => {
      if (state.selectedSibling === prev.selectedSibling) return
      if (state.selectedSibling && isSoundEnabled()) startTheme(state.selectedSibling)
      else stopTheme()
    })
    return () => { unsub(); stopTheme() }
  }, [])
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) useShrineStore.getState().clearSelection()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])
  return <main className="experience-shell" data-inspecting={inspecting} data-reduced={reducedMotion} data-reading-expanded={readingExpanded}>
    <div className="scene-viewport" aria-label="Santuário 3D interativo">
      <Suspense fallback={<div className="scene-status scene-loading"><span className="clan-seal">烈</span><h2>Além das dunas, uma história.</h2><p>Preparando sua expedição…</p></div>}><SceneStage onJournal={openJournal} /></Suspense>
    </div>
    <div className="scene-shade" />
    <Hud onJournal={openJournal} />
    {inspecting && <button className="reader-toggle" aria-pressed={readingExpanded} onClick={() => setReadingExpanded(!readingExpanded)}>{readingExpanded ? 'Ver cena 3D ↗' : 'Ampliar leitura ↗'}</button>}
    <LoreOverlay onJournal={openJournal} />
    <ClanOverlay onJournal={openJournal} />
    <LocationOverlay onJournal={openJournal} />
    <Journal open={journalOpen} onClose={() => setJournalOpen(false)} />
  </main>
}
export default App
