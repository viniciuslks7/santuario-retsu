import { create } from 'zustand'

export type ShrineView = 'overview' | 'inspecting'

interface ShrineState {
  currentView: ShrineView
  selectedSibling: string | null
  hoveredSibling: string | null
  /** true enquanto a câmera GSAP está em trânsito */
  isAnimating: boolean
  select: (siblingId: string) => void
  clearSelection: () => void
  setHovered: (siblingId: string | null) => void
  setAnimating: (animating: boolean) => void
}

export const useShrineStore = create<ShrineState>((set) => ({
  currentView: 'overview',
  selectedSibling: null,
  hoveredSibling: null,
  isAnimating: false,
  select: (siblingId) =>
    set({ currentView: 'inspecting', selectedSibling: siblingId, hoveredSibling: null }),
  clearSelection: () => set({ currentView: 'overview', selectedSibling: null }),
  setHovered: (siblingId) => set({ hoveredSibling: siblingId }),
  setAnimating: (animating) => set({ isAnimating: animating }),
}))
