import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { permissionGuardDecision } from '../../app/route-guards.ts'
import { navigation } from '../../config/navigation.ts'
import { authorizationFromAuth } from '../access/authorization.ts'
import { requestsPath, requestsPermission } from './request-access.ts'

function identity(roles: readonly string[]) {
  return authorizationFromAuth({
    status: 'authenticated',
    identity: { userId: 'actor-1', roles },
  })
}

describe('acceso a solicitudes', () => {
  it('abre la ruta a especialista, validador y administrador', () => {
    for (const roles of [['SPECIALIST'], ['VALIDATOR'], ['ADMINISTRATOR']] as const) {
      assert.equal(permissionGuardDecision(identity(roles), requestsPermission, requestsPath).type, 'allow')
    }
  })

  it('niega la ruta a una cuenta sin el permiso y espera mientras carga la sesión', () => {
    assert.equal(permissionGuardDecision(identity([]), requestsPermission, requestsPath).type, 'deny')
    assert.equal(
      permissionGuardDecision(authorizationFromAuth({ status: 'loading' }), requestsPermission, requestsPath).type,
      'pending',
    )
  })

  it('publica la sección en la navegación con el permiso de lectura asignada', () => {
    const item = navigation.find((entry) => entry.label === 'Solicitudes postventa')
    assert.equal(item?.to, requestsPath)
    assert.deepEqual(item?.requirement, requestsPermission)
  })
})
