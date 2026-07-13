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

/** Erro de lore com a causa já classificada, pra UI escolher a mensagem certa. */
export type LoreErrorKind = 'not-found' | 'offline' | 'server'

export class LoreError extends Error {
  kind: LoreErrorKind
  constructor(kind: LoreErrorKind, message: string) {
    super(message)
    this.name = 'LoreError'
    this.kind = kind
  }
}

const loreCache = new Map<string, SiblingLore>()

export async function fetchLore(siblingId: string): Promise<SiblingLore> {
  const cached = loreCache.get(siblingId)
  if (cached) return cached

  let res: Response
  try {
    res = await fetch(`/api/lore/${siblingId}`)
  } catch {
    // fetch só rejeita por falha de rede — backend fora do ar, DNS, CORS…
    throw new LoreError('offline', `lore ${siblingId}: rede indisponível`)
  }

  if (res.status === 404) {
    throw new LoreError('not-found', `lore ${siblingId}: sem registro`)
  }
  if (!res.ok) {
    throw new LoreError('server', `lore ${siblingId}: HTTP ${res.status}`)
  }

  const data = (await res.json()) as SiblingLore
  loreCache.set(siblingId, data)
  return data
}

export async function fetchSiblingIndex(): Promise<SiblingSummary[]> {
  const res = await fetch('/api/lore')
  if (!res.ok) throw new Error(`índice de lore: HTTP ${res.status}`)
  return (await res.json()) as SiblingSummary[]
}

export interface ClanLore {
  clan: string
  fortress: string
  prologue: string
}

let clanCache: ClanLore | null = null

export async function fetchClan(): Promise<ClanLore> {
  if (clanCache) return clanCache
  let res: Response
  try {
    res = await fetch('/api/clan')
  } catch {
    throw new LoreError('offline', 'clã: rede indisponível')
  }
  if (!res.ok) throw new LoreError('server', `clã: HTTP ${res.status}`)
  clanCache = (await res.json()) as ClanLore
  return clanCache
}
