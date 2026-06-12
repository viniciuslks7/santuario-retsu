import {
  ARTIFACT_SEEDS,
  CHOSEN_POSITION,
  pedestalPosition,
  SHRINE_RADIUS,
} from './artifacts'
import { duneHeight } from './dunes'

export interface CameraShot {
  position: [number, number, number]
  target: [number, number, number]
}

export const OVERVIEW_SHOT: CameraShot = {
  position: [0, 11, 28],
  target: [0, 2.5, 0],
}

/** Enquadramento macro de cada artefato: câmera fora do círculo, levemente
 *  deslocada pro lado, olhando o artefato com o coração do santuário ao fundo. */
export function getShot(siblingId: string): CameraShot {
  if (siblingId === 'chosen') {
    const [cx, cy, cz] = CHOSEN_POSITION
    const camX = cx - 4.6
    const camZ = cz + 4.2
    // Câmera apoiada na superfície da duna, mirando o meio da lâmina
    return {
      position: [camX, duneHeight(camX, camZ) + 2.6, camZ],
      target: [cx, cy + 1.6, cz],
    }
  }
  const seed = ARTIFACT_SEEDS.find((s) => s.id === siblingId)
  if (!seed) return OVERVIEW_SHOT
  const [x, , z] = pedestalPosition(seed.order)
  const angle = Math.atan2(z, x) + 0.32
  const radius = SHRINE_RADIUS + 4.2
  return {
    position: [Math.cos(angle) * radius, 3.7, Math.sin(angle) * radius],
    target: [x, 2.9, z],
  }
}
