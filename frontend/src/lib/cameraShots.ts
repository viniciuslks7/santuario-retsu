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
  position: [24, 17, 32],
  target: [0, 3, 0],
}

/** Close do monólito central (a Biblioteca do Fim em miniatura). */
export const CLAN_SHOT: CameraShot = {
  position: [4.5, 5.2, 9.5],
  target: [0, 3.6, 0],
}

/** Direção xz do poente — manter em sincronia com SUN_AXIS do
 *  DesertEnvironment (-0.55, 0, -0.82 normalizado). Usada no contraluz. */
const SUNSET_X = -0.557
const SUNSET_Z = -0.83

/** Desvios por irmão sobre o enquadramento macro padrão — nove closes
 *  idênticos cansam; cada lâmina ganha um ponto de vista com personalidade. */
interface ShotTweak {
  /** desvio angular da câmera em rad (padrão 0.32) */
  angle?: number
  /** altura da câmera (padrão 3.7) */
  height?: number
  /** distância além do SHRINE_RADIUS (padrão 4.2) */
  radius?: number
  /** altura do olhar (padrão 2.9) */
  targetY?: number
}

const SHOT_TWEAKS: Record<string, ShotTweak> = {
  setsuna: { height: 2.5, targetY: 2.6, radius: 3.4 }, // rasante e próximo, como neblina
  lara: { angle: 0.55, height: 4.8 },                  // mergulho agressivo
  iwao: { height: 2.1, targetY: 3.3, radius: 3.8 },    // de baixo pra cima — peso da montanha
  tsumugi: { angle: -0.45, radius: 5.2 },              // recuado, olhar de tecelã
  raizo: { height: 5.4, angle: 0.42 },                 // do alto, de onde cai o trovão
  mizuki: { height: 2.7, targetY: 2.7, angle: -0.3 },  // à flor d'água
  kyoya: { radius: 5.8, height: 4.5, angle: 0.5 },     // distância respeitosa do arquivo proibido
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
  if (siblingId === 'ranmaru') {
    // Contraluz: câmera no lado oposto ao poente, baixa e olhando pra cima —
    // a lâmina do 8º irmão silhuetada contra o sol
    return {
      position: [x - SUNSET_X * 6.4, 2.3, z - SUNSET_Z * 6.4],
      target: [x, 3.4, z],
    }
  }
  const tweak = SHOT_TWEAKS[siblingId] ?? {}
  const angle = Math.atan2(z, x) + (tweak.angle ?? 0.32)
  const radius = SHRINE_RADIUS + (tweak.radius ?? 4.2)
  return {
    position: [Math.cos(angle) * radius, tweak.height ?? 3.7, Math.sin(angle) * radius],
    target: [x, tweak.targetY ?? 2.9, z],
  }
}


export const LANDMARK_SHOTS: Record<'gate' | 'archive' | 'oasis', CameraShot> = {
  gate: { position: [7, 7, 33], target: [0, 4, 22] },
  archive: { position: [-18, 11, -5], target: [-29, 4, -19] },
  oasis: { position: [19, 9, 22], target: [30, 2, 9] },
}
