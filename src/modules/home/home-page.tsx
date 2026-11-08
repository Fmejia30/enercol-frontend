import { useEffect, useState } from 'react'
import { appName } from '@/config/env.ts'
import { areaDescription, greetingForHour, roleLabel, workspaceAreas } from '@/modules/home/dashboard-content.ts'
import { useAuthorization } from '@/modules/access/use-authorization.ts'
import { useAuth } from '@/modules/auth/use-auth.ts'
import { Badge } from '@/shared/components/ui/badge.tsx'

function currentGreeting() {
  return greetingForHour(new Date().getHours())
}

export function HomePage() {
  const { snapshot } = useAuth()
  const authorization = useAuthorization()
  const ready = authorization.status === 'authenticated' && snapshot.status === 'authenticated'
  const roles = ready ? authorization.roles : []
  const areas = ready ? workspaceAreas(authorization) : []
  const [greeting] = useState(currentGreeting)

  useEffect(() => {
    document.title = `Inicio · ${appName()}`
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <header className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.16em] text-energy-text uppercase">
            Energy Intelligence & Technical Analysis
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
            {greeting}.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Este es el espacio de trabajo de EnerCol.
          </p>
        </div>
        {ready ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="size-1.5 shrink-0 bg-energy-text" aria-hidden="true" />
            Sesión activa
          </p>
        ) : null}
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-14">
        <section aria-labelledby="perfil-acceso">
          <h2
            id="perfil-acceso"
            className="text-xs font-semibold tracking-[0.14em] text-subtle uppercase"
          >
            Perfil de acceso
          </h2>
          {ready && roles.length > 0 ? (
            <ul className="mt-4 flex flex-col items-start gap-2">
              {roles.map((role) => (
                <li key={role}>
                  <Badge>{roleLabel(role)}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
          {ready && roles.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-muted">
              Su cuenta no tiene roles funcionales asignados.
            </p>
          ) : null}
        </section>

        <section aria-labelledby="areas-previstas">
          <h2
            id="areas-previstas"
            className="text-xs font-semibold tracking-[0.14em] text-subtle uppercase"
          >
            Espacio de trabajo
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Áreas previstas del producto. Aún no están disponibles.
          </p>
          {areas.length > 0 ? (
            <ul className="mt-2 divide-y divide-line border-b border-line">
              {areas.map((area) => {
                const Icon = area.icon
                return (
                  <li key={area.label} className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-4 gap-y-1 py-5">
                    <Icon
                      className="mt-1 size-4 text-energy-text"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 text-base font-semibold">{area.label}</p>
                      <span className="shrink-0 text-xs tracking-wide text-subtle">Próximamente</span>
                    </div>
                    <p className="col-start-2 text-sm leading-6 text-muted">{areaDescription(area.label)}</p>
                  </li>
                )
              })}
            </ul>
          ) : null}
          {ready && areas.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-muted">
              No hay áreas funcionales asignadas a su cuenta.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  )
}
