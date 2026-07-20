import { useEffect, useMemo, useRef, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { fetchLore, LoreError } from '../../lib/api'
import type { LoreErrorKind, SiblingLore, SiblingStats } from '../../lib/api'
import { useShrineStore } from '../../store/useShrineStore'
import { countTriangles, weaponToStl } from '../../lib/exportStl'

const ERROR_COPY: Record<LoreErrorKind, { title: string; hint: string }> = {
  'not-found': {
    title: 'A Biblioteca do Fim não guarda registros desse nome.',
    hint: 'Esse artefato não pertence a nenhum dos irmãos catalogados.',
  },
  offline: {
    title: 'A Biblioteca do Fim está em silêncio.',
    hint: 'A API de lore não respondeu — confirme que o backend está de pé (porta 3001).',
  },
  server: {
    title: 'Os Arquivistas tropeçaram ao recuperar este pergaminho.',
    hint: 'O servidor respondeu com erro. Tente novamente em instantes.',
  },
}

const STAT_LABELS: Record<keyof SiblingStats, string> = {
  forca: 'Força',
  velocidade: 'Velocidade',
  tecnica: 'Técnica',
  espirito: 'Espírito',
  sanidade: 'Sanidade',
}

/** Exporta a malha real da arma (GLB → STL binário). A geometria do arquivo
 *  é exatamente a que flutua no pedestal — sem mock. */
function ExportStlButton({ lore }: { lore: SiblingLore }) {
  const { scene } = useGLTF(`/models/${lore.id}.glb`)
  const tris = useMemo(() => countTriangles(scene), [scene])
  const [phase, setPhase] = useState<'idle' | 'slicing' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Estado zera por remount (key={lore.id} no uso); aqui só o cleanup do timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const start = () => {
    setPhase('slicing')
    setProgress(0)
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 4 + Math.random() * 9
        if (next < 100) return next
        if (timerRef.current) clearInterval(timerRef.current)
        const blob = weaponToStl(scene)
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
      title={`${tris.toLocaleString('pt-BR')} triângulos`}
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
  // recompensa da tempestade: a Sem-Nome desperta ganha um adendo que a
  // Biblioteca do Fim nunca escreveu
  const awakened = useShrineStore((s) => s.stormPhase === 'done')
  const [lore, setLore] = useState<SiblingLore | null>(null)
  const [errorKind, setErrorKind] = useState<LoreErrorKind | null>(null)

  useEffect(() => {
    if (!selected) return
    let alive = true
    // Reset síncrono intencional: remount via key esvaziaria o painel durante
    // o slide-out; o flash de conteúdo antigo é mascarado pelo voo da câmera.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLore(null)
    setErrorKind(null)
    fetchLore(selected)
      .then((data) => alive && setLore(data))
      .catch((err) => {
        if (!alive) return
        setErrorKind(err instanceof LoreError ? err.kind : 'server')
      })
    return () => {
      alive = false
    }
  }, [selected])

  const open = Boolean(selected) && !isAnimating
  const accent = lore?.color ?? '#d4a017'
  const errorCopy = errorKind ? ERROR_COPY[errorKind] : null

  return (
    <aside
      aria-hidden={!open}
      style={{ '--accent': accent } as React.CSSProperties}
      className={`fixed inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-white/10 bg-gradient-to-l from-stone-950/95 via-stone-950/85 to-stone-950/60 backdrop-blur-md transition-all duration-700 ${
        open ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-16 opacity-0'
      }`}
    >
      {!lore && !errorCopy && (
        <p className="m-auto animate-pulse text-xs tracking-[0.4em] text-stone-400 uppercase">
          Consultando a Biblioteca do Fim…
        </p>
      )}

      {errorCopy && (
        <div className="m-auto px-10 text-center">
          <p className="font-display text-lg text-stone-100">{errorCopy.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">{errorCopy.hint}</p>
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

          {lore.id === 'chosen' && awakened && (
            <section className="mt-6 border-l-2 border-stone-200/70 bg-stone-200/5 p-4">
              <p className="text-[10px] tracking-[0.35em] text-stone-400 uppercase">
                adendo — depois da tempestade
              </p>
              <p className="mt-2 text-sm leading-relaxed text-stone-200">
                O juramento das nove lâminas foi cumprido, e o deserto disse o nome que a
                Biblioteca se recusa a escrever. A espada denteada não dorme mais: ela
                reconhece quem a encontrou — e aguarda o décimo capítulo.
              </p>
            </section>
          )}

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
              <ExportStlButton key={lore.id} lore={lore} />
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
            STL binário da malha real do artefato, escalado para ~100&nbsp;mm de altura — pronto
            para fatiar.
          </p>
        </div>
      )}
    </aside>
  )
}
