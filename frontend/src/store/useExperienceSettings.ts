import { create } from 'zustand'

type Quality = 'cinematic' | 'balanced'
type TimeOfDay = 'cycle' | 'sunset' | 'night' | 'day'

interface ExperienceSettings {
  quality: Quality
  timeOfDay: TimeOfDay
  reducedMotion: boolean
  setQuality: (quality: Quality) => void
  setTimeOfDay: (timeOfDay: TimeOfDay) => void
  setReducedMotion: (reducedMotion: boolean) => void
}

export const useExperienceSettings = create<ExperienceSettings>((set) => ({
  quality: window.matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 'balanced' : 'cinematic',
  timeOfDay: 'sunset',
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  setQuality: (quality) => set({ quality }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}))
