// Interface assíncrona para as crônicas incluídas no próprio site estático.

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

export interface ClanLore {
  clan: string
  fortress: string
  prologue: string
}

let catalogPromise: Promise<typeof import('../data/catalog')> | null = null

function loadCatalog() {
  catalogPromise ??= import('../data/catalog').catch(() => {
    // Permite tentar novamente se o arquivo estático não terminou de carregar.
    catalogPromise = null
    throw new LoreError('offline', 'Não foi possível carregar o arquivo das crônicas.')
  })
  return catalogPromise
}

export async function fetchLore(siblingId: string): Promise<SiblingLore> {
  const { siblings } = await loadCatalog()
  const sibling = siblings.find(({ id }) => id === siblingId)
  if (!sibling) throw new LoreError('not-found', `lore ${siblingId}: sem registro`)
  return sibling
}

export async function fetchSiblingIndex(): Promise<SiblingSummary[]> {
  const { siblings } = await loadCatalog()
  return siblings
    .filter(({ hidden }) => !hidden)
    .map(({ id, order, name, title, epithet, color, weapon }) => ({
      id, order, name, title, epithet, color,
      weapon: { name: weapon.name, type: weapon.type },
    }))
}

export async function fetchClan(): Promise<ClanLore> {
  return (await loadCatalog()).clanLore
}
