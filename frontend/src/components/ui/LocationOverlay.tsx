import { useEffect, useRef } from 'react'
import { WORLD_LOCATIONS } from '../../data/world'
import { useShrineStore } from '../../store/useShrineStore'

export function LocationOverlay({ onJournal }: { onJournal: () => void }) {
  const active = useShrineStore((s) => s.activeLandmark)
  const animating = useShrineStore((s) => s.isAnimating)
  const place = WORLD_LOCATIONS.find((item) => item.id === active)
  const title = useRef<HTMLHeadingElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const open = Boolean(place) && !animating
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    title.current?.focus({ preventScroll: true })
    body.current?.scrollTo(0, 0)
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [open, active])
  return <aside className={`location-panel lore-panel ${open ? 'panel-open' : 'panel-hidden'}`} inert={!open} aria-hidden={!open} aria-label={place?.name ?? 'Lugar do deserto'}>
    <button className="panel-close" aria-label="Fechar lugar" onClick={() => useShrineStore.getState().clearSelection()}>×</button>
    {place && <div className="location-content" ref={body}>
      <p className="eyebrow">UM VESTÍGIO DO MUNDO ANTIGO</p><h2 ref={title} tabIndex={-1}>{place.name}</h2><p className="location-subtitle">{place.subtitle}</p>
      <span className="location-illustration" aria-hidden="true">{place.id === 'gate' ? '門' : place.id === 'archive' ? '書' : '水'}</span>
      {place.description.map((paragraph, i) => <p className="location-paragraph" key={i}>{paragraph}</p>)}
      <blockquote><small>O QUE ESTE LUGAR SUSSURRA</small>{place.clue}</blockquote>
      <button className="text-action" onClick={onJournal}>Abrir as crônicas ↗</button>
      <p className="location-hint">Arraste para observar este lugar de outro ângulo.</p>
    </div>}
  </aside>
}
