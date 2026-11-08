import { ClipboardList, FileSearch, Files, House, type LucideIcon } from 'lucide-react'
import type { PermissionRequirement } from '../modules/access/permission-requirement.ts'

export type NavigationItem = {
  label: string
  icon: LucideIcon
  to?: string
  requirement?: PermissionRequirement
}

export const navigation: NavigationItem[] = [
  { label: 'Inicio', icon: House, to: '/app' },
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
]
