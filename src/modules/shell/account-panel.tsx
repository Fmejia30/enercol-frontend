import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/shared/components/ui/button.tsx'
import { cn } from '@/shared/lib/utils.ts'

type AccountPanelProps = {
  collapsed: boolean
  name: string
  initials: string
  roleLine: string
  busy: boolean
  logoutError: string | null
  onLogout: () => void
  onNavigate?: () => void
}

export function AccountPanel({
  collapsed,
  name,
  initials,
  roleLine,
  busy,
  logoutError,
  onLogout,
  onNavigate,
}: AccountPanelProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    function onPointerDown(event: PointerEvent) {
      if (panelRef.current && event.target instanceof Node && !panelRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  if (collapsed) {
    return (
      <div ref={panelRef} className="relative flex justify-center">
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={`Cuenta de ${name}`}
          onClick={() => setOpen((value) => !value)}
        >
          <Avatar initials={initials} />
        </button>
        {open ? (
          <div
            role="dialog"
            aria-labelledby={titleId}
            className="absolute bottom-0 left-full z-30 ml-3 w-64 rounded-lg border border-line bg-surface p-4 shadow-md"
          >
            <AccountDetails
              titleId={titleId}
              name={name}
              initials={initials}
              roleLine={roleLine}
              busy={busy}
              logoutError={logoutError}
              onLogout={onLogout}
              onNavigate={() => {
                setOpen(false)
                onNavigate?.()
              }}
            />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <AccountDetails
      name={name}
      initials={initials}
      roleLine={roleLine}
      busy={busy}
      logoutError={logoutError}
      onLogout={onLogout}
      onNavigate={onNavigate}
    />
  )
}

function AccountDetails({
  titleId,
  name,
  initials,
  roleLine,
  busy,
  logoutError,
  onLogout,
  onNavigate,
}: Omit<AccountPanelProps, 'collapsed'> & { titleId?: string }) {
  return (
    <div className="grid gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar initials={initials} />
        <div className="min-w-0">
          <p id={titleId} className="truncate text-sm font-semibold">
            {name}
          </p>
          {roleLine ? <p className="truncate text-xs leading-5 text-muted">{roleLine}</p> : null}
        </div>
      </div>
      <Link
        to="/app/profile"
        onClick={onNavigate}
        className="rounded-md px-2 py-1.5 text-sm font-semibold text-energy-text hover:bg-sunken focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none"
      >
        Mi perfil
      </Link>
      <Button type="button" variant="secondary" size="sm" className="w-full" loading={busy} onClick={onLogout}>
        <LogOut className="size-4" strokeWidth={1.75} aria-hidden="true" />
        {busy ? 'Cerrando sesión' : 'Cerrar sesión'}
      </Button>
      {logoutError ? (
        <p className="text-sm leading-5 text-destructive" role="alert">
          {logoutError}
        </p>
      ) : null}
    </div>
  )
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full bg-energy text-xs font-semibold tracking-wide text-on-solid',
      )}
    >
      {initials}
    </span>
  )
}

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
