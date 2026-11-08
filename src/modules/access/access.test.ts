import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { canActOnReport, grantedPermissions, hasPermission, hasRole } from './access.ts'
import { permissions } from './permissions.ts'
import { knownRoles } from './roles.ts'

const actor = 'actor-1'
const other = 'author-2'

describe('SPECIALIST', () => {
  const roles = ['SPECIALIST']

  it('recibe los permisos de técnico y ninguno de validación o administración', () => {
    assert.equal(hasRole(roles, 'SPECIALIST'), true)
    assert.equal(hasRole(roles, 'VALIDATOR'), false)
    assert.equal(hasRole(roles, 'ADMINISTRATOR'), false)
    assert.equal(hasPermission(roles, 'analysis:execute'), true)
    assert.equal(hasPermission(roles, 'reports:create'), true)
    assert.equal(hasPermission(roles, 'reports:validate'), false)
    assert.equal(hasPermission(roles, 'requests:read_all'), false)
    assert.equal(hasPermission(roles, 'users:manage'), false)
  })
})

describe('VALIDATOR', () => {
  const roles = ['VALIDATOR']

  it('puede revisar informes ajenos y no ejecutar análisis', () => {
    assert.equal(hasPermission(roles, 'reports:validate'), true)
    assert.equal(hasPermission(roles, 'reports:reject'), true)
    assert.equal(hasPermission(roles, 'reports:return'), true)
    assert.equal(hasPermission(roles, 'analysis:execute'), false)
    assert.equal(hasPermission(roles, 'reports:create'), false)
    assert.equal(canActOnReport({ roles, actorUserId: actor, authorUserId: other, permission: 'reports:validate' }), true)
  })
})

describe('roles acumulados', () => {
  const roles = ['VALIDATOR', 'SPECIALIST']

  it('une los permisos de técnico y validador', () => {
    const granted = grantedPermissions(roles)
    assert.equal(granted.has('analysis:execute'), true)
    assert.equal(granted.has('reports:create'), true)
    assert.equal(granted.has('reports:validate'), true)
    assert.equal(granted.has('requests:read_all'), false)
    assert.equal(granted.has('audit:read'), false)
    assert.equal(granted.has('users:manage'), false)
  })
})

describe('sin roles', () => {
  it('no concede permisos funcionales', () => {
    assert.equal(hasRole([], 'SPECIALIST'), false)
    assert.equal(grantedPermissions([]).size, 0)
    assert.equal(
      canActOnReport({ roles: [], actorUserId: actor, authorUserId: other, permission: 'workspace:access' }),
      false,
    )
  })
})

describe('ADMINISTRATOR', () => {
  it('no concede permisos administrativos si no está en la identidad', () => {
    const roles = ['SPECIALIST', 'VALIDATOR']
    assert.equal(hasRole(roles, 'ADMINISTRATOR'), false)
    assert.equal(hasPermission(roles, 'audit:read'), false)
    assert.equal(hasPermission(roles, 'users:manage'), false)
    assert.equal(hasPermission(roles, 'configuration:manage'), false)
    assert.equal(hasPermission(roles, 'requests:read_all'), false)
  })

  it('concede todos los permisos cuando la identidad lo incluye', () => {
    const granted = grantedPermissions(['ADMINISTRATOR'])
    assert.equal(granted.size, permissions.length)
    for (const permission of permissions) {
      assert.equal(hasPermission(['ADMINISTRATOR'], permission), true, permission)
    }
  })
})

describe('roles desconocidos', () => {
  it('se ignoran y no invalidan los roles reconocidos', () => {
    assert.deepEqual(knownRoles(['SPECIALIST', 'ADMIN', 'ESPECIALISTA_TECNICO', 1, null]), ['SPECIALIST'])
    assert.deepEqual(knownRoles(['VALIDATOR', 'ADMINISTRATOR', 'OTRO']), ['VALIDATOR', 'ADMINISTRATOR'])
    assert.equal(hasPermission(['ADMIN', 'ESPECIALISTA_VALIDADOR'], 'workspace:access'), false)
    assert.equal(hasPermission(['SPECIALIST', 'DESCONOCIDO'], 'reports:create'), true)
    assert.equal(hasPermission(['SPECIALIST', 'DESCONOCIDO'], 'users:manage'), false)
  })
})

describe('autoría del informe', () => {
  const roles = ['SPECIALIST', 'VALIDATOR', 'ADMINISTRATOR']

  it('niega validar, rechazar o devolver un informe propio', () => {
    for (const permission of ['reports:validate', 'reports:reject', 'reports:return'] as const) {
      assert.equal(
        canActOnReport({ roles, actorUserId: actor, authorUserId: actor, permission }),
        false,
        permission,
      )
    }
  })

  it('permite validar un informe de otro autor y leer el propio', () => {
    assert.equal(
      canActOnReport({
        roles: ['VALIDATOR'],
        actorUserId: actor,
        authorUserId: other,
        permission: 'reports:validate',
      }),
      true,
    )
    assert.equal(
      canActOnReport({
        roles: ['SPECIALIST'],
        actorUserId: actor,
        authorUserId: actor,
        permission: 'reports:read',
      }),
      true,
    )
    assert.equal(
      canActOnReport({
        roles: ['VALIDATOR'],
        actorUserId: actor,
        authorUserId: '   ',
        permission: 'reports:validate',
      }),
      false,
    )
  })
})
