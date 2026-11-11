import { useEffect, useId, useRef, type ReactNode } from 'react'

type UserDialogProps = {
  title: string
  description?: string
  busy?: boolean
  onClose: () => void
  children: ReactNode
}

export function UserDialog({ title, description, busy = false, onClose, children }: UserDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    const previous = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    focusable(panel)[0]?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])

  useEffect(() => {
    const panel = panelRef.current
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (!busy) onClose()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const items = focusable(panel)
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
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [busy, onClose])

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-navy/60"
        aria-label="Cerrar"
        disabled={busy}
        onClick={() => {
          if (!busy) onClose()
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="absolute top-1/2 left-1/2 grid max-h-[min(40rem,calc(100dvh-2rem))] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-lg border border-line bg-surface p-5 shadow-md sm:p-6"
      >
        <div>
          <h2 id={titleId} className="text-xl font-semibold tracking-[-0.02em] text-balance">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  )
}

function focusable(panel: HTMLElement | null) {
  if (!panel) return []
  return [...panel.querySelectorAll<HTMLElement>('input, button, select, textarea, a[href]')].filter(
    (item) => !item.hasAttribute('disabled') && item.getAttribute('aria-disabled') !== 'true',
  )
}
