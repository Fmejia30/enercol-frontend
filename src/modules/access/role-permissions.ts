import { permissions, type Permission } from './permissions.ts'
import type { Role } from './roles.ts'

const specialist = [
  'workspace:access',
  'requests:read_assigned',
  'telemetry:read',
  'analysis:execute',
  'analysis:read',
  'reports:create',
  'reports:read',
] as const satisfies readonly Permission[]

const validator = [
  'workspace:access',
  'requests:read_assigned',
  'telemetry:read',
  'analysis:read',
  'reports:read',
  'reports:validate',
  'reports:reject',
  'reports:return',
] as const satisfies readonly Permission[]

export const rolePermissions = {
  SPECIALIST: specialist,
  VALIDATOR: validator,
  ADMINISTRATOR: permissions,
} as const satisfies Record<Role, readonly Permission[]>
