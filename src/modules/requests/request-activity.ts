import { z } from 'zod'
import { requestStatuses } from './request-contract.ts'

const activityEvents = [
  'REQUEST_REGISTERED',
  'SPECIALIST_ASSIGNED',
  'ANALYSIS_COMPLETED',
  'ANALYSIS_FAILED',
  'REPORT_GENERATED',
  'REPORT_SUBMITTED',
  'REVIEW_STARTED',
  'REPORT_APPROVED',
  'CHANGES_REQUESTED',
  'REPORT_REVISED',
  'REANALYSIS_REQUIRED',
] as const

const metadataSchema = z
  .object({
    comments: z.string().optional(),
    origin: z.enum(['AI', 'MANUAL']).optional(),
    failureMessage: z.string().optional(),
  })
  .strip()

const activitySchema = z
  .object({
    id: z.string().min(1),
    eventType: z.enum(activityEvents),
    previousStatus: z.enum(requestStatuses).nullable(),
    newStatus: z.enum(requestStatuses).nullable(),
    description: z.string().min(1),
    actor: z
      .object({
        displayName: z.string().min(1),
        role: z.enum(['SPECIALIST', 'VALIDATOR', 'ADMINISTRATOR']).nullable(),
      })
      .nullable(),
    technicalAnalysisId: z.string().min(1).nullable(),
    technicalReportId: z.string().min(1).nullable(),
    reportVersion: z.number().int().positive().nullable(),
    metadata: metadataSchema,
    createdAt: z.string().datetime(),
  })
  .strip()

export type RequestActivity = z.infer<typeof activitySchema>

const roleLabels = {
  SPECIALIST: 'Especialista',
  VALIDATOR: 'Validador',
  ADMINISTRATOR: 'Administrador',
} as const

export function parseRequestActivity(data: unknown): RequestActivity[] {
  return z.object({ items: z.array(activitySchema) }).parse(data).items
}

export function activityActorLabel(event: RequestActivity) {
  if (!event.actor) return 'Sistema'
  const role = event.actor.role ? roleLabels[event.actor.role] : null
  return role ? `${event.actor.displayName} · ${role}` : event.actor.displayName
}
