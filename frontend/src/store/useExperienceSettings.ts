import { create } from 'zustand'

type Quality = 'cinematic' | 'balanced'
type TimeOfDay = 'cycle' | 'sunset' | 'night' | 'day'

interface ExperienceSettings {
  quality: Quality
  timeOfDay: TimeOfDay
  reducedMotion: boolean
  autoTour: boolean
  setQuality: (quality: Quality) => void
  setTimeOfDay: (timeOfDay: TimeOfDay) => void
  setReducedMotion: (reducedMotion: boolean) => void
  setAutoTour: (autoTour: boolean) => void
}

const motionKey = 'retsu-motion-v1'
function initialMotion() {
  try {
    const saved = localStorage.getItem(motionKey)
    if (saved === 'play' || saved === 'pause') return saved === 'pause'
  } catch { /* Storage can be unavailable in private browsing. */ }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const useExperienceSettings = create<ExperienceSettings>((set) => ({
  quality: window.matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 'balanced' : 'cinematic',
  timeOfDay: 'sunset',
  reducedMotion: initialMotion(),
  autoTour: true,
  setQuality: (quality) => set({ quality }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setReducedMotion: (reducedMotion) => {
    try { localStorage.setItem(motionKey, reducedMotion ? 'pause' : 'play') } catch { /* Keep the in-memory preference. */ }
    set({ reducedMotion })
  },
  setAutoTour: (autoTour) => set({ autoTour }),
}))
