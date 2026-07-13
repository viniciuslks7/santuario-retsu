import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'

/** Durante a inspeção, arrastar em qualquer lugar do canvas gira a arma
 *  (turntable no Y + inclinação limitada no X). O OrbitControls está
 *  desabilitado nesse estado, então o arrasto não briga com a câmera; o
 *  clique raso na areia (delta < 4) continua voltando pra visão geral.
 *  Ao sair da inspeção, a arma volta suavemente pro ângulo original. */
export function useInspectSpin(active: boolean) {
  const groupRef = useRef<THREE.Group>(null)
  const target = useRef({ yaw: 0, pitch: 0 })
  const dragging = useRef(false)
  const last = useRef<[number, number]>([0, 0])
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    if (!active) return
    const el = gl.domElement
    const down = (e: PointerEvent) => {
      dragging.current = true
      last.current = [e.clientX, e.clientY]
    }
    const move = (e: PointerEvent) => {
      if (!dragging.current) return
      const [lx, ly] = last.current
      last.current = [e.clientX, e.clientY]
      target.current.yaw += (e.clientX - lx) * 0.009
      target.current.pitch = THREE.MathUtils.clamp(target.current.pitch + (e.clientY - ly) * 0.005, -0.55, 0.55)
    }
    const up = () => {
      dragging.current = false
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      dragging.current = false
    }
  }, [active, gl])

  useFrame((_, delta) => {
    if (!active) {
      target.current.yaw = 0
      target.current.pitch = 0
    }
    const g = groupRef.current
    if (!g) return
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, target.current.yaw, 8, delta)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, target.current.pitch, 8, delta)
  })

  return groupRef
}
