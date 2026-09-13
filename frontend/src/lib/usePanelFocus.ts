import { useEffect, useRef } from 'react'

/** Painéis continuam não modais: a cena e o catálogo permanecem acessíveis. */
export function usePanelFocus(open: boolean, identity: string | null = null) {
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const element = panel.current
    const previous = document.activeElement as HTMLElement | null
    element?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
    return () => {
      if (element?.contains(document.activeElement) && previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [open, identity])
  return panel
}
