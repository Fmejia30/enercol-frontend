import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { authorizationFromAuth } from './authorization.ts'
import { permissions, type Permission } from './permissions.ts'

const actor = 'actor-1'
const other = 'author-2'

function authenticated(roles: readonly string[], userId = actor) {
  return authorizationFromAuth({ status: 'authenticated', identity: { userId, roles } })
}

describe('usuario técnico', () => {
  const authorization = authenticated(['SPECIALIST'])

  it('expone el rol y los permisos del especialista', () => {
    assert.equal(authorization.status, 'authenticated')
    assert.deepEqual(authorization.roles, ['SPECIALIST'])
    assert.equal(authorization.hasRole('SPECIALIST'), true)
    assert.equal(authorization.hasRole('VALIDATOR'), false)
    assert.equal(authorization.hasAnyRole(['VALIDATOR', 'ADMINISTRATOR']), false)
    assert.equal(authorization.hasPermission('analysis:execute'), true)
    assert.equal(authorization.hasPermission('reports:create'), true)
    assert.equal(authorization.hasPermission('reports:validate'), false)
    assert.equal(authorization.hasAllPermissions(['workspace:access', 'reports:read']), true)
    assert.equal(authorization.hasAllPermissions(['reports:read', 'reports:validate']), false)
  })
})

describe('usuario validador', () => {
  const authorization = authenticated(['VALIDATOR'])

  it('puede revisar un informe ajeno y no ejecutar análisis', () => {
    assert.equal(authorization.hasPermission('reports:validate'), true)
    assert.equal(authorization.hasPermission('analysis:execute'), false)
    assert.equal(authorization.canActOnReport(other, 'reports:validate'), true)
  })
})

describe('ambos roles', () => {
  const authorization = authenticated(['VALIDATOR', 'SPECIALIST'])

  it('acumula permisos sin incluir los de administrador', () => {
    assert.equal(authorization.hasAnyRole(['SPECIALIST']), true)
    assert.equal(authorization.hasPermission('analysis:execute'), true)
    assert.equal(authorization.hasPermission('reports:validate'), true)
    assert.equal(authorization.hasPermission('requests:read_all'), false)
    assert.equal(authorization.hasPermission('users:manage'), false)
    assert.equal(authorization.hasRole('ADMINISTRATOR'), false)
  })
})

describe('usuario sin roles', () => {
  const authorization = authenticated([])

  it('permanece autenticado y sin permisos funcionales', () => {
    assert.equal(authorization.status, 'authenticated')
    assert.deepEqual(authorization.roles, [])
    assert.deepEqual(authorization.permissions, [])
    assert.equal(authorization.hasRole('SPECIALIST'), false)
    assert.equal(authorization.hasPermission('workspace:access'), false)
    assert.equal(authorization.canActOnReport(other, 'reports:read'), false)
  })
})

describe('administrador reconocido', () => {
  const authorization = authenticated(['ADMINISTRATOR'])

  it('recibe la matriz completa solo cuando la identidad incluye el rol', () => {
    assert.equal(authorization.permissions.length, permissions.length)
    assert.equal(authorization.hasAllPermissions(permissions), true)
    assert.equal(authorization.hasPermission('audit:read'), true)
    assert.equal(authorization.hasPermission('configuration:manage'), true)
  })
})

describe('usuario no autenticado', () => {
  it('niega todas las verificaciones', () => {
    for (const snapshot of [{ status: 'unauthenticated' as const }, { status: 'challenge' as const }]) {
      const authorization = authorizationFromAuth(snapshot)
      assert.equal(authorization.status, 'unauthenticated')
      assert.deepEqual(authorization.roles, [])
      assert.equal(authorization.hasRole('SPECIALIST'), false)
      assert.equal(authorization.hasPermission('workspace:access'), false)
      assert.equal(authorization.hasAllPermissions(['workspace:access']), false)
      assert.equal(authorization.canActOnReport(other, 'reports:read'), false)
    }
  })
})

describe('estado loading', () => {
  const authorization = authorizationFromAuth({ status: 'loading' })

  it('no concede permisos mientras se recupera la identidad', () => {
    assert.equal(authorization.status, 'loading')
    assert.deepEqual(authorization.permissions, [])
    assert.equal(authorization.hasRole('ADMINISTRATOR'), false)
    assert.equal(authorization.hasAnyRole(['SPECIALIST', 'VALIDATOR']), false)
    assert.equal(authorization.hasPermission('workspace:access'), false)
    assert.equal(authorization.hasAllPermissions([]), false)
    assert.equal(authorization.canActOnReport(other, 'reports:validate'), false)
  })
})

describe('permisos inexistentes', () => {
  const authorization = authenticated(['ADMINISTRATOR'])

  it('responde false aunque el usuario tenga la matriz completa', () => {
    const unknown = 'reports:publish' as Permission
    assert.equal(authorization.hasPermission(unknown), false)
    assert.equal(authorization.hasAllPermissions(['reports:read', unknown]), false)
    assert.equal(authorization.canActOnReport(other, unknown), false)
  })
})

describe('autoría propia', () => {
  const authorization = authenticated(['SPECIALIST', 'VALIDATOR', 'ADMINISTRATOR'])

  it('niega validar, rechazar o devolver el informe del propio actor', () => {
    for (const permission of ['reports:validate', 'reports:reject', 'reports:return'] as const) {
      assert.equal(authorization.canActOnReport(actor, permission), false)
      assert.equal(authorization.canActOnReport(other, permission), true)
    }
    assert.equal(authorization.canActOnReport(actor, 'reports:read'), true)
    assert.equal(authorization.canActOnReport('   ', 'reports:validate'), false)
  })
})
