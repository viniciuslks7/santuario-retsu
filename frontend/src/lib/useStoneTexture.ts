import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

/** A single local texture is shared by each building's carved stone surfaces. */
export function useStoneTexture() {
  const texture = useMemo(() => {
    const size = 128
    const data = new Uint8Array(size * size * 4)
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const noise = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
      const seam = y % 32 < 2 || (x + (Math.floor(y / 32) % 2) * 32) % 64 < 2
      const value = seam ? 53 : 132 + (noise - Math.floor(noise)) * 63 + Math.sin(x * .19 + y * .12) * 12
      const index = (y * size + x) * 4
      data[index] = data[index + 1] = data[index + 2] = value
      data[index + 3] = 255
    }
    const result = new THREE.DataTexture(data, size, size)
    result.wrapS = result.wrapT = THREE.RepeatWrapping
    result.generateMipmaps = true
    result.minFilter = THREE.LinearMipmapLinearFilter
    result.magFilter = THREE.LinearFilter
    result.needsUpdate = true
    return result
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

