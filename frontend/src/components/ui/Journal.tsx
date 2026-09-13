import { useEffect, useRef, useState } from 'react'
import { WORLD_CHAPTERS, WORLD_LOCATIONS, GLOSSARY } from '../../data/world'
import { useShrineStore } from '../../store/useShrineStore'

export function Journal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<'chronicles' | 'expedition' | 'glossary'>('chronicles')
  const [chapter, setChapter] = useState(0)
  const discovered = useShrineStore((s) => s.discovered)
  const visited = useShrineStore((s) => s.visitedLandmarks)
  const read = useShrineStore((s) => s.readChapters)
  const siblings = useShrineStore((s) => s.siblingIndex)
  const current = WORLD_CHAPTERS[chapter]

  useEffect(() => {
    if (open) dialog.current?.showModal()
    else dialog.current?.close()
  }, [open])
  useEffect(() => {
    if (open && tab === 'chronicles') useShrineStore.getState().markChapterRead(current.id)
  }, [open, tab, current.id])

  return <dialog ref={dialog} className="journal" aria-labelledby="journal-title" onCancel={onClose} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
    <div className="journal-layout">
      <aside className="journal-sidebar">
        <span className="clan-seal">烈</span>
        <p className="eyebrow">A BIBLIOTECA DO FIM</p>
        <h2 id="journal-title">O que a areia<br /><em>não apagou.</em></h2>
        <p className="journal-intro">Há histórias que só existem porque alguém decidiu carregá-las.</p>
        <nav aria-label="Seções do diário" className="journal-tabs">
          <button aria-pressed={tab === 'chronicles'} onClick={() => setTab('chronicles')}><span>01</span> As crônicas <span>↗</span></button>
          <button aria-pressed={tab === 'expedition'} onClick={() => setTab('expedition')}><span>02</span> Sua expedição <span>↗</span></button>
          <button aria-pressed={tab === 'glossary'} onClick={() => setTab('glossary')}><span>03</span> Léxico do mundo <span>↗</span></button>
        </nav>
        <div className="journal-progress"><strong>{String(discovered.size + visited.size).padStart(2, '0')}</strong><span>vestígios encontrados<br />de 13 que o deserto guarda</span></div>
        <small className="save-note">Seu progresso fica salvo neste navegador.</small>
      </aside>
      <div className="journal-main">
        <button className="journal-close" aria-label="Fechar diário" onClick={onClose}>Fechar <span>×</span></button>
        {tab === 'chronicles' && <>
          <nav className="chapter-nav" aria-label="Capítulos das crônicas">{WORLD_CHAPTERS.map((item, index) => <button key={item.id} aria-current={index === chapter ? 'step' : undefined} onClick={() => setChapter(index)}><span>{String(index + 1).padStart(2, '0')}</span>{read.has(item.id) && <small aria-label="Capítulo lido">◆</small>}</button>)}</nav>
          <article key={current.id} className="chapter-article">
            <p className="eyebrow">{current.eyebrow}</p><h3>{current.title}</h3><p className="chapter-summary">{current.summary}</p>
            <div className="chapter-rule"><span>烈</span></div>
            {current.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
            <blockquote>“{current.quote}”</blockquote>
            <div className="chapter-pagination"><button disabled={chapter === 0} onClick={() => setChapter((n) => n - 1)}>← Capítulo anterior</button><button disabled={chapter === WORLD_CHAPTERS.length - 1} onClick={() => setChapter((n) => n + 1)}>Próximo capítulo →</button></div>
          </article>
        </>}
        {tab === 'expedition' && <article className="chapter-article">
          <p className="eyebrow">UM MAPA FEITO DE MEMÓRIAS</p><h3>Seus passos deixam marcas.</h3><p className="chapter-summary">Cada lâmina revela um herdeiro. Cada lugar guarda um fragmento. Reúna as nove relíquias do juramento para despertar o último segredo.</p>
          <h4>As lâminas do juramento</h4>
          <div className="journal-artifacts">{Object.values(siblings).map((sibling) => <button key={sibling.id} onClick={() => { onClose(); useShrineStore.getState().select(sibling.id) }}><span style={{ color: sibling.color }}>{discovered.has(sibling.id) ? '◆' : '◇'}</span><div>{sibling.name}<small>{sibling.weapon.name}</small></div><span>↗</span></button>)}</div>
          <h4>Lugares que se lembram</h4>
          <div className="journal-locations">{WORLD_LOCATIONS.map((place) => <button key={place.id} onClick={() => { onClose(); useShrineStore.getState().visitLandmark(place.id) }}><span>{visited.has(place.id) ? '◆' : '◇'}</span><div>{place.name}<small>{place.subtitle}</small></div><span>↗</span></button>)}</div>
          {discovered.has('chosen') && <blockquote>Você encontrou a Sem-Nome. O deserto já não é o mesmo — e talvez você também não.</blockquote>}
        </article>}
        {tab === 'glossary' && <article className="chapter-article"><p className="eyebrow">PALAVRAS QUE SOBREVIVERAM</p><h3>O léxico das cinzas.</h3><p className="chapter-summary">Nomes, crenças e cicatrizes de um mundo que aprendeu a viver depois do fim.</p><dl className="glossary">{GLOSSARY.map((entry) => <div key={entry.term}><dt>{entry.term}</dt><dd>{entry.meaning}</dd></div>)}</dl></article>}
      </div>
    </div>
  </dialog>
}
