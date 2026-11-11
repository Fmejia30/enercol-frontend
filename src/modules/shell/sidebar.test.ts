import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { navigation } from '../../config/navigation.ts'
import {
  drawerClosesOn,
  mainRegionFollowsSidebar,
  navAccessibleName,
  sidebarMode,
  sidebarShowsLabels,
  sidebarTooltip,
  sidebarWidths,
} from './sidebar.ts'

describe('sidebar de escritorio', () => {
  it('muestra etiquetas expandido e iconos con tooltip al contraerse', () => {
    const expanded = sidebarMode(1280, false)
    const collapsed = sidebarMode(1280, true)
    assert.equal(expanded, 'expanded')
    assert.equal(collapsed, 'collapsed')
    assert.equal(sidebarShowsLabels(expanded), true)
    assert.equal(sidebarShowsLabels(collapsed), false)
    assert.equal(sidebarTooltip(expanded, 'Inicio'), null)
    assert.equal(sidebarTooltip(collapsed, 'Inicio'), 'Inicio')
    assert.equal(navAccessibleName('Inicio'), 'Inicio')
    assert.equal(Number.parseFloat(sidebarWidths.collapsed) < Number.parseFloat(sidebarWidths.expanded), true)
    assert.equal(mainRegionFollowsSidebar(expanded), true)
    assert.equal(mainRegionFollowsSidebar(collapsed), true)
  })

  it('conserva las secciones existentes', () => {
    assert.deepEqual(
      navigation.map((item) => item.label),
      ['Inicio', 'Mi perfil', 'Solicitudes postventa', 'Análisis técnicos', 'Informes técnicos', 'Usuarios'],
    )
  })
})

describe('sidebar en móvil', () => {
  it('usa un drawer y se cierra al elegir, pulsar Escape o hacer clic fuera', () => {
    assert.equal(sidebarMode(390, false), 'drawer')
    assert.equal(sidebarMode(390, true), 'drawer')
    assert.equal(sidebarShowsLabels('drawer'), true)
    assert.equal(drawerClosesOn('navigate'), true)
    assert.equal(drawerClosesOn('escape'), true)
    assert.equal(drawerClosesOn('outside'), true)
    assert.equal(mainRegionFollowsSidebar('drawer'), false)
  })
})
