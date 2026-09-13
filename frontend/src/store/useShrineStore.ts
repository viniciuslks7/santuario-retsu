import { create } from 'zustand'
import type { SiblingSummary } from '../lib/api'
import { ARTIFACT_SEEDS, CHOSEN_SEED } from '../lib/artifacts'

export type ShrineView = 'overview' | 'inspecting'
export type StormPhase = 'idle' | 'raging' | 'done'
export type LandmarkId = 'gate' | 'archive' | 'oasis'
export const CLAN_FOCUS = '__clan__'
const PROGRESS_KEY = 'retsu-expedition-v1'
const validArtifacts = new Set([...ARTIFACT_SEEDS, CHOSEN_SEED].map((s) => s.id))
const validLandmarks = new Set(['gate', 'archive', 'oasis'])

function readProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')
    const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
    return {
      discovered: new Set(strings(data.discovered).filter((id) => validArtifacts.has(id))),
      visitedLandmarks: new Set(strings(data.visitedLandmarks).filter((id) => validLandmarks.has(id))),
      readChapters: new Set(strings(data.readChapters)),
    }
  } catch { return { discovered: new Set<string>(), visitedLandmarks: new Set<string>(), readChapters: new Set<string>() } }
}
const saved = readProgress()

interface ShrineState {
  currentView: ShrineView
  selectedSibling: string | null
  hoveredSibling: string | null
  clanOpen: boolean
  activeLandmark: LandmarkId | null
  hasEntered: boolean
  viewRevision: number
  discovered: Set<string>
  visitedLandmarks: Set<string>
  readChapters: Set<string>
  stormPhase: StormPhase
  isAnimating: boolean
  siblingIndex: Record<string, SiblingSummary>
  select: (siblingId: string) => void
  endStorm: () => void
  openClan: () => void
  visitLandmark: (id: LandmarkId) => void
  markChapterRead: (id: string) => void
  enter: () => void
  clearSelection: () => void
  setHovered: (siblingId: string | null) => void
  setAnimating: (animating: boolean) => void
  setSiblingIndex: (siblings: SiblingSummary[]) => void
}

export const useShrineStore = create<ShrineState>((set) => ({
  viewRevision: 0,
  currentView: 'overview', selectedSibling: null, hoveredSibling: null,
  clanOpen: false, activeLandmark: null,
  hasEntered: saved.discovered.size > 0 || saved.visitedLandmarks.size > 0,
  ...saved,
  stormPhase: ARTIFACT_SEEDS.every((seed) => saved.discovered.has(seed.id)) ? 'done' : 'idle',
  isAnimating: false, siblingIndex: {},
  select: (siblingId) => {
    if (!validArtifacts.has(siblingId)) return
    set((s) => {
      const discovered = new Set(s.discovered).add(siblingId)
      const oathComplete = ARTIFACT_SEEDS.every((seed) => discovered.has(seed.id))
      return {
        currentView: 'inspecting', selectedSibling: siblingId, clanOpen: false,
        activeLandmark: null, hoveredSibling: null, hasEntered: true, discovered,
        stormPhase: s.stormPhase === 'idle' && oathComplete ? 'raging' : s.stormPhase,
      }
    })
  },
  endStorm: () => set({ stormPhase: 'done' }),
  openClan: () => set({ currentView: 'inspecting', selectedSibling: null, clanOpen: true, activeLandmark: null, hoveredSibling: null, hasEntered: true }),
  visitLandmark: (id) => {
    if (!validLandmarks.has(id)) return
    set((s) => ({ currentView: 'inspecting', selectedSibling: null, clanOpen: false, activeLandmark: id, hoveredSibling: null, hasEntered: true, visitedLandmarks: new Set(s.visitedLandmarks).add(id) }))
  },
  markChapterRead: (id) => set((s) => ({ readChapters: new Set(s.readChapters).add(id) })),
  enter: () => set({ hasEntered: true }),
  clearSelection: () => set((s) => ({ currentView: 'overview', selectedSibling: null, clanOpen: false, activeLandmark: null, hoveredSibling: null, viewRevision: s.viewRevision + 1 })),
  setHovered: (siblingId) => set({ hoveredSibling: siblingId }),
  setAnimating: (animating) => set({ isAnimating: animating }),
  setSiblingIndex: (siblings) => set({ siblingIndex: Object.fromEntries(siblings.map((s) => [s.id, s])) }),
}))

useShrineStore.subscribe((state, previous) => {
  if (state.discovered === previous.discovered && state.visitedLandmarks === previous.visitedLandmarks && state.readChapters === previous.readChapters) return
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ discovered: [...state.discovered], visitedLandmarks: [...state.visitedLandmarks], readChapters: [...state.readChapters] }))
  } catch { /* A expedição continua quando o navegador bloqueia armazenamento. */ }
})
