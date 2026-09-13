import { useMemo, useRef, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import type { SiblingLore } from '../../lib/api'
import { countTriangles, weaponToStl } from '../../lib/exportStl'
import { assetUrl } from '../../lib/assetUrl'

export default function ExportStlButton({ lore }: { lore: SiblingLore }) {
  const { scene } = useGLTF(assetUrl(`models/${lore.id}.glb`))
  const tris = useMemo(() => countTriangles(scene), [scene])
  const [phase, setPhase] = useState<'idle' | 'exporting' | 'done' | 'error'>('idle')
  const busyRef = useRef(false)

  const start = async () => {
    if (busyRef.current) return
    busyRef.current = true
    setPhase('exporting')
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    try {
      const blob = weaponToStl(scene)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `retsu-${lore.id}.stl`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setPhase('done')
    } catch {
      setPhase('error')
    } finally {
      busyRef.current = false
    }
  }

  return (
    <button
      onClick={start}
      disabled={phase === 'exporting'}
      aria-live="polite"
      title={`${tris.toLocaleString('pt-BR')} triângulos`}
      className="flex-1 cursor-pointer border border-(--accent) bg-(--accent)/15 px-4 py-2.5 text-xs font-semibold tracking-[0.25em] text-stone-100 uppercase transition hover:bg-(--accent)/35"
    >
      {phase === 'exporting' ? 'Preparando STL…' : phase === 'done' ? 'STL exportado ✓' : phase === 'error' ? 'Tentar exportar novamente' : 'Exportar STL'}
    </button>
  )
}
