import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useThree } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useShrineStore } from '../../store/useShrineStore'
import { useExperienceSettings } from '../../store/useExperienceSettings'
import { ARTIFACT_SEEDS, CHOSEN_SEED } from '../../lib/artifacts'
import { CLAN_SHOT, LANDMARK_SHOTS, getShot, OVERVIEW_SHOT } from '../../lib/cameraShots'

export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const aspect = useThree((s) => s.size.width / s.size.height)
  const height = useThree((s) => s.size.height)
  const selected = useShrineStore((s) => s.selectedSibling)
  const clanOpen = useShrineStore((s) => s.clanOpen)
  const landmark = useShrineStore((s) => s.activeLandmark)
  const revision = useShrineStore((s) => s.viewRevision)
  const entered = useShrineStore((s) => s.hasEntered)
  const firstRunRef = useRef(true)
  useEffect(() => () => useShrineStore.getState().setAnimating(false), [])

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const id = query.get('focus')
    if (id && [...ARTIFACT_SEEDS, CHOSEN_SEED].some((seed) => seed.id === id)) useShrineStore.getState().select(id)
    const place = query.get('place')
    if (place === 'gate' || place === 'archive' || place === 'oasis') useShrineStore.getState().visitLandmark(place)
  }, [])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    const target = window as unknown as Record<string, unknown>
    target.__shrineStore = useShrineStore
    target.__shrineDebug = () => ({
      selected: useShrineStore.getState().selectedSibling,
      isAnimating: useShrineStore.getState().isAnimating,
      camera: camera.position.toArray().map((n) => Math.round(n * 10) / 10),
      target: controls?.target.toArray().map((n) => Math.round(n * 10) / 10),
      hasControls: Boolean(controls),
    })
  }, [camera, controls])

  useEffect(() => {
    if (!controls) return
    const inspecting = Boolean(selected) || clanOpen || Boolean(landmark)
    const shot = landmark ? LANDMARK_SHOTS[landmark] : clanOpen ? CLAN_SHOT : selected ? getShot(selected) : OVERVIEW_SHOT
    const reduced = useExperienceSettings.getState().reducedMotion
    const initial = firstRunRef.current
    firstRunRef.current = false
    controls.enabled = false
    // Distância do close cresce quando o FOV horizontal fica estreito.
    const closeDistance = height < 200 ? 2.1 : height < 330 ? 1.7 : 1.35
    const framing = inspecting ? Math.max(closeDistance, 1.12 / aspect) : Math.max(1.13, 0.73 / aspect)
    const [tx, ty, tz] = shot.target
    const position = { x: tx + (shot.position[0] - tx) * framing, y: ty + (shot.position[1] - ty) * framing, z: tz + (shot.position[2] - tz) * framing }
    useShrineStore.getState().setAnimating(true)
    const tl = gsap.timeline({
      defaults: { duration: initial || reduced ? 0 : 1.7, ease: 'power3.inOut' },
      onUpdate: () => controls.update(),
      onComplete: () => {
        controls.enabled = !selected && !clanOpen
        useShrineStore.getState().setAnimating(false)
      },
    })
    tl.to(camera.position, position, 0)
    tl.to(controls.target, { x: tx, y: ty, z: tz }, 0)
    return () => { tl.kill() }
  }, [selected, clanOpen, landmark, revision, entered, aspect, height, controls, camera])
  return null
}
