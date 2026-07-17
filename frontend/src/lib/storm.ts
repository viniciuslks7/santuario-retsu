/** Intensidade atual da tempestade de areia [0..1] — objeto mutável módulo-nível:
 *  a SandStorm escreve por frame e a DustParticles lê sem re-render (mesma
 *  filosofia imperativa do ciclo dia/noite). */
export const stormIntensity = { value: 0 }

/** Fog base da cena — fonte única: alimenta o <fog> declarado em Experience
 *  e é o ponto de partida da interpolação da SandStorm. */
export const FOG_NEAR = 40
export const FOG_FAR = 200
