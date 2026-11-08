import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LogoLockup } from '@/shared/components/brand/logo.tsx'
import { Button } from '@/shared/components/ui/button.tsx'
import { appName } from '@/config/env.ts'

export function NotFoundPage() {
  useEffect(() => {
    document.title = `Ruta no encontrada · ${appName()}`
  }, [])

  return (
    <main className="flex h-full items-center overflow-y-auto bg-background px-6 py-16">
      <div className="mx-auto w-full max-w-md">
        <LogoLockup tone="default" />
        <p className="mt-12 text-sm font-semibold tracking-[0.14em] text-energy uppercase">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance">
          Esta ruta no existe.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          La dirección no corresponde a una pantalla de EnerCol.
        </p>
        <Button asChild className="mt-8 px-5">
          <Link to="/login">Ir al inicio de sesión</Link>
        </Button>
      </div>
    </main>
  )
}
