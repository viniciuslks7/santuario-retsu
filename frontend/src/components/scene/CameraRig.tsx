import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useThree } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useShrineStore } from '../../store/useShrineStore'
import { getShot, OVERVIEW_SHOT } from '../../lib/cameraShots'

/** Conduz a câmera com GSAP entre a visão geral e o close de cada artefato.
 *  OrbitControls fica desabilitado durante o trânsito e na inspeção. */
export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const selectedSibling = useShrineStore((s) => s.selectedSibling)
  const setAnimating = useShrineStore((s) => s.setAnimating)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const firstRunRef = useRef(true)

  // Deep-link de inspeção: ?focus=lara abre direto no close
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('focus')
    if (id) useShrineStore.getState().select(id)
  }, [])

  // Handle de inspeção pra testes automatizados (só em dev)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as Record<string, unknown>).__shrineDebug = () => ({
      selected: useShrineStore.getState().selectedSibling,
      isAnimating: useShrineStore.getState().isAnimating,
      camera: camera.position.toArray().map((n) => Math.round(n * 10) / 10),
      target: controls?.target.toArray().map((n) => Math.round(n * 10) / 10),
      hasControls: Boolean(controls),
    })
  }, [camera, controls])

  // Esc volta pra visão geral
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') useShrineStore.getState().clearSelection()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!controls) return
    if (firstRunRef.current && !selectedSibling) {
      // Carga inicial já está na visão geral: nada a animar
      firstRunRef.current = false
      return
    }
    firstRunRef.current = false

    const shot = selectedSibling ? getShot(selectedSibling) : OVERVIEW_SHOT
    timelineRef.current?.kill()
    controls.enabled = false
    setAnimating(true)

    const tl = gsap.timeline({
      defaults: { duration: 1.7, ease: 'power3.inOut' },
      onUpdate: () => controls.update(),
      onComplete: () => {
        setAnimating(false)
        if (!selectedSibling) controls.enabled = true
      },
    })
    const [px, py, pz] = shot.position
    const [tx, ty, tz] = shot.target
    tl.to(camera.position, { x: px, y: py, z: pz }, 0)
    tl.to(controls.target, { x: tx, y: ty, z: tz }, 0)
    timelineRef.current = tl

    return () => {
      tl.kill()
    }
  }, [selectedSibling, controls, camera, setAnimating])

  return null
}
