export const permissions = [
  'workspace:access',
  'requests:read_assigned',
  'requests:read_all',
  'telemetry:read',
  'analysis:execute',
  'analysis:read',
  'reports:create',
  'reports:read',
  'reports:validate',
  'reports:reject',
  'reports:return',
  'audit:read',
  'users:manage',
  'configuration:manage',
] as const

export type Permission = (typeof permissions)[number]
