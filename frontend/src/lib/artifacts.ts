// Sementes visuais dos artefatos (ids e cores espelham backend/src/data/siblings.js).
// O lore completo vem da API no clique; aqui fica só o necessário pra montar a cena.

import { duneHeight } from './dunes'

export type ArtifactShape =
  | 'nodachi'
  | 'katana'
  | 'greatblade'
  | 'spindle'
  | 'urn'
  | 'club'
  | 'sickle'

export interface ArtifactSeed {
  id: string
  order: number
  color: string
  shape: ArtifactShape
}

export const ARTIFACT_SEEDS: ArtifactSeed[] = [
  { id: 'haruki', order: 1, color: '#7cb342', shape: 'nodachi' },
  { id: 'setsuna', order: 2, color: '#90caf9', shape: 'katana' },
  { id: 'lara', order: 3, color: '#d32f2f', shape: 'katana' },
  { id: 'iwao', order: 4, color: '#8d6e63', shape: 'greatblade' },
  { id: 'tsumugi', order: 5, color: '#ce93d8', shape: 'spindle' },
  { id: 'raizo', order: 6, color: '#fdd835', shape: 'katana' },
  { id: 'mizuki', order: 7, color: '#4dd0e1', shape: 'urn' },
  { id: 'ranmaru', order: 8, color: '#ff7043', shape: 'club' },
  { id: 'kyoya', order: 9, color: '#ab47bc', shape: 'sickle' },
]

export const CHOSEN_SEED: ArtifactSeed = {
  id: 'chosen',
  order: 10,
  color: '#e0e0e0',
  shape: 'greatblade',
}

/** Raio do círculo de pedestais ao redor do monólito central. */
export const SHRINE_RADIUS = 9

/** Posição de cada pedestal (o primeiro fica à frente, ângulos no sentido horário). */
export function pedestalPosition(order: number): [number, number, number] {
  const angle = ((order - 1) / 9) * Math.PI * 2 + Math.PI / 2
  return [Math.cos(angle) * SHRINE_RADIUS, 0, Math.sin(angle) * SHRINE_RADIUS]
}

/** Onde a espada da Chosen está cravada: longe do círculo, no alto de uma duna. */
const CHOSEN_X = 26
const CHOSEN_Z = -17
export const CHOSEN_POSITION: [number, number, number] = [
  CHOSEN_X,
  duneHeight(CHOSEN_X, CHOSEN_Z) - 0.25,
  CHOSEN_Z,
]
