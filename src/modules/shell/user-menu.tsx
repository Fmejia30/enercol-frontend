import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/modules/auth/use-auth.ts'
import { useOwnProfile } from '@/modules/profile/use-own-profile.ts'
import { userIdentity } from '@/modules/profile/profile-completion.ts'
import { toApiError } from '@/shared/lib/api-error.ts'
import { cn } from '@/shared/lib/utils.ts'

export function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { snapshot, logout } = useAuth()
  const { state: profileState } = useOwnProfile()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const user = snapshot.status === 'authenticated' ? snapshot.user : null
  const profile = profileState.status === 'ready' ? profileState.profile : null
  const identity = userIdentity({
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
    roles: profile?.roles ?? user?.roles ?? [],
    loading: profileState.status === 'loading',
  })

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
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

  async function onLogout() {
    if (pending) return
    setLogoutError(null)
    setPending(true)
    try {
      await logout()
      setOpen(false)
      onNavigate?.()
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutError(toApiError(error).message)
    } finally {
      setPending(false)
    }
  }

  if (!user) return null

  return (
    <div ref={panelRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="flex h-10 max-w-52 items-center gap-2 rounded-md px-1.5 focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Cuenta de ${identity.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar initials={identity.initials} />
        <span className="hidden min-w-0 truncate text-sm font-semibold sm:inline">{identity.name}</span>
      </button>
      {open ? (
        <div
          role="menu"
          aria-labelledby={titleId}
          className="absolute right-0 z-30 mt-2 w-64 rounded-md border border-line bg-elevated p-2 shadow-md"
        >
          <div className="px-2 py-2">
            <p id={titleId} className="truncate text-sm font-semibold">
              {identity.name}
            </p>
            {identity.roleLine ? <p className="mt-0.5 truncate text-xs leading-5 text-muted">{identity.roleLine}</p> : null}
          </div>
          <Link
            role="menuitem"
            to="/app/profile"
            onClick={() => {
              setOpen(false)
              onNavigate?.()
            }}
            className="block rounded-md px-2 py-2 text-sm font-semibold text-foreground hover:bg-sunken focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none"
          >
            Mi perfil
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold text-foreground hover:bg-sunken focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none disabled:cursor-not-allowed"
            disabled={pending}
            onClick={() => void onLogout()}
          >
            <LogOut className="size-4" strokeWidth={1.75} aria-hidden="true" />
            {pending ? 'Cerrando sesión' : 'Cerrar sesión'}
          </button>
          {logoutError ? (
            <p className="px-2 py-1 text-sm leading-5 text-destructive" role="alert">
              {logoutError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold tracking-wide text-cloud',
      )}
    >
      {initials}
    </span>
  )
}
