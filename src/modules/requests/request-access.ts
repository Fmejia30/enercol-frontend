import type { PermissionRequirement } from '../access/permission-requirement.ts'

export const requestsPermission = {
  permissions: ['requests:read_assigned'],
} as const satisfies PermissionRequirement

export const requestsPath = '/app/requests'

export function requestDetailPath(id: string) {
  return `/app/requests/${encodeURIComponent(id)}`
}

export function reportEditorPath(requestId: string, reportId: string) {
  return `/app/requests/${encodeURIComponent(requestId)}/reports/${encodeURIComponent(reportId)}`
}
