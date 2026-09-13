import { useState } from 'react'
import { useShrineStore } from '../../store/useShrineStore'
import { useExperienceSettings } from '../../store/useExperienceSettings'
import { setWindEnabled } from '../../lib/windAudio'
import { startTheme, stopTheme } from '../../lib/themeMusic'
import { setSoundEnabled } from '../../lib/audioContext'
import { WORLD_LOCATIONS } from '../../data/world'
import { WeaponGlyph } from './WeaponGlyph'
import { ARTIFACT_SEEDS } from '../../lib/artifacts'

export function Hud({ onJournal }: { onJournal: () => void }) {
  const [dockMode, setDockMode] = useState<'blades' | 'places'>('blades')
  const hasEntered = useShrineStore((s) => s.hasEntered)
  const visited = useShrineStore((s) => s.visitedLandmarks)
  const landmark = useShrineStore((s) => s.activeLandmark)
  const inspecting = useShrineStore((s) => s.currentView === 'inspecting')
  const selected = useShrineStore((s) => s.selectedSibling)
  const discovered = useShrineStore((s) => s.discovered)
  const siblings = useShrineStore((s) => s.siblingIndex)
  const stormPhase = useShrineStore((s) => s.stormPhase)
  const settings = useExperienceSettings()
  const [soundOn, setSoundOn] = useState(false)
  const [popover, setPopover] = useState<'settings' | 'help' | null>(null)
  const discoveredCount = ARTIFACT_SEEDS.filter((s) => discovered.has(s.id)).length
  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
    setWindEnabled(next)
    if (next && selected) startTheme(selected)
    else stopTheme()
  }
  const explore = () => {
    useShrineStore.getState().enter()
    setDockMode('blades')
    const seed = ARTIFACT_SEEDS.find((s) => !discovered.has(s.id)) ?? ARTIFACT_SEEDS[0]
    useShrineStore.getState().select(seed.id)
  }
  return <>
    <header className="site-header">
      <button className="brand" onClick={() => useShrineStore.getState().clearSelection()} aria-label="Clã Retsu — voltar ao santuário">
        <span className="clan-seal" aria-hidden="true">烈</span>
        <span>RETSU<small>AS CRÔNICAS DO CLÃ</small></span>
      </button>
      <nav className="header-nav" aria-label="Navegação principal">
        <button className={!inspecting ? 'nav-link active' : 'nav-link'} onClick={() => useShrineStore.getState().clearSelection()}>O santuário</button>
        <button className="nav-link" onClick={() => { useShrineStore.getState().enter(); setDockMode('places') }}>Explorar o mundo</button>
        <button className="nav-link" onClick={onJournal}>As crônicas <span aria-hidden="true">↗</span></button>
      </nav>
      <div className="header-tools">
        <button className="tool-button motion-button" aria-pressed={!settings.reducedMotion} aria-label={settings.reducedMotion ? 'Ativar animações' : 'Pausar animações'} onClick={() => settings.setReducedMotion(!settings.reducedMotion)} title={settings.reducedMotion ? 'Ativar animações' : 'Pausar animações'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{settings.reducedMotion ? <path d="m7 4 14 8-14 8Z" /> : <path d="M6 4h4v16H6zm8 0h4v16h-4z" />}</svg><span>{settings.reducedMotion ? 'Animar mundo' : 'Mundo vivo'}</span>
        </button>
        <button className="tool-button journal-toggle" aria-label="Abrir diário e crônicas" onClick={onJournal}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3ZM12 6v15" /></svg></button>
        <button className="tool-button sound-button" onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn ? 'Desativar som' : 'Ativar som'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" />{soundOn ? <path d="M15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14" /> : <path d="m16 9 6 6m0-6-6 6" />}</svg>
          <span>{soundOn ? 'Som ligado' : 'Ativar som'}</span>
        </button>
        <button className="tool-button" aria-label="Configurações da experiência" aria-expanded={popover === 'settings'} aria-controls="experience-options" onClick={() => setPopover(popover === 'settings' ? null : 'settings')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="3" fill="#171b1c"/><circle cx="15" cy="17" r="3" fill="#171b1c"/></svg></button>
        <button className="tool-button help-button" aria-label="Como explorar" aria-expanded={popover === 'help'} aria-controls="experience-options" onClick={() => setPopover(popover === 'help' ? null : 'help')}>?</button>
      </div>
      {popover && <section className="options-panel" id="experience-options" aria-label={popover === 'settings' ? 'Configurações' : 'Como explorar'} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setPopover(null) } }}>
        <div className="options-heading"><h2>{popover === 'settings' ? 'Seu deserto, seu ritmo.' : 'Siga a curiosidade.'}</h2><button aria-label="Fechar opções" onClick={() => setPopover(null)}>×</button></div>
        {popover === 'settings' ? <>
          <label htmlFor="time-of-day">Atmosfera</label>
          <select id="time-of-day" value={settings.timeOfDay} onChange={(e) => settings.setTimeOfDay(e.target.value as typeof settings.timeOfDay)}><option value="sunset">Hora dourada</option><option value="night">Sob as estrelas</option><option value="day">Sol do deserto</option><option value="cycle">Ciclo dia e noite</option></select>
          <label htmlFor="quality">Qualidade visual</label>
          <select id="quality" value={settings.quality} onChange={(e) => settings.setQuality(e.target.value as typeof settings.quality)}><option value="cinematic">Cinematográfica</option><option value="balanced">Leve · menos efeitos</option></select>
          <label className="check-label"><input type="checkbox" checked={settings.reducedMotion} onChange={(e) => settings.setReducedMotion(e.target.checked)} />Reduzir movimento</label>
          <label className="check-label"><input type="checkbox" checked={settings.autoTour} onChange={(e) => settings.setAutoTour(e.target.checked)} />Passeio automático da câmera</label>
          <p>Arrastar assume o controle da câmera. Sua escolha de animações fica salva neste navegador.</p>
        </> : <><p>Arraste o cenário para olhar ao redor. Use a roda do mouse ou dois dedos para aproximar.</p><p>Escolha uma lâmina no cenário ou no catálogo abaixo. Durante a inspeção, arraste para girá-la.</p><p>Descubra as nove lâminas e observe o que o deserto revela.</p><p><kbd>Esc</kbd> Voltar ao santuário</p><button className="nav-link" onClick={() => { setPopover(null); useShrineStore.getState().openClan() }}>Conhecer a história do clã ↗</button></>}
      </section>}
    </header>
    {!inspecting && !hasEntered && <section className="intro" aria-labelledby="shrine-title">
      <p className="eyebrow"><span /> UM JURAMENTO ALÉM DO TEMPO</p>
      <h1 id="shrine-title">O Santuário<br />do <em>Deserto.</em></h1>
      <p className="intro-description">Nove lâminas. Nove destinos.<br />Um segredo que a areia ainda guarda.</p>
      <button className="explore-button" onClick={() => useShrineStore.getState().enter()}>Entrar no santuário<span aria-hidden="true">↗</span></button>
      <button className="intro-secondary" onClick={onJournal}>Antes, conheça a história <span>→</span></button>
      <div className="intro-caption"><span className="tiny-diamond" /> UM UNIVERSO PARA DESCOBRIR EM 3D</div>
    </section>}
    {!inspecting && hasEntered && <section className="expedition-card"><p className="eyebrow">SUA EXPEDIÇÃO</p><h2>{discoveredCount === 9 ? 'O juramento está completo.' : 'O deserto guarda seus nomes.'}</h2><p>{discoveredCount === 9 ? 'Há uma última história além do círculo.' : 'Aproxime-se de uma lâmina ou siga os caminhos além do santuário.'}</p><button onClick={explore}>{discoveredCount ? 'Encontrar a próxima lâmina' : 'Conhecer a primeira lâmina'} <span>↗</span></button></section>}
    {inspecting && <button className="back-button" onClick={() => useShrineStore.getState().clearSelection()}><span aria-hidden="true">←</span> Voltar ao santuário <kbd>Esc</kbd></button>}
    <div className="scene-caption" aria-hidden="true"><span>砂漠の聖域</span><small>O SILÊNCIO TAMBÉM CONTA HISTÓRIAS</small></div>
    <div className="storm-notice" role="status">
      {stormPhase === 'raging' && 'O deserto responde ao juramento…'}
      {stormPhase === 'done' && !discovered.has('chosen') && <button onClick={() => useShrineStore.getState().select('chosen')}>Algo despertou. Siga a luz na duna ↗</button>}
    </div>
    <footer className="discovery-dock">
      <div className="dock-heading"><div><div className="dock-tabs" aria-label="Escolher catálogo"><button aria-pressed={dockMode === 'blades'} onClick={() => setDockMode('blades')}>As nove lâminas</button><button aria-pressed={dockMode === 'places'} onClick={() => setDockMode('places')}>Lugares do mundo <small>03</small></button></div><span className="dock-instruction">{inspecting ? 'Escolha outra lâmina para continuar' : 'Selecione uma lâmina e conheça sua história'}</span></div><span className="discovery-count"><strong>{String(discoveredCount).padStart(2, '0')}</strong> / 09 <span>DESCOBERTAS</span></span></div>
      {dockMode === 'blades' ? <nav className="artifact-list" aria-label="Catálogo das nove lâminas">
        {ARTIFACT_SEEDS.map((seed) => <button key={seed.id} className={`artifact-card ${selected === seed.id ? 'selected' : ''} ${discovered.has(seed.id) ? 'discovered' : ''}`} style={{ '--artifact-color': seed.color } as React.CSSProperties} onClick={() => useShrineStore.getState().select(seed.id)} aria-pressed={selected === seed.id} aria-label={`${siblings[seed.id]?.name ?? seed.id}${discovered.has(seed.id) ? ', descoberta' : ', explorar'}`}>
          <span className="artifact-number">{String(seed.order).padStart(2, '0')}</span><span className="blade-mark"><WeaponGlyph id={seed.id} /></span><span className="artifact-name">{siblings[seed.id]?.name.split(' ')[0] ?? seed.id}<small>{siblings[seed.id]?.weapon.type ?? 'Lâmina do juramento'}</small></span><span className="artifact-status" aria-hidden="true">{discovered.has(seed.id) ? '◆' : '◇'}</span>
        </button>)}
      </nav> : <nav className="place-list" aria-label="Lugares do deserto">{WORLD_LOCATIONS.map((place, index) => <button key={place.id} className={`place-card ${landmark === place.id ? 'selected' : ''}`} onClick={() => useShrineStore.getState().visitLandmark(place.id)}><span className="place-symbol" aria-hidden="true">{place.id === 'gate' ? '門' : place.id === 'archive' ? '書' : '水'}</span><span><small>0{index + 1} / {visited.has(place.id) ? 'VISITADO' : 'POR DESCOBRIR'}</small><strong>{place.name}</strong><em>{place.subtitle}</em></span><span className="place-arrow">↗</span></button>)}</nav>}
      <div className="dock-bottom"><span>ARRASTE PARA EXPLORAR <span aria-hidden="true">·</span> CLIQUE PARA DESCOBRIR</span><span>SEU PROGRESSO É SALVO NESTE NAVEGADOR</span></div>
    </footer>
  </>
}
