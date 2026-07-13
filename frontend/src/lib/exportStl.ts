// Exporta a malha real de uma arma (GLB) como STL binário, pronta pra fatiar.
// Substitui o antigo mock: a geometria que você vê na cena é a que sai no arquivo.
import * as THREE from 'three'
import { STLExporter } from 'three-stdlib'

/** Unidades da cena → milímetros. As armas têm ~2,5 u de altura; *40 ≈ 100 mm. */
const SCENE_TO_MM = 40

/**
 * Gera um STL binário a partir de um Object3D (a `scene` do useGLTF).
 * Clona e congela a transformação numa escala de impressão antes de exportar,
 * pra não tocar no objeto que está sendo renderizado.
 */
export function weaponToStl(object: THREE.Object3D): Blob {
  const root = object.clone(true)
  root.scale.multiplyScalar(SCENE_TO_MM)
  root.updateMatrixWorld(true)

  // STLExporter lê world matrices; binário = malha compacta e fiel.
  const data = new STLExporter().parse(root, { binary: true }) as unknown as DataView
  return new Blob([data.buffer as ArrayBuffer], { type: 'model/stl' })
}

/** Conta triângulos da malha — usado pra mostrar a densidade real no painel. */
export function countTriangles(object: THREE.Object3D): number {
  let tris = 0
  object.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry) {
      const geo = obj.geometry as THREE.BufferGeometry
      tris += geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3
    }
  })
  return Math.round(tris)
}
