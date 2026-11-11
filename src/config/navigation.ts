import { CircleUser, ClipboardList, FileSearch, Files, House, Users, type LucideIcon } from 'lucide-react'
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
  { label: 'Inicio', icon: House, to: '/app' },
  {
    label: 'Mi perfil',
    icon: CircleUser,
    to: '/app/profile',
    section: 'Cuenta',
  },
  {
    label: 'Solicitudes postventa',
    icon: ClipboardList,
    requirement: { permissions: ['requests:read_assigned'] },
  },
  {
    label: 'Análisis técnicos',
    icon: FileSearch,
    requirement: { permissions: ['analysis:read'] },
  },
  {
    label: 'Informes técnicos',
    icon: Files,
    requirement: { permissions: ['reports:read'] },
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
