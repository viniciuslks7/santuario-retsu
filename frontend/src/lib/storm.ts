/** Intensidade atual da tempestade de areia [0..1] — objeto mutável módulo-nível:
 *  a SandStorm escreve por frame e a DustParticles lê sem re-render (mesma
 *  filosofia imperativa do ciclo dia/noite). */
export const stormIntensity = { value: 0 }

/** Fog base da cena — fonte única: alimenta o <fog> declarado em Experience
 *  e é o ponto de partida da interpolação da SandStorm. */
export const FOG_NEAR = 40
export const FOG_FAR = 200

/** Teto físico da rajada calma — divide gustStrength pra normalizar em [0..1]. */
export const GUST_MAX = 1.25

/** Força da rajada calma no instante t (segundos de cena) — fonte única do
 *  "vento que respira": duas senoides dessincronizadas viram rajadas e
 *  calmarias. A DustParticles estica os grãos e o windAudio empurra o assobio
 *  com a MESMA curva, então o que se vê e o que se ouve são o mesmo vento. */
export function gustStrength(t: number): number {
  const gust = 0.55 + 0.45 * Math.sin(t * 0.22) + 0.25 * Math.sin(t * 0.53 + 1.7)
  return Math.min(Math.max(gust, 0.15), GUST_MAX)
}
