import { navigation, type NavigationItem } from '../../config/navigation.ts'
import type { Authorization } from '../access/authorization.ts'
import { visibleWhenAllowed } from '../access/permission-requirement.ts'
import type { Role } from '../access/roles.ts'

export const roleLabels = {
  SPECIALIST: 'Especialista técnico',
  VALIDATOR: 'Especialista validador',
  ADMINISTRATOR: 'Administrador',
} as const satisfies Record<Role, string>

const areaDescriptions: Record<string, string> = {
  'Solicitudes postventa': 'Casos asignados, su estado y el acceso al detalle.',
  'Análisis técnicos': 'Ejecuciones ya registradas y sus hallazgos.',
  'Informes técnicos': 'Borradores vinculados a un análisis exitoso.',
}

export function greetingForHour(hour: number) {
  if (hour >= 5 && hour < 12) return 'Buenos días'
  if (hour >= 12 && hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function roleLabel(role: Role) {
  return roleLabels[role]
}

export function areaDescription(label: string) {
  return areaDescriptions[label] ?? 'Sección del espacio de trabajo.'
}

export function workspaceAreas(
  authorization: Pick<Authorization, 'status' | 'hasPermission' | 'hasAllPermissions'>,
): NavigationItem[] {
  return visibleWhenAllowed(navigation, authorization).filter(
    (item) => item.to !== undefined && item.to !== '/app' && item.section !== 'Cuenta' && item.section !== 'Administración',
  )
}
