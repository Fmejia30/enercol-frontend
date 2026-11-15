import { useEffect, useState } from 'react'
import { activityActorLabel, type RequestActivity } from '@/modules/requests/request-activity.ts'
import { statusLabel, requestStatusTone } from '@/modules/requests/request-list.ts'
import { listRequestActivity } from '@/modules/requests/requests-api.ts'
import { formatInstant } from '@/shared/lib/date-time.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Badge } from '@/shared/components/ui/badge.tsx'

export function RequestActivitySection({ requestId }: { requestId: string }) {
  const [attempt, setAttempt] = useState(0)
  const [snapshot, setSnapshot] = useState<{
    key: string
    items: RequestActivity[] | null
    error: string | null
  } | null>(null)
  const key = `${requestId}\u0000${attempt}`
  const current = snapshot?.key === key ? snapshot : null

  useEffect(() => {
    const controller = new AbortController()
    listRequestActivity(requestId, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return
        setSnapshot({ key, items, error: null })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setSnapshot({ key, items: null, error: toApiError(cause).message })
      })
    return () => controller.abort()
  }, [requestId, key])

  return (
    <section className="grid gap-3" aria-labelledby="historial-actividad">
      <h2 id="historial-actividad" className="text-sm font-semibold">
        Historial de actividad
      </h2>
      {current === null ? <p className="text-sm text-muted">Cargando el historial</p> : null}
      {current?.error ? (
        <Alert tone="error" title="No fue posible cargar el historial">
          {current.error}
        </Alert>
      ) : null}
      {current?.items && current.items.length === 0 ? (
        <p className="text-sm leading-6 text-muted">Todavía no hay actividad registrada.</p>
      ) : null}
      {current?.items && current.items.length > 0 ? (
        <ol className="grid gap-3">
          {current.items.map((event) => (
            <li key={event.id} className="grid gap-1 border-t border-line pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{event.description}</p>
                {event.newStatus ? <Badge tone={requestStatusTone(event.newStatus)}>{statusLabel(event.newStatus)}</Badge> : null}
              </div>
              <p className="text-sm leading-6 text-muted">
                {activityActorLabel(event)} · {formatInstant(event.createdAt)}
                {event.reportVersion ? ` · Versión ${event.reportVersion}` : ''}
              </p>
              {event.metadata.comments ? (
                <p className="text-sm leading-6 text-foreground">{event.metadata.comments}</p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
      {current?.error ? (
        <button type="button" className="w-fit text-sm font-semibold text-energy-text underline decoration-energy-text/40 underline-offset-4" onClick={() => setAttempt((value) => value + 1)}>
          Reintentar
        </button>
      ) : null}
    </section>
  )
}
