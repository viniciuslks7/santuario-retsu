import { useEffect, useRef, useState } from 'react'
import { fetchLore } from '../../lib/api'
import type { SiblingLore, SiblingStats } from '../../lib/api'
import { useShrineStore } from '../../store/useShrineStore'

const STAT_LABELS: Record<keyof SiblingStats, string> = {
  forca: 'Força',
  velocidade: 'Velocidade',
  tecnica: 'Técnica',
  espirito: 'Espírito',
  sanidade: 'Sanidade',
}

/** Gera um STL ASCII simbólico do artefato (mock de exportação para
 *  impressão 3D multicolor — a malha real viria do GLB em produção). */
function buildMockStl(lore: SiblingLore): string {
  const v = [
    ['0 0 0', '40 0 0', '20 0 34.6'],
    ['0 0 0', '20 0 34.6', '20 60 17.3'],
    ['40 0 0', '20 60 17.3', '20 0 34.6'],
    ['0 0 0', '20 60 17.3', '40 0 0'],
  ]
  const facets = v
    .map(
      ([a, b, c]) =>
        `facet normal 0 0 0\n  outer loop\n    vertex ${a}\n    vertex ${b}\n    vertex ${c}\n  endloop\nendfacet`,
    )
    .join('\n')
  return `solid ${lore.id}_${lore.weapon.name.replace(/\s+/g, '_')}\n${facets}\nendsolid ${lore.id}\n`
}

function ExportStlButton({ lore }: { lore: SiblingLore }) {
  const [phase, setPhase] = useState<'idle' | 'slicing' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setPhase('idle')
    setProgress(0)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [lore.id])

  const start = () => {
    setPhase('slicing')
    setProgress(0)
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 4 + Math.random() * 9
        if (next < 100) return next
        if (timerRef.current) clearInterval(timerRef.current)
        const blob = new Blob([buildMockStl(lore)], { type: 'model/stl' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `retsu-${lore.id}.stl`
        a.click()
        URL.revokeObjectURL(url)
        setPhase('done')
        return 100
      })
    }, 110)
  }

  if (phase === 'slicing') {
    return (
      <div className="flex-1">
        <div className="mb-1 flex justify-between text-[10px] tracking-[0.25em] text-stone-400 uppercase">
          <span>Fatiando malha…</span>
          <span>{Math.floor(progress)}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/10">
          <div
            className="h-full bg-(--accent) transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={start}
      className="flex-1 cursor-pointer border border-(--accent) bg-(--accent)/15 px-4 py-2.5 text-xs font-semibold tracking-[0.25em] text-stone-100 uppercase transition hover:bg-(--accent)/35"
    >
      {phase === 'done' ? 'STL exportado ✓' : 'Exportar STL'}
    </button>
  )
}

function StatBar({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-[10px] tracking-[0.25em] text-stone-400 uppercase">
        {label}
      </span>
      <div className="h-1.5 flex-1 bg-white/10">
        <div
          className="h-full transition-[width] duration-700"
          style={{ width: `${value * 10}%`, backgroundColor: accent }}
        />
      </div>
      <span className="w-6 text-right font-mono text-xs text-stone-300">{value}</span>
    </div>
  )
}

/** Painel de lore: desliza da direita quando a câmera chega no close.
 *  Conteúdo 100% vindo de GET /api/lore/:siblingId. */
export function LoreOverlay() {
  const selected = useShrineStore((s) => s.selectedSibling)
  const isAnimating = useShrineStore((s) => s.isAnimating)
  const clearSelection = useShrineStore((s) => s.clearSelection)
  const [lore, setLore] = useState<SiblingLore | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!selected) return
    let alive = true
    setLore(null)
    setFailed(false)
    fetchLore(selected)
      .then((data) => alive && setLore(data))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [selected])

  const open = Boolean(selected) && !isAnimating
  const accent = lore?.color ?? '#d4a017'

  return (
    <aside
      aria-hidden={!open}
      style={{ '--accent': accent } as React.CSSProperties}
      className={`fixed inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-white/10 bg-gradient-to-l from-stone-950/95 via-stone-950/85 to-stone-950/60 backdrop-blur-md transition-all duration-700 ${
        open ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-16 opacity-0'
      }`}
    >
      {!lore && !failed && (
        <p className="m-auto animate-pulse text-xs tracking-[0.4em] text-stone-400 uppercase">
          Consultando a Biblioteca do Fim…
        </p>
      )}

      {failed && (
        <div className="m-auto px-10 text-center">
          <p className="text-sm text-stone-300">
            A Biblioteca do Fim não respondeu. O backend está de pé?
          </p>
          <button
            onClick={clearSelection}
            className="mt-6 cursor-pointer border border-white/20 px-4 py-2 text-xs tracking-[0.25em] uppercase hover:bg-white/10"
          >
            Voltar ao santuário
          </button>
        </div>
      )}

      {lore && (
        <div className="relative flex-1 overflow-y-auto px-8 py-10 text-stone-200">
          {/* numeral de fundo, estilo marca d'água de capítulo */}
          <span className="font-display pointer-events-none absolute -top-6 right-2 text-[11rem] leading-none text-white/5 select-none">
            {lore.order}
          </span>

          {lore.hidden && (
            <p className="mb-3 inline-block -skew-x-12 border border-red-700/60 bg-red-950/40 px-3 py-1 text-[10px] tracking-[0.4em] text-red-300 uppercase">
              Arquivo proibido
            </p>
          )}

          <p className="text-[11px] tracking-[0.45em] uppercase" style={{ color: accent }}>
            {lore.epithet}
          </p>
          <h2 className="font-display mt-1 text-4xl text-stone-50">{lore.name}</h2>
          <p className="mt-1 text-sm text-stone-400">
            {lore.title} · {lore.goldenJewels ? 'Joias Douradas ancoradas' : 'sem âncoras'}
          </p>
          <div className="mt-4 h-1 w-24 -skew-x-12" style={{ backgroundColor: accent }} />

          <p className="mt-6 text-sm leading-relaxed text-stone-400 italic">{lore.personality}</p>

          <section className="mt-6 border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] tracking-[0.35em] text-stone-400 uppercase">
              {lore.weapon.type}
            </p>
            <h3 className="font-display mt-1 text-xl" style={{ color: accent }}>
              {lore.weapon.name}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              {lore.weapon.description}
            </p>
            <p className="mt-3 text-xs tracking-wide text-stone-500">{lore.discipline}</p>
          </section>

          <section className="mt-6 space-y-3 text-sm leading-relaxed text-stone-300">
            {lore.lore.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </section>

          {lore.ultimate && (
            <section
              className="mt-6 border-l-2 p-4"
              style={{ borderColor: accent, backgroundColor: `${accent}14` }}
            >
              <p className="text-[10px] tracking-[0.35em] text-stone-400 uppercase">
                Ougi — técnica suprema
              </p>
              <h3 className="font-display mt-1 text-lg text-stone-100">{lore.ultimate.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">
                {lore.ultimate.description}
              </p>
            </section>
          )}

          <blockquote className="font-display mt-8 text-lg leading-snug text-stone-100">
            <span style={{ color: accent }}>“</span>
            {lore.quote}
            <span style={{ color: accent }}>”</span>
          </blockquote>

          <section className="mt-8 space-y-2.5">
            {(Object.keys(STAT_LABELS) as (keyof SiblingStats)[]).map((key) => (
              <StatBar key={key} label={STAT_LABELS[key]} value={lore.stats[key]} accent={accent} />
            ))}
          </section>

          {/* hanko do clã */}
          <div className="mt-10 flex items-end justify-between">
            <div className="flex w-full gap-3">
              <ExportStlButton lore={lore} />
              <button
                onClick={clearSelection}
                className="cursor-pointer border border-white/20 px-4 py-2.5 text-xs tracking-[0.25em] text-stone-300 uppercase transition hover:bg-white/10"
              >
                Voltar
              </button>
            </div>
            <span className="font-display ml-4 flex h-12 w-12 shrink-0 rotate-6 items-center justify-center bg-red-800/90 text-2xl text-red-100 select-none">
              烈
            </span>
          </div>

          <p className="mt-3 text-[10px] leading-relaxed text-stone-600">
            Malha de alta resolução otimizada para impressão multicolor por filamento (mock).
          </p>
        </div>
      )}
    </aside>
  )
}
