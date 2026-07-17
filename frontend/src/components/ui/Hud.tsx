import { useState } from 'react'
import { useShrineStore } from '../../store/useShrineStore'
import { setWindEnabled } from '../../lib/windAudio'
import { setSoundEnabled } from '../../lib/audioContext'
import { ARTIFACT_SEEDS, CHOSEN_SEED } from '../../lib/artifacts'

/** Moldura 2D da visão geral: título e dica de navegação. Some na inspeção. */
export function Hud() {
  const inspecting = useShrineStore((s) => s.currentView === 'inspecting')
  const fade = inspecting ? 'pointer-events-none opacity-0' : 'opacity-100'
  // começa mudo: autoplay exige gesto do usuário; o AudioContext nasce no 1º clique
  const [soundOn, setSoundOn] = useState(false)
  const discoveredCount = useShrineStore((s) =>
    ARTIFACT_SEEDS.reduce((n, seed) => n + (s.discovered.has(seed.id) ? 1 : 0), 0),
  )
  const stormPhase = useShrineStore((s) => s.stormPhase)
  const chosenFound = useShrineStore((s) => s.discovered.has(CHOSEN_SEED.id))

  // mute global: vento (master gain próprio) + one-shots das armas (flag)
  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
    setWindEnabled(next)
  }

  return (
    <>
      <header
        className={`pointer-events-none fixed top-0 left-0 z-10 p-8 transition-all duration-700 ${fade}`}
      >
        <p className="text-[11px] tracking-[0.5em] text-amber-200/70 uppercase">
          As Crônicas do Clã Retsu
        </p>
        <h1 className="font-display mt-2 max-w-md text-4xl leading-tight text-amber-50 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          O Santuário do Deserto
        </h1>
        <div className="mt-3 h-1 w-24 -skew-x-12 bg-amber-500/80" />
        <p className="mt-3 text-sm text-amber-100/60 italic">
          Nove lâminas do juramento. Uma décima que o deserto pariu.
        </p>
      </header>

      {/* Toggle de som (vento + armas) — sempre visível, mesmo na inspeção */}
      <button
        onClick={toggleSound}
        className="fixed top-0 right-0 z-10 m-8 cursor-pointer border border-white/20 px-4 py-2 text-xs tracking-[0.25em] text-amber-100/70 uppercase transition hover:bg-white/10"
      >
        {soundOn ? 'som: ligado' : 'som: mudo'}
      </button>

      <footer
        className={`pointer-events-none fixed bottom-0 left-1/2 z-10 -translate-x-1/2 p-6 transition-all duration-700 ${fade}`}
      >
        <p className="text-xs tracking-[0.3em] text-amber-100/50 uppercase">
          arraste para orbitar · clique num artefato para inspecionar · clique na fortaleza para o lore do clã
        </p>
      </footer>

      {/* Contador do juramento — as nove lâminas inspecionadas acordam o deserto */}
      <div
        className={`pointer-events-none fixed bottom-0 left-0 z-10 p-6 transition-all duration-700 ${fade}`}
      >
        <p className="text-xs tracking-[0.3em] text-amber-100/50 uppercase">
          lâminas despertas · {discoveredCount}/9
        </p>
      </div>

      {/* Avisos da tempestade — sempre visíveis, mesmo na inspeção */}
      {stormPhase === 'raging' && (
        <div className="pointer-events-none fixed top-0 left-1/2 z-10 -translate-x-1/2 p-8 text-center">
          <p className="animate-pulse text-sm tracking-[0.4em] text-amber-200/90 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            o deserto responde ao juramento
          </p>
        </div>
      )}
      {stormPhase === 'done' && !chosenFound && (
        <div className="pointer-events-none fixed top-0 left-1/2 z-10 -translate-x-1/2 p-8 text-center">
          <p className="text-sm tracking-[0.4em] text-stone-200/90 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            algo despertou — siga a luz na duna
          </p>
        </div>
      )}

      {/* Dica da inspeção — só aparece com um artefato selecionado */}
      <footer
        className={`pointer-events-none fixed bottom-0 left-1/2 z-10 -translate-x-1/2 p-6 transition-all duration-700 ${inspecting ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <p className="text-xs tracking-[0.3em] text-amber-100/50 uppercase">
          arraste para girar a arma · esc ou clique na areia para voltar
        </p>
      </footer>
    </>
  )
}
