export const sidebarWidths = {
  expanded: '18rem',
  collapsed: '4.75rem',
} as const

export type SidebarMode = 'drawer' | 'expanded' | 'collapsed'

export function sidebarMode(viewportWidth: number, collapsed: boolean): SidebarMode {
  if (viewportWidth < 1024) return 'drawer'
  return collapsed ? 'collapsed' : 'expanded'
}

export function sidebarShowsLabels(mode: SidebarMode) {
  return mode !== 'collapsed'
}

export function sidebarTooltip(mode: SidebarMode, label: string) {
  return mode === 'collapsed' ? label : null
}

export function navAccessibleName(label: string) {
  return label
}

export function drawerClosesOn(action: 'navigate' | 'escape' | 'outside') {
  return action === 'navigate' || action === 'escape' || action === 'outside'
}

export function mainRegionFollowsSidebar(mode: SidebarMode) {
  return mode === 'expanded' || mode === 'collapsed'
}
