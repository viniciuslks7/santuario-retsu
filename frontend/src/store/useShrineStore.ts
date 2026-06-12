import { create } from 'zustand'
import type { SiblingSummary } from '../lib/api'

export type ShrineView = 'overview' | 'inspecting'

interface ShrineState {
  currentView: ShrineView
  selectedSibling: string | null
  hoveredSibling: string | null
  /** true enquanto a câmera GSAP está em trânsito */
  isAnimating: boolean
  /** Índice resumido vindo de GET /api/lore (sem a Chosen) — alimenta os nameplates */
  siblingIndex: Record<string, SiblingSummary>
  select: (siblingId: string) => void
  clearSelection: () => void
  setHovered: (siblingId: string | null) => void
  setAnimating: (animating: boolean) => void
  setSiblingIndex: (siblings: SiblingSummary[]) => void
}

export const useShrineStore = create<ShrineState>((set) => ({
  currentView: 'overview',
  selectedSibling: null,
  hoveredSibling: null,
  isAnimating: false,
  siblingIndex: {},
  select: (siblingId) =>
    set({ currentView: 'inspecting', selectedSibling: siblingId, hoveredSibling: null }),
  clearSelection: () => set({ currentView: 'overview', selectedSibling: null }),
  setHovered: (siblingId) => set({ hoveredSibling: siblingId }),
  setAnimating: (animating) => set({ isAnimating: animating }),
  setSiblingIndex: (siblings) =>
    set({ siblingIndex: Object.fromEntries(siblings.map((s) => [s.id, s])) }),
}))
