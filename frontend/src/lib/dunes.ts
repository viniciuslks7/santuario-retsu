
/** Altura procedural das dunas em coordenadas de mundo (x, z).
 *  Mesma fórmula usada pra deslocar a malha do terreno: o plano é rodado
 *  -90° em X, então o eixo Y do plano corresponde a -Z no mundo. */
export function duneHeight(x: number, z: number): number {
  const y = -z
  const h =
    Math.sin(x * 0.05 + y * 0.02) * Math.cos(y * 0.04) * 2.6 +
    Math.sin(x * 0.13 - y * 0.09) * 0.9 +
    Math.cos(x * 0.31 + y * 0.27) * 0.25
  // Achata o centro pra abrigar o santuário
  const t = Math.max(0, Math.min(1, (Math.hypot(x, y) - 13) / 17))
  const flatten = t * t * (3 - 2 * t)
  return h * flatten
}
