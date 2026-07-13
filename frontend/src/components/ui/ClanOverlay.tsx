import { useEffect, useState } from 'react'
import { fetchClan } from '../../lib/api'
import type { ClanLore } from '../../lib/api'
import { useShrineStore } from '../../store/useShrineStore'

/** Painel do clã: desliza da esquerda quando o monólito central é clicado.
 *  Conteúdo de GET /api/clan (prólogo das Crônicas). */
export function ClanOverlay() {
  const clanOpen = useShrineStore((s) => s.clanOpen)
  const isAnimating = useShrineStore((s) => s.isAnimating)
  const clearSelection = useShrineStore((s) => s.clearSelection)
  const discoveredCount = useShrineStore((s) => s.discovered.size)
  const [clan, setClan] = useState<ClanLore | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!clanOpen) return
    let alive = true
    setFailed(false)
    fetchClan()
      .then((data) => alive && setClan(data))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [clanOpen])

  const open = clanOpen && !isAnimating

  return (
    <aside
      aria-hidden={!open}
      className={`fixed inset-y-0 left-0 z-20 flex w-full max-w-md flex-col border-r border-amber-500/15 bg-gradient-to-r from-stone-950/95 via-stone-950/85 to-stone-950/55 backdrop-blur-md transition-all duration-700 ${
        open ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-16 opacity-0'
      }`}
    >
      {failed && (
        <div className="m-auto px-10 text-center">
          <p className="font-display text-lg text-stone-100">A Biblioteca do Fim está em silêncio.</p>
          <p className="mt-3 text-sm text-stone-400">
            A API de lore não respondeu — confirme que o backend está de pé (porta 3001).
          </p>
          <button
            onClick={clearSelection}
            className="mt-6 cursor-pointer border border-white/20 px-4 py-2 text-xs tracking-[0.25em] uppercase hover:bg-white/10"
          >
            Voltar ao santuário
          </button>
        </div>
      )}

      {clan && !failed && (
        <div className="relative flex-1 overflow-y-auto px-8 py-10 text-stone-200">
          <span className="font-display pointer-events-none absolute -top-4 left-2 text-[9rem] leading-none text-amber-500/5 select-none">
            烈
          </span>

          <p className="text-[11px] tracking-[0.45em] text-amber-200/70 uppercase">A fortaleza</p>
          <h2 className="font-display mt-1 text-4xl text-stone-50">{clan.fortress}</h2>
          <p className="mt-1 text-sm text-stone-400">{clan.clan}</p>
          <div className="mt-4 h-1 w-24 -skew-x-12 bg-amber-500/80" />

          <p className="mt-6 text-sm leading-relaxed text-stone-300">{clan.prologue}</p>

          <section className="mt-8 border border-amber-500/15 bg-amber-500/5 p-4">
            <p className="text-[10px] tracking-[0.35em] text-amber-200/70 uppercase">Relíquias reveladas</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-3xl text-stone-50">{discoveredCount}</span>
              <span className="text-sm text-stone-400">/ 10 artefatos inspecionados</span>
            </div>
            <div className="mt-3 h-1.5 w-full bg-white/10">
              <div
                className="h-full bg-amber-500/80 transition-[width] duration-700"
                style={{ width: `${(discoveredCount / 10) * 100}%` }}
              />
            </div>
            {discoveredCount >= 10 && (
              <p className="mt-3 text-xs text-amber-200/80 italic">
                Todas as lâminas — e o segredo que o deserto pariu — foram desenterradas.
              </p>
            )}
          </section>

          <button
            onClick={clearSelection}
            className="mt-8 cursor-pointer border border-white/20 px-4 py-2.5 text-xs tracking-[0.25em] text-stone-300 uppercase transition hover:bg-white/10"
          >
            Voltar ao santuário
          </button>
        </div>
      )}
    </aside>
  )
}
