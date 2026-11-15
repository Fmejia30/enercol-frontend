import { CircleUser, ClipboardList, FileSearch, Files, House, Users, type LucideIcon } from 'lucide-react'
import { requestsPath, requestsPermission } from '../modules/requests/request-access.ts'
import type { PermissionRequirement } from '../modules/access/permission-requirement.ts'

export type NavigationItem = {
  label: string
  icon: LucideIcon
  to?: string
  end?: boolean
  section?: string
  requirement?: PermissionRequirement
}

export const navigation: NavigationItem[] = [
  { label: 'Inicio', icon: House, to: '/app', section: 'Principal' },
  {
    label: 'Solicitudes postventa',
    icon: ClipboardList,
    to: requestsPath,
    end: false,
    section: 'Operación',
    requirement: requestsPermission,
  },
  {
    label: 'Análisis técnicos',
    icon: FileSearch,
    to: '/app/analyses',
    end: true,
    section: 'Análisis',
    requirement: { permissions: ['analysis:read'] },
  },
  {
    label: 'Informes técnicos',
    icon: Files,
    to: '/app/reports',
    end: true,
    section: 'Análisis',
    requirement: { permissions: ['reports:read'] },
  },
  {
    label: 'Mi perfil',
    icon: CircleUser,
    to: '/app/profile',
    section: 'Cuenta',
  },
  {
    label: 'Usuarios',
    icon: Users,
    to: '/app/users',
    end: false,
    section: 'Administración',
    requirement: { permissions: ['users:manage'] },
  },
]
