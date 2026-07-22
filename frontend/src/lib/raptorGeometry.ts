import * as THREE from 'three'

/** Silhueta baixo-poli de ave de rapina em voo: perímetro com entalhe entre
 *  asa e rabo (o "M" clássico de ave vista de baixo — sem o entalhe vira só
 *  um losango de 4 pontas, que de longe lê como quadrado torto, não como
 *  ave) extrudado pra ápices topo/base — 12 triângulos, sem UV/textura. Tem
 *  volume real (não é billboard) pra ler certo de qualquer ângulo de câmera
 *  enquanto a ave circula. Bico aponta em -Z: convenção do Object3D.lookAt
 *  (usado em RaptorBirds pra orientar a ave na trajetória). */
export function createRaptorGeometry(): THREE.BufferGeometry {
  // perímetro em ordem de giro (produz normais pra fora — ver comentário do
  // loop abaixo); envergadura bem maior que o comprimento pra ler como asa
  // aberta, não como corpo redondo
  const perimeter = [
    [0, 0, -1.3], // bico
    [1.9, 0, -0.1], // ponta da asa direita
    [0.35, 0, 0.55], // entalhe direito — separa a asa do rabo
    [0, 0, 1.15], // rabo
    [-0.35, 0, 0.55], // entalhe esquerdo
    [-1.9, 0, -0.1], // ponta da asa esquerda
  ]
  const top = [0, 0.05, -0.05]
  const bottom = [0, -0.05, -0.05]

  // extrusão do perímetro pros ápices: (a, top, b) e (b, bottom, a) mantêm o
  // mesmo sentido de giro do perímetro, o que dá normais pra fora nos dois
  // lados (verificado por volume com sinal positivo)
  const triangles: number[][] = []
  for (let i = 0; i < perimeter.length; i++) {
    const a = perimeter[i]
    const b = perimeter[(i + 1) % perimeter.length]
    triangles.push(a, top, b)
    triangles.push(b, bottom, a)
  }

  const positions = new Float32Array(triangles.flat())
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}
