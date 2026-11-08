import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LogoLockup } from '@/shared/components/brand/logo.tsx'
import { Button } from '@/shared/components/ui/button.tsx'
import { appName } from '@/config/env.ts'

export function ForbiddenPage() {
  useEffect(() => {
    document.title = `Acceso denegado · ${appName()}`
  }, [])

  return (
    <main className="flex h-full items-center overflow-y-auto bg-background px-6 py-16">
      <div className="mx-auto w-full max-w-md">
        <LogoLockup tone="default" />
        <p className="mt-12 text-sm font-semibold tracking-[0.14em] text-energy-text uppercase">403</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance">
          No tiene acceso a esta sección.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Su cuenta no cuenta con permisos suficientes para ver este contenido.
        </p>
        <Button asChild className="mt-8 px-5">
          <Link to="/app">Volver al espacio de trabajo</Link>
        </Button>
      </div>
    </main>
  )
}
