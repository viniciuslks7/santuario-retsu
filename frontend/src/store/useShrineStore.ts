import { create } from 'zustand'
import type { SiblingSummary } from '../lib/api'
import { ARTIFACT_SEEDS } from '../lib/artifacts'

export type ShrineView = 'overview' | 'inspecting'

/** Tempestade do juramento: idle → raging (9ª lâmina inspecionada) → done
 *  (a décima despertou — o estado nunca volta a idle na mesma visita) */
export type StormPhase = 'idle' | 'raging' | 'done'

/** id sintético do monólito central pra reaproveitar o pipeline de câmera/seleção */
export const CLAN_FOCUS = '__clan__'

interface ShrineState {
  currentView: ShrineView
  selectedSibling: string | null
  hoveredSibling: string | null
  /** true quando o painel do clã (monólito central) está aberto */
  clanOpen: boolean
  /** ids de artefatos já inspecionados nesta visita — alimenta o contador de descoberta */
  discovered: Set<string>
  /** fase da tempestade que desperta a lâmina da Chosen */
  stormPhase: StormPhase
  /** true enquanto a câmera GSAP está em trânsito */
  isAnimating: boolean
  /** Índice resumido vindo de GET /api/lore (sem a Chosen) — alimenta os nameplates */
  siblingIndex: Record<string, SiblingSummary>
  select: (siblingId: string) => void
  endStorm: () => void
  openClan: () => void
  clearSelection: () => void
  setHovered: (siblingId: string | null) => void
  setAnimating: (animating: boolean) => void
  setSiblingIndex: (siblings: SiblingSummary[]) => void
}

export const useShrineStore = create<ShrineState>((set) => ({
  currentView: 'overview',
  selectedSibling: null,
  hoveredSibling: null,
  clanOpen: false,
  discovered: new Set(),
  stormPhase: 'idle',
  isAnimating: false,
  siblingIndex: {},
  select: (siblingId) =>
    set((s) => {
      const discovered = new Set(s.discovered).add(siblingId)
      // as nove lâminas do juramento inspecionadas → o deserto se levanta
      const oathComplete = ARTIFACT_SEEDS.every((seed) => discovered.has(seed.id))
      return {
        currentView: 'inspecting',
        selectedSibling: siblingId,
        clanOpen: false,
        hoveredSibling: null,
        discovered,
        stormPhase: s.stormPhase === 'idle' && oathComplete ? 'raging' : s.stormPhase,
      }
    }),
  endStorm: () => set({ stormPhase: 'done' }),
  openClan: () =>
    set({ currentView: 'inspecting', selectedSibling: null, clanOpen: true, hoveredSibling: null }),
  clearSelection: () => set({ currentView: 'overview', selectedSibling: null, clanOpen: false }),
  setHovered: (siblingId) => set({ hoveredSibling: siblingId }),
  setAnimating: (animating) => set({ isAnimating: animating }),
  setSiblingIndex: (siblings) =>
    set({ siblingIndex: Object.fromEntries(siblings.map((s) => [s.id, s])) }),
}))
