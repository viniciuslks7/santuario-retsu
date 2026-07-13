import { create } from 'zustand'
import type { SiblingSummary } from '../lib/api'

export type ShrineView = 'overview' | 'inspecting'

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
  /** true enquanto a câmera GSAP está em trânsito */
  isAnimating: boolean
  /** Índice resumido vindo de GET /api/lore (sem a Chosen) — alimenta os nameplates */
  siblingIndex: Record<string, SiblingSummary>
  select: (siblingId: string) => void
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
  isAnimating: false,
  siblingIndex: {},
  select: (siblingId) =>
    set((s) => ({
      currentView: 'inspecting',
      selectedSibling: siblingId,
      clanOpen: false,
      hoveredSibling: null,
      discovered: new Set(s.discovered).add(siblingId),
    })),
  openClan: () =>
    set({ currentView: 'inspecting', selectedSibling: null, clanOpen: true, hoveredSibling: null }),
  clearSelection: () => set({ currentView: 'overview', selectedSibling: null, clanOpen: false }),
  setHovered: (siblingId) => set({ hoveredSibling: siblingId }),
  setAnimating: (animating) => set({ isAnimating: animating }),
  setSiblingIndex: (siblings) =>
    set({ siblingIndex: Object.fromEntries(siblings.map((s) => [s.id, s])) }),
}))
