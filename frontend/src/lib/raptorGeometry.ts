import * as THREE from 'three'

/** Silhueta baixo-poli de ave de rapina: "pipa" achatada (bico → ponta de asa
 *  → rabo → ponta de asa) com espessura via ápices topo/base — 8 triângulos.
 *  Tem volume real (não é billboard) pra ler certo de qualquer ângulo de
 *  câmera enquanto a ave circula. Bico aponta em -Z: convenção do
 *  Object3D.lookAt (usado em RaptorBirds pra orientar a ave na trajetória). */
export function createRaptorGeometry(): THREE.BufferGeometry {
  const nose = [0, 0, -1.1]
  const rightTip = [1.6, 0, 0.15]
  const tail = [0, 0, 1.0]
  const leftTip = [-1.6, 0, 0.15]
  const top = [0, 0.06, 0]
  const bottom = [0, -0.06, 0]

  const triangles = [
    // metade de cima (bico → asa dir. → rabo → asa esq. → bico, ligando ao ápice de cima)
    nose, rightTip, top,
    rightTip, tail, top,
    tail, leftTip, top,
    leftTip, nose, top,
    // metade de baixo (mesmo perímetro, ligando ao ápice de baixo)
    rightTip, nose, bottom,
    tail, rightTip, bottom,
    leftTip, tail, bottom,
    nose, leftTip, bottom,
  ]

  const positions = new Float32Array(triangles.flat())
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}
