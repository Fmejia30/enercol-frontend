import { useState, useRef, type ReactNode } from 'react'

export function RailTip({
  label,
  enabled,
  children,
}: {
  label: string
  enabled: boolean
  children: ReactNode
}) {
  const [box, setBox] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  function show() {
    if (!enabled) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    setBox({ top: rect.top + rect.height / 2, left: rect.right + 8 })
  }

  return (
    <div ref={ref} className="min-w-0" onMouseEnter={show} onMouseLeave={() => setBox(null)} onFocus={show} onBlur={() => setBox(null)}>
      {children}
      {enabled && box ? (
        <span
          role="tooltip"
          style={{ top: box.top, left: box.left }}
          className="pointer-events-none fixed z-50 -translate-y-1/2 rounded-md bg-navy px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-cloud shadow-md"
          aria-hidden="true"
        >
          {label}
        </span>
      ) : null}
    </div>
  )
}
