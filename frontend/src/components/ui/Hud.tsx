import { useShrineStore } from '../../store/useShrineStore'

/** Moldura 2D da visão geral: título e dica de navegação. Some na inspeção. */
export function Hud() {
  const inspecting = useShrineStore((s) => s.currentView === 'inspecting')
  const fade = inspecting ? 'pointer-events-none opacity-0' : 'opacity-100'

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

      <footer
        className={`pointer-events-none fixed bottom-0 left-1/2 z-10 -translate-x-1/2 p-6 transition-all duration-700 ${fade}`}
      >
        <p className="text-xs tracking-[0.3em] text-amber-100/50 uppercase">
          arraste para orbitar · clique num artefato para inspecionar
        </p>
      </footer>
    </>
  )
}
