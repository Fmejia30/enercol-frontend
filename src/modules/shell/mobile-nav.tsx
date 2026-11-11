import { Menu, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { AppNav } from '@/modules/shell/app-nav.tsx'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const previous = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll<HTMLElement>('a, button')]
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        className="flex size-10 items-center justify-center rounded-md text-foreground focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none lg:hidden"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" strokeWidth={1.75} aria-hidden="true" />
        <span className="sr-only">Abrir navegación</span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/60"
            aria-label="Cerrar navegación"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-3rem))] flex-col overflow-hidden bg-surface shadow-md"
          >
            <h2 id={titleId} className="sr-only">
              Navegación
            </h2>
            <button
              ref={closeRef}
              type="button"
              className="absolute top-4 right-3 flex size-10 items-center justify-center rounded-md text-foreground focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only">Cerrar navegación</span>
            </button>
            <AppNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  )
}
