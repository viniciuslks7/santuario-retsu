// Cliente da API de lore (proxy /api → localhost:3001 em dev, ver vite.config.ts)

export interface SiblingSummary {
  id: string
  order: number
  name: string
  title: string
  epithet: string
  color: string
  weapon: { name: string; type: string }
}

export interface SiblingStats {
  forca: number
  velocidade: number
  tecnica: number
  espirito: number
  sanidade: number
}

export interface SiblingLore {
  id: string
  order: number
  name: string
  title: string
  epithet: string
  color: string
  hidden: boolean
  goldenJewels: boolean
  weapon: { name: string; type: string; description: string }
  discipline: string
  ultimate: { name: string; description: string } | null
  personality: string
  lore: string[]
  quote: string
  stats: SiblingStats
}

const loreCache = new Map<string, SiblingLore>()

export async function fetchLore(siblingId: string): Promise<SiblingLore> {
  const cached = loreCache.get(siblingId)
  if (cached) return cached
  const res = await fetch(`/api/lore/${siblingId}`)
  if (!res.ok) throw new Error(`lore ${siblingId}: HTTP ${res.status}`)
  const data = (await res.json()) as SiblingLore
  loreCache.set(siblingId, data)
  return data
}

export async function fetchSiblingIndex(): Promise<SiblingSummary[]> {
  const res = await fetch('/api/lore')
  if (!res.ok) throw new Error(`índice de lore: HTTP ${res.status}`)
  return (await res.json()) as SiblingSummary[]
}
